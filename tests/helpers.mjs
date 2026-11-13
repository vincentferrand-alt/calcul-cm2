// Outils de test : analyseur de nombres français, évaluateur d'égalités, analyseur de phrases dictées.
const VAL = { zéro: 0, un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60 };

export function parseFr(words) {
  const tok = words.split(/[\s-]+/).filter((t) => t && t !== "et");
  let total = 0, cur = 0;
  for (let i = 0; i < tok.length; i++) {
    const t = tok[i];
    if (t === "quatre" && /^vingts?$/.test(tok[i + 1] || "")) { cur += 80; i++; continue; }
    if (t === "cent" || t === "cents") { cur = (cur || 1) * 100; continue; }
    if (t === "mille") { total += (cur || 1) * 1000; cur = 0; continue; }
    if (!(t in VAL)) throw new Error("mot inconnu : " + t);
    cur += VAL[t];
  }
  return total + cur;
}

// Vérifie une égalité du type "47 + 40 = 87" ou "10 × 42 = 420 ; 2 × 42 = 84" (chaque segment séparé par « ; »).
export function checkEq(eq) {
  const clean = eq.replace(/ /g, "");
  for (const seg of clean.split(" ; ")) {
    const parts = seg.split(" = ");
    if (parts.length !== 2) throw new Error("égalité mal formée : " + eq);
    const expr = parts[0].replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
    if (!/^[\d\s+\-*/()]+$/.test(expr)) throw new Error("caractère inattendu dans : " + eq);
    const left = Function(`"use strict"; return (${expr})`)();
    if (left !== Number(parts[1])) throw new Error(`égalité fausse : ${eq} (calculé ${left})`);
  }
  return true;
}

// Relit une phrase dictée et en déduit la réponse attendue.
export function answerFromSay(say) {
  let m;
  const N = "([a-zéèêàç\\s-]+?)";
  if ((m = say.match(new RegExp(`^combien pour aller de ${N} à ${N}$`)))) return parseFr(m[2]) - parseFr(m[1]);
  if ((m = say.match(new RegExp(`^combien fois ${N} égale ${N}$`)))) return parseFr(m[2]) / parseFr(m[1]);
  if ((m = say.match(new RegExp(`^${N} fois combien égale ${N}$`)))) return parseFr(m[2]) / parseFr(m[1]);
  if ((m = say.match(new RegExp(`^${N} divisé par ${N}$`)))) return parseFr(m[1]) / parseFr(m[2]);
  if ((m = say.match(new RegExp(`^${N} plus ${N}$`)))) return parseFr(m[1]) + parseFr(m[2]);
  if ((m = say.match(new RegExp(`^${N} moins ${N}$`)))) return parseFr(m[1]) - parseFr(m[2]);
  if ((m = say.match(new RegExp(`^${N} fois ${N}$`)))) return parseFr(m[1]) * parseFr(m[2]);
  if ((m = say.match(new RegExp(`^le double de ${N}$`)))) return 2 * parseFr(m[1]);
  if ((m = say.match(new RegExp(`^le triple de ${N}$`)))) return 3 * parseFr(m[1]);
  if ((m = say.match(new RegExp(`^le quadruple de ${N}$`)))) return 4 * parseFr(m[1]);
  if ((m = say.match(new RegExp(`^la moitié de ${N}$`)))) return parseFr(m[1]) / 2;
  if ((m = say.match(new RegExp(`^le tiers de ${N}$`)))) return parseFr(m[1]) / 3;
  if ((m = say.match(new RegExp(`^le quart de ${N}$`)))) return parseFr(m[1]) / 4;
  throw new Error("phrase non reconnue : " + say);
}

// ---------- états aléatoires et faux localStorage pour les tests de sauvegarde ----------
import { emptyState, COUNTERS } from "../js/state.js";
export function randState(rng) {
  const R = (n) => Math.floor(rng() * n);
  const s = emptyState();
  for (const c of COUNTERS) s.c[c] = R(400);
  const fams = ["add", "sub", "mul", "dbl", "frac", "comp", "div", "trick"];
  for (const f of fams) if (rng() < 0.8) s.fam[f] = { xp: R(300), n: R(500), lvl: 1 + R(3), maxLvl: 1 + R(3), recent: Array.from({ length: R(10) }, () => R(2)) };
  for (let i = 0; i < 6; i++) {
    const d = `2026-11-${String(1 + R(28)).padStart(2, "0")}`;
    s.days[d] = { ok: R(60), tot: R(80), fam: { add: R(10), mul: R(10) }, learn: R(2) ? ["add9"] : [], easy: R(2) ? [`k|${R(5)}`] : [] };
  }
  for (let i = 0; i < 8; i++) s.tro[`t_calc:${1 + R(5)}`] = `2026-11-${String(1 + R(28)).padStart(2, "0")}`;
  for (const f of fams) if (rng() < 0.6) { const st = R(5); s.cre[f] = { s: st, d: Object.fromEntries(Array.from({ length: st }, (_, i) => [i + 1, `2026-10-${String(1 + R(28)).padStart(2, "0")}`])) }; }
  for (const id of ["add9", "x11", "x25", "tiers"]) if (rng() < 0.5) s.learn[id] = `2026-11-0${1 + R(9)}`;
  for (let i = 0; i < 6; i++) { const key = `add_2d|${10 + R(60)} + ${10 + R(60)}`; s.review[key] = { k: "add_2d", p: { a: 11, b: 29 }, box: R(4), due: `2026-11-${String(10 + R(15))}`, miss: R(5), done: R(4) === 0, ...(R(2) ? { doneAt: "2026-11-12" } : {}) }; }
  for (let i = 0; i < 4; i++) s.daily[`2026-11-${String(1 + R(28)).padStart(2, "0")}`] = { done: R(2) === 0, ok: R(20), n: 20, stars: R(4) };
  s.rec["time:mix"] = R(40); s.rec["time:add"] = R(30);
  s.m.done = Array.from({ length: R(5) }, (_, i) => `m-${i}`);
  s.m.active = Array.from({ length: 3 }, (_, i) => ({ id: `m-${20 + i * 10 + R(3)}`, tpl: "fam", params: { fam: "add" }, target: 10, progress: R(10), done: false }));
  s.shop = { owned: {}, worn: {} };
  for (const it of ["crown", "shades", "scarf"]) if (rng() < 0.5) s.shop.owned[it] = `2026-11-0${1 + R(9)}`;
  if (rng() < 0.5) s.shop.worn.add = { head: { id: rng() < 0.5 ? "crown" : null, t: 1000 + R(1000) } };
  if (rng() < 0.5) s.futureKey = { n: R(9), list: [R(3), 3 + R(3)] }; // clé inconnue d'une version future
  return s;
}

export function fakeLS() {
  const m = new Map();
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _m: m,
  };
}
