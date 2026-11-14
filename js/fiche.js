// « 50 calculs en 5 minutes » (v0.18) : la fiche chronométrée de la classe. Logique pure, testée (tests/fiche.test.mjs).
// Les 50 lignes de chaque période reprennent les règles de tirage de la fiche de l'école (types de calcul et bornes des nombres) :
// nombres à virgule, calculs à trou, numération, sommes de trois nombres. Les nombres à virgule n'existent QUE dans ce mode.
// Rien n'est corrigé pendant l'épreuve ; un calcul sans réponse n'est jamais une faute (« pas encore fait »).
import { fmt, shuffle, addHint, subHint, doubling, tableHint, splitTimes, quarterHint, compHint, FAMILIES } from "./generator.js";
import { famState, dayRec, starsFor } from "./progress.js";

export const HOLE = "□"; // l'emplacement de la réponse dans l'énoncé (« 0,3 + □ = 1 »)
export const r5 = (x) => Math.round(x * 1e5) / 1e5;
// Écriture française d'un nombre : virgule décimale, espace fine entre les milliers.
export function fmtDec(n) {
  const [i, d] = r5(n).toFixed(5).replace(/\.?0+$/, "").split(".");
  return fmt(i) + (d ? "," + d : "");
}
const F = fmtDec;
// Ce qu'elle a tapé (« 0,7 », « 1 250 », « 6,60 ») → nombre, ou null si ce n'est pas un nombre.
export function parseAnswer(text) {
  const t = String(text ?? "").replace(/[\s  ]/g, "").replace(",", ".");
  if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}
// Ajoute une touche à ce qui est déjà tapé (au plus une virgule ; « ,5 » devient « 0,5 » ; « del » efface).
export const MAX_LEN = 9;
export function typeKey(text, key) {
  if (key === "del") return text.slice(0, -1);
  if (text.length >= MAX_LEN) return text;
  if (key === ",") return text.includes(",") ? text : (text || "0") + ",";
  return text === "0" ? key : text + key;
}
export const sameValue = (a, b) => a != null && b != null && Math.abs(a - b) < 1e-7;

// r.vals (v0.19) : des valeurs imposées, dans l'ordre des tirages — pour les exemples écrits à l'avance des fiches « Apprendre ».
const R = (r, a, b) => (r.vals ? r.vals.shift() : a + Math.floor(r() * (b - a + 1)));
const pick = (r, arr) => (r.vals ? r.vals.shift() : arr[Math.floor(r() * arr.length)]);
const until = (gen, ok) => { for (let i = 0; i < 500; i++) { const v = gen(); if (ok(v)) return v; } throw new Error("tirage impossible"); };
const H = (stem, steps, a) => ({ text: `${stem} = ${F(a)}`, steps });
const plural = (n, word) => (n > 1 ? word.replace(/^(\S+)/, "$1s") : word); // dizaine de mille → dizaines de mille
const P = (t, fam, q, a, hint) => ({ t, fam, q, a: r5(a), hint });
const rangs = (k) => `${k} rang${k > 1 ? "s" : ""}`;

