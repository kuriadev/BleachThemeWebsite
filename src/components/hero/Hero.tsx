"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import aizen from "../../../public/images/hero-aizen.png";
import { useSoundFX } from "@/hooks/useSoundFX";
import { ease, spring } from "@/lib/tokens";
import { useExperience } from "@/providers/ExperienceProvider";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { ReiatsuCanvas } from "@/components/webgl/ReiatsuCanvas";
import { REIATSU_BURST_EVENT } from "@/components/webgl/ReiatsuField";
import { ShatterImage, type ShatterPhase } from "./ShatterImage";

/**
 * Composition notes for the supplied art (1672×941, 16:9, full-bleed):
 * - Face sits at ~50% x / ~14% y; arms span ~18–82% x at ~55% y.
 * - Violet flames fill both flanks and frame him, so the art covers the
 *   whole viewport. A soft vignette and a bottom fade melt it into obsidian.
 * - The art is anchored to its top edge and the frame starts below the nav,
 *   so his hair never sits under the top bar on any screen. The headline sits low-left, never over the face.
 */
const FOCAL = "50% 0%";
const MASK = [
  "radial-gradient(ellipse 85% 95% at 50% 35%, #000 55%, rgba(0,0,0,0.75) 75%, rgba(0,0,0,0.35) 100%)",
  "linear-gradient(to bottom, transparent 0%, #000 7%, #000 62%, transparent 100%)",
].join(", ");
const FILTER_ID = "kyoka-distort";

