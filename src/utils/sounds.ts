// Web Audio API sound effects for Tet game
// Vietnamese pentatonic scale + Tết melodies + Lì Xì effects

let audioCtx: AudioContext | null = null;
let musicEnabled = true;
let sfxEnabled = true;
let bgMusicTimeout: ReturnType<typeof setTimeout> | null = null;
let bgMusicPlaying = false;
let melodyIndex = 0;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Pre-initialize AudioContext on first user interaction to avoid lag later.
// Call this from any early click/touch handler (e.g. access code verify).
export function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new AudioContext();
  } catch { /* not supported */ }
}

// Vietnamese pentatonic scale (Hơi Nam) - C D E G A across octaves
const PENTA = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

// Tết melody phrases - inspired by "Xuân Đã Về", "Ngày Tết Quê Em"
// Each phrase: [noteIndex, duration, restAfter]
const TET_MELODIES: [number, number, number][][] = [
  // Phrase 1: Xuân đã về (ascending, joyful)
  [[4, 0.3, 0.05], [5, 0.3, 0.05], [7, 0.5, 0.1], [5, 0.3, 0.05], [4, 0.5, 0.3]],
  // Phrase 2: Ngày Tết (bouncy, festive)
  [[2, 0.2, 0.05], [4, 0.2, 0.05], [5, 0.4, 0.1], [4, 0.2, 0.05], [2, 0.2, 0.05], [0, 0.5, 0.3]],
  // Phrase 3: Mùa xuân (gentle, flowing)
  [[0, 0.4, 0.05], [2, 0.3, 0.05], [4, 0.3, 0.1], [5, 0.4, 0.05], [7, 0.6, 0.4]],
  // Phrase 4: Hoa mai nở (descending grace)
  [[7, 0.3, 0.05], [5, 0.3, 0.05], [4, 0.3, 0.1], [2, 0.4, 0.05], [0, 0.6, 0.3]],
  // Phrase 5: Pháo hoa (playful, quick)
  [[0, 0.15, 0.05], [2, 0.15, 0.05], [4, 0.15, 0.05], [5, 0.15, 0.05], [7, 0.4, 0.1], [5, 0.2, 0.05], [4, 0.5, 0.4]],
  // Phrase 6: Đón xuân (call-response)
  [[5, 0.3, 0.1], [4, 0.2, 0.05], [2, 0.3, 0.1], [4, 0.4, 0.1], [5, 0.3, 0.05], [7, 0.6, 0.4]],
  // Phrase 7: Lì xì đỏ (rhythmic, bouncy)
  [[4, 0.2, 0.05], [4, 0.2, 0.1], [5, 0.3, 0.05], [7, 0.3, 0.1], [5, 0.2, 0.05], [4, 0.2, 0.05], [2, 0.5, 0.3]],
  // Phrase 8: Sum vầy (warm, resting)
  [[2, 0.4, 0.05], [0, 0.3, 0.1], [2, 0.3, 0.05], [4, 0.5, 0.1], [2, 0.3, 0.05], [0, 0.7, 0.5]],
];

function playToneImmediate(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch { /* audio not supported */ }
}

// Deferred version — never blocks caller
function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  if (!sfxEnabled) return;
  setTimeout(() => playToneImmediate(freq, duration, type, volume), 0);
}

// Play a note with Vietnamese vibrato (rung) ornament
function playVibratoNote(freq: number, duration: number, volume = 0.06) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();

    // Main tone
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Subtle vibrato (Vietnamese style - gentle pitch wobble)
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(5, ctx.currentTime); // 5Hz vibrato
    vibratoGain.gain.setValueAtTime(freq * 0.008, ctx.currentTime); // subtle
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    // Volume envelope - soft attack, natural decay
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(volume * 0.6, ctx.currentTime + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    vibrato.start();
    osc.stop(ctx.currentTime + duration);
    vibrato.stop(ctx.currentTime + duration);
  } catch { /* */ }
}

