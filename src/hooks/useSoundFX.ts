"use client";

import { useMemo } from "react";
import { audio, type Voice } from "@/lib/audio/engine";
import { useExperience } from "@/providers/ExperienceProvider";

type PointerLike = { clientX: number } | { currentTarget: EventTarget | null } | undefined;

/** Map a pointer (or the element) to stereo position, -1 … 1. */
export function panFrom(e?: PointerLike): number {
  if (typeof window === "undefined" || !e) return 0;
  if ("clientX" in e && typeof e.clientX === "number" && e.clientX > 0) return (e.clientX / window.innerWidth) * 2 - 1;
  const el = "currentTarget" in e ? (e.currentTarget as Element | null) : null;
  if (el && "getBoundingClientRect" in el) {
    const r = el.getBoundingClientRect();
    return ((r.left + r.width / 2) / window.innerWidth) * 2 - 1;
  }
  return 0;
}

/**
 * Low-level tactile audio for any element.
 *
 *   const fx = useSoundFX();
 *   <button {...fx.bind({ hover: "hover", press: "unsheathe" })} onClick={…}>
 *   fx.play("glass", e)   // e places the sound left/right in the stereo field
 *
 * `bind` returns pointer/keyboard handlers to spread, so they never clash
 * with your own onClick. Hover voices only fire for a mouse (touch has no
 * hover). Everything is silent until the visitor turns sound on.
 * For the named Bleach cues, use `useBleachAudio`, which builds on this.
 */
export function useSoundFX() {
  const { sfx } = useExperience();
  return useMemo(() => {
    const play = (v: Voice, e?: PointerLike) => {
      if (sfx) audio.play(v, { pan: panFrom(e) });
    };
    const bind = ({ hover, press }: { hover?: Voice; press?: Voice }) => ({
      onPointerEnter: hover
        ? (e: React.PointerEvent) => {
            if (e.pointerType === "mouse") play(hover, e);
          }
        : undefined,
      onPointerDown: press ? (e: React.PointerEvent) => play(press, e) : undefined,
      onKeyDown: press
        ? (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") play(press, e);
          }
        : undefined,
    });
    return { enabled: sfx, play, bind };
  }, [sfx]);
}

export type { Voice };
