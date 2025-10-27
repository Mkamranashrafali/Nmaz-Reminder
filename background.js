// ====================================
// Islamic Namaz Companion - Background Service Worker v4.0.0
// Complete Prayer Management System with Enhanced API Handling
// ====================================

class IslamicNamazCompanion {
    constructor() {
        this.version = '4.0.0';
        this.staticPrayerData = null;
        this.fallbackData = null;
        this.currentLocation = null;
        this.lastUpdateTime = null;
        this.apiAttempts = 0;
        this.maxApiAttempts = 3;
        this.init();
    }

    async init() {
        console.log(`🕌 Islamic Namaz Companion v${this.version} - Starting Background Service`);
        
        // Load static fallback data
        await this.loadStaticData();
        
        // Initialize default settings if not present
        await this.initializeDefaultSettings();
        
        // Set up alarm listeners
        this.setupAlarmListeners();
        
        // Set up message listeners for cross-tab communication
        this.setupMessageListeners();
        
        // Set up tab listeners for prayer overlay enforcement
        this.setupTabListeners();
        
        // Check if setup is needed
        const setupComplete = await this.getStorageData('setupComplete');
        if (setupComplete) {
            await this.initializePrayerSystem();
        }
        
        // Set up periodic refresh
        this.setupPeriodicRefresh();
        
        console.log('✅ Background service initialized successfully');
    }

    async initializeDefaultSettings() {
        try {
            // Set default notification settings if not present
            const notificationSettings = await this.getStorageData('notificationSettings');
            if (!notificationSettings) {
                const defaultSettings = {
                    enabled: true,
                    playAzan: true,
                    azanVolume: 70,
                    preReminders: true,
                    preReminderTime: 15
                };
                await this.setStorageData('notificationSettings', defaultSettings);
                console.log('🔧 Default notification settings initialized');
            }
            
            // Set default selected Azan if not present
            const selectedAzan = await this.getStorageData('selectedAzan');
            if (!selectedAzan) {
                await this.setStorageData('selectedAzan', 'default_adhan');
                console.log('🎵 Default Azan selection initialized');
            }
            
            // Set default overlay settings if not present
            const overlaySettings = await this.getStorageData('overlaySettings');
            if (!overlaySettings) {
                const defaultOverlay = {
                    enabled: true,
                    duration: 900000, // 15 minutes
                    theme: 'default',
                    textSpeed: 30000
                };
                await this.setStorageData('overlaySettings', defaultOverlay);
                console.log('🖥️ Default overlay settings initialized');
            }
            
        } catch (error) {
            console.error('❌ Error initializing default settings:', error);
        }
    }

    // ====================================
    // Static Data Management
    // ====================================
    
    async loadStaticData() {
        try {
            // Load prayer calculation static data (used as ultimate fallback)
            this.staticPrayerData = {
                "fajr": { "sunrise_offset": -105, "angle": 18 },
                "dhuhr": { "solar_noon": 0, "offset": 0 },
                "asr": { "hanafi": "shadow_length_factor_2", "standard": "shadow_length_factor_1" },
                "maghrib": { "sunset_offset": 0, "angle": -0.8333 },
                "isha": { "angle": 17 }
            };
            
            // Load fallback city data for major Islamic cities
            this.fallbackData = {
                "major_cities": {
                    "Mecca": { "lat": 21.4225, "lng": 39.8262, "timezone": "Asia/Riyadh" },
                    "Medina": { "lat": 24.4681, "lng": 39.6142, "timezone": "Asia/Riyadh" },
                    "Istanbul": { "lat": 41.0082, "lng": 28.9784, "timezone": "Europe/Istanbul" },
                    "Cairo": { "lat": 30.0444, "lng": 31.2357, "timezone": "Africa/Cairo" },
                    "Karachi": { "lat": 24.8607, "lng": 67.0011, "timezone": "Asia/Karachi" },
                    "Jakarta": { "lat": -6.2088, "lng": 106.8456, "timezone": "Asia/Jakarta" },
                    "London": { "lat": 51.5074, "lng": -0.1278, "timezone": "Europe/London" },
                    "New York": { "lat": 40.7128, "lng": -74.0060, "timezone": "America/New_York" }
                }
            };
            
            console.log('📊 Static prayer data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading static data:', error);
        }
    }

    // ====================================
    // Enhanced API System with Multiple Providers
    // ====================================
    
    async fetchPrayerTimes(latitude, longitude, date = null) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const cacheKey = `prayer_times_${latitude}_${longitude}_${targetDate}`;
        
        // Check cache first (24-hour validity)
        const cachedData = await this.getStorageData(cacheKey);
        if (cachedData && this.isCacheValid(cachedData.timestamp, 24)) {
            console.log('📦 Using cached prayer times');
            return cachedData.data;
        }
        
        // Try primary API (Aladhan)
        try {
            const aladhanData = await this.fetchFromAladhanAPI(latitude, longitude, targetDate);
            if (aladhanData) {
                await this.setStorageData(cacheKey, {
                    data: aladhanData,
                    timestamp: Date.now(),
                    source: 'aladhan'
                });
                return aladhanData;
            }
        } catch (error) {
            console.warn('⚠️ Aladhan API failed:', error);
        }
        
        // Try secondary API (Islamic Network)
        try {
            const islamicNetworkData = await this.fetchFromIslamicNetworkAPI(latitude, longitude, targetDate);
            if (islamicNetworkData) {
                await this.setStorageData(cacheKey, {
                    data: islamicNetworkData,
                    timestamp: Date.now(),
                    source: 'islamic_network'
                });
                return islamicNetworkData;
            }
        } catch (error) {
            console.warn('⚠️ Islamic Network API failed:', error);
        }
        
