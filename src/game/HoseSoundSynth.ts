import { settingsManager } from "./Settings";
import * as THREE from "three";

class HoseSoundSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Water spray sound nodes
  private waterSource: AudioBufferSourceNode | null = null;
  private waterGain: GainNode | null = null;
  private waterFilter: BiquadFilterNode | null = null;
  private waterBandpass: BiquadFilterNode | null = null;
  private waterLFO: OscillatorNode | null = null;
  private waterLFOGain: GainNode | null = null;
  
  // Chocolate hose sound nodes
  private chocolateSource: AudioBufferSourceNode | null = null;
  private chocolateGain: GainNode | null = null;
  private chocolateFilter: BiquadFilterNode | null = null;
  private chocolateAM: GainNode | null = null;
  private chocolateLFO: OscillatorNode | null = null;
  private chocolateLFOGain: GainNode | null = null;
  private chocolateFilterModGain: GainNode | null = null;
  
  private activeType: "water" | "chocolate" | null = null;
  private initialized = false;
  private userVolume = 1.0;

  constructor() {
    if (typeof window !== "undefined") {
      // Subscribe to settings for volume updates
      settingsManager.subscribe((settings) => {
        this.userVolume = settings.volume;
        this.updateMasterVolume();
      });
      this.userVolume = settingsManager.getSettings().volume;
    }
  }

  private init() {
    if (this.initialized) return;
    
    // Get shared AudioContext from THREE.js AudioContext
    const context = THREE.AudioContext.getContext() as AudioContext;
    if (!context) return;
    this.ctx = context;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.userVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Create a beautiful, warm, organic brown noise buffer for relaxing water streaming (no harsh high-frequency tinniness)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // High-coefficient integration filter (shifts energy heavily to ultra-low registers to remove all ear fatigue)
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 6.0; // compensate for low-frequency attenuation
    }

    // --- SETUP WATER SPRAY (Continuous, smooth, powerwasher stream) ---
    this.waterSource = this.ctx.createBufferSource();
    this.waterSource.buffer = noiseBuffer;
    this.waterSource.loop = true;

    // Deep lowpass and bandpass to turn brown noise into a gentle whispering stream or soft mist
    this.waterFilter = this.ctx.createBiquadFilter();
    this.waterFilter.type = "lowpass";
    this.waterFilter.frequency.setValueAtTime(650, this.ctx.currentTime); // Whisper frequency

    this.waterBandpass = this.ctx.createBiquadFilter();
    this.waterBandpass.type = "bandpass";
    this.waterBandpass.frequency.setValueAtTime(400, this.ctx.currentTime);
    this.waterBandpass.Q.setValueAtTime(0.7, this.ctx.currentTime);

    // Warm water movement slow LFO to resemble changing spray angles/pressure realistically
    this.waterLFO = this.ctx.createOscillator();
    this.waterLFO.type = "sine";
    this.waterLFO.frequency.setValueAtTime(0.3, this.ctx.currentTime); // Gentle 0.3 Hz rhythmic swell

    this.waterLFOGain = this.ctx.createGain();
    this.waterLFOGain.gain.setValueAtTime(80, this.ctx.currentTime); // modulates filter gently

    this.waterLFO.connect(this.waterLFOGain);
    this.waterLFOGain.connect(this.waterBandpass.frequency);

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Chain: Source -> Lowpass -> Bandpass (Modulated) -> Gain -> Master
    this.waterSource.connect(this.waterFilter);
    this.waterFilter.connect(this.waterBandpass);
    this.waterBandpass.connect(this.waterGain);
    this.waterGain.connect(this.masterGain);

    // --- SETUP CHOCOLATE FLUID (Bubbling, wet Splatoon-like splatting paint) ---
    this.chocolateSource = this.ctx.createBufferSource();
    this.chocolateSource.buffer = noiseBuffer;
    this.chocolateSource.loop = true;

    // Deep bandpass filter for thick paint stream viscosity
    this.chocolateFilter = this.ctx.createBiquadFilter();
    this.chocolateFilter.type = "bandpass";
    this.chocolateFilter.frequency.setValueAtTime(220, this.ctx.currentTime); // Soothing bass resonance
    this.chocolateFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    // Squelch LPF to make it extra soft, calming, and bubble-sound compatible
    const squelchLPF = this.ctx.createBiquadFilter();
    squelchLPF.type = "lowpass";
    squelchLPF.frequency.setValueAtTime(320, this.ctx.currentTime);

    this.chocolateAM = this.ctx.createGain();
    this.chocolateAM.gain.setValueAtTime(1.0, this.ctx.currentTime);

    this.chocolateGain = this.ctx.createGain();
    this.chocolateGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // LFO to modulate gain rapidly to make a "bubbly, splattering, glop-glop" sound
    this.chocolateLFO = this.ctx.createOscillator();
    this.chocolateLFO.type = "sine";
    this.chocolateLFO.frequency.setValueAtTime(9, this.ctx.currentTime); // Slow, satisfying 9Hz bubbling rate

    // Modulates amplitude up and down to create mud bubbles texture
    this.chocolateLFOGain = this.ctx.createGain();
    this.chocolateLFOGain.gain.setValueAtTime(0.3, this.ctx.currentTime); // Soft intensity
    
    this.chocolateLFO.connect(this.chocolateLFOGain);
    this.chocolateLFOGain.connect(this.chocolateAM.gain);

    // Modulate filter frequency with the LFO to make the squelching sound super organic
    this.chocolateFilterModGain = this.ctx.createGain();
    this.chocolateFilterModGain.gain.setValueAtTime(50, this.ctx.currentTime); // Gentle sweep
    this.chocolateLFO.connect(this.chocolateFilterModGain);
    this.chocolateFilterModGain.connect(this.chocolateFilter.frequency);

    // Chain: Source -> Viscosity Filter -> Squelch LPF -> AM Gain -> Main Gain -> Master
    this.chocolateSource.connect(this.chocolateFilter);
    this.chocolateFilter.connect(squelchLPF);
    squelchLPF.connect(this.chocolateAM);
    this.chocolateAM.connect(this.chocolateGain);
    this.chocolateGain.connect(this.masterGain);

    // Start audio sources
    this.waterSource.start(0);
    this.waterLFO.start(0);
    this.chocolateSource.start(0);
    this.chocolateLFO.start(0);

    this.initialized = true;
  }

  private updateMasterVolume() {
    if (!this.initialized || !this.ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(this.userVolume, this.ctx.currentTime, 0.05);
  }

  public setLocalSprayActive(type: "water" | "chocolate" | null) {
    if (typeof window === "undefined") return;

    // Try to unlock/resume context if it is suspended
    const context = THREE.AudioContext.getContext() as AudioContext;
    if (context && context.state === "suspended") {
      context.resume().catch(() => {});
    }

    if (!this.initialized && type !== null) {
      this.init();
    }

    if (!this.initialized || !this.ctx || !this.waterGain || !this.chocolateGain) return;

    if (this.activeType === type) return; // No duplicate state transitions
    this.activeType = type;

    const now = this.ctx.currentTime;
    const timeConstant = 0.08; // 80ms smoother swell/fade to protect the ears from abrupt pops

    if (type === "water") {
      // Gentle, low-intensity whispering stream
      this.waterGain.gain.setTargetAtTime(0.38, now, timeConstant);
      this.chocolateGain.gain.setTargetAtTime(0, now, timeConstant);
    } else if (type === "chocolate") {
      // Calming mud-splatting fluid
      this.waterGain.gain.setTargetAtTime(0, now, timeConstant);
      this.chocolateGain.gain.setTargetAtTime(0.28, now, timeConstant);
    } else {
      // Fade completely to silent
      this.waterGain.gain.setTargetAtTime(0, now, timeConstant);
      this.chocolateGain.gain.setTargetAtTime(0, now, timeConstant);
    }
  }

  public stopAll() {
    this.setLocalSprayActive(null);
  }
}

export const hoseSoundSynth = new HoseSoundSynth();
