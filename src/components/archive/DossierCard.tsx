"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useRef } from "react";
import type { Project } from "@/content/projects";
import { audio } from "@/lib/audio/engine";
import { ease } from "@/lib/tokens";
import { useExperience } from "@/providers/ExperienceProvider";
import { KidoTag, ThreatBadge } from "./badges";

/**
 * Classified SRDI dossier. Hover (or focus) plays the preview video when one
 * exists, otherwise runs a scanline over the preview still.
 */
export function DossierCard({ project: p, onOpen }: { project: Project; onOpen: (id: string) => void }) {
  const { reducedMotion } = useExperience();
  const videoRef = useRef<HTMLVideoElement>(null);

  const play = () => {
    audio.play("hover");
    if (!reducedMotion) void videoRef.current?.play().catch(() => {});
  };
  const stop = () => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  return (
    <motion.article
      layout={!reducedMotion}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.6, ease: ease.reiatsu }}
      onPointerEnter={play}
      onPointerLeave={stop}
      onFocus={play}
      onBlur={stop}
      className="glass group relative flex flex-col overflow-hidden rounded-[24px]"
      aria-labelledby={`dossier-${p.id}`}
    >
      {/* Preview */}
      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/10 bg-void">
        {p.preview?.image ? (
          <Image
            src={p.preview.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover object-top opacity-70 grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(123,44,191,0.25),transparent_60%)]">
            <span className="font-mono text-4xl tracking-[0.3em] text-ghost/20 md:text-5xl">{p.codename}</span>
          </div>
        )}
        {p.preview?.video && (
          <video
            ref={videoRef}
            src={p.preview.video}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        {/* Scanline + grid overlay */}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_4px)]" />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/3 -translate-y-full bg-gradient-to-b from-transparent via-bankai/15 to-transparent opacity-0 group-hover:animate-[scan_2.4s_linear_infinite] group-hover:opacity-100"
        />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <ThreatBadge level={p.threat} />
        </div>
        {p.sample && (
          <span className="absolute right-4 top-4 rounded-full border border-white/20 bg-void/70 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-ghost-muted">
            Sample
          </span>
        )}
        <span aria-hidden className="absolute bottom-3 right-4 rotate-[-6deg] border-2 border-hollow/70 bg-void/70 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-hollow/80">
          {p.status === "Sealed" ? "Sealed" : "Classified"}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ghost-faint">
          SRDI · File {p.fileNo} · {p.year}
        </p>
        <h3 id={`dossier-${p.id}`} className="mt-2 text-xl font-semibold uppercase tracking-[0.08em] text-ghost">
          {p.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ghost-muted">{p.summary}</p>
        <ul aria-label="Stack" className="mt-5 flex flex-wrap gap-2">
          {p.stack.slice(0, 4).map((t) => (
            <li key={t.name}>
              <KidoTag tag={t} />
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={() => {
              audio.play("unsheathe");
              onOpen(p.id);
            }}
            aria-haspopup="dialog"
            className="flex min-h-11 w-full items-center justify-between rounded-full border border-white/15 px-5 text-[11px] uppercase tracking-[0.3em] text-ghost transition hover:border-hogyoku-bright/60 hover:bg-hogyoku/15"
          >
            Release seal
            <span aria-hidden className="font-kanji text-sm text-hogyoku-bright">解</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}
