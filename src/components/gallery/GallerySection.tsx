import { gallery } from "@/content/gallery";
import { Gallery } from "./Gallery";

/** Server shell: static heading copy; only the track itself hydrates. */
export function GallerySection() {
  return (
    <section id="gallery" aria-labelledby="gallery-title" className="relative overflow-hidden bg-void pt-32 md:pt-44">
      <span aria-hidden className="reiatsu-smoke pointer-events-none absolute inset-x-0 top-0 h-64 -translate-y-1/3 opacity-90" />
      <div className="mx-auto mb-12 grid max-w-[1600px] gap-6 px-5 md:grid-cols-[1fr_auto] md:items-end md:px-10">
        <div>
          <p className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.4em] text-ghost-muted">
            <span aria-hidden className="h-px w-10 bg-hollow" />
            Chapter 01 · Spatial Gallery
          </p>
          <h2 id="gallery-title" className="text-h2 font-semibold uppercase">
            JET <span className="text-ghost-faint">{"//"}</span>
            <br />
            <span className="text-ghost-muted">Editorial</span>
          </h2>
        </div>
        <p className="max-w-sm text-lede text-ghost-muted">
          A tribute wall in the spirit of the art books: black ink, white space, a single accent. Flip to Ink-Wash to see
          every plate as a high-contrast manga page.
        </p>
      </div>
      <Gallery pieces={gallery} />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-4 top-20 select-none font-kanji text-[18vw] font-black leading-none text-ghost/[0.03]"
      >
        画
      </span>
    </section>
  );
}