export function Hero() {
  const fx = useSoundFX();
  const { reducedMotion } = useExperience();
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const [phase, setPhase] = useState<ShatterPhase>("idle");
  const [origin, setOrigin] = useState({ x: 50, y: 30 });
  const [distorting, setDistorting] = useState(false);
  const timers = useRef<number[]>([]);

  // ── Pointer parallax (normalised −1…1, spring-smoothed) ──────────────
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, spring.parallax);
  const spy = useSpring(py, spring.parallax);

  // ── Scroll-out: art sinks and swells, type lifts and fades ───────────
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const artY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const artScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const typeY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // ── Kyoka distortion: pointer velocity drives an SVG displacement map ─
  const velocity = useRef(0);
  useEffect(() => {
    if (reducedMotion || window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    let on = false;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      velocity.current *= 0.9;
      const scale = Math.min(velocity.current, 28);
      dispRef.current?.setAttribute("scale", scale.toFixed(2));
      const next = scale > 0.4;
      if (next !== on) {
        on = next;
        setDistorting(next); // filter is only applied while it's visible
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const last = useRef({ x: 0, y: 0, t: 0 });
  const onPointerMove = (e: React.PointerEvent) => {
    if (reducedMotion) return;
    const { innerWidth: w, innerHeight: h } = window;
    px.set((e.clientX / w) * 2 - 1);
    py.set((e.clientY / h) * 2 - 1);
    const now = performance.now();
    const dt = Math.max(now - last.current.t, 1);
    const speed = Math.hypot(e.clientX - last.current.x, e.clientY - last.current.y) / dt;
    last.current = { x: e.clientX, y: e.clientY, t: now };
    // Only distort when the cursor is over the art itself.
    const r = frameRef.current?.getBoundingClientRect();
    if (r && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) {
      velocity.current = Math.min(velocity.current + speed * 6, 40);
    }
  };

  // ── Shatter sequence ─────────────────────────────────────────────────
  const shatter = useCallback(
    (point?: { x: number; y: number }) => {
      if (phase !== "idle") return;
      fx.play("shatter");
      window.dispatchEvent(new Event(REIATSU_BURST_EVENT));
      if (reducedMotion) {
        // Respect the preference: a brief cross-fade flash, no flying shards.
        setPhase("reforming");
        timers.current.push(window.setTimeout(() => setPhase("idle"), 900));
        return;
      }
      setOrigin(point ?? { x: 50, y: 22 });
      setPhase("shattered");
      timers.current.push(
        window.setTimeout(() => setPhase("reforming"), 1500),
        window.setTimeout(() => setPhase("idle"), 2900),
      );
    },
    [phase, reducedMotion, fx],
  );
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ── Water-moon ripple: concentric rings spread from the click point ──
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);
  const ripple = (clientX: number, clientY: number) => {
    const s = sectionRef.current?.getBoundingClientRect();
    if (!s || reducedMotion) return;
    const id = ++rippleId.current;
    setRipples((r) => [...r, { id, x: clientX - s.left, y: clientY - s.top }]);
    timers.current.push(window.setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 1600));
  };

  const onArtClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    ripple(e.clientX, e.clientY);
    shatter({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      onPointerMove={onPointerMove}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-obsidian"
    >
      <KyokaFilter dispRef={dispRef} />

      {/* L0 — ambient violet bloom + kanji watermark */}
      <Layer depth={0.15} x={spx} y={spy} className="-z-30">
        <div className="absolute left-1/2 top-[38%] h-[80vmin] w-[110vmin] -translate-x-1/2 -translate-y-1/2 animate-reiatsu-pulse aura-kyoka rounded-full blur-2xl" />
        <span
          aria-hidden
          className="absolute left-[2vw] top-1/2 -translate-y-1/2 select-none whitespace-nowrap font-kanji text-[18vh] font-black leading-none text-ghost/[0.04] text-vertical"
        >
          鏡花水月
        </span>
      </Layer>

      {/* L1 — reiatsu particles (WebGL, lazy) */}
      <ReiatsuCanvas className="-z-20" />

      {/* L2 — the art */}
      <motion.div style={{ y: artY, scale: artScale }} className="absolute inset-0 -z-10">
        <Layer depth={0.45} x={spx} y={spy}>
          {/* Overscan on the sides and bottom so pointer parallax never reveals an edge */}
          <div
            ref={frameRef}
            onClick={onArtClick}
            className="pointer-events-auto absolute -inset-x-[3%] -bottom-[14%] top-[3%] cursor-crosshair md:top-[5%]"
            style={{ filter: distorting ? `url(#${FILTER_ID})` : undefined }}
          >
            <ShatterImage
              image={aizen}
              alt="Sōsuke Aizen stands with arms outstretched, a white scarf at his shoulders, wreathed in violet spiritual energy."
              phase={phase}
              origin={origin}
              mask={MASK}
              focal={FOCAL}
            />
          </div>
        </Layer>
      </motion.div>

      {/* L3 — liquid-glass mirror shards (refraction over the flanks, never the face) */}
      <Layer depth={1.1} x={spx} y={spy} className="-z-[5] hidden md:block">
        <GlassShard className="left-[6%] top-[22%] h-[30vh] w-[7vw]" rotate={-14} delay={0} />
        <GlassShard className="right-[6%] top-[16%] h-[26vh] w-[6vw]" rotate={18} delay={1.6} />
        <GlassShard className="right-[16%] bottom-[20%] h-[16vh] w-[4vw]" rotate={-32} delay={3.1} />
      </Layer>

      {/* Bottom fade into the next section */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-[4] h-[45vh] bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent" />

      {/* L4 — typography */}
      <motion.div
        style={{ y: typeY, opacity: fade }}
        className="pointer-events-none relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-end px-5 pb-10 pt-24 md:px-10 md:pb-14"
      >
        {/* Vertical name, right edge */}
        <motion.p
          aria-hidden
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 1.2, ease: ease.reiatsu }}
          className="absolute right-5 top-28 font-kanji text-lg tracking-[0.5em] text-ghost/70 text-vertical md:right-10 md:text-2xl"
        >
          藍染惣右介
        </motion.p>

        {/* Left meta rail */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          className="absolute left-5 top-28 hidden flex-col gap-3 text-[11px] uppercase tracking-[0.35em] text-ghost-muted md:left-10 md:flex"
        >
          <span className="text-hogyoku-bright">Chapter 00</span>
          <span>The Illusion</span>
          <span className="mt-2 h-16 w-px bg-gradient-to-b from-ghost/40 to-transparent" />
        </motion.div>

        <div className="grid items-end gap-6 sm:gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: ease.reiatsu }}
              className="mb-4 flex items-center gap-3 text-eyebrow uppercase tracking-[0.3em] text-ghost-muted sm:tracking-[0.4em] [@media(max-height:620px)]:hidden"
            >
              <span aria-hidden className="h-px w-10 bg-hogyoku-bright" />
              Kyōka Suigetsu · Complete Hypnosis
            </motion.p>
            <SplitReveal
              as="h1"
              id="hero-title"
              text="Sōsuke Aizen"
              delay={0.45}
              className="text-display font-semibold uppercase text-ghost [text-shadow:0_0_60px_rgba(123,44,191,0.45)]"
            />
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 1.25, ease: ease.reiatsu }}
              className="mt-5 max-w-md text-balance text-lede text-ghost-muted md:mt-6 [@media(max-height:620px)]:hidden"
              id="hero-title-desc"
            >
              Everything you have seen was decided before you looked. Break the mirror, and see what was always there.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5, ease: ease.reiatsu }}
            className="pointer-events-auto flex flex-wrap gap-3"
          >
            <MagneticButton onClick={() => shatter()} aria-describedby="hero-title-desc">
              <ShardIcon />
              Shatter Kyōka Suigetsu
            </MagneticButton>
            <MagneticButton
              variant="ghost"
              onClick={() => document.getElementById("codex")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" })}
            >
              Enter Soul Society
              <span aria-hidden>↓</span>
            </MagneticButton>
          </motion.div>
        </div>
      </motion.div>

      {/* Water-moon ripples */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {ripples.map((p) =>
          [0, 0.14, 0.28].map((d) => (
            <motion.span
              key={`${p.id}-${d}`}
              className="absolute block size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ghost/50 shadow-[0_0_24px_rgba(166,108,255,0.45),inset_0_0_18px_rgba(166,108,255,0.35)]"
              style={{ left: p.x, top: p.y }}
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 1.4, delay: d, ease: ease.reiatsu }}
            />
          )),
        )}
      </div>

      {/* Revelation line while the mirror is broken */}
      <AnimatePresence>
        {phase === "shattered" && (
          <motion.p
            role="status"
            initial={{ opacity: 0, letterSpacing: "0.2em" }}
            animate={{ opacity: 1, letterSpacing: "0.6em" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: ease.reiatsu }}
            className="pointer-events-none absolute inset-x-0 top-[36%] z-10 text-center text-xs uppercase text-ghost"
          >
            It was never broken
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}

function Layer({
  depth,
  x,
  y,
  className = "",
  children,
}: {
  depth: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  className?: string;
  children: React.ReactNode;
}) {
  const tx = useTransform(x, (v) => v * depth * -28);
  const ty = useTransform(y, (v) => v * depth * -18);
  return (
    <motion.div style={{ x: tx, y: ty }} className={`pointer-events-none absolute inset-0 ${className}`}>
      {children}
    </motion.div>
  );
}

function GlassShard({ className, rotate, delay }: { className: string; rotate: number; delay: number }) {
  return (
    <div
      aria-hidden
      className={`absolute animate-float-slow ${className}`}
      style={{ ["--r" as string]: `${rotate}deg`, animationDelay: `${delay}s` }}
    >
      <div
        className="h-full w-full border border-white/15 bg-gradient-to-b from-white/[0.14] via-white/[0.03] to-hogyoku/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-[3px] backdrop-brightness-110 backdrop-saturate-125"
        style={{ clipPath: "polygon(50% 0, 100% 18%, 78% 100%, 12% 86%, 0 22%)" }}
      />
    </div>
  );
}

function KyokaFilter({ dispRef }: { dispRef: React.RefObject<SVGFEDisplacementMapElement | null> }) {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id={FILTER_ID} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.03" numOctaves="2" seed="7" result="n" />
        <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

function ShardIcon() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M7 1 12.5 4.5 11 12 3.5 13 1.5 5Z" />
      <path d="M7 1 6 7l5 5M6 7 1.5 5M6 7l-2.5 6" />
    </svg>
  );
}
