/**
 * Schedulfy Web Audio Synthesizer Engine
 * 100% Native Web Audio API — Zero MP3 downloads, zero latency, works offline & in background.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioContextClass();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

export type AlarmSoundId =
  | "zen_bell"
  | "energetic_pulse"
  | "digital_alarm"
  | "synth_ambient"
  | "vitality_gong";

export interface SoundOption {
  id: AlarmSoundId;
  name: string;
  description: string;
  icon: string;
}

export const ALARM_SOUND_OPTIONS: SoundOption[] = [
  {
    id: "zen_bell",
    name: "Zen Singing Bowl",
    description: "528Hz Solfeggio meditative tone with rich harmonic resonance",
    icon: "🔔",
  },
  {
    id: "energetic_pulse",
    name: "Energetic Arpeggio",
    description: "4-note bright ascending pulse for focus & movement",
    icon: "⚡",
  },
  {
    id: "digital_alarm",
    name: "Classic Digital Beep",
    description: "Crisp rhythmic double-beep high-urgency alarm",
    icon: "📟",
  },
  {
    id: "synth_ambient",
    name: "Warm Ambient Glow",
    description: "Analog Fmaj7 synthesizer chord with smooth fade",
    icon: "🎶",
  },
  {
    id: "vitality_gong",
    name: "Bronze Vitality Gong",
    description: "Deep 110Hz resonant bronze gong strike with acoustic decay",
    icon: "🥁",
  },
];

/**
 * Play a single iteration of the selected synthesized sound
 */
export function playSoundOnce(soundId: AlarmSoundId, volume: number = 0.8): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    const safeVol = Math.max(0.05, Math.min(1.0, volume));
    masterGain.gain.setValueAtTime(safeVol, now);
    masterGain.connect(ctx.destination);

    if (soundId === "zen_bell") {
      // 528Hz harmonic bell with soft attack and warm decay
      const freqs = [528, 1056, 1584, 2112];
      const gains = [0.6, 0.25, 0.12, 0.05];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(gains[idx], now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 2.5);
      });
    } else if (soundId === "energetic_pulse") {
      // Ascending 4-note arpeggio (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + i * 0.12;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.4, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.45);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + 0.5);
      });
    } else if (soundId === "digital_alarm") {
      // Classic 880Hz double beep (beep-beep)
      const beeps = [0, 0.16];
      beeps.forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const bStart = now + offset;

        osc.type = "square";
        osc.frequency.setValueAtTime(880, bStart);

        gain.gain.setValueAtTime(0, bStart);
        gain.gain.linearRampToValueAtTime(0.25, bStart + 0.01);
        gain.gain.setValueAtTime(0.25, bStart + 0.08);
        gain.gain.linearRampToValueAtTime(0, bStart + 0.09);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(bStart);
        osc.stop(bStart + 0.1);
      });
    } else if (soundId === "synth_ambient") {
      // Warm Fmaj7 chord (349Hz, 440Hz, 523Hz, 659Hz)
      const chord = [349.23, 440.0, 523.25, 659.25];
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, now);
      filter.connect(masterGain);

      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

        osc.connect(gain);
        gain.connect(filter);

        osc.start(now);
        osc.stop(now + 2.1);
      });
    } else if (soundId === "vitality_gong") {
      // Deep 110Hz bronze gong strike with sub-bass decay
      const harmonics = [110, 220, 330, 440, 580];
      const weights = [0.7, 0.35, 0.2, 0.1, 0.05];

      harmonics.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.98, now + 2.8);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(weights[idx], now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 3.2);
      });
    }
  } catch (err) {
    console.warn("Web Audio playback failed:", err);
  }
}

/**
 * Loop the selected alarm melody continuously until dismissed
 */
export function startAlarmLoop(
  soundId: AlarmSoundId,
  volume: number = 0.8
): { stop: () => void } {
  let isRinging = true;

  // Immediate ring
  playSoundOnce(soundId, volume);

  const intervalTime =
    soundId === "zen_bell"
      ? 2800
      : soundId === "vitality_gong"
      ? 3400
      : soundId === "energetic_pulse"
      ? 1800
      : soundId === "digital_alarm"
      ? 1200
      : 2400;

  const timer = setInterval(() => {
    if (!isRinging) {
      clearInterval(timer);
      return;
    }
    playSoundOnce(soundId, volume);
  }, intervalTime);

  return {
    stop: () => {
      isRinging = false;
      clearInterval(timer);
    },
  };
}
