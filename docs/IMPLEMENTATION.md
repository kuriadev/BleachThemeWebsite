# KYŌKA // ARCHIVE · Implementation Guide

An unofficial, gallery-grade Bleach fan archive built around Sōsuke Aizen. This doc covers the architecture, the design tokens, each section, how the WebGL layer and motion libraries are wired, how to add your own art and projects, and how to run it.

**Stack (as built):** Next.js 16 App Router (Turbopack) · React 19 · Tailwind CSS v4 + CSS Modules · Motion 12 (`motion/react`, formerly Framer Motion) · Anime.js 4 (SVG seal draw) · three.js (raw, no R3F) · Lenis · Web Audio API (procedural, no audio files).

---

## 1. Folder structure

```
bleach-site/
├─ docs/IMPLEMENTATION.md            ← this file
├─ next.config.ts                    ← images, security headers, Tailwind loader (globals.css only)
├─ public/
│  └─ images/
│     ├─ hero-aizen.png              ← supplied hero art, 1672×941 (statically imported → blur placeholder)
│     └─ aizen-portrait.png          ← supplied circular portrait (gallery plate + icon source)
│  ├─ audio/                         ← optional licensed samples (see docs/AUDIO.md)
│  (add public/video/ for dossier hover previews)
├─ src/
│  ├─ app/
│  │  ├─ favicon.ico, icon.png, apple-icon.png ← site icons (file conventions)
│  │  ├─ layout.tsx                  ← fonts, pre-paint prefs script, providers, floating navbar
│  │  ├─ page.tsx                    ← Server Component: Hero → Gallery → Poem → Archive → Codex
│  │  └─ globals.css                 ← DESIGN TOKENS (Tailwind v4 @theme = the config)
│  ├─ components/
│  │  ├─ layout/TopBar.tsx           ← "Soul Society OS" dock: nav, toggles, hamburger + glass drawer (< lg)
│  │  ├─ hero/
│  │  │  ├─ Hero.tsx                 ← radial mask, parallax, glass shards, ripple, shatter, CTAs
│  │  │  └─ ShatterImage.tsx         ← <Image> for LCP; swaps to clip-path shards on shatter
│  │  ├─ gallery/                    ← JET // Editorial
│  │  │  ├─ GallerySection.tsx       ← Server shell (heading)
│  │  │  ├─ Gallery.tsx              ← drag/inertia track, depth tilt, colour ↔ ink toggle
│  │  │  ├─ Gallery.module.css       ← track, tilt, hover distortion, ink-wash (CSS Module)
│  │  │  ├─ GalleryFilters.tsx       ← SVG filters: #gallery-ripple, #ink-wash
│  │  │  ├─ InkPlaceholder.tsx       ← original ink composition for empty slots
│  │  │  └─ Lightbox.tsx             ← glass dialog, ← → navigation
│  │  ├─ archive/                    ← SRDI Experimental Archives
│  │  │  ├─ ArchiveSection.tsx       ← Server shell (heading)
│  │  │  ├─ Archive.tsx              ← category filters + animated grid
│  │  │  ├─ DossierCard.tsx          ← threat badge, Kidō tags, hover video/scanline preview
│  │  │  ├─ SealDrawer.tsx           ← "Release Seal" drawer / bottom sheet, Anime.js seal draw
│  │  │  ├─ badges.tsx, kido.ts      ← ThreatBadge, KidoTag, level + school metadata
│  │  ├─ poem/
│  │  │  ├─ VolumePoem.tsx           ← "The Soul's Monologue" interlude (Server)
│  │  │  └─ InkLines.tsx             ← scroll-linked per-word ink reveal
│  │  ├─ codex/                      ← Zanpakutō Codex
│  │  │  ├─ Codex.tsx                ← Server Component: heading + data
│  │  │  ├─ CodexGlow.tsx            ← section light that follows the active card's accent
│  │  │  ├─ CodexRail.tsx            ← pinned horizontal scroll (desktop) / native snap row
│  │  │  ├─ CodexCard.tsx            ← liquid-glass card, pointer light, 3D tilt
│  │  │  ├─ CodexDialog.tsx          ← lore, release, ability meters
│  │  │  └─ accent.ts                ← accent → glow / AA-safe text colour
│  │  ├─ ui/MagneticButton.tsx, SplitReveal.tsx
│  │  └─ webgl/ReiatsuCanvas.tsx, ReiatsuField.tsx  ← three.js points + custom shaders
│  ├─ hooks/
│  │  ├─ useBleachAudio.ts           ← named Soul Society cues + soundscape toggles
│  │  └─ useSoundFX.ts               ← low-level play / bind, stereo pan from the pointer
│  ├─ content/                       ← all copy & data (swap for a CMS later)
│  │  ├─ gallery.ts                  ← gallery plates
│  │  ├─ projects.ts                 ← SRDI dossiers
│  │  ├─ characters.ts               ← Codex
│  │  └─ poem.ts                     ← interlude verse (original)
│  ├─ lib/
│  │  ├─ tokens.ts                   ← JS mirror of tokens (eases, springs, colours)
│  │  ├─ prefs.ts                    ← ambient / sfx / motion store + pre-paint init script
│  │  ├─ a11y/useDialog.ts           ← focus trap, Esc, scroll lock, focus restore
│  │  ├─ audio/engine.ts             ← Web Audio engine: synth voices, buses, ambience
│  │  ├─ audio/samples.ts            ← optional self-hosted samples (off by default)
│  │  └─ motion/shards.ts, useMediaQuery.ts
│  └─ providers/ExperienceProvider.tsx ← prefs + Lenis + MotionConfig + audio sync
```

