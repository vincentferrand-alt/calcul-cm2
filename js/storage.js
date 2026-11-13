// Stockage local (navigateur). Le service worker ne touche jamais à ces clés.
// Sécurité en profondeur : à chaque lecture on FUSIONNE l'état principal, la copie précédente et les instantanés
// quotidiens ; comme merge() ne perd rien, un bug d'écriture ou une copie abîmée ne peut pas faire disparaître un trophée.
import { emptyState, migrate, merge } from "./state.js";
import { toKey } from "./dates.js";

export const KEY = "ccm2:state";
export const BAK = "ccm2:state:bak";
export const SNAP = "ccm2:snap:";
const PROFILE = "ccm2:profile";
const SETTINGS = "ccm2:settings";
const SNAPS_KEPT = 5;

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const ls0 = () => globalThis.localStorage;

function readJSON(ls, key) {
  const raw = ls.getItem(key);
  if (raw == null) return null;
  try { const o = JSON.parse(raw); return isObj(o) ? o : null; }
  catch { try { ls.setItem(`ccm2:corrupt:${Date.now()}`, raw); } catch { /* quota */ } return null; } // on garde la copie abîmée pour pouvoir la réparer
}

export function loadState(ls = ls0()) {
  const snapKeys = [];
  for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.startsWith(SNAP)) snapKeys.push(k); }
  const parts = [KEY, BAK, ...snapKeys.sort()].map((k) => readJSON(ls, k)).filter(Boolean);
  return parts.length ? parts.map(migrate).reduce((acc, p) => merge(acc, p)) : emptyState();
}

export function saveState(state, ls = ls0(), day = toKey()) {
  try {
    const prev = ls.getItem(KEY);
    if (prev) { try { JSON.parse(prev); ls.setItem(BAK, prev); } catch { /* copie principale abîmée : on garde l'ancienne sauvegarde */ } }
    const json = JSON.stringify(state);
    ls.setItem(KEY, json);
    if (!ls.getItem(SNAP + day)) { // un instantané par jour, 5 conservés
      ls.setItem(SNAP + day, json);
      const snaps = []; for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.startsWith(SNAP)) snaps.push(k); }
      snaps.sort().slice(0, Math.max(0, snaps.length - SNAPS_KEPT)).forEach((k) => ls.removeItem(k));
    }
    return true;
  } catch { return false; } // stockage plein ou interdit : l'appli continue en mémoire
}

// Profil de l'appareil : prénom + empreinte du code (jamais le code lui-même). Reste sur l'appareil.
export const loadProfile = (ls = ls0()) => readJSON(ls, PROFILE);
export const saveProfile = (p, ls = ls0()) => { try { ls.setItem(PROFILE, JSON.stringify(p)); return true; } catch { return false; } };

export const DEFAULT_SETTINGS = { muted: false, rate: 0.9, readAloud: false, answer: "qcm" };
export const loadSettings = (ls = ls0()) => ({ ...DEFAULT_SETTINGS, ...(readJSON(ls, SETTINGS) || {}) });
export const saveSettings = (s, ls = ls0()) => { try { ls.setItem(SETTINGS, JSON.stringify(s)); } catch { /* ignore */ } };

export async function demanderStockagePersistant() {
  try { return !!(navigator.storage && navigator.storage.persist && (await navigator.storage.persist())); } catch { return false; }
}
