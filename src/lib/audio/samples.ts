/**
 * Optional recorded samples, layered over (or replacing) the synth voices.
 *
 * Every entry is OFF until you drop a licence-checked file into
 * /public/audio and set `src`. Self-host them: hotlinked CDN audio can
 * vanish, change licence or be slow, and the synth fallback means the site
 * never needs them. See docs/AUDIO.md for where to find CC0 sounds.
 *
 * `mode`:
 *   "replace" – play the sample instead of the synth voice
 *   "layer"   – play the sample *and* the synth (e.g. a recorded scrape +
 *               the synthesised steel ring)
 */
import type { Voice } from "./engine";

export interface SampleSpec {
  src?: string;
  gain: number;
  mode: "replace" | "layer";
}

export const samples: Partial<Record<Voice, SampleSpec>> = {
  unsheathe: { src: undefined /* "/audio/blade-unsheathe.mp3" */, gain: 0.6, mode: "layer" },
  hollow: { src: undefined /* "/audio/hollow-echo.mp3" */, gain: 0.25, mode: "replace" },
  flashstep: { src: undefined /* "/audio/flash-step.mp3" */, gain: 0.5, mode: "layer" },
  glass: { src: undefined /* "/audio/glass-click.mp3" */, gain: 0.6, mode: "replace" },
};

/** Optional recorded ambience loop (wind / temple), mixed under the drone. */
export const ambienceLoop: { src?: string; gain: number } = {
  src: undefined /* "/audio/reiatsu-ambience.mp3" */,
  gain: 0.35,
};
