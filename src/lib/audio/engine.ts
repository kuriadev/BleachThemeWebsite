/**
 * Soul Society Soundscape — Web Audio engine.
 *
 * Every voice is synthesised (zero latency, zero downloads, no licensing),
 * and any voice can optionally be backed by a self-hosted recorded sample
 * (see ./samples.ts). Nothing makes a sound until the visitor opts in, and
 * the AudioContext is only created on that first gesture.
 *
 * Signal flow:  voice → StereoPanner → sfxBus ┐
 *               drone/wind/bells → ambientBus ┴→ master → compressor → out
 */
import { ambienceLoop, samples } from "./samples";

export type Voice =
  | "hover"
  | "click"
  | "glass"
  | "open"
  | "unsheathe"
  | "shatter"
  | "hollow"
  | "flashstep";

/** -1 (left) … 1 (right). Pass the pointer's x to place a sound in space. */
export interface PlayOptions {
  pan?: number;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private shaper: Float32Array<ArrayBuffer> | null = null;
  private ambience: { gain: GainNode; nodes: AudioScheduledSourceNode[]; bellTimer: number } | null = null;

  private sfx = false;
  private ambientOn = false;
  private volume = 0.7;
  private last = new Map<Voice, number>();

  /** Raw bytes fetched on mount; decoded once the context exists. */
  private raw = new Map<string, ArrayBuffer>();
  private buffers = new Map<string, AudioBuffer>();

  // ── Lifecycle ──────────────────────────────────────────────

