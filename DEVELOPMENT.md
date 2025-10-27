# 🧪 Development & Testing Guide

## Quick Testing Steps

### 1. Load Extension in Chrome
```powershell
# Navigate to the extension directory
cd "c:\Users\Lenovo\Desktop\nmaz reminder\extracted_extension_eglgbgmahngnflijjdhghhdbflgdceif\2.1_0"

# Open Chrome extensions page
start chrome chrome://extensions/
```

**Manual Steps:**
1. Enable "Developer mode" (toggle in top-right)
2. Click "Load unpacked"
3. Select the extension folder: `c:\Users\Lenovo\Desktop\nmaz reminder\extracted_extension_eglgbgmahngnflijjdhghhdbflgdceif\2.1_0`

### 2. Test Core Features

#### Test Popup Interface:
1. Click extension icon in Chrome toolbar
2. Verify prayer times display correctly
3. Check countdown timer is working
4. Test location detection button

#### Test Settings Page:
1. Click "Settings" in popup
2. Try toggling all options
3. Test "Update Location" functionality
4. Use "Test Overlay" and "Test Azan" buttons

#### Test Prayer Overlay:
1. In settings, click "Test Overlay"
2. Verify full-screen overlay appears
3. Check 15-minute countdown timer
4. Test manual close functionality

### 3. Console Debugging

Open Chrome DevTools and check:

#### Background Script Console:
```
chrome://extensions/ → Extension Details → Service Worker → Console
```

#### Popup Console:
```
Right-click extension icon → Inspect popup
```

#### Content Script Console:
```
F12 on any tab → Console (when overlay is active)
```

## 🔧 Development Commands

### Install Dependencies (if needed):
```powershell
npm install
```

### Build for Production:
```powershell
npm run build
```

### Package Extension:
```powershell
npm run package
```

## 🐛 Common Issues & Solutions

### Issue: "Service worker registration failed"
**Solution:** Reload the extension in chrome://extensions/

### Issue: "Location access denied"
**Solution:** Check Chrome site permissions for the extension

### Issue: "Prayer times not loading"
**Solution:** Check internet connection and API availability

### Issue: "Overlay not appearing"
**Solution:** Ensure content script permissions are granted

## 📊 Testing Checklist

### ✅ Core Functionality
- [ ] Extension loads without errors
- [ ] Prayer times fetch automatically
- [ ] Countdown timer updates every second
- [ ] Settings save and persist
- [ ] Location detection works

### ✅ Prayer Features
- [ ] Overlay appears correctly
- [ ] Azan audio plays when enabled
- [ ] 15-minute timer counts down
- [ ] Spiritual texts rotate every 30 seconds
- [ ] Overlay can be closed manually

### ✅ UI/UX
- [ ] Popup design is responsive
- [ ] Settings page layout is clean
- [ ] Animations work smoothly
- [ ] Colors and fonts render correctly
- [ ] Icons display properly

### ✅ Permissions
- [ ] Location permission request appears
- [ ] Storage permissions work
- [ ] Alarm permissions function
- [ ] Content script injection succeeds
- [ ] API calls to Aladhan work

## 🌍 Location Testing

### Test with Different Locations:
1. **Manual Location Entry:**
   - Try: "New York, USA"
   - Try: "Mecca, Saudi Arabia"
   - Try: "Istanbul, Turkey"
   - Try: "Jakarta, Indonesia"

2. **Automatic Detection:**
   - Allow location access
   - Verify prayer times match your area
   - Check timezone is correct

## 🎵 Audio Testing

### Test Azan Files:
1. **In Settings:**
   - Click "Test Azan" button
   - Try both azan types
   - Verify audio stops automatically

2. **During Prayer Time:**
   - Wait for actual prayer time (or set system time)
   - Verify azan plays automatically
   - Test volume levels

## 📱 Cross-Browser Testing

### Chrome (Primary):
- Latest stable version
- Developer mode enabled
- Extension permissions granted

### Edge (Secondary):
- Compatible with Chrome extensions
- May need manifest adjustments

## 🔒 Security Testing

### Check Permissions:
1. Verify only necessary permissions requested
2. Test Content Security Policy compliance
3. Ensure no external script loading
4. Validate API call security

### Privacy Verification:
1. No personal data stored externally
2. Location data used only for prayer times
3. Settings remain local to browser
4. No tracking or analytics

## 📈 Performance Testing

### Memory Usage:
1. Check extension memory in Chrome Task Manager
2. Verify no memory leaks during overlay display
3. Test with multiple tabs open

### Load Times:
1. Measure popup opening speed
2. Check prayer time API response time
3. Verify overlay injection performance

## 🚀 Deployment Preparation

### Before Publishing:
1. [ ] All tests pass
2. [ ] No console errors
3. [ ] Icons and images optimized
4. [ ] Documentation complete
5. [ ] Version number updated
6. [ ] Privacy policy reviewed

### Packaging Steps:
1. Run `npm run build`
2. Create ZIP file of extension folder
3. Upload to Chrome Web Store Developer Dashboard
4. Fill out store listing information
5. Submit for review

## 📞 Support & Debugging

### Useful Chrome URLs:
- `chrome://extensions/` - Extension management
- `chrome://extensions-internals/` - Detailed extension info
- `chrome://settings/content/location` - Location permissions
- `chrome://settings/content/notifications` - Notification permissions

### Debug Information to Collect:
1. Chrome version
2. Operating system
3. Extension version
4. Console error messages
5. Network tab API responses
6. User location (general area)

---

**Happy Testing! 🚀**

*Remember to test during actual prayer times to verify the complete user experience.*