// ---------- les types de lignes ----------
function dmul(r, { lo, hi, div, pows }) { // 7,6 × 100
  const num = R(r, lo, hi), p = pick(r, pows), x = num / div, a = (num * p) / div, k = Math.round(Math.log10(p));
  const steps = []; let v = x;
  for (let i = 0; i < k; i++) {
    steps.push({ t: i === 0 ? "Multiplier par 10 : chaque chiffre avance d'un rang vers la gauche (la virgule se décale d'un rang vers la droite)" : "Encore × 10", eq: `${F(v)} × 10 = ${F(v * 10)}` });
    v = r5(v * 10);
  }
  if (k > 1) steps.push({ t: `× ${F(p)}, c'est ${k} fois « × 10 » : la virgule s'est décalée de ${rangs(k)}`, eq: `${F(x)} × ${F(p)} = ${F(a)}` });
  return P("dmul", "mul", `${F(x)} × ${F(p)} = ${HOLE}`, a, H(`${F(x)} × ${F(p)}`, steps, a));
}
function ddiv(r, { gen, pows }) { // 400 ÷ 1 000 ; 48 ÷ 10
  const n = gen(r), p = pick(r, pows), a = n / p, k = Math.round(Math.log10(p));
  const steps = []; let v = n;
  for (let i = 0; i < k; i++) {
    steps.push({ t: i === 0 ? "Diviser par 10 : chaque chiffre recule d'un rang vers la droite (la virgule se décale d'un rang vers la gauche)" : "Encore ÷ 10", eq: `${F(v)} ÷ 10 = ${F(v / 10)}` });
    v = r5(v / 10);
  }
  if (k > 1) steps.push({ t: `÷ ${F(p)}, c'est ${k} fois « ÷ 10 » : la virgule s'est décalée de ${rangs(k)}`, eq: `${F(n)} ÷ ${F(p)} = ${F(a)}` });
  return P("ddiv", "div", `${F(n)} ÷ ${F(p)} = ${HOLE}`, a, H(`${F(n)} ÷ ${F(p)}`, steps, a));
}
function addn(r, { lo, hi, ds }) { // + 9, + 19, + 11, + 21
  const n = R(r, lo, hi), d = pick(r, ds), bb = Math.round(d / 10) * 10, s = n + d, over = d < bb;
  return P("addn", "add", `${F(n)} + ${d} = ${HOLE}`, s, H(`${F(n)} + ${d} → ${F(n)} + ${bb} ${over ? "−" : "+"} 1`, [
    { t: `J'ajoute ${bb} au lieu de ${d}`, eq: `${F(n)} + ${bb} = ${F(n + bb)}` },
    { t: over ? "J'ai ajouté 1 de trop : je le retire" : "Il manque encore 1 : je l'ajoute", eq: `${F(n + bb)} ${over ? "−" : "+"} 1 = ${F(s)}` }], s));
}
function subn(r, { lo, hi, ds }) { // − 9, − 19, − 11, − 21
  const d = pick(r, ds), n = until(() => R(r, lo, hi), (v) => v > d), bb = Math.round(d / 10) * 10, s = n - d, over = d < bb;
  return P("subn", "sub", `${F(n)} − ${d} = ${HOLE}`, s, H(`${F(n)} − ${d} → ${F(n)} − ${bb} ${over ? "+" : "−"} 1`, [
    { t: `Je retire ${bb} au lieu de ${d}`, eq: `${F(n)} − ${bb} = ${F(n - bb)}` },
    { t: over ? "J'ai retiré 1 de trop : je le rends" : "Il faut encore retirer 1", eq: `${F(n - bb)} ${over ? "+" : "−"} 1 = ${F(s)}` }], s));
}
const RANG = { 10: "dizaines", 100: "centaines", 1000: "milliers", 10000: "dizaines de mille" };
function addp(r, { lo, hi, ps }) { // 204 + 100 ; 5 + 10 000
  const n = R(r, lo, hi), p = pick(r, ps), s = n + p;
  return P("addp", "add", `${F(n)} + ${F(p)} = ${HOLE}`, s, H(`${F(n)} + ${F(p)}`, [
    { t: `J'ajoute ${F(p)} : je regarde le chiffre des ${RANG[p]}, les autres chiffres ne changent pas`, eq: `${F(n)} + ${F(p)} = ${F(s)}` }], s));
}
function subp(r, { lo, hi, ps }) { // 742 − 10
  const n = R(r, lo, hi), p = pick(r, ps), s = n - p;
  return P("subp", "sub", `${F(n)} − ${F(p)} = ${HOLE}`, s, H(`${F(n)} − ${F(p)}`, [
    { t: `Je retire ${F(p)} : je regarde le chiffre des ${RANG[p]}, les autres chiffres ne changent pas`, eq: `${F(n)} − ${F(p)} = ${F(s)}` }], s));
}
function addr(r, { a, b, unit }) { // nombres ronds : 180 + 80 (en dizaines) ; 25 + 900
  const x = a(r), y = b(r), s = x + y;
  const steps = unit && x % unit === 0 && y % unit === 0
    ? [{ t: `Je compte en ${RANG[unit]}`, eq: `${x / unit} + ${y / unit} = ${s / unit}` }, { t: `${s / unit} ${RANG[unit]}, c'est`, eq: `${F(x)} + ${F(y)} = ${F(s)}` }]
    : [{ t: "Les deux nombres ne se mélangent pas : je les mets bout à bout", eq: `${F(y)} + ${F(x)} = ${F(s)}` }];
  return P("addr", "add", `${F(x)} + ${F(y)} = ${HOLE}`, s, H(`${F(x)} + ${F(y)}`, steps, s));
}
function subr(r) { // 600 − 20
  const x = R(r, 5, 9) * 100, y = R(r, 1, 4) * 10, s = x - y;
  return P("subr", "sub", `${F(x)} − ${y} = ${HOLE}`, s, H(`${F(x)} − ${y}`, [
    { t: "Je compte en dizaines", eq: `${x / 10} − ${y / 10} = ${s / 10}` }, { t: `${s / 10} dizaines, c'est`, eq: `${F(x)} − ${y} = ${F(s)}` }], s));
}
function sub2(r) { // 64 − 30
  const a = R(r, 50, 100), b = R(r, 10, 49), s = a - b;
  const hint = b % 10 === 0 ? H(`${a} − ${b}`, [{ t: "Je retire les dizaines : le chiffre des unités ne change pas", eq: `${a} − ${b} = ${s}` }], s) : subHint(a, b);
  return P("sub2", "sub", `${a} − ${b} = ${HOLE}`, s, hint);
}
function addd(r) { // 10 + 0,1
  const a = R(r, 1, 10), m = R(r, 1, 9), s = a + m / 10;
  return P("addd", "add", `${a} + ${F(m / 10)} = ${HOLE}`, s, H(`${a} + ${F(m / 10)}`, [
    { t: `${F(m / 10)}, c'est ${m} dixième${m > 1 ? "s" : ""} : il s'écrit juste après la virgule`, eq: `${a} + ${F(m / 10)} = ${F(s)}` }], s));
}
function dadd(r, { div }) { // 7,4 + 8,0
  const x = R(r, div === 10 ? 19 : 199, div === 10 ? 99 : 999), y = R(r, div === 10 ? 19 : 199, div === 10 ? 99 : 999);
  const ix = Math.floor(x / div), iy = Math.floor(y / div), fx = x % div, fy = y % div, s = (x + y) / div, name = div === 10 ? "dixièmes" : "centièmes";
  return P("dadd", "add", `${F(x / div)} + ${F(y / div)} = ${HOLE}`, s, H(`${F(x / div)} + ${F(y / div)}`, [
    { t: "J'additionne les unités", eq: `${ix} + ${iy} = ${ix + iy}` },
    { t: `J'additionne les ${name}`, eq: `${F(fx / div)} + ${F(fy / div)} = ${F((fx + fy) / div)}` },
    { t: "Je rassemble", eq: `${ix + iy} + ${F((fx + fy) / div)} = ${F(s)}` }], s));
}
function add3(r, { a, b, c }) { // 17 + 2 + 9
  const x = R(r, ...a), y = R(r, ...b), z = R(r, ...c), s = x + y + z;
  return P("add3", "add", `${x} + ${y} + ${z} = ${HOLE}`, s, H(`${x} + ${y} + ${z}`, [
    { t: "J'additionne les deux premiers", eq: `${x} + ${y} = ${x + y}` }, { t: "Puis j'ajoute le troisième", eq: `${x + y} + ${z} = ${s}` }], s));
}
function mulHint(a, b) {
  const p = a * b, has = (v) => a === v || b === v, other = (v) => (a === v ? b : a);
  const one = (t) => H(`${a} × ${b}`, [{ t, eq: `${a} × ${b} = ${p}` }], p);
  if (has(0)) return one("Zéro fois un nombre, ça fait toujours zéro");
  if (has(1)) return one("Une fois un nombre, c'est ce nombre");
  if (has(10)) return one("Multiplier par 10 : j'écris un zéro à droite");
  if (has(11)) { const n = other(11); return H(`${a} × ${b} → 10 × ${n} + ${n}`, [{ t: "11 fois, c'est 10 fois plus 1 fois", eq: `10 × ${n} = ${10 * n}` }, { t: `J'ajoute encore ${n}`, eq: `${10 * n} + ${n} = ${p}` }], p); }
  if (has(12)) { const n = other(12); return H(`${a} × ${b} → 10 × ${n} + 2 × ${n}`, [{ t: "12 = 10 + 2", eq: `10 × ${n} = ${10 * n} ; 2 × ${n} = ${2 * n}` }, { t: "J'additionne", eq: `${10 * n} + ${2 * n} = ${p}` }], p); }
  if (has(2)) { const n = other(2); return one(`2 fois ${n}, c'est le double de ${n}`); }
  if (has(5)) { const n = other(5); return H(`${a} × ${b} → moitié de 10 × ${n}`, [{ t: "5 fois, c'est la moitié de 10 fois", eq: `10 × ${n} = ${10 * n}` }, { t: "Je prends la moitié", eq: `${10 * n} ÷ 2 = ${p}` }], p); }
  for (const v of [9, 4, 8, 6, 7]) if (has(v)) return tableHint(v, other(v));
  const n = other(3); // il reste 3 × 3
  return H(`${a} × ${b} → 2 × ${n} + ${n}`, [{ t: "3 fois, c'est 2 fois plus 1 fois", eq: `2 × ${n} = ${2 * n}` }, { t: `J'ajoute encore ${n}`, eq: `${2 * n} + ${n} = ${p}` }], p);
}
function mul(r, { a, b }) { // 7 × 9
  const x = R(r, ...a), y = R(r, ...b);
  return P("mul", "mul", `${x} × ${y} = ${HOLE}`, x * y, mulHint(x, y));
}
function mul10(r, { a, b }) { // 2 × 40 ; 8 × 20 ; 3 × 400
  const x = a(r), y = b(r), z = y >= 100 && y % 100 === 0 ? 100 : 10, d = y / z, p = x * y;
  return P("mul10", "mul", `${x} × ${F(y)} = ${HOLE}`, p, H(`${x} × ${F(y)} → ${x} × ${d} puis × ${z}`, [
    { t: `Je calcule d'abord ${x} × ${d}`, eq: `${x} × ${d} = ${x * d}` },
    { t: z === 10 ? "Puis je multiplie par 10 : j'écris un zéro" : "Puis je multiplie par 100 : j'écris deux zéros", eq: `${x * d} × ${z} = ${F(p)}` }], p));
}
function divt(r, { t }) { // 14 ÷ 7
  const q = R(r, 2, 10), n = t * q;
  return P("divt", "div", `${n} ÷ ${t} = ${HOLE}`, q, H(`${n} ÷ ${t}`, [
    { t: `Je cherche dans la table de ${t}`, eq: `${t} × ${q} = ${n}` }, { t: "Donc", eq: `${n} ÷ ${t} = ${q}` }], q));
}
function gapMul(r, { first }) { // □ × 7 = 56 ; 8 × □ = 32
  const ans = first ? R(r, 1, 10) : R(r, 2, 11), known = first ? R(r, 2, 11) : R(r, 1, 11), p = ans * known;
  const q = first ? `${HOLE} × ${known} = ${p}` : `${known} × ${HOLE} = ${p}`;
  return P("gapmul", "mul", q, ans, H(`${q.replace(HOLE, "?")} → ${p} ÷ ${known}`, [
    { t: `Je cherche dans la table de ${known}`, eq: `${known} × ${ans} = ${p}` },
    { t: "Pour trouver le nombre qui manque, je divise", eq: `${p} ÷ ${known} = ${ans}` }], ans));
}
function gapDiv(r) { // 45 ÷ □ = 5
  const f = R(r, 2, 9), ans = R(r, 2, 9), b = f * ans;
  return P("gapdiv", "div", `${b} ÷ ${HOLE} = ${f}`, ans, H(`${b} ÷ ? = ${f} → ${b} ÷ ${f}`, [
    { t: `${f} fois combien font ${b} ?`, eq: `${f} × ${ans} = ${b}` }, { t: "Donc", eq: `${b} ÷ ${ans} = ${f}` }], ans));
}
function gapComp(r, { target }) { // 642 + □ = 700 ; 6 943 + □ = 7 000 ; 37 + □ = 100
  const t = target(r), n = t - R(r, 1, 99), h = compHint(n, t);
  return P("gapcomp", "comp", `${F(n)} + ${HOLE} = ${F(t)}`, t - n, h);
}
function gapOne(r) { // 0,3 + □ = 1
  const d = R(r, 1, 9), a = (10 - d) / 10;
  return P("gapone", "comp", `${F(d / 10)} + ${HOLE} = 1`, a, H(`${F(d / 10)} + ? = 1`, [
    { t: `1, c'est 10 dixièmes ; ${F(d / 10)}, c'est ${d} dixième${d > 1 ? "s" : ""}. Combien en manque-t-il ?`, eq: `${d} + ${10 - d} = 10` },
    { t: `Il manque ${10 - d} dixième${10 - d > 1 ? "s" : ""}`, eq: `${F(d / 10)} + ${F(a)} = 1` }], a));
}
function gapTen(r) { // 6,9 + □ = 10
  const num = R(r, 19, 99), x = num / 10, a = (100 - num) / 10, up = Math.ceil(x), j1 = r5(up - x), j2 = 10 - up;
  const steps = [];
  if (j1 > 0) steps.push({ t: "Je complète d'abord jusqu'à l'unité suivante", eq: `${F(x)} + ${F(j1)} = ${up}` });
  if (j2 > 0) steps.push({ t: j1 > 0 ? "Puis je vais jusqu'à 10" : "Je vais jusqu'à 10", eq: `${up} + ${j2} = 10` });
  if (j1 > 0 && j2 > 0) steps.push({ t: "J'additionne les deux sauts", eq: `${F(j1)} + ${j2} = ${F(a)}` });
  return P("gapten", "comp", `${F(x)} + ${HOLE} = 10`, a, H(`${F(x)} + ? = 10`, steps, a));
}
// Découpe un nombre pair en morceaux faciles à partager en deux (730 → 600 + 120 + 10).
export function evenParts(n) {
  const digits = String(n).split("").map(Number), parts = []; let carry = 0;
  digits.forEach((d, i) => {
    let v = d + carry * 10; carry = 0;
    if (v % 2 === 1 && i < digits.length - 1) { v -= 1; carry = 1; }
    const place = 10 ** (digits.length - 1 - i);
    if (v) parts.push(v * place);
  });
  return parts;
}
function halfHint(n) {
  const parts = evenParts(n);
  if (parts.length < 2) return H(`Moitié de ${F(n)}`, [{ t: "La moitié, c'est partager en deux parts égales", eq: `${F(n)} ÷ 2 = ${F(n / 2)}` }], n / 2);
  return H(`Moitié de ${F(n)} → ${parts.map(F).join(" + ")}`, [
    { t: `Je coupe ${F(n)} en morceaux faciles à partager en deux`, eq: parts.map((p) => `${F(p)} ÷ 2 = ${F(p / 2)}`).join(" ; ") },
    { t: "J'additionne les moitiés", eq: `${parts.map((p) => F(p / 2)).join(" + ")} = ${F(n / 2)}` }], n / 2);
}
function half(r) { const n = 2 * Math.ceil(R(r, 20, 1000) / 2); return P("half", "frac", `Moitié de ${F(n)} = ${HOLE}`, n / 2, halfHint(n)); }
const timesHint = (n, m, word) => (n < 10 || n % 10 === 0 || n >= 100
  ? H(`${word} de ${n}`, [{ t: `Le ${word.toLowerCase()}, c'est ${m} fois le nombre`, eq: `${n} × ${m} = ${n * m}` }], n * m) : splitTimes(n, m, word));
