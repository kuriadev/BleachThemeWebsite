"use client";

import { useExperience } from "@/providers/ExperienceProvider";
import { audio } from "@/lib/audio/engine";

const NAV = [
  { href: "#hero", label: "Illusion", kanji: "鏡" },
  { href: "#gallery", label: "Gallery", kanji: "画" },
  { href: "#archive", label: "Archive", kanji: "研" },
  { href: "#codex", label: "Codex", kanji: "刀" },
] as const;

/**
 * Floating liquid-glass navbar: brand, section links, and three toggles
 * (ambient soundscape, UI sound effects, reduced motion). Every toggle is a
 * real button with aria-pressed and a ≥44px hit target.
 */
export function TopBar() {
  const { ambient, sfx, userReducedMotion, reducedMotion, toggleAmbient, toggleSfx, toggleMotion } = useExperience();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 md:top-5">
      <a
        href="#main"
        className="pointer-events-auto sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded-full focus:bg-ghost focus:px-4 focus:py-2 focus:text-void"
      >
        Skip to content
      </a>

      <div className="glass pointer-events-auto flex h-14 w-full max-w-[1100px] items-center justify-between gap-2 rounded-full pl-5 pr-1.5 md:pl-6">
        <a href="#hero" className="group flex shrink-0 items-baseline gap-2" aria-label="KYŌKA // ARCHIVE, back to top">
          <span className="text-[12px] font-semibold tracking-[0.42em] text-ghost">KYŌKA</span>
          <span aria-hidden className="text-[12px] text-hogyoku-bright">{"//"}</span>
          <span className="hidden text-[12px] tracking-[0.42em] text-ghost-muted transition-colors group-hover:text-ghost sm:inline">
            ARCHIVE
          </span>
        </a>

        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onMouseEnter={() => audio.play("hover")}
                  className="group flex min-h-11 items-center gap-2 rounded-full px-4 text-[11px] uppercase tracking-[0.3em] text-ghost-muted transition-colors hover:bg-white/[0.06] hover:text-ghost"
                >
                  <span aria-hidden className="font-kanji text-[12px] text-ghost-faint transition-colors group-hover:text-hogyoku-bright">
                    {n.kanji}
                  </span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center" role="group" aria-label="Experience settings">
          <ToggleButton pressed={ambient} onClick={toggleAmbient} label={ambient ? "Turn off ambient sound" : "Turn on ambient sound"} text="Ambient">
            <AmbientGlyph on={ambient} animate={!reducedMotion} />
          </ToggleButton>
          <ToggleButton pressed={sfx} onClick={toggleSfx} label={sfx ? "Turn off sound effects" : "Turn on sound effects"} text="SFX">
            <SfxGlyph on={sfx} />
          </ToggleButton>
          <ToggleButton
            pressed={userReducedMotion}
            onClick={toggleMotion}
            label={userReducedMotion ? "Restore full motion" : "Reduce motion"}
            text={reducedMotion ? "Still" : "Motion"}
          >
            <MotionGlyph reduced={reducedMotion} />
          </ToggleButton>
        </div>
      </div>
    </header>
  );
}

function ToggleButton({
  pressed,
  onClick,
  label,
  text,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={() => {
        onClick();
        audio.play("click");
      }}
      className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-[10px] uppercase tracking-[0.28em] text-ghost-muted transition-colors hover:bg-white/[0.06] hover:text-ghost aria-pressed:bg-white/[0.08] aria-pressed:text-ghost"
    >
      {children}
      <span className="hidden xl:inline">{text}</span>
    </button>
  );
}

function AmbientGlyph({ on, animate }: { on: boolean; animate: boolean }) {
  return (
    <span aria-hidden className="flex h-3.5 items-end gap-[2px]">
      {[0.5, 1, 0.7, 0.85].map((h, i) => (
        <span
          key={i}
          className="w-[2px] origin-bottom bg-current transition-transform duration-500"
          style={{
            height: "100%",
            transform: `scaleY(${on ? h : 0.18})`,
            animation: on && animate ? `reiatsu-pulse ${0.9 + i * 0.23}s ease-in-out infinite` : undefined,
          }}
        />
      ))}
    </span>
  );
}

function SfxGlyph({ on }: { on: boolean }) {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M2.5 6h2.5L8.5 3v10L5 10H2.5z" strokeLinejoin="round" />
      {on ? <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.8a6 6 0 0 1 0 8.4" strokeLinecap="round" /> : <path d="M11 6l3 4M14 6l-3 4" strokeLinecap="round" />}
    </svg>
  );
}

function MotionGlyph({ reduced }: { reduced: boolean }) {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor">
      <circle cx="8" cy="8" r="6.25" strokeWidth="1.2" />
      {reduced ? (
        <path d="M5.5 8h5" strokeWidth="1.4" strokeLinecap="round" />
      ) : (
        <path d="M4.5 9.5c1.2-3 5.8-3 7 0" strokeWidth="1.4" strokeLinecap="round" />
      )}
    </svg>
  );
}
