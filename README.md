# 🕌 Islamic Namaz Companion v3.0.0

An enhanced Chrome extension that helps Muslims maintain continuous and timely prayers throughout busy days with modern UI/UX and advanced features.

## ✨ New Features

### 🌙 Daily Namaz Schedule UI
- **Roadmap-style Prayer Timeline**: Visual representation of daily prayers in a horizontal roadmap format
- **Smart Status Indicators**: 
  - ✅ **Completed prayers** = Green (past prayer times)
  - 🟡 **Current prayer** = Yellow/Gold (upcoming prayer with pulse animation)
  - ⚪ **Upcoming prayers** = Gray (future prayers)
- **Automatic Location Detection**: Fetches prayer times using Aladhan API based on your location
- **Real-time Countdown**: Live countdown timer to next prayer
- **Progress Visualization**: Timeline progress bar showing daily prayer completion

### 🔔 Enhanced Azan Detection
- **Automatic Prayer Alerts**: Plays azan audio when prayer time arrives
- **Multiple Azan Types**: Choose between standard and solid azan audio
- **Smart Audio Management**: Automatic stop when audio completes

### 📺 15-minute Namaz Overlay
- **Full-screen Spiritual Experience**: Beautiful overlay appears on all browser tabs during prayer time
- **Dynamic Islamic Content**: 
  - Rotating Quran verses with translations
  - Hadith and Dhikr quotes
  - Content changes every 30 seconds
- **15-minute Timer**: Automatic countdown with manual close option
- **Elegant Design**: Islamic-themed design with blur effects and gradients

### ⚙️ Enhanced Settings & Controls
- **Modern Settings Page**: Complete control panel for customization
- **Location Management**: Easy location updates with automatic detection
- **Audio Preferences**: Toggle azan sounds and select types
- **Overlay Customization**: Enable/disable overlay and theme selection
- **Test Features**: Test overlays, azan sounds, and notifications

## 🚀 Technical Improvements

### 🛠️ Modern Architecture
- **Manifest V3 Compliance**: Latest Chrome extension standards
- **Enhanced Permissions**: 
  - `geolocation` for automatic location detection
  - `activeTab` and `scripting` for overlay functionality
  - `notifications` for system alerts
  - `host_permissions` for Aladhan API access

### 🌐 API Integration
- **Aladhan API**: Reliable Islamic prayer times API
- **Automatic Updates**: Daily prayer time refresh
- **Offline Support**: Cached data for interrupted connections
- **Error Handling**: Graceful fallbacks and retry mechanisms

### 🎨 UI/UX Enhancements
- **Responsive Design**: Works perfectly on all screen sizes
- **Modern Styling**: Glass-morphism effects, gradients, and animations
- **Accessibility**: High contrast, keyboard navigation, screen reader support
- **Performance**: Optimized loading and smooth animations

## 📦 Installation

### For Development:
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your Chrome toolbar

### For Users:
1. Install from Chrome Web Store (when published)
2. Grant location permissions when prompted
3. Extension will automatically fetch prayer times for your location

## 🔧 Configuration

### First Setup:
1. Click the extension icon in your Chrome toolbar
2. Allow location access when prompted
3. Prayer times will automatically load based on your location
4. Click "Settings" to customize preferences

### Settings Options:
- **Location**: Update your location manually or auto-detect
- **Azan Sound**: Enable/disable prayer call audio
- **Azan Type**: Choose between different azan recordings
- **Overlay**: Enable/disable the 15-minute prayer overlay
- **Overlay Theme**: Select from different visual themes
- **Notifications**: Toggle system notifications

## 🎵 Audio Files

The extension includes:
- `assets/mp3/adhan.mp3` - Standard call to prayer
- `assets/mp3/solid_adhan.mp3` - Alternative azan recording

## 📱 Features Overview

### Main Popup:
- Current date and location display
- Prayer timeline with 5 daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)
- Next prayer countdown timer
- Quick action buttons (Settings, Test features, Update location)
- Real-time status indicators

### Prayer Overlay:
- Full-screen Islamic design
- Rotating spiritual texts (Quran, Hadith, Dhikr)
- 15-minute countdown timer
- Manual close option
- Responsive design for all screen sizes

### Settings Page:
- Location management with auto-detection
- Audio preferences and testing
- Overlay customization options
- System notification controls
- Feature testing buttons

## 🔒 Privacy & Permissions

### Required Permissions:
- **Location**: To fetch accurate prayer times for your area
- **Storage**: To save settings and cache prayer times
- **Alarms**: To schedule prayer reminders
- **ActiveTab**: To show prayer overlays on current tabs
- **Scripting**: To inject overlay content
- **Notifications**: For system prayer alerts

### Data Usage:
- Location data is only used to fetch prayer times
- No personal data is stored or transmitted
- Prayer times are cached locally for 24 hours
- All data remains on your device

## 🌍 Supported Locations

The extension works worldwide using the Aladhan API, which provides accurate prayer times for:
- All major cities globally
- Various calculation methods (Sunni schools of thought)
- Automatic timezone detection
- Daylight saving time adjustments

## 🛠️ Development

### File Structure:
```
/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.js              # Popup functionality
├── background.js         # Service worker
├── settings/
│   ├── settings.html     # Settings page
│   └── settings.js       # Settings functionality
├── content/
│   ├── overlay.js        # Prayer overlay script
│   └── overlay.css       # Overlay styling
├── alertView/
│   ├── prayAlert.html    # Prayer alert popup
│   └── prayAlert.js      # Alert functionality
├── assets/
│   ├── mp3/              # Audio files
│   ├── data/             # Islamic texts and data
│   └── *.png             # Icons and images
└── package.json          # Project metadata
```

### Building:
```bash
npm run build
```

### Packaging:
```bash
npm run package
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Guidelines:
1. Follow Islamic principles and respect religious content
2. Maintain high code quality and documentation
3. Test thoroughly across different locations and timezones
4. Ensure accessibility and performance standards

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Original extension by Daniel Szakacs
- Aladhan API for prayer time data
- Islamic texts and translations from authentic sources
- Chrome Extension API documentation and best practices

## 📞 Support

For support, bug reports, or feature requests:
1. Open an issue on GitHub
2. Check the FAQ in the Wiki
3. Contact through the Chrome Web Store

---

**Barakallahu feeki** - May Allah bless this project and make it beneficial for the Muslim Ummah.

*"And establish prayer and give zakah and bow with those who bow [in worship and obedience]." - Quran 2:43*