function dbl(r, { lo, hi, dec }) { // double de 54 ; double de 7,6
  if (!dec) { const n = R(r, lo, hi); return P("dbl", "dbl", `Double de ${n} = ${HOLE}`, n * 2, timesHint(n, 2, "Double")); }
  const num = R(r, lo, hi), i = Math.floor(num / 10), d = num % 10, x = num / 10, a = (num * 2) / 10;
  const hint = d === 0 ? H(`Double de ${F(x)}`, [{ t: "Le double, c'est 2 fois le nombre", eq: `${F(x)} × 2 = ${F(a)}` }], a)
    : H(`Double de ${F(x)} → double de ${i} + double de ${F(d / 10)}`, [
      { t: "Je double les unités, puis les dixièmes", eq: `${i} × 2 = ${i * 2} ; ${F(d / 10)} × 2 = ${F((d * 2) / 10)}` },
      { t: "J'additionne", eq: `${i * 2} + ${F((d * 2) / 10)} = ${F(a)}` }], a);
  return P("dbl", "dbl", `Double de ${F(x)} = ${HOLE}`, a, hint);
}
function triple(r, { lo, hi }) { const n = R(r, lo, hi); return P("triple", "dbl", `Triple de ${n} = ${HOLE}`, n * 3, timesHint(n, 3, "Triple")); }
function quad(r, { lo, hi }) { const n = R(r, lo, hi); return P("quad", "dbl", `Quadruple de ${n} = ${HOLE}`, n * 4, doubling(n, 2, `Quadruple de ${n} → double du double`)); }
const QUARTERS = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 80, 120, 160, 200, 240, 280, 320, 360, 400];
const THIRDS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300];
function quarter(r) { const n = pick(r, QUARTERS); return P("quarter", "frac", `Quart de ${n} = ${HOLE}`, n / 4, quarterHint(n, `Quart de ${n}`)); }
function third(r) {
  const n = pick(r, THIRDS), a = n / 3;
  const hint = n > 30 ? H(`Tiers de ${n} → ${n / 10} dizaines partagées en 3`, [
    { t: `${n}, c'est ${n / 10} dizaines : je les partage en 3`, eq: `${n / 10} ÷ 3 = ${a / 10}` }, { t: `${a / 10} dizaine${a / 10 > 1 ? "s" : ""}, c'est`, eq: `${n} ÷ 3 = ${a}` }], a)
    : H(`Tiers de ${n}`, [{ t: `Je cherche dans la table de 3 : 3 fois combien font ${n} ?`, eq: `3 × ${a} = ${n}` }, { t: "Donc", eq: `${n} ÷ 3 = ${a}` }], a);
  return P("third", "frac", `Tiers de ${n} = ${HOLE}`, a, hint);
}
// Numération : « 2 unités et 9 dixièmes », « 44 dizaines de mille et 4 dizaines ».
export const UNITS = { u: ["unité", 1], d: ["dizaine", 10], c: ["centaine", 100], dm: ["dizaine de mille", 10000], cm: ["centaine de mille", 100000], di: ["dixième", 0.1], ce: ["centième", 0.01] };
function num(r, { big, small, bigMax, smallRange = [0, 9] }) {
  const [bw, bv] = UNITS[big], [sw, sv] = UNITS[small];
  const { j, m } = until(() => ({ j: R(r, 0, bigMax), m: R(r, ...smallRange) }), (v) => v.j + v.m > 0);
  const a = r5(j * bv + m * sv);
  return P("num", "add", `${j} ${plural(j, bw)} et ${m} ${plural(m, sw)} = ${HOLE}`, a, H(`${j} ${plural(j, bw)} et ${m} ${plural(m, sw)}`, [
    { t: `${j} ${plural(j, bw)}, c'est`, eq: `${j} × ${F(bv)} = ${F(j * bv)}` },
    { t: `${m} ${plural(m, sw)}, c'est`, eq: `${m} × ${F(sv)} = ${F(m * sv)}` },
    { t: "J'additionne les deux", eq: `${F(j * bv)} + ${F(m * sv)} = ${F(a)}` }], a));
}

