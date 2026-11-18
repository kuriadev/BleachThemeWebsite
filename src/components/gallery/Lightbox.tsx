"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useId, useRef } from "react";
import type { GalleryPiece } from "@/content/gallery";
import { useSoundFX } from "@/hooks/useSoundFX";
import { useDialog } from "@/lib/a11y/useDialog";
import { ease } from "@/lib/tokens";
import { InkPlaceholder } from "./InkPlaceholder";

interface Props {
  pieces: GalleryPiece[];
  index: number;
  mode: "color" | "ink";
  inkClass: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}

/** Glass lightbox: ← → to browse, Esc to close, focus trapped inside. */
export function Lightbox({ pieces, index, mode, inkClass, onIndex, onClose }: Props) {
  const fx = useSoundFX();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const p = pieces[index];
  const n = pieces.length;

  const go = (delta: number) => {
    fx.play("click");
    onIndex((index + delta + n) % n);
  };

  useDialog({
    panelRef,
    initialFocusRef: closeRef,
    onClose,
    onKey: (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    },
  });

  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center p-3 md:p-8 ${mode === "ink" ? inkClass : ""}`}>
      <motion.div
        aria-hidden
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-void/85 backdrop-blur-xl"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.6, ease: ease.reiatsu }}
        className="glass relative z-10 flex max-h-[94svh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px]"
      >
        <div className="relative min-h-0 flex-1 bg-void">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.45, ease: ease.reiatsu }}
              className="relative mx-auto aspect-[16/10] max-h-[72svh] w-full"
              style={{ filter: mode === "ink" ? "url(#ink-wash)" : undefined }}
            >
              {p.image ? (
                <Image src={p.image} alt={p.alt ?? p.title} fill sizes="(max-width: 1200px) 96vw, 1150px" className="object-contain" />
              ) : (
                <div role="img" aria-label={`${p.title}: placeholder, artwork not yet supplied`} className="h-full w-full">
                  <InkPlaceholder kanji={p.kanji} tone={p.tone} seed={index + 1} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-5 md:px-8">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.3em] text-ghost-faint">
              Plate {String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")} · {p.medium}
            </p>
            <h2 id={titleId} className="mt-1 text-xl font-semibold uppercase tracking-[0.12em] text-ghost md:text-2xl">
              {p.title}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-ghost-muted">{p.caption}</p>
          </div>
          <div className="flex items-center gap-2">
            <NavButton label="Previous plate" onClick={() => go(-1)} dir="prev" />
            <NavButton label="Next plate" onClick={() => go(1)} dir="next" />
          </div>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={() => {
            fx.play("click");
            onClose();
          }}
          aria-label="Close lightbox"
          className="glass absolute right-4 top-4 flex size-11 items-center justify-center rounded-full text-ghost/90 transition hover:text-ghost"
        >
          <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.4">
            <path d="M1 1l12 12M13 1 1 13" />
          </svg>
        </button>
      </motion.div>
    </div>
  );
}

function NavButton({ label, onClick, dir }: { label: string; onClick: () => void; dir: "prev" | "next" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border border-white/15 text-ghost/80 transition hover:border-white/40 hover:text-ghost"
    >
      <span aria-hidden>{dir === "prev" ? "←" : "→"}</span>
    </button>
  );
}
