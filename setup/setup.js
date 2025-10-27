// ====================================
// Islamic Namaz Companion - Enhanced Setup Manager v4.0.0
// Complete Onboarding Experience with Advanced Features
// ====================================

class EnhancedSetupManager {
    constructor() {
        this.version = '4.0.0';
        this.currentStep = 1;
        this.maxSteps = 4; // Increased to 4 steps
        this.selectedMode = null;
        this.detectedLocation = null;
        
        this.userData = {
            name: '',
            mode: '', // 'automatic' or 'manual'
            manualTimes: {},
            location: null,
            calculationMethod: 2, // ISNA by default
            notificationPreferences: {
                enabled: true,
                preReminders: true,
                playAzan: true
            }
        };
        
        this.init();
    }

    async init() {
        console.log(`🕌 Setup Manager v${this.version} - Initializing`);
        
        try {
            // Check if user is already set up
            await this.checkExistingSetup();
            
            // Bind events after DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.bindEvents());
            } else {
                this.bindEvents();
            }
            
            // Add version info to header
            this.addVersionInfo();
            
            console.log('✅ Setup manager initialized successfully');
        } catch (error) {
            console.error('❌ Setup initialization error:', error);
            this.showError('Failed to initialize setup. Please refresh the page.');
        }
    }

    addVersionInfo() {
        const header = document.querySelector('.setup-header p');
        if (header) {
            header.innerHTML = `Let's set up your personalized prayer experience<br><small style="opacity: 0.6;">Version ${this.version}</small>`;
        }
    }

    async checkExistingSetup() {
        try {
            const setupData = await this.getStorageData(['userSetupComplete', 'userName']);
            
            if (setupData.userSetupComplete && setupData.userName) {
                console.log('👤 User already set up, redirecting...');
                // Redirect to popup
                chrome.tabs.getCurrent().then(tab => {
                    chrome.tabs.update(tab.id, { url: chrome.runtime.getURL('popup.html') });
                }).catch(() => {
                    window.location.href = '../popup.html';
                });
            }
        } catch (error) {
            console.error('❌ Error checking setup status:', error);
        }
    }

    bindEvents() {
        console.log('🔗 Binding events...');
        
        // Name input validation
        const nameInput = document.getElementById('user-name');
        if (nameInput) {
            nameInput.addEventListener('input', () => this.validateNameInput());
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !document.getElementById('name-continue-btn').disabled) {
                    this.nextStep();
                }
            });
            nameInput.focus(); // Auto-focus name input
        }
        
        // Continue buttons
        this.bindButton('name-continue-btn', () => this.nextStep());
        this.bindButton('mode-continue', () => this.nextStep());
        this.bindButton('location-continue', () => this.nextStep());
        this.bindButton('finish-setup', () => this.finishSetup());
        
        // Mode selection
        document.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', () => {
                const mode = option.getAttribute('data-mode');
                this.selectMode(mode);
            });
        });
        
        // Back buttons
        document.querySelectorAll('.btn-secondary').forEach(btn => {
            btn.addEventListener('click', () => this.prevStep());
        });
        
        // Location detection button
        this.bindButton('detect-location-btn', () => this.detectLocation());
        this.bindButton('manual-location-btn', () => this.showManualLocationInput());
        
        // Manual time inputs validation
        this.bindManualTimeValidation();
        
        // Calculation method selection
        this.bindCalculationMethodSelection();
        
        // Notification preferences
        this.bindNotificationPreferences();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.currentStep > 1) this.prevStep();
            }
        });
        
        // Initial validation
        this.validateNameInput();
        
        console.log('✅ Events bound successfully');
    }

    bindButton(elementId, callback) {
        const button = document.getElementById(elementId);
        if (button) {
            button.addEventListener('click', callback);
            console.log(`✅ Setup button '${elementId}' bound successfully`);
        } else {
            console.error(`❌ Setup button '${elementId}' not found in DOM`);
        }
    }

    bindManualTimeValidation() {
        const timeInputs = ['fajr-time', 'dhuhr-time', 'asr-time', 'maghrib-time', 'isha-time'];
        timeInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', () => this.validateManualTimes());
            }
        });
    }

    bindCalculationMethodSelection() {
        const methodSelect = document.getElementById('calculation-method');
        if (methodSelect) {
            methodSelect.addEventListener('change', (e) => {
                this.userData.calculationMethod = parseInt(e.target.value);
            });
        }
    }

    bindNotificationPreferences() {
        const toggles = ['notifications-toggle', 'reminders-toggle', 'azan-toggle'];
        toggles.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.addEventListener('click', () => this.handleNotificationToggle(toggleId));
            }
        });
    }

    handleNotificationToggle(toggleId) {
        const toggle = document.getElementById(toggleId);
        const isActive = toggle.classList.contains('active');
        
        // Toggle state
        if (isActive) {
            toggle.classList.remove('active');
        } else {
            toggle.classList.add('active');
        }
        
        // Update preferences
        switch (toggleId) {
            case 'notifications-toggle':
                this.userData.notificationPreferences.enabled = !isActive;
                break;
            case 'reminders-toggle':
                this.userData.notificationPreferences.preReminders = !isActive;
                break;
            case 'azan-toggle':
                this.userData.notificationPreferences.playAzan = !isActive;
                break;
        }
    }

    validateNameInput() {
        const nameInput = document.getElementById('user-name');
        const name = nameInput ? nameInput.value.trim() : '';
        const continueBtn = document.getElementById('name-continue-btn');
        
        if (name.length >= 2) {
            continueBtn.disabled = false;
            continueBtn.style.opacity = '1';
            this.userData.name = name;
            this.hideError();
            
            // Add green border to indicate valid input
            nameInput.style.borderColor = 'rgba(74, 222, 128, 0.5)';
        } else {
            continueBtn.disabled = true;
            continueBtn.style.opacity = '0.5';
            nameInput.style.borderColor = name.length > 0 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.2)';
            
            if (name.length > 0 && name.length < 2) {
                this.showError('Name must be at least 2 characters long');
            } else {
                this.hideError();
            }
        }
    }

    selectMode(mode) {
        console.log('🎯 Mode selected:', mode);
        this.selectedMode = mode;
        this.userData.mode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[data-mode="${mode}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Enable continue button
        const continueBtn = document.getElementById('mode-continue');
        if (continueBtn) {
            continueBtn.disabled = false;
            continueBtn.style.opacity = '1';
        }
        
        this.hideError();
    }

    async detectLocation() {
        try {
            this.showLocationDetecting();
            
            // Use background service for location detection
            const response = await this.sendMessage({ type: 'DETECT_LOCATION' });
            
            if (response?.success) {
                // Get the detected location
                const location = await this.getStorageData('userLocation');
                
                if (location) {
                    this.detectedLocation = location;
                    this.showLocationSuccess(location);
                    this.enableLocationContinue();
                } else {
                    throw new Error('Location data not available');
                }
            } else {
                throw new Error(response?.error || 'Location detection failed');
            }
            
        } catch (error) {
            console.error('❌ Location detection failed:', error);
            this.showLocationError(error.message);
        }
    }

    showLocationDetecting() {
        const statusElement = document.getElementById('location-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <div class="spinner" style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p>🌍 Detecting your location...</p>
                </div>
            `;
        }
    }

    showLocationSuccess(location) {
        const statusElement = document.getElementById('location-status');
        const resultElement = document.getElementById('location-result');
        
        if (statusElement) {
            statusElement.innerHTML = `<p style="color: #86efac;">✅ Location detected successfully!</p>`;
        }
        
        if (resultElement) {
            resultElement.style.display = 'block';
            
            const detectedLocationEl = document.getElementById('detected-location');
            const detectedCoordsEl = document.getElementById('detected-coordinates');
            
            if (detectedLocationEl) {
                detectedLocationEl.textContent = `${location.city || 'Unknown City'}, ${location.country || 'Unknown Country'}`;
            }
            
            if (detectedCoordsEl) {
                detectedCoordsEl.textContent = `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`;
            }
        }
    }

    showLocationError(error) {
        const statusElement = document.getElementById('location-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div style="text-align: center;">
                    <p style="color: #fca5a5; margin-bottom: 15px;">❌ ${error}</p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn" id="retry-location" style="padding: 8px 16px; font-size: 14px;">Try Again</button>
                        <button class="btn btn-secondary" id="manual-location-btn" style="padding: 8px 16px; font-size: 14px;">Enter Manually</button>
                    </div>
                </div>
            `;
            
            // Bind retry button
            document.getElementById('retry-location')?.addEventListener('click', () => this.detectLocation());
            document.getElementById('manual-location-btn')?.addEventListener('click', () => this.showManualLocationInput());
        }
    }

    showManualLocationInput() {
        const statusElement = document.getElementById('location-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div style="text-align: center;">
                    <p style="margin-bottom: 15px;">📍 Enter your city name</p>
                    <div style="display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap;">
                        <input type="text" id="manual-location-input" placeholder="e.g., New York, London" 
                               style="padding: 8px 12px; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; background: rgba(255,255,255,0.1); color: white; min-width: 200px;">
                        <button class="btn" id="confirm-location" style="padding: 8px 16px; font-size: 14px;">Confirm</button>
                    </div>
                </div>
            `;
            
            const input = document.getElementById('manual-location-input');
            const confirmBtn = document.getElementById('confirm-location');
            
            input?.focus();
            input?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && input.value.trim()) {
                    confirmBtn?.click();
                }
            });
            
            confirmBtn?.addEventListener('click', () => this.processManualLocation());
        }
    }

    async processManualLocation() {
        const input = document.getElementById('manual-location-input');
        const city = input?.value.trim();
        
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }
        
        try {
            this.showLocationDetecting();
            
            // Geocode the city name
            const coords = await this.geocodeCityName(city);
            
            if (coords) {
                const location = {
                    lat: coords.latitude,
                    lng: coords.longitude,
                    city: coords.city || city,
                    country: coords.country || 'Unknown',
                    accuracy: 1000, // Approximate accuracy for manual entry
                    timestamp: Date.now()
                };
                
                // Store location
                await this.setStorageData('userLocation', location);
                
                this.detectedLocation = location;
                this.showLocationSuccess(location);
                this.enableLocationContinue();
            } else {
                throw new Error(`Could not find "${city}". Please try a different city name.`);
            }
            
        } catch (error) {
            this.showLocationError(error.message);
        }
    }

    async geocodeCityName(cityName) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`,
                {
                    headers: {
                        'User-Agent': 'Islamic-Namaz-Companion/4.0.0'
                    }
                }
            );
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const result = data[0];
                return {
                    latitude: parseFloat(result.lat),
                    longitude: parseFloat(result.lon),
                    city: result.display_name.split(',')[0],
                    country: result.display_name.split(',').pop().trim()
                };
            }
            
            return null;
        } catch (error) {
            console.error('❌ Geocoding failed:', error);
            return null;
        }
    }

    enableLocationContinue() {
        const continueBtn = document.getElementById('location-continue');
        if (continueBtn) {
            continueBtn.disabled = false;
            continueBtn.style.opacity = '1';
        }
    }

    validateManualTimes() {
        const times = {
            fajr: document.getElementById('fajr-time')?.value,
            dhuhr: document.getElementById('dhuhr-time')?.value,
            asr: document.getElementById('asr-time')?.value,
            maghrib: document.getElementById('maghrib-time')?.value,
            isha: document.getElementById('isha-time')?.value
        };
        
        const allTimesSet = Object.values(times).every(time => time && time.trim());
        
        const finishBtn = document.getElementById('finish-setup');
        if (finishBtn) {
            finishBtn.disabled = !allTimesSet;
            finishBtn.style.opacity = allTimesSet ? '1' : '0.5';
        }
        
        if (allTimesSet) {
            this.userData.manualTimes = times;
        }
        
        return allTimesSet;
    }

    nextStep() {
        console.log('🔄 Moving to next step, current:', this.currentStep);
        
        if (!this.validateCurrentStep()) {
            console.log('❌ Step validation failed');
            return;
        }

        this.currentStep++;
        this.updateStepDisplay();
        this.updateProgressIndicator();
        this.handleStepSpecificLogic();
        
        console.log('✅ Moved to step:', this.currentStep);
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            this.updateProgressIndicator();
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                const nameInput = document.getElementById('user-name');
                const currentName = nameInput ? nameInput.value.trim() : '';
                
                if (currentName) {
                    this.userData.name = currentName;
                }
                
                if (!this.userData.name || this.userData.name.length < 2) {
                    this.showError('Please enter your name (at least 2 characters)');
                    return false;
                }
                break;
                
            case 2:
                if (!this.selectedMode) {
                    this.showError('Please select a prayer time mode');
                    return false;
                }
                break;
                
            case 3:
                if (this.selectedMode === 'automatic') {
                    if (!this.detectedLocation) {
                        this.showError('Please detect your location first');
                        return false;
                    }
                } else if (this.selectedMode === 'manual') {
                    if (!this.validateManualTimes()) {
                        this.showError('Please set all prayer times');
                        return false;
                    }
                }
                break;
        }
        
        this.hideError();
        return true;
    }

    handleStepSpecificLogic() {
        switch (this.currentStep) {
            case 3:
                this.setupStep3();
                break;
            case 4:
                this.setupStep4();
                break;
        }
    }

    setupStep3() {
        if (this.selectedMode === 'automatic') {
            document.getElementById('manual-times').style.display = 'none';
            document.getElementById('automatic-location').style.display = 'block';
            
            // Auto-start location detection
            setTimeout(() => this.detectLocation(), 500);
        } else {
            document.getElementById('automatic-location').style.display = 'none';
            document.getElementById('manual-times').classList.add('active');
            this.validateManualTimes();
        }
    }

    setupStep4() {
        // Set default values for notification toggles
        const toggles = ['notifications-toggle', 'reminders-toggle', 'azan-toggle'];
        toggles.forEach((toggleId, index) => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                // Set default active state
                toggle.classList.add('active');
            }
        });
        
        // Set default calculation method
        const methodSelect = document.getElementById('calculation-method');
        if (methodSelect) {
            methodSelect.value = '2'; // ISNA
            this.userData.calculationMethod = 2;
        }
    }

    updateStepDisplay() {
        // Hide all steps
        document.querySelectorAll('.setup-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStepElement = document.getElementById(`step-${this.currentStep}`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }
    }

    updateProgressIndicator() {
        document.querySelectorAll('.progress-dot').forEach((dot, index) => {
            if (index < this.currentStep) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    async finishSetup() {
        try {
            this.showLoading('Saving your preferences...');
            
            // Save user data
            await this.setStorageData('userName', this.userData.name);
            await this.setStorageData('prayerMode', this.userData.mode);
            await this.setStorageData('calculationMethod', this.userData.calculationMethod);
            await this.setStorageData('notificationSettings', this.userData.notificationPreferences);
            
            if (this.userData.mode === 'manual') {
                await this.setStorageData('manualPrayerTimes', this.userData.manualTimes);
                
                // Notify background service to schedule manual times
                await this.sendMessage({
                    type: 'UPDATE_PRAYER_TIMES',
                    prayerTimes: this.userData.manualTimes,
                    mode: 'manual'
                });
            }
            
            if (this.detectedLocation) {
                await this.setStorageData('userLocation', this.detectedLocation);
            }
            
            // Mark setup as complete
            await this.setStorageData('userSetupComplete', true);
            await this.setStorageData('setupCompletedAt', Date.now());
            
            this.showSuccess('Setup completed successfully!');
            
            // Redirect to popup after a short delay
            setTimeout(() => {
                chrome.tabs.getCurrent().then(tab => {
                    chrome.tabs.update(tab.id, { url: chrome.runtime.getURL('popup.html') });
                }).catch(() => {
                    window.location.href = '../popup.html';
                });
            }, 1500);
            
        } catch (error) {
            console.error('❌ Setup completion failed:', error);
            this.showError('Failed to save setup. Please try again.');
        }
    }

    // ====================================
    // Utility Functions
    // ====================================

    async sendMessage(message) {
        try {
            return await chrome.runtime.sendMessage(message);
        } catch (error) {
            console.error('❌ Message sending failed:', error);
            throw new Error('Communication with background service failed');
        }
    }

    async getStorageData(keys) {
        try {
            const syncResult = await chrome.storage.sync.get(keys);
            const localResult = await chrome.storage.local.get(keys);
            return { ...localResult, ...syncResult };
        } catch (error) {
            console.error('❌ Storage access failed:', error);
            return {};
        }
    }

    async setStorageData(key, value) {
        try {
            await chrome.storage.sync.set({ [key]: value });
        } catch (error) {
            // Fallback to local storage
            await chrome.storage.local.set({ [key]: value });
        }
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    hideError() {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    showSuccess(message) {
        const successElement = document.getElementById('success-message');
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
        }
    }

    showLoading(message) {
        // You can implement a loading overlay here
        console.log('⏳', message);
    }
}

// ====================================
// Initialize Enhanced Setup Manager
// ====================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.setupManager = new EnhancedSetupManager();
    });
} else {
    window.setupManager = new EnhancedSetupManager();
}

console.log('🕌 Enhanced Islamic Namaz Companion Setup v4.0.0 - Ready');