// ---------- les 50 lignes de chaque période (numéros = ceux de la fiche de la classe) ----------
const T3 = [10, 100, 1000], T4 = [10, 100, 1000, 10000];
const P1 = {
  1: (r) => dmul(r, { lo: 19, hi: 99, div: 10, pows: T3 }),
  2: (r) => ddiv(r, { gen: (x) => R(x, 1, 9) * 100, pows: T3 }),
  3: (r) => addn(r, { lo: 1, hi: 999, ds: [11, 21] }),
  4: (r) => ddiv(r, { gen: (x) => R(x, 10, 99), pows: [10] }),
  5: (r) => divt(r, { t: 7 }),
  6: (r) => gapMul(r, { first: true }),
  7: (r) => ddiv(r, { gen: (x) => R(x, 10, 99), pows: [10] }),
  8: (r) => dmul(r, { lo: 19, hi: 99, div: 100, pows: T3 }),
  9: (r) => gapComp(r, { target: (x) => R(x, 1, 9) * 100 }),
  10: (r) => mul(r, { a: [1, 11], b: [2, 11] }),
  11: (r) => mul10(r, { a: (x) => R(x, 2, 5), b: (x) => R(x, 1, 5) * 10 }),
  12: half,
  13: (r) => addp(r, { lo: 100, hi: 1000, ps: [10, 100, 1000] }),
  14: (r) => mul(r, { a: [1, 11], b: [2, 11] }),
  15: (r) => dadd(r, { div: 10 }),
  16: (r) => subn(r, { lo: 21, hi: 99, ds: [9, 19] }),
  17: (r) => addr(r, { a: (x) => R(x, 10, 89), b: (x) => R(x, 1, 9) * 100 }),
  18: (r) => mul(r, { a: [2, 11], b: [1, 11] }),
  19: gapTen,
  20: sub2,
  21: (r) => mul(r, { a: [1, 9], b: [12, 12] }),
  22: (r) => divt(r, { t: 5 }),
  23: (r) => addr(r, { a: (x) => R(x, 10, 90) * 10, b: (x) => R(x, 1, 9) * 10, unit: 10 }),
  24: half,
  25: (r) => addp(r, { lo: 1, hi: 99, ps: T4 }),
  26: quarter,
  27: gapOne,
  28: (r) => divt(r, { t: 8 }),
  29: (r) => ddiv(r, { gen: (x) => R(x, 1, 9) * 1000, pows: T3 }),
  30: subr,
  31: (r) => addn(r, { lo: 11, hi: 69, ds: [9, 19] }),
  32: addd,
  33: (r) => gapComp(r, { target: () => 100 }),
  34: (r) => num(r, { big: "u", small: "di", bigMax: 9 }),
  35: (r) => mul10(r, { a: (x) => R(x, 1, 9), b: (x) => R(x, 2, 9) * 10 }),
  36: (r) => dbl(r, { lo: 1, hi: 100 }),
  37: (r) => divt(r, { t: 4 }),
  38: (r) => add3(r, { a: [0, 20], b: [0, 20], c: [0, 12] }),
  39: gapOne,
  40: (r) => triple(r, { lo: 1, hi: 50 }),
  41: (r) => addr(r, { a: (x) => R(x, 10, 50) * 10, b: (x) => R(x, 1, 5) * 10, unit: 10 }),
  42: (r) => gapMul(r, { first: false }),
  43: (r) => dmul(r, { lo: 19, hi: 99, div: 10, pows: T3 }),
  44: third,
  45: (r) => subn(r, { lo: 22, hi: 99, ds: [11, 21] }),
  46: (r) => subp(r, { lo: 101, hi: 999, ps: [10, 100] }),
  47: (r) => num(r, { big: "dm", small: "d", bigMax: 99 }),
  48: (r) => quad(r, { lo: 1, hi: 10 }),
  49: (r) => add3(r, { a: [10, 20], b: [10, 20], c: [0, 12] }),
  50: (r) => dmul(r, { lo: 199, hi: 999, div: 100, pows: T3 }),
};
const P2 = { ...P1,
  9: (r) => gapComp(r, { target: (x) => R(x, 2, 9) * 1000 }),
  22: gapDiv, 30: gapDiv,
  47: (r) => num(r, { big: "dm", small: "c", bigMax: 99 }),
};
const P3 = { ...P2,
  1: (r) => dmul(r, { lo: 19, hi: 99, div: 100, pows: T3 }),
  2: (r) => ddiv(r, { gen: (x) => R(x, 1, 9) * 10, pows: T3 }),
  7: (r) => ddiv(r, { gen: (x) => R(x, 10, 99), pows: T3 }),
  47: (r) => num(r, { big: "dm", small: "c", bigMax: 9 }),
};
const P4 = { ...P3,
  7: (r) => ddiv(r, { gen: (x) => R(x, 10, 99), pows: T4 }),
  8: (r) => dmul(r, { lo: 19, hi: 99, div: 100, pows: T4 }),
  18: (r) => mul(r, { a: [2, 11], b: [1, 12] }),
  36: (r) => dbl(r, { lo: 19, hi: 99, dec: true }),
  47: (r) => num(r, { big: "cm", small: "c", bigMax: 9 }),
  48: (r) => quad(r, { lo: 1, hi: 12 }),
};
const P5 = { ...P4,
  1: (r) => dmul(r, { lo: 19, hi: 99, div: 100, pows: T4 }),
  3: (r) => addn(r, { lo: 1111, hi: 9999, ds: [9, 19, 11, 21] }),
  5: (r) => divt(r, { t: 9 }),
  7: (r) => ddiv(r, { gen: (x) => R(x, 199, 999) / 100, pows: T3 }),
  9: (r) => gapComp(r, { target: (x) => R(x, 2, 9) * 10000 }),
  11: (r) => mul10(r, { a: (x) => R(x, 2, 5), b: (x) => R(x, 1, 5) * 100 }),
  15: (r) => dadd(r, { div: 100 }),
  25: (r) => addp(r, { lo: 1, hi: 99, ps: [100, 1000, 10000] }),
  34: (r) => num(r, { big: "d", small: "ce", bigMax: 20 }),
  40: (r) => triple(r, { lo: 20, hi: 99 }),
  47: (r) => num(r, { big: "cm", small: "c", bigMax: 9, smallRange: [100, 999] }),
  48: (r) => quad(r, { lo: 20, hi: 99 }),
};
export const SHEETS = { 1: P1, 2: P2, 3: P3, 4: P4, 5: P5 };
export const PERIODS = [1, 2, 3, 4, 5];
export const LINES = 50;

