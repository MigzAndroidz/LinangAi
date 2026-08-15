// Web Audio API Synthesizer for Reminder Chimes & Ambient Focus Soundscapes

class AudioService {
  constructor() {
    this.ctx = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.currentAmbientType = null;
    this.masterVolume = 0.75;
  }

  // Lazy-initialize audio context on first user action to comply with browser autoplay policies
  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(this.masterVolume * 0.4, this.ctx.currentTime);
    }
  }

  // ==========================================
  // Proactive Reminder Alert Chimes
  // ==========================================
  playReminderSound(tone = 'chime') {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(this.masterVolume, now);
    master.connect(ctx.destination);

    switch (tone) {
      case 'bell': {
        // Soft metallic tubular bell
        const freqs = [587.33, 880.0, 1174.66, 1760.0]; // D5, A5, D6, A6
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);

          const decay = 1.8 - idx * 0.3;
          gain.gain.setValueAtTime(0.3 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

          osc.connect(gain);
          gain.connect(master);

          osc.start(now);
          osc.stop(now + decay);
        });
        break;
      }

      case 'marimba': {
        // Warm wooden percussive marimba sequence
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const hitTime = now + i * 0.08;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, hitTime);

          gain.gain.setValueAtTime(0, hitTime);
          gain.gain.linearRampToValueAtTime(0.4, hitTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.5);

          osc.connect(gain);
          gain.connect(master);

          osc.start(hitTime);
          osc.stop(hitTime + 0.6);
        });
        break;
      }

      case 'radar': {
        // High-tech subtle double pip
        [0, 0.14].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + delay;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(1400, t);
          osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);

          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

          osc.connect(gain);
          gain.connect(master);

          osc.start(t);
          osc.stop(t + 0.09);
        });
        break;
      }

      case 'success': {
        // Upward celebratory chord for homework completion
        const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C major triad up to E6
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const t = now + idx * 0.06;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

          osc.connect(gain);
          gain.connect(master);

          osc.start(t);
          osc.stop(t + 1.3);
        });
        break;
      }

      case 'chime':
      default: {
        // Classic uplifting harmonic study chime (Fmaj7 chord)
        const notes = [349.23, 440.0, 523.25, 659.25]; // F4, A4, C5, E5
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + i * 0.09;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.4);

          osc.connect(gain);
          gain.connect(master);

          osc.start(startTime);
          osc.stop(startTime + 1.5);
        });
        break;
      }
    }
  }

  // ==========================================
  // Continuous Ambient Soundscapes for Focus
  // ==========================================
  startAmbient(type) {
    if (this.currentAmbientType === type && this.ambientSource) {
      return;
    }
    this.stopAmbient();

    const ctx = this.initContext();
    if (!ctx) return;

    this.currentAmbientType = type;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.masterVolume * 0.35, ctx.currentTime);
    this.ambientGain.connect(ctx.destination);

    switch (type) {
      case 'rain': {
        // Soft pink noise filtered with gentle modulation
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
          b6 = white * 0.115926;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);

        rainSource.connect(filter);
        filter.connect(this.ambientGain);
        rainSource.start();
        this.ambientSource = rainSource;
        break;
      }

      case 'ocean': {
        // Brown noise + LFO amplitude modulation
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }

        const oceanSource = ctx.createBufferSource();
        oceanSource.buffer = noiseBuffer;
        oceanSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1, ctx.currentTime); // 10 second period

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.5, ctx.currentTime); // LFO depth
        
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.5, ctx.currentTime); // Base volume
        
        lfo.connect(lfoGain);
        lfoGain.connect(masterGain.gain);
        
        oceanSource.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(this.ambientGain);

        oceanSource.start();
        lfo.start();
        
        this.ambientSource = {
          stop: () => {
            try { oceanSource.stop(); lfo.stop(); } catch {}
          }
        };
        break;
      }

      case 'forest': {
        // Filtered noise + randomized chirps
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.1;
        }

        const windSource = ctx.createBufferSource();
        windSource.buffer = noiseBuffer;
        windSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(0.5, ctx.currentTime);

        windSource.connect(filter);
        filter.connect(this.ambientGain);
        windSource.start();

        let timeoutId;
        const playChirp = () => {
          if (this.currentAmbientType !== 'forest') return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          
          const t = ctx.currentTime;
          const freq = 2000 + Math.random() * 1500;
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.8, t + 0.1);
          
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          
          osc.connect(gain);
          gain.connect(this.ambientGain);
          osc.start(t);
          osc.stop(t + 0.15);
          
          timeoutId = setTimeout(playChirp, 2000 + Math.random() * 4000);
        };
        timeoutId = setTimeout(playChirp, 1000);

        this.ambientSource = {
          stop: () => {
            try { windSource.stop(); } catch {}
            clearTimeout(timeoutId);
          }
        };
        break;
      }

      case 'pad': {
        // Soft Piano Pad (synthesized 2-3 sine oscillators, slow I-IV-V pad)
        const chords = [
          [261.63, 329.63, 392.00], // C4, E4, G4 (I)
          [349.23, 440.00, 523.25], // F4, A4, C5 (IV)
          [392.00, 493.88, 587.33]  // G4, B4, D5 (V)
        ];
        
        let chordIndex = 0;
        let timeoutId;
        const oscs = [];
        const gains = [];
        
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, ctx.currentTime);
          
          osc.connect(gain);
          gain.connect(this.ambientGain);
          osc.start();
          
          oscs.push(osc);
          gains.push(gain);
        }
        
        const playChord = () => {
          if (this.currentAmbientType !== 'pad') return;
          const t = ctx.currentTime;
          const chord = chords[chordIndex];
          
          for (let i = 0; i < 3; i++) {
            oscs[i].frequency.setValueAtTime(chord[i], t);
            gains[i].gain.cancelScheduledValues(t);
            gains[i].gain.setValueAtTime(gains[i].gain.value, t);
            gains[i].gain.linearRampToValueAtTime(0.1, t + 3);
            gains[i].gain.linearRampToValueAtTime(0, t + 9);
          }
          
          chordIndex = (chordIndex + 1) % chords.length;
          timeoutId = setTimeout(playChord, 8000); // 8 seconds per chord
        };
        
        playChord();
        
        this.ambientSource = {
          stop: () => {
            clearTimeout(timeoutId);
            try {
               for(let i=0; i<3; i++) {
                 gains[i].gain.cancelScheduledValues(ctx.currentTime);
                 gains[i].gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
                 setTimeout(() => {
                   try { oscs[i].stop(); } catch {}
                 }, 150);
               }
            } catch {}
          }
        };
        break;
      }

      case 'focus_tone': {
        // Calm Focus Tone: two detuned oscillators (e.g., 200Hz & 204Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(200, ctx.currentTime);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(204, ctx.currentTime);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ambientGain);
        
        osc1.start();
        osc2.start();
        
        this.ambientSource = {
          stop: () => {
            try { osc1.stop(); osc2.stop(); } catch {}
          }
        };
        break;
      }

      default:
        this.currentAmbientType = null;
        break;
    }
  }

  stopAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch {}
      this.ambientSource = null;
    }
    this.currentAmbientType = null;
  }
}

export const audioService = new AudioService();