**Shaders** live inline in `webgl/ReiatsuField.tsx` (one small vertex + fragment pair). If you add more, move them to `src/components/webgl/shaders/*.glsl.ts` as exported template strings.

### Server / Client split

| Boundary | Why |
|---|---|
| `page.tsx`, `*Section.tsx`, `Codex.tsx`, `VolumePoem.tsx` are Server Components | Headings, copy and data render to HTML with zero JS. |
| `Hero`, `Gallery`, `Archive`, `CodexRail`, `InkLines`, dialogs, TopBar are Client Components | They need pointer, scroll and audio APIs. |
| `ReiatsuField` loads via `next/dynamic({ ssr: false })` after `requestIdleCallback` | three.js never blocks LCP or hydration. |
| Anime.js is `import()`ed inside the drawer effect | It only downloads when someone releases a seal. |

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

### Token reference (brief names → classes)

| Token | Value | Use |
|---|---|---|
| `bankai-cyan` (`bankai`) | `#00F0FF` | rare energy highlights, focus ring |
| `hollow-crimson` (`hollow`) | `#FF1E42` | threat states, critical alerts |
| `kyoka-violet` (`hogyoku`) | `#7B2CBF` | Aizen's aura |
| `kyoka-deep` | `#3B0764` | bottom stop of the velvet aura |
| `aura-kyoka` utility | violet → `#3B0764` radial + faint cyan | hero bloom |
| `reiatsu-smoke` utility | radial + conic haze, `blur(var(--blur-aura))` | bleeds across every section seam |
| `--blur-glass / --blur-dock / --blur-aura` | 18 / 24 / 64 px | glass panels, nav dock, auras |
| `text-display`, `text-h2`, `text-lede`, `text-eyebrow` | `clamp()` | fluid type from 320 px to 2560 px; `text-display` also caps by `svh` so short phones keep the face clear |

**Why there is no `tailwind.config.ts`:** Tailwind v4 reads its theme from CSS, so the `@theme` block in `globals.css` *is* the config (every `--color-*`, `--text-*`, `--blur-*`, `--ease-*` and `--animate-*` becomes a utility). A JS config would only duplicate it. JS-side mirrors (eases, springs) live in `src/lib/tokens.ts`. Vanilla Extract was considered and left out: Tailwind + CSS Modules already cover every style here, and a third styling system would add build cost without adding capability.

