type OscType = OscillatorType;

interface NoteEvent {
  step: number;
  note: string | null;
  length?: number;
  volume?: number;
  type?: OscType;
}

const NOTE_FREQ: Record<string, number> = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
};

const LEAD: NoteEvent[] = [
  { step: 0, note: 'E4', length: 1 },
  { step: 1, note: 'G4', length: 1 },
  { step: 2, note: 'A4', length: 2 },
  { step: 4, note: 'G4', length: 1 },
  { step: 5, note: 'E4', length: 1 },
  { step: 6, note: 'D4', length: 2 },
  { step: 8, note: 'E4', length: 1 },
  { step: 9, note: 'G4', length: 1 },
  { step: 10, note: 'B4', length: 2 },
  { step: 12, note: 'A4', length: 1 },
  { step: 13, note: 'G4', length: 1 },
  { step: 14, note: 'E4', length: 2 },
  { step: 16, note: 'A4', length: 1 },
  { step: 17, note: 'B4', length: 1 },
  { step: 18, note: 'C5', length: 2 },
  { step: 20, note: 'B4', length: 1 },
  { step: 21, note: 'A4', length: 1 },
  { step: 22, note: 'G4', length: 2 },
  { step: 24, note: 'E4', length: 1 },
  { step: 25, note: 'G4', length: 1 },
  { step: 26, note: 'A4', length: 2 },
  { step: 28, note: 'G4', length: 1 },
  { step: 29, note: 'E4', length: 1 },
  { step: 30, note: 'D4', length: 2 },
];

const BASS: NoteEvent[] = [
  { step: 0, note: 'A3', length: 1 },
  { step: 2, note: 'A3', length: 1 },
  { step: 4, note: 'E3', length: 1 },
  { step: 6, note: 'E3', length: 1 },
  { step: 8, note: 'F3', length: 1 },
  { step: 10, note: 'F3', length: 1 },
  { step: 12, note: 'G3', length: 1 },
  { step: 14, note: 'G3', length: 1 },
  { step: 16, note: 'A3', length: 1 },
  { step: 18, note: 'A3', length: 1 },
  { step: 20, note: 'E3', length: 1 },
  { step: 22, note: 'E3', length: 1 },
  { step: 24, note: 'F3', length: 1 },
  { step: 26, note: 'G3', length: 1 },
  { step: 28, note: 'A3', length: 1 },
  { step: 30, note: 'E3', length: 1 },
];

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timers: number[] = [];
  private isPlaying = false;
  private stepSeconds = 0.145;
  private loopSteps = 32;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  async start() {
    const ctx = this.ensureContext();
    if (!ctx || !this.master || this.isPlaying) return;
    if (ctx.state === 'suspended') await ctx.resume();
    this.isPlaying = true;
    this.scheduleLoop();
  }

  stop() {
    this.isPlaying = false;
    this.timers.forEach(id => window.clearTimeout(id));
    this.timers = [];
  }

  toggle(enabled: boolean) {
    if (enabled) {
      void this.start();
    } else {
      this.stop();
    }
  }

  private scheduleLoop() {
    if (!this.isPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + 0.05;
    for (let step = 0; step < this.loopSteps; step++) {
      this.scheduleStep(startTime, step);
    }

    const timer = window.setTimeout(() => this.scheduleLoop(), this.loopSteps * this.stepSeconds * 1000);
    this.timers.push(timer);
  }

  private scheduleStep(loopStart: number, step: number) {
    const leadNote = LEAD.find(event => event.step === step);
    const bassNote = BASS.find(event => event.step === step);
    const time = loopStart + step * this.stepSeconds;

    if (leadNote?.note) this.playTone(leadNote.note, time, (leadNote.length ?? 1) * this.stepSeconds * 0.86, 0.09, 'square');
    if (bassNote?.note) this.playTone(bassNote.note, time, (bassNote.length ?? 1) * this.stepSeconds * 0.78, 0.07, 'triangle');

    if (step % 4 === 0) this.playKick(time);
    if (step % 8 === 4) this.playSnare(time);
    if (step % 2 === 1) this.playHiHat(time);
  }

  private playTone(note: string, time: number, duration: number, volume: number, type: OscType) {
    if (!this.ctx || !this.master) return;
    const freq = NOTE_FREQ[note];
    if (!freq) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + duration + 0.04);
  }

  private playKick(time: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(92, time);
    osc.frequency.exponentialRampToValueAtTime(44, time + 0.08);
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  private playSnare(time: number) {
    this.playNoise(time, 0.07, 0.07, 1200);
  }

  private playHiHat(time: number) {
    this.playNoise(time, 0.018, 0.025, 4200);
  }

  private playNoise(time: number, duration: number, volume: number, cutoff: number) {
    if (!this.ctx || !this.master) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(cutoff, time);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(time);
  }
}

export const retroAudioEngine = new RetroAudioEngine();
