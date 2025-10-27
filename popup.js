// ====================================
// Islamic Namaz Companion - Enhanced Popup v4.0.0
// Real-time Prayer Tracking with Advanced Features
// ====================================

class EnhancedNamazPopup {
    constructor() {
        this.version = '4.0.0';
        this.prayerTimes = null;
        this.currentLocation = null;
        this.countdownInterval = null;
        this.updateInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        
        this.prayerNames = {
            fajr: 'Fajr',
            dhuhr: 'Dhuhr', 
            asr: 'Asr',
            maghrib: 'Maghrib',
            isha: 'Isha'
        };

        this.prayerIcons = {
            fajr: '🌅',
            dhuhr: '☀️',
            asr: '🌤️',
            maghrib: '🌇',
            isha: '🌙'
        };

        this.init();
    }

    async init() {
        console.log(`🕌 Popup v${this.version} - Initializing`);
        
        try {
            // Check if user has completed setup
            const setupComplete = await this.checkSetupStatus();
            if (!setupComplete) {
                this.redirectToSetup();
                return;
            }

            this.updateCurrentDate();
            this.bindEvents();
            await this.loadPrayerData();
            this.startCountdown();
            this.startPeriodicUpdate();
            this.setupStorageListener();
            
            console.log('✅ Popup initialized successfully');
        } catch (error) {
            console.error('❌ Popup initialization error:', error);
            this.showError('Failed to initialize popup');
        }
    }

    async checkSetupStatus() {
        try {
            const setupData = await this.getStorageData(['userSetupComplete', 'userName']);
            return setupData.userSetupComplete && setupData.userName;
        } catch (error) {
            console.error('❌ Error checking setup status:', error);
            return false;
        }
    }

    redirectToSetup() {
        // Check if setup.html exists, otherwise use settings
        chrome.tabs.create({ 
            url: chrome.runtime.getURL('setup/setup.html')
        }).catch(() => {
            chrome.tabs.create({ 
                url: chrome.runtime.getURL('settings/settings.html')
            });
        });
        window.close();
    }

