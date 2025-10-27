// ====================================
// Islamic Namaz Companion - Enhanced Overlay System v4.0.0
// Complete Browser Blocking with Spiritual Content Integration
// ====================================

class IslamicPrayerOverlay {
    constructor() {
        this.version = '4.0.0';
        this.overlay = null;
        this.countdownTimer = null;
        this.textRotationTimer = null;
        this.breathingTimer = null;
        this.spiritualContent = null;
        this.currentTextIndex = 0;
        this.endTime = null;
        this.isActive = false;
        this.currentPrayer = null;
        this.settings = {};
        
        this.init();
    }

    async init() {
        console.log(`🕌 Islamic Prayer Overlay v${this.version} - Initializing`);
        
        // Set up message listeners for background communication
        this.setupMessageListeners();
        
        // Load spiritual content and settings
        await this.loadSpiritualContent();
        await this.loadSettings();
        
        // Handle page unload to clean up
        window.addEventListener('beforeunload', () => this.cleanup());
        
        console.log('✅ Prayer overlay system initialized');
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('🕌 Overlay received message:', message);
            
            (async () => {
                try {
                    switch (message.type || message.action) {
                        case 'SHOW_PRAYER_OVERLAY':
                        case 'showNamazOverlay':
                            // Store custom message if provided
                            if (message.message) {
                                this.customMessage = message.message;
                            }
                            
                            if (message.remainingTime || message.duration) {
                                await this.showOverlayWithDuration(
                                    message.prayer || message.prayerName,
                                    message.remainingTime || message.duration
                                );
                            } else {
                                await this.showOverlay(message.prayer || message.prayerName);
                            }
                            sendResponse({ success: true });
                            break;
                            
                        case 'HIDE_PRAYER_OVERLAY':
                        case 'hideNamazOverlay':
                            this.hideOverlay();
                            sendResponse({ success: true });
                            break;
                            
                        case 'PLAY_AZAN':
                            try {
                                await this.playCustomAzan(message.azanData, message.volume || 70);
                                sendResponse({ success: true });
                            } catch (error) {
                                console.error('❌ Failed to play Azan:', error);
                                sendResponse({ success: false, error: error.message });
                            }
                            break;
                            
                        default:
                            sendResponse({ success: false, error: 'Unknown message type' });
                    }
                } catch (error) {
                    console.error('❌ Overlay message handling error:', error);
                    sendResponse({ success: false, error: error.message });
                }
            })();
            return true; // Keep message channel open for async response
        });
    }

    async loadSpiritualContent() {
        try {
            const response = await fetch(chrome.runtime.getURL('assets/data/spiritual-content.json'));
            this.spiritualContent = await response.json();
            console.log('📖 Spiritual content loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load spiritual content:', error);
            // Fallback spiritual content
            this.spiritualContent = {
                verses: [
                    {
                        arabic: "إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ",
                        translation: "Indeed, prayer prohibits immorality and wrongdoing",
                        reference: "Quran 29:45",
                        category: "prayer"
                    }
                ],
                dhikr: [
                    {
                        arabic: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
                        translation: "Glory be to Allah and praise be to Him",
                        reference: "Daily Dhikr",
                        category: "dhikr"
                    }
                ]
            };
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get([
                'overlaySettings',
                'notificationSettings',
                'userName',
                'customAzan'
            ]);
            
            this.settings = {
                overlay: result.overlaySettings || { 
                    enabled: true, 
                    duration: 900000, // 15 minutes
                    theme: 'default',
                    textSpeed: 30000 // 30 seconds
                },
                notifications: result.notificationSettings || { enabled: true },
                userName: result.userName || 'Muslim',
                customAzan: result.customAzan
            };
        } catch (error) {
            console.error('❌ Failed to load settings:', error);
            this.settings = { overlay: { enabled: true, duration: 900000, theme: 'default' } };
        }
    }

    async showOverlay(prayerName, duration = null) {
        if (this.isActive) return;
        
        const overlayDuration = duration || this.settings.overlay.duration || 900000; // 15 minutes default
        this.endTime = Date.now() + overlayDuration;
        
        await this.displayOverlay(prayerName);
    }

    async showOverlayWithDuration(prayerName, remainingTime) {
        if (this.isActive) return;
        
        this.endTime = Date.now() + remainingTime;
        await this.displayOverlay(prayerName);
        
        console.log(`🔒 Prayer overlay resumed with ${Math.floor(remainingTime/60000)} minutes remaining`);
    }

    async displayOverlay(prayerName) {
        this.isActive = true;
        this.currentPrayer = prayerName;
        
        // Remove any existing overlay
        this.cleanup();
        
        // Create the enhanced overlay
        await this.createEnhancedOverlay(prayerName);
        
        // Start all timers and interactions
        this.startTextRotation();
        this.startBreathingAnimation();
        this.blockAllInteractions();
        
        // Auto-hide when duration ends
        const remainingTime = this.endTime - Date.now();
        if (remainingTime > 0) {
            setTimeout(() => {
                if (this.isActive) {
                    console.log('⏰ Prayer time duration ended, removing overlay');
                    this.hideOverlay();
                    // Clear active prayer overlay from storage
                    chrome.storage.local.remove('activePrayerOverlay').catch(e => 
                        console.warn('Could not clear active overlay:', e)
                    );
                }
            }, remainingTime);
        }
        
        // Play custom Azan if enabled
        if (this.settings.notifications.playAzan && this.settings.customAzan) {
            await this.playCustomAzan(this.settings.customAzan);
        }
        
        console.log(`🕌 ${prayerName} prayer overlay activated for ${Math.floor((this.endTime - Date.now())/60000)} minutes`);
    }

    async createEnhancedOverlay(prayerName) {
        // Create overlay container with Islamic design
        this.overlay = document.createElement('div');
        this.overlay.id = 'islamic-namaz-overlay';
        this.overlay.className = 'islamic-prayer-overlay';
        
        // Get prayer-specific content
        const prayerContent = this.getPrayerSpecificContent(prayerName);
        const timeOfDay = this.getTimeOfDay(prayerName);
        
        this.overlay.innerHTML = `
            <div class="overlay-background ${timeOfDay}">
                <div class="islamic-pattern"></div>
                <div class="overlay-container">
                    <!-- Header Section -->
                    <div class="prayer-header">
                        <div class="mosque-icon">🕌</div>
                        <h1 class="prayer-title">
                            Time for ${this.capitalizePrayerName(prayerName)} Prayer
                        </h1>
                        <div class="prayer-subtitle">
                            ${this.getArabicPrayerName(prayerName)}
                        </div>
                    </div>

                    <!-- Spiritual Content Section -->
                    <div class="spiritual-content">
                        <div class="content-container" id="spiritual-container">
                            <div class="arabic-text" id="arabic-text"></div>
                            <div class="translation-text" id="translation-text"></div>
                            <div class="reference-text" id="reference-text"></div>
                        </div>
                        <div class="content-indicator">
                            <div class="dots-container" id="content-dots"></div>
                        </div>
                    </div>

                    <!-- Prayer Guide Section -->
                    <div class="prayer-guide">
                        <div class="guide-content">
                            <div class="personalized-message">
                                ${this.getPersonalizedMessage(prayerName)}
                            </div>
                            <div class="prayer-actions">
                                <div class="action-item">📿 Recite dhikr and supplications</div>
                                <div class="action-item">🤲 Make personal duas</div>
                                <div class="action-item">📖 Reflect on the Quran</div>
                                <div class="action-item">🧘 Practice mindful breathing</div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer Section -->
                    <div class="overlay-footer">
                        <div class="blocking-notice">
                            <div class="notice-icon">🔒</div>
                            <div class="notice-text">
                                Browser access is restricted during prayer time for spiritual focus
                            </div>
                        </div>
                        <div class="restoration-notice">
                            The overlay will be automatically removed after the prayer time ends
                        </div>
                    </div>

                    <!-- Breathing Guide (Hidden by default) -->
                    <div class="breathing-guide" id="breathing-guide" style="display: none;">
                        <div class="breathing-circle" id="breathing-circle"></div>
                        <div class="breathing-text" id="breathing-text">Breathe in...</div>
                    </div>
                </div>

                <!-- Audio Element for Custom Azan -->
                <audio id="custom-azan-audio" preload="none"></audio>
            </div>
        `;

        // Inject CSS styles
        this.injectEnhancedStyles();
        
        // Append to body
        document.body.appendChild(this.overlay);
        
        // Initialize content
        await this.initializeContent();
        
        // Add accessibility features
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-label', `${prayerName} Prayer Time - Browser Blocked`);
        this.overlay.setAttribute('aria-modal', 'true');
    }

    injectEnhancedStyles() {
        if (document.getElementById('islamic-overlay-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'islamic-overlay-styles';
        style.textContent = `
            .islamic-prayer-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 2147483647 !important;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                color: white !important;
                overflow: hidden !important;
                cursor: default !important;
                user-select: none !important;
            }

            .overlay-background {
                width: 100% !important;
                height: 100% !important;
                position: relative !important;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%) !important;
                animation: gradientShift 20s ease-in-out infinite !important;
            }

            .overlay-background.fajr {
                background: linear-gradient(135deg, #2c1810 0%, #8B4513 30%, #CD853F 70%, #F4A460 100%) !important;
            }

            .overlay-background.dhuhr {
                background: linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD23F 100%) !important;
            }

            .overlay-background.asr {
                background: linear-gradient(135deg, #FF8C00 0%, #FF7F50 50%, #FFB347 100%) !important;
            }

            .overlay-background.maghrib {
                background: linear-gradient(135deg, #FF4500 0%, #DC143C 30%, #8B0000 70%, #2F1B14 100%) !important;
            }

            .overlay-background.isha {
                background: linear-gradient(135deg, #191970 0%, #000080 30%, #0F0F23 70%, #000000 100%) !important;
            }

            .islamic-pattern {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background-image: 
                    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
                    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 2px, transparent 2px) !important;
                background-size: 60px 60px !important;
                opacity: 0.3 !important;
                animation: patternFloat 30s linear infinite !important;
            }

            .overlay-container {
                position: relative !important;
                width: 100% !important;
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                padding: 40px !important;
                box-sizing: border-box !important;
                backdrop-filter: blur(10px) !important;
                background: rgba(255, 255, 255, 0.05) !important;
            }

            .prayer-header {
                text-align: center !important;
                margin-bottom: 60px !important;
                animation: fadeInDown 1s ease-out !important;
            }

            .mosque-icon {
                font-size: 4rem !important;
                margin-bottom: 20px !important;
                filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3)) !important;
                animation: pulse 3s ease-in-out infinite !important;
            }

            .prayer-title {
                font-size: 3rem !important;
                font-weight: 700 !important;
                margin: 0 0 15px 0 !important;
                text-shadow: 0 0 30px rgba(255, 255, 255, 0.5) !important;
                background: linear-gradient(45deg, #fff, #f0f0f0, #fff) !important;
                background-size: 200% 200% !important;
                -webkit-background-clip: text !important;
                -webkit-text-fill-color: transparent !important;
                background-clip: text !important;
                animation: shimmer 3s ease-in-out infinite !important;
            }

            .prayer-subtitle {
                font-size: 1.5rem !important;
                font-weight: 400 !important;
                opacity: 0.9 !important;
                font-family: 'Times New Roman', serif !important;
                letter-spacing: 2px !important;
            }

            .spiritual-content {
                text-align: center !important;
                max-width: 800px !important;
                margin-bottom: 40px !important;
                animation: fadeIn 1s ease-out 0.6s both !important;
            }

            .content-container {
                background: rgba(255, 255, 255, 0.1) !important;
                backdrop-filter: blur(15px) !important;
                border-radius: 20px !important;
                padding: 40px !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                margin-bottom: 20px !important;
                min-height: 200px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                transition: all 0.5s ease !important;
            }

            .arabic-text {
                font-size: 2.5rem !important;
                font-weight: 600 !important;
                line-height: 1.8 !important;
                margin-bottom: 20px !important;
                font-family: 'Times New Roman', serif !important;
                direction: rtl !important;
                text-align: center !important;
            }

            .translation-text {
                font-size: 1.4rem !important;
                line-height: 1.6 !important;
                margin-bottom: 15px !important;
                font-style: italic !important;
                opacity: 0.95 !important;
            }

            .reference-text {
                font-size: 1rem !important;
                opacity: 0.7 !important;
                font-weight: 500 !important;
            }

            .content-indicator {
                display: flex !important;
                justify-content: center !important;
                gap: 8px !important;
            }

            .dots-container {
                display: flex !important;
                gap: 8px !important;
            }

            .content-dot {
                width: 8px !important;
                height: 8px !important;
                border-radius: 50% !important;
                background: rgba(255, 255, 255, 0.3) !important;
                transition: all 0.3s ease !important;
            }

            .content-dot.active {
                background: rgba(255, 255, 255, 0.8) !important;
                transform: scale(1.3) !important;
            }

            .prayer-guide {
                text-align: center !important;
                margin-bottom: 40px !important;
                animation: fadeIn 1s ease-out 0.9s both !important;
            }

            .personalized-message {
                font-size: 1.3rem !important;
                margin-bottom: 25px !important;
                opacity: 0.9 !important;
                font-weight: 500 !important;
            }

            .prayer-actions {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
                gap: 15px !important;
                margin-top: 20px !important;
            }

            .action-item {
                background: rgba(255, 255, 255, 0.1) !important;
                padding: 15px 20px !important;
                border-radius: 10px !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                font-size: 1rem !important;
                transition: all 0.3s ease !important;
            }

            .action-item:hover {
                background: rgba(255, 255, 255, 0.15) !important;
                transform: translateY(-2px) !important;
            }

            .overlay-footer {
                text-align: center !important;
                animation: fadeIn 1s ease-out 1.2s both !important;
            }

            .blocking-notice {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 10px !important;
                font-size: 1.1rem !important;
                margin-bottom: 10px !important;
                opacity: 0.8 !important;
            }

            .restoration-notice {
                font-size: 0.9rem !important;
                opacity: 0.6 !important;
            }

            /* Breathing Guide Styles */
            .breathing-guide {
                position: fixed !important;
                bottom: 50px !important;
                right: 50px !important;
                text-align: center !important;
            }

            .breathing-circle {
                width: 100px !important;
                height: 100px !important;
                border: 3px solid rgba(255, 255, 255, 0.5) !important;
                border-radius: 50% !important;
                margin: 0 auto 10px auto !important;
                position: relative !important;
            }

            .breathing-circle::after {
                content: '' !important;
                position: absolute !important;
                top: 50% !important;
                left: 50% !important;
                width: 20px !important;
                height: 20px !important;
                background: rgba(255, 255, 255, 0.7) !important;
                border-radius: 50% !important;
                transform: translate(-50%, -50%) !important;
                animation: breathe 4s ease-in-out infinite !important;
            }

            .breathing-text {
                font-size: 1rem !important;
                opacity: 0.8 !important;
            }

            /* Animations */
            @keyframes gradientShift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }

            @keyframes patternFloat {
                0% { transform: translateY(0px); }
                100% { transform: translateY(-60px); }
            }

            @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-50px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(50px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            @keyframes breathe {
                0%, 100% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.5); }
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .overlay-container { padding: 20px !important; }
                .prayer-title { font-size: 2rem !important; }
                .countdown-display { font-size: 3rem !important; }
                .arabic-text { font-size: 1.8rem !important; }
                .prayer-actions { grid-template-columns: 1fr !important; }
            }

            /* High contrast mode support */
            @media (prefers-contrast: high) {
                .islamic-prayer-overlay { background: #000 !important; }
                .overlay-container { background: rgba(255, 255, 255, 0.1) !important; }
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                * { animation: none !important; }
            }
        `;
        
        document.head.appendChild(style);
    }

    async initializeContent() {
        // Initialize spiritual content display
        await this.updateSpiritualContent();
        
        // Create content dots for indication
        this.createContentDots();
    }

    getPrayerSpecificContent(prayerName) {
        if (!this.spiritualContent?.prayerSpecific) return [];
        
        const specific = this.spiritualContent.prayerSpecific[prayerName.toLowerCase()];
        if (specific && specific.length > 0) {
            return specific;
        }
        
        // Fallback to general content
        return [...(this.spiritualContent.verses || []), ...(this.spiritualContent.dhikr || [])];
    }

    getTimeOfDay(prayerName) {
        const prayer = prayerName.toLowerCase();
        return prayer; // Uses CSS classes for different prayer times
    }

    capitalizePrayerName(prayerName) {
        return prayerName.charAt(0).toUpperCase() + prayerName.slice(1).toLowerCase();
    }

    getArabicPrayerName(prayerName) {
        const arabicNames = {
            fajr: 'صلاة الفجر',
            dhuhr: 'صلاة الظهر',
            asr: 'صلاة العصر',
            maghrib: 'صلاة المغرب',
            isha: 'صلاة العشاء'
        };
        return arabicNames[prayerName.toLowerCase()] || prayerName;
    }

    getPersonalizedMessage(prayerName) {
        // If custom message is set, use it
        if (this.customMessage) {
            return this.customMessage;
        }
        
        const userName = this.settings.userName;
        const messages = {
            fajr: `${userName}, embrace the blessed dawn with Fajr prayer. Let the morning light illuminate your soul.`,
            dhuhr: `${userName}, pause from worldly matters for Dhuhr prayer. Seek Allah's guidance in the midday brightness.`,
            asr: `${userName}, the afternoon calls for Asr prayer. Reflect on your day and seek Allah's mercy.`,
            maghrib: `${userName}, as the sun sets, perform Maghrib prayer. Express gratitude for Allah's countless blessings.`,
            isha: `${userName}, end your day with Isha prayer. Find peace and serenity in Allah's remembrance.`
        };
        return messages[prayerName.toLowerCase()] || `${userName}, it's time to connect with Allah through prayer.`;
    }

    async updateSpiritualContent() {
        if (!this.spiritualContent) return;
        
        // Get prayer-specific content first, then general content
        let contentPool = this.getPrayerSpecificContent(this.currentPrayer);
        if (contentPool.length === 0) {
            contentPool = [
                ...(this.spiritualContent.verses || []),
                ...(this.spiritualContent.hadith || []),
                ...(this.spiritualContent.dhikr || [])
            ];
        }
        
        if (contentPool.length === 0) return;
        
        const content = contentPool[this.currentTextIndex % contentPool.length];
        
        const arabicElement = document.getElementById('arabic-text');
        const translationElement = document.getElementById('translation-text');
        const referenceElement = document.getElementById('reference-text');
        
        if (arabicElement && content.arabic) {
            arabicElement.textContent = content.arabic;
            arabicElement.style.animation = 'fadeIn 0.5s ease-in';
        }
        
        if (translationElement && content.translation) {
            translationElement.textContent = content.translation;
            translationElement.style.animation = 'fadeIn 0.5s ease-in 0.2s both';
        }
        
        if (referenceElement && content.reference) {
            referenceElement.textContent = `— ${content.reference}`;
            referenceElement.style.animation = 'fadeIn 0.5s ease-in 0.4s both';
        }
        
        // Update content dots
        this.updateContentDots();
    }

    createContentDots() {
        const dotsContainer = document.getElementById('content-dots');
        if (!dotsContainer) return;
        
        const contentCount = Math.min(10, this.getTotalContentCount()); // Max 10 dots
        dotsContainer.innerHTML = '';
        
        for (let i = 0; i < contentCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'content-dot';
            if (i === 0) dot.classList.add('active');
            dotsContainer.appendChild(dot);
        }
    }

    updateContentDots() {
        const dots = document.querySelectorAll('.content-dot');
        const totalContent = this.getTotalContentCount();
        const activeIndex = this.currentTextIndex % Math.min(10, totalContent);
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
        });
    }

    getTotalContentCount() {
        if (!this.spiritualContent) return 1;
        
        let total = 0;
        if (this.spiritualContent.verses) total += this.spiritualContent.verses.length;
        if (this.spiritualContent.hadith) total += this.spiritualContent.hadith.length;
        if (this.spiritualContent.dhikr) total += this.spiritualContent.dhikr.length;
        
        return Math.max(1, total);
    }

    startTextRotation() {
        const rotationInterval = this.settings.overlay.textSpeed || 30000; // 30 seconds default
        
        this.textRotationTimer = setInterval(() => {
            this.currentTextIndex++;
            this.updateSpiritualContent();
        }, rotationInterval);
    }

    startBreathingAnimation() {
        // Optionally show breathing guide after 2 minutes
        setTimeout(() => {
            const breathingGuide = document.getElementById('breathing-guide');
            if (breathingGuide && this.isActive) {
                breathingGuide.style.display = 'block';
                breathingGuide.style.animation = 'fadeIn 1s ease-out';
            }
        }, 120000); // 2 minutes
    }

    blockAllInteractions() {
        // Comprehensive interaction blocking
        this.keyboardHandler = this.handleKeyboard.bind(this);
        this.mouseHandler = this.handleMouse.bind(this);
        this.contextHandler = this.handleContext.bind(this);
        this.selectionHandler = this.handleSelection.bind(this);
        this.scrollHandler = this.handleScroll.bind(this);
        
        // Add event listeners with capture phase
        document.addEventListener('keydown', this.keyboardHandler, true);
        document.addEventListener('keyup', this.keyboardHandler, true);
        document.addEventListener('keypress', this.keyboardHandler, true);
        document.addEventListener('mousedown', this.mouseHandler, true);
        document.addEventListener('mouseup', this.mouseHandler, true);
        document.addEventListener('click', this.mouseHandler, true);
        document.addEventListener('contextmenu', this.contextHandler, true);
        document.addEventListener('selectstart', this.selectionHandler, true);
        document.addEventListener('scroll', this.scrollHandler, true);
        document.addEventListener('wheel', this.scrollHandler, true);
        document.addEventListener('touchstart', this.mouseHandler, true);
        document.addEventListener('touchend', this.mouseHandler, true);
        
        // Disable page scrolling
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Prevent text selection on page
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        
        console.log('🔒 All browser interactions blocked');
    }

    handleKeyboard(event) {
        // Block all keyboard inputs except for accessibility
        if (event.key === 'Escape' || event.key === 'F5' || event.ctrlKey || event.metaKey || event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            return false;
        }
        
        // Allow tab for accessibility within overlay
        if (event.key === 'Tab' && event.target.closest('.islamic-prayer-overlay')) {
            return true;
        }
        
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    handleMouse(event) {
        // Only allow interaction within the overlay
        if (event.target.closest('.islamic-prayer-overlay')) {
            return true;
        }
        
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    handleContext(event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    handleSelection(event) {
        if (!event.target.closest('.islamic-prayer-overlay')) {
            event.preventDefault();
            return false;
        }
    }

    handleScroll(event) {
        if (!event.target.closest('.islamic-prayer-overlay')) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }

    async playCustomAzan(azanData, volume = 70) {
        try {
            console.log('🔊 Playing custom Azan with data:', azanData);
            
            if (!azanData || !azanData.data) {
                console.warn('⚠️ No Azan data provided');
                return;
            }
            
            let audioElement = document.getElementById('custom-azan-audio');
            if (!audioElement) {
                // Create audio element if it doesn't exist
                audioElement = document.createElement('audio');
                audioElement.id = 'custom-azan-audio';
                audioElement.style.display = 'none';
                audioElement.preload = 'auto';
                document.body.appendChild(audioElement);
            }
            
            // Set audio source
            audioElement.src = azanData.data;
            audioElement.volume = Math.min(1.0, Math.max(0.0, volume / 100)); // Ensure valid volume range
            audioElement.loop = false;
            
            // Improved audio loading and playing
            const playAudio = async () => {
                try {
                    // Reset audio if needed
                    if (audioElement.currentTime > 0) {
                        audioElement.currentTime = 0;
                    }
                    
                    // Wait for user interaction if needed
                    if (audioElement.paused) {
                        await audioElement.play();
                        console.log('✅ Custom Azan playing successfully');
                    }
                } catch (playError) {
                    console.error('❌ Audio play failed:', playError);
                    // Try alternative method
                    setTimeout(() => {
                        audioElement.load();
                        audioElement.play().catch(e => console.error('❌ Retry also failed:', e));
                    }, 100);
                }
            };
            
            // Handle different loading states
            if (audioElement.readyState >= 2) {
                // Audio is already loaded
                await playAudio();
            } else {
                // Wait for audio to load
                audioElement.addEventListener('canplay', playAudio, { once: true });
                audioElement.addEventListener('loadeddata', playAudio, { once: true });
                
                // Force load
                audioElement.load();
                
                // Timeout fallback
                setTimeout(async () => {
                    if (audioElement.paused) {
                        await playAudio();
                    }
                }, 2000);
            }
            
            // Add visual indicator if overlay exists
            const overlay = document.querySelector('.islamic-prayer-overlay');
            if (overlay) {
                overlay.classList.add('playing-azan');
                
                // Clean up when audio ends
                audioElement.addEventListener('ended', () => {
                    overlay.classList.remove('playing-azan');
                    console.log('✅ Azan playback completed');
                }, { once: true });
                
                // Remove indicator after max duration
                setTimeout(() => {
                    overlay.classList.remove('playing-azan');
                }, azanData.duration || 300000); // 5 minutes max
            }
            
        } catch (error) {
            console.error('❌ Could not play custom Azan:', error);
        }
    }

    hideOverlay() {
        this.cleanup();
        
        // Send completion message to background
        try {
            chrome.runtime.sendMessage({
                type: 'PRAYER_OVERLAY_COMPLETED',
                prayer: this.currentPrayer,
                duration: this.settings.overlay.duration
            });
        } catch (error) {
            console.warn('Could not send completion message:', error);
        }
        
        console.log('🔓 Prayer overlay hidden - browser access restored');
    }

    cleanup() {
        // Clear all timers
        if (this.textRotationTimer) {
            clearInterval(this.textRotationTimer);
            this.textRotationTimer = null;
        }
        
        if (this.breathingTimer) {
            clearInterval(this.breathingTimer);
            this.breathingTimer = null;
        }
        
        // Remove event listeners
        this.restoreInteractions();
        
        // Remove overlay from DOM
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        // Remove styles
        const styleElement = document.getElementById('islamic-overlay-styles');
        if (styleElement) {
            styleElement.remove();
        }
        
        // Reset state
        this.isActive = false;
        this.endTime = null;
        this.currentPrayer = null;
        this.currentTextIndex = 0;
        
        // Restore page properties
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
    }

    restoreInteractions() {
        // Remove all event listeners
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, true);
            document.removeEventListener('keyup', this.keyboardHandler, true);
            document.removeEventListener('keypress', this.keyboardHandler, true);
        }
        
        if (this.mouseHandler) {
            document.removeEventListener('mousedown', this.mouseHandler, true);
            document.removeEventListener('mouseup', this.mouseHandler, true);
            document.removeEventListener('click', this.mouseHandler, true);
            document.removeEventListener('touchstart', this.mouseHandler, true);
            document.removeEventListener('touchend', this.mouseHandler, true);
        }
        
        if (this.contextHandler) {
            document.removeEventListener('contextmenu', this.contextHandler, true);
        }
        
        if (this.selectionHandler) {
            document.removeEventListener('selectstart', this.selectionHandler, true);
        }
        
        if (this.scrollHandler) {
            document.removeEventListener('scroll', this.scrollHandler, true);
            document.removeEventListener('wheel', this.scrollHandler, true);
        }
        
        // Clear handler references
        this.keyboardHandler = null;
        this.mouseHandler = null;
        this.contextHandler = null;
        this.selectionHandler = null;
        this.scrollHandler = null;
    }
}

// ====================================
// Initialize the Enhanced Overlay System
// ====================================

// Ensure we only initialize once
if (!window.islamicPrayerOverlay) {
    window.islamicPrayerOverlay = new IslamicPrayerOverlay();
    console.log('🕌 Islamic Prayer Overlay v4.0.0 - System Ready');
}