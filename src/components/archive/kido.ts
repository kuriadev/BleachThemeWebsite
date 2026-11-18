import type { KidoClass, Project } from "@/content/projects";

export const kidoMeta: Record<KidoClass, { label: string; kanji: string; className: string }> = {
  hado: { label: "Hadō", kanji: "破道", className: "border-hollow/40 text-[#FF8A9B]" },
  bakudo: { label: "Bakudō", kanji: "縛道", className: "border-bankai/40 text-bankai" },
  kaido: { label: "Kaidō", kanji: "回道", className: "border-emerald-400/40 text-emerald-300" },
};

/** Deterministic spell number per tag, so the same tag always reads the same. */
export function kidoNumber(name: string): number {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 99) + 1;
}

const ROMAN = ["", "I", "II", "III", "IV", "V"];
export const threatMeta: Record<Project["threat"], { label: string; roman: string; color: string; rgb: string }> = {
  1: { label: "Dormant", roman: ROMAN[1], color: "#A1A1AA", rgb: "161 161 170" },
  2: { label: "Stirring", roman: ROMAN[2], color: "#00F0FF", rgb: "0 240 255" },
  3: { label: "Elevated", roman: ROMAN[3], color: "#A66CFF", rgb: "166 108 255" },
  4: { label: "Severe", roman: ROMAN[4], color: "#FF5A72", rgb: "255 90 114" },
  5: { label: "Catastrophic", roman: ROMAN[5], color: "#FF1E42", rgb: "255 30 66" },
};
