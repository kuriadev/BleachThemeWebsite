import type { AccentKey } from "@/lib/tokens";

/** Accent → raw colour + an AA-safe text variant on obsidian. */
export const accentMap: Record<AccentKey, { glow: string; text: string; rgb: string }> = {
  bankai: { glow: "#00F0FF", text: "#00F0FF", rgb: "0 240 255" },
  hollow: { glow: "#FF1E42", text: "#FF5A72", rgb: "255 30 66" },
  hogyoku: { glow: "#7B2CBF", text: "#A66CFF", rgb: "123 44 191" },
  ghost: { glow: "#F5F5F7", text: "#F5F5F7", rgb: "245 245 247" },
};