// ---------- v0.19 : exemples exacts et entraînement par type de calcul ----------
const GENS = { dmul, ddiv, addd, dadd, gapone: gapOne, gapten: gapTen, num, addn, subn, half, dbl, gapcomp: gapComp, gapmul: gapMul };
// exampleOf("dmul", { div: 10, pows: [100] }, 76, 100) → 7,6 × 100 (les valeurs sont celles des tirages, dans l'ordre).
export function exampleOf(t, opts = {}, ...vals) {
  const r = Object.assign(() => 0, { vals: [...vals] });
  const p = GENS[t](r, { lo: 0, hi: 0, gen: (x) => R(x, 0, 0), ...opts });
  if (r.vals.length) throw new Error(`exemple ${t} : valeurs en trop`);
  return p;
}
// Les numéros de ligne de chaque type, période par période (calculé une fois : le type d'une ligne ne dépend pas du tirage).
const LINE_TYPES = {};
function linesOfType(period) {
  if (!LINE_TYPES[period]) {
    const map = {}, sheet = SHEETS[period];
    for (let i = 1; i <= LINES; i++) { const t = sheet[i](mkRng(i)).t; (map[t] ||= []).push(i); }
    LINE_TYPES[period] = map;
  }
  return LINE_TYPES[period];
}
function mkRng(seed) { let x = seed * 2654435761 % 4294967296 || 1; return () => ((x = (x * 1664525 + 1013904223) % 4294967296) / 4294967296); }
export const typesOf = (period) => Object.keys(linesOfType(period));
// n calculs des types demandés, avec les nombres de la période (sinon ceux de la période la plus proche qui a ce type).
// Jamais deux fois le même énoncé ; utilisé par « Je m'entraîne » (fiches Apprendre) et la revanche de 2 minutes.
export function practiceSet(period, types, n = 10, rng = Math.random) {
  const pool = [];
  for (const t of new Set(types)) {
    const order = [period, ...PERIODS.filter((q) => q !== period).sort((a, b) => Math.abs(a - period) - Math.abs(b - period))];
    const q = order.find((x) => linesOfType(x)[t]);
    if (q) for (const line of linesOfType(q)[t]) pool.push({ period: q, line });
  }
  if (!pool.length) return [];
  const out = [], seen = new Set();
  for (let k = 0; out.length < n && k < n * 40; k++) {
    const { period: q, line } = pool[Math.floor(rng() * pool.length)];
    const p = SHEETS[q][line](rng);
    if (!seen.has(p.q)) { seen.add(p.q); out.push({ line: out.length + 1, ...p }); }
  }
  return out;
}

