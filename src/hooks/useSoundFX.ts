"use client";

import { useMemo } from "react";
import { audio, type Voice } from "@/lib/audio/engine";
import { useExperience } from "@/providers/ExperienceProvider";

/**
 * Tactile audio for any interactive element.
 *
 *   const fx = useSoundFX();
 *   <button {...fx.bind({ hover: "hover", press: "unsheathe" })} onClick={…}>
 *
 * `bind` returns pointer/keyboard handlers to spread onto the element, so
 * you don't have to merge them with your own onClick. Sounds are no-ops
 * until the visitor turns SFX on in the dock (the engine gates them too),
 * and hover sounds are skipped on touch, where hover doesn't exist.
 */
export function useSoundFX() {
  const { sfx } = useExperience();
  return useMemo(() => {
    const play = (v: Voice) => {
      if (sfx) audio.play(v);
    };
    const bind = ({ hover, press }: { hover?: Voice; press?: Voice }) => ({
      onPointerEnter: hover
        ? (e: React.PointerEvent) => {
            if (e.pointerType === "mouse") play(hover);
          }
        : undefined,
      onPointerDown: press ? () => play(press) : undefined,
      onKeyDown: press
        ? (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") play(press);
          }
        : undefined,
    });
    return { enabled: sfx, play, bind };
  }, [sfx]);
}

export type { Voice };
