# BLEACH — Kyōka Suigetsu · Implementation Guide

An unofficial, gallery-grade Bleach fan experience. This doc covers the architecture, the design tokens, how the WebGL layer and motion libraries are wired, and how to extend it.

**Stack (as built):** Next.js 16 App Router (Turbopack) · React 19 · Tailwind CSS v4 · Motion 12 (`motion/react`, formerly Framer Motion) · three.js (raw, no R3F) · Lenis · Web Audio API (procedural, no audio files).

---

## 1. Folder structure

```
bleach-site/
├─ docs/IMPLEMENTATION.md          ← this file
├─ next.config.ts                  ← image qualities/formats, security headers
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                ← fonts, pre-paint prefs script, providers, TopBar
│  │  ├─ page.tsx                  ← Server Component: composes sections
│  │  └─ globals.css               ← DESIGN TOKENS (Tailwind v4 @theme = the config)
│  ├─ assets/
│  │  └─ aizen-hero.png            ← supplied hero art (static import → blur placeholder)
│  ├─ components/
│  │  ├─ layout/TopBar.tsx         ← nav + Sound / Motion toggles (aria-pressed)
│  │  ├─ hero/
│  │  │  ├─ Hero.tsx               ← parallax layers, distortion, shatter sequence, CTAs
│  │  │  └─ ShatterImage.tsx       ← <Image> for LCP; swaps to clip-path shards on shatter
│  │  ├─ codex/
│  │  │  ├─ Codex.tsx              ← Server Component: heading + data
│  │  │  ├─ CodexRail.tsx          ← pinned horizontal scroll (desktop) / native snap row
│  │  │  ├─ CodexCard.tsx          ← liquid-glass card, pointer light, 3D tilt
│  │  │  ├─ CodexDialog.tsx        ← shared-layout modal: lore, release, stat meters
│  │  │  └─ accent.ts              ← accent → glow / AA-safe text colour
│  │  ├─ ui/
│  │  │  ├─ MagneticButton.tsx     ← magnetic CTA w/ inner parallax + audio
│  │  │  └─ SplitReveal.tsx        ← staggered per-glyph reveal (SR-friendly)
│  │  └─ webgl/
│  │     ├─ ReiatsuCanvas.tsx      ← next/dynamic (ssr:false) + idle mount gate
│  │     └─ ReiatsuField.tsx       ← three.js points + custom shaders
│  ├─ content/characters.ts        ← typed Codex data (swap for a CMS later)
│  ├─ lib/
│  │  ├─ tokens.ts                 ← JS mirror of tokens (eases, springs, colours)
│  │  ├─ prefs.ts                  ← external store + pre-paint init script
│  │  ├─ audio/engine.ts           ← procedural Web Audio (click, hover, shatter, hum)
│  │  └─ motion/
│  │     ├─ shards.ts              ← deterministic mirror triangulation
│  │     └─ useMediaQuery.ts
│  └─ providers/ExperienceProvider.tsx ← sound + reduced-motion + Lenis + MotionConfig
```

**Planned (not built yet):** `components/arcs/` for Chapter 02 — The Arcs & Timeline (see §8).

### Server / Client split

| Boundary | Why |
|---|---|
| `page.tsx`, `Codex.tsx` are Server Components | Static copy and data render to HTML with zero JS. |
| `Hero`, `CodexRail`, cards, dialog, TopBar are Client Components | They need pointer, scroll and audio APIs. |
| `ReiatsuField` loads via `next/dynamic({ ssr: false })` after `requestIdleCallback` | three.js (~150 KB gz) never blocks LCP or hydration. |

The page is fully static (`○ /` in the build output), so Vercel serves it from the edge CDN.

---

## 2. Design tokens & "Tailwind config"

Tailwind v4 no longer uses `tailwind.config.ts`; the `@theme` block in `src/app/globals.css` **is** the config. Every token there becomes a utility automatically (`bg-obsidian`, `text-hogyoku-bright`, `ease-blade`, `animate-reiatsu-pulse`, `font-kanji`, `text-display` …).

| Token | Value | Use |
|---|---|---|
| `void` | `#000000` | page edges, footer |
| `obsidian` | `#050505` | base surface |
| `ghost` | `#F5F5F7` | primary text |
| `ghost-muted` | `#A1A1AA` | body copy (7.9:1 on obsidian) |
| `ghost-faint` | `#6B6B76` | decorative / large only |
| `bankai` | `#00F0FF` | rare energy highlights |
| `hollow` | `#FF1E42` | focal / threat states (text variant `#FF5A72` for AA) |
| `hogyoku` | `#7B2CBF` | Aizen ambient glow (fills, shadows) |
| `hogyoku-bright` | `#A66CFF` | violet **text** that passes AA on obsidian |

`#7B2CBF` is only 2.6:1 on `#050505`, so it's used for glows and fills, never small text. `hogyoku-bright` is the text-safe sibling.