// La fiche complète d'une période : 50 calculs numérotés comme en classe.
export function buildSheet(period, rng = Math.random) {
  const sheet = SHEETS[period] || SHEETS[1], out = [];
  for (let i = 1; i <= LINES; i++) out.push({ line: i, ...sheet[i](rng) });
  return out;
}

// ---------- les rythmes (le contenu ne change pas, seulement le nombre de calculs et le temps) ----------
export const RHYTHMS = [
  { id: "decouverte", name: "Découverte", icon: "🌱", n: 20, secs: 300 },
  { id: "entrainement", name: "Entraînement", icon: "🚲", n: 35, secs: 300 },
  { id: "classe", name: "Comme en classe", icon: "🏫", n: 50, secs: 300 },
  { id: "championne", name: "Championne", icon: "🚀", n: 50, secs: 240 },
];
export const rhythmById = (id) => RHYTHMS.find((x) => x.id === id) || RHYTHMS[2];
export const rhythmLine = (x) => `${x.n} calculs · ${x.secs / 60} minutes`;
export const perCalc = (x) => Math.round(x.secs / x.n);

// La fiche à jouer : toute la fiche, ou n lignes tirées au hasard en gardant l'ordre de la fiche (rythmes plus doux).
export function makeFiche(period, rhythmId, rng = Math.random) {
  const x = rhythmById(rhythmId), all = buildSheet(period, rng);
  if (x.n >= all.length) return all;
  const keep = new Set(shuffle(all.map((p) => p.line), rng).slice(0, x.n));
  return all.filter((p) => keep.has(p.line));
}

