import { AmbientSoundType } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private binauralOscLeft: OscillatorNode | null = null;
  private binauralOscRight: OscillatorNode | null = null;
  private currentType: AmbientSoundType = 'none';

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public stopAmbient() {
    if (this.noiseNode) {
      try { (this.noiseNode as any).stop?.(); } catch (e) {}
      try { this.noiseNode.disconnect(); } catch (e) {}
      this.noiseNode = null;
    }
    if (this.binauralOscLeft) {
      try { this.binauralOscLeft.stop(); } catch (e) {}
      try { this.binauralOscLeft.disconnect(); } catch (e) {}
      this.binauralOscLeft = null;
    }
    if (this.binauralOscRight) {
      try { this.binauralOscRight.stop(); } catch (e) {}
      try { this.binauralOscRight.disconnect(); } catch (e) {}
      this.binauralOscRight = null;
    }
    if (this.gainNode) {
      try { this.gainNode.disconnect(); } catch (e) {}
      this.gainNode = null;
    }
    this.currentType = 'none';
  }

  public setAmbientSound(type: AmbientSoundType, volume: number = 0.5) {
    this.initCtx();
    if (!this.ctx) return;

    if (type === this.currentType) {
      if (this.gainNode) {
        this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
      }
      return;
    }

    this.stopAmbient();
    if (type === 'none') return;

    this.currentType = type;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume * 0.4)), this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);
    this.gainNode = masterGain;

    if (type === 'white' || type === 'brown' || type === 'rain') {
      const bufferSize = 2 * this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'brown') {
          // Brown noise integration filter
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Gain compensation
        } else if (type === 'rain') {
          // Filtered rain texture
          const pink = (lastOut + 0.05 * white) / 1.05;
          lastOut = pink;
          output[i] = pink * (0.8 + 0.2 * Math.sin(i / 1000));
        } else {
          // White noise
          output[i] = white * 0.2;
        }
      }

      const whiteNoiseSource = this.ctx.createBufferSource();
      whiteNoiseSource.buffer = buffer;
      whiteNoiseSource.loop = true;

      // Filter for rain / brown
      if (type === 'rain' || type === 'brown') {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(type === 'rain' ? 800 : 400, this.ctx.currentTime);
        whiteNoiseSource.connect(filter);
        filter.connect(masterGain);
      } else {
        whiteNoiseSource.connect(masterGain);
      }

      whiteNoiseSource.start();
      this.noiseNode = whiteNoiseSource;
    } else if (type === 'binaural_alpha' || type === 'binaural_beta') {
      // Binaural Beats: Base 200 Hz
      // Alpha = 10Hz difference (200Hz left, 210Hz right)
      // Beta = 18Hz difference (200Hz left, 218Hz right)
      const baseFreq = 200;
      const diffFreq = type === 'binaural_alpha' ? 10 : 18;

      const merger = this.ctx.createChannelMerger(2);

      const oscL = this.ctx.createOscillator();
      const oscR = this.ctx.createOscillator();

      oscL.type = 'sine';
      oscR.type = 'sine';

      oscL.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      oscR.frequency.setValueAtTime(baseFreq + diffFreq, this.ctx.currentTime);

      oscL.connect(merger, 0, 0); // left channel
      oscR.connect(merger, 0, 1); // right channel

      merger.connect(masterGain);

      oscL.start();
      oscR.start();

      this.binauralOscLeft = oscL;
      this.binauralOscRight = oscR;
    }
  }

  // Timer completion chime gong sound
  public playChime(volume: number = 0.8) {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    // Warm chord chime (E4, G#4, B4, E5)
    const freqs = [329.63, 415.30, 493.88, 659.25];

    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now);

      osc.connect(gain);
      osc.start(now + idx * 0.08);
      osc.stop(now + 2.5);
    });

    gain.connect(this.ctx.destination);
  }
}

export const soundEngine = new SoundEngine();
