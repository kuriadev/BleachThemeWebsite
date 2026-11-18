"use client";

import Image, { type StaticImageData } from "next/image";
import { motion } from "motion/react";
import { useMemo } from "react";
import { makeShards } from "@/lib/motion/shards";
import { ease } from "@/lib/tokens";

export type ShatterPhase = "idle" | "shattered" | "reforming";

interface Props {
  image: StaticImageData;
  alt: string;
  phase: ShatterPhase;
  /** Impact point in % of the frame (where the shatter originates). */
  origin: { x: number; y: number };
  /** Soft vignette so the art dissolves into the obsidian background. */
  mask: string;
  /** object-position of the art; shards use the same value so they line up. */
  focal?: string;
}

/**
 * The hero art as one optimised <Image> (fast LCP). Only when the illusion is
 * shattered do we swap to ~70 clip-path shards that fly apart and reassemble.
 */
export function ShatterImage({ image, alt, phase, origin, mask, focal = "50% 50%" }: Props) {
  const shards = useMemo(() => makeShards(), []);
  const active = phase !== "idle";

  return (
    <div
      className="absolute inset-0"
      style={{ maskImage: mask, WebkitMaskImage: mask, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
    >
      <Image
        src={image}
        alt={alt}
        fill
        preload
        fetchPriority="high"
        quality={90}
        placeholder="blur"
        sizes="106vw"
        className="object-cover transition-opacity duration-150"
        style={{ opacity: active ? 0 : 1, objectPosition: focal }}
      />

      {active && (
        <div aria-hidden className="absolute inset-0">
          {shards.map((s) => {
            const dx = s.cx - origin.x;
            const dy = s.cy - origin.y;
            const dist = Math.hypot(dx, dy) || 1;
            const force = 3 + 140 / (dist + 10); // % of frame; near the impact = more violent
            const tx = (dx / dist) * force;
            const ty = (dy / dist) * force + 2;
            const rot = (((s.id * 47) % 40) - 20) * (force / 17);
            const delay = (dist / 100) * 0.12;
            const out = phase === "shattered";
            return (
              <motion.div
                key={s.id}
                className="absolute inset-0 will-change-transform"
                style={{
                  clipPath: s.clip,
                  backgroundImage: `url(${image.src})`,
                  backgroundSize: "cover",
                  backgroundPosition: focal,
                  transformOrigin: `${s.cx}% ${s.cy}%`,
                }}
                initial={{ x: "0%", y: "0%", rotate: 0, scale: 1, opacity: 1 }}
                animate={
                  out
                    ? { x: `${tx}%`, y: `${ty}%`, rotate: rot, scale: 0.94, opacity: 0.85 }
                    : { x: "0%", y: "0%", rotate: 0, scale: 1, opacity: 1 }
                }
                transition={
                  out
                    ? { duration: 0.9, delay, ease: ease.reiatsu }
                    : { duration: 1.1, delay: 0.12 - delay * 0.5, ease: ease.blade }
                }
              >
                {/* Glass edge highlight on every shard */}
                <span className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-hogyoku/30 mix-blend-screen" />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