**Easing:** `ease-blade` (heavy in-out, a sword draw), `ease-reiatsu` (expo-out release), `ease-shunpo` (sharp exit). **Springs** (in `lib/tokens.ts`) are tuned with high damping so nothing bounces.

**Custom utilities:** `glass` (liquid-glass surface: layered gradient, inner highlights, backdrop blur + saturate) and `text-vertical` (upright vertical-rl for kanji).

If you prefer a JS config (e.g. for tooling), add `@config "../../tailwind.config.ts";` at the top of `globals.css`. Tailwind v4 still honours it.

---

## 3. The Hero: how the layers work

Depth stack (back → front), each driven by one spring-smoothed pointer value through the `<Layer depth>` helper:

1. **L0** — violet bloom + vertical `鏡花水月` watermark (depth 0.15)
2. **L1** — WebGL reiatsu particles (own pointer repulsion in the shader)
3. **L2** — the Aizen art (depth 0.45) + scroll-linked sink/scale
4. **L3** — three liquid-glass mirror shards on the flanks (depth 1.1, `backdrop-filter` refraction)
5. **L4** — typography + CTAs (scroll-linked lift & fade)

**Composition of the supplied art (739×415).** The face sits at ~50% x / 18% y and the violet energy fills both flanks. Two intersected masks (radial + vertical linear) keep the figure and let the flanks bleed into obsidian. The headline sits in the lower-left over the dark coat, never above ~45% of the viewport, so the face stays clear.

> ⚠️ **Resolution:** the source is 739 px wide and is shown up to ~1240 px, so it's a little soft on large/retina screens. Drop a ≥2400 px version into `src/assets/aizen-hero.png` (same aspect) and nothing else needs to change.

**Kyōka Suigetsu distortion.** An SVG `feTurbulence` → `feDisplacementMap` filter. Pointer *velocity* over the art feeds a decaying value written straight to the filter's `scale` attribute in rAF (no React re-render per frame). The filter is only attached while scale > 0.4, so idle cost is zero. It's disabled for touch and reduced motion.

**Shatter.** `ShatterImage` renders one optimised `<Image preload fetchPriority="high">` for LCP. On "Shatter Kyōka Suigetsu" (or a click on the art, which sets the impact point), it swaps to 70 `clip-path` triangles from `lib/motion/shards.ts`. Shards fly outward, with more force near the impact, then reassemble 1.5 s later (the illusion was never broken). The same event fires `reiatsu:burst` so the particle field blows outward in sync, and the audio engine plays a synthesised glass break. Under reduced motion it becomes a brief cross-fade.

---

## 4. Setting up the WebGL canvas (step by step)

1. **Install:** `npm i three && npm i -D @types/three`.
2. **Write the renderer as a default-export client component** (`ReiatsuField.tsx`) that owns its own `<canvas>` and does all setup inside `useEffect`. That keeps it SSR-safe and gives one clean cleanup path.
3. **Lazy-load it** behind `next/dynamic(() => import("./ReiatsuField"), { ssr: false })` in a tiny wrapper (`ReiatsuCanvas.tsx`), and only mount after `requestIdleCallback`. The hero image and text paint first; particles fade in after.
4. **Renderer settings that matter for 60/120 fps:**
   - `antialias: false`, `powerPreference: "low-power"`, `alpha: true` (CSS gradient shows through)
   - `setPixelRatio(Math.min(devicePixelRatio, 1.75))`
   - Particle count by input type: 900 on coarse pointers, 2,600 on desktop
   - `ShaderMaterial` with `AdditiveBlending`, `depthWrite: false`, and an orthographic camera in clip space (no matrices to update)
5. **Do all motion in the vertex shader.** Drift, sway, swirl, pointer repulsion and burst all run on the GPU, so the CPU only updates 3 uniforms per frame.
6. **Pause when it isn't seen:** an `IntersectionObserver` plus `document.hidden` skip rendering, and `ResizeObserver` keeps the drawing buffer sized to the element.
7. **Reduced motion:** pass `still` and render a single frame at a fixed time (re-rendered on resize).
8. **Always dispose** geometry, material and renderer on unmount. That matters for Fast Refresh and route changes.
9. **No WebGL?** The constructor is wrapped in `try`, and the CSS bloom underneath is the fallback.

**Going further** (same pattern): add a full-screen `PlaneGeometry` with an fbm ink-wash fragment shader behind the points, or swap to `@react-three/fiber` if the scene grows past a couple of objects.

---

## 5. Integrating the motion libraries cleanly

**One source of truth for motion preference.** `ExperienceProvider` combines the OS `prefers-reduced-motion` with the in-site toggle and pushes that into:

- `<MotionConfig reducedMotion="always" | "never">`, so every Motion animation obeys automatically
- `html[data-motion="reduced"]`, so CSS keyframes and transitions are neutralised (see `globals.css`)
- Lenis (destroyed when reduced) and the WebGL `still` prop
- component-level forks (pinned vs native Codex rail, shatter vs cross-fade)

