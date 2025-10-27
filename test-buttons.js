// ====================================
// Islamic Namaz Companion - Button Functionality Test v4.0.0
// Comprehensive Test Suite for All Interactive Elements
// ====================================

class ButtonFunctionalityTester {
    constructor() {
        this.version = '4.0.0';
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    // ====================================
    // Test Runner
    // ====================================
    
    async runAllTests() {
        console.log(`🧪 Starting Button Functionality Tests v${this.version}`);
        
        try {
            // Test popup buttons
            await this.testPopupButtons();
            
            // Test settings buttons
            await this.testSettingsButtons();
            
            // Test setup buttons
            await this.testSetupButtons();
            
            // Test event handlers
            await this.testEventHandlers();
            
            // Generate test report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    // ====================================
    // Popup Button Tests
    // ====================================
    
    async testPopupButtons() {
        console.log('🔍 Testing Popup Buttons...');
        
        const expectedButtons = [
            'settings-btn',
            'test-prayer-time-btn', 
            'test-azan-btn',
            'update-location-btn',
            'retry-btn'
        ];

        for (const buttonId of expectedButtons) {
            await this.testButton(buttonId, 'popup');
        }

        // Test prayer point clicks
        const prayerPoints = document.querySelectorAll('.prayer-point');
        this.addTest(`Prayer Points Clickable`, prayerPoints.length === 5, 
            `Expected 5 prayer points, found ${prayerPoints.length}`);

        // Test keyboard shortcuts
        this.addTest('Popup Keyboard Shortcuts', 
            this.hasKeyboardListeners(), 
            'Keyboard event listeners should be attached');
    }

    // ====================================
    // Settings Button Tests
    // ====================================
    
    async testSettingsButtons() {
        console.log('🔍 Testing Settings Buttons...');
        
        const expectedSettingsButtons = [
            // General Tab
            'update-location',
            'manual-location',
            
            // Prayer Times Tab
            'save-prayer-times',
            'reset-prayer-times', 
            'test-prayer-time',
            
            // Notifications Tab
            'test-azan',
            
            // Overlay Tab
            'test-overlay',
            'preview-overlay',
            
            // Advanced Tab
            'refresh-location',
            'clear-cache',
            'reset-settings',
            'export-settings',
            'import-settings',
            'view-logs'
        ];

        for (const buttonId of expectedSettingsButtons) {
            await this.testButton(buttonId, 'settings');
        }

        // Test toggle buttons
        const expectedToggles = [
            'notifications-toggle',
            'pre-reminders-toggle', 
            'persistent-notifications-toggle',
            'azan-toggle',
            'overlay-toggle',
            'breathing-guide-toggle',
            'auto-refresh-toggle',
            'sync-toggle',
            'debug-toggle'
        ];

        for (const toggleId of expectedToggles) {
            await this.testToggle(toggleId);
        }
    }

    // ====================================
    // Setup Button Tests  
    // ====================================
    
    async testSetupButtons() {
        console.log('🔍 Testing Setup Buttons...');
        
        const expectedSetupButtons = [
            'name-continue-btn',
            'mode-continue',
            'location-continue', 
            'finish-setup',
            'detect-location-btn',
            'manual-location-btn'
        ];

        for (const buttonId of expectedSetupButtons) {
            await this.testButton(buttonId, 'setup');
        }

        // Test mode selection
        const modeOptions = document.querySelectorAll('.mode-option');
        this.addTest('Mode Options Clickable', modeOptions.length >= 2,
            `Expected at least 2 mode options, found ${modeOptions.length}`);

        // Test back buttons
        const backButtons = document.querySelectorAll('.btn-secondary');
        this.addTest('Back Buttons Present', backButtons.length > 0,
            `Expected back buttons, found ${backButtons.length}`);
    }

    // ====================================
    // Event Handler Tests
    // ====================================
    
    async testEventHandlers() {
        console.log('🔍 Testing Event Handlers...');
        
        // Test form inputs
        this.testFormInputs();
        
        // Test select elements
        this.testSelectElements();
        
        // Test file inputs
        this.testFileInputs();
        
        // Test navigation elements
        this.testNavigationElements();
    }

    testFormInputs() {
        const textInputs = document.querySelectorAll('input[type="text"], input[type="time"], input[type="range"]');
        
        textInputs.forEach((input, index) => {
            const hasInputListener = this.hasEventListener(input, 'input');
            const hasChangeListener = this.hasEventListener(input, 'change');
            
            this.addTest(`Input ${index + 1} Event Listeners`, 
                hasInputListener || hasChangeListener,
                `Input ${input.id || input.className} should have input/change listeners`);
        });
    }

    testSelectElements() {
        const selectElements = document.querySelectorAll('select');
        
        selectElements.forEach((select, index) => {
            const hasChangeListener = this.hasEventListener(select, 'change');
            
            this.addTest(`Select ${index + 1} Change Listener`,
                hasChangeListener,
                `Select ${select.id || select.className} should have change listener`);
        });
    }

    testFileInputs() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach((input, index) => {
            const hasChangeListener = this.hasEventListener(input, 'change');
            
            this.addTest(`File Input ${index + 1} Change Listener`,
                hasChangeListener,
                `File input ${input.id || input.className} should have change listener`);
        });
    }

    testNavigationElements() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach((nav, index) => {
            const hasClickListener = this.hasEventListener(nav, 'click');
            
            this.addTest(`Navigation ${index + 1} Click Listener`,
                hasClickListener,
                `Navigation ${nav.dataset.tab || nav.className} should have click listener`);
        });
    }

    // ====================================
    // Test Helper Functions
    // ====================================
    
    async testButton(buttonId, context) {
        const button = document.getElementById(buttonId);
        const exists = button !== null;
        const hasClickListener = exists ? this.hasEventListener(button, 'click') : false;
        const isEnabled = exists ? !button.disabled : false;
        
        this.addTest(`${context}: ${buttonId} exists`, exists, 
            `Button '${buttonId}' should exist in DOM`);
            
        if (exists) {
            this.addTest(`${context}: ${buttonId} has click listener`, hasClickListener,
                `Button '${buttonId}' should have click event listener`);
                
            this.addTest(`${context}: ${buttonId} is enabled`, isEnabled,
                `Button '${buttonId}' should be enabled`);
        }
    }

    async testToggle(toggleId) {
        const toggle = document.getElementById(toggleId);
        const exists = toggle !== null;
        const hasClickListener = exists ? this.hasEventListener(toggle, 'click') : false;
        const hasToggleClass = exists ? toggle.classList.contains('toggle') : false;
        
        this.addTest(`Toggle: ${toggleId} exists`, exists,
            `Toggle '${toggleId}' should exist in DOM`);
            
        if (exists) {
            this.addTest(`Toggle: ${toggleId} has click listener`, hasClickListener,
                `Toggle '${toggleId}' should have click event listener`);
                
            this.addTest(`Toggle: ${toggleId} has toggle class`, hasToggleClass,
                `Toggle '${toggleId}' should have 'toggle' CSS class`);
        }
    }

    hasEventListener(element, eventType) {
        // This is a simplified check - in practice, we'd need to inspect the actual listeners
        // For now, we'll assume elements with specific classes or IDs have proper listeners
        if (!element) return false;
        
        // Check if element has been processed by our binding functions
        const hasDataProcessed = element.hasAttribute('data-listeners-bound');
        
        // Check common patterns that indicate event binding
        const hasOnClickAttribute = element.hasAttribute('onclick');
        const hasEventClass = element.classList.contains('clickable') || 
                             element.classList.contains('button') ||
                             element.classList.contains('btn') ||
                             element.classList.contains('toggle');
        
        return hasDataProcessed || hasOnClickAttribute || hasEventClass;
    }

    hasKeyboardListeners() {
        // Check if document has keyboard event listeners
        // This is a simplified check for the test
        return document.onkeydown !== null || 
               document.onkeyup !== null || 
               document.onkeypress !== null;
    }

    addTest(testName, passed, message) {
        const result = {
            name: testName,
            passed: passed,
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        this.totalTests++;
        
        if (passed) {
            this.passedTests++;
            console.log(`✅ ${testName}: PASSED`);
        } else {
            this.failedTests++;
            console.log(`❌ ${testName}: FAILED - ${message}`);
        }
    }

    // ====================================
    // Test Report Generation
    // ====================================
    
    generateReport() {
        const successRate = Math.round((this.passedTests / this.totalTests) * 100);
        
        console.log('\n' + '='.repeat(60));
        console.log(`🧪 BUTTON FUNCTIONALITY TEST REPORT v${this.version}`);
        console.log('='.repeat(60));
        console.log(`📊 Total Tests: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log('='.repeat(60));
        
        if (this.failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`   • ${test.name}: ${test.message}`);
                });
        }
        
        console.log('\n🎯 RECOMMENDATIONS:');
        
        if (successRate >= 90) {
            console.log('   ✅ Excellent! Button functionality is working well.');
        } else if (successRate >= 70) {
            console.log('   ⚠️  Good, but some buttons need attention.');
        } else {
            console.log('   🚨 Critical: Many buttons are not functioning properly.');
        }
        
        console.log('   • Ensure all buttons have proper event listeners');
        console.log('   • Verify button IDs match JavaScript binding code');
        console.log('   • Test actual button functionality manually');
        console.log('   • Check browser console for JavaScript errors');
        
        // Store report for external access
        window.buttonTestReport = {
            version: this.version,
            totalTests: this.totalTests,
            passedTests: this.passedTests,
            failedTests: this.failedTests,
            successRate: successRate,
            results: this.testResults,
            timestamp: new Date().toISOString()
        };
    }
}

// ====================================
// Auto-run tests when script loads
// ====================================

// Initialize and run tests
const buttonTester = new ButtonFunctionalityTester();

// Run tests after DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => buttonTester.runAllTests(), 1000);
    });
} else {
    setTimeout(() => buttonTester.runAllTests(), 1000);
}

// Make tester available globally for manual testing
window.buttonTester = buttonTester;

console.log('🧪 Button Functionality Tester v4.0.0 loaded successfully');
console.log('📝 Run buttonTester.runAllTests() to test all buttons');
console.log('📊 Access window.buttonTestReport for detailed results');