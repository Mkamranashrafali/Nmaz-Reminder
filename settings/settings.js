// ====================================
// Islamic Namaz Companion - Enhanced Settings Manager v4.0.0
// Complete Settings Management with Advanced Features
// ====================================

class AdvancedSettingsManager {
    constructor() {
        this.version = '4.0.0';
        this.currentTab = 'general';
        this.audioPreview = null;
        this.customAzanData = null;
        
        this.defaultSettings = {
            // Personal Settings
            userName: '',
            calculationMethod: 2, // ISNA by default
            
            // Prayer Time Settings
            prayerMode: 'automatic',
            manualPrayerTimes: {
                fajr: '05:00',
                dhuhr: '12:30',
                asr: '16:00',
                maghrib: '18:30',
                isha: '20:00'
            },
            
            // Notification Settings
            notificationSettings: {
                enabled: true,
                preReminders: true,
                preReminderTime: 15,
                persistent: false,
                playAzan: true,
                azanVolume: 70
            },
            
            // Overlay Settings
            overlaySettings: {
                enabled: true,
                duration: 900000, // 15 minutes
                textSpeed: 30000, // 30 seconds
                showBreathingGuide: true
            },
            
            // Custom Azan
            customAzan: null,
            
            // Advanced Settings
            autoRefresh: true,
            crossDeviceSync: true,
            debugMode: false
        };
        
        this.init();
    }

    async init() {
        console.log(`🕌 Settings Manager v${this.version} - Initializing`);
        
        await this.loadAllSettings();
        this.setupTabNavigation();
        this.bindAllEvents();
        this.updateLocationStatus();
        this.updateExtensionInfo();
        
        console.log('✅ Settings manager initialized successfully');
    }

    // ====================================
    // Tab Navigation System
    // ====================================
    
    setupTabNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const tabContents = document.querySelectorAll('.tab-content');
        
