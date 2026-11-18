"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useExperience } from "@/providers/ExperienceProvider";

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface Options {
  panelRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Extra key handling (e.g. arrow keys in a lightbox). */
  onKey?: (e: KeyboardEvent) => void;
}

/**
 * Shared modal behaviour for every dialog on the site:
 * moves focus in, traps Tab, closes on Esc, pauses inertial scroll,
 * and returns focus to whatever opened it.
 */
export function useDialog({ panelRef, initialFocusRef, onClose, onKey }: Options) {
  const { lockScroll } = useExperience();
  // Keep the latest handlers without re-running the open/close effect.
  const closeRef = useRef(onClose);
  const keyRef = useRef(onKey);
  useLayoutEffect(() => {
    closeRef.current = onClose;
    keyRef.current = onKey;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    lockScroll(true);
    (initialFocusRef?.current ?? panelRef.current)?.focus({ preventScroll: true });

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      keyRef.current?.(e);
      if (e.key !== "Tab" || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      lockScroll(false);
      opener?.focus({ preventScroll: true });
    };
  }, [lockScroll, panelRef, initialFocusRef]);
}
