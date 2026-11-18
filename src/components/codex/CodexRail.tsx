"use client";

import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { Character } from "@/content/characters";
import { useMediaQuery } from "@/lib/motion/useMediaQuery";
import { useExperience } from "@/providers/ExperienceProvider";
import { CodexCard } from "./CodexCard";
import { CodexDialog } from "./CodexDialog";

/**
 * Desktop + full motion: the section pins and vertical scroll drives a
 * horizontal track (scroll-linked, spring-smoothed).
 * Mobile or reduced motion: a native, swipeable, snap-scrolling row.
 */
export function CodexRail({ characters }: { characters: Character[] }) {
  const { reducedMotion } = useExperience();
  const wide = useMediaQuery("(min-width: 1024px) and (pointer: fine)");
  const pinned = wide && !reducedMotion;
  const [openId, setOpenId] = useState<string | null>(null);
  const open = characters.find((c) => c.id === openId) ?? null;

  return (
    <>
      {pinned ? (
        <PinnedRail characters={characters} onOpen={setOpenId} />
      ) : (
        <NativeRail characters={characters} onOpen={setOpenId} />
      )}
      <AnimatePresence>
        {open && <CodexDialog key={open.id} character={open} onClose={() => setOpenId(null)} />}
      </AnimatePresence>
    </>
  );
}

interface RailProps {
  characters: Character[];
  onOpen: (id: string) => void;
}

function PinnedRail({ characters, onOpen }: RailProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setDistance(Math.max(track.scrollWidth - window.innerWidth, 0));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: outerRef, offset: ["start start", "end end"] });
  const raw = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const x = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.6 });
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Keyboard users: tabbing to an off-screen card scrolls the page to it.
  const onCardFocus = useCallback(
    (el: HTMLElement) => {
      const outer = outerRef.current;
      if (!outer || distance === 0) return;
      const left = el.offsetLeft - window.innerWidth * 0.25;
      const p = Math.min(Math.max(left / distance, 0), 1);
      const top = outer.getBoundingClientRect().top + window.scrollY + p * distance;
      window.scrollTo({ top, behavior: "auto" });
    },
    [distance],
  );

  return (
    <div ref={outerRef} style={{ height: `calc(100vh + ${distance}px)` }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <motion.ul
          ref={trackRef}
          style={{ x }}
          aria-label="Characters"
          className="flex w-max gap-8 px-10 py-10 will-change-transform"
        >
          {characters.map((c, i) => (
            <li key={c.id} className="w-[min(420px,30vw)] shrink-0">
              <CodexCard character={c} index={i} onOpen={onOpen} onFocusCard={onCardFocus} />
            </li>
          ))}
          <li aria-hidden className="w-[20vw] shrink-0" />
        </motion.ul>

        <div aria-hidden className="mx-10 mt-2 flex items-center gap-4 text-[11px] uppercase tracking-[0.35em] text-ghost-faint">
          <span>Scroll</span>
          <div className="relative h-px flex-1 bg-ghost/10">
            <motion.div style={{ width: progress }} className="absolute inset-y-0 left-0 bg-bankai shadow-[0_0_12px_#00F0FF]" />
          </div>
          <span>{String(characters.length).padStart(2, "0")}</span>
        </div>
      </div>
    </div>
  );
}

function NativeRail({ characters, onOpen }: RailProps) {
  return (
    <div className="py-14">
      <ul
        aria-label="Characters"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 [scrollbar-width:none] md:px-10 [&::-webkit-scrollbar]:hidden"
      >
        {characters.map((c, i) => (
          <li key={c.id} className="w-[82vw] max-w-[400px] shrink-0 snap-center">
            <CodexCard character={c} index={i} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </div>
  );
}