// La période de l'année scolaire (dates approchées : les vacances changent selon la zone ; un réglage permet de la choisir).
export function periodFor(date) {
  const md = String(date).slice(5); // « MM-JJ »
  if (md >= "09-01") return md <= "11-01" ? 1 : 2; // rentrée → Toussaint → Noël
  if (md <= "01-04") return 2;
  if (md <= "02-29") return 3;
  if (md <= "04-30") return 4;
  if (md <= "08-31") return 5;
  return 1;
}
export const periodOf = (setting, date) => (PERIODS.includes(Number(setting)) ? Number(setting) : periodFor(date));

// ---------- correction ----------
// answers : tableau de textes tapés (même ordre que problems). Une case vide = « pas encore fait ».
export function scoreFiche(problems, answers) {
  const rows = problems.map((p, i) => {
    const text = String(answers[i] ?? "").trim(), v = parseAnswer(text);
    const state = text === "" ? "todo" : sameValue(v, p.a) ? "ok" : "miss";
    return { p, text, state };
  });
  const count = (st) => rows.filter((x) => x.state === st).length;
  return { rows, ok: count("ok"), miss: count("miss"), todo: count("todo"), answered: rows.length - count("todo"), total: rows.length };
}
export const recKey = (period, rhythmId) => `fiche:p${period}:${rhythmId}`;
export const ficheCount = (s) => Math.max((s.c && s.c.fiche) || 0, Object.keys(s.fiche || {}).length);
export const ficheBest = (s, period, rhythmId) => (s.rec || {})[recKey(period, rhythmId)] || 0;
export const ficheBestAny = (s) => Object.entries(s.rec || {}).filter(([k]) => k.startsWith("fiche:")).reduce((b, [, v]) => Math.max(b, Number(v) || 0), 0);
// L'énoncé avec la réponse à sa place : « 0,3 + 0,7 = 1 ».
export const filled = (p, text) => p.q.replace(HOLE, text);
export const solved = (p) => filled(p, F(p.a));

