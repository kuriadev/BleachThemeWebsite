"use client";

import { MotionConfig } from "motion/react";
import Lenis from "lenis";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { audio } from "@/lib/audio/engine";
import { prefsStore } from "@/lib/prefs";

interface Experience {
  sound: boolean;
  /** True when the OS *or* the in-site toggle asks for reduced motion. */
  reducedMotion: boolean;
  /** True only when the user chose reduced motion in-site. */
  userReducedMotion: boolean;
  toggleSound: () => void;
  toggleMotion: () => void;
  /** Pause / resume inertial scrolling (e.g. while a dialog is open). */
  lockScroll: (locked: boolean) => void;
}

const ExperienceContext = createContext<Experience | null>(null);

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribeSystem = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getSystem = () => window.matchMedia(QUERY).matches;
const getSystemServer = () => false;

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const prefs = useSyncExternalStore(
    prefsStore.subscribe,
    prefsStore.getSnapshot,
    prefsStore.getServerSnapshot,
  );
  const systemReduced = useSyncExternalStore(subscribeSystem, getSystem, getSystemServer);
  const reducedMotion = systemReduced || prefs.motion === "reduced";
  const lenisRef = useRef<Lenis | null>(null);

  // Mirror to <html data-motion> so pure-CSS animation respects it too.
  useEffect(() => {
    const el = document.documentElement;
    if (prefs.motion === "reduced") el.dataset.motion = "reduced";
    else delete el.dataset.motion;
  }, [prefs.motion]);

  // Inertial scroll — off entirely when motion is reduced.
  useEffect(() => {
    if (reducedMotion) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true });
    lenisRef.current = lenis;
    let raf = requestAnimationFrame(function loop(t) {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  const toggleSound = useCallback(() => {
    const next = !prefsStore.getSnapshot().sound;
    prefsStore.set({ sound: next });
    void audio.setEnabled(next);
  }, []);

  const toggleMotion = useCallback(() => {
    const next = prefsStore.getSnapshot().motion === "reduced" ? "auto" : "reduced";
    prefsStore.set({ motion: next });
  }, []);

  const lockScroll = useCallback((locked: boolean) => {
    const lenis = lenisRef.current;
    if (lenis) {
      if (locked) lenis.stop();
      else lenis.start();
    }
    document.documentElement.style.overflow = locked ? "hidden" : "";
  }, []);

  const value = useMemo<Experience>(
    () => ({
      sound: prefs.sound,
      reducedMotion,
      userReducedMotion: prefs.motion === "reduced",
      toggleSound,
      toggleMotion,
      lockScroll,
    }),
    [prefs.sound, prefs.motion, reducedMotion, toggleSound, toggleMotion, lockScroll],
  );

  return (
    <ExperienceContext.Provider value={value}>
      <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>{children}</MotionConfig>
    </ExperienceContext.Provider>
  );
}

export function useExperience(): Experience {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used inside <ExperienceProvider>");
  return ctx;
}