  /**
   * Called on client mount: fetches any configured samples so they're ready
   * before the first click. No AudioContext is created here (that needs a
   * gesture), so there is no autoplay warning and no sound.
   */
  preload() {
    const urls = [...Object.values(samples).map((s) => s?.src), ambienceLoop.src].filter(Boolean) as string[];
    for (const url of urls) {
      if (this.raw.has(url) || this.buffers.has(url)) continue;
      fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status}`))))
        .then((b) => {
          this.raw.set(url, b);
          if (this.ctx) void this.decode(url);
        })
        .catch(() => {
          /* missing or blocked sample → synth fallback, silently */
        });
    }
  }

  private async decode(url: string) {
    const bytes = this.raw.get(url);
    if (!bytes || !this.ctx) return;
    this.raw.delete(url);
    try {
      this.buffers.set(url, await this.ctx.decodeAudioData(bytes));
    } catch {
      /* undecodable file → synth fallback */
    }
  }

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.volume;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(ctx.destination);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.8;
      this.sfxBus.connect(this.master);
      this.ambientBus = ctx.createGain();
      this.ambientBus.connect(this.master);
      this.noise = this.makeNoise(ctx);
      this.shaper = this.makeShaper(18);
      for (const url of [...this.raw.keys()]) void this.decode(url);
    }
    return this.ctx;
  }

  private async unlock() {
    const ctx = this.ensure();
    if (ctx?.state === "suspended") await ctx.resume();
    return ctx;
  }

  setVolume(v: number) {
    this.volume = Math.min(Math.max(v, 0), 1);
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
  }

  getVolume() {
    return this.volume;
  }

  /** Restore the stored SFX preference without making a sound. */
  syncSfx(on: boolean) {
    this.sfx = on;
  }

  async setSfx(on: boolean) {
    this.sfx = on;
    if (!on) return;
    await this.unlock();
    this.play("unsheathe");
  }

  /** Must be called from a user gesture the first time. */
  async setAmbient(on: boolean) {
    this.ambientOn = on;
    if (!on) return this.stopAmbience();
    const ctx = await this.unlock();
    if (ctx && this.ambientOn) this.startAmbience();
  }

  // ── Voices ─────────────────────────────────────────────────

  play(voice: Voice, opts: PlayOptions = {}) {
    if (!this.sfx) return;
    const ctx = this.ensure();
    if (!ctx || ctx.state === "closed") return;
    // A restored-from-storage preference: the first gesture resumes and plays.
    if (ctx.state === "suspended") void ctx.resume();

    // Per-voice rate limits keep hover-heavy UIs from machine-gunning.
    const gap: Partial<Record<Voice, number>> = { hover: 70, hollow: 1400, flashstep: 120, unsheathe: 250, glass: 40 };
    const now = performance.now();
    if (now - (this.last.get(voice) ?? -1e9) < (gap[voice] ?? 0)) return;
    this.last.set(voice, now);

    const out = ctx.createStereoPanner();
    out.pan.value = Math.min(Math.max(opts.pan ?? 0, -1), 1) * 0.6;
    out.connect(this.sfxBus!);
    const t = ctx.currentTime;

    const spec = samples[voice];
    const buf = spec?.src ? this.buffers.get(spec.src) : undefined;
    if (buf && spec) {
      this.playBuffer(buf, spec.gain, out, t);
      if (spec.mode === "replace") return;
    }

    switch (voice) {
      case "hover":
        this.tone(out, t, 180, 90, 0.05, 0.1, "sine");
        break;

      case "click":
      case "glass": {
        // Liquid-glass detent: a 2 ms bright tick, a tiny glassy ping and a
        // heavy low thump, like a haptic engine heard through a glass pane.
        this.noiseBurst(out, t, 0.018, 5200, 0.32, "highpass");
        this.tone(out, t, 1850, 1250, 0.045, 0.07, "sine");
        this.tone(out, t + 0.004, 125, 52, 0.11, 0.42, "sine");
        break;
      }

      case "open":
        this.tone(out, t, 220, 330, 0.5, 0.08, "triangle");
        this.tone(out, t + 0.04, 330, 495, 0.6, 0.045, "sine");
        break;

      case "unsheathe": {
        // Zanpakutō leaving the saya: a grainy, rising steel scrape
        // (band-passed noise, amplitude-chopped at ~38 Hz for the slide
        // texture), then a struck-steel ring of inharmonic, slightly
        // detuned partials that beat as they decay.
        if (!buf) this.scrape(out, t, 0.36);
        const ring = t + 0.3;
        [
          [2349, 1],
          [2353, 0.6],
          [3781, 0.55],
          [5118, 0.32],
          [6893, 0.18],
        ].forEach(([f, a], i) => this.tone(out, ring, f, f * 0.997, 1.6 - i * 0.18, 0.085 * a, "sine"));
        this.tone(out, ring, 196, 180, 0.35, 0.12, "triangle"); // body of the blade
        break;
      }

      case "shatter": {
        this.noiseBurst(out, t, 0.6, 6000, 0.5, "highpass");
        [1870, 2630, 3410, 4790].forEach((f, i) => this.tone(out, t + i * 0.012, f, f * 0.98, 0.9 - i * 0.12, 0.06, "sine"));
        this.tone(out, t, 90, 30, 0.9, 0.5, "sine");
        break;
      }

      case "hollow": {
        // A phantom, distorted low cry far away: a waveshaped sawtooth
        // glides down while a vowel-like band-pass closes (aah → ooh), fed
        // into a dark feedback echo. Kept very quiet on purpose.
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(118, t);
        o.frequency.exponentialRampToValueAtTime(72, t + 1.1);
        const vib = ctx.createOscillator();
        vib.frequency.value = 5.5;
        const vibAmt = ctx.createGain();
        vibAmt.gain.value = 3;
        vib.connect(vibAmt).connect(o.frequency);
        const ws = ctx.createWaveShaper();
        ws.curve = this.shaper;
        const formant = ctx.createBiquadFilter();
        formant.type = "bandpass";
        formant.Q.value = 4;
        formant.frequency.setValueAtTime(820, t);
        formant.frequency.exponentialRampToValueAtTime(330, t + 1.1);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.25);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        const echo = this.echo(out, 0.31, 0.45, 1400);
        o.connect(ws).connect(formant).connect(g);
        g.connect(out);
        g.connect(echo);
        o.start(t);
        vib.start(t);
        o.stop(t + 1.25);
        vib.stop(t + 1.25);
        break;
      }

      case "flashstep": {
        // Shunpo: a fast whoosh that sweeps across the stereo field, with a
        // short shimmering kidō hum underneath.
        const s = ctx.createBufferSource();
        s.buffer = this.noise;
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.Q.value = 1.4;
        f.frequency.setValueAtTime(380, t);
        f.frequency.exponentialRampToValueAtTime(5200, t + 0.16);
        f.frequency.exponentialRampToValueAtTime(900, t + 0.32);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.09);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        const p = ctx.createStereoPanner();
        const dir = (opts.pan ?? 0) >= 0 ? 1 : -1;
        p.pan.setValueAtTime(-0.85 * dir, t);
        p.pan.linearRampToValueAtTime(0.85 * dir, t + 0.3);
        s.connect(f).connect(g).connect(p).connect(this.sfxBus!);
        s.start(t);
        s.stop(t + 0.36);
        [880, 1320].forEach((hz, i) => {
          const o = ctx.createOscillator();
          o.frequency.value = hz;
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 23 + i * 6;
          const depth = ctx.createGain();
          depth.gain.value = hz * 0.012;
          lfo.connect(depth).connect(o.frequency);
          const og = ctx.createGain();
          og.gain.setValueAtTime(0.0001, t + 0.05);
          og.gain.exponentialRampToValueAtTime(0.022 / (i + 1), t + 0.1);
          og.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
          o.connect(og).connect(out);
          o.start(t + 0.05);
          lfo.start(t + 0.05);
          o.stop(t + 0.45);
          lfo.stop(t + 0.45);
        });
        break;
      }
    }
  }

  // ── Ambience: reiatsu drone + wind + distant temple bells ──

  private startAmbience() {
    const ctx = this.ctx!;
    if (this.ambience) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 3);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1600;
    lp.connect(gain).connect(this.ambientBus!);
    const nodes: AudioScheduledSourceNode[] = [];

    // Drone: 55 / 55.6 Hz beat (a slow "breathing" pressure) + octave.
    const droneLp = ctx.createBiquadFilter();
    droneLp.type = "lowpass";
    droneLp.frequency.value = 300;
    const droneG = ctx.createGain();
    droneG.gain.value = 0.11;
    droneLp.connect(droneG).connect(lp);
    for (const [hz, type, amp] of [
      [55, "sine", 1],
      [55.6, "sine", 1],
      [110.3, "triangle", 0.18],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = hz;
      const og = ctx.createGain();
      og.gain.value = amp;
      o.connect(og).connect(droneLp);
      nodes.push(o);
    }

    // Wind: looping noise through a band-pass whose centre and level drift
    // on very slow LFOs, so it gusts without ever repeating obviously.
    const wind = ctx.createBufferSource();
    wind.buffer = this.noise;
    wind.loop = true;
    const wf = ctx.createBiquadFilter();
    wf.type = "bandpass";
    wf.Q.value = 0.9;
    wf.frequency.value = 520;
    const wg = ctx.createGain();
    wg.gain.value = 0.035;
    const lfoF = ctx.createOscillator();
    lfoF.frequency.value = 0.07;
    const lfoFAmt = ctx.createGain();
    lfoFAmt.gain.value = 260;
    lfoF.connect(lfoFAmt).connect(wf.frequency);
    const lfoG = ctx.createOscillator();
    lfoG.frequency.value = 0.11;
    const lfoGAmt = ctx.createGain();
    lfoGAmt.gain.value = 0.02;
    lfoG.connect(lfoGAmt).connect(wg.gain);
    wind.connect(wf).connect(wg).connect(lp);
    nodes.push(wind, lfoF, lfoG);

    // Optional recorded bed.
    const bed = ambienceLoop.src ? this.buffers.get(ambienceLoop.src) : undefined;
    if (bed) {
      const s = ctx.createBufferSource();
      s.buffer = bed;
      s.loop = true;
      const sg = ctx.createGain();
      sg.gain.value = ambienceLoop.gain;
      s.connect(sg).connect(lp);
      nodes.push(s);
    }

    nodes.forEach((n) => n.start());

    // Temple bells: a distant, randomly-timed strike every 9–18 s.
    const bellOut = this.echo(lp, 0.42, 0.5, 2200, true);
    const strike = () => {
      if (!this.ambience) return;
      const base = [196, 261.6, 293.7, 392][Math.floor(Math.random() * 4)];
      const at = ctx.currentTime + 0.05;
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.random() * 1.4 - 0.7;
      pan.connect(lp);
      pan.connect(bellOut);
      [
        [1, 1],
        [2.76, 0.45],
        [5.4, 0.22],
        [8.93, 0.1],
      ].forEach(([r, a]) => this.tone(pan, at, base * r, base * r * 0.999, 5.5 / Math.sqrt(r), 0.018 * a, "sine"));
      this.ambience.bellTimer = window.setTimeout(strike, 9000 + Math.random() * 9000);
    };
    this.ambience = { gain, nodes, bellTimer: window.setTimeout(strike, 2500) };
  }

  private stopAmbience() {
    if (!this.ambience || !this.ctx) return;
    const { gain, nodes, bellTimer } = this.ambience;
    window.clearTimeout(bellTimer);
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.9);
    nodes.forEach((s) => s.stop(t + 0.95));
    this.ambience = null;
  }

  // ── Building blocks ────────────────────────────────────────

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  /** Soft-clipping curve for the hollow's grit. */
  private makeShaper(k: number) {
    const n = 1024;
    const curve = new Float32Array(new ArrayBuffer(n * 4));
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    return curve;
  }

  /** Dark feedback delay; returns its input node. */
  private echo(dest: AudioNode, time: number, feedback: number, cutoff: number, keep = false) {
    const ctx = this.ctx!;
    const input = ctx.createGain();
    input.gain.value = 0.6;
    const d = ctx.createDelay(2);
    d.delayTime.value = time;
    const fb = ctx.createGain();
    fb.gain.value = feedback;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = cutoff;
    input.connect(d).connect(lp).connect(fb).connect(d);
    lp.connect(dest);
    if (!keep)
      window.setTimeout(() => {
        for (const n of [input, d, lp, fb]) n.disconnect();
      }, 4000);
    return input;
  }

  private playBuffer(buf: AudioBuffer, gain: number, dest: AudioNode, t: number) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = gain;
    s.connect(g).connect(dest);
    s.start(t);
  }

  private scrape(dest: AudioNode, t: number, dur: number) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 12;
    f.frequency.setValueAtTime(1200, t);
    f.frequency.exponentialRampToValueAtTime(7200, t + dur);
    const chop = ctx.createGain();
    chop.gain.value = 0.55;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 38;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 0.45;
    lfo.connect(lfoAmt).connect(chop.gain);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.04);
    s.connect(f).connect(chop).connect(g).connect(dest);
    s.start(t);
    lfo.start(t);
    s.stop(t + dur + 0.06);
    lfo.stop(t + dur + 0.06);
  }

  private tone(dest: AudioNode, t: number, from: number, to: number, dur: number, peak: number, type: OscillatorType) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noiseBurst(dest: AudioNode, t: number, dur: number, freq: number, peak: number, type: BiquadFilterType) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (type === "highpass" && dur > 0.1) f.frequency.exponentialRampToValueAtTime(900, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dest);
    s.start(t);
    s.stop(t + dur + 0.02);
  }
}

export const audio = new AudioEngine();
