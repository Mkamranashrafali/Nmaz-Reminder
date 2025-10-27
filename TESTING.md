# Islamic Namaz Companion - Testing Guide

## 🚀 Quick Setup & Testing

### 1. Load Extension in Chrome
1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the folder: `extracted_extension_eglgbgmahngnflijjdhghhdbflgdceif\2.1_0`
6. Extension should load with green status

### 2. Test Prayer Time Popup & 15-Min Overlay System

#### Method 1: Test Prayer Timer (Recommended)
1. Click the extension icon in Chrome toolbar
2. Click **"⏰ Test Prayer Timer"** button
3. You'll see: "Test prayer alarm set for [next minute]"
4. Wait 1 minute - popup should appear automatically
5. **15-minute overlay** should block all browser tabs
6. Overlay shows spiritual content rotation and countdown

#### Method 2: Instant Overlay Test
1. Click the extension icon
2. Click **"🎯 Test Overlay"** button
3. **15-minute overlay** appears immediately on all tabs
4. Blocks tab interaction for full 15 minutes
5. Shows rotating Islamic texts with countdown

### 3. Test Location Detection (Lahore Issue Fix)
1. Click the extension icon
2. Click **"🔍 Debug Location"** button
3. Review detailed location results:
   - Raw GPS coordinates
   - 4 geocoding service results
   - Accuracy verification
4. Verify it shows **Lahore** (not Karachi)

### 4. Verify Prayer Times
1. Main popup shows accurate prayer times for detected location
2. Timeline shows current/next prayer highlighted
3. Countdown timer to next prayer
4. Settings accessible via **"⚙️ Settings"** button

## ✅ Expected Behavior

### Prayer Time Popup
- Appears exactly at prayer time
- Shows notification
- Triggers 15-minute overlay

### 15-Minute Overlay
- **BLOCKS ALL BROWSER TABS** - user cannot access any content
- Full-screen Islamic design with spiritual content
- Countdown timer showing remaining time
- Rotates Quran verses, Hadith, and Dhikr every 20 seconds
- Can only be closed manually or after 15 minutes

### Location Detection
- Accurately detects Lahore coordinates (31.5497°N, 74.3436°E)
- Shows correct city name in popup
- Prayer times match Lahore schedule

## 🔧 Troubleshooting

### Extension Won't Load
- Check manifest.json syntax
- Verify all files present
- Check Chrome console for errors

### Overlay Not Appearing
1. Check browser console (F12)
2. Verify content script permissions
3. Test with "Test Overlay" button first

### Location Issues
1. Allow location permissions when prompted
2. Use "Debug Location" to see detailed results
3. Check if GPS is enabled

### Prayer Times Incorrect
1. Verify location is correct
2. Check internet connection (needs Aladhan API)
3. Time zone should match system

## 📝 Test Checklist

- [ ] Extension loads without errors
- [ ] Location detection shows correct city (Lahore)
- [ ] Prayer times display correctly
- [ ] Test overlay blocks all tabs for 15 minutes
- [ ] Test prayer timer creates popup + overlay after 1 minute
- [ ] Spiritual content rotates properly
- [ ] Countdown timer works accurately
- [ ] Settings page opens and functions
- [ ] Extension icon shows in toolbar

## 🎯 Success Criteria

✅ **Prayer Time Popup**: Appears at correct times with notification
✅ **15-Minute Overlay**: Completely blocks browser use during prayer time
✅ **Location Accuracy**: Correctly identifies Lahore (not Karachi)
✅ **Full Integration**: All components work together seamlessly

Ready for testing! 🕌