**No flash before hydration.** `prefsInitScript` runs in `<head>` and sets `data-motion` before first paint. The React side reads the same value through `useSyncExternalStore` (`getServerSnapshot` = defaults), so there are no hydration mismatches.

**Smooth scroll.** Lenis drives the window scroll, so Motion's `useScroll` keeps working with no proxying. Dialogs call `lockScroll(true)`, which runs `lenis.stop()` and locks overflow.

**Where GSAP / Anime.js / Lottie fit (optional):**

- **GSAP ScrollTrigger:** for the Arcs timeline if you want scrubbed, multi-step pinned sequences. Register in a client component, tie it to Lenis with `lenis.on("scroll", ScrollTrigger.update)` and `gsap.ticker.add(t => lenis.raf(t * 1000))`, then remove the provider's own rAF loop. Gate every timeline on `reducedMotion`.
- **Anime.js:** good for SVG stroke and morph micro-animations (e.g. drawing kanji brush strokes). Import inside `useEffect` and `revert()` on cleanup.
- **Lottie:** use `@lottiefiles/dotlottie-react`, lazy-loaded, with `autoplay={!reducedMotion}`.

Motion alone covers everything in the Hero and Codex, so these are left out to keep the bundle lean.

---

## 6. Audio

`lib/audio/engine.ts` synthesises every sound, so there are no files to fetch:

| Voice | Recipe |
|---|---|
| `hover` | 180 → 90 Hz sine blip, 50 ms, de-chattered at 70 ms |
| `click` | band-passed noise transient + 140 → 48 Hz thump (mechanical detent) |
| `open` | rising triangle + sine fifth |
| `shatter` | high-passed noise sweep + 4 inharmonic partials + sub drop |
| ambient hum | 55 / 55.6 Hz beating sines + 110 Hz triangle + band-passed noise, low-passed at 320 Hz |

Sound is **opt-in** (browser autoplay policy, and courtesy). It is never restored as "on" across visits. Everything runs through a compressor on the master bus.

---

## 7. Accessibility & performance checklist

- [x] Skip link; landmarks (`header`, `nav`, `main`, labelled `section`s)
- [x] `SplitReveal` exposes the full string via `aria-label`; glyph spans are `aria-hidden`
- [x] Each Codex card is a single `<button aria-haspopup="dialog">` with a descriptive label
- [x] Dialog: `role="dialog"`, `aria-modal`, labelled/described, focus moved in, Tab trapped, Esc closes, focus restored
- [x] Pinned rail: tabbing to an off-screen card scrolls the page to bring it into view
- [x] Stat bars are `role="meter"` with values
- [x] Toggles use `aria-pressed`; all hit targets ≥ 44 px
- [x] Text colours meet AA on obsidian (violet text uses `#A66CFF`)
- [x] Reduced motion from OS **or** toggle: no Lenis, no tilt or magnetism, no distortion, still particles, native Codex scroll
- [x] LCP image preloaded with blur placeholder; three.js deferred to idle; WebGL paused off-screen
- [x] Security headers in `next.config.ts` (nosniff, frame-deny, referrer, permissions, HSTS)

**Recommended next:** add a nonce-based CSP via `proxy.ts` (see `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`; the inline prefs script needs the nonce), and Lighthouse CI on Vercel previews.

---

## 8. Extending: Chapter 02 — The Arcs & Timeline

Suggested shape, reusing the same patterns:

- `content/arcs.ts`: `{ id, title, kanji, years, mood: { from, to, accent }, chapters[] }` for Substitute Shinigami → Soul Society → Arrancar → Thousand-Year Blood War.
- `components/arcs/ArcScroller.tsx`: a pinned section like `PinnedRail`. `useScroll` progress maps to the active arc. Animate a full-bleed background gradient between each arc's `mood` colours with `useTransform`, and send the accent to the reiatsu shader as a uniform (add `uAccent`).
- Parallax card reveals: `whileInView` plus per-card `useTransform(scrollYProgress, …)` at different depths.
- Reduced motion: render as a plain vertical list with static colour bands.

---

## 9. Run & deploy

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
```

**Vercel:** import the repo (framework preset auto-detects Next.js), no env vars needed. The page is static, so it's served from the edge. Images are optimised to AVIF/WebP at qualities 75/90 (allow-listed in `next.config.ts`, required in Next 16).

---

## 10. Content & IP note

This is an unofficial fan project. BLEACH © Tite Kubo / Shueisha, TV Tokyo, dentsu, Pierrot. Codex lore is written as original summaries. The hero art is the image supplied by the project owner. To add character art to the Codex, use images you have the right to use: put them in `src/assets/codex/`, import them in `content/characters.ts` via the `image` field, and render them in `CodexDialog`. Cards are intentionally typographic otherwise.
