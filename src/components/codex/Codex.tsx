import { characters } from "@/content/characters";
import { CodexRail } from "./CodexRail";

/**
 * Server Component: owns the static copy and data, ships zero JS itself.
 * Only the rail (scroll + interaction) is a Client Component.
 */
export function Codex() {
  return (
    <section id="codex" aria-labelledby="codex-title" className="relative bg-obsidian">
      <div className="mx-auto max-w-[1600px] px-5 pt-32 md:px-10 md:pt-44">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] text-ghost-muted">
              <span aria-hidden className="h-px w-10 bg-bankai" />
              Chapter 01 · Zanpakutō Codex
            </p>
            <h2 id="codex-title" className="text-5xl font-semibold uppercase leading-[0.9] tracking-tight md:text-8xl">
              Those who
              <br />
              <span className="text-ghost-muted">carry a soul</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ghost-muted md:text-base">
            Every blade is a reflection of the soul that wields it. Hover to read its light; open a card for lore, release
            and power profile.
          </p>
        </div>
      </div>

      <CodexRail characters={characters} />

      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-24 select-none font-kanji text-[18vw] font-black leading-none text-ghost/[0.03]"
      >
        斬魄刀
      </span>
    </section>
  );
}