### Navigation dock

A floating `glass` pill, fixed and centred (`max-w-[1100px]`). At `lg` and up it shows section links; below `lg` a hamburger (two lines that rotate into an ×) opens a glass drawer under the dock. The drawer has `aria-expanded` / `aria-controls`, staggered items, 56 px rows, Esc to close with focus returned to the button, and it closes on link tap or when the viewport grows past `lg`.

### useSoundFX

```tsx
const fx = useSoundFX();
<button {...fx.bind({ hover: "hover", press: "unsheathe" })} onClick={open}>Release seal</button>
fx.play("click");
```

`bind` returns pointer/keyboard handlers to spread, so they never clash with your own `onClick`. Hover sounds only fire for a mouse (touch has no hover). Everything is silent until SFX is switched on in the dock. Voices: `click`, `hover`, `open`, `unsheathe`, `shatter`.

---

## 3. The Hero: how the layers work

Depth stack (back → front), each driven by one spring-smoothed pointer value through the `<Layer depth>` helper:

1. **L0** — violet bloom + vertical `鏡花水月` watermark (depth 0.15)
2. **L1** — WebGL reiatsu particles (own pointer repulsion in the shader)
3. **L2** — the Aizen art (depth 0.45) + scroll-linked sink/scale
4. **L3** — three liquid-glass mirror shards on the flanks (depth 1.1, `backdrop-filter` refraction)
5. **L4** — typography + CTAs (scroll-linked lift & fade)

**Composition of the supplied art (1672×941).** The art is full-bleed: it covers the viewport, anchored to its top edge so his face stays in frame on every aspect ratio. The frame starts just below the top bar and overscans the sides and bottom, so pointer parallax never reveals an edge. A soft vignette plus top and bottom fades melt it into obsidian. The headline sits low-left over the flames, never over the face.

**Icons.** `src/app/favicon.ico` (16–64 px), `icon.png` (256 px, circular, transparent corners) and `apple-icon.png` (180 px, opaque) are generated from the supplied circular portrait. Next's file conventions emit the `<link>` tags automatically.

**Radial mask.** The art sits under an intersected mask (a radial ellipse × a vertical linear fade), so it dissolves into the void on every side instead of ending in a hard edge.

**Water ripple.** A click on the art spawns three expanding rings at the pointer (Motion, ~1 s) right before the shatter, so the surface reads as water first and glass second. Skipped under reduced motion.

**Kyōka Suigetsu distortion.** An SVG `feTurbulence` → `feDisplacementMap` filter. Pointer *velocity* over the art feeds a decaying value written straight to the filter's `scale` attribute in rAF (no React re-render per frame). The filter is only attached while scale > 0.4, so idle cost is zero. It's disabled for touch and reduced motion.

**Shatter.** `ShatterImage` renders one optimised `<Image preload fetchPriority="high">` for LCP. On "Shatter Kyōka Suigetsu" (or a click on the art, which sets the impact point), it swaps to 70 `clip-path` triangles from `lib/motion/shards.ts`. Shards fly outward, with more force near the impact, then reassemble 1.5 s later (the illusion was never broken). The same event fires `reiatsu:burst` so the particle field blows outward in sync, and the audio engine plays a synthesised glass break. Under reduced motion it becomes a brief cross-fade.

---

### Mobile framing

The art is anchored with `FOCAL = "50% 0%"` in `Hero.tsx` (used for both the `<Image>` `objectPosition` and the shard backgrounds, so they always line up). On a 390 px phone that keeps his face centred under the floating navbar. To retune:

- Move the face horizontally: change the first value (e.g. `"46% 0%"`).
- More headroom under the navbar: raise the frame's `top-[3%] md:top-[5%]`.
- Headline collides with the art on short screens: the text block is bottom-aligned, so lower its `clamp()` font size in `globals.css` (`--text-display`) rather than moving the art.

---

## 3a. Spatial Gallery — JET // Editorial

