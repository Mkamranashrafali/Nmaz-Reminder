// Watch for storage changes to receive play commands
if (chrome && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.pendingAzan) {
            const azanData = changes.pendingAzan.newValue;
            if (azanData && azanData.audioSrc) {
                playAzan(azanData.audioSrc, azanData.volume);
                // Clear the pending azan after playing
                chrome.storage.local.remove('pendingAzan');
            }
        }
    });
}

// Also listen for direct messages (backup method)
if (chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'PLAY_AZAN') {
            playAzan(message.audioSrc, message.volume);
            sendResponse({ success: true });
        } else if (message.type === 'STOP_AZAN') {
            stopAzan();
            sendResponse({ success: true });
        }
        return true; // Keep the message channel open for async response
    });
}

// Check if there's a pending azan on load
if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('pendingAzan').then((result) => {
        if (result.pendingAzan && result.pendingAzan.audioSrc) {
            playAzan(result.pendingAzan.audioSrc, result.pendingAzan.volume);
            chrome.storage.local.remove('pendingAzan');
        }
    }).catch(err => {
        console.error('❌ Error checking pending azan:', err);
    });
}

async function playAzan(audioSrc, volume) {
    try {
        console.log('🎵 Offscreen: Playing Azan', { audioSrc, volume });
        
        const audio = document.getElementById('azanAudio');
        audio.src = audioSrc;
        audio.volume = volume / 100;
        
        // Try to play the audio
        await audio.play();
        console.log('✅ Offscreen: Azan playing successfully');
        
        // When audio ends, notify background script
        audio.onended = () => {
            console.log('✅ Offscreen: Azan playback completed');
            chrome.runtime.sendMessage({ type: 'AZAN_ENDED' }).catch(err => {
                console.log('Background script not listening:', err);
            });
        };
        
        audio.onerror = (e) => {
            console.error('❌ Offscreen: Audio error', e);
            chrome.runtime.sendMessage({ 
                type: 'AZAN_ERROR', 
                error: e.target.error?.message || 'Unknown error'
            }).catch(err => {
                console.log('Background script not listening:', err);
            });
        };
        
    } catch (error) {
        console.error('❌ Offscreen: Error playing Azan:', error);
        chrome.runtime.sendMessage({ 
            type: 'AZAN_ERROR', 
            error: error.message 
        }).catch(err => {
            console.log('Background script not listening:', err);
        });
    }
}

function stopAzan() {
    const audio = document.getElementById('azanAudio');
    audio.pause();
    audio.currentTime = 0;
    console.log('🛑 Offscreen: Azan stopped');
}
