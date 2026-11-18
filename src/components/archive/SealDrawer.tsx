"use client";

import { motion } from "motion/react";
import { useEffect, useId, useRef } from "react";
import type { Project } from "@/content/projects";
import { audio } from "@/lib/audio/engine";
import { useDialog } from "@/lib/a11y/useDialog";
import { useMediaQuery } from "@/lib/motion/useMediaQuery";
import { ease } from "@/lib/tokens";
import { useExperience } from "@/providers/ExperienceProvider";
import { KidoTag, ThreatBadge } from "./badges";

/**
 * "Release Seal" drawer: slides in from the right (bottom sheet on mobile).
 * The seal glyph is drawn stroke-by-stroke with Anime.js, which is loaded
 * on demand so it never touches the initial bundle.
 */
export function SealDrawer({ project: p, onClose }: { project: Project; onClose: () => void }) {
  const { reducedMotion } = useExperience();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sealRef = useRef<SVGSVGElement>(null);
  const titleId = useId();
  // Side drawer on desktop, bottom sheet on phones.
  const wide = useMediaQuery("(min-width: 768px)");
  const hidden = wide ? { x: "100%", y: 0 } : { x: 0, y: "100%" };

  useDialog({ panelRef, initialFocusRef: closeRef, onClose });

  useEffect(() => {
    if (reducedMotion || !sealRef.current) return;
    let cancelled = false;
    let revert: (() => void) | undefined;
    void import("animejs").then(({ animate, svg, stagger }) => {
      if (cancelled || !sealRef.current) return;
      const strokes = svg.createDrawable(sealRef.current.querySelectorAll("[data-stroke]"));
      const a = animate(strokes, {
        draw: ["0 0", "0 1"],
        ease: "inOutQuart",
        duration: 900,
        delay: stagger(140, { start: 250 }),
      });
      revert = () => a.revert();
    });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, [reducedMotion]);

  const close = () => {
    audio.play("click");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-end md:items-stretch">
      <motion.div
        aria-hidden
        onClick={close}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-void/70 backdrop-blur-md"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={hidden}
        animate={{ x: 0, y: 0 }}
        exit={hidden}
        transition={{ duration: 0.7, ease: ease.blade }}
        className="glass relative z-10 flex max-h-[92svh] w-full flex-col overflow-y-auto overscroll-contain rounded-t-[28px] bg-obsidian/85 md:max-h-none md:w-[min(560px,92vw)] md:rounded-l-[28px] md:rounded-tr-none"
      >
        <div className="relative border-b border-white/10 p-8 pb-6 pr-32 md:pr-40">
          <svg ref={sealRef} aria-hidden viewBox="0 0 120 120" className="absolute right-5 top-[4.5rem] size-20 text-hollow/70 md:right-8 md:size-28">
            <circle data-stroke cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle data-stroke cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
            <path data-stroke d="M38 40h44M60 30v60M40 64h40M44 84l32-20M76 84 44 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ghost-faint">
            SRDI · File {p.fileNo} · Seal released
          </p>
          <h2 id={titleId} className="mt-3 text-3xl font-semibold uppercase leading-[0.95] tracking-tight text-ghost">
            {p.title}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-ghost-muted">
            <ThreatBadge level={p.threat} />
            <span>{p.status}</span>
            <span aria-hidden>·</span>
            <span>{p.year}</span>
          </div>
        </div>

        <div className="space-y-8 p-8">
          <section aria-label="Briefing">
            <p className="text-base leading-relaxed text-ghost/90">{p.summary}</p>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ghost-muted">
              {p.details.map((d) => (
                <li key={d} className="flex gap-3">
                  <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-hogyoku-bright" />
                  {d}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby={`${titleId}-stack`}>
            <h3 id={`${titleId}-stack`} className="text-[11px] uppercase tracking-[0.35em] text-ghost-faint">
              Kidō classification
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {p.stack.map((t) => (
                <li key={t.name}>
                  <KidoTag tag={t} />
                </li>
              ))}
            </ul>
          </section>

          {(p.links.live || p.links.repo) && (
            <div className="flex flex-wrap gap-3">
              {p.links.live && (
                <a
                  href={p.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-3 rounded-full bg-ghost px-6 text-[11px] font-medium uppercase tracking-[0.28em] text-void transition hover:shadow-[0_0_40px_-6px_rgba(123,44,191,0.9)]"
                >
                  Live demo <span aria-hidden>↗</span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
              {p.links.repo && (
                <a
                  href={p.links.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-3 rounded-full border border-white/20 px-6 text-[11px] uppercase tracking-[0.28em] text-ghost transition hover:border-white/50"
                >
                  Source <span aria-hidden>↗</span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </div>
          )}
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Reseal and close"
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