- **Track:** a native horizontal scroller (`overflow-x: auto` + scroll snap), so touch, trackpad, keyboard (← →, focus the track) and screen readers work by default. Mouse drag is layered on top with pointer capture and inertia (glide 0.94); clicks are suppressed after a real drag.
- **Depth:** on scroll, each plate gets `--tilt` and `--depth` from its distance to the viewport centre (rAF-throttled), and the CSS Module applies `rotateY` / `translateZ`.
- **Hover distortion:** `.media:hover { filter: url(#gallery-ripple) }` — an SMIL-animated `feTurbulence` → `feDisplacementMap`. No JS per frame.
- **Ink-Wash mode:** `url(#ink-wash)` = luminance matrix → contrast table → discrete posterise to 4 tones, with a paper-grain overlay. It's applied to the whole track and the lightbox.
- **Lightbox:** glass dialog via `useDialog`; ← → change plate, Esc closes, focus returns to the plate.
- **Why CSS Modules here:** the gallery has nested state selectors (`.ink .item:hover .media`) and reduced-motion overrides that read better as plain CSS than as utility strings. Tailwind still handles layout.

**Adding your art:** drop files in `public/images/gallery/`, then in `src/content/gallery.ts` replace a placeholder slot:

```ts
import plate3 from "../../public/images/gallery/plate-03.jpg";
{ id: "slot-03", title: "Your title", kanji: "斬", medium: "Ink on paper", caption: "…",
  tone: "hollow", shape: "portrait", image: plate3, alt: "Describe the image" }
```

Static imports give you width/height and a blur placeholder for free. Only use art you have the right to publish.

---

## 3b. SRDI Experimental Archives

- **Data:** `src/content/projects.ts`. Each `Project` has a `threat` (1–5 → Dormant … Catastrophic), `category` (filters), `stack` tags with a Kidō school (`hado` = what users see, `bakudo` = what binds it, `kaido` = what keeps it healthy), `links.live` / `links.repo`, and an optional `preview.image` / `preview.video`.
- **Filters:** `aria-pressed` buttons; the grid animates with Motion `layout` + `AnimatePresence mode="popLayout"`, and a polite status line announces the count.
- **Hover preview:** if `preview.video` is set (put a short muted MP4/WebM in `public/video/`), it plays on hover/focus and rewinds on leave. Otherwise the still un-greys with a scanline sweep.
- **Release Seal drawer:** side drawer on ≥ 768 px, bottom sheet on phones. Built on `useDialog` (focus trap, Esc, scroll lock, focus restore). Links open in a new tab with `rel="noopener noreferrer"`.
- **Anime.js:** the seal glyph's strokes are drawn with `svg.createDrawable(...)` + `animate(..., { draw: ["0 0", "0 1"], delay: stagger(140) })`. The module is dynamically imported in the effect and `revert()`ed on close; under reduced motion it's skipped and the seal renders fully drawn.

**Adding a project:** copy an entry in `projects.ts`, give it a new `id` and `fileNo`, remove `sample: true`, and fill in the links. Delete the three sample dossiers when you have real ones.

---

## 3c. Interlude — The Soul's Monologue

`content/poem.ts` holds the verse; `InkLines` maps the section's scroll progress across every word so each one bleeds from blurred and faint to sharp ghost-white as you scroll. Reduced motion renders it fully inked. The verse is **original** — Kubo's volume poems are copyrighted, so write your own if you change it.

## 3d. Codex ambient glow

Each card carries `data-accent`. `CodexGlow` listens (delegated) for pointer and focus inside the section and cross-fades one of four pre-rendered radial light layers, so hovering Ichigo washes the section red, Aizen violet, and so on. Opacity-only transitions keep it on the compositor.

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
- **Anime.js (in use):** the Release Seal stroke draw. Pattern: `import("animejs")` inside `useEffect`, keep the returned animation, `revert()` on cleanup, skip when `reducedMotion`.
- **Lottie (optional, not installed):** use `@lottiefiles/dotlottie-react`, lazy-loaded, with `autoplay={!reducedMotion}` and `loop={false}`. A good fit for a brush-stroke loader or an animated seal if you'd rather author it in After Effects.

