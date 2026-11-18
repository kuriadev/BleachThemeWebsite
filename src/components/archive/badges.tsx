import type { Project, StackTag } from "@/content/projects";
import { kidoMeta, kidoNumber, threatMeta } from "./kido";

export function ThreatBadge({ level }: { level: Project["threat"] }) {
  const t = threatMeta[level];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border bg-void/70 px-3 py-1 text-[10px] uppercase tracking-[0.25em] backdrop-blur"
      style={{ borderColor: `rgb(${t.rgb} / 0.5)`, color: t.color }}
    >
      <span aria-hidden className="relative flex size-2">
        {level >= 4 && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ background: t.color }} />}
        <span className="relative size-2 rounded-full" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
      </span>
      <span>
        Reiatsu {t.roman}
        <span className="sr-only"> of V, {t.label}</span>
        <span aria-hidden className="hidden sm:inline"> · {t.label}</span>
      </span>
    </span>
  );
}

export function KidoTag({ tag }: { tag: StackTag }) {
  const k = kidoMeta[tag.kido];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] ${k.className}`}>
      <span aria-hidden className="opacity-70">
        {k.label} #{String(kidoNumber(tag.name)).padStart(2, "0")}
      </span>
      <span className="sr-only">{k.label}: </span>
      <span className="text-ghost">{tag.name}</span>
    </span>
  );
}
