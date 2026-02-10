// Web Audio API sound effects for Tet game
// Uses pentatonic scale for Vietnamese/Asian-themed sounds

let audioCtx: AudioContext | null = null;
let musicEnabled = true;
let sfxEnabled = true;
let bgMusicInterval: ReturnType<typeof setInterval> | null = null;
let bgMusicPlaying = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Pentatonic notes (C D E G A) for Asian feel
const PENTA = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  if (!sfxEnabled) return;
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
}

export function playGong() {
  if (!sfxEnabled) return;
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

// --- Background Music ---

function playMusicNote() {
  if (!musicEnabled || !bgMusicPlaying) return;
  const idx = Math.floor(Math.random() * PENTA.length);
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(PENTA[idx] * (Math.random() > 0.5 ? 0.5 : 1), ctx.currentTime);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch { /* */ }
}

export function startBgMusic() {
  if (bgMusicPlaying) return;
  bgMusicPlaying = true;
  musicEnabled = true;
  // Ambient pentatonic notes every 800-1600ms
  const tick = () => {
    if (!bgMusicPlaying) return;
    playMusicNote();
    bgMusicInterval = setTimeout(tick, 800 + Math.random() * 800) as unknown as ReturnType<typeof setInterval>;
  };
  tick();
}

export function stopBgMusic() {
  bgMusicPlaying = false;
  musicEnabled = false;
  if (bgMusicInterval) {
    clearTimeout(bgMusicInterval as unknown as number);
    bgMusicInterval = null;
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
