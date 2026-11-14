// Carnet de rêves (v0.14) : une carte souvenir par énigme du soir faite (la créature endormie dans le décor du jour, la date,
// le calcul de l'énigme). Les cartes viennent de eve[date] : la fusion des sauvegardes en fait l'union, aucune n'est jamais perdue.
// Les anciennes entrées (v0.12, sans créature ni décor) utilisent la créature compagnon et son décor actuel ; leur calcul
// est recalculé (même graine que l'énigme du soir). Logique pure, testée (tests/dreams.test.mjs).
import { creatureById } from "./creatures.js";
import { decorById, DEFAULT_BG } from "./decor.js";
import { scenePick } from "./shop.js";
import { eveningRiddle } from "./evening.js";
import { fmt } from "./generator.js";

const stageOf = (s, id) => (s.cre && s.cre[id] ? Number(s.cre[id].s) || 0 : 0);

export function dreamCards(s, fallbackId = "add") {
  const fb = creatureById(fallbackId) ? fallbackId : "add";
  return Object.keys(s.eve || {}).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse().map((date) => {
    const e = s.eve[date] || {};
    const legacy = !e.c || !creatureById(e.c);
    const c = legacy ? fb : e.c;
    const max = stageOf(s, c);
    let st, bg;
    if (legacy) { const p = max > 0 ? scenePick(s, c) : null; st = p ? p.st : 0; bg = p ? p.bg : DEFAULT_BG; }
    else { st = Math.max(0, Math.min(4, Number.isInteger(e.st) ? e.st : 0)); bg = decorById(e.bg) && decorById(e.bg).kind === "bg" ? e.bg : DEFAULT_BG; }
    let q = e.q, a = e.a, eq = e.eq;
    if (typeof q !== "string" || !Number.isFinite(a)) { const r = eveningRiddle(s, date, c).prob; q = r.q; a = r.a; eq = !!r.showEq; }
    return { date, c, st, bg, ok: !!e.ok, legacy, calc: eq ? `${q} = ${fmt(a)}` : `${q} : ${fmt(a)}` };
  });
}

// v0.15 : photos-souvenirs des courses (run = { "AAAA-MM-JJThh:mm": { c, st, bg, ok, n, fam } }). Données abîmées : valeurs sûres.
const RUN_KEY = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
export function runCards(s, fallbackId = "add") {
  const fb = creatureById(fallbackId) ? fallbackId : "add";
  return Object.keys(s.run || {}).filter((k) => RUN_KEY.test(k)).sort().reverse().map((key) => {
    const e = s.run[key] || {};
    const c = creatureById(e.c) ? e.c : fb;
    const st = Math.max(0, Math.min(4, Number.isInteger(e.st) ? e.st : 0));
    const bg = decorById(e.bg) && decorById(e.bg).kind === "bg" ? e.bg : DEFAULT_BG;
    const n = Math.max(0, Number(e.n) || 0), ok = Math.max(0, Math.min(n, Number(e.ok) || 0));
    const fam = e.fam === "mix" || !e.fam ? "mix" : String(e.fam);
    return { type: "run", key, date: key.slice(0, 10), hour: Number(key.slice(11, 13)), c, st, bg, ok, n, fam };
  });
}
// Le carnet mélange les soirs et les courses, du plus récent au plus ancien (un soir est rangé à 18 h, l'heure de l'énigme).
// filter : "all" | "eve" | "run".
export function memoryCards(s, fallbackId = "add", filter = "all") {
  const eve = filter === "run" ? [] : dreamCards(s, fallbackId).map((d) => ({ type: "eve", sort: d.date + "T18:00", ...d }));
  const run = filter === "eve" ? [] : runCards(s, fallbackId).map((r) => ({ sort: r.key, ...r }));
  return [...eve, ...run].sort((a, b) => (a.sort < b.sort ? 1 : a.sort > b.sort ? -1 : a.type < b.type ? -1 : 1));
}