    setupStorageListener() {
        // Listen for storage changes for real-time updates
        if (chrome && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'sync' || namespace === 'local') {
                    if (changes.todayPrayerTimes || changes.prayerMode || changes.manualPrayerTimes) {
                        console.log('🔄 Prayer data changed, reloading...');
                        this.loadPrayerData();
                    }
                    if (changes.userLocation) {
                        console.log('🌍 Location changed, updating display...');
                        this.updateLocationDisplay(changes.userLocation.newValue);
                    }
                }
            });
        } else {
            console.error('❌ Chrome storage API not available');
        }
    }

    async updateCurrentDate() {
        const now = new Date();
        
        // Format date
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateString = now.toLocaleDateString('en-US', options);
        
        // Add Hijri date if available
        try {
            const hijriDate = await this.getHijriDate();
            const fullDate = hijriDate ? `${dateString} • ${hijriDate}` : dateString;
            document.getElementById('current-date').textContent = fullDate;
        } catch (error) {
            document.getElementById('current-date').textContent = dateString;
        }

        // Update user greeting
        await this.updateUserGreeting();
    }

    async getHijriDate() {
        try {
            const today = new Date();
            const response = await fetch(`https://api.aladhan.com/v1/gToH/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`);
            const data = await response.json();
            
            if (data.code === 200 && data.data.hijri) {
                const hijri = data.data.hijri;
                return `${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
            }
        } catch (error) {
            console.log('Note: Could not fetch Hijri date');
        }
        return null;
    }

    async updateUserGreeting() {
        try {
            const userData = await this.getStorageData(['userName', 'prayerMode']);
            const headerElement = document.querySelector('.header h1');
            
            if (userData.userName && headerElement) {
                const greeting = this.getIslamicGreeting();
                const mode = userData.prayerMode === 'manual' ? ' (Manual)' : '';
                headerElement.textContent = `${greeting}, ${userData.userName}${mode}`;
            }
        } catch (error) {
            console.error('❌ Error updating user greeting:', error);
        }
    }

    getIslamicGreeting() {
        const hour = new Date().getHours();
        if (hour < 5) return 'Peace be upon you';
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Assalam Alaikum';
        if (hour < 20) return 'Good evening';
        return 'Assalam Alaikum';
    }

    bindEvents() {
        // Settings button
        this.bindButton('settings-btn', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
        });

        // Test buttons
        this.bindButton('play-azan-btn', () => this.testAzan());
        this.bindButton('update-location-btn', () => this.updateLocation());
        this.bindButton('retry-btn', () => this.loadPrayerData());

        // Prayer point clicks for details
        document.querySelectorAll('.prayer-point').forEach(point => {
            point.addEventListener('click', (e) => {
                const prayerName = point.dataset.prayer;
                this.showPrayerDetails(prayerName);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        document.getElementById('settings-btn').click();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.updateLocation();
                        break;
                }
            }
        });
    }

    bindButton(elementId, callback) {
        const button = document.getElementById(elementId);
        if (button) {
            button.addEventListener('click', callback);
            console.log(`✅ Button '${elementId}' bound successfully`);
        } else {
            console.error(`❌ Button '${elementId}' not found in DOM`);
        }
    }

    async loadPrayerData() {
        try {
            this.setStatus('loading', '🕌 Loading prayer times...');
            this.showLoading(true);

            // Get prayer data from background script using new v4.0.0 API
            const response = await this.sendMessage({ type: 'GET_PRAYER_TIMES' });
            
            if (response?.success && response.data) {
                this.prayerTimes = response.data;
                this.displayPrayerTimes();
                this.setStatus('success', '✅ Prayer times loaded');
            } else {
                // Try to get location and refresh
                await this.refreshLocationAndTimes();
            }

            // Get location info
            await this.updateLocationInfo();

            this.showLoading(false);
            
        } catch (error) {
            console.error('❌ Error loading prayer data:', error);
            this.handleLoadError(error);
        }
    }

    async refreshLocationAndTimes() {
        try {
            const locationResponse = await this.sendMessage({ type: 'DETECT_LOCATION' });
            
            if (locationResponse?.success) {
                // Wait for prayer times to be fetched
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Try again to get prayer times
                const timesResponse = await this.sendMessage({ type: 'GET_PRAYER_TIMES' });
                
                if (timesResponse?.success && timesResponse.data) {
                    this.prayerTimes = timesResponse.data;
                    this.displayPrayerTimes();
                    this.setStatus('success', '✅ Prayer times refreshed');
                } else {
                    throw new Error('Could not fetch prayer times after location detection');
                }
            } else {
                throw new Error(locationResponse?.error || 'Location detection failed');
            }
        } catch (error) {
            throw new Error(`Refresh failed: ${error.message}`);
        }
    }

    async updateLocationInfo() {
        try {
            const location = await this.getStorageData('userLocation');
            if (location) {
                this.currentLocation = location;
                this.updateLocationDisplay(location);
            } else {
                document.getElementById('location-info').textContent = '📍 Location not detected';
            }
        } catch (error) {
            console.error('❌ Error updating location info:', error);
        }
    }

    updateLocationDisplay(location) {
        const locationElement = document.getElementById('location-info');
        if (!locationElement) return;
        
        if (!location) {
            locationElement.textContent = '📍 Location not available';
            return;
        }

        // Handle undefined or null values better
        const city = location.city && location.city !== 'Unknown City' && location.city !== 'undefined' 
                    ? location.city 
                    : 'Unknown Location';
        const country = location.country && location.country !== 'Unknown Country' && location.country !== 'undefined'
                       ? location.country 
                       : '';
        
        // Show coordinates if city/country are unknown
        if (city === 'Unknown Location' && !country && location.lat && location.lng) {
            locationElement.textContent = `📍 Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
        } else {
            const accuracy = location.accuracy && typeof location.accuracy === 'number' 
                           ? ` (±${Math.round(location.accuracy)}m)` 
                           : '';
            locationElement.textContent = `📍 ${city}${country ? ', ' + country : ''}${accuracy}`;
        }
    }

    handleLoadError(error) {
        console.error('❌ Load error:', error);
        this.showError();
        this.setStatus('error', '❌ Failed to load prayer times');
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Retry attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.loadPrayerData(), 2000 * this.reconnectAttempts);
        }
    }

    displayPrayerTimes() {
        if (!this.prayerTimes) {
            this.showError();
            return;
        }

        console.log('📊 Displaying prayer times:', this.prayerTimes);

        // Update prayer times
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        prayers.forEach(prayer => {
            const timeElement = document.getElementById(`${prayer}-time`);
            if (timeElement && this.prayerTimes[prayer]) {
                timeElement.textContent = this.formatTime(this.prayerTimes[prayer]);
            }
        });

        this.updatePrayerStatus();
        this.updateNextPrayer();
        this.resetReconnectAttempts();
        
        document.getElementById('prayer-content').style.display = 'block';
        document.getElementById('error-content').style.display = 'none';
    }

    resetReconnectAttempts() {
        this.reconnectAttempts = 0;
    }

    formatTime(timeString) {
        if (!timeString) return '--:--';
        
        // Handle different time formats
        if (timeString.includes('AM') || timeString.includes('PM')) {
            return timeString;
        }
        
        // Convert 24-hour to 12-hour format
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        
        return `${hour12}:${minutes} ${ampm}`;
    }

    convertTo24Hour(timeString) {
        if (!timeString) return '00:00';
        
        const [time, modifier] = timeString.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier && modifier.toLowerCase() === 'pm' && hours !== 12) {
            hours += 12;
        } else if (modifier && modifier.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
        }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    updatePrayerStatus() {
        if (!this.prayerTimes) return;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const prayers = [
            { name: 'fajr', time: this.prayerTimes.fajr },
            { name: 'dhuhr', time: this.prayerTimes.dhuhr },
            { name: 'asr', time: this.prayerTimes.asr },
            { name: 'maghrib', time: this.prayerTimes.maghrib },
            { name: 'isha', time: this.prayerTimes.isha }
        ];

        let currentPrayer = null;
        let completedCount = 0;

        prayers.forEach((prayer, index) => {
            const circle = document.getElementById(`${prayer.name}-circle`);
            if (!circle) return;
            
            const time24 = this.convertTo24Hour(prayer.time);
            
            circle.classList.remove('completed', 'current', 'upcoming');

            if (time24 <= currentTime) {
                circle.classList.add('completed');
                completedCount++;
            } else if (!currentPrayer) {
                circle.classList.add('current');
                currentPrayer = prayer;
            } else {
                circle.classList.add('upcoming');
            }
        });

        // Update timeline progress
        this.updateTimelineProgress(completedCount, prayers.length);
    }

    updateTimelineProgress(completedCount, totalCount) {
        const progressElement = document.getElementById('timeline-progress');
        if (progressElement) {
            const progressPercentage = (completedCount / totalCount) * 100;
            progressElement.style.width = `${progressPercentage}%`;
        }
    }

    updateNextPrayer() {
        if (!this.prayerTimes) return;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const prayers = [
            { name: 'Fajr', time: this.prayerTimes.fajr },
            { name: 'Dhuhr', time: this.prayerTimes.dhuhr },
            { name: 'Asr', time: this.prayerTimes.asr },
            { name: 'Maghrib', time: this.prayerTimes.maghrib },
            { name: 'Isha', time: this.prayerTimes.isha }
        ];

        let nextPrayer = null;

        for (const prayer of prayers) {
            const time24 = this.convertTo24Hour(prayer.time);
            if (time24 > currentTime) {
                nextPrayer = prayer;
                break;
            }
        }

        // If no prayer found for today, next prayer is tomorrow's Fajr
        if (!nextPrayer) {
            nextPrayer = { name: "Fajr", time: this.prayerTimes.fajr, tomorrow: true };
        }

        document.getElementById('next-prayer-name').textContent = nextPrayer.name;
        this.updateCountdown(nextPrayer);
    }

    updateCountdown(nextPrayer) {
        const countdownElement = document.getElementById('next-prayer-countdown');
        
        const updateTimer = () => {
            const now = new Date();
            const time24 = this.convertTo24Hour(nextPrayer.time);
            const [prayerHours, prayerMinutes] = time24.split(':').map(Number);
            
            let prayerTime = new Date(now);
            prayerTime.setHours(prayerHours, prayerMinutes, 0, 0);
            
            // If prayer time has passed today, set it for tomorrow
            if (prayerTime <= now || nextPrayer.tomorrow) {
                prayerTime.setDate(prayerTime.getDate() + 1);
            }
            
            const timeDiff = prayerTime - now;
            
            if (timeDiff <= 0) {
                countdownElement.textContent = "Now";
                return;
            }
            
            const remainingHours = Math.floor(timeDiff / (1000 * 60 * 60));
            const remainingMinutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const remainingSeconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            countdownElement.textContent = `${remainingHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        };

        updateTimer();
        
        // Clear existing interval
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        this.countdownInterval = setInterval(updateTimer, 1000);
    }

    startCountdown() {
        this.updateNextPrayer();
    }

    startPeriodicUpdate() {
        // Update prayer status every minute
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.updatePrayerStatus();
            this.updateNextPrayer();
            
            // Check if we need to refresh prayer times (once per day)
            const lastUpdate = this.prayerTimes?.date_for;
            const today = new Date().toISOString().split('T')[0];
            
            if (lastUpdate && lastUpdate !== today) {
                console.log('🔄 Date changed, refreshing prayer times...');
                this.loadPrayerData();
            }
        }, 60000);
    }

    // ====================================
    // Test Functions
    // ====================================

    async testAzan() {
        try {
            this.setButtonLoading('play-azan-btn', true);
            this.setStatus('loading', '🔊 Playing Azan...');
            
            const response = await this.sendMessage({ type: 'TEST_AZAN' });
            
            if (response?.success && response.azanData) {
                await this.playAzanInPopup(response.azanData);
                this.showNotification('🔊 Azan is playing...', 'success');
                this.setStatus('success', '✅ Azan playing');
                this.setButtonSuccess('play-azan-btn');
                setTimeout(() => this.resetButtonState('play-azan-btn'), 2000);
            } else {
                throw new Error('Failed to get Azan data');
            }
            
        } catch (error) {
            console.error('❌ Test Azan failed:', error);
            this.showNotification('❌ Failed to play Azan. Check your audio settings.', 'error');
            this.setStatus('error', '❌ Azan playback failed');
            this.setButtonError('play-azan-btn');
            setTimeout(() => this.resetButtonState('play-azan-btn'), 2000);
        }
    }

    async playAzanInPopup(azanData) {
        try {
            // Create or get audio element
            let audioElement = document.getElementById('test-azan-audio');
            if (!audioElement) {
                audioElement = document.createElement('audio');
                audioElement.id = 'test-azan-audio';
                audioElement.style.display = 'none';
                document.body.appendChild(audioElement);
            }

            // Set audio source
            audioElement.src = azanData.data;
            audioElement.volume = 0.7; // Default volume
            audioElement.loop = false;

            // Play audio
            await audioElement.play();
            console.log('✅ Azan playing in popup');

            // Clean up after playing
            audioElement.onended = () => {
                audioElement.remove();
            };

        } catch (error) {
            console.error('❌ Failed to play Azan in popup:', error);
            throw error;
        }
    }

    async updateLocation() {
        try {
            this.setButtonLoading('update-location-btn', true);
            this.setStatus('loading', '🌍 Detecting location...');
            
            const response = await this.sendMessage({ type: 'DETECT_LOCATION' });
            
            if (response?.success && response.location) {
                const location = response.location;
                console.log('📍 Location updated:', location);
                
                // Show success message with location details
                const city = location.city && location.city !== 'Unknown City' ? location.city : 'Unknown Location';
                const country = location.country && location.country !== 'Unknown Country' ? location.country : '';
                
                if (city !== 'Unknown Location' || country) {
                    this.showNotification(`📍 Location Detected\n${city}${country ? ', ' + country : ''}`, 'success');
                } else {
                    this.showNotification(`📍 Location Detected\nCoordinates: ${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`, 'success');
                }
                
                this.setButtonSuccess('update-location-btn');
                
                // Wait for prayer times to be updated
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Reload prayer data
                await this.loadPrayerData();
                setTimeout(() => this.resetButtonState('update-location-btn'), 2000);
            } else {
                throw new Error(response?.error || 'Location detection failed');
            }
            
        } catch (error) {
            console.error('❌ Location update failed:', error);
            
            if (error.message.includes('permission') || error.message.includes('denied')) {
                this.showNotification('❌ Location permission denied. Opening settings...', 'error');
                // Open Chrome settings for location permission
                try {
                    await chrome.tabs.create({ url: 'chrome://settings/content/location' });
                } catch (settingsError) {
                    this.showNotification('Please enable location permission in Chrome settings', 'warning');
                }
            } else {
                this.showNotification('❌ Failed to update location. Check your connection.', 'error');
            }
            
            this.setButtonError('update-location-btn');
            setTimeout(() => this.resetButtonState('update-location-btn'), 2000);
        }
    }

    showPrayerDetails(prayerName) {
        if (!this.prayerTimes || !this.prayerTimes[prayerName]) return;
        
        const time = this.prayerTimes[prayerName];
        const formattedTime = this.formatTime(time);
        const icon = this.prayerIcons[prayerName] || '🕌';
        
        this.showNotification(`${icon} ${this.prayerNames[prayerName]} prayer time: ${formattedTime}`, 'info');
    }

    // ====================================
    // Utility Functions
    // ====================================

    async sendMessage(message) {
        try {
            return await chrome.runtime.sendMessage(message);
        } catch (error) {
            console.error('❌ Message sending failed:', error);
            throw new Error('Communication with background script failed');
        }
    }

    async getStorageData(keys) {
        try {
            // Try sync storage first, then local storage
            const syncResult = await chrome.storage.sync.get(keys);
            const localResult = await chrome.storage.local.get(keys);
            
            return { ...localResult, ...syncResult };
        } catch (error) {
            console.error('❌ Storage access failed:', error);
            return {};
        }
    }

    setStatus(type, message) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        if (statusDot) {
            statusDot.classList.toggle('inactive', type === 'error');
        }
        
        if (statusText) {
            statusText.textContent = message;
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const content = document.getElementById('prayer-content');
        
        if (loading) loading.style.display = show ? 'flex' : 'none';
        if (content) content.style.display = show ? 'none' : 'block';
    }

    showError() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('prayer-content').style.display = 'none';
        document.getElementById('error-content').style.display = 'block';
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.temp-notification');
        existing.forEach(el => el.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'temp-notification';
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            right: 10px;
            padding: 12px;
            border-radius: 8px;
            color: white;
            font-size: 0.8rem;
            text-align: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
            animation: slideDown 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            ${this.getNotificationStyles(type)}
        `;
        notification.textContent = message;
        
        // Add styles if not already present
        if (!document.getElementById('popup-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'popup-notification-styles';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(-100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideUp 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    getNotificationStyles(type) {
        const styles = {
            success: 'background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9));',
            error: 'background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));',
            info: 'background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9));',
            warning: 'background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9));'
        };
        return styles[type] || styles.info;
    }

    // ====================================
    // Button State Management
    // ====================================
    
    setButtonLoading(buttonId, loading = true) {
        const button = document.getElementById(buttonId);
        if (button) {
            if (loading) {
                button.classList.add('loading');
                button.disabled = true;
                button.dataset.originalText = button.textContent;
                button.innerHTML = `<span class="spinner"></span> Loading...`;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
                if (button.dataset.originalText) {
                    button.textContent = button.dataset.originalText;
                }
            }
        }
    }
    
    setButtonSuccess(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('loading', 'error');
            button.classList.add('success');
            button.disabled = false;
            button.innerHTML = `✅ Success`;
        }
    }
    
    setButtonError(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('loading', 'success');
            button.classList.add('error');
            button.disabled = false;
            button.innerHTML = `❌ Failed`;
        }
    }
    
    resetButtonState(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('loading', 'success', 'error');
            button.disabled = false;
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
        }
    }

    destroy() {
        // Cleanup intervals
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        console.log('🧹 Popup cleanup completed');
    }
}

// ====================================
// Initialize Enhanced Popup
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    window.enhancedPopup = new EnhancedNamazPopup();
    
    // Cleanup when popup is closed
    window.addEventListener('beforeunload', () => {
        if (window.enhancedPopup) {
            window.enhancedPopup.destroy();
        }
    });
    
    // Handle escape key to close popup
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.close();
        }
    });
    
    console.log('🕌 Enhanced Islamic Namaz Companion Popup v4.0.0 - Ready');
});