// Enregistre une fiche terminée dans l'état (additif) : compteurs du jour et des familles pour les calculs RÉPONDUS,
// la fiche elle-même (nouvelle clé fiche), le record (rec, maximum à la fusion). Ne touche ni au niveau adaptatif ni aux calculs à revoir.
// stamp : « AAAA-MM-JJThh:mm:ss ». Retourne { stars, perfect, record: { best, before, beaten, first } }.
// Compte des réponses données (rows : { p, state: "ok" | "miss" | "todo" }) : jour, familles (créatures), compteurs.
export function countAnswers(s, rows, date) {
  const d = dayRec(s, date);
  for (const row of rows) {
    if (row.state === "todo") continue;
    s.c.tot++; d.tot++;
    const known = FAMILIES.some((f) => f.id === row.p.fam), fs = known ? famState(s, row.p.fam) : null;
    if (fs) fs.n++;
    if (row.state === "ok") { s.c.ok++; d.ok++; if (fs) { fs.xp++; d.fam[row.p.fam] = (d.fam[row.p.fam] || 0) + 1; } }
  }
}
export function recordFiche(s, { period, rhythm, score, secs, date, stamp }) {
  const x = rhythmById(rhythm);
  countAnswers(s, score.rows, date);
  const stars = starsFor(score.ok, score.total);
  s.c.sessions++; s.c.stars += stars;
  const perfect = score.ok === score.total;
  if (perfect) s.c.perfect++;
  s.fiche ||= {};
  s.fiche[stamp] = { p: period, r: x.id, ok: score.ok, n: score.answered, tot: score.total, t: Math.max(0, Math.round(secs)),
    miss: [...new Set(score.rows.filter((row) => row.state === "miss").map((row) => row.p.t))].sort() };
  s.c.fiche = (s.c.fiche || 0) + 1;
  s.rec ||= {};
  const key = recKey(period, x.id), before = s.rec[key] || 0, first = !(key in s.rec), beaten = !first && score.ok > before;
  if (score.ok > before || first) s.rec[key] = Math.max(before, score.ok);
  if (beaten) s.c.speed = (s.c.speed || 0) + 1; // trophée « Éclair » : battre son propre record
  return { stars, perfect, record: { best: s.rec[key], before, beaten, first } };
}
// Les fiches déjà faites, de la plus récente à la plus ancienne (pour « Mes fiches »).
export function ficheHistory(s) {
  return Object.entries(s.fiche || {}).filter(([, v]) => v && typeof v === "object").map(([k, v]) => ({ key: k, date: k.slice(0, 10), p: v.p, r: v.r, ok: Number(v.ok) || 0, n: Number(v.n) || 0, tot: Number(v.tot) || 0, t: Number(v.t) || 0, miss: Array.isArray(v.miss) ? v.miss : [] }))
    .sort((a, b) => (a.key < b.key ? 1 : -1));
}

// « Mes fiches » (v0.19) : les n dernières fiches, de la plus ancienne à la plus récente, pour la courbe de progrès.
export function ficheTrend(s, n = 8) {
  return ficheHistory(s).slice(0, n).reverse().map((f) => ({ ...f, pct: f.tot ? Math.round((100 * f.ok) / f.tot) : 0, icon: rhythmById(f.r).icon }));
}
// Les types de calcul à travailler après une fiche : ceux des erreurs d'abord, puis (s'il en manque) ceux des calculs pas faits.
export function revengeTypes(score, max = 3) {
  const by = (st) => [...new Set(score.rows.filter((x) => x.state === st).map((x) => x.p.t))];
  return [...new Set([...by("miss"), ...by("todo")])].slice(0, max);
}
export const REVENGE = { n: 10, secs: 120 };
