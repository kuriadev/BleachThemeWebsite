"use client";

import { motion, type Variants } from "motion/react";
import { ease } from "@/lib/tokens";

interface Props {
  text: string;
  id?: string;
  as?: "h1" | "h2" | "p" | "span";
  className?: string;
  /** Seconds before the first glyph moves. */
  delay?: number;
  /** Seconds between glyphs. */
  stagger?: number;
}

const glyph: Variants = {
  hidden: { y: "105%", rotate: 6, opacity: 0, filter: "blur(8px)" },
  show: {
    y: "0%",
    rotate: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 1.1, ease: ease.reiatsu },
  },
};

/**
 * Staggered per-letter reveal. Screen readers get the whole string once
 * (aria-label on the wrapper); the per-glyph spans are hidden from AT.
 * Words are kept unbreakable so letters never wrap mid-word.
 */
export function SplitReveal({ text, id, as = "span", className = "", delay = 0, stagger = 0.035 }: Props) {
  const Tag = motion[as];
  const words = text.split(" ");
  let i = 0;

  return (
    <Tag
      id={id}
      aria-label={text}
      className={className}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { delayChildren: delay, staggerChildren: stagger } } }}
    >
      {words.map((word, w) => (
        <span key={w} aria-hidden className="inline-flex whitespace-nowrap">
          {Array.from(word).map((ch) => {
            const k = i++;
            return (
              <span key={k} className="-mt-[0.18em] inline-block overflow-hidden pb-[0.08em] pt-[0.18em] align-bottom">
                <motion.span variants={glyph} className="inline-block will-change-transform">
                  {ch}
                </motion.span>
              </span>
            );
          })}
          {w < words.length - 1 && <span className="inline-block w-[0.28em]" />}
        </span>
      ))}
    </Tag>
  );
}
