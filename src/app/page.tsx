import { Hero } from "@/components/hero/Hero";
import { Codex } from "@/components/codex/Codex";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <Codex />
      <footer className="border-t border-white/10 bg-void px-5 py-12 text-xs leading-relaxed text-ghost-faint md:px-10">
        <p className="mx-auto max-w-[1600px]">
          Unofficial fan project. BLEACH © Tite Kubo / Shueisha, TV Tokyo, dentsu, Pierrot. Not affiliated with or
          endorsed by the rights holders. Next chapter in progress: The Arcs.
        </p>
      </footer>
    </main>
  );
}