        // Use calculation fallback
        console.log('🔄 Using calculation fallback');
        const calculatedData = this.calculatePrayerTimes(latitude, longitude, targetDate);
        await this.setStorageData(cacheKey, {
            data: calculatedData,
            timestamp: Date.now(),
            source: 'calculated'
        });
        return calculatedData;
    }
    
    async fetchFromAladhanAPI(latitude, longitude, date) {
        const method = await this.getStorageData('calculationMethod') || 2; // ISNA by default
        const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=${method}&tune=0,0,0,0,0,0,0,0,0`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Islamic-Namaz-Companion/4.0.0'
            }
        });
        
        if (!response.ok) throw new Error(`Aladhan API error: ${response.status}`);
        
        const data = await response.json();
        if (data.code !== 200) throw new Error(`Aladhan API code: ${data.code}`);
        
        return this.formatAladhanResponse(data.data);
    }
    
    async fetchFromIslamicNetworkAPI(latitude, longitude, date) {
        const method = await this.getStorageData('calculationMethod') || 2;
        const url = `https://api.pray.zone/v2/times/day.json?latitude=${latitude}&longitude=${longitude}&date=${date}&calculation=${method}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Islamic-Namaz-Companion/4.0.0'
            }
        });
        
        if (!response.ok) throw new Error(`Islamic Network API error: ${response.status}`);
        
        const data = await response.json();
        return this.formatIslamicNetworkResponse(data);
    }
    
    formatAladhanResponse(data) {
        return {
            fajr: data.timings.Fajr,
            dhuhr: data.timings.Dhuhr,
            asr: data.timings.Asr,
            maghrib: data.timings.Maghrib,
            isha: data.timings.Isha,
            sunrise: data.timings.Sunrise,
            sunset: data.timings.Sunset,
            date: data.date.gregorian.date,
            hijri: data.date.hijri.date,
            location: data.meta.latitude + ', ' + data.meta.longitude
        };
    }
    
    formatIslamicNetworkResponse(data) {
        return {
            fajr: data.results.datetime[0].times.Fajr,
            dhuhr: data.results.datetime[0].times.Dhuhr,
            asr: data.results.datetime[0].times.Asr,
            maghrib: data.results.datetime[0].times.Maghrib,
            isha: data.results.datetime[0].times.Isha,
            sunrise: data.results.datetime[0].times.Sunrise,
            sunset: data.results.datetime[0].times.Sunset,
            date: data.results.datetime[0].date.gregorian,
            location: data.results.location.latitude + ', ' + data.results.location.longitude
        };
    }

    // ====================================
    // Enhanced Location Detection
    // ====================================
    
    async detectLocation() {
        const cacheKey = 'user_location';
        const cachedLocation = await this.getStorageData(cacheKey);
        
        // Use cached location if valid (6 hours)
        if (cachedLocation && this.isCacheValid(cachedLocation.timestamp, 6)) {
            console.log('📍 Using cached location');
            return cachedLocation.data;
        }
        
        // Try BigDataCloud first
        try {
            const bigDataLocation = await this.fetchFromBigDataCloud();
            if (bigDataLocation) {
                await this.setStorageData(cacheKey, {
                    data: bigDataLocation,
                    timestamp: Date.now(),
                    source: 'bigdatacloud'
                });
                return bigDataLocation;
            }
        } catch (error) {
            console.warn('⚠️ BigDataCloud failed:', error);
        }
        
        // Try Nominatim as backup
        try {
            const nominatimLocation = await this.fetchFromNominatim();
            if (nominatimLocation) {
                await this.setStorageData(cacheKey, {
                    data: nominatimLocation,
                    timestamp: Date.now(),
                    source: 'nominatim'
                });
                return nominatimLocation;
            }
        } catch (error) {
            console.warn('⚠️ Nominatim failed:', error);
        }
        
        // Try simple IP location as backup
        try {
            const ipLocation = await this.fetchSimpleIPLocation();
            if (ipLocation) {
                await this.setStorageData(cacheKey, {
                    data: ipLocation,
                    timestamp: Date.now(),
                    source: 'ip'
                });
                return ipLocation;
            }
        } catch (error) {
            console.warn('⚠️ IP location failed:', error);
        }
        
        // Use browser geolocation as last resort
        try {
            const browserLocation = await this.getBrowserLocation();
            if (browserLocation) {
                const enrichedLocation = await this.enrichLocationData(browserLocation);
                await this.setStorageData(cacheKey, {
                    data: enrichedLocation,
                    timestamp: Date.now(),
                    source: 'browser'
                });
                return enrichedLocation;
            }
        } catch (error) {
            console.warn('⚠️ Browser geolocation failed:', error);
        }
        
        // Return default location (Mecca) if all fails
        console.log('🕋 Using default location (Mecca)');
        return {
            lat: 21.4225,
            lng: 39.8262,
            city: 'Mecca',
            country: 'Saudi Arabia',
            timezone: 'Asia/Riyadh',
            accuracy: 'default'
        };
    }
    
    async fetchFromBigDataCloud() {
        const response = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Islamic-Namaz-Companion/4.0.0'
            }
        });
        
        if (!response.ok) throw new Error(`BigDataCloud error: ${response.status}`);
        
        const data = await response.json();
        console.log('📍 BigDataCloud response:', data);
        
        return {
            lat: data.latitude || data.location?.latitude,
            lng: data.longitude || data.location?.longitude,
            city: data.city || data.locality || data.localityLanguageRequested || 'Unknown City',
            country: data.countryName || data.country || 'Unknown Country',
            timezone: data.localityInfo?.informative?.[0]?.name || 
                     data.timeZone?.name || 
                     Intl.DateTimeFormat().resolvedOptions().timeZone || 
                     'UTC',
            accuracy: data.confidence || 'medium'
        };
    }
    
    async fetchFromNominatim() {
        try {
            // First get IP-based location
            const ipResponse = await fetch('https://ipapi.co/json/', {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!ipResponse.ok) throw new Error(`IP API error: ${ipResponse.status}`);
            const ipData = await ipResponse.json();
            console.log('📍 IP API response:', ipData);
            
            if (!ipData.latitude || !ipData.longitude) {
                throw new Error('No coordinates from IP API');
            }
            
            // Then enrich with Nominatim
            const nominatimResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${ipData.latitude}&lon=${ipData.longitude}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Islamic-Namaz-Companion/4.0.0'
                    }
                }
            );
            
            if (!nominatimResponse.ok) {
                // Fall back to IP data only
                return {
                    lat: parseFloat(ipData.latitude),
                    lng: parseFloat(ipData.longitude),
                    city: ipData.city || ipData.region || 'Unknown City',
                    country: ipData.country_name || ipData.country || 'Unknown Country',
                    timezone: ipData.timezone || 'UTC',
                    accuracy: 'ip-based'
                };
            }
            
            const nominatimData = await nominatimResponse.json();
            console.log('📍 Nominatim response:', nominatimData);
            
            return {
                lat: parseFloat(nominatimData.lat || ipData.latitude),
                lng: parseFloat(nominatimData.lon || ipData.longitude),
                city: nominatimData.address?.city || 
                      nominatimData.address?.town || 
                      nominatimData.address?.village ||
                      ipData.city || 
                      'Unknown City',
                country: nominatimData.address?.country || 
                         ipData.country_name || 
                         'Unknown Country',
                timezone: ipData.timezone || 'UTC',
                accuracy: 'nominatim'
            };
        } catch (error) {
            console.error('❌ Nominatim fetch failed:', error);
            throw error;
        }
    }
    
    async fetchSimpleIPLocation() {
        try {
            console.log('📍 Trying simple IP location...');
            const response = await fetch('https://ipapi.co/json/', {
                headers: { 
                    'Accept': 'application/json',
                    'User-Agent': 'Islamic-Namaz-Companion/4.0.0'
                }
            });
            
            if (!response.ok) throw new Error(`IP API error: ${response.status}`);
            const data = await response.json();
            console.log('📍 Simple IP response:', data);
            
            if (!data.latitude || !data.longitude) {
                throw new Error('No coordinates from simple IP API');
            }
            
            return {
                lat: parseFloat(data.latitude),
                lng: parseFloat(data.longitude),
                city: data.city || data.region || 'Unknown City',
                country: data.country_name || data.country || 'Unknown Country',
                timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                accuracy: 'ip-location'
            };
        } catch (error) {
            console.error('❌ Simple IP location failed:', error);
            throw error;
        }
    }
    
    async getBrowserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                error => reject(error),
                { timeout: 10000, enableHighAccuracy: true }
            );
        });
    }

    // ====================================
    // Prayer Time Calculations (Fallback)
    // ====================================
    
    calculatePrayerTimes(latitude, longitude, date) {
        const dateObj = new Date(date);
        const julianDay = this.getJulianDay(dateObj);
        const declinationAngle = this.getSolarDeclination(julianDay);
        const equationOfTime = this.getEquationOfTime(julianDay);
        
        const times = {};
        
        // Calculate solar noon
        const solarNoon = 12 - (longitude / 15) + (equationOfTime / 60);
        times.dhuhr = this.formatTime(solarNoon);
        
        // Calculate sunrise and sunset
        const hourAngle = this.getHourAngle(latitude, declinationAngle, -0.8333);
        const sunrise = solarNoon - (hourAngle / 15);
        const sunset = solarNoon + (hourAngle / 15);
        
        times.sunrise = this.formatTime(sunrise);
        times.sunset = this.formatTime(sunset);
        times.maghrib = times.sunset;
        
        // Calculate Fajr (18 degrees below horizon)
        const fajrAngle = this.getHourAngle(latitude, declinationAngle, -18);
        times.fajr = this.formatTime(sunrise - (fajrAngle / 15));
        
        // Calculate Isha (17 degrees below horizon)
        const ishaAngle = this.getHourAngle(latitude, declinationAngle, -17);
        times.isha = this.formatTime(sunset + (ishaAngle / 15));
        
        // Calculate Asr (shadow length factor)
        const asrAngle = this.getAsrHourAngle(latitude, declinationAngle);
        times.asr = this.formatTime(solarNoon + (asrAngle / 15));
        
        return {
            ...times,
            date: date,
            location: `${latitude}, ${longitude}`,
            source: 'calculated'
        };
    }
    
    getJulianDay(date) {
        const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
        const y = date.getFullYear() - a;
        const m = (date.getMonth() + 1) + 12 * a - 3;
        return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    }
    
    getSolarDeclination(julianDay) {
        const n = julianDay - 2451545.0;
        const L = (280.460 + 0.9856474 * n) % 360;
        const g = Math.PI / 180 * ((357.528 + 0.9856003 * n) % 360);
        const lambda = Math.PI / 180 * (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
        return Math.asin(Math.sin(23.439 * Math.PI / 180) * Math.sin(lambda));
    }
    
    getEquationOfTime(julianDay) {
        const n = julianDay - 2451545.0;
        const L = (280.460 + 0.9856474 * n) % 360;
        const g = Math.PI / 180 * ((357.528 + 0.9856003 * n) % 360);
        const lambda = Math.PI / 180 * (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
        const alpha = Math.atan2(Math.cos(23.439 * Math.PI / 180) * Math.sin(lambda), Math.cos(lambda));
        return 4 * (L * Math.PI / 180 - alpha) * 180 / Math.PI;
    }
    
    getHourAngle(latitude, declination, angle) {
        const latRad = latitude * Math.PI / 180;
        const angleRad = angle * Math.PI / 180;
        const cosH = (Math.sin(angleRad) - Math.sin(latRad) * Math.sin(declination)) / (Math.cos(latRad) * Math.cos(declination));
        return Math.acos(Math.max(-1, Math.min(1, cosH))) * 180 / Math.PI;
    }
    
    getAsrHourAngle(latitude, declination) {
        const latRad = latitude * Math.PI / 180;
        const shadowFactor = 1; // Standard calculation
        const tanE = Math.tan(Math.abs(latitude - declination) * Math.PI / 180);
        const angle = Math.atan((shadowFactor + tanE) / (1 + shadowFactor * tanE));
        const cosH = (Math.sin(angle) - Math.sin(latRad) * Math.sin(declination)) / (Math.cos(latRad) * Math.cos(declination));
        return Math.acos(Math.max(-1, Math.min(1, cosH))) * 180 / Math.PI;
    }
    
    formatTime(decimalHours) {
        const hours = Math.floor(decimalHours);
        const minutes = Math.floor((decimalHours - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // ====================================
    // Smart Notification System
    // ====================================
    
    async createPrePrayerNotification(prayerName, timeUntil) {
        const settings = await this.getStorageData('notificationSettings') || {};
        if (!settings.enabled) return;
        
        const userName = await this.getStorageData('userName') || 'Muslim';
        const isRemindersEnabled = settings.preReminders !== false;
        
        if (!isRemindersEnabled) return;
        
        const messages = {
            fajr: `🌅 ${userName}, Fajr prayer is in ${timeUntil} minutes. Prepare for the dawn prayer.`,
            dhuhr: `☀️ ${userName}, Dhuhr prayer is in ${timeUntil} minutes. Time for the midday prayer.`,
            asr: `🌤️ ${userName}, Asr prayer is in ${timeUntil} minutes. The afternoon prayer awaits.`,
            maghrib: `🌇 ${userName}, Maghrib prayer is in ${timeUntil} minutes. Sunset prayer time approaching.`,
            isha: `🌙 ${userName}, Isha prayer is in ${timeUntil} minutes. The night prayer is near.`
        };
        
        await chrome.notifications.create(`pre-${prayerName}-${Date.now()}`, {
            type: 'basic',
            iconUrl: 'assets/icons/icon-128.png',
            title: 'Prayer Reminder',
            message: messages[prayerName] || `Prayer ${prayerName} is in ${timeUntil} minutes`,
            priority: 1,
            requireInteraction: settings.persistent || false
        });
    }
    
    async createPrayerTimeNotification(prayerName) {
        const settings = await this.getStorageData('notificationSettings') || {};
        if (!settings.enabled && settings.enabled !== undefined) return;
        
        const userName = await this.getStorageData('userName') || 'Muslim';
        
        // Always attempt to play audio for prayer times (removed problematic condition)
        console.log('🔊 Prayer time notification - attempting to play audio');
        
        const messages = {
            fajr: `🕌 ${userName}, it's time for Fajr prayer. الله أكبر`,
            dhuhr: `🕌 ${userName}, it's time for Dhuhr prayer. الله أكبر`,
            asr: `🕌 ${userName}, it's time for Asr prayer. الله أكبر`,
            maghrib: `🕌 ${userName}, it's time for Maghrib prayer. الله أكبر`,
            isha: `🕌 ${userName}, it's time for Isha prayer. الله أكبر`
        };
        
        await chrome.notifications.create(`prayer-${prayerName}-${Date.now()}`, {
            type: 'basic',
            iconUrl: 'assets/icons/icon-128.png',
            title: `${prayerName.charAt(0).toUpperCase() + prayerName.slice(1)} Prayer Time`,
            message: messages[prayerName] || `It's time for ${prayerName} prayer`,
            priority: 2,
            requireInteraction: true,
            buttons: [
                { title: 'I have prayed' },
                { title: 'Remind me later' }
            ]
        });
    }
    
    async createTestNotification() {
        const userName = await this.getStorageData('userName') || 'Brother/Sister';
        
        await chrome.notifications.create(`test-notification-${Date.now()}`, {
            type: 'basic',
            iconUrl: 'assets/icons/icon-128.png',
            title: 'Test Notification - Islamic Namaz Companion',
            message: `🕌 ${userName}, this is a test notification from your Islamic Namaz Companion. All systems are working properly! الله أكبر`,
            priority: 2,
            requireInteraction: false
        });
        
        console.log('📱 Test notification created successfully');
    }
    
    async playCustomAzan() {
        try {
            console.log('🔊 Attempting to play Azan...');
            
            const notificationSettings = await this.getStorageData('notificationSettings') || {};
            const volume = notificationSettings.azanVolume || 70;
            const selectedAzanId = await this.getStorageData('selectedAzan') || 'default_adhan';
            
            console.log('🔧 Azan settings:', {
                volume: volume,
                selectedAzanId: selectedAzanId,
                notificationSettings: notificationSettings
            });
            
            // Get the selected Azan source
            const azanSource = await this.getSelectedAzanSource(selectedAzanId);
            
            if (!azanSource) {
                console.log('🔔 No Azan source found, using fallback notification');
                await this.createNotificationWithSound('🔊 Prayer Time', 'It\'s time for prayer');
                return;
            }
            
            console.log('✅ Azan source obtained:', azanSource);
            
            // Try to send to existing tabs first
            const tabs = await chrome.tabs.query({});
            let playedSuccessfully = false;
            
            // Prioritize tabs that can play audio
            for (const tab of tabs) {
                try {
                    // Skip chrome:// and extension pages
                    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
                        continue;
                    }
                    
                    // Inject content script if needed (ignore errors if already injected)
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content/overlay.js']
                        });
                    } catch (injectionError) {
                        // Script might already be injected, continue
                        console.log(`Script injection skipped for tab ${tab.id}`);
                    }
                    
                    // Send audio play message
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        type: 'PLAY_AZAN',
                        azanData: azanSource,
                        volume: volume
                    });
                    
                    if (response?.success) {
                        playedSuccessfully = true;
                        console.log(`✅ Azan sent successfully to tab ${tab.id}`);
                        break; // Only need one tab to play
                    }
                } catch (error) {
                    // Tab might not have content script or be accessible, continue to next tab
                    console.log(`Could not send to tab ${tab.id}:`, error.message);
                    continue;
                }
            }
            
            // If no tabs could play, create a dedicated audio tab
            if (!playedSuccessfully) {
                console.log('🆕 No accessible tabs found, creating new tab for Azan playback');
                await this.createAzanPlayerTab(azanSource, volume);
            }
            
        } catch (error) {
            console.error('❌ Error playing Azan:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                selectedAzanId: await this.getStorageData('selectedAzan'),
                notificationSettings: await this.getStorageData('notificationSettings')
            });
            
            // Fallback: try to create audio notification or system notification
            try {
                console.log('🔄 Attempting fallback notification...');
                await this.createNotificationWithSound('🕌 Prayer Time', 'It\'s time for prayer - Audio may be blocked');
            } catch (fallbackError) {
                console.error('❌ Fallback notification also failed:', fallbackError);
                // Last resort: basic notification
                try {
                    await chrome.notifications.create({
                        type: 'basic',
                        iconUrl: chrome.runtime.getURL('assets/icons/icon-48.png'),
                        title: 'Prayer Time',
                        message: 'It\'s time for prayer'
                    });
                } catch (basicError) {
                    console.error('❌ Even basic notification failed:', basicError);
                }
            }
        }
    }

    async getSelectedAzanSource(azanId) {
        try {
            console.log(`🎵 Getting Azan source for ID: ${azanId}`);
            
            // Check if it's a default Azan
            const defaultAzans = {
                'default_adhan': {
                    type: 'default',
                    data: chrome.runtime.getURL('assets/mp3/adhan.mp3'),
                    name: 'Default Adhan'
                },
                'solid_adhan': {
                    type: 'default',
                    data: chrome.runtime.getURL('assets/mp3/solid_adhan.mp3'),
                    name: 'Solid Adhan'
                },
                'audio_adhan': {
                    type: 'default',
                    data: chrome.runtime.getURL('assets/audio/adhan.mp3'),
                    name: 'Audio Adhan'
                }
            };
            
            if (defaultAzans[azanId]) {
                console.log(`✅ Using default Azan: ${defaultAzans[azanId].name}`);
                return defaultAzans[azanId];
            }
            
            // Check if it's a custom uploaded Azan
            const customAzans = await this.getStorageData('customAzans') || {};
            if (customAzans[azanId]) {
                console.log(`✅ Using custom Azan: ${customAzans[azanId].name}`);
                return {
                    type: 'custom',
                    data: customAzans[azanId].data,
                    name: customAzans[azanId].name
                };
            }
            
            // Always return a default fallback to ensure audio can play
            console.log('⚠️ Selected Azan not found, using default');
            const fallback = defaultAzans['default_adhan'];
            console.log('🔄 Fallback Azan:', fallback);
            return fallback;
            
        } catch (error) {
            console.error('❌ Error getting Azan source:', error);
            // Return the most basic fallback
            return {
                type: 'default',
                data: chrome.runtime.getURL('assets/mp3/adhan.mp3'),
                name: 'Default Adhan'
            };
        }
    }
    
    async createAzanPlayerTab(azanSource, volume) {
        try {
            // Determine the audio source URL
            let audioSrc = '';
            let azanName = azanSource.name || 'Azan';
            
            if (azanSource.type === 'custom') {
                audioSrc = azanSource.data; // Base64 data URL
            } else {
                // For default files, use the extension URL directly
                audioSrc = azanSource.data; // This is already chrome.runtime.getURL() format
            }
            
            console.log(`🎵 Using audio source: ${audioSrc}`);
            console.log(`🎵 Audio type: ${azanSource.type}`);
            console.log(`🎵 Audio name: ${azanName}`);
            
            // Store audio data in storage for offscreen document to access
            await chrome.storage.local.set({
                pendingAzan: {
                    audioSrc: audioSrc,
                    volume: volume,
                    timestamp: Date.now()
                }
            });
            
            // Create or get offscreen document for audio playback
            await this.setupOffscreenDocument();
            
            console.log('✅ Azan playback initiated via offscreen document');
        } catch (error) {
            console.error('❌ Failed to play Azan:', error);
            throw error;
        }
    }
    
    async setupOffscreenDocument() {
        // Check if offscreen document already exists
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        
        if (existingContexts.length > 0) {
            console.log('✅ Offscreen document already exists');
            return;
        }
        
        // Create offscreen document
        await chrome.offscreen.createDocument({
            url: 'offscreen/audio-player.html',
            reasons: ['AUDIO_PLAYBACK'],
            justification: 'Playing Azan audio in background'
        });
        
        console.log('✅ Offscreen document created');
    }
    
    async createNotificationWithSound(title, message) {
        try {
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('assets/icons/icon-48.png'),
                title: title,
                message: message,
                silent: false // This will play the system notification sound
            });
        } catch (error) {
            console.error('❌ Error creating notification with sound:', error);
        }
    }

    // ====================================
    // Alarm and Scheduling System
    // ====================================
    
    async schedulePrayerAlarms(prayerTimes) {
        // Clear existing alarms
        await chrome.alarms.clearAll();
        
        const today = new Date();
        const notificationSettings = await this.getStorageData('notificationSettings') || {};
        const preReminderMinutes = notificationSettings.preReminderTime || 15;
        
        for (const [prayer, time] of Object.entries(prayerTimes)) {
            if (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(prayer)) {
                const prayerDateTime = this.parseTimeToDate(time, today);
                
                // Skip if prayer time has passed
                if (prayerDateTime <= today) continue;
                
                // Schedule pre-prayer reminder
                if (notificationSettings.preReminders !== false) {
                    const preReminderTime = new Date(prayerDateTime.getTime() - (preReminderMinutes * 60000));
                    if (preReminderTime > today) {
                        await chrome.alarms.create(`pre-${prayer}`, {
                            when: preReminderTime.getTime()
                        });
                    }
                }
                
                // Schedule prayer time alarm
                await chrome.alarms.create(prayer, {
                    when: prayerDateTime.getTime()
                });
                
                // Schedule overlay display
                const overlayTime = new Date(prayerDateTime.getTime() - 30000); // 30 seconds before
                if (overlayTime > today) {
                    await chrome.alarms.create(`overlay-${prayer}`, {
                        when: overlayTime.getTime()
                    });
                }
            }
        }
        
        console.log('⏰ Prayer alarms scheduled successfully');
    }
    
    async scheduleFromManualTimes(manualTimes) {
        try {
            // Convert manual times to today's date
            const today = new Date();
            const todayPrayerTimes = {};
            
            for (const [prayer, timeString] of Object.entries(manualTimes)) {
                const prayerDateTime = this.parseTimeToDate(timeString, today);
                todayPrayerTimes[prayer] = prayerDateTime.toTimeString().substring(0, 5);
            }
            
            // Store as today's prayer times
            await this.setStorageData('todayPrayerTimes', todayPrayerTimes);
            await this.setStorageData('lastPrayerUpdate', Date.now());
            
            // Schedule alarms
            await this.schedulePrayerAlarms(todayPrayerTimes);
            
            console.log('⏰ Manual prayer times scheduled successfully');
        } catch (error) {
            console.error('❌ Error scheduling manual prayer times:', error);
            throw error;
        }
    }
    
    setupAlarmListeners() {
        chrome.alarms.onAlarm.addListener(async (alarm) => {
            console.log(`⏰ Alarm triggered: ${alarm.name}`);
            
            if (alarm.name.startsWith('pre-')) {
                const prayerName = alarm.name.replace('pre-', '');
                const prayerTimes = await this.getStorageData('todayPrayerTimes');
                if (prayerTimes && prayerTimes[prayerName]) {
                    const timeUntil = this.getTimeUntilPrayer(prayerTimes[prayerName]);
                    await this.createPrePrayerNotification(prayerName, timeUntil);
                }
            } else if (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(alarm.name)) {
                // Main prayer time - trigger notification, Azan, and overlay
                await this.handlePrayerTime(alarm.name);
            } else if (alarm.name === 'test-prayer') {
                // Handle test prayer notification
                await this.createTestNotification();
            }
        });
    }
    
    async handlePrayerTime(prayerName) {
        console.log(`🕌 Handling prayer time: ${prayerName}`);
        
        try {
            // 1. Create notification
            await this.createPrayerTimeNotification(prayerName);
            
            // 2. Play Azan if enabled (default to enabled)
            const notificationSettings = await this.getStorageData('notificationSettings') || {};
            console.log('🔊 Attempting to play Azan... Settings:', notificationSettings);
            // Play audio by default unless explicitly disabled
            if (notificationSettings.playAzan !== false && notificationSettings.enabled !== false) {
                console.log('🔊 Playing Azan...');
                await this.playCustomAzan();
            } else {
                console.log('🔇 Azan playback disabled in settings');
            }
            
            // 3. Show overlay if enabled
            await this.triggerPrayerOverlay(prayerName);
            
            // 4. Update prayer status
            await this.updatePrayerStatus(prayerName);
            
            console.log(`✅ Prayer time handling completed for ${prayerName}`);
        } catch (error) {
            console.error(`❌ Error handling prayer time for ${prayerName}:`, error);
        }
    }

    async triggerPrayerOverlay(prayerName) {
        try {
            const overlaySettings = await this.getStorageData('overlaySettings') || { enabled: true }; // Default enabled
            console.log('🖥️ Overlay settings:', overlaySettings);
            
            if (overlaySettings.enabled === false) {
                console.log('⚠️ Overlay disabled in settings');
                return;
            }
            
            // Play adhan.mp3 when overlay shows
            console.log('🔊 Playing adhan.mp3 with overlay...');
            const adhanAudioSrc = chrome.runtime.getURL('assets/mp3/adhan.mp3');
            await chrome.storage.local.set({
                pendingAzan: {
                    audioSrc: adhanAudioSrc,
                    volume: 100,
                    timestamp: Date.now()
                }
            });
            await this.setupOffscreenDocument();
            
            // Store active prayer overlay info for tracking
            await chrome.storage.local.set({
                activePrayerOverlay: {
                    prayerName: prayerName,
                    startTime: Date.now(),
                    duration: overlaySettings.duration || 900000, // 15 minutes default
                    endTime: Date.now() + (overlaySettings.duration || 900000)
                }
            });
            
            console.log(`🖥️ Triggering prayer overlay for ${prayerName}`);
            const tabs = await chrome.tabs.query({});
            let overlayShown = false;
            
            for (const tab of tabs) {
                try {
                    // Skip chrome:// and extension pages
                    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                        continue;
                    }
                    
                    // Inject content script if needed
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content/overlay.js']
                        });
                    } catch (injectionError) {
                        // Script might already be injected, continue
                    }
                    
                    // Send overlay message
                    await chrome.tabs.sendMessage(tab.id, {
                        type: 'SHOW_PRAYER_OVERLAY',
                        prayer: prayerName,
                        duration: overlaySettings.duration || 900000 // 15 minutes default
                    });
                    
                    overlayShown = true;
                    console.log(`✅ Overlay sent to tab ${tab.id} (${tab.url})`);
                } catch (error) {
                    console.warn(`Could not send overlay to tab ${tab.id}:`, error.message);
                }
            }
            
            if (!overlayShown) {
                console.warn('⚠️ Could not show overlay on any tabs');
                // Create a dedicated overlay tab
                await this.createOverlayTab(prayerName, overlaySettings.duration || 900000);
            }
        } catch (error) {
            console.error('❌ Error triggering prayer overlay:', error);
        }
    }
    
    async createOverlayTab(prayerName, duration) {
        try {
            console.log(`🆕 Creating dedicated overlay tab for ${prayerName}`);
            const overlayUrl = chrome.runtime.getURL('preview/overlay-preview.html') + 
                              `?prayer=${encodeURIComponent(prayerName)}&duration=${duration}`;
            
            await chrome.tabs.create({ 
                url: overlayUrl,
                active: true // Make it active to ensure user sees it
            });
            
            console.log('✅ Dedicated overlay tab created');
        } catch (error) {
            console.error('❌ Failed to create overlay tab:', error);
        }
    }

    // ====================================
    // Data Persistence and Sync
    // ====================================
    
    async setStorageData(key, value) {
        try {
            await chrome.storage.sync.set({ [key]: value });
            
            // Auto-repair: verify the data was stored correctly
            const verification = await chrome.storage.sync.get(key);
            if (!verification[key] || JSON.stringify(verification[key]) !== JSON.stringify(value)) {
                // Fallback to local storage if sync fails
                await chrome.storage.local.set({ [key]: value });
                console.warn(`⚠️ Fallback to local storage for key: ${key}`);
            }
        } catch (error) {
            console.error(`❌ Storage error for key ${key}:`, error);
            // Emergency fallback to local storage
            try {
                await chrome.storage.local.set({ [key]: value });
            } catch (localError) {
                console.error(`❌ Local storage also failed for key ${key}:`, localError);
            }
        }
    }
    
    async getStorageData(key) {
        try {
            // Try sync storage first
            const syncResult = await chrome.storage.sync.get(key);
            if (syncResult[key] !== undefined) {
                return syncResult[key];
            }
            
            // Fallback to local storage
            const localResult = await chrome.storage.local.get(key);
            return localResult[key];
        } catch (error) {
            console.error(`❌ Error getting storage data for key ${key}:`, error);
            return null;
        }
    }
    
    async getMultipleStorageData(keys) {
        try {
            const syncResult = await chrome.storage.sync.get(keys);
            const localResult = await chrome.storage.local.get(keys);
            
            // Merge results, preferring sync over local
            return { ...localResult, ...syncResult };
        } catch (error) {
            console.error('❌ Error getting multiple storage data:', error);
            return {};
        }
    }

    // ====================================
    // Background Task Management
    // ====================================
    
    setupPeriodicRefresh() {
        // Set up daily refresh at 3 AM
        chrome.alarms.create('daily-refresh', {
            when: this.getNext3AM(),
            periodInMinutes: 24 * 60 // 24 hours
        });
        
        // Handle system sleep/wake
        if (chrome.idle && chrome.idle.onStateChanged) {
            chrome.idle.onStateChanged.addListener(async (state) => {
                if (state === 'active') {
                    const lastUpdate = await this.getStorageData('lastPrayerUpdate');
                    const now = Date.now();
                    
                    // Refresh if more than 6 hours since last update
                    if (!lastUpdate || (now - lastUpdate) > (6 * 60 * 60 * 1000)) {
                        await this.refreshPrayerTimes();
                    }
                }
            });
        } else {
            console.warn('Chrome idle API not available - system sleep/wake detection disabled');
        }
    }
    
    getNext3AM() {
        const now = new Date();
        const next3AM = new Date(now);
        next3AM.setHours(3, 0, 0, 0);
        
        if (next3AM <= now) {
            next3AM.setDate(next3AM.getDate() + 1);
        }
        
        return next3AM.getTime();
    }
    
    async refreshPrayerTimes() {
        try {
            console.log('🔄 Refreshing prayer times...');
            await this.initializePrayerSystem();
            await this.setStorageData('lastPrayerUpdate', Date.now());
            console.log('✅ Prayer times refreshed successfully');
        } catch (error) {
            console.error('❌ Error refreshing prayer times:', error);
        }
    }

    // ====================================
    // Message Handling for Cross-Tab Communication
    // ====================================
    
    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            (async () => {
                try {
                    switch (request.type) {
                        case 'GET_PRAYER_TIMES':
                            const prayerTimes = await this.getStorageData('todayPrayerTimes');
                            sendResponse({ success: true, data: prayerTimes });
                            break;
                            
                        case 'REFRESH_PRAYER_TIMES':
                            await this.refreshPrayerTimes();
                            sendResponse({ success: true });
                            break;
                            
                        case 'UPDATE_LOCATION':
                            this.currentLocation = request.location;
                            await this.setStorageData('userLocation', request.location);
                            await this.initializePrayerSystem();
                            sendResponse({ success: true });
                            break;
                            
                        case 'PRAYER_COMPLETED':
                            await this.markPrayerCompleted(request.prayer);
                            sendResponse({ success: true });
                            break;
                            
                        case 'GET_NEXT_PRAYER':
                            const nextPrayer = await this.getNextPrayerInfo();
                            sendResponse({ success: true, data: nextPrayer });
                            break;
                            
                        case 'DETECT_LOCATION':
                            try {
                                console.log('🌍 Detecting user location...');
                                const location = await this.detectLocation();
                                await this.setStorageData('userLocation', location);
                                
                                // Fetch new prayer times with updated location
                                if (location && location.lat && location.lng) {
                                    const prayerTimes = await this.fetchPrayerTimes(location.lat, location.lng);
                                    await this.setStorageData('todayPrayerTimes', prayerTimes);
                                    await this.schedulePrayerAlarms(prayerTimes);
                                }
                                
                                sendResponse({ success: true, location: location });
                            } catch (error) {
                                console.error('❌ Location detection failed:', error);
                                sendResponse({ success: false, error: error.message });
                            }
                            break;
                            
                        case 'UPDATE_PRAYER_TIMES':
                            try {
                                const { prayerTimes, mode } = request;
                                await this.setStorageData('prayerMode', mode);
                                if (mode === 'manual') {
                                    await this.setStorageData('manualPrayerTimes', prayerTimes);
                                    await this.scheduleFromManualTimes(prayerTimes);
                                }
                                sendResponse({ success: true });
                            } catch (error) {
                                sendResponse({ success: false, error: error.message });
                            }
                            break;
                            
                        case 'TEST_PRAYER_TIME':
                            try {
                                // Schedule a test notification for 5 seconds from now
                                const testTime = new Date(Date.now() + 5000);
                                chrome.alarms.create('test-prayer', {
                                    when: testTime.getTime()
                                });
                                sendResponse({ success: true });
                            } catch (error) {
                                sendResponse({ success: false, error: error.message });
                            }
                            break;
                            
                        case 'TEST_AZAN':
                            try {
                                console.log('🔊 Test Azan requested from popup');
                                const selectedAzanId = await this.getStorageData('selectedAzan') || 'default_adhan';
                                const azanSource = await this.getSelectedAzanSource(selectedAzanId);
                                
                                // Also attempt to play the audio immediately for testing
                                if (azanSource) {
                                    console.log('🎵 Starting test audio playback...');
                                    await this.playCustomAzan();
                                }
                                
                                sendResponse({ success: true, azanData: azanSource });
                            } catch (error) {
                                console.error('❌ Test Azan failed:', error);
                                sendResponse({ success: false, error: error.message });
                            }
                            break;
                            
                        case 'TEST_OVERLAY':
                            try {
                                console.log('🖥️ Test overlay requested');
                                const duration = request.duration || 10000; // 10 seconds default
                                await this.triggerPrayerOverlay('Test Prayer');
                                sendResponse({ success: true });
                            } catch (error) {
                                console.error('❌ Test overlay failed:', error);
                                sendResponse({ success: false, error: error.message });
                            }
                            break;
                            
                        case 'GET_AVAILABLE_AZANS':
                            try {
                                const azanList = await this.getAvailableAzans();
                                sendResponse({ success: true, azans: azanList });
                            } catch (error) {
                                console.error('❌ Failed to get available Azans:', error);
                                sendResponse({ success: false, error: error.message });
                            }
                            break;
                            
                        case 'SET_SELECTED_AZAN':
                            try {
                                await this.setStorageData('selectedAzan', request.azanId);
                                sendResponse({ success: true });
                            } catch (error) {
                                console.error('❌ Failed to set selected Azan:', error);
                                sendResponse({ success: false, error: error.message });
                            }
                            break;
                            
                        case 'ADD_CUSTOM_AZAN':
                            try {
                                await this.addCustomAzan(request.azanData);
                                sendResponse({ success: true });
                            } catch (error) {
                                console.error('❌ Failed to add custom Azan:', error);
                                sendResponse({ success: false, error: error.message });
                            }
                            break;
                            
                        case 'REMOVE_CUSTOM_AZAN':
                            try {
                                await this.removeCustomAzan(request.azanId);
                                sendResponse({ success: true });
                            } catch (error) {
                                console.error('❌ Failed to remove custom Azan:', error);
                                sendResponse({ success: false, error: error.message });
                            }
                            break;
                            
                        default:
                            sendResponse({ success: false, error: 'Unknown message type' });
                    }
                } catch (error) {
                    console.error('❌ Message handling error:', error);
                    sendResponse({ success: false, error: error.message });
                }
            })();
            return true; // Keep message channel open for async response
        });
    }

    setupTabListeners() {
        // Listen for new tabs being created
        chrome.tabs.onCreated.addListener(async (tab) => {
            console.log('🆕 New tab created, checking for prayer time...');
            // Immediate check
            await this.checkAndInjectPrayerOverlay(tab.id);
            // Second check after small delay
            setTimeout(async () => {
                await this.checkAndInjectPrayerOverlay(tab.id);
            }, 300);
        });
        
        // Listen for tab updates (e.g., navigation, search, URL change)
        chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            // Inject immediately on ANY change during prayer time
            if (changeInfo.url || changeInfo.status) {
                console.log(`🔄 Tab ${tabId} updated: ${changeInfo.status || 'URL change'}`);
                await this.checkAndInjectPrayerOverlay(tabId);
            }
            
            // Additional check when page starts loading
            if (changeInfo.status === 'loading') {
                console.log(`⚡ Tab ${tabId} loading, injecting overlay...`);
                await this.checkAndInjectPrayerOverlay(tabId);
            }
            
            // Final check when page completes
            if (changeInfo.status === 'complete') {
                console.log(`✅ Tab ${tabId} complete, ensuring overlay...`);
                await this.checkAndInjectPrayerOverlay(tabId);
            }
        });
        
        // Listen for tab activation (when user switches tabs)
        chrome.tabs.onActivated.addListener(async (activeInfo) => {
            console.log(`👁️ Tab ${activeInfo.tabId} activated`);
            // Immediate injection
            await this.checkAndInjectPrayerOverlay(activeInfo.tabId);
        });
        
        // Listen for tab replacements (when tab URL changes)
        chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
            console.log(`🔀 Tab replaced: ${addedTabId}`);
            await this.checkAndInjectPrayerOverlay(addedTabId);
        });
        
        // Periodic enforcement - check all tabs every 10 seconds during prayer time
        setInterval(async () => {
            await this.enforceOverlayOnAllTabs();
        }, 10000); // Every 10 seconds for stronger enforcement
    }
    
    async enforceOverlayOnAllTabs() {
        try {
            // Check if there's an active prayer overlay
            const activePrayerOverlay = await chrome.storage.local.get('activePrayerOverlay');
            
            if (!activePrayerOverlay.activePrayerOverlay) {
                return; // No active prayer time
            }
            
            const overlayData = activePrayerOverlay.activePrayerOverlay;
            const currentTime = Date.now();
            
            // Check if prayer time is still active
            if (currentTime > overlayData.endTime) {
                await chrome.storage.local.remove('activePrayerOverlay');
                console.log('⏰ Prayer time ended, stopping enforcement');
                return;
            }
            
            const minutesRemaining = Math.floor((overlayData.endTime - currentTime) / 60000);
            console.log(`🔒 Enforcing prayer overlay on all tabs (${minutesRemaining} min remaining)...`);
            
            // Get all tabs and inject overlay
            const tabs = await chrome.tabs.query({});
            const injectionPromises = [];
            
            for (const tab of tabs) {
                // Skip system pages but inject on all user tabs
                if (tab.url && 
                    !tab.url.startsWith('chrome://') && 
                    !tab.url.startsWith('chrome-extension://') &&
                    !tab.url.startsWith('chrome-search://') &&
                    !tab.url.startsWith('edge://') &&
                    tab.url !== 'about:blank') {
                    injectionPromises.push(this.checkAndInjectPrayerOverlay(tab.id));
                }
            }
            
            // Execute all injections in parallel for speed
            await Promise.allSettled(injectionPromises);
            console.log(`✅ Enforcement check completed for ${injectionPromises.length} tabs`);
        } catch (error) {
            console.error('❌ Error enforcing overlay:', error);
        }
    }
    
    async checkAndInjectPrayerOverlay(tabId) {
        try {
            // Check if there's an active prayer overlay
            const activePrayerOverlay = await chrome.storage.local.get('activePrayerOverlay');
            
            if (!activePrayerOverlay.activePrayerOverlay) {
                return; // No active prayer time
            }
            
            const overlayData = activePrayerOverlay.activePrayerOverlay;
            const currentTime = Date.now();
            
            // Check if overlay is still within the prayer time duration (15 minutes from start)
            if (currentTime > overlayData.endTime) {
                // Prayer time has ended, remove the active overlay marker
                await chrome.storage.local.remove('activePrayerOverlay');
                console.log('⏰ Prayer time duration ended, overlay removed');
                return;
            }
            
            // Get tab info
            let tab;
            try {
                tab = await chrome.tabs.get(tabId);
            } catch (e) {
                console.log(`⚠️ Tab ${tabId} not found or closed`);
                return;
            }
            
            // Skip chrome:// and extension pages, but allow chrome://newtab
            if (!tab.url || 
                (tab.url.startsWith('chrome://') && !tab.url.includes('newtab')) || 
                (tab.url.startsWith('chrome-extension://') && !tab.url.includes(chrome.runtime.id)) ||
                tab.url.startsWith('chrome-search://') ||
                tab.url.startsWith('edge://') ||
                tab.url === 'about:blank') {
                console.log(`⏭️ Skipping system page: ${tab.url}`);
                return;
            }
            
            // Calculate remaining duration from the original start time
            const remainingDuration = overlayData.endTime - currentTime;
            const minutesRemaining = Math.floor(remainingDuration / 60000);
            
            // Only inject if there's meaningful time remaining (at least 1 minute)
            if (minutesRemaining < 1) {
                console.log('⏰ Less than 1 minute remaining, skipping injection');
                return;
            }
            
            console.log(`⏰ Prayer time active: ${minutesRemaining} minutes remaining`);
            
            // Inject overlay into the tab - use try-catch for each step
            try {
                // Step 1: Inject CSS (if not already injected)
                try {
                    await chrome.scripting.insertCSS({
                        target: { tabId: tabId },
                        files: ['content/overlay.css']
                    });
                } catch (cssError) {
                    // CSS might already be injected, that's okay
                    console.log(`CSS injection note: ${cssError.message}`);
                }
                
                // Step 2: Inject JavaScript
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['content/overlay.js']
                    });
                } catch (jsError) {
                    // Script might already be injected
                    console.log(`JS injection note: ${jsError.message}`);
                }
                
                // Step 3: Wait briefly for script to initialize
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Step 4: Send message to show overlay with remaining duration
                try {
                    await chrome.tabs.sendMessage(tabId, {
                        type: 'SHOW_PRAYER_OVERLAY',
                        prayer: overlayData.prayerName,
                        duration: remainingDuration,
                        message: `🕌 ${overlayData.prayerName} Prayer Time! Please pray first. Browser will be available in ${minutesRemaining} minutes.`
                    });
                    
                    console.log(`✅ Prayer overlay injected into tab ${tabId} - ${minutesRemaining} min remaining`);
                } catch (msgError) {
                    console.warn(`⚠️ Could not send message to tab ${tabId}:`, msgError.message);
                    // Try again after a short delay
                    setTimeout(async () => {
                        try {
                            await chrome.tabs.sendMessage(tabId, {
                                type: 'SHOW_PRAYER_OVERLAY',
                                prayer: overlayData.prayerName,
                                duration: remainingDuration,
                                message: `🕌 ${overlayData.prayerName} Prayer Time! Please pray first. Browser will be available in ${minutesRemaining} minutes.`
                            });
                        } catch (retryError) {
                            console.warn(`⚠️ Retry failed for tab ${tabId}`);
                        }
                    }, 500);
                }
            } catch (injectionError) {
                console.warn(`⚠️ Could not inject overlay into tab ${tabId}:`, injectionError.message);
            }
        } catch (error) {
            console.error('❌ Error checking/injecting prayer overlay:', error);
        }
    }

    // ====================================
    // Prayer System Initialization
    // ====================================
    
    async initializePrayerSystem() {
        try {
            // Get user preferences
            const userMode = await this.getStorageData('prayerMode');
            
            if (userMode === 'manual') {
                await this.handleManualPrayerTimes();
            } else {
                await this.handleAutomaticPrayerTimes();
            }
        } catch (error) {
            console.error('❌ Error initializing prayer system:', error);
        }
    }
    
    async handleAutomaticPrayerTimes() {
        // Get location
        let location = await this.getStorageData('userLocation');
        if (!location) {
            location = await this.detectLocation();
            await this.setStorageData('userLocation', location);
        }
        
        this.currentLocation = location;
        
        // Fetch prayer times
        const prayerTimes = await this.fetchPrayerTimes(location.lat, location.lng);
        await this.setStorageData('todayPrayerTimes', prayerTimes);
        
        // Schedule alarms
        await this.schedulePrayerAlarms(prayerTimes);
        
        console.log('✅ Automatic prayer times initialized');
    }
    
    async handleManualPrayerTimes() {
        const manualTimes = await this.getStorageData('manualPrayerTimes');
        if (manualTimes) {
            await this.setStorageData('todayPrayerTimes', manualTimes);
            await this.schedulePrayerAlarms(manualTimes);
            console.log('✅ Manual prayer times initialized');
        }
    }

    // ====================================
    // Azan Management System
    // ====================================
    
    async getAvailableAzans() {
        try {
            const azanList = [];
            
            // Add default Azans
            const defaultAzans = [
                {
                    id: 'default_adhan',
                    name: 'Default Adhan',
                    type: 'default',
                    description: 'Classic traditional Adhan',
                    url: chrome.runtime.getURL('assets/mp3/adhan.mp3')
                },
                {
                    id: 'solid_adhan', 
                    name: 'Solid Adhan',
                    type: 'default',
                    description: 'Clear and resonant Adhan',
                    url: chrome.runtime.getURL('assets/mp3/solid_adhan.mp3')
                },
                {
                    id: 'audio_adhan',
                    name: 'Audio Adhan',
                    type: 'default', 
                    description: 'Alternative traditional Adhan',
                    url: chrome.runtime.getURL('assets/audio/adhan.mp3')
                }
            ];
            
            azanList.push(...defaultAzans);
            
            // Add custom uploaded Azans
            const customAzans = await this.getStorageData('customAzans') || {};
            for (const [id, azanData] of Object.entries(customAzans)) {
                azanList.push({
                    id: id,
                    name: azanData.name,
                    type: 'custom',
                    description: `Uploaded ${new Date(azanData.uploadDate).toLocaleDateString()}`,
                    size: azanData.size,
                    duration: azanData.duration,
                    uploadDate: azanData.uploadDate
                });
            }
            
            return azanList;
        } catch (error) {
            console.error('❌ Error getting available Azans:', error);
            return [];
        }
    }
    
    async addCustomAzan(azanData) {
        try {
            const customAzans = await this.getStorageData('customAzans') || {};
            const azanId = `custom_${Date.now()}`;
            
            customAzans[azanId] = {
                name: azanData.name,
                data: azanData.data,
                size: azanData.size,
                type: azanData.type,
                duration: azanData.duration,
                uploadDate: Date.now()
            };
            
            await this.setStorageData('customAzans', customAzans);
            console.log(`✅ Custom Azan added with ID: ${azanId}`);
            
            return azanId;
        } catch (error) {
            console.error('❌ Error adding custom Azan:', error);
            throw error;
        }
    }
    
    async removeCustomAzan(azanId) {
        try {
            const customAzans = await this.getStorageData('customAzans') || {};
            
            if (customAzans[azanId]) {
                delete customAzans[azanId];
                await this.setStorageData('customAzans', customAzans);
                
                // If the removed Azan was selected, reset to default
                const selectedAzan = await this.getStorageData('selectedAzan');
                if (selectedAzan === azanId) {
                    await this.setStorageData('selectedAzan', 'default_adhan');
                }
                
                console.log(`✅ Custom Azan removed: ${azanId}`);
            }
        } catch (error) {
            console.error('❌ Error removing custom Azan:', error);
            throw error;
        }
    }

    // ====================================
    // Utility Functions
    // ====================================
    
    parseTimeToDate(timeString, baseDate) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date(baseDate);
        date.setHours(hours, minutes, 0, 0);
        return date;
    }
    
    getTimeUntilPrayer(prayerTime) {
        const now = new Date();
        const prayer = this.parseTimeToDate(prayerTime, now);
        if (prayer < now) {
            prayer.setDate(prayer.getDate() + 1); // Next day
        }
        return Math.floor((prayer - now) / (1000 * 60)); // Minutes
    }
    
    isCacheValid(timestamp, hoursValid) {
        const now = Date.now();
        const validUntil = timestamp + (hoursValid * 60 * 60 * 1000);
        return now < validUntil;
    }
    
    async markPrayerCompleted(prayerName) {
        const completedPrayers = await this.getStorageData('completedPrayers') || {};
        const today = new Date().toDateString();
        
        if (!completedPrayers[today]) {
            completedPrayers[today] = [];
        }
        
        if (!completedPrayers[today].includes(prayerName)) {
            completedPrayers[today].push(prayerName);
            await this.setStorageData('completedPrayers', completedPrayers);
        }
    }
    
    async getNextPrayerInfo() {
        const prayerTimes = await this.getStorageData('todayPrayerTimes');
        if (!prayerTimes) return null;
        
        const now = new Date();
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
        for (const prayer of prayers) {
            const prayerTime = this.parseTimeToDate(prayerTimes[prayer], now);
            if (prayerTime > now) {
                return {
                    name: prayer,
                    time: prayerTimes[prayer],
                    timeUntil: this.getTimeUntilPrayer(prayerTimes[prayer])
                };
            }
        }
        
        // All prayers passed, return tomorrow's Fajr
        const tomorrowFajr = this.parseTimeToDate(prayerTimes.fajr, now);
        tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
        
        return {
            name: 'fajr',
            time: prayerTimes.fajr,
            timeUntil: Math.floor((tomorrowFajr - now) / (1000 * 60)),
            tomorrow: true
        };
    }
    
    async updatePrayerStatus(prayerName) {
        const status = await this.getStorageData('prayerStatus') || {};
        status[prayerName] = {
            notified: true,
            timestamp: Date.now()
        };
        await this.setStorageData('prayerStatus', status);
    }
}

