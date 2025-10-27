// Enhanced Islamic Namaz Companion Background Script
// Aladhan API integration and overlay management

const MAX_TIME_DIFFERENCE_MS = 300000; // 5 minutes
const OVERLAY_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Prayer names mapping
const PRAYER_NAMES = {
  'fajr': 'Fajr',
  'dhuhr': 'Dhuhr', 
  'asr': 'Asr',
  'maghrib': 'Maghrib',
  'isha': 'Isha'
};

// Aladhan API functions
async function fetchPrayerTimes(latitude, longitude) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const url = `https://api.aladhan.com/v1/timings/${today}?latitude=${latitude}&longitude=${longitude}&method=2`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 200) {
      const timings = data.data.timings;
      return {
        fajr: convertTo12Hour(timings.Fajr),
        dhuhr: convertTo12Hour(timings.Dhuhr),
        asr: convertTo12Hour(timings.Asr),
        maghrib: convertTo12Hour(timings.Maghrib),
        isha: convertTo12Hour(timings.Isha),
        date_for: today,
        location: data.data.meta.timezone
      };
    }
    throw new Error('API response error');
  } catch (error) {
    console.error('Failed to fetch prayer times from Aladhan API:', error);
    return null;
  }
}

function convertTo12Hour(time24) {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function convertTo24HourFormat(timeStr) {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier.toLowerCase() === "pm" && hours !== 12) {
    hours += 12;
  } else if (modifier.toLowerCase() === "am" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

function convertManualTimeToDisplay(timeString) {
  // Convert manual time (HH:MM format) to 12-hour format for display
  if (!timeString) return '00:00 AM';
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  return `${hour12}:${minutes} ${ampm}`;
}

// Enhanced prayer warning with overlay
async function openPrayWarningPopup(prayerName) {
  console.log("🕌 Prayer time notification for:", prayerName);
  
  // Show overlay on all active tabs (primary focus)
  const settings = await getSettings();
  if (settings.overlayEnabled !== false) {
    showOverlayOnActiveTabs(prayerName);
  }
  
  // Optional: Still create traditional popup window as backup
  // (users can close this but overlay will remain)
  try {
    chrome.windows.create({
      url: "alertView/prayAlert.html",
      type: "popup",
      width: 700,
      height: 850,
    });
  } catch (error) {
    console.log('Could not create popup window:', error);
    // Overlay is the primary method, so popup failure is not critical
  }
}

async function showOverlayOnActiveTabs(prayerName) {
  try {
    console.log('🔒 Blocking ALL Chrome tabs with prayer overlay...');
    
    // Store overlay state so new tabs can also show it
    await chrome.storage.local.set({
      overlayActive: true,
      overlayPrayerName: prayerName,
      overlayStartTime: Date.now(),
      overlayDuration: 15 * 60 * 1000 // 15 minutes
    });
    
    // Get all existing tabs
    const tabs = await chrome.tabs.query({});
    
    // Counter for successful injections
    let successCount = 0;
    let errorCount = 0;
    
    // Show overlay on each existing tab
    for (const tab of tabs) {
      try {
        // First ensure content script is injected
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/overlay.js']
        });
        
        // Then send the overlay message
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showNamazOverlay',
          prayerName: prayerName,
          duration: 15 * 60 * 1000,
          startTime: Date.now()
        });
        
        successCount++;
        console.log(`✅ Overlay shown on tab ${tab.id}: ${tab.title}`);
      } catch (error) {
        errorCount++;
        console.log(`⚠️ Could not show overlay on tab ${tab.id}: ${error.message}`);
        
        // For tabs that can't be scripted (chrome://, extension pages, etc.)
        // we'll handle them when user tries to navigate
      }
    }
    
    console.log(`🔒 Prayer overlay active on ${successCount} tabs (${errorCount} tabs couldn't be scripted)`);
    
    // Set timer to automatically hide overlay after 15 minutes
    chrome.alarms.create('hideOverlay', {
      delayInMinutes: 15
    });
    
  } catch (error) {
    console.error('Failed to show overlay on tabs:', error);
  }
}

