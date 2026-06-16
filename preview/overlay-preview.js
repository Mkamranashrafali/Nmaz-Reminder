// Get URL parameters for dynamic prayer display
const urlParams = new URLSearchParams(window.location.search);
const prayerName = urlParams.get('prayer') || 'Dhuhr';

// Prayer configurations
const prayerConfig = {
    fajr: {
        name: 'Fajr',
        arabic: 'صلاة الفجر',
        className: 'fajr'
    },
    dhuhr: {
        name: 'Dhuhr', 
        arabic: 'صلاة الظهر',
        className: 'dhuhr'
    },
    asr: {
        name: 'Asr',
        arabic: 'صلاة العصر', 
        className: 'asr'
    },
    maghrib: {
        name: 'Maghrib',
        arabic: 'صلاة المغرب',
        className: 'maghrib'
    },
    isha: {
        name: 'Isha',
        arabic: 'صلاة العشاء',
        className: 'isha'
    }
};

// Set prayer-specific content
function initializePrayerDisplay() {
    // Validate prayer name and convert to lowercase safely
    const safePrayerName = prayerName && typeof prayerName === 'string' 
        ? prayerName.toLowerCase() 
        : 'dhuhr';
    
    const prayer = prayerConfig[safePrayerName] || prayerConfig.dhuhr;
    
    // Update title and subtitle
    document.getElementById('prayer-title').textContent = `Time for ${prayer.name} Prayer`;
    document.getElementById('prayer-subtitle').textContent = prayer.arabic;
    
    // Update background class
    const background = document.getElementById('overlay-bg');
    background.className = `overlay-background ${prayer.className}`;
    
    // Update page title
    document.title = `${prayer.name} Prayer Overlay Preview`;
    
    console.log(`🕌 Preview initialized for ${prayer.name} prayer`);
}

// Initialize on page load
initializePrayerDisplay();

// Add close button event listener
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-preview-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closePreview);
    }
});

// Rotate spiritual content
const spiritualContent = [
    {
        arabic: "إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ",
        translation: "Indeed, prayer prohibits immorality and wrongdoing",
        reference: "Quran 29:45"
    },
    {
        arabic: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ",
        translation: "And establish prayer and give zakah",
        reference: "Quran 2:43"
    },
    {
        arabic: "سُبْحَانَ اللهِ وَبِحَمْدِهِ",
        translation: "Glory be to Allah and praise be to Him",
        reference: "Daily Dhikr"
    },
    {
        arabic: "اللَّهُ أَكْبَرُ",
        translation: "Allah is the Greatest",
        reference: "Takbir"
    },
    {
        arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ",
        translation: "There is no god but Allah",
        reference: "Tahlil"
    }
];

let contentIndex = 0;
setInterval(() => {
    contentIndex = (contentIndex + 1) % spiritualContent.length;
    const content = spiritualContent[contentIndex];
    
    document.querySelector('.arabic-text').textContent = content.arabic;
    document.querySelector('.translation-text').textContent = content.translation;
    document.querySelector('.reference-text').textContent = content.reference;
}, 8000); // Change content every 8 seconds

// Close button handler
function closePreview() {
    window.close();
}

// Make function globally available
window.closePreview = closePreview;

console.log('🕌 Overlay preview loaded successfully');