// ====================================
// Service Worker Initialization
// ====================================

// Initialize the companion when service worker starts
const islamicCompanion = new IslamicNamazCompanion();

// Handle installation
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        console.log('🕌 Islamic Namaz Companion installed');
        // Open setup page
        await chrome.tabs.create({ url: 'setup/setup.html' });
    } else if (details.reason === 'update') {
        console.log('🔄 Islamic Namaz Companion updated');
        await islamicCompanion.refreshPrayerTimes();
    }
});

// Handle startup
chrome.runtime.onStartup.addListener(async () => {
    console.log('🌅 Islamic Namaz Companion startup');
    await islamicCompanion.refreshPrayerTimes();
});

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
    await chrome.notifications.clear(notificationId);
    if (notificationId.includes('prayer-')) {
        // Open popup
        await chrome.action.openPopup();
    }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
    await chrome.notifications.clear(notificationId);
    
    if (notificationId.includes('prayer-')) {
        const prayerName = notificationId.split('-')[1];
        
        if (buttonIndex === 0) { // "I have prayed"
            await islamicCompanion.markPrayerCompleted(prayerName);
        } else if (buttonIndex === 1) { // "Remind me later"
            // Schedule reminder in 10 minutes
            await chrome.alarms.create(`remind-${prayerName}`, {
                delayInMinutes: 10
            });
        }
    }
});

console.log('🕌 Islamic Namaz Companion v4.0.0 - Background Service Worker Loaded');