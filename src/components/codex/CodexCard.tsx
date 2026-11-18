"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { useRef } from "react";
import type { Character } from "@/content/characters";
import { useSoundFX } from "@/hooks/useSoundFX";
import { ease, spring } from "@/lib/tokens";
import { useExperience } from "@/providers/ExperienceProvider";
import { accentMap } from "./accent";

interface Props {
  character: Character;
  index: number;
  onOpen: (id: string) => void;
  onFocusCard?: (el: HTMLElement) => void;
}

/**
 * Liquid-glass card. The pointer position drives (a) a radial "reiatsu" light
 * that follows the cursor, (b) a specular edge highlight and (c) a weighty 3D
 * tilt. The whole card is one <button> so it is a single, obvious tab stop.
 */
export function CodexCard({ character: c, index, onOpen, onFocusCard }: Props) {
  const fx = useSoundFX();
  const { reducedMotion } = useExperience();
  const ref = useRef<HTMLButtonElement>(null);
  const accent = accentMap[c.accent];

  const mx = useMotionValue(50);
  const my = useMotionValue(30);
  const rx = useSpring(0, spring.tilt);
  const ry = useSpring(0, spring.tilt);
  const light = useMotionTemplate`radial-gradient(420px circle at ${mx}% ${my}%, rgb(${accent.rgb} / 0.28), transparent 60%)`;
  const edge = useMotionTemplate`radial-gradient(260px circle at ${mx}% ${my}%, rgb(255 255 255 / 0.55), transparent 70%)`;

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 100;
    const py = ((e.clientY - r.top) / r.height) * 100;
    mx.set(px);
    my.set(py);
    if (!reducedMotion && e.pointerType === "mouse") {
      ry.set((px - 50) / 7);
      rx.set(-(py - 50) / 9);
    }
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1, delay: (index % 3) * 0.08, ease: ease.reiatsu }}
      style={{ perspective: 1200 }}
    >
      <motion.button
        ref={ref}
        type="button"
        layoutId={`codex-${c.id}`}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onMouseEnter={() => fx.play("hover")}
        onFocus={(e) => onFocusCard?.(e.currentTarget)}
        onClick={() => {
          fx.play("open");
          onOpen(c.id);
        }}
        data-accent={c.accent}
        aria-haspopup="dialog"
        aria-label={`${c.name}, ${c.role}. Zanpakutō ${c.zanpakuto.name}. Open lore and abilities.`}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="glass group relative flex aspect-[3/4.3] w-full flex-col overflow-hidden rounded-[28px] p-7 text-left"
      >
        {/* Pointer-tracked light & specular rim */}
        <motion.span aria-hidden style={{ background: light }} className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
        <motion.span
          aria-hidden
          style={{
            background: edge,
            padding: 1,
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
          }}
          className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        {/* Kanji watermark */}
        <span
          aria-hidden
          className="absolute -right-3 top-10 select-none font-kanji text-[9rem] font-black leading-none text-ghost/[0.05] text-vertical transition-colors duration-700 group-hover:text-ghost/[0.1]"
          style={{ transform: "translateZ(30px)" }}
        >
          {c.zanpakuto.kanji}
        </span>

        {/* Header */}
        <div className="relative flex items-start justify-between text-[11px] uppercase tracking-[0.3em] text-ghost-muted">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span style={{ color: accent.text }}>{c.affiliation.split(" · ")[0]}</span>
        </div>

        {/* Blade geometry — the "edge" draws itself on hover */}
        <svg aria-hidden viewBox="0 0 200 260" className="relative mx-auto my-auto h-1/2 w-auto" style={{ transform: "translateZ(50px)" }}>
          <defs>
            <linearGradient id={`edge-${c.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={accent.glow} stopOpacity="0.95" />
              <stop offset="1" stopColor={accent.glow} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M100 6 L112 190 L100 214 L88 190 Z" fill="none" stroke="rgba(245,245,247,0.18)" strokeWidth="1" />
          <path
            d="M100 6 L112 190 L100 214"
            fill="none"
            stroke={`url(#edge-${c.id})`}
            strokeWidth="1.5"
            pathLength={1}
            className="transition-[stroke-dashoffset] duration-[1400ms] ease-[var(--ease-blade)] [stroke-dasharray:1] [stroke-dashoffset:1] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]"
          />
          <rect x="74" y="214" width="52" height="5" rx="2" fill="rgba(245,245,247,0.35)" />
          <path d="M100 219 V254" stroke="rgba(245,245,247,0.35)" strokeWidth="6" strokeLinecap="round" strokeDasharray="3 3" />
          <circle cx="100" cy="110" r="70" fill={accent.glow} opacity="0.08" className="transition-opacity duration-700 group-hover:opacity-20" />
        </svg>

        {/* Footer */}
        <div className="relative" style={{ transform: "translateZ(40px)" }}>
          <p className="font-kanji text-sm tracking-[0.3em] text-ghost-muted">{c.kanji}</p>
          <h3 className="mt-1 text-2xl font-semibold uppercase leading-tight tracking-tight md:text-3xl">{c.name}</h3>
          <p className="mt-3 text-sm leading-relaxed text-ghost-muted">{c.epithet}</p>
          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] uppercase tracking-[0.3em]">
            <span className="text-ghost">{c.zanpakuto.name}</span>
            <span className="flex items-center gap-2 text-ghost-muted transition-colors group-hover:text-ghost">
              Open
              <span aria-hidden className="inline-block transition-transform duration-500 ease-[var(--ease-reiatsu)] group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}
