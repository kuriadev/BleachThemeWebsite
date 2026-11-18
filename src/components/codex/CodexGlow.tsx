"use client";

import { useEffect, useRef } from "react";
import type { AccentKey } from "@/lib/tokens";
import { accentMap } from "./accent";

/**
 * Ambient light behind the Codex. Whichever card is hovered or focused
 * (read from its data-accent) cross-fades the section's light to that
 * accent; it eases back to
 * Hōgyoku violet when nothing is active. Delegated listeners on the
 * parent section keep the cards themselves unaware of it.
 */
export function CodexGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = ref.current;
    const section = glow?.parentElement;
    if (!glow || !section) return;
    const layers = glow.querySelectorAll<HTMLElement>("[data-glow]");
    const apply = (key: AccentKey | null) => {
      const want = key ?? "hogyoku";
      layers.forEach((l) => (l.style.opacity = l.dataset.glow === want ? "1" : "0"));
      glow.dataset.active = key ? "true" : "false";
    };
    const pick = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-accent]");
      if (el) apply(el.dataset.accent as AccentKey);
    };
    const clear = (e: Event) => {
      const next = (e as FocusEvent | PointerEvent).relatedTarget as HTMLElement | null;
      if (!next?.closest?.("[data-accent]")) apply(null);
    };
    apply(null);
    section.addEventListener("pointerover", pick);
    section.addEventListener("focusin", pick);
    section.addEventListener("pointerout", clear);
    section.addEventListener("focusout", clear);
    return () => {
      section.removeEventListener("pointerover", pick);
      section.removeEventListener("focusin", pick);
      section.removeEventListener("pointerout", clear);
      section.removeEventListener("focusout", clear);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-60 transition-opacity duration-1000 data-[active=true]:opacity-100"
    >
      {(Object.keys(accentMap) as AccentKey[]).map((k) => (
        <div
          key={k}
          data-glow={k}
          className="absolute inset-0 transition-opacity duration-1000 ease-out"
          style={{
            opacity: k === "hogyoku" ? 1 : 0,
            background: `radial-gradient(60% 50% at 50% 55%, rgb(${accentMap[k].rgb} / 0.2), transparent 70%), radial-gradient(40% 30% at 85% 15%, rgb(${accentMap[k].rgb} / 0.12), transparent 70%)`,
          }}
        />
      ))}
    </div>
  );
}