Motion covers everything else, so GSAP and Lottie are left out to keep the bundle lean.

---

## 6. Audio

The full sound design (cues, hook API, wiring, and how to add licensed samples) lives in [`AUDIO.md`](AUDIO.md). In short: `src/lib/audio/engine.ts` synthesises every cue (Zanpakutō unsheathe, hollow echo, shunpo whoosh, glass click, shatter, and a reiatsu drone with wind and temple bells), `samples.ts` optionally layers self-hosted recordings over them, and `useBleachAudio` / `useSoundFX` expose it to components. Sound is muted by default, both switches are remembered, and nothing plays before a user gesture.

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

## 8. Extending: The Arcs & Timeline

Suggested shape, reusing the same patterns:

- `content/arcs.ts`: `{ id, title, kanji, years, mood: { from, to, accent }, chapters[] }` for Substitute Shinigami → Soul Society → Arrancar → Thousand-Year Blood War.
- `components/arcs/ArcScroller.tsx`: a pinned section like `PinnedRail`. `useScroll` progress maps to the active arc. Animate a full-bleed background gradient between each arc's `mood` colours with `useTransform`, and send the accent to the reiatsu shader as a uniform (add `uAccent`).
- Parallax card reveals: `whileInView` plus per-card `useTransform(scrollYProgress, …)` at different depths.
- Reduced motion: render as a plain vertical list with static colour bands.

---

## 9. Local setup, run & deploy

Requirements: Node 20.9+ (22 LTS recommended), npm 10+.

```bash
git clone https://github.com/kuriadev/BleachThemeWebsite.git
cd BleachThemeWebsite
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
npx tsc --noEmit   # after a build (it generates next-env.d.ts)
```

**Testing responsiveness and touch targets:**

1. Chrome DevTools → device toolbar. Check at least 320×568 (iPhone SE 1st gen), 390×844, 430×932 (Pro Max), 768×1024, 1024×768, 1440×900 and 2560×1440. There should be no horizontal scroll at any width (`document.documentElement.scrollWidth === innerWidth`).
2. Turn on "Show rulers" and confirm every control is at least 44×44 px (dock buttons are `size-11`, drawer rows 56 px).
3. On a real phone, swipe the gallery and the Codex row, open a dossier (it becomes a bottom sheet) and the lightbox, and check that rotating the device keeps his face in frame.
4. Emulate `prefers-reduced-motion: reduce` (Rendering panel) and use the Motion toggle: no smooth scroll, tilt, ripple or ink-in, and everything stays readable.
5. Keyboard only: Tab through the dock, gallery (← →), filters, drawer and Codex; Esc closes every overlay and focus returns where it was.

**Compiling for Vercel:** `npm run build` must finish with `○ /` (static). Push to `main` (or merge a PR) and Vercel builds automatically; preview deployments are created for other branches.

**WebGL locally:** works in any modern browser. If particles don't appear, check `chrome://gpu` (hardware acceleration must be on); the CSS bloom is the fallback, so the page still looks right.

**Vercel:** import the repo (framework preset auto-detects Next.js), no env vars needed. The page is static, so it's served from the edge. Images are optimised to AVIF/WebP at qualities 75/90 (allow-listed in `next.config.ts`, required in Next 16).

---

## 10. Content & IP note

This is an unofficial fan project. BLEACH © Tite Kubo / Shueisha, TV Tokyo, dentsu, Pierrot. Codex lore is written as original summaries. The hero art and portrait are images supplied by the project owner; gallery placeholders are original abstract ink compositions, and the interlude verse is original. To add character art to the Codex, use images you have the right to use: put them in `public/images/codex/`, import them in `content/characters.ts` via the `image` field, and render them in `CodexDialog`. Cards are intentionally typographic otherwise.
