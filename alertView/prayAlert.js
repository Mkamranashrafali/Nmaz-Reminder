const ctx = new (window.AudioContext || window.webkitAudioContext)();
let audioBuffer;

async function loadAdhanAudio() {
  try {
    var adhanType = "/assets/mp3/adhan.mp3";

    chrome.storage.local.get("adhanType", async (res) => {
      if (res.adhanType == "solid") {
        adhanType = "/assets/mp3/solid_adhan.mp3";
      }

      const response = await fetch(adhanType);
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const adhanEnabled = await isAdhanOn();
      if (adhanEnabled) {
        playback();
      }
    });
  } catch (error) {
    console.error("🔴 Hiba az audio betöltésében:", error);
  }
}

async function isAdhanOn() {
  return new Promise((resolve) => {
    chrome.storage.local.get("adhan", (res) => {
      if (res.adhan !== undefined) {
        resolve(res.adhan);
      } else {
        resolve(true);
      }
    });
  });
}

function playback() {
  if (!audioBuffer) return;

  const playSound = ctx.createBufferSource();
  playSound.buffer = audioBuffer;
  playSound.connect(ctx.destination);
  playSound.start(ctx.currentTime);
}

document.addEventListener("DOMContentLoaded", () => {
  loadAdhanAudio();
});
