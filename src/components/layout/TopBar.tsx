"use client";

import { useExperience } from "@/providers/ExperienceProvider";
import { audio } from "@/lib/audio/engine";

const NAV = [
  { href: "#hero", label: "Illusion" },
  { href: "#codex", label: "Codex" },
] as const;

export function TopBar() {
  const { sound, userReducedMotion, reducedMotion, toggleSound, toggleMotion } = useExperience();

  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:bg-ghost focus:px-3 focus:py-2 focus:text-void"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:h-20 md:px-10">
        <a href="#hero" className="group flex items-baseline gap-3" aria-label="Bleach, back to top">
          <span className="text-sm font-semibold tracking-[0.5em] text-ghost">BLEACH</span>
          <span aria-hidden className="font-kanji text-xs text-ghost/60 transition group-hover:text-ghost">
            霊圧
          </span>
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex gap-10 text-[11px] uppercase tracking-[0.35em] text-ghost/70">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onMouseEnter={() => audio.play("hover")}
                  className="transition-colors hover:text-ghost"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <ToggleButton
            pressed={sound}
            onClick={toggleSound}
            label={sound ? "Mute ambient sound" : "Enable ambient sound"}
          >
            <SoundGlyph on={sound} animate={!reducedMotion} />
            <span className="hidden sm:inline">Sound</span>
          </ToggleButton>
          <ToggleButton
            pressed={userReducedMotion}
            onClick={toggleMotion}
            label={userReducedMotion ? "Restore full motion" : "Reduce motion"}
          >
            <MotionGlyph reduced={reducedMotion} />
            <span className="hidden sm:inline">{reducedMotion ? "Still" : "Motion"}</span>
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
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
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
      className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-[11px] uppercase tracking-[0.3em] text-ghost/70 transition-colors hover:text-ghost aria-pressed:text-ghost"
    >
      {children}
    </button>
  );
}

function SoundGlyph({ on, animate }: { on: boolean; animate: boolean }) {
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