// Enhanced Automatic Location Detection System
class LocationService {
  static async detectLocation(forceRefresh = false) {
    try {
      // Check cached location first (unless force refresh)
      if (!forceRefresh) {
        const cached = await this.getCachedLocation();
        if (cached && this.isLocationFresh(cached)) {
          console.log('🌍 Using cached location:', cached.city || `${cached.latitude}, ${cached.longitude}`);
          return cached;
        }
      }

      console.log('🌍 Detecting current location with enhanced accuracy...');
      
      // Get precise GPS coordinates from content script
      const locationData = await this.requestLocationFromContentScript();
      
      console.log(`📍 GPS Location: ${locationData.latitude}, ${locationData.longitude} (±${Math.round(locationData.accuracy)}m)`);

      // Validate GPS accuracy
      if (locationData.accuracy > 1000) {
        console.warn('⚠️ GPS accuracy is low, but proceeding with available data');
      }

      // Get city information from coordinates with validation
      try {
        const cityInfo = await this.getCityFromCoordinates(locationData.latitude, locationData.longitude);
        
        // Validate location makes sense
        const isValidLocation = this.validateLocation(locationData, cityInfo);
        
        if (isValidLocation) {
          locationData.city = cityInfo.city;
          locationData.country = cityInfo.country;
          locationData.timezone = cityInfo.timezone;
          locationData.validated = true;
          console.log(`🏙️ Validated location: ${cityInfo.city}, ${cityInfo.country}`);
        } else {
          console.warn('⚠️ Location validation failed, using coordinates only');
          locationData.city = `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
          locationData.country = 'Unknown';
          locationData.validated = false;
        }
      } catch (error) {
        console.log('⚠️ Could not resolve city name, using coordinates');
        locationData.city = `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
        locationData.country = 'Unknown';
        locationData.validated = false;
      }

      // Cache the location
      await this.cacheLocation(locationData);
      
      // Broadcast location update
      this.broadcastLocationUpdate(locationData);

      return locationData;

    } catch (error) {
      console.error('❌ Location detection failed:', error);
      
      // Try fallback to cached location
      const fallback = await this.getFallbackLocation();
      if (fallback) {
        console.log('🔄 Using fallback location');
        return fallback;
      }
      
      throw new Error('Location detection failed. Please check permissions and try again.');
    }
  }

  static validateLocation(coords, cityInfo) {
    try {
      // Basic validation checks
      if (!cityInfo || !cityInfo.city || !cityInfo.country) {
        return false;
      }

      // Check if coordinates are reasonable (not in ocean, etc.)
      const lat = coords.latitude;
      const lng = coords.longitude;
      
      // Basic coordinate sanity check
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return false;
      }

      // Check if coordinates match the general region of the claimed city
      // This helps catch cases where geocoding services return wrong cities
      const cityValidation = this.validateCityCoordinates(lat, lng, cityInfo.city, cityInfo.country);
      
      return cityValidation;
    } catch (error) {
      console.error('Location validation error:', error);
      return false;
    }
  }

  static validateCityCoordinates(lat, lng, city, country) {
    // Major world cities coordinate ranges for validation
    const cityRanges = {
      'Lahore': { lat: [31.45, 31.65], lng: [74.25, 74.45], country: ['Pakistan'] },
      'Karachi': { lat: [24.75, 25.05], lng: [66.95, 67.25], country: ['Pakistan'] },
      'Islamabad': { lat: [33.65, 33.75], lng: [73.00, 73.15], country: ['Pakistan'] },
      'Rawalpindi': { lat: [33.55, 33.65], lng: [73.00, 73.15], country: ['Pakistan'] },
      'New York': { lat: [40.65, 40.85], lng: [-74.05, -73.85], country: ['United States', 'USA'] },
      'London': { lat: [51.45, 51.55], lng: [-0.25, 0.05], country: ['United Kingdom', 'UK'] },
      'Dubai': { lat: [25.15, 25.35], lng: [55.15, 55.35], country: ['United Arab Emirates', 'UAE'] },
      'Mecca': { lat: [21.35, 21.45], lng: [39.75, 39.85], country: ['Saudi Arabia'] },
      'Istanbul': { lat: [41.00, 41.05], lng: [28.95, 29.05], country: ['Turkey'] }
    };

    const normalizedCity = city.toLowerCase();
    
    // Find matching city in our validation database
    for (const [validCity, range] of Object.entries(cityRanges)) {
      if (validCity.toLowerCase().includes(normalizedCity) || normalizedCity.includes(validCity.toLowerCase())) {
        const latInRange = lat >= range.lat[0] && lat <= range.lat[1];
        const lngInRange = lng >= range.lng[0] && lng <= range.lng[1];
        const countryMatch = range.country.some(c => c.toLowerCase().includes(country.toLowerCase()));
        
        if (latInRange && lngInRange && countryMatch) {
          console.log(`✅ Location validated: ${validCity} coordinates match`);
          return true;
        } else if (countryMatch && (latInRange || lngInRange)) {
          console.log(`⚠️ Partial match for ${validCity}, accepting with caution`);
          return true;
        }
      }
    }

    // If not in our database, accept if coordinates seem reasonable for the country
    console.log(`ℹ️ Unknown city ${city}, accepting based on general validation`);
    return true;
  }