// --- Sound Effects ---

export function playClick() {
  playTone(800, 0.08, 'square', 0.06);
}

export function playHover() {
  playTone(1200, 0.04, 'sine', 0.03);
}

export function playWin() {
  if (!sfxEnabled) return;
  const notes = [PENTA[0], PENTA[2], PENTA[4], PENTA[5], PENTA[7]];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.25, 'triangle', 0.12), i * 100);
  });
}

export function playLose() {
  playTone(200, 0.4, 'sawtooth', 0.06);
  setTimeout(() => playTone(150, 0.5, 'sawtooth', 0.05), 200);
}

export function playCoinCollect() {
  playTone(PENTA[4], 0.1, 'sine', 0.1);
  setTimeout(() => playTone(PENTA[6], 0.15, 'sine', 0.1), 80);
}

export function playDrum() {
  if (!sfxEnabled) return;
  setTimeout(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch { /* */ }
  }, 0);
}

export function playGong() {
  if (!sfxEnabled) return;
  setTimeout(() => {
    try {
      const ctx = getCtx();
      // Low gong
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(80, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 1.5);
      // Shimmer overtone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(240, ctx.currentTime);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 1.0);
    } catch { /* */ }
  }, 0);
}

export function playChime() {
  if (!sfxEnabled) return;
  const n = PENTA[Math.floor(Math.random() * PENTA.length)];
  playTone(n, 0.3, 'sine', 0.08);
}

export function playSpinTick() {
  playTone(600 + Math.random() * 400, 0.03, 'square', 0.04);
}

export function playRedeem() {
  if (!sfxEnabled) return;
  [PENTA[0], PENTA[2], PENTA[4], PENTA[7]].forEach((n, i) => {
    setTimeout(() => playTone(n, 0.3, 'sine', 0.1), i * 120);
  });
}

// --- Lì Xì Sound Effects ---
// All heavy sound functions are deferred with setTimeout(0) to avoid blocking UI

// Lắc lì xì - jingling coins/bells rattle
export function playShakeLiXi() {
  if (!sfxEnabled) return;
  // Defer audio node creation to avoid blocking the click handler
  setTimeout(() => {
    try {
      const ctx = getCtx();

      // Jingle layers (reduced from 12 to 6 for performance)
      for (let i = 0; i < 6; i++) {
        const delay = i * 0.2 + Math.random() * 0.05;
        const freq = 2000 + Math.random() * 3000;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

        const vol = 0.04 + Math.random() * 0.02;
        gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.1);
      }

      // Low rumble (envelope shaking) - reduced to 3
      for (let i = 0; i < 3; i++) {
        const delay = i * 0.4 + 0.05;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80 + Math.random() * 40, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.07, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.18);
      }

      // Bell accents - reduced to 3
      const bellNotes = [1760, 2349, 2637];
      bellNotes.forEach((freq, i) => {
        const delay = 0.2 + i * 0.4;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.25);
      });
    } catch { /* */ }
  }, 0);
}

// Mở phong bao lì xì - dramatic reveal
export function playOpenLiXi() {
  if (!sfxEnabled) return;
  setTimeout(() => {
    try {
      const ctx = getCtx();

      // Paper rustle (noise burst)
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(3000, ctx.currentTime);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start();

      // Ascending reveal chime
      const revealNotes = [PENTA[2], PENTA[4], PENTA[5], PENTA[7]];
      revealNotes.forEach((freq, i) => {
        const delay = 0.05 + i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.35);
      });

      // Final sparkle
      setTimeout(() => {
        playTone(PENTA[7], 0.4, 'sine', 0.08);
      }, 350);
    } catch { /* */ }
  }, 0);
}

