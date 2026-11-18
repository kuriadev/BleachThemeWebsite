# Soul Society Soundscape · Audio guide

Every cue on the site is **synthesised in the browser** (Web Audio API), so it plays with zero latency, needs no downloads and carries no licensing risk. Recorded samples are an optional layer on top: drop a file in `public/audio/`, point `src/lib/audio/samples.ts` at it, and the engine preloads it on mount and uses it. If a file is missing, blocked or undecodable, that cue silently falls back to its synth voice.

## Cues

| Cue | Hook call | Where it's wired | Synth recipe |
|---|---|---|---|
| Zanpakutō unsheathe | `playZanpakutoSlash()` | hover on "Shatter Kyōka Suigetsu", "Release seal", opening a Codex card or gallery plate, switching Sound on | grainy steel scrape (band-passed noise 1.2 → 7.2 kHz, chopped at 38 Hz) then a struck-steel ring of five detuned inharmonic partials |
| Hollow echo | `playHollowAmbience()` | hover on Reiatsu IV–V (crimson) dossiers | waveshaped sawtooth gliding 118 → 72 Hz through a closing vowel formant (aah → ooh) into a dark feedback echo; ~-30 dBFS, rate-limited to once per 1.4 s |
| Shunpo / Kidō | `playFlashStep()` | archive filter tabs, nav links, mobile drawer links, "Enter Soul Society" | whoosh (noise band-pass 380 → 5,200 → 900 Hz) panned across the stereo field + a short shimmering 880/1,320 Hz hum |
| Liquid-glass click | `playGlassClick()` | dock toggles, Ink-Wash toggle, lightbox controls, closing dialogs | 2 ms bright tick + tiny glassy ping + heavy 125 → 52 Hz thump |
| Mirror shatter | `playShatter()` | the hero shatter | bright noise sweep + inharmonic glass partials + sub drop |
| Reiatsu ambience | `toggleBackgroundReiatsu()` | "Reiatsu" toggle in the dock | 55 / 55.6 Hz beating drone + slowly gusting wind (LFO-swept band-pass noise) + a distant temple bell every 9–18 s, all low-passed at 1.6 kHz |

Sounds pan toward where you hovered or clicked (the event's `clientX`).

## Behaviour & safety

- **Muted by default.** Nothing is created until the visitor presses **Sound** (UI cues) or **Reiatsu** (ambience) in the dock. The Sound button shows a small pulsing dot while it's off.
- **Remembered.** Both choices persist in `localStorage` (`bleach:prefs`). A remembered ambience never starts on load; it resumes on the visitor's first click or key press.
- **No autoplay warnings.** The `AudioContext` is only created on a gesture. Sample *bytes* are fetched on mount; decoding happens when the context exists.
- **Rate limits** per cue (hover 70 ms, flash step 120 ms, unsheathe 250 ms, hollow 1.4 s) stop hover-heavy layouts from machine-gunning.
- Everything goes through a compressor on the master bus. Master volume: `useBleachAudio().setVolume(0…1)` (default 0.7).

## The hook

```tsx
import { useBleachAudio } from "@/hooks/useBleachAudio";

const sound = useBleachAudio();
sound.playZanpakutoSlash(e);   // also exported as playZanpakutōSlash
sound.playHollowAmbience(e);
sound.playFlashStep(e);
sound.playGlassClick(e);
sound.toggleBackgroundReiatsu();
sound.toggleSoundscape();
sound.setVolume(0.5);
```

`useSoundFX()` is the lower-level version (`play(voice, e)` and `bind({ hover, press })` to spread handlers onto any element). Both are thin wrappers over `src/lib/audio/engine.ts`.

### Wiring examples (as in the code)

```tsx
// Hero CTA: unsheathe on hover; the click plays the shatter itself.
<MagneticButton hoverVoice="unsheathe" pressVoice={null} onClick={() => shatter()}>
  Shatter Kyōka Suigetsu
</MagneticButton>

// Archive / gallery filter tabs
<button aria-pressed={active} onClick={(e) => { sound.playFlashStep(e); setFilter(id); }}>…</button>

// Ink-Wash toggle and other minor controls
<button aria-pressed={ink} onClick={(e) => { sound.playGlassClick(e); setMode("ink"); }}>Ink-Wash</button>

// Dock: the global switches
const { toggleSoundscape, toggleBackgroundReiatsu, enabled, ambient } = useBleachAudio();
<button aria-pressed={enabled} onClick={toggleSoundscape}>Sound</button>
<button aria-pressed={ambient} onClick={toggleBackgroundReiatsu}>Reiatsu</button>
```

## Adding recorded samples (optional)

1. Find a sound **you're allowed to redistribute**. Good places, with the licence filter set:
   - **Freesound** (freesound.org): filter *License → Creative Commons 0*. Useful searches: "sword unsheath", "katana draw", "metal ring", "whoosh fast", "swish", "glass tap", "wind ambience loop", "temple bell".
   - **OpenGameArt** (opengameart.org): filter *License → CC0*.
   - **Sonniss GDC bundles** (sonniss.com/gameaudiogdc): royalty-free for commercial use, no attribution.
   Check the licence on each sound's own page and keep a note of the URL and licence in `public/audio/CREDITS.md`. CC-BY sounds are fine too, but then that file must credit the author on the site.
2. **Don't use audio ripped from the anime or games**, and don't hotlink: CDN URLs disappear, change licence or add latency. Self-host.
3. Trim to the hit (unsheathe < 0.8 s, click < 0.1 s, flash step < 0.4 s), normalise to about -3 dBFS, and export **MP3 128–160 kbps** (or Opus/WebM, with an MP3 fallback for older Safari). Ambience loops: 20–40 s, seamless, -18 dBFS.
4. Save as one of these and set the matching `src` in `src/lib/audio/samples.ts`:

| File | Cue | Mode |
|---|---|---|
| `public/audio/blade-unsheathe.mp3` | unsheathe | `layer` (sample + synth steel ring) |
| `public/audio/hollow-echo.mp3` | hollow | `replace` (keep `gain` ≤ 0.25) |
| `public/audio/flash-step.mp3` | flashstep | `layer` |
| `public/audio/glass-click.mp3` | glass | `replace` |
| `public/audio/reiatsu-ambience.mp3` | ambience bed | mixed under the drone |

That's it: the provider preloads them on mount, and the engine prefers the sample whenever it decoded.
