"use client";

import { motion } from "motion/react";
import { useId, useRef } from "react";
import type { Character } from "@/content/characters";
import { audio } from "@/lib/audio/engine";
import { ease } from "@/lib/tokens";
import { useDialog } from "@/lib/a11y/useDialog";
import { accentMap } from "./accent";

interface Props {
  character: Character;
  onClose: () => void;
}

/**
 * Expanded lore view. Shares a layoutId with its card so it grows out of it.
 * Accessible modal: focus moves in, Tab is trapped, Esc closes, focus returns
 * to the card, and inertial scroll is paused while open.
 */
export function CodexDialog({ character: c, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();
  const accent = accentMap[c.accent];

  useDialog({ panelRef, initialFocusRef: closeRef, onClose });

  const close = () => {
    audio.play("click");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 md:items-center md:p-8">
      <motion.div
        aria-hidden
        onClick={close}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-void/80 backdrop-blur-md"
      />

      <motion.div
        ref={panelRef}
        layoutId={`codex-${c.id}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        transition={{ duration: 0.7, ease: ease.blade }}
        className="glass relative z-10 grid max-h-[92svh] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-[28px] bg-obsidian/70 md:grid-cols-[0.9fr_1.1fr]"
        style={{ boxShadow: `0 0 120px -30px rgb(${accent.rgb} / 0.6)` }}
      >
        {/* Left: identity */}
        <div className="relative flex min-h-64 flex-col justify-between overflow-hidden border-b border-white/10 p-8 md:border-b-0 md:border-r md:p-10">
          <span
            aria-hidden
            className="absolute -bottom-6 -left-4 select-none font-kanji text-[11rem] font-black leading-none text-vertical"
            style={{ color: `rgb(${accent.rgb} / 0.12)` }}
          >
            {c.zanpakuto.kanji}
          </span>
          <p className="relative text-[11px] uppercase tracking-[0.35em]" style={{ color: accent.text }}>
            {c.role}
          </p>
          <div className="relative mt-16">
            <p className="font-kanji text-base tracking-[0.3em] text-ghost-muted">{c.kanji}</p>
            <h2 id={titleId} className="mt-2 text-4xl font-semibold uppercase leading-[0.95] tracking-tight md:text-5xl">
              {c.name}
            </h2>
            <p className="mt-3 text-sm text-ghost-muted">{c.affiliation}</p>
          </div>
        </div>

        {/* Right: lore + stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.8, ease: ease.reiatsu } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="p-8 md:p-10"
        >
          <p id={descId} className="text-base leading-relaxed text-ghost/85">
            {c.lore}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-white/10 py-6 text-sm">
            <Field term="Zanpakutō" value={`${c.zanpakuto.name} · ${c.zanpakuto.kanji}`} />
            <Field term="Release" value={c.zanpakuto.command} />
            <Field term="Bankai" value={c.zanpakuto.bankai} wide />
          </dl>

          <h3 className="mt-8 text-[11px] uppercase tracking-[0.35em] text-ghost-muted">Power profile</h3>
          <ul className="mt-4 space-y-3">
            {c.stats.map((s, i) => (
              <li key={s.label} className="grid grid-cols-[88px_1fr_32px] items-center gap-4 text-xs">
                <span className="uppercase tracking-[0.2em] text-ghost-muted">{s.label}</span>
                <span
                  role="meter"
                  aria-label={s.label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={s.value}
                  className="relative h-[3px] overflow-hidden rounded-full bg-white/10"
                >
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: s.value / 100 }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 1.2, ease: ease.reiatsu }}
                    className="absolute inset-0 origin-left rounded-full"
                    style={{ background: accent.glow, boxShadow: `0 0 12px ${accent.glow}` }}
                  />
                </span>
                <span className="text-right tabular-nums text-ghost">{s.value}</span>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-[11px] uppercase tracking-[0.35em] text-ghost-muted">Signature techniques</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {c.abilities.map((a) => (
              <li key={a} className="rounded-full border border-white/12 px-3 py-1.5 text-xs text-ghost/85">
                {a}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[11px] text-ghost-faint">Power profile is a fan assessment for comparison only.</p>
        </motion.div>

        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label={`Close ${c.name}`}
          className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full border border-white/15 text-ghost/80 transition hover:border-white/40 hover:text-ghost"
        >
          <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4">
            <path d="M1 1l12 12M13 1 1 13" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
}

function Field({ term, value, wide }: { term: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-[11px] uppercase tracking-[0.3em] text-ghost-faint">{term}</dt>
      <dd className="mt-1 text-ghost">{value}</dd>
    </div>
  );
}
