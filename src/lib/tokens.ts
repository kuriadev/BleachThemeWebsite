/**
 * JS mirror of the CSS design tokens in src/app/globals.css.
 * Use these for Motion / Three.js values that can't read CSS variables.
 */
export const colors = {
  void: "#000000",
  obsidian: "#050505",
  ghost: "#F5F5F7",
  bankai: "#00F0FF",
  hollow: "#FF1E42",
  hogyoku: "#7B2CBF",
  hogyokuBright: "#A66CFF",
} as const;

/** Cubic-bezier tuples for Motion's `ease` prop. */
export const ease = {
  blade: [0.77, 0, 0.175, 1],
  reiatsu: [0.16, 1, 0.3, 1],
  shunpo: [0.7, 0, 0.84, 0],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Seconds. Heavier elements get longer durations. */
export const duration = {
  micro: 0.18,
  base: 0.6,
  heavy: 1.1,
  cinematic: 1.8,
} as const;

/** Springs tuned to feel weighty rather than bouncy. */
export const spring = {
  magnetic: { stiffness: 180, damping: 18, mass: 0.6 },
  parallax: { stiffness: 60, damping: 20, mass: 1 },
  tilt: { stiffness: 220, damping: 24, mass: 0.8 },
} as const;

export type AccentKey = "bankai" | "hollow" | "hogyoku" | "ghost";
