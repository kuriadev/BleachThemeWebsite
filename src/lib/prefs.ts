/**
 * Tiny external store for user experience preferences.
 * Read with `useSyncExternalStore` so server HTML and hydration agree
 * (server snapshot = defaults), then the client snaps to stored values.
 */
export type MotionPref = "auto" | "reduced";
export interface Prefs {
  /**
   * Reiatsu ambience. Remembered, but never auto-plays: a returning visitor
   * who left it on hears it again only after their first click or key press.
   */
  ambient: boolean;
  /** UI click / hover / chime effects. Only ever sound after a user gesture. */
  sfx: boolean;
  motion: MotionPref;
}

export const PREFS_KEY = "bleach:prefs";
const DEFAULTS: Prefs = { ambient: false, sfx: false, motion: "auto" };

let current: Prefs = DEFAULTS;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): Prefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      ambient: parsed.ambient === true,
      sfx: parsed.sfx === true,
      motion: parsed.motion === "reduced" ? "reduced" : "auto",
    };
  } catch {
    return DEFAULTS;
  }
}

export const prefsStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getSnapshot(): Prefs {
    if (!hydrated) {
      current = read();
      hydrated = true;
    }
    return current;
  },
  getServerSnapshot(): Prefs {
    return DEFAULTS;
  },
  set(patch: Partial<Prefs>) {
    current = { ...current, ...patch };
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify({ motion: current.motion, sfx: current.sfx, ambient: current.ambient }));
    } catch {
      /* storage unavailable (private mode) — keep in-memory value */
    }
    listeners.forEach((l) => l());
  },
};

/**
 * Runs synchronously in <head> before first paint so CSS-driven motion is
 * already correct and nothing animates before React hydrates.
 */
export const prefsInitScript = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFS_KEY,
)})||"{}");if(p.motion==="reduced")document.documentElement.dataset.motion="reduced";}catch(e){}})();`;
