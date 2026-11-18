/**
 * Procedural Web Audio engine — no audio files to download.
 * Every sound is synthesised so it stays tiny, tweakable and on-brand.
 * Audio is opt-in; nothing is created until the user enables sound.
 */
type Voice = "click" | "hover" | "shatter" | "open";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private hum: { gain: GainNode; nodes: AudioScheduledSourceNode[] } | null = null;
  private noise: AudioBuffer | null = null;
  private enabled = false;
  private lastHover = 0;

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      this.master.connect(comp).connect(this.ctx.destination);
      this.noise = this.makeNoise(this.ctx);
    }
    return this.ctx;
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  async setEnabled(on: boolean) {
    this.enabled = on;
    const ctx = this.ensure();
    if (!ctx) return;
    if (on) {
      if (ctx.state === "suspended") await ctx.resume();
      this.startHum();
      this.play("open");
    } else {
      this.stopHum();
    }
  }

  /** Low, slowly-beating drone: two detuned sines + filtered noise bed. */
  private startHum() {
    const ctx = this.ctx!;
    if (this.hum) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 2.5);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    gain.connect(this.master!);
    lp.connect(gain);

    const a = ctx.createOscillator();
    a.frequency.value = 55;
    const b = ctx.createOscillator();
    b.frequency.value = 55.6; // 0.6 Hz beating — slow "breathing" pressure
    const c = ctx.createOscillator();
    c.type = "triangle";
    c.frequency.value = 110.3;
    const cg = ctx.createGain();
    cg.gain.value = 0.18;
    c.connect(cg).connect(lp);
    a.connect(lp);
    b.connect(lp);

    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    n.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = "bandpass";
    nf.frequency.value = 180;
    nf.Q.value = 0.7;
    const ng = ctx.createGain();
    ng.gain.value = 0.25;
    n.connect(nf).connect(ng).connect(lp);

    const nodes = [a, b, c, n];
    nodes.forEach((s) => s.start());
    this.hum = { gain, nodes };
  }

  private stopHum() {
    if (!this.hum || !this.ctx) return;
    const { gain, nodes } = this.hum;
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.8);
    nodes.forEach((s) => s.stop(t + 0.85));
    this.hum = null;
  }

  play(voice: Voice) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== "running") return;
    const t = ctx.currentTime;
    switch (voice) {
      case "hover": {
        if (performance.now() - this.lastHover < 70) return; // de-chatter
        this.lastHover = performance.now();
        this.tone(t, 180, 90, 0.05, 0.12, "sine");
        break;
      }
      case "click": {
        // Mechanical "detent": a short noise transient + a low thump.
        this.noiseBurst(t, 0.035, 3200, 0.35, "bandpass");
        this.tone(t, 140, 48, 0.12, 0.4, "sine");
        break;
      }
      case "open": {
        this.tone(t, 220, 330, 0.5, 0.09, "triangle");
        this.tone(t + 0.04, 330, 495, 0.6, 0.05, "sine");
        break;
      }
      case "shatter": {
        // Glass: bright noise sweep + a cluster of inharmonic partials.
        this.noiseBurst(t, 0.6, 6000, 0.5, "highpass");
        [1870, 2630, 3410, 4790].forEach((f, i) =>
          this.tone(t + i * 0.012, f, f * 0.98, 0.9 - i * 0.12, 0.06, "sine"),
        );
        this.tone(t, 90, 30, 0.9, 0.5, "sine"); // sub drop
        break;
      }
    }
  }

  private tone(
    t: number,
    from: number,
    to: number,
    dur: number,
    peak: number,
    type: OscillatorType,
  ) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noiseBurst(t: number, dur: number, freq: number, peak: number, type: BiquadFilterType) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (type === "highpass") f.frequency.exponentialRampToValueAtTime(900, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master!);
    s.start(t);
    s.stop(t + dur + 0.02);
  }
}

export const audio = new AudioEngine();