// Jackpot lì xì - big win fanfare
export function playJackpotLiXi() {
  if (!sfxEnabled) return;
  setTimeout(() => {
    try {
      const ctx = getCtx();

      // Drum roll - reduced to 4
      for (let i = 0; i < 4; i++) {
        const delay = i * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + delay + 0.08);
        gain.gain.setValueAtTime(0.1 + i * 0.02, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.12);
      }

      // Fanfare melody (ascending pentatonic triumph)
      const fanfare = [PENTA[0], PENTA[2], PENTA[4], PENTA[7]];
      fanfare.forEach((freq, i) => {
        const delay = 0.45 + i * 0.15;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i < 3 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        const vol = i === fanfare.length - 1 ? 0.15 : 0.1;
        const dur = i === fanfare.length - 1 ? 0.8 : 0.2;
        gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur + 0.1);
      });

      // Gong hit at the peak
      setTimeout(() => {
        try {
          const c = getCtx();
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(65, c.currentTime);
          gain.gain.setValueAtTime(0.15, c.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start();
          osc.stop(c.currentTime + 2);
        } catch { /* */ }
      }, 900);

      // Sparkle shower
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const freq = 1200 + Math.random() * 2000;
          playTone(freq, 0.15, 'sine', 0.04);
        }, 1100 + i * 180);
      }
    } catch { /* */ }
  }, 0);
}

// --- Background Music: Nhạc Tết Việt Nam ---

function playMelodyPhrase() {
  if (!musicEnabled || !bgMusicPlaying) return;

  const phrase = TET_MELODIES[melodyIndex % TET_MELODIES.length];
  melodyIndex++;

  let time = 0;
  phrase.forEach(([noteIdx, duration, rest]) => {
    setTimeout(() => {
      if (!musicEnabled || !bgMusicPlaying) return;
      const freq = PENTA[noteIdx];
      playVibratoNote(freq, duration, 0.045);

      // Occasional harmony (play a 5th below quietly)
      if (Math.random() > 0.7 && noteIdx >= 2) {
        playVibratoNote(PENTA[noteIdx - 2] * 0.5, duration * 0.8, 0.015);
      }
    }, time * 1000);
    time += duration + rest;
  });

  // Schedule next phrase after this one finishes
  const totalTime = phrase.reduce((sum, [, d, r]) => sum + d + r, 0);
  const pause = 0.8 + Math.random() * 1.2; // breathing room between phrases

  bgMusicTimeout = setTimeout(() => {
    if (bgMusicPlaying) {
      // Occasional soft drum between phrases
      if (Math.random() > 0.6) {
        playTetDrumBeat();
      }
      playMelodyPhrase();
    }
  }, (totalTime + pause) * 1000);
}

// Soft Tết drum pattern (trống nhỏ)
function playTetDrumBeat() {
  if (!musicEnabled) return;
  try {
    const ctx = getCtx();
    const beats = [0, 0.15, 0.4, 0.55];
    beats.forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const pitch = delay < 0.3 ? 100 : 80;
      osc.frequency.setValueAtTime(pitch, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + delay + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.12);
    });
  } catch { /* */ }
}

export function startBgMusic() {
  if (bgMusicPlaying) return;
  bgMusicPlaying = true;
  musicEnabled = true;
  melodyIndex = Math.floor(Math.random() * TET_MELODIES.length);
  playMelodyPhrase();
}

export function stopBgMusic() {
  bgMusicPlaying = false;
  musicEnabled = false;
  if (bgMusicTimeout) {
    clearTimeout(bgMusicTimeout);
    bgMusicTimeout = null;
  }
}

export function isMusicPlaying(): boolean {
  return bgMusicPlaying;
}

export function toggleMusic(): boolean {
  if (bgMusicPlaying) {
    stopBgMusic();
    return false;
  } else {
    startBgMusic();
    return true;
  }
}

export function setSfxEnabled(enabled: boolean) {
  sfxEnabled = enabled;
}

export function isSfxEnabled(): boolean {
  return sfxEnabled;
}
