import { Hero } from "@/components/hero/Hero";
import { GallerySection } from "@/components/gallery/GallerySection";
import { VolumePoem } from "@/components/poem/VolumePoem";
import { ArchiveSection } from "@/components/archive/ArchiveSection";
import { Codex } from "@/components/codex/Codex";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <GallerySection />
      <VolumePoem />
      <ArchiveSection />
      <Codex />
      <footer className="border-t border-white/10 bg-void px-5 py-12 text-xs leading-relaxed text-ghost-faint md:px-10">
        <p className="mx-auto max-w-[1600px]">
          KYŌKA // ARCHIVE is an unofficial fan project. BLEACH © Tite Kubo / Shueisha, TV Tokyo, dentsu, Pierrot. Not
          affiliated with or endorsed by the rights holders. All verse on this page is original.
        </p>
      </footer>
    </main>
  );
}
