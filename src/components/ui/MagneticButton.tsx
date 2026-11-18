"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { useSoundFX, type Voice } from "@/hooks/useSoundFX";
import { spring } from "@/lib/tokens";
import { useExperience } from "@/providers/ExperienceProvider";

type Variant = "primary" | "ghost";

interface Props extends Omit<ComponentPropsWithoutRef<"button">, "children" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd" | "style"> {
  children: ReactNode;
  variant?: Variant;
  /** How far (px) the button can be pulled toward the cursor. */
  strength?: number;
  /** Cue on mouse hover (primary CTAs use the Zanpakutō unsheathe). */
  hoverVoice?: Voice | null;
  /** Cue on press. `null` when onClick plays its own (e.g. the shatter). */
  pressVoice?: Voice | null;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-ghost text-void shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_20px_60px_-10px_rgba(123,44,191,0.75)]",
  ghost: "glass text-ghost",
};

/**
 * Magnetic CTA: the shell drifts toward the cursor, the label drifts further
 * (parallax inside the button), giving a sense of mass. Keyboard users get
 * the same affordance without the motion.
 */
export function MagneticButton({
  children,
  variant = "primary",
  strength = 22,
  className = "",
  onClick,
  onMouseEnter,
  hoverVoice = "hover",
  pressVoice = "glass",
  ...rest
}: Props) {
  const fx = useSoundFX();
  const ref = useRef<HTMLButtonElement>(null);
  const { reducedMotion } = useExperience();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, spring.magnetic);
  const sy = useSpring(y, spring.magnetic);
  const lx = useTransform(sx, (v) => v * 0.45);
  const ly = useTransform(sy, (v) => v * 0.45);

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (reducedMotion || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    x.set(dx * strength);
    y.set(dy * strength * 0.6);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onPointerMove={onMove}
      onPointerLeave={reset}
      onMouseEnter={(e) => {
        if (hoverVoice) fx.play(hoverVoice, e);
        onMouseEnter?.(e);
      }}
      onClick={(e) => {
        if (pressVoice) fx.play(pressVoice, e);
        onClick?.(e);
      }}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      className={`group relative isolate inline-flex min-h-12 items-center justify-center overflow-hidden rounded-full px-5 text-[12px] font-medium uppercase tracking-[0.18em] sm:px-7 sm:tracking-[0.28em] transition-shadow duration-500 ${styles[variant]} ${className}`}
      {...rest}
    >
      {/* Blade-light sweep on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/3 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:animate-blade-sweep group-hover:opacity-100"
      />
      <motion.span style={{ x: lx, y: ly }} className="relative flex items-center gap-3">
        {children}
      </motion.span>
    </motion.button>
  );
}
