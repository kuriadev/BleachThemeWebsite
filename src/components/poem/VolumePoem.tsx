import { monologue } from "@/content/poem";
import { InkLines } from "./InkLines";

/** Interlude between chapters, styled like a tankōbon frontispiece. */
export function VolumePoem() {
  const { volume, title, kanji, lines } = monologue;
  return (
    <section aria-labelledby="poem-title" className="relative overflow-hidden bg-void py-40 md:py-56">
      <span aria-hidden className="reiatsu-smoke pointer-events-none absolute inset-x-0 top-0 h-64 -translate-y-1/3 opacity-90" />
      <span
        aria-hidden
        className="text-vertical pointer-events-none absolute right-[4vw] top-1/2 -translate-y-1/2 select-none font-kanji text-[clamp(5rem,14vw,13rem)] font-black leading-none text-ghost/[0.04]"
      >
        {kanji}
      </span>
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-32 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-white/20" />

      <div className="relative mx-auto max-w-[1100px] px-5 md:px-10">
        <p className="mb-10 flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] text-ghost-muted">
          <span aria-hidden className="h-px w-10 bg-hogyoku-bright" />
          Interlude · {volume}
        </p>
        <h2 id="poem-title" className="sr-only">
          {title}
        </h2>
        <blockquote>
          <InkLines lines={lines} />
          <footer className="mt-12 font-mono text-[11px] uppercase tracking-[0.35em] text-ghost-faint">
            — {title}
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
