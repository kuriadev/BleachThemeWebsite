"use client";

import { useMemo } from "react";
import { audio } from "@/lib/audio/engine";
import { useExperience } from "@/providers/ExperienceProvider";
import { useSoundFX } from "./useSoundFX";

type Evt = Parameters<ReturnType<typeof useSoundFX>["play"]>[1];

/**
 * The Soul Society Soundscape, by name.
 *
 *   const sound = useBleachAudio();
 *   <button onPointerEnter={sound.playZanpakutoSlash} onClick={…}>
 *
 * - Muted by default. `toggleSoundscape()` (UI cues) and
 *   `toggleBackgroundReiatsu()` (ambience) are remembered in localStorage;
 *   a remembered ambience resumes on the first gesture, never on load.
 * - Configured samples are preloaded on mount (ExperienceProvider); every
 *   cue falls back to its synthesised voice, so nothing ever fails silent.
 * - Pass the event to any play* function to place the sound in stereo.
 */
export function useBleachAudio() {
  const { sfx, ambient, toggleSfx, toggleAmbient } = useExperience();
  const fx = useSoundFX();

  return useMemo(() => {
    const playZanpakutoSlash = (e?: Evt) => fx.play("unsheathe", e);
    return {
      /** UI cues on/off. */
      enabled: sfx,
      /** Reiatsu ambience on/off. */
      ambient,

      /** Blade leaving the saya + steel ring. Primary CTAs. */
      playZanpakutoSlash,
      playZanpakutōSlash: playZanpakutoSlash,
      /** Distant, distorted hollow cry. Very quiet; threat states only. */
      playHollowAmbience: (e?: Evt) => fx.play("hollow", e),
      /** Shunpo whoosh + kidō shimmer. Tabs, filters, section jumps. */
      playFlashStep: (e?: Evt) => fx.play("flashstep", e),
      /** Heavy liquid-glass detent. Minor links, toggles, lightbox. */
      playGlassClick: (e?: Evt) => fx.play("glass", e),
      /** Mirror break. */
      playShatter: (e?: Evt) => fx.play("shatter", e),

      toggleSoundscape: toggleSfx,
      toggleBackgroundReiatsu: toggleAmbient,
      setVolume: (v: number) => audio.setVolume(v),
      getVolume: () => audio.getVolume(),
    };
  }, [sfx, ambient, fx, toggleSfx, toggleAmbient]);
}
