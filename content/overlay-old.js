// Content script for Islamic Namaz Companion overlay
// CSP compliant - no inline event handlers or eval

class NamazOverlay {
  constructor() {
    this.overlay = null;
    this.timer = null;
    this.textRotationTimer = null;
    this.spiritualTexts = [];
    this.currentTextIndex = 0;
    this.endTime = null;
    this.isActive = false;
  }

  async init() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'showNamazOverlay') {
        // Handle both new overlays and resuming existing ones
        if (message.remainingTime) {
          this.showOverlayWithRemainingTime(message.prayerName, message.remainingTime);
        } else {
          this.showOverlay(message.prayerName);
        }
      } else if (message.action === 'hideNamazOverlay') {
        this.hideOverlay();
      }
    });

    // Load spiritual texts
    await this.loadSpiritualTexts();
  }

  async loadSpiritualTexts() {
    try {
      const response = await fetch(chrome.runtime.getURL('assets/data/spiritual-texts.json'));
      const data = await response.json();
      
      // Combine all texts into one array
      this.spiritualTexts = [
        ...data.verses,
        ...data.hadith,
        ...data.dhikr
      ];
    } catch (error) {
      console.error('Failed to load spiritual texts:', error);
      // Fallback texts
      this.spiritualTexts = [
        {
          arabic: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
          translation: "Glory be to Allah and praise be to Him",
          reference: "Dhikr"
        }
      ];
    }
  }

  showOverlay(prayerName) {
    if (this.isActive) return;
    
    this.isActive = true;
    this.endTime = Date.now() + (15 * 60 * 1000); // 15 minutes from now
    
    this.createOverlay(prayerName);
    this.blockAllInteraction();
    this.startTimer();
    this.startTextRotation();
  }

  showOverlayWithRemainingTime(prayerName, remainingTime) {
    if (this.isActive) return;
    
    this.isActive = true;
    this.endTime = Date.now() + remainingTime;
    
    this.createOverlay(prayerName);
    this.blockAllInteraction();
    this.startTimer();
    this.startTextRotation();
    
    console.log(`🔒 Prayer overlay resumed with ${Math.floor(remainingTime/60000)} minutes remaining`);
  }

  createOverlay(prayerName) {
    // Remove existing overlay if any
    this.hideOverlay();

    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.id = 'namaz-companion-overlay';
    this.overlay.innerHTML = `
      <div class="overlay-container">
        <div class="header">
          <h1>🕌 Time for ${prayerName} Prayer 🕌</h1>
          <div class="countdown-container">
            <div class="countdown-label">Prayer Time Remaining:</div>
            <div class="countdown" id="countdown-timer">15:00</div>
            <div class="blocking-notice">🔒 Chrome is blocked during prayer time</div>
          </div>
        </div>
        
        <div class="content">
          <div class="text-container">
            <div class="arabic-text" id="arabic-text"></div>
            <div class="translation" id="translation-text"></div>
            <div class="reference" id="reference-text"></div>
          </div>
        </div>
        
        <div class="footer">
          <div class="prayer-guide">
            <p>Take a moment to connect with Allah through prayer and reflection</p>
            <p style="font-size: 1rem; opacity: 0.9; margin-top: 15px;">
              � Use this time for dhikr, reflection, or performing your prayer
            </p>
            <p style="font-size: 0.9rem; opacity: 0.7; margin-top: 10px;">
              ⏱️ Browser access will be restored automatically when the timer reaches 0:00
            </p>
          </div>
        </div>
      </div>
    `;

    // Append to body first
    document.body.appendChild(this.overlay);

    // Set the first text
    this.updateText();
  }

  blockAllInteraction() {
    // Prevent all keyboard shortcuts
    this.keyboardBlocker = (e) => {
      // Block everything except F5 (refresh) - but even that won't help since overlay persists
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    // Prevent right-click context menu
    this.contextBlocker = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Prevent mouse selection
    this.selectionBlocker = (e) => {
      e.preventDefault();
      return false;
    };

    // Add event listeners to block interaction
    document.addEventListener('keydown', this.keyboardBlocker, true);
    document.addEventListener('keyup', this.keyboardBlocker, true);
    document.addEventListener('keypress', this.keyboardBlocker, true);
    document.addEventListener('contextmenu', this.contextBlocker, true);
    document.addEventListener('selectstart', this.selectionBlocker, true);
    document.addEventListener('mousedown', this.selectionBlocker, true);

    // Block common shortcuts specifically
    document.addEventListener('keydown', (e) => {
      // Block Ctrl+T (new tab), Ctrl+W (close tab), Ctrl+N (new window), etc.
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Block F keys, Escape, etc.
      if (e.key.startsWith('F') || e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // Disable page scrolling
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  startTimer() {
    this.timer = setInterval(() => {
      const remaining = this.endTime - Date.now();
      
      if (remaining <= 0) {
        console.log('⏰ Prayer time completed - hiding overlay');
        this.hideOverlay();
        return;
      }

      // Update countdown display
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      const countdownElement = document.getElementById('countdown-timer');
      
      if (countdownElement) {
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        countdownElement.textContent = timeString;
        
        // Add visual feedback when time is running out
        if (remaining < 60000) { // Last minute
          countdownElement.style.color = '#ffeb3b';
          countdownElement.style.animation = 'pulseUrgent 1s ease-in-out infinite';
        } else if (remaining < 300000) { // Last 5 minutes
          countdownElement.style.color = '#ffc107';
        }
      }
      
      // Log remaining time periodically
      if (remaining % 60000 < 1000) { // Every minute
        console.log(`⏱️ Prayer time remaining: ${minutes} minutes`);
      }
    }, 1000);
  }

  startTextRotation() {
    this.textRotationTimer = setInterval(() => {
      this.updateText();
    }, 30000); // Change text every 30 seconds
  }

  updateText() {
    if (this.spiritualTexts.length === 0) return;

    const text = this.spiritualTexts[this.currentTextIndex];
    
    const arabicElement = document.getElementById('arabic-text');
    const translationElement = document.getElementById('translation-text');
    const referenceElement = document.getElementById('reference-text');

    if (arabicElement) arabicElement.textContent = text.arabic;
    if (translationElement) translationElement.textContent = text.translation;
    if (referenceElement) referenceElement.textContent = `- ${text.reference}`;

    // Move to next text
    this.currentTextIndex = (this.currentTextIndex + 1) % this.spiritualTexts.length;
  }

  hideOverlay() {
    // Restore interaction
    this.restoreInteraction();
    
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.textRotationTimer) {
      clearInterval(this.textRotationTimer);
      this.textRotationTimer = null;
    }

    this.isActive = false;
    this.endTime = null;
    this.currentTextIndex = 0;
  }

  restoreInteraction() {
    // Remove event listeners that block interaction
    if (this.keyboardBlocker) {
      document.removeEventListener('keydown', this.keyboardBlocker, true);
      document.removeEventListener('keyup', this.keyboardBlocker, true);
      document.removeEventListener('keypress', this.keyboardBlocker, true);
    }
    
    if (this.contextBlocker) {
      document.removeEventListener('contextmenu', this.contextBlocker, true);
    }
    
    if (this.selectionBlocker) {
      document.removeEventListener('selectstart', this.selectionBlocker, true);
      document.removeEventListener('mousedown', this.selectionBlocker, true);
    }

    // Restore page scrolling
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    console.log('🔓 Browser interaction restored');
  }
}

// Initialize the overlay system
const namazOverlay = new NamazOverlay();
namazOverlay.init();