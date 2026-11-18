import type { AccentKey } from "@/lib/tokens";
import { accentMap } from "@/components/codex/accent";

/**
 * Original abstract ink composition shown until real artwork is supplied:
 * a few brush-like strokes, an enso ring and a single kanji. Pure SVG,
 * no network request, and obviously a placeholder.
 */
export function InkPlaceholder({ kanji, tone, seed }: { kanji: string; tone: AccentKey; seed: number }) {
  const a = accentMap[tone];
  const r = (n: number) => ((Math.sin(seed * 97.13 + n * 13.7) + 1) / 2) * 100;
  return (
    <svg aria-hidden viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <defs>
        <filter id={`ink-edge-${seed}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale="14" />
        </filter>
        <radialGradient id={`ink-bg-${seed}`} cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor={a.glow} stopOpacity="0.22" />
          <stop offset="1" stopColor="#050505" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#ink-bg-${seed})`} />
      <g filter={`url(#ink-edge-${seed})`} fill="none" strokeLinecap="round">
        <circle cx="200" cy="190" r="118" stroke="#F5F5F7" strokeOpacity="0.55" strokeWidth="16" strokeDasharray="640 120" transform={`rotate(${r(1) * 3.6} 200 190)`} />
        <path d={`M${20 + r(2) * 0.6} ${300 + r(3) * 0.4} C 140 ${240 + r(4) * 0.5}, 260 ${340 - r(5) * 0.6}, 390 ${260 + r(6) * 0.3}`} stroke={a.glow} strokeOpacity="0.7" strokeWidth="6" />
        <path d={`M${40 + r(7)} 70 L ${300 + r(8) * 0.6} ${110 + r(9) * 0.4}`} stroke="#F5F5F7" strokeOpacity="0.35" strokeWidth="3" />
      </g>
      <text x="200" y="232" textAnchor="middle" fontSize="128" fontWeight="900" fill="#F5F5F7" fillOpacity="0.88" style={{ fontFamily: "var(--font-kanji), serif" }}>
        {kanji}
      </text>
      <text x="200" y="372" textAnchor="middle" fontSize="11" letterSpacing="5" fill="#A1A1AA" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
        YOUR ARTWORK HERE
      </text>
    </svg>
  );
}
