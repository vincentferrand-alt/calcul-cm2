// Pilote la synchronisation dans l'appli : quand la lancer, comment appliquer le résultat sans jamais écraser ce qui a été joué entre-temps.
import { store } from "./store.js";
import { FIREBASE } from "./firebase-config.js";
import { syncOnce, syncConfigured, stable } from "./sync.js";
import { merge } from "./state.js";
import { refreshState } from "./game.js";
import { toKey } from "./dates.js";
import { starsEarned } from "./shop.js";

export const sync = { state: syncConfigured(FIREBASE) ? "idle" : "off", at: null, message: "", news: null };
const listeners = new Set();
export const onSyncStatus = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((l) => l(sync));
let running = false, again = false, applying = false, timer = null, hook = null, chain = 0;
export const setSyncHook = (fn) => { hook = fn; }; // appelé quand l'état local a changé à cause de l'autre appareil

export const syncAvailable = () => syncConfigured(FIREBASE) && !!(store.profile && store.profile.id);

export async function runSync() {
  if (!syncAvailable()) { sync.state = syncConfigured(FIREBASE) ? "noprofile" : "off"; emit(); return sync; }
  if (running) { again = true; return sync; }
  running = true; sync.state = "syncing"; emit();
  try {
    const r = await syncOnce({ id: store.profile.id, local: store.state, cfg: FIREBASE });
    if (!r.ok) { sync.state = r.code === "off" ? "off" : "error"; sync.message = r.message; }
    else {
      sync.state = "ok"; sync.message = ""; sync.at = new Date();
      // On fusionne avec l'état ACTUEL (le joueur a pu répondre pendant la synchro) : rien ne se perd.
      const next = merge(store.state, r.merged);
      if (stable(next) !== stable(store.state)) {
        let news = null; applying = true;
        const starsBefore = starsEarned(store.state);
        try { store.replaceState(next); store.update((s) => { news = refreshState(s, toKey()); }); } finally { applying = false; }
        news.stars = Math.max(0, starsEarned(store.state) - starsBefore); // étoiles gagnées sur l'autre appareil
        if (r.changedLocal) { sync.news = news; if (hook) hook(news); }
      }
      // du nouveau localement : on repousse (au plus 3 fois d'affilée, pour ne jamais tourner en boucle)
      if (stable(store.state) !== stable(r.merged) && chain < 3) { again = true; chain++; } else if (stable(store.state) === stable(r.merged)) chain = 0;
    }
  } catch (e) { sync.state = "error"; sync.message = "Erreur inattendue : " + (e && e.message ? e.message : e); }
  running = false; emit();
  if (again) { again = false; syncSoon(2000); }
  return sync;
}

export function syncSoon(ms = 10000) {
  if (!syncAvailable()) return;
  clearTimeout(timer); timer = setTimeout(runSync, ms);
}

export function startSyncing() {
  if (!syncAvailable()) return;
  runSync();
  store.onChange(() => { if (!applying) syncSoon(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") runSync(); else syncSoon(500); });
  addEventListener("online", () => syncSoon(500));
}
