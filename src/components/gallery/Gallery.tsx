"use client";

import Image from "next/image";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryPiece } from "@/content/gallery";
import { useSoundFX } from "@/hooks/useSoundFX";
import { useExperience } from "@/providers/ExperienceProvider";
import { accentMap } from "@/components/codex/accent";
import { GalleryFilters } from "./GalleryFilters";
import { InkPlaceholder } from "./InkPlaceholder";
import { Lightbox } from "./Lightbox";
import styles from "./Gallery.module.css";

type Mode = "color" | "ink";

const SHAPE: Record<GalleryPiece["shape"], string> = {
  landscape: "w-[86vw] sm:w-[62vw] lg:w-[46vw] aspect-[16/10]",
  portrait: "w-[64vw] sm:w-[40vw] lg:w-[24vw] aspect-[3/4]",
  square: "w-[76vw] sm:w-[46vw] lg:w-[32vw] aspect-square",
};

/**
 * Spatial gallery: a native horizontal scroller (touch, trackpad and keyboard
 * work for free) upgraded with mouse drag + inertia and a perspective "room"
 * where pieces turn toward the viewer as they near the centre.
 */
export function Gallery({ pieces }: { pieces: GalleryPiece[] }) {
  const fx = useSoundFX();
  const { reducedMotion } = useExperience();
  const [mode, setMode] = useState<Mode>("color");
  const [open, setOpen] = useState<number | null>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  // ── Spatial tilt: each piece rotates by its distance from centre ──────
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = Array.from(track.querySelectorAll<HTMLElement>("[data-piece]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerWidth / 2;
      for (const el of items) {
        const r = el.getBoundingClientRect();
        const d = (r.left + r.width / 2 - mid) / mid; // −1 … 1
        const c = Math.max(-1.2, Math.min(1.2, d));
        el.style.setProperty("--tilt", reducedMotion ? "0deg" : `${(-c * 14).toFixed(2)}deg`);
        el.style.setProperty("--depth", reducedMotion ? "0px" : `${(-Math.abs(c) * 80).toFixed(1)}px`);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    track.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reducedMotion]);

  // ── Mouse drag with inertia (touch & trackpad use native scrolling) ───
  const drag = useRef({ active: false, moved: false, x: 0, left: 0, v: 0, t: 0, raf: 0 });
  const onPointerDown = (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const d = drag.current;
    cancelAnimationFrame(d.raf);
    Object.assign(d, { active: true, moved: false, x: e.clientX, left: e.currentTarget.scrollLeft, v: 0, t: performance.now() });
  };
  const onPointerMove = (e: React.PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      e.currentTarget.dataset.dragging = "true";
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    const now = performance.now();
    const prev = e.currentTarget.scrollLeft;
    e.currentTarget.scrollLeft = d.left - dx;
    d.v = (e.currentTarget.scrollLeft - prev) / Math.max(now - d.t, 1);
    d.t = now;
  };
  const endDrag = (e: React.PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    const el = e.currentTarget;
    delete el.dataset.dragging;
    if (!d.moved || reducedMotion) return;
    let v = d.v * 16; // px per frame
    const glide = () => {
      v *= 0.94;
      el.scrollLeft += v;
      if (Math.abs(v) > 0.4) d.raf = requestAnimationFrame(glide);
    };
    d.raf = requestAnimationFrame(glide);
  };

  const openAt = useCallback((i: number) => {
    if (drag.current.moved) return; // a drag is not a click
    fx.play("unsheathe");
    setOpen(i);
  }, [fx]);

  const setModeWithSound = (m: Mode) => {
    fx.play("click");
    setMode(m);
  };

  return (
    <div className={mode === "ink" ? styles.ink : undefined}>
      <GalleryFilters />

      <div className="mx-auto mb-8 flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 md:px-10">
        <div role="group" aria-label="Rendering mode" className="glass flex rounded-full p-1">
          {(
            [
              ["color", "Original Color"],
              ["ink", "Ink-Wash"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setModeWithSound(m)}
              className="min-h-11 rounded-full px-5 text-[11px] uppercase tracking-[0.28em] text-ghost-muted transition-colors hover:text-ghost aria-pressed:bg-ghost aria-pressed:text-void"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] uppercase tracking-[0.35em] text-ghost-faint">
          <span className="hidden md:inline">Drag, scroll or use ← → · </span>
          {String(pieces.length).padStart(2, "0")} plates
        </p>
      </div>

      <ul
        ref={trackRef}
        aria-label="Gallery plates"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`${styles.track} flex items-center gap-6 overflow-x-auto px-[8vw] py-10 md:gap-10`}
      >
        {pieces.map((p, i) => (
          <li key={p.id} className="shrink-0" style={{ marginTop: i % 2 ? "6vh" : 0 }}>
            <button
              type="button"
              data-piece
              onClick={() => openAt(i)}
              onMouseEnter={() => fx.play("hover")}
              aria-haspopup="dialog"
              aria-label={`Open plate ${i + 1}: ${p.title}. ${p.medium}.`}
              className={`${styles.item} group block text-left`}
            >
              <figure>
                <div className={`relative overflow-hidden rounded-[22px] border border-white/10 bg-obsidian-800 ${SHAPE[p.shape]}`}>
                  <div className={`${styles.media} absolute inset-0`}>
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt=""
                        fill
                        placeholder="blur"
                        sizes="(max-width: 640px) 86vw, (max-width: 1024px) 62vw, 46vw"
                        className="object-cover"
                      />
                    ) : (
                      <InkPlaceholder kanji={p.kanji} tone={p.tone} seed={i + 1} />
                    )}
                  </div>
                  <span aria-hidden className={`${styles.paper} pointer-events-none absolute inset-0`} />
                  <span
                    aria-hidden
                    className={`${styles.tone} pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100`}
                    style={{ boxShadow: `inset 0 0 0 1px rgb(${accentMap[p.tone].rgb} / 0.6), inset 0 -120px 120px -60px rgb(${accentMap[p.tone].rgb} / 0.35)` }}
                  />
                  <span aria-hidden className="absolute right-4 top-3 font-kanji text-3xl text-ghost/70 mix-blend-difference">
                    {p.kanji}
                  </span>
                </div>
                <figcaption className="mt-4 flex items-baseline justify-between gap-6">
                  <span className="text-sm font-medium uppercase tracking-[0.18em] text-ghost">{p.title}</span>
                  <span className="text-[11px] uppercase tracking-[0.25em] text-ghost-faint">
                    {String(i + 1).padStart(2, "0")} · {p.medium}
                  </span>
                </figcaption>
              </figure>
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {open !== null && (
          <Lightbox
            pieces={pieces}
            index={open}
            mode={mode}
            onIndex={setOpen}
            onClose={() => setOpen(null)}
            inkClass={styles.ink}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