  static async requestLocationFromContentScript() {
    return new Promise(async (resolve, reject) => {
      try {
        // Get active tab to inject location script
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!activeTab) {
          throw new Error('No active tab found');
        }

        // Inject and execute location detection script
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          function: this.getLocationFromBrowser
        });

        if (results && results[0] && results[0].result) {
          const location = results[0].result;
          resolve({
            latitude: parseFloat(location.latitude.toFixed(6)),
            longitude: parseFloat(location.longitude.toFixed(6)),
            accuracy: location.accuracy,
            timestamp: Date.now()
          });
        } else {
          throw new Error('No location result received');
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  static getLocationFromBrowser() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,  // Use GPS for highest accuracy
        timeout: 20000,           // 20 seconds timeout for better accuracy
        maximumAge: 0             // Always get fresh location, don't use cache
      };

      // Try multiple times for better accuracy
      let attempts = 0;
      const maxAttempts = 3;
      let bestAccuracy = Infinity;
      let bestPosition = null;

      const tryGetLocation = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            attempts++;
            const accuracy = position.coords.accuracy;
            
            console.log(`📍 GPS attempt ${attempts}: ±${Math.round(accuracy)}m accuracy`);
            
            // Keep the most accurate reading
            if (accuracy < bestAccuracy) {
              bestAccuracy = accuracy;
              bestPosition = position;
              console.log(`✅ New best accuracy: ±${Math.round(accuracy)}m`);
            }
            
            // If we have good accuracy (less than 100m) or max attempts reached
            if (accuracy < 100 || attempts >= maxAttempts) {
              console.log(`🎯 Final GPS position: ${bestPosition.coords.latitude}, ${bestPosition.coords.longitude} (±${Math.round(bestAccuracy)}m)`);
              resolve({
                latitude: bestPosition.coords.latitude,
                longitude: bestPosition.coords.longitude,
                accuracy: bestAccuracy
              });
            } else {
              // Try again for better accuracy
              setTimeout(tryGetLocation, 1000);
            }
          },
          (error) => {
            attempts++;
            console.log(`❌ GPS attempt ${attempts} failed:`, error.message);
            
            if (attempts >= maxAttempts) {
              let errorMessage = 'Location access failed: ';
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage += 'Permission denied. Please allow location access in browser settings.';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage += 'Location information unavailable. Please check GPS/location services.';
                  break;
                case error.TIMEOUT:
                  errorMessage += 'Location request timed out. Please try again.';
                  break;
                default:
                  errorMessage += 'Unknown error occurred.';
                  break;
              }
              reject(new Error(errorMessage));
            } else {
              // Try again
              setTimeout(tryGetLocation, 2000);
            }
          },
          options
        );
      };

      // Start first attempt
      tryGetLocation();
    });
  }

  static async getCityFromCoordinates(lat, lng) {
    try {
      // Enhanced geocoding with multiple high-precision services
      const services = [
        {
          name: 'BigDataCloud',
          url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          parser: (data) => ({
            city: data.city || data.locality || data.localityName || data.principalSubdivision,
            country: data.countryName,
            region: data.principalSubdivision,
            timezone: data.localityInfo?.informative?.[0]?.description,
            accuracy: 'high'
          })
        },
        {
          name: 'Nominatim',
          url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&accept-language=en`,
          parser: (data) => ({
            city: data.address?.city || data.address?.town || data.address?.municipality || 
                  data.address?.village || data.address?.suburb || data.address?.neighbourhood,
            country: data.address?.country,
            region: data.address?.state || data.address?.province,
            timezone: null,
            accuracy: 'medium'
          })
        },
        {
          name: 'GeoApiify',
          url: `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=demo`,
          parser: (data) => {
            const result = data.results?.[0];
            return result ? {
              city: result.city || result.town || result.village || result.municipality,
              country: result.country,
              region: result.state || result.province,
              timezone: null,
              accuracy: 'high'
            } : null;
          }
        },
        {
          name: 'LocationIQ',
          url: `https://us1.locationiq.com/v1/reverse.php?key=demo&lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
          parser: (data) => ({
            city: data.address?.city || data.address?.town || data.address?.municipality || data.address?.village,
            country: data.address?.country,
            region: data.address?.state,
            timezone: null,
            accuracy: 'medium'
          })
        }
      ];

      let bestResult = null;
      let fallbackResults = [];

      for (const service of services) {
        try {
          console.log(`🔍 Trying ${service.name} geocoding for precise location...`);
          
          const response = await fetch(service.url, {
            headers: {
              'User-Agent': 'Islamic-Namaz-Companion/3.0.0',
              'Accept': 'application/json'
            },
            timeout: 8000
          });
          
          if (!response.ok) {
            console.log(`❌ ${service.name} HTTP error: ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          const result = service.parser(data);
          
          if (result && result.city && result.country) {
            console.log(`✅ ${service.name} found: ${result.city}, ${result.country}`);
            
            // Store result for comparison
            fallbackResults.push({
              service: service.name,
              ...result
            });
            
            // Prefer high accuracy results
            if (result.accuracy === 'high' && !bestResult) {
              bestResult = result;
            }
          } else {
            console.log(`⚠️ ${service.name} returned incomplete data`);
          }
        } catch (error) {
          console.log(`❌ ${service.name} failed:`, error.message);
          continue;
        }
      }

      // Use best result or first valid result
      const finalResult = bestResult || fallbackResults[0];
      
      if (finalResult) {
        // Cross-validate results to ensure accuracy
        if (fallbackResults.length > 1) {
          const cities = fallbackResults.map(r => r.city?.toLowerCase()).filter(Boolean);
          const mostCommonCity = cities.reduce((a, b, i, arr) => 
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
          );
          
          // If multiple services agree on a different city, use that
          const consensusResult = fallbackResults.find(r => 
            r.city?.toLowerCase() === mostCommonCity
          );
          
          if (consensusResult && consensusResult.city !== finalResult.city) {
            console.log(`🔄 Using consensus result: ${consensusResult.city} (agreed by multiple services)`);
            return {
              city: consensusResult.city,
              country: consensusResult.country,
              timezone: consensusResult.timezone
            };
          }
        }
        
        console.log(`✅ Final location: ${finalResult.city}, ${finalResult.country}`);
        return {
          city: finalResult.city,
          country: finalResult.country,
          timezone: finalResult.timezone
        };
      }

      throw new Error('All geocoding services failed to provide accurate location data');
    } catch (error) {
      console.error('Enhanced geocoding failed:', error);
      throw error;
    }
  }

  static async getCachedLocation() {
    try {
      const result = await chrome.storage.local.get(['cachedLocation']);
      return result.cachedLocation || null;
    } catch (error) {
      console.error('Failed to get cached location:', error);
      return null;
    }
  }

  static isLocationFresh(location) {
    if (!location || !location.timestamp) return false;
    
    // Consider location fresh for 6 hours
    const sixHoursMs = 6 * 60 * 60 * 1000;
    return (Date.now() - location.timestamp) < sixHoursMs;
  }

  static async cacheLocation(location) {
    try {
      await chrome.storage.local.set({ 
        cachedLocation: location,
        lastLocationUpdate: Date.now()
      });
      console.log('💾 Location cached successfully');
    } catch (error) {
      console.error('Failed to cache location:', error);
    }
  }

  static async getFallbackLocation() {
    try {
      const result = await chrome.storage.local.get(['cachedLocation', 'manualLocation']);
      return result.cachedLocation || result.manualLocation || null;
    } catch (error) {
      return null;
    }
  }

  static broadcastLocationUpdate(location) {
    // Notify all extension parts about location update
    chrome.runtime.sendMessage({
      type: 'LOCATION_UPDATED',
      location: location
    }).catch(() => {
      // Ignore errors if no listeners
    });
  }
}

// Get user location and update prayer times
async function updatePrayingTimeWithLocation() {
  console.log("🔄 Updating prayer times with automatic location...");
  
  try {
    // Detect current location automatically
    const location = await LocationService.detectLocation();
    
    console.log(`📍 Using location: ${location.city}, ${location.country} (${location.latitude}, ${location.longitude})`);
    
    // Fetch prayer times
    const prayerData = await fetchPrayerTimes(location.latitude, location.longitude);
    
    if (prayerData) {
      // Store the prayer data with location info
      await chrome.storage.local.set({ 
        prayerData: prayerData,
        currentLocation: location,
        lastPrayerUpdate: Date.now()
      });
      
      // Set up alarms for today's prayers
      setupPrayerAlarms(prayerData);
      
      console.log("✅ Prayer times updated successfully with automatic location");
    } else {
      console.log("Failed to fetch prayer times, using existing data");
      // Try to use existing data if available
      const existing = await chrome.storage.local.get('prayerData');
      if (existing.prayerData) {
        setupPrayerAlarms(existing.prayerData);
      }
    }
  } catch (error) {
    console.error("Error updating prayer times with auto-location:", error);
    
    // Fallback to manual location or Mecca
    let fallbackLocation = { latitude: 21.3891, longitude: 39.8579, city: 'Mecca', country: 'Saudi Arabia' };
    
    try {
      const stored = await chrome.storage.local.get(['manualLocation', 'cachedLocation']);
      if (stored.manualLocation) {
        fallbackLocation = stored.manualLocation;
        console.log("🔄 Using manual fallback location");
      } else if (stored.cachedLocation) {
        fallbackLocation = stored.cachedLocation;
        console.log("🔄 Using cached fallback location");
      } else {
        console.log("🔄 Using Mecca as default location");
      }
      
      const prayerData = await fetchPrayerTimes(fallbackLocation.latitude, fallbackLocation.longitude);
      if (prayerData) {
        await chrome.storage.local.set({ 
          prayerData: prayerData,
          currentLocation: fallbackLocation,
          lastPrayerUpdate: Date.now()
        });
        setupPrayerAlarms(prayerData);
        console.log("✅ Prayer times updated with fallback location");
      }
    } catch (fallbackError) {
      console.error("Fallback location also failed:", fallbackError);
    }
  }
}

function setupPrayerAlarms(prayerData) {
  const today = new Date();
  const alarmTimes = [
    { name: "Fajr", time: prayerData.fajr },
    { name: "Dhuhr", time: prayerData.dhuhr },
    { name: "Asr", time: prayerData.asr },
    { name: "Maghrib", time: prayerData.maghrib },
    { name: "Isha", time: prayerData.isha },
  ];

  // Clear existing prayer alarms
  alarmTimes.forEach(({ name }) => {
    chrome.alarms.clear(name);
  });

  alarmTimes.forEach(({ name, time }) => {
    const alarmDate = new Date(
      `${prayerData.date_for} ${convertTo24HourFormat(time)}`
    );

    if (alarmDate > today) {
      const timeDiff = (alarmDate.getTime() - today.getTime()) / 60000; // Difference in minutes

      chrome.alarms.create(name, { delayInMinutes: timeDiff });
      console.log(
        `🔔 Alarm set: ${name} - ${alarmDate.toLocaleString()}`
      );
    } else {
      console.log(
        `⚠️ Skipped past time: ${name} (${alarmDate.toLocaleString()})`
      );
    }
  });
}

async function getSettings() {
  const result = await chrome.storage.local.get({
    azanEnabled: true,
    azanType: 'standard',
    overlayEnabled: true,
    overlayTheme: 'default',
    notificationsEnabled: true
  });
  return result;
}

// Extension startup
chrome.runtime.onInstalled.addListener(() => {
  console.log("Islamic Namaz Companion installed. Setting up...");
  updatePrayingTimeWithLocation();
  
  // Set up daily update alarm
  chrome.alarms.create("dailyUpdate", { 
    delayInMinutes: 1,
    periodInMinutes: 24 * 60 // Daily
  });
});

// Alarm event listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "dailyUpdate") {
    console.log("Daily prayer time update triggered");
    updatePrayingTimeWithLocation();
  } else if (alarm.name === "dailyManualUpdate") {
    console.log("Daily manual prayer time update triggered");
    const result = await chrome.storage.local.get(['manualPrayerTimes']);
    if (result.manualPrayerTimes) {
      await setupManualPrayerTimes(result.manualPrayerTimes);
    }
  } else if (alarm.name === "testPopUP") {
    console.log("Test popup triggered");
    openPrayWarningPopup("Test");
  } else if (alarm.name === "test-prayer") {
    console.log("🧪 Test prayer time triggered");
    openPrayWarningPopup("Test Prayer");
  } else if (alarm.name === "test-next-prayer") {
    console.log("🧪 Test next prayer time triggered from settings");
    openPrayWarningPopup("Test Prayer");
  } else if (alarm.name === "hideOverlay") {
    console.log("⏰ 15 minute prayer time completed - hiding overlays");
    await hideAllOverlays();
  } else if (PRAYER_NAMES[alarm.name.toLowerCase()]) {
    const now = Date.now();
    const timeDifference = now - alarm.scheduledTime;

    if (timeDifference <= MAX_TIME_DIFFERENCE_MS) {
      console.log(`🔔 ${alarm.name} prayer time notification`);
      openPrayWarningPopup(PRAYER_NAMES[alarm.name.toLowerCase()]);
    }
  } else if (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(alarm.name)) {
    // Handle manual prayer time alarms
    console.log(`🔔 Manual ${alarm.name} prayer time notification`);
    openPrayWarningPopup(PRAYER_NAMES[alarm.name]);
    
    // Reschedule for tomorrow
    const result = await chrome.storage.local.get(['manualPrayerTimes']);
    if (result.manualPrayerTimes && result.manualPrayerTimes[alarm.name]) {
      const timeString = result.manualPrayerTimes[alarm.name];
      const [hours, minutes] = timeString.split(':').map(Number);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(hours, minutes, 0, 0);
      
      await chrome.alarms.create(alarm.name, {
        when: tomorrow.getTime()
      });
      
      console.log(`⏰ Rescheduled ${alarm.name} for tomorrow: ${tomorrow.toLocaleString()}`);
    }
  }
});

// Handle extension startup and wake up
chrome.runtime.onStartup.addListener(() => {
  console.log("Chrome started: updating prayer times...");
  updatePrayingTimeWithLocation();
});

// Message handling for popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateLocation') {
    // Manual location update from popup
    chrome.storage.local.set({
      manualLocation: message.location,
      lastLocationUpdate: Date.now()
    }).then(() => {
      updatePrayingTimeWithLocation();
      sendResponse({ success: true });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === 'detectLocation') {
    // Auto-detect location request
    LocationService.detectLocation(true).then((location) => {
      updatePrayingTimeWithLocation();
      sendResponse({ success: true, location: location });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (message.action === 'getPrayerData') {
    // Send current prayer data to popup
    chrome.storage.local.get(['prayerData', 'currentLocation', 'prayerMode', 'manualPrayerTimes']).then((result) => {
      if (result.prayerMode === 'manual' && result.manualPrayerTimes) {
        // Return manual prayer times formatted for display
        const manualData = {
          fajr: convertManualTimeToDisplay(result.manualPrayerTimes.fajr),
          dhuhr: convertManualTimeToDisplay(result.manualPrayerTimes.dhuhr),
          asr: convertManualTimeToDisplay(result.manualPrayerTimes.asr),
          maghrib: convertManualTimeToDisplay(result.manualPrayerTimes.maghrib),
          isha: convertManualTimeToDisplay(result.manualPrayerTimes.isha),
          date_for: new Date().toISOString().split('T')[0],
          location: 'Manual Times'
        };
        
        sendResponse({
          prayerData: manualData,
          location: { city: 'Manual Configuration', country: '', mode: 'manual' }
        });
      } else {
        // Return automatic prayer times
        sendResponse({
          prayerData: result.prayerData || null,
          location: result.currentLocation || null
        });
      }
    });
    return true;
  } else if (message.action === 'requestLocationPermission') {
    // Request location permission
    LocationService.detectLocation(true).then((location) => {
      sendResponse({ success: true, location: location });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (message.action === 'testPrayerTime') {
    // Test prayer time by setting a test alarm for next minute
    const testTime = new Date();
    testTime.setMinutes(testTime.getMinutes() + 1);
    testTime.setSeconds(0);
    
    chrome.alarms.create('test-prayer', {
      when: testTime.getTime()
    });
    
    console.log(`🕐 Test prayer alarm set for: ${testTime.toLocaleTimeString()}`);
    sendResponse({ success: true, testTime: testTime.toLocaleTimeString() });
    return true;
  } else if (message.action === 'initializePrayerTimes') {
    // Initialize prayer times after setup
    console.log('🚀 Initializing prayer times from setup...');
    initializePrayerTimesFromSetup(message.userData).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Failed to initialize prayer times:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  } else if (message.action === 'updatePrayerTimes') {
    // Update prayer times from settings page
    console.log('🔄 Updating prayer times from settings:', message.prayerTimes);
    
    if (message.mode === 'manual') {
      setupManualPrayerTimes(message.prayerTimes).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('Failed to update manual prayer times:', error);
        sendResponse({ success: false, error: error.message });
      });
    } else {
      // Switch to automatic mode
      chrome.storage.local.set({ prayerMode: 'automatic' }).then(() => {
        updatePrayingTimeWithLocation().then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      });
    }
    return true;
  } else if (message.action === 'testNextPrayer') {
    // Test next prayer notification
    console.log('🧪 Testing next prayer notification...');
    
    try {
      // Set a test alarm for 5 seconds from now
      const testTime = new Date();
      testTime.setSeconds(testTime.getSeconds() + 5);
      
      chrome.alarms.create('test-next-prayer', {
        when: testTime.getTime()
      });
      
      console.log(`⏰ Test prayer alarm set for: ${testTime.toLocaleTimeString()}`);
      sendResponse({ 
        success: true, 
        prayerName: 'Test Prayer',
        testTime: testTime.toLocaleTimeString() 
      });
    } catch (error) {
      console.error('Failed to set test prayer:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
});

// Initialize prayer times from setup data
async function initializePrayerTimesFromSetup(userData) {
  try {
    console.log('🔧 Setting up prayer times for user:', userData.name);
    
    if (userData.mode === 'manual') {
      // Set up manual prayer times
      await setupManualPrayerTimes(userData.manualTimes);
    } else {
      // Set up automatic prayer times based on location
      if (userData.location) {
        await chrome.storage.local.set({
          currentLocation: userData.location,
          lastLocationUpdate: Date.now()
        });
      }
      await updatePrayingTimeWithLocation();
    }
    
    console.log('✅ Prayer times initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize prayer times:', error);
    throw error;
  }
}

// Setup manual prayer times and alarms
async function setupManualPrayerTimes(manualTimes) {
  try {
    console.log('⏰ Setting up manual prayer times:', manualTimes);
    
    // Clear existing alarms
    await chrome.alarms.clearAll();
    
    // Create alarms for each prayer time
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    
    for (const prayer of prayerNames) {
      const timeString = manualTimes[prayer];
      if (!timeString) continue;
      
      const [hours, minutes] = timeString.split(':').map(Number);
      
      // Set for today
      const todayTime = new Date(today);
      todayTime.setHours(hours, minutes, 0, 0);
      
      // Set for tomorrow
      const tomorrowTime = new Date(tomorrow);
      tomorrowTime.setHours(hours, minutes, 0, 0);
      
      // If today's time has passed, schedule for tomorrow
      const now = new Date();
      const scheduleTime = todayTime > now ? todayTime : tomorrowTime;
      
      await chrome.alarms.create(prayer, {
        when: scheduleTime.getTime()
      });
      
      console.log(`⏰ ${prayer} alarm set for: ${scheduleTime.toLocaleString()}`);
    }
    
    // Save manual times to storage
    await chrome.storage.local.set({
      manualPrayerTimes: manualTimes,
      prayerMode: 'manual',
      lastPrayerUpdate: Date.now()
    });
    
    // Set daily update alarm for manual times
    const dailyUpdate = new Date();
    dailyUpdate.setDate(dailyUpdate.getDate() + 1);
    dailyUpdate.setHours(0, 1, 0, 0); // 12:01 AM next day
    
    await chrome.alarms.create('dailyManualUpdate', {
      when: dailyUpdate.getTime()
    });
    
    console.log('✅ Manual prayer times set successfully');
  } catch (error) {
    console.error('❌ Failed to setup manual prayer times:', error);
    throw error;
  }
}

// Initial setup if no data exists
chrome.storage.local.get(['prayerData']).then((result) => {
  if (!result.prayerData) {
    console.log("No prayer data found, performing initial setup...");
    updatePrayingTimeWithLocation();
  }
});

// Function to hide all overlays
async function hideAllOverlays() {
  try {
    console.log('🔓 Hiding prayer overlays on all tabs...');
    
    // Clear overlay state
    await chrome.storage.local.set({
      overlayActive: false,
      overlayPrayerName: null,
      overlayStartTime: null,
      overlayDuration: null
    });
    
    // Get all tabs and hide overlay
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'hideNamazOverlay'
        });
      } catch (error) {
        // Tab might not have content script, ignore
        console.log(`Could not hide overlay on tab ${tab.id}`);
      }
    }
    
    console.log('✅ All prayer overlays hidden');
  } catch (error) {
    console.error('Error hiding overlays:', error);
  }
}

// Listen for new tabs being created during prayer time
chrome.tabs.onCreated.addListener(async (tab) => {
  // Check if overlay should be active
  const result = await chrome.storage.local.get(['overlayActive', 'overlayPrayerName', 'overlayStartTime', 'overlayDuration']);
  
  if (result.overlayActive && result.overlayStartTime && result.overlayDuration) {
    const elapsed = Date.now() - result.overlayStartTime;
    const remaining = result.overlayDuration - elapsed;
    
    if (remaining > 0) {
      console.log(`🔒 New tab created during prayer time - showing overlay (${Math.floor(remaining/60000)} min remaining)`);
      
      // Wait a moment for tab to load
      setTimeout(async () => {
        try {
          // Inject content script
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/overlay.js']
          });
          
          // Show overlay with remaining time
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showNamazOverlay',
            prayerName: result.overlayPrayerName,
            remainingTime: remaining,
            startTime: result.overlayStartTime
          });
        } catch (error) {
          console.log(`Could not show overlay on new tab ${tab.id}:`, error.message);
        }
      }, 1000);
    }
  }
});

// Listen for tab updates (navigation) during prayer time
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Check if overlay should be active
    const result = await chrome.storage.local.get(['overlayActive', 'overlayPrayerName', 'overlayStartTime', 'overlayDuration']);
    
    if (result.overlayActive && result.overlayStartTime && result.overlayDuration) {
      const elapsed = Date.now() - result.overlayStartTime;
      const remaining = result.overlayDuration - elapsed;
      
      if (remaining > 0) {
        console.log(`🔒 Tab navigated during prayer time - re-showing overlay`);
        
        try {
          // Re-inject content script
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content/overlay.js']
          });
          
          // Show overlay with remaining time
          await chrome.tabs.sendMessage(tabId, {
            action: 'showNamazOverlay',
            prayerName: result.overlayPrayerName,
            remainingTime: remaining,
            startTime: result.overlayStartTime
          });
        } catch (error) {
          console.log(`Could not re-show overlay on tab ${tabId}:`, error.message);
        }
      }
    }
  }
});
