class SoundManagerClass {
  private ctx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};

  public init(): void {
    if (!this.ctx) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.generateBuffers();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private generateBuffers(): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2; 

    // White Noise
    const wBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const wData = wBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      wData[i] = Math.random() * 2 - 1;
    }
    this.buffers.white = wBuffer;

    // Pink Noise
    const pBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const pData = pBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pData[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      pData[i] *= 0.11;
      b6 = white * 0.115926;
    }
    this.buffers.pink = pBuffer;
  }

  public playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  public playSparkle(vol: number = 0.1): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Hiss
    const hissSrc = this.ctx.createBufferSource();
    hissSrc.buffer = this.buffers.white;
    const hissGain = this.ctx.createGain();
    const hissFilter = this.ctx.createBiquadFilter();
    
    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 5000; 
    
    hissGain.gain.setValueAtTime(vol * 0.4, t);
    hissGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3); 
    
    hissSrc.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.ctx.destination);
    hissSrc.start(t);
    hissSrc.stop(t + 0.3);

    // Crackles
    const count = Math.floor(2 + Math.random() * 3); 
    for(let i=0; i<count; i++) {
        const popSrc = this.ctx.createBufferSource();
        popSrc.buffer = this.buffers.white;
        const popGain = this.ctx.createGain();
        const popFilter = this.ctx.createBiquadFilter();
        
        popFilter.type = 'bandpass';
        popFilter.frequency.value = 3000 + Math.random() * 4000; 
        popFilter.Q.value = 2;
        
        const offset = Math.random() * 0.15; 
        
        popGain.gain.setValueAtTime(0, t + offset);
        popGain.gain.linearRampToValueAtTime(vol * 0.8, t + offset + 0.005); 
        popGain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05); 
        
        popSrc.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(this.ctx.destination);
        
        popSrc.start(t + offset);
        popSrc.stop(t + offset + 0.1);
    }
  }

  public playExplosion(type: string = 'standard', volume: number = 1.0): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (['heavy', 'sutli', 'standard', 'c4', 'mega', 'double_bomb'].includes(type)) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      
      const startFreq = (type === 'heavy' || type === 'c4' || type === 'mega' || type === 'double_bomb') ? 100 : 150;
      const duration = (type === 'heavy' || type === 'c4' || type === 'mega' || type === 'double_bomb') ? 0.6 : 0.2;
      
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(10, t + duration);
      
      const kickVol = (type === 'heavy' || type === 'c4' || type === 'mega' || type === 'double_bomb') ? volume * 1.5 : volume * 0.8;
      gain.gain.setValueAtTime(kickVol, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + duration);
    }

    const src = this.ctx.createBufferSource();
    const noiseGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    const usePink = ['heavy', 'sutli', 'standard', 'c4', 'mega', 'double_bomb', 'fire'].includes(type);
    src.buffer = usePink ? this.buffers.pink : this.buffers.white;

    if (type === 'heavy' || type === 'sutli' || type === 'c4' || type === 'mega' || type === 'double_bomb') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.8);
      noiseGain.gain.setValueAtTime(volume, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
    }
    else if (type === 'fire') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.linearRampToValueAtTime(1000, t + 0.5); 
      
      noiseGain.gain.setValueAtTime(0.01, t);
      noiseGain.gain.linearRampToValueAtTime(volume, t + 0.2);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
    }
    else if (type === 'standard') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, t);
      noiseGain.gain.setValueAtTime(volume, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    }
    else if (type === 'pop') {
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      noiseGain.gain.setValueAtTime(volume * 0.5, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    }

    src.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    src.start(t);
  }

  public playLaunch(type: string = 'standard'): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const duration = type === 'heavy' ? 0.8 : 0.5;

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(type === 'heavy' ? 800 : 1200, t + duration);
    oscGain.gain.setValueAtTime(0.08, t);
    oscGain.gain.linearRampToValueAtTime(0, t + duration);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.buffers.white;
    const noiseGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1;
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(1500, t + duration);
    noiseGain.gain.setValueAtTime(0.1, t);
    noiseGain.gain.linearRampToValueAtTime(0, t + duration);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
  }

  public playRoar(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const duration = 1.5;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    
    osc1.frequency.setValueAtTime(60, t);
    osc1.frequency.linearRampToValueAtTime(40, t + duration);
    osc2.frequency.setValueAtTime(65, t);
    osc2.frequency.linearRampToValueAtTime(45, t + duration);

    oscGain.gain.setValueAtTime(0.3, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    osc1.connect(oscGain);
    osc2.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.buffers.pink;
    const noiseGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(200, t + duration); 

    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
  }

  public playMoonChime(): void {
    if (!this.ctx) return;
    [440, 554, 659, 880].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 1.0, 0.05), i * 100);
    });
  }
}

export const SoundManager = new SoundManagerClass();