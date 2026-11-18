import { projects } from "@/content/projects";
import { Archive } from "./Archive";

export function ArchiveSection() {
  return (
    <section id="archive" aria-labelledby="archive-title" className="relative overflow-hidden bg-obsidian py-32 md:py-44">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]"
      />
      <div className="relative mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="mb-12 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] text-ghost-muted">
              <span aria-hidden className="h-px w-10 bg-bankai" />
              Chapter 02 · 12th Division
            </p>
            <h2 id="archive-title" className="text-5xl font-semibold uppercase leading-[0.9] tracking-tight md:text-8xl">
              SRDI
              <br />
              <span className="text-ghost-muted">Experimental Archives</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ghost-muted md:text-base">
            Shinigami Research &amp; Development Institute case files. Each dossier is rated by Reiatsu threat level and
            classified by Kidō school: Hadō for what users see, Bakudō for what binds it, Kaidō for what keeps it alive.
          </p>
        </div>
        <Archive projects={projects} />
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-24 select-none font-kanji text-[18vw] font-black leading-none text-ghost/[0.03]"
      >
        研
      </span>
    </section>
  );
}
