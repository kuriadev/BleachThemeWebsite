"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { useExperience } from "@/providers/ExperienceProvider";

/**
 * Scroll-linked ink reveal: each word bleeds in (blur → sharp, faint → ghost
 * white) as the section crosses the viewport, so the reader's scroll is the
 * brush. Reduced motion renders the verse fully inked and static.
 */
export function InkLines({ lines }: { lines: readonly string[] }) {
  const { reducedMotion } = useExperience();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });

  const words = lines.flatMap((l, li) => (l ? l.split(" ").map((w) => ({ w, li })) : []));
  const total = words.length;
  let n = 0;

  return (
    <div ref={ref} className="space-y-1">
      {lines.map((line, li) =>
        line ? (
          <p key={li} className="text-[clamp(1.75rem,4.6vw,4.25rem)] font-medium leading-[1.12] tracking-tight">
            {line.split(" ").map((w, wi) => {
              const i = n++;
              return reducedMotion ? (
                <span key={wi} className="text-ghost">
                  {w}{" "}
                </span>
              ) : (
                <Word key={wi} word={w} progress={scrollYProgress} start={i / total} end={(i + 1.6) / total} />
              );
            })}
          </p>
        ) : (
          <div key={li} aria-hidden className="h-[0.9em] text-[clamp(1.75rem,4.6vw,4.25rem)]" />
        ),
      )}
    </div>
  );
}

function Word({ word, progress, start, end }: { word: string; progress: MotionValue<number>; start: number; end: number }) {
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const blur = useTransform(progress, [start, end], [10, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const y = useTransform(progress, [start, end], ["0.25em", "0em"]);
  return (
    <motion.span style={{ opacity, filter, y }} className="inline-block text-ghost will-change-[filter,opacity]">
      {word}&nbsp;
    </motion.span>
  );
}
