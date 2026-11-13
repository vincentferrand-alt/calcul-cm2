// Synchronisation avec Firestore (API REST, sans SDK ni compilation).
// Principe absolu : on ne remplace JAMAIS une sauvegarde par une autre. On lit la copie distante, on FUSIONNE avec la copie locale
// (union des trophées / créatures, maximum des compteurs), on vérifie que rien n'a disparu, puis on écrit avec une précondition
// (updateTime) : si l'autre appareil a écrit entre-temps, on relit, on refusionne et on réessaie.
import { merge, migrate, missingFrom } from "./state.js";

export const COLLECTION = "profils";
export const MAX_BYTES = 900_000; // un document Firestore est limité à 1 Mio

export const syncConfigured = (cfg) => !!(cfg && cfg.projectId && cfg.apiKey);

export const stable = (x) => JSON.stringify(x, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((kk) => [kk, v[kk]])) : v));
const docUrl = (cfg, id) => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(cfg.projectId)}/databases/(default)/documents/${COLLECTION}/${id}`;

// Messages clairs (pour l'écran Réglages) : on dit ce qui ne va pas sans jargon inutile.
// Vrai message Firestore : base absente → « The database (default) does not exist for project … » ;
// document pas encore créé → « Document "projects/…/databases/(default)/documents/profils/… " not found. » (contient aussi « database » !)
const noDatabase = (msg) => /does not exist|datastore\/setup|create a database/i.test(msg) && !/^\s*Document\b/i.test(msg);
const errMsg = (body) => (body && body.error && body.error.message) || "";
export function explain(status, body) {
  const msg = (body && body.error && body.error.message) || "";
  if (status === 0) return "Pas de connexion pour le moment (la synchro reprendra toute seule).";
  if (status === 404 && noDatabase(msg)) return "La base Firestore n'existe pas encore : il faut la créer dans la console Firebase.";
  if (status === 403 && /disabled|not been used|API has not/i.test(msg)) return "L'API Firestore n'est pas activée pour ce projet Firebase.";
  if (status === 403) return "Accès refusé : vérifie les règles Firestore et la clé (docs/firebase.md).";
  if (status === 400 && /API key/i.test(msg)) return "La clé Firebase est refusée : vérifie apiKey et projectId.";
  if (status === 429) return "Trop de demandes pour l'instant : on réessaiera plus tard.";
  return `Erreur de synchronisation (${status}). ${msg}`.trim();
}

async function call(fetchFn, url, init) {
  let res;
  try { res = await fetchFn(url, init); } catch { return { status: 0, body: null }; }
  let body = null; try { body = await res.json(); } catch { /* pas de corps */ }
  return { status: res.status, body };
}

const isConflict = (r) => r.status === 409 || r.status === 412 || (r.status === 400 && r.body && r.body.error && /FAILED_PRECONDITION|ABORTED/.test(r.body.error.status || ""));

// Une synchronisation complète. Retourne { ok, merged, changedLocal, pushed } ou { ok:false, message, code }.
export async function syncOnce({ id, local, cfg, fetchFn = (...a) => globalThis.fetch(...a), now = () => new Date().toISOString() }) {
  if (!syncConfigured(cfg) || !id) return { ok: false, code: "off", message: "Synchronisation non activée." };
  const key = `key=${encodeURIComponent(cfg.apiKey)}`;
  const mine = migrate(local);
  for (let attempt = 0; attempt < 4; attempt++) {
    const got = await call(fetchFn, `${docUrl(cfg, id)}?${key}`, { method: "GET" });
    let remote = null, updateTime = null;
    if (got.status === 200) {
      try { remote = migrate(JSON.parse(got.body.fields.data.stringValue)); updateTime = got.body.updateTime; }
      catch { return { ok: false, code: "remote-unreadable", message: "La copie en ligne est illisible : rien n'a été modifié (ni ici, ni en ligne)." }; }
    } else if (!(got.status === 404 && !noDatabase(errMsg(got.body)))) {
      return { ok: false, code: "http-" + got.status, message: explain(got.status, got.body) };
    }
    const merged = remote ? merge(mine, remote) : mine;
    const lost = [...missingFrom(merged, mine), ...(remote ? missingFrom(merged, remote) : [])];
    if (lost.length) return { ok: false, code: "would-lose", message: "Sécurité : la fusion aurait fait perdre des éléments, rien n'a été modifié." };
    const json = stable(merged);
    const needPush = !remote || stable(remote) !== json;
    const changedLocal = stable(mine) !== json;
    if (!needPush) return { ok: true, merged, changedLocal, pushed: false };
    if (json.length > MAX_BYTES) return { ok: false, code: "too-big", message: "La sauvegarde est trop grosse pour être synchronisée." };
    const precond = remote ? `currentDocument.updateTime=${encodeURIComponent(updateTime)}` : "currentDocument.exists=false";
    const put = await call(fetchFn, `${docUrl(cfg, id)}?${key}&updateMask.fieldPaths=data&updateMask.fieldPaths=maj&${precond}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(merged) }, maj: { stringValue: now() } } }),
    });
    if (put.status === 200) return { ok: true, merged, changedLocal, pushed: true };
    if (isConflict(put)) continue; // l'autre appareil a écrit entre-temps : on relit et on refusionne
    return { ok: false, code: "http-" + put.status, message: explain(put.status, put.body) };
  }
  return { ok: false, code: "busy", message: "Les deux appareils écrivent en même temps : on réessaiera." };
}