        navItems.forEach(navItem => {
            navItem.addEventListener('click', () => {
                const tabId = navItem.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }
    
    switchTab(tabId) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // Update tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        this.currentTab = tabId;
        
        // Load tab-specific data
        this.loadTabData(tabId);
    }
    
    async loadTabData(tabId) {
        switch (tabId) {
            case 'general':
                await this.updateLocationStatus();
                break;
            case 'azan':
                await this.loadAzanList();
                break;
            case 'advanced':
                await this.updateExtensionInfo();
                break;
        }
    }

    // ====================================
    // Settings Loading and Saving
    // ====================================
    
    async loadAllSettings() {
        try {
            const settings = await this.getMultipleStorageData(Object.keys(this.defaultSettings));
            
            // Merge with defaults
            const mergedSettings = { ...this.defaultSettings, ...settings };
            
            // Update UI elements
            await this.updateUIFromSettings(mergedSettings);
            
            console.log('📊 All settings loaded successfully');
        } catch (error) {
            console.error('❌ Error loading settings:', error);
            this.showAlert('Failed to load settings. Using defaults.', 'warning');
        }
    }
    
    async updateUIFromSettings(settings) {
        // General Tab
        this.setValue('user-name', settings.userName);
        this.setValue('calculation-method', settings.calculationMethod);
        this.setValue('prayer-mode', settings.prayerMode);
        this.updatePrayerTimesVisibility(settings.prayerMode);
        
        // Prayer Times
        if (settings.manualPrayerTimes) {
            this.setValue('fajr-time', settings.manualPrayerTimes.fajr);
            this.setValue('dhuhr-time', settings.manualPrayerTimes.dhuhr);
            this.setValue('asr-time', settings.manualPrayerTimes.asr);
            this.setValue('maghrib-time', settings.manualPrayerTimes.maghrib);
            this.setValue('isha-time', settings.manualPrayerTimes.isha);
        }
        
        // Notifications
        if (settings.notificationSettings) {
            this.updateToggle('notifications-toggle', settings.notificationSettings.enabled);
            this.updateToggle('pre-reminders-toggle', settings.notificationSettings.preReminders);
            this.setValue('reminder-time', settings.notificationSettings.preReminderTime);
            this.updateToggle('persistent-notifications-toggle', settings.notificationSettings.persistent);
            this.updateToggle('azan-toggle', settings.notificationSettings.playAzan);
            this.setValue('azan-volume', settings.notificationSettings.azanVolume);
            this.updateVolumeDisplay(settings.notificationSettings.azanVolume);
        }
        
        // Overlay Settings
        if (settings.overlaySettings) {
            this.updateToggle('overlay-toggle', settings.overlaySettings.enabled);
            this.setValue('overlay-duration', settings.overlaySettings.duration);
            this.setValue('content-speed', settings.overlaySettings.textSpeed);
            this.updateToggle('breathing-guide-toggle', settings.overlaySettings.showBreathingGuide);
        }
        
        // Advanced Settings
        this.updateToggle('auto-refresh-toggle', settings.autoRefresh);
        this.updateToggle('sync-toggle', settings.crossDeviceSync);
        this.updateToggle('debug-toggle', settings.debugMode);
        
        // Custom Azan
        // Will be loaded when Azan tab is selected
    }

    // ====================================
    // Event Binding
    // ====================================
    
    bindAllEvents() {
        // General Tab Events
        this.bindInput('user-name', 'userName');
        this.bindSelect('calculation-method', 'calculationMethod');
        this.bindSelect('prayer-mode', 'prayerMode', (value) => {
            this.updatePrayerTimesVisibility(value);
        });
        
        this.bindButton('update-location', () => this.updateLocation());
        this.bindButton('manual-location', () => this.setManualLocation());
        
        // Prayer Times Events
        this.bindButton('save-prayer-times', () => this.savePrayerTimes());
        this.bindButton('reset-prayer-times', () => this.resetPrayerTimes());
        this.bindButton('test-prayer-time', () => this.testPrayerTime());
        
        // Notification Events
        this.bindToggle('notifications-toggle', 'notificationSettings.enabled');
        this.bindToggle('pre-reminders-toggle', 'notificationSettings.preReminders');
        this.bindSelect('reminder-time', 'notificationSettings.preReminderTime');
        this.bindToggle('persistent-notifications-toggle', 'notificationSettings.persistent');
        this.bindToggle('azan-toggle', 'notificationSettings.playAzan');
        this.bindRange('azan-volume', 'notificationSettings.azanVolume', (value) => {
            this.updateVolumeDisplay(value);
        });
        this.bindButton('test-azan', () => this.testAzan());
        
        // Custom Azan Events
        this.bindAzanSelectionEvents();
        this.bindAzanUploadEvents();
        
        // Overlay Events
        this.bindToggle('overlay-toggle', 'overlaySettings.enabled');
        this.bindSelect('overlay-duration', 'overlaySettings.duration');
        this.bindSelect('content-speed', 'overlaySettings.textSpeed');
        this.bindToggle('breathing-guide-toggle', 'overlaySettings.showBreathingGuide');
        this.bindButton('test-overlay', () => this.testOverlay());
        this.bindButton('preview-overlay', () => this.previewOverlay());
        
        // Advanced Events
        this.bindToggle('auto-refresh-toggle', 'autoRefresh');
        this.bindToggle('sync-toggle', 'crossDeviceSync');
        this.bindToggle('debug-toggle', 'debugMode');
        
        this.bindButton('refresh-location', () => this.refreshLocation());
        this.bindButton('clear-cache', () => this.clearCache());
        this.bindButton('reset-settings', () => this.resetAllSettings());
        this.bindButton('export-settings', () => this.exportSettings());
        this.bindButton('import-settings', () => this.importSettings());
        this.bindButton('view-logs', () => this.viewLogs());
    }
    
    bindInput(elementId, settingPath, callback = null) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('input', async () => {
                await this.saveSetting(settingPath, element.value);
                if (callback) callback(element.value);
            });
            console.log(`✅ Input '${elementId}' bound successfully`);
        } else {
            console.error(`❌ Input '${elementId}' not found in DOM`);
        }
    }
    
    bindSelect(elementId, settingPath, callback = null) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', async () => {
                const value = element.type === 'number' ? Number(element.value) : element.value;
                await this.saveSetting(settingPath, value);
                if (callback) callback(value);
            });
        }
    }
    
    bindRange(elementId, settingPath, callback = null) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('input', async () => {
                const value = Number(element.value);
                await this.saveSetting(settingPath, value);
                if (callback) callback(value);
            });
        }
    }
    
    bindToggle(elementId, settingPath) {
        const toggle = document.getElementById(elementId);
        if (toggle) {
            toggle.addEventListener('click', async () => {
                const isActive = toggle.classList.contains('active');
                const newValue = !isActive;
                
                this.updateToggle(elementId, newValue);
                await this.saveSetting(settingPath, newValue);
            });
            console.log(`✅ Toggle '${elementId}' bound successfully`);
        } else {
            console.error(`❌ Toggle '${elementId}' not found in DOM`);
        }
    }
    
    bindButton(elementId, callback) {
        const button = document.getElementById(elementId);
        if (button) {
            button.addEventListener('click', callback);
            console.log(`✅ Settings button '${elementId}' bound successfully`);
        } else {
            console.error(`❌ Settings button '${elementId}' not found in DOM`);
        }
    }

    // ====================================
    // Azan Selection Management
    // ====================================
    
    bindAzanSelectionEvents() {
        this.bindButton('test-current-azan', () => this.testCurrentAzan());
        
        // Load Azan list when tab is opened
        document.querySelector('[data-tab="azan"]')?.addEventListener('click', () => {
            this.loadAzanList();
        });
    }
    
    async loadAzanList() {
        try {
            console.log('🎵 Loading Azan list...');
            
            // Show loading
            const azanList = document.getElementById('azan-list');
            if (azanList) {
                azanList.innerHTML = '<div class="loading-message">🔄 Loading available Azans...</div>';
            }
            
            // Get available Azans from background script
            const response = await chrome.runtime.sendMessage({ type: 'GET_AVAILABLE_AZANS' });
            
            if (response?.success && response.azans) {
                await this.displayAzanList(response.azans);
                await this.updateCurrentAzanDisplay();
            } else {
                throw new Error('Failed to load Azan list');
            }
            
        } catch (error) {
            console.error('❌ Error loading Azan list:', error);
            const azanList = document.getElementById('azan-list');
            if (azanList) {
                azanList.innerHTML = '<div class="loading-message">❌ Failed to load Azans. Please try again.</div>';
            }
        }
    }
    
    async displayAzanList(azans) {
        const azanList = document.getElementById('azan-list');
        if (!azanList) return;
        
        const selectedAzan = await this.getStorageData('selectedAzan') || 'default_adhan';
        
        let html = '';
        
        for (const azan of azans) {
            const isSelected = azan.id === selectedAzan;
            const icon = azan.type === 'default' ? '🎵' : '📁';
            
            // Format details based on type
            let details = '';
            if (azan.type === 'default') {
                details = 'Built-in Azan';
            } else {
                const sizeKB = Math.round(azan.size / 1024);
                const duration = Math.round(azan.duration || 0);
                details = `${sizeKB} KB • ${duration}s • Custom`;
            }
            
            html += `
                <div class="azan-item ${isSelected ? 'selected' : ''}" data-azan-id="${azan.id}">
                    <div class="azan-item-icon">${icon}</div>
                    <div class="azan-item-info">
                        <div class="azan-item-name">${azan.name}</div>
                        <div class="azan-item-description">${azan.description}</div>
                        <div class="azan-item-details">${details}</div>
                    </div>
                    <div class="azan-item-actions">
                        ${!isSelected ? '<button class="btn btn-info btn-sm select-azan-btn" data-azan-id="' + azan.id + '">✓ Select</button>' : '<span class="btn btn-success btn-sm">✓ Selected</span>'}
                        <button class="btn btn-secondary btn-sm preview-azan-btn" data-azan-id="${azan.id}">▶️ Preview</button>
                        ${azan.type === 'custom' ? '<button class="btn btn-danger btn-sm remove-azan-btn" data-azan-id="' + azan.id + '">🗑️ Remove</button>' : ''}
                    </div>
                </div>
            `;
        }
        
        azanList.innerHTML = html;
        
        // Bind events for the new items
        this.bindAzanListEvents();
    }
    
    bindAzanListEvents() {
        // Select Azan buttons
        document.querySelectorAll('.select-azan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const azanId = btn.getAttribute('data-azan-id');
                this.selectAzan(azanId);
            });
        });
        
        // Preview Azan buttons
        document.querySelectorAll('.preview-azan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const azanId = btn.getAttribute('data-azan-id');
                this.previewAzanById(azanId);
            });
        });
        
        // Remove Azan buttons
        document.querySelectorAll('.remove-azan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const azanId = btn.getAttribute('data-azan-id');
                this.removeAzanById(azanId);
            });
        });
        
        // Click on item to select
        document.querySelectorAll('.azan-item').forEach(item => {
            item.addEventListener('click', () => {
                const azanId = item.getAttribute('data-azan-id');
                if (!item.classList.contains('selected')) {
                    this.selectAzan(azanId);
                }
            });
        });
    }
    
    async selectAzan(azanId) {
        try {
            console.log(`🎵 Selecting Azan: ${azanId}`);
            
            // Update in background script
            const response = await chrome.runtime.sendMessage({
                type: 'SET_SELECTED_AZAN',
                azanId: azanId
            });
            
            if (response?.success) {
                this.showAlert(`✅ Azan selected successfully!`, 'success');
                
                // Refresh the list to show new selection
                await this.loadAzanList();
                await this.updateCurrentAzanDisplay();
            } else {
                throw new Error('Failed to select Azan');
            }
        } catch (error) {
            console.error('❌ Error selecting Azan:', error);
            this.showAlert('❌ Failed to select Azan', 'danger');
        }
    }
    
    async previewAzanById(azanId) {
        try {
            console.log(`🔊 Previewing Azan: ${azanId}`);
            
            // For now, use the test Azan functionality from background script
            const response = await chrome.runtime.sendMessage({ type: 'TEST_AZAN' });
            
            if (response?.success) {
                this.showAlert('🔊 Azan preview playing...', 'success');
            } else {
                throw new Error('Failed to preview Azan');
            }
        } catch (error) {
            console.error('❌ Error previewing Azan:', error);
            this.showAlert('❌ Failed to preview Azan', 'danger');
        }
    }
    
    async removeAzanById(azanId) {
        if (!confirm('Are you sure you want to remove this custom Azan? This action cannot be undone.')) {
            return;
        }
        
        try {
            console.log(`🗑️ Removing Azan: ${azanId}`);
            
            const response = await chrome.runtime.sendMessage({
                type: 'REMOVE_CUSTOM_AZAN',
                azanId: azanId
            });
            
            if (response?.success) {
                this.showAlert('✅ Custom Azan removed successfully!', 'success');
                
                // Refresh the list
                await this.loadAzanList();
                await this.updateCurrentAzanDisplay();
            } else {
                throw new Error('Failed to remove Azan');
            }
        } catch (error) {
            console.error('❌ Error removing Azan:', error);
            this.showAlert('❌ Failed to remove Azan', 'danger');
        }
    }
    
    async updateCurrentAzanDisplay() {
        try {
            const selectedAzan = await this.getStorageData('selectedAzan') || 'default_adhan';
            const response = await chrome.runtime.sendMessage({ type: 'GET_AVAILABLE_AZANS' });
            
            if (response?.success && response.azans) {
                const currentAzan = response.azans.find(azan => azan.id === selectedAzan);
                const nameElement = document.getElementById('current-azan-name');
                
                if (nameElement) {
                    if (currentAzan) {
                        nameElement.textContent = `${currentAzan.name} (${currentAzan.type === 'default' ? 'Built-in' : 'Custom'})`;
                    } else {
                        nameElement.textContent = 'Default Azan (Built-in)';
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error updating current Azan display:', error);
        }
    }
    
    async testCurrentAzan() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'TEST_AZAN' });
            
            if (response?.success) {
                this.showAlert('🔊 Current Azan playing...', 'success');
            } else {
                throw new Error('Failed to test current Azan');
            }
        } catch (error) {
            console.error('❌ Error testing current Azan:', error);
            this.showAlert('❌ Failed to test current Azan', 'danger');
        }
    }

    // ====================================
    // Custom Azan Management
    // ====================================
    
    bindAzanUploadEvents() {
        const uploadArea = document.getElementById('azan-upload-area');
        const fileInput = document.getElementById('azan-file-input');
        
        // Click to upload
        uploadArea?.addEventListener('click', () => {
            fileInput?.click();
        });
        
        // File selection
        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleAzanFile(e.target.files[0]);
            }
        });
        
        // Drag and drop
        uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea?.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                this.handleAzanFile(e.dataTransfer.files[0]);
            }
        });
        
        // Preview controls
        this.bindButton('preview-azan', () => this.playUploadPreview());
        this.bindButton('upload-azan', () => this.uploadCurrentAzan());
        this.bindButton('cancel-upload', () => this.cancelUpload());
    }
    
    async handleAzanFile(file) {
        try {
            // Validate file
            if (!file.type.startsWith('audio/')) {
                this.showAlert('Please select an audio file (MP3 or WAV)', 'danger');
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                this.showAlert('File size must be less than 10MB', 'danger');
                return;
            }
            
            // Show loading
            this.showAlert('Processing audio file...', 'info');
            
            // Convert to base64
            const base64Data = await this.fileToBase64(file);
            
            // Create azan data object
            this.pendingAzanData = {
                name: file.name,
                size: file.size,
                type: file.type,
                data: base64Data,
                duration: await this.getAudioDuration(base64Data)
            };
            
            // Update UI for preview
            this.updateUploadPreview();
            
            this.showAlert('Audio file ready for upload! Preview it first, then click Upload.', 'success');
            
        } catch (error) {
            console.error('❌ Error processing Azan file:', error);
            this.showAlert('Failed to process audio file. Please try again.', 'danger');
        }
    }
    
    updateUploadPreview() {
        const preview = document.getElementById('azan-preview');
        const filename = document.getElementById('azan-filename');
        const fileinfo = document.getElementById('azan-fileinfo');
        
        if (this.pendingAzanData) {
            preview?.classList.add('active');
            if (filename) filename.textContent = this.pendingAzanData.name;
            if (fileinfo) {
                const sizeKB = Math.round(this.pendingAzanData.size / 1024);
                const duration = Math.round(this.pendingAzanData.duration);
                fileinfo.textContent = `${sizeKB} KB • ${duration}s • Ready to upload`;
            }
            
            // Set up audio preview
            const previewAudio = document.getElementById('preview-audio');
            if (previewAudio) {
                previewAudio.src = this.pendingAzanData.data;
            }
        } else {
            preview?.classList.remove('active');
        }
    }
    
    playUploadPreview() {
        try {
            if (!this.pendingAzanData) {
                this.showAlert('No file selected for preview', 'warning');
                return;
            }
            
            let audio = document.getElementById('preview-audio');
            if (!audio) {
                // Create audio element if it doesn't exist
                audio = document.createElement('audio');
                audio.id = 'preview-audio';
                audio.src = this.pendingAzanData.data;
                audio.style.display = 'none';
                document.body.appendChild(audio);
            }
            
            // Set volume from settings
            const volume = document.getElementById('azan-volume')?.value || 70;
            audio.volume = volume / 100;
            
            // Play with error handling
            audio.play().then(() => {
                this.showAlert('🔊 Playing upload preview...', 'success');
                console.log('✅ Upload preview playing');
            }).catch(error => {
                console.error('❌ Audio playback failed:', error);
                this.showAlert('❌ Failed to play audio. Check your browser permissions.', 'danger');
            });
            
        } catch (error) {
            console.error('❌ Error in playUploadPreview:', error);
            this.showAlert('❌ Failed to preview audio', 'danger');
        }
    }
    
    async uploadCurrentAzan() {
        try {
            if (!this.pendingAzanData) {
                this.showAlert('No file selected for upload', 'warning');
                return;
            }
            
            const button = document.getElementById('upload-azan');
            if (button) {
                button.textContent = '⏳ Uploading...';
                button.disabled = true;
            }
            
            // Add to background script's custom Azans
            const response = await chrome.runtime.sendMessage({
                type: 'ADD_CUSTOM_AZAN',
                azanData: this.pendingAzanData
            });
            
            if (response?.success) {
                this.showAlert('✅ Custom Azan uploaded successfully!', 'success');
                
                // Clear pending data and hide preview
                this.pendingAzanData = null;
                this.updateUploadPreview();
                
                // Refresh the Azan list
                await this.loadAzanList();
                
                // Clear file input
                const fileInput = document.getElementById('azan-file-input');
                if (fileInput) fileInput.value = '';
                
            } else {
                throw new Error('Failed to upload Azan');
            }
            
        } catch (error) {
            console.error('❌ Error uploading Azan:', error);
            this.showAlert('❌ Failed to upload Azan', 'danger');
        } finally {
            // Reset button
            const button = document.getElementById('upload-azan');
            if (button) {
                button.textContent = '📤 Upload';
                button.disabled = false;
            }
        }
    }
    
    cancelUpload() {
        this.pendingAzanData = null;
        this.updateUploadPreview();
        
        // Clear file input
        const fileInput = document.getElementById('azan-file-input');
        if (fileInput) fileInput.value = '';
        
        this.showAlert('Upload cancelled', 'info');
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    getAudioDuration(base64Data) {
        return new Promise((resolve) => {
            const audio = new Audio(base64Data);
            audio.addEventListener('loadedmetadata', () => {
                resolve(audio.duration);
            });
            audio.addEventListener('error', () => {
                resolve(30); // Default 30 seconds if can't determine
            });
        });
    }

    // ====================================
    // Location Management
    // ====================================
    
    async updateLocationStatus() {
        try {
            const location = await this.getStorageData('userLocation');
            const lastUpdate = await this.getStorageData('lastLocationUpdate');
            
            const statusIndicator = document.getElementById('location-status');
            const locationText = document.getElementById('location-text');
            const locationDetails = document.getElementById('location-details');
            
            if (location) {
                statusIndicator?.classList.remove('inactive');
                if (locationText) {
                    locationText.textContent = location.city ? 
                        `${location.city}, ${location.country}` : 
                        `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
                }
                if (locationDetails) {
                    const updateTime = lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Unknown';
                    locationDetails.textContent = `Last updated: ${updateTime} • Accuracy: ${location.accuracy ? Math.round(location.accuracy) + 'm' : 'Unknown'}`;
                }
            } else {
                statusIndicator?.classList.add('inactive');
                if (locationText) locationText.textContent = 'Location not detected';
                if (locationDetails) locationDetails.textContent = 'Click "Update Location" to detect your current location automatically';
            }
        } catch (error) {
            console.error('❌ Error updating location status:', error);
        }
    }
    
    async updateLocation() {
        const button = document.getElementById('update-location');
        if (!button) return;
        
        const originalText = button.textContent;
        
        try {
            button.textContent = '🔄 Detecting...';
            button.disabled = true;
            
            // Request location from background script
            const response = await chrome.runtime.sendMessage({
                type: 'DETECT_LOCATION'
            });
            
            if (response.success) {
                await this.updateLocationStatus();
                this.showAlert('Location updated successfully!', 'success');
            } else {
                throw new Error(response.error || 'Failed to detect location');
            }
            
        } catch (error) {
            console.error('❌ Error updating location:', error);
            this.showAlert('Failed to detect location. Please check permissions and try again.', 'danger');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }
    
    async setManualLocation() {
        const city = prompt('Enter city name (e.g., "New York, USA"):');
        if (!city) return;
        
        try {
            // Here you would typically geocode the city name
            // For now, we'll use a simple implementation
            this.showAlert('Manual location setting will be implemented in the next update', 'info');
        } catch (error) {
            this.showAlert('Failed to set manual location', 'danger');
        }
    }

    // ====================================
    // Prayer Times Management
    // ====================================
    
    updatePrayerTimesVisibility(mode) {
        const container = document.getElementById('prayer-times-container');
        if (container) {
            container.style.display = mode === 'manual' ? 'block' : 'none';
        }
    }
    
    async savePrayerTimes() {
        const prayerTimes = {
            fajr: this.getValue('fajr-time'),
            dhuhr: this.getValue('dhuhr-time'),
            asr: this.getValue('asr-time'),
            maghrib: this.getValue('maghrib-time'),
            isha: this.getValue('isha-time')
        };
        
        // Validate times
        const emptyTimes = Object.entries(prayerTimes).filter(([_, time]) => !time);
        if (emptyTimes.length > 0) {
            this.showAlert('Please set all prayer times before saving.', 'warning');
            return;
        }
        
        try {
            await this.saveSetting('manualPrayerTimes', prayerTimes);
            
            // Notify background script
            const response = await chrome.runtime.sendMessage({
                type: 'UPDATE_PRAYER_TIMES',
                prayerTimes: prayerTimes,
                mode: 'manual'
            });
            
            if (response?.success) {
                this.showAlert('Prayer times saved successfully!', 'success');
            } else {
                throw new Error('Failed to update prayer schedules');
            }
        } catch (error) {
            console.error('❌ Error saving prayer times:', error);
            this.showAlert('Failed to save prayer times. Please try again.', 'danger');
        }
    }
    
    resetPrayerTimes() {
        const defaults = this.defaultSettings.manualPrayerTimes;
        
        this.setValue('fajr-time', defaults.fajr);
        this.setValue('dhuhr-time', defaults.dhuhr);
        this.setValue('asr-time', defaults.asr);
        this.setValue('maghrib-time', defaults.maghrib);
        this.setValue('isha-time', defaults.isha);
        
        this.showAlert('Prayer times reset to defaults. Click "Save Prayer Times" to apply.', 'info');
    }
    
    async testPrayerTime() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'TEST_PRAYER_TIME'
            });
            
            if (response?.success) {
                this.showAlert('Test prayer notification will appear in 5 seconds!', 'success');
            } else {
                throw new Error('Failed to trigger test');
            }
        } catch (error) {
            console.error('❌ Error testing prayer time:', error);
            this.showAlert('Failed to test prayer notification', 'danger');
        }
    }

    // ====================================
    // Testing Functions
    // ====================================
    
    async testAzan() {
        try {
            const button = document.getElementById('test-azan');
            if (button) {
                button.textContent = '🔊 Playing...';
                button.disabled = true;
            }
            
            console.log('🔊 Testing Azan via background script');
            // Get azan data from background script
            const response = await chrome.runtime.sendMessage({
                type: 'TEST_AZAN'
            });
            
            if (response?.success && response.azanData) {
                await this.playAzanInSettings(response.azanData);
                this.showAlert('🔊 Test Azan playing...', 'success');
            } else {
                throw new Error('Failed to get Azan data');
            }
            
            // Reset button
            if (button) {
                button.textContent = '🔊 Test Audio';
                button.disabled = false;
            }
        } catch (error) {
            console.error('❌ Error testing Azan:', error);
            this.showAlert('❌ Failed to test Azan. Check audio settings.', 'danger');
            
            // Reset button
            const button = document.getElementById('test-azan');
            if (button) {
                button.textContent = '🔊 Test Audio';
                button.disabled = false;
            }
        }
    }

    async playAzanInSettings(azanData) {
        try {
            // Create or get audio element
            let audioElement = document.getElementById('test-azan-audio');
            if (!audioElement) {
                audioElement = document.createElement('audio');
                audioElement.id = 'test-azan-audio';
                audioElement.style.display = 'none';
                document.body.appendChild(audioElement);
            }

            // Set audio source and volume
            audioElement.src = azanData.data;
            const volume = document.getElementById('azan-volume')?.value || 70;
            audioElement.volume = volume / 100;
            audioElement.loop = false;

            // Play audio
            await audioElement.play();
            console.log('✅ Azan playing in settings');

            // Clean up after playing
            audioElement.onended = () => {
                audioElement.remove();
            };

        } catch (error) {
            console.error('❌ Failed to play Azan in settings:', error);
            throw error;
        }
    }
    
    async testOverlay() {
        try {
            const button = document.getElementById('test-overlay');
            if (button) {
                button.textContent = '⏳ Showing...';
                button.disabled = true;
            }
            
            console.log('🖥️ Testing overlay...');
            
            const response = await chrome.runtime.sendMessage({
                type: 'TEST_OVERLAY',
                duration: 10000 // 10 seconds for testing
            });
            
            if (response?.success) {
                this.showAlert('✅ Test overlay will appear for 10 seconds!', 'success');
                
                // Reset button after overlay duration
                setTimeout(() => {
                    if (button) {
                        button.textContent = '🖥️ Test Overlay';
                        button.disabled = false;
                    }
                }, 12000); // 12 seconds to account for overlay + buffer
            } else {
                throw new Error(response?.error || 'Failed to show test overlay');
            }
        } catch (error) {
            console.error('❌ Error testing overlay:', error);
            this.showAlert('❌ Failed to test overlay. Try refreshing some web pages first.', 'danger');
            
            // Reset button
            const button = document.getElementById('test-overlay');
            if (button) {
                button.textContent = '🖥️ Test Overlay';
                button.disabled = false;
            }
        }
    }
    
    async previewOverlay() {
        try {
            const button = document.getElementById('preview-overlay');
            if (button) {
                button.textContent = '🔄 Opening...';
                button.disabled = true;
            }
            
            // Create a new tab with overlay preview (using Dhuhr as default for preview)
            const previewUrl = chrome.runtime.getURL('preview/overlay-preview.html') + '?prayer=Dhuhr';
            await chrome.tabs.create({ url: previewUrl });
            
            this.showAlert('✅ Overlay preview opened in new tab', 'success');
            
            // Reset button
            setTimeout(() => {
                if (button) {
                    button.textContent = '👁️ Preview Design';
                    button.disabled = false;
                }
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error opening overlay preview:', error);
            this.showAlert('❌ Failed to open overlay preview', 'danger');
            
            // Reset button
            const button = document.getElementById('preview-overlay');
            if (button) {
                button.textContent = '👁️ Preview Design';
                button.disabled = false;
            }
        }
    }
    
    previewOverlay() {
        // Open a preview window
        window.open('data:text/html,<h1 style="text-align:center;margin-top:50px;">Overlay Preview Coming Soon</h1>', '_blank', 'width=800,height=600');
    }

    // ====================================
    // Advanced Functions
    // ====================================
    
    async refreshLocation() {
        await this.updateLocation();
    }
    
    async clearCache() {
        if (confirm('This will clear all cached prayer times and location data. Continue?')) {
            try {
                await chrome.storage.local.clear();
                this.showAlert('Cache cleared successfully!', 'success');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                this.showAlert('Failed to clear cache', 'danger');
            }
        }
    }
    
    async resetAllSettings() {
        if (confirm('This will reset ALL settings to default values. This cannot be undone. Continue?')) {
            try {
                await chrome.storage.sync.clear();
                await chrome.storage.local.clear();
                this.showAlert('All settings reset successfully!', 'success');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                this.showAlert('Failed to reset settings', 'danger');
            }
        }
    }
    
    async exportSettings() {
        try {
            const allSettings = await this.getMultipleStorageData(Object.keys(this.defaultSettings));
            const exportData = {
                version: this.version,
                exportDate: new Date().toISOString(),
                settings: allSettings
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `namaz-companion-settings-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showAlert('Settings exported successfully!', 'success');
        } catch (error) {
            this.showAlert('Failed to export settings', 'danger');
        }
    }
    
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                if (!file) return;
                
                const text = await file.text();
                const importData = JSON.parse(text);
                
                if (!importData.settings) {
                    throw new Error('Invalid settings file format');
                }
                
                // Save imported settings
                for (const [key, value] of Object.entries(importData.settings)) {
                    await this.saveSetting(key, value);
                }
                
                this.showAlert('Settings imported successfully!', 'success');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                this.showAlert('Failed to import settings. Please check the file format.', 'danger');
            }
        };
        input.click();
    }
    
    viewLogs() {
        // Open browser console
        this.showAlert('Press F12 to open Developer Tools and view console logs', 'info');
    }
    
    async updateExtensionInfo() {
        try {
            const lastUpdate = await this.getStorageData('lastPrayerUpdate');
            const lastUpdateElement = document.getElementById('last-update');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = lastUpdate ? 
                    new Date(lastUpdate).toLocaleString() : 'Never';
            }
            
            // Calculate storage usage
            const storageUsage = await this.calculateStorageUsage();
            const storageElement = document.getElementById('storage-usage');
            if (storageElement) {
                storageElement.textContent = `${storageUsage} KB`;
            }
        } catch (error) {
            console.error('❌ Error updating extension info:', error);
        }
    }
    
    async calculateStorageUsage() {
        try {
            const syncData = await chrome.storage.sync.get();
            const localData = await chrome.storage.local.get();
            
            const syncSize = JSON.stringify(syncData).length;
            const localSize = JSON.stringify(localData).length;
            
            return Math.round((syncSize + localSize) / 1024 * 100) / 100;
        } catch (error) {
            return 'Unknown';
        }
    }

    // ====================================
    // Utility Functions
    // ====================================
    
    updateToggle(elementId, isActive) {
        const toggle = document.getElementById(elementId);
        if (toggle) {
            if (isActive) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    }
    
    setValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    }
    
    getValue(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.value : null;
    }
    
    updateVolumeDisplay(volume) {
        const display = document.getElementById('volume-display');
        if (display) {
            display.textContent = `${volume}%`;
        }
    }
    
    async saveSetting(path, value) {
        try {
            if (path.includes('.')) {
                // Nested setting
                const [mainKey, subKey] = path.split('.');
                const currentSettings = await this.getStorageData(mainKey) || {};
                currentSettings[subKey] = value;
                await this.setStorageData(mainKey, currentSettings);
            } else {
                // Direct setting
                await this.setStorageData(path, value);
            }
            
            console.log(`💾 Setting saved: ${path} = ${value}`);
        } catch (error) {
            console.error(`❌ Error saving setting ${path}:`, error);
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
    
    async getStorageData(key) {
        try {
            const syncResult = await chrome.storage.sync.get(key);
            if (syncResult[key] !== undefined) {
                return syncResult[key];
            }
            
            const localResult = await chrome.storage.local.get(key);
            return localResult[key];
        } catch (error) {
            console.error(`❌ Error getting storage data for ${key}:`, error);
            return null;
        }
    }
    
    async getMultipleStorageData(keys) {
        try {
            const syncResult = await chrome.storage.sync.get(keys);
            const localResult = await chrome.storage.local.get(keys);
            
            return { ...localResult, ...syncResult };
        } catch (error) {
            console.error('❌ Error getting multiple storage data:', error);
            return {};
        }
    }
    
    showAlert(message, type = 'info') {
        const alertsContainer = document.getElementById('alerts-container');
        if (!alertsContainer) {
            // Fallback to simple alert
            alert(message);
            return;
        }
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <strong>${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '❌' : 'ℹ️'}</strong>
            ${message}
        `;
        
        alertsContainer.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
        
        // Scroll to top to show alert
        alertsContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// ====================================
// Initialize Settings Manager
// ====================================

document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new AdvancedSettingsManager();
    console.log('🕌 Islamic Namaz Companion Settings v4.0.0 - Ready');
});