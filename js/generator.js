// Générateur de calculs : 8 familles x 3 niveaux, avec astuce calculée pour chaque calcul,
// mauvaises réponses « typiques » pour les QCM et phrase dictée. Entiers positifs uniquement.
import { enLettres as nl } from "./numbers-fr.js";

export const FAMILIES = [
  { id: "add", mini: "Additions", name: "Additions", short: "+", color: "#ffb703", ink: "#3a2a00", blurb: "Additionner malin" },
  { id: "sub", mini: "Soustractions", name: "Soustractions", short: "−", color: "#4cc9f0", ink: "#04364f", blurb: "Soustraire sans se tromper" },
  { id: "mul", mini: "Multiplications", name: "Multiplications", short: "×", color: "#2f9e6f", ink: "#fff", blurb: "Tables et astuces de produits" },
  { id: "dbl", mini: "Doubles", name: "Doubles et triples", short: "×2", color: "#e8742a", ink: "#fff", blurb: "Doubles, triples, quadruples" },
  { id: "frac", mini: "Moitiés", name: "Moitiés et tiers", short: "½", color: "#7a68f0", ink: "#fff", blurb: "Moitiés, tiers, quarts" },
  { id: "comp", mini: "Compléments", name: "Compléments", short: "→", color: "#2ec4b6", ink: "#033a36", blurb: "Aller à 100, à 1 000…" },
  { id: "div", mini: "Divisions", name: "Divisions", short: "÷", color: "#c85a34", ink: "#fff", blurb: "Tables à l'envers, ÷ 2 et ÷ 4" },
  { id: "trick", mini: "Astuces", name: "Astuces ×4 ×8 ×25 ×50", short: "★", color: "#4f5ff0", ink: "#fff", blurb: "Les raccourcis des grands" },
];
export const famById = (id) => FAMILIES.find((f) => f.id === id);

// ---------- outils ----------
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const f = fmt;
const R = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export function shuffle(arr, r = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function draw(r, gen, ok) {
  for (let i = 0; i < 1000; i++) { const p = gen(); if (ok(p)) return p; }
  throw new Error("tirage impossible");
}
const TAB = [4, 6, 7, 8, 9];
const H = (stem, calc, steps, a) => ({ text: `${stem} = ${f(a)}`, calc, steps });
const colwise = (a, b) => {
  const L = Math.max(String(a).length, String(b).length);
  const A = String(a).padStart(L, "0"), B = String(b).padStart(L, "0");
  let s = ""; for (let i = 0; i < L; i++) s += Math.abs(+A[i] - +B[i]);
  return +s;
};

// ---------- astuces ----------
function addHint(a, b) {
  const s = a + b, u = b % 10;
  if (u >= 6) {
    const bb = b + 10 - u, d = 10 - u;
    return H(`${f(a)} + ${f(b)} → ${f(a)} + ${f(bb)} − ${d}`, `${a}+${bb}-${d}`, [
      { t: `J'arrondis ${f(b)} à ${f(bb)} : j'ajoute ${d} de trop`, eq: `${f(a)} + ${f(bb)} = ${f(a + bb)}` },
      { t: `Je retire les ${d} en trop`, eq: `${f(a + bb)} − ${d} = ${f(s)}` }], s);
  }
  const rest = b >= 100 ? b % 100 : u, big = b - rest;
  return H(`${f(a)} + ${f(b)} → ${f(a)} + ${f(big)} + ${rest}`, `${a}+${big}+${rest}`, [
    { t: `J'ajoute d'abord ${b >= 100 ? "les centaines" : "les dizaines"} de ${f(b)}`, eq: `${f(a)} + ${f(big)} = ${f(a + big)}` },
    { t: "Puis j'ajoute le reste", eq: `${f(a + big)} + ${rest} = ${f(s)}` }], s);
}
function subHint(a, b) {
  const s = a - b, u = b % 10;
  if (u >= 6) {
    const bb = b + 10 - u, d = 10 - u;
    return H(`${f(a)} − ${f(b)} → ${f(a)} − ${f(bb)} + ${d}`, `${a}-${bb}+${d}`, [
      { t: `J'arrondis ${f(b)} à ${f(bb)}`, eq: `${f(a)} − ${f(bb)} = ${f(a - bb)}` },
      { t: `J'ai retiré ${d} de trop : je les rends`, eq: `${f(a - bb)} + ${d} = ${f(s)}` }], s);
  }
  const rest = b >= 100 ? b % 100 : u, big = b - rest;
  return H(`${f(a)} − ${f(b)} → ${f(a)} − ${f(big)} − ${rest}`, `${a}-${big}-${rest}`, [
    { t: `Je retire d'abord ${b >= 100 ? "les centaines" : "les dizaines"} de ${f(b)}`, eq: `${f(a)} − ${f(big)} = ${f(a - big)}` },
    { t: "Puis je retire le reste", eq: `${f(a - big)} − ${rest} = ${f(s)}` }], s);
}
const near = (d) => (d === 9 ? 10 : d === 19 ? 20 : 100);
function addNHint(n, d) {
  const bb = near(d), s = n + d;
  return H(`${f(n)} + ${d} → ${f(n)} + ${bb} − ${bb - d}`, `${n}+${bb}-${bb - d}`, [
    { t: `J'ajoute ${bb} au lieu de ${d}`, eq: `${f(n)} + ${bb} = ${f(n + bb)}` },
    { t: `Je retire ce qui est en trop`, eq: `${f(n + bb)} − ${bb - d} = ${f(s)}` }], s);
}
function subNHint(n, d) {
  const bb = near(d), s = n - d;
  return H(`${f(n)} − ${d} → ${f(n)} − ${bb} + ${bb - d}`, `${n}-${bb}+${bb - d}`, [
    { t: `Je retire ${bb} au lieu de ${d}`, eq: `${f(n)} − ${bb} = ${f(n - bb)}` },
    { t: `Je rends ce que j'ai retiré en trop`, eq: `${f(n - bb)} + ${bb - d} = ${f(s)}` }], s);
}
function doubling(n, times, label) {
  const steps = []; let v = n;
  for (let i = 0; i < times; i++) {
    steps.push({ t: i === 0 ? `Je double ${f(n)}` : "Je double encore", eq: `${f(v)} × 2 = ${f(v * 2)}` });
    v *= 2;
  }
  return H(`${label}`, `${n}${"*2".repeat(times)}`, steps, v);
}
function tableHint(a, b) {
  const p = a * b;
  if (a === 9) return H(`9 × ${b} → 10 × ${b} − ${b}`, `10*${b}-${b}`, [
    { t: "9 fois, c'est 10 fois moins 1 fois", eq: `10 × ${b} = ${10 * b}` },
    { t: `Je retire un ${b}`, eq: `${10 * b} − ${b} = ${p}` }], p);
  if (a === 4) return doubling(b, 2, `4 × ${b} → double du double de ${b}`);
  if (a === 8) return doubling(b, 3, `8 × ${b} → je double trois fois ${b}`);
  if (a === 6) return H(`6 × ${b} → 5 × ${b} + ${b}`, `5*${b}+${b}`, [
    { t: `5 fois ${b}, c'est la moitié de ${10 * b}`, eq: `5 × ${b} = ${5 * b}` },
    { t: `J'ajoute encore un ${b}`, eq: `${5 * b} + ${b} = ${p}` }], p);
  return H(`7 × ${b} → 5 × ${b} + 2 × ${b}`, `5*${b}+2*${b}`, [
    { t: "Je coupe 7 en 5 + 2", eq: `5 × ${b} = ${5 * b} ; 2 × ${b} = ${2 * b}` },
    { t: "J'additionne", eq: `${5 * b} + ${2 * b} = ${p}` }], p);
}
function mulSplitHint(a, n) {
  const p = a * n, u = n % 10;
  if (u >= 7) {
    const nn = n + 10 - u, d = 10 - u;
    return H(`${a} × ${n} → ${a} × ${nn} − ${a} × ${d}`, `${a}*${nn}-${a}*${d}`, [
      { t: `J'arrondis ${n} à ${nn}`, eq: `${a} × ${nn} = ${f(a * nn)} ; ${a} × ${d} = ${a * d}` },
      { t: "Je retire ce qui est en trop", eq: `${f(a * nn)} − ${a * d} = ${f(p)}` }], p);
  }
  const t = n - u;
  return H(`${a} × ${n} → ${a} × ${t} + ${a} × ${u}`, `${a}*${t}+${a}*${u}`, [
    { t: `Je coupe ${n} en ${t} + ${u}`, eq: `${a} × ${t} = ${f(a * t)} ; ${a} × ${u} = ${a * u}` },
    { t: "J'additionne", eq: `${f(a * t)} + ${a * u} = ${f(p)}` }], p);
}
function splitTimes(n, m, word) {
  const u = n % 10, t = n - u, p = n * m;
  return H(`${word} de ${f(n)} → ${f(t)} × ${m} + ${u} × ${m}`, `${t}*${m}+${u}*${m}`, [
    { t: `Je ${m === 2 ? "double" : "triple"} les dizaines et les unités`, eq: `${f(t)} × ${m} = ${f(t * m)} ; ${u} × ${m} = ${u * m}` },
    { t: "J'additionne", eq: `${f(t * m)} + ${u * m} = ${f(p)}` }], p);
}
function halfHint(n, stem) {
  const r = n >= 100 ? n % 100 : n % 10, big = n - r;
  return H(`${stem} → ${f(big)} ÷ 2 + ${r} ÷ 2`, `${big}/2+${r}/2`, [
    { t: `Je coupe ${f(n)} en ${f(big)} et ${r}`, eq: `${f(big)} ÷ 2 = ${f(big / 2)} ; ${r} ÷ 2 = ${r / 2}` },
    { t: "J'additionne", eq: `${f(big / 2)} + ${r / 2} = ${f(n / 2)}` }], n / 2);
}
function thirdHint(n) {
  const t = Math.floor(n / 30) * 30, r = n - t;
  return H(`Tiers de ${f(n)} → ${f(t)} ÷ 3 + ${r} ÷ 3`, `${t}/3+${r}/3`, [
    { t: `Je coupe ${f(n)} en ${f(t)} et ${r} : faciles à partager en 3`, eq: `${f(t)} ÷ 3 = ${f(t / 3)} ; ${r} ÷ 3 = ${r / 3}` },
    { t: "J'additionne", eq: `${f(t / 3)} + ${r / 3} = ${f(n / 3)}` }], n / 3);
}
function quarterHint(n, stem) {
  return H(`${stem} → moitié de la moitié`, `${n}/2/2`, [
    { t: "Un quart, c'est la moitié de la moitié. La moitié :", eq: `${f(n)} ÷ 2 = ${f(n / 2)}` },
    { t: "Encore la moitié", eq: `${f(n / 2)} ÷ 2 = ${f(n / 4)}` }], n / 4);
}
function compHint(n, target) {
  const marks = []; let cur = n;
  const t10 = Math.ceil(n / 10) * 10;
  if (t10 > cur && t10 < target) { marks.push(t10); cur = t10; }
  if (target >= 200) { const t100 = Math.ceil(cur / 100) * 100; if (t100 > cur && t100 < target) { marks.push(t100); cur = t100; } }
  marks.push(target);
  const jumps = []; const steps = []; cur = n;
  for (const m of marks) { jumps.push(m - cur); steps.push({ t: steps.length === 0 ? "Je saute de nombre rond en nombre rond" : "Puis je continue", eq: `${f(cur)} + ${m - cur} = ${f(m)}` }); cur = m; }
  const ans = target - n;
  steps.push(jumps.length > 1
    ? { t: "J'additionne les sauts", eq: `${jumps.join(" + ")} = ${f(ans)}` }
    : { t: "Le saut, c'est la réponse", eq: `${f(target)} − ${f(n)} = ${f(ans)}` });
  return H(`${f(n)} → ${marks.map(f).join(" → ")} : ${jumps.join(" + ")}`, jumps.join("+"), steps, ans);
}
function x100Hint(n, k) { // k = 4 ou 2 : n x 25 = n x 100 ÷ 4 ; n x 50 = n x 100 ÷ 2
  const p = n * (100 / k);
  return H(`${n} × ${100 / k} → ${n} × 100 ÷ ${k}`, `${n}*100/${k}`, [
    { t: `${100 / k} × ${k} = 100 : je multiplie d'abord par 100`, eq: `${n} × 100 = ${f(n * 100)}` },
    { t: `Puis je divise par ${k}`, eq: `${f(n * 100)} ÷ ${k} = ${f(p)}` }], p);
}

// ---------- registre des types de calcul ----------
export const KINDS = {};
// Les niveaux sont numérotés 1 à 4. Les types écrits à l'origine avec les niveaux 1-3 sont décalés d'un cran (+1) ;
// le niveau 1 (« très facile ») est ajouté ensuite par easy().
function def(id, fam, levels, params, make) { KINDS[id] = { id, fam, levels: levels.map((l) => l + 1), params: (r, lvl) => params(r, lvl - 1), make }; }
function easy(id, fn) {
  const k = KINDS[id], old = k.params;
  k.levels = [1, ...k.levels];
  k.params = (r, lvl) => (lvl === 1 ? fn(r) : old(r, lvl));
}
const flip = (r) => r() < 0.5;
const pair = (flipped, a, b, sym) => (flipped ? `${f(b)} ${sym} ${f(a)}` : `${f(a)} ${sym} ${f(b)}`);
const sayPair = (flipped, a, b, word) => (flipped ? `${nl(b)} ${word} ${nl(a)}` : `${nl(a)} ${word} ${nl(b)}`);
const nz = (n) => n % 10 !== 0;

// --- Additions
def("add_2d", "add", [1], (r) => draw(r, () => ({ a: R(r, 12, 79), b: R(r, 12, 79) }), (p) => nz(p.a) && nz(p.b) && p.a % 10 + p.b % 10 >= 10),
  ({ a, b }) => {
    const s = a + b, bb = b + (10 - b % 10);
    return { q: `${a} + ${b}`, showEq: true, a: s, say: `${nl(a)} plus ${nl(b)}`, ops: [a, b], hint: addHint(a, b),
      err: [s - 10, s + 10, a + bb, s + 1, s - 1, a + b + 20] };
  });
def("add_3d2d", "add", [2], (r) => draw(r, () => ({ a: R(r, 101, 899), b: R(r, 12, 89) }), (p) => nz(p.a) && nz(p.b) && p.a % 10 + p.b % 10 >= 10),
  ({ a, b }) => {
    const s = a + b;
    return { q: `${f(a)} + ${b}`, showEq: true, a: s, say: `${nl(a)} plus ${nl(b)}`, ops: [a, b], hint: addHint(a, b), err: [s - 10, s + 10, s - 100, s + 100, s + 1, s - 1] };
  });
def("add_3d3d", "add", [3], (r) => draw(r, () => ({ a: R(r, 101, 799), b: R(r, 101, 799) }), (p) => p.a % 100 !== 0 && p.b % 100 !== 0),
  ({ a, b }) => {
    const s = a + b;
    return { q: `${a} + ${b}`, showEq: true, a: s, say: `${nl(a)} plus ${nl(b)}`, ops: [a, b], hint: addHint(a, b), err: [s - 100, s + 100, s - 10, s + 10, s - 1, s + 1] };
  });
def("add_n", "add", [1, 2, 3], (r, lvl) => {
  const d = pick(r, lvl === 1 ? [9] : lvl === 2 ? [19, 9] : [99, 19]);
  const [lo, hi] = d === 9 ? (lvl === 1 ? [21, 96] : [101, 497]) : d === 19 ? (lvl === 2 ? [21, 180] : [101, 899]) : [101, 899];
  return { n: draw(r, () => R(r, lo, hi), nz), d, flip: flip(r) };
}, ({ n, d, flip: fl }) => {
  const s = n + d, bb = near(d);
  return { q: pair(fl, n, d, "+"), showEq: true, a: s, say: sayPair(fl, n, d, "plus"), ops: [n, d], hint: addNHint(n, d), err: [n + bb, s - 10, s + 10, n + d + 1, s - 1, n + bb - 1 - d + 2] };
});

// --- Soustractions
def("sub_2d", "sub", [1], (r) => draw(r, () => { const a = R(r, 31, 99); return { a, b: R(r, 12, a - 8) }; }, (p) => nz(p.b) && p.a % 10 < p.b % 10),
  ({ a, b }) => {
    const s = a - b, bb = b + (10 - b % 10);
    return { q: `${a} − ${b}`, showEq: true, a: s, say: `${nl(a)} moins ${nl(b)}`, ops: [a, b], hint: subHint(a, b), err: [colwise(a, b), s + 10, s - 10, a - bb, s + 1, s - 1] };
  });
def("sub_3d2d", "sub", [2], (r) => draw(r, () => ({ a: R(r, 102, 600), b: R(r, 12, 89) }), (p) => nz(p.b) && p.a % 10 < p.b % 10 && p.a - p.b >= 20),
  ({ a, b }) => {
    const s = a - b, bb = b + (10 - b % 10);
    return { q: `${a} − ${b}`, showEq: true, a: s, say: `${nl(a)} moins ${nl(b)}`, ops: [a, b], hint: subHint(a, b), err: [colwise(a, b), s + 10, s - 10, a - bb, s + 100, s - 100] };
  });
def("sub_3d3d", "sub", [3], (r) => draw(r, () => { const a = R(r, 402, 999); return { a, b: R(r, 101, a - 40) }; }, (p) => nz(p.b) && p.a - p.b >= 20),
  ({ a, b }) => {
    const s = a - b, bb = b + (10 - b % 10);
    return { q: `${a} − ${b}`, showEq: true, a: s, say: `${nl(a)} moins ${nl(b)}`, ops: [a, b], hint: subHint(a, b), err: [colwise(a, b), s + 10, s - 10, a - bb, s + 100, s - 100] };
  });
def("sub_n", "sub", [1, 2, 3], (r, lvl) => {
  const d = pick(r, lvl === 1 ? [9] : lvl === 2 ? [19, 9] : [99, 19]);
  const [lo, hi] = d === 9 ? (lvl === 1 ? [31, 99] : [101, 499]) : d === 19 ? (lvl === 2 ? [41, 180] : [101, 899]) : [150, 999];
  return { n: draw(r, () => R(r, lo, hi), (n) => nz(n) && (d !== 9 || n % 10 !== 9)), d };
}, ({ n, d }) => {
  const s = n - d, bb = near(d);
  return { q: `${f(n)} − ${d}`, showEq: true, a: s, say: `${nl(n)} moins ${nl(d)}`, ops: [n, d], hint: subNHint(n, d), err: [n - bb, s + 10, s - 10, n - d - 1, s + 1, s - 1] };
});

// --- Multiplications
def("mul_table", "mul", [1], (r) => ({ a: pick(r, TAB), b: pick(r, TAB), flip: flip(r) }),
  ({ a, b, flip: fl }) => {
    const p = a * b;
    return { q: pair(fl, a, b, "×"), showEq: true, a: p, say: sayPair(fl, a, b, "fois"), ops: [a, b], hint: tableHint(a, b),
      err: [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, p + 10, p - 10] };
  });
def("mul_gap", "mul", [1, 2], (r, lvl) => {
  const x = pick(r, TAB), y = lvl === 1 ? pick(r, TAB) : pick(r, [11, 12]);
  return { x, y, hole: r() < 0.5 ? 0 : 1 };
}, ({ x, y, hole }) => {
  const p = x * y, known = hole === 0 ? y : x, ans = hole === 0 ? x : y;
  return { q: hole === 0 ? `? × ${y} = ${p}` : `${x} × ? = ${p}`, showEq: false, a: ans,
    say: hole === 0 ? `combien fois ${nl(y)} égale ${nl(p)}` : `${nl(x)} fois combien égale ${nl(p)}`, ops: [x, y],
    hint: H(`Cherche : ${hole === 0 ? "?" : x} × ${hole === 0 ? y : "?"} = ${p} → ${p} ÷ ${known}`, `${p}/${known}`, [
      { t: `Je cherche dans la table de ${known}`, eq: `${known} × ${ans} = ${p}` },
      { t: "Pour trouver le facteur qui manque, je divise", eq: `${p} ÷ ${known} = ${ans}` }], ans),
    err: [ans + 1, ans - 1, ans + 2, ans - 2, known + ans, ans + 10] };
});
def("mul_11", "mul", [2, 3], (r, lvl) => ({
  n: draw(r, () => (lvl === 2 ? R(r, 12, 49) : R(r, 26, 99)), (n) => nz(n) && (lvl === 2 ? Math.floor(n / 10) + n % 10 <= 9 : Math.floor(n / 10) + n % 10 >= 10)), flip: flip(r),
}), ({ n, flip: fl }) => {
  const p = n * 11, d1 = Math.floor(n / 10), d2 = n % 10;
  return { q: pair(fl, 11, n, "×"), showEq: true, a: p, say: sayPair(fl, 11, n, "fois"), ops: [11, n],
    hint: H(`11 × ${n} → ${n * 10} + ${n}`, `${n}*10+${n}`, [
      { t: "11 fois, c'est 10 fois plus 1 fois", eq: `10 × ${n} = ${n * 10}` },
      { t: `J'ajoute encore ${n}`, eq: `${n * 10} + ${n} = ${p}` }], p),
    err: [n * 10, p + 10, p - 10, +`${d1}${d1 + d2}${d2}`, n * 12, p + 1] };
});
def("mul_12", "mul", [2, 3], (r, lvl) => ({
  n: lvl === 2 ? pick(r, [6, 7, 8, 9, 11, 13, 14, 15, 16]) : draw(r, () => R(r, 21, 49), nz), flip: flip(r),
}), ({ n, flip: fl }) => {
  const p = n * 12;
  return { q: pair(fl, 12, n, "×"), showEq: true, a: p, say: sayPair(fl, 12, n, "fois"), ops: [12, n],
    hint: H(`12 × ${n} → 10 × ${n} + 2 × ${n}`, `10*${n}+2*${n}`, [
      { t: "12 = 10 + 2", eq: `10 × ${n} = ${n * 10} ; 2 × ${n} = ${n * 2}` },
      { t: "J'additionne", eq: `${n * 10} + ${n * 2} = ${p}` }], p),
    err: [n * 11, n * 13, n * 10 + n, p + 10, p - 10, p + 12] };
});
def("mul_1x2", "mul", [2, 3], (r, lvl) => ({ a: pick(r, TAB), n: draw(r, () => (lvl === 2 ? R(r, 12, 29) : R(r, 31, 99)), nz), flip: flip(r) }),
  ({ a, n, flip: fl }) => {
    const p = a * n, t = n - n % 10, u = n % 10;
    return { q: pair(fl, a, n, "×"), showEq: true, a: p, say: sayPair(fl, a, n, "fois"), ops: [a, n], hint: mulSplitHint(a, n),
      err: [a * t + u, p + 10, p - 10, a * t, p + a, p - a] };
  });
def("mul_10s", "mul", [2, 3], (r, lvl) => {
  const digits = lvl === 2 ? [4, 6, 7, 8, 9] : [3, 4, 6, 7, 8, 9];
  return { d1: pick(r, digits), d2: pick(r, digits) };
}, ({ d1, d2 }) => {
  const p = d1 * d2 * 100, a = d1 * 10, b = d2 * 10;
  return { q: `${a} × ${b}`, showEq: true, a: p, say: `${nl(a)} fois ${nl(b)}`, ops: [a, b],
    hint: H(`${a} × ${b} → ${d1} × ${d2} puis deux zéros`, `${d1}*${d2}*100`, [
      { t: `Je multiplie les dizaines : ${d1} × ${d2}`, eq: `${d1} × ${d2} = ${d1 * d2}` },
      { t: "J'ajoute les deux zéros qui étaient de côté", eq: `${d1 * d2} × 100 = ${f(p)}` }], p),
    err: [d1 * d2 * 10, d1 * d2 * 1000, d1 * d2, p + 100, p - 100, (d1 * d2 + 1) * 100] };
});

// --- Doubles, triples, quadruples
const rangeN = (lvl, a, b, c) => (lvl === 1 ? a : lvl === 2 ? b : c);
def("dbl_double", "dbl", [1, 2, 3], (r, lvl) => { const [lo, hi] = rangeN(lvl, [26, 99], [101, 399], [401, 999]); return { n: draw(r, () => R(r, lo, hi), nz) }; },
  ({ n }) => {
    const p = n * 2, u = n % 10, t = n - u;
    return { q: `Double de ${f(n)}`, showEq: false, a: p, say: `le double de ${nl(n)}`, ops: [n], hint: splitTimes(n, 2, "Double"),
      err: [2 * t + u, p + 10, p - 10, p + 1, p - 1, p + 100] };
  });
def("dbl_triple", "dbl", [1, 2, 3], (r, lvl) => { const [lo, hi] = rangeN(lvl, [12, 39], [41, 99], [101, 299]); return { n: draw(r, () => R(r, lo, hi), nz) }; },
  ({ n }) => {
    const p = n * 3;
    return { q: `Triple de ${f(n)}`, showEq: false, a: p, say: `le triple de ${nl(n)}`, ops: [n], hint: splitTimes(n, 3, "Triple"),
      err: [n * 2, n * 4, p + 10, p - 10, p + 1, p - 1] };
  });
def("dbl_quad", "dbl", [2, 3], (r, lvl) => { const [lo, hi] = lvl === 2 ? [13, 49] : [51, 199]; return { n: draw(r, () => R(r, lo, hi), nz) }; },
  ({ n }) => {
    const p = n * 4;
    return { q: `Quadruple de ${f(n)}`, showEq: false, a: p, say: `le quadruple de ${nl(n)}`, ops: [n],
      hint: doubling(n, 2, `Quadruple de ${f(n)} → double du double`), err: [n * 2, n * 3, p + 10, p - 10, p + 20, p - 20] };
  });

// --- Moitiés, tiers, quarts
def("frac_half", "frac", [1, 2, 3], (r, lvl) => {
  if (lvl === 1) return { n: draw(r, () => R(r, 16, 49) * 2, nz) };
  if (lvl === 2) return { n: draw(r, () => R(r, 51, 449) * 2, (n) => n % 100 !== 0) };
  return { n: draw(r, () => R(r, 151, 499) * 2, (n) => nz(n) && n % 100 !== 0) };
}, ({ n }) => ({ q: `Moitié de ${f(n)}`, showEq: false, a: n / 2, say: `la moitié de ${nl(n)}`, ops: [n], hint: halfHint(n, `Moitié de ${f(n)}`),
  err: [n / 4, n / 2 + 10, n / 2 - 10, n / 2 + 5, n / 2 - 5, n / 2 + 1] }));
def("frac_third", "frac", [1, 2, 3], (r, lvl) => {
  const [lo, hi] = rangeN(lvl, [12, 24], [25, 33], [40, 150]);
  return { n: draw(r, () => 3 * R(r, lo, hi), (n) => n % 30 !== 0) };
}, ({ n }) => ({ q: `Tiers de ${f(n)}`, showEq: false, a: n / 3, say: `le tiers de ${nl(n)}`, ops: [n], hint: thirdHint(n),
  err: [n / 2, n / 3 + 10, n / 3 - 10, n / 3 + 1, n / 3 - 1, n / 4 > 0 && Number.isInteger(n / 4) ? n / 4 : n / 3 + 2] }));
def("frac_quarter", "frac", [1, 2, 3], (r, lvl) => {
  const [lo, hi] = rangeN(lvl, [12, 24], [25, 60], [61, 249]);
  return { n: draw(r, () => 4 * R(r, lo, hi), (n) => lvl === 1 || n % 100 !== 0) };
}, ({ n }) => ({ q: `Quart de ${f(n)}`, showEq: false, a: n / 4, say: `le quart de ${nl(n)}`, ops: [n], hint: quarterHint(n, `Quart de ${f(n)}`),
  err: [n / 2, n / 4 + 10, n / 4 - 10, n / 8 === Math.floor(n / 8) ? n / 8 : n / 4 + 2, n / 4 + 5, n / 4 - 5] }));

// --- Compléments
def("comp_100", "comp", [1, 2], (r) => ({ n: draw(r, () => R(r, 11, 99), nz) }),
  ({ n }) => ({ q: `De ${n} à 100`, showEq: false, a: 100 - n, say: `combien pour aller de ${nl(n)} à cent`, ops: [n, 100], hint: compHint(n, 100),
    err: [99 - n, 100 - n + 10, 100 - n - 10, 10 - n % 10, 101 - n, 100 - n + 1] }));
def("comp_hund", "comp", [2, 3], (r) => ({ n: draw(r, () => R(r, 101, 899), (n) => n % 100 !== 0 && nz(n)) }),
  ({ n }) => { const t = Math.ceil(n / 100) * 100;
    return { q: `De ${n} à ${t}`, showEq: false, a: t - n, say: `combien pour aller de ${nl(n)} à ${nl(t)}`, ops: [n, t], hint: compHint(n, t),
      err: [t - n - 1, t - n + 10, t - n - 10, 10 - n % 10, t - n + 1, t - n + 100 > 0 ? t - n + 100 : 0] }; });
def("comp_1000", "comp", [2, 3], (r, lvl) => ({ n: lvl === 2 ? draw(r, () => R(r, 10, 99) * 10, (n) => n % 100 !== 0) : draw(r, () => R(r, 101, 899), (n) => nz(n) && n % 100 !== 0) }),
  ({ n }) => ({ q: `De ${n} à 1\u202f000`, showEq: false, a: 1000 - n, say: `combien pour aller de ${nl(n)} à mille`, ops: [n, 1000], hint: compHint(n, 1000),
    err: [999 - n, 1000 - n + 10, 1000 - n - 10, 1000 - n + 100, 1000 - n - 100, 100 - n % 100] }));

// --- Divisions
def("div_inv", "div", [1, 2, 3], (r, lvl) => {
  if (lvl === 1) return { d: pick(r, TAB), q: pick(r, TAB) };
  if (lvl === 2) return { d: pick(r, [4, 6, 7, 8, 9, 11, 12]), q: pick(r, [4, 6, 7, 8, 9, 11, 12, 13, 14, 15]) };
  return { d: pick(r, [6, 7, 8, 9, 11, 12]), q: R(r, 13, 19) };
}, ({ d, q }) => {
  const p = d * q;
  const steps = q < 11
    ? [{ t: `Quel nombre multiplié par ${d} donne ${p} ?`, eq: `${d} × ${q} = ${p}` }, { t: "Donc", eq: `${p} ÷ ${d} = ${q}` }]
    : [{ t: `Je retire 10 fois ${d}`, eq: `${p} − ${d * 10} = ${p - d * 10}` }, { t: `Je partage le reste par ${d}`, eq: `${p - d * 10} ÷ ${d} = ${q - 10}` }, { t: "J'ajoute les 10 déjà retirés", eq: `10 + ${q - 10} = ${q}` }];
  return { q: `${f(p)} ÷ ${d}`, showEq: true, a: q, say: `${nl(p)} divisé par ${nl(d)}`, ops: [p, d],
    hint: H(q < 11 ? `${p} ÷ ${d} → je cherche dans la table de ${d}` : `${p} ÷ ${d} → 10 fois ${d}, puis le reste`, `${p}/${d}`, steps, q),
    err: [q + 1, q - 1, q + 2, q - 2, q + 10, q > 12 ? q - 10 : q + 3] };
});
def("div_2", "div", [2, 3], (r, lvl) => ({ n: lvl === 2 ? draw(r, () => R(r, 26, 99) * 2, (n) => nz(n) && n % 100 !== 0) : draw(r, () => R(r, 101, 499) * 2, (n) => nz(n) && n % 100 !== 0) }),
  ({ n }) => ({ q: `${f(n)} ÷ 2`, showEq: true, a: n / 2, say: `${nl(n)} divisé par deux`, ops: [n, 2], hint: halfHint(n, `${f(n)} ÷ 2`),
    err: [n / 4, n / 2 + 10, n / 2 - 10, n / 2 + 1, n / 2 - 1, n / 2 + 5] }));
def("div_4", "div", [2, 3], (r, lvl) => ({ n: draw(r, () => 4 * (lvl === 2 ? R(r, 13, 24) : R(r, 26, 249)), (n) => n % 100 !== 0) }),
  ({ n }) => ({ q: `${f(n)} ÷ 4`, showEq: true, a: n / 4, say: `${nl(n)} divisé par quatre`, ops: [n, 4], hint: quarterHint(n, `${f(n)} ÷ 4`),
    err: [n / 2, n / 4 + 10, n / 4 - 10, n / 4 + 1, n / 4 - 1, n / 4 + 5] }));

// --- Astuces ×4 ×8 ×25 ×50
def("trick_x4", "trick", [1, 2, 3], (r, lvl) => { const [lo, hi] = rangeN(lvl, [13, 49], [51, 99], [101, 249]); return { n: draw(r, () => R(r, lo, hi), nz), flip: flip(r) }; },
  ({ n, flip: fl }) => {
    const p = n * 4;
    return { q: pair(fl, n, 4, "×"), showEq: true, a: p, say: sayPair(fl, n, 4, "fois"), ops: [n, 4],
      hint: doubling(n, 2, `${n} × 4 → double du double`), err: [n * 2, n * 3, p + 10, p - 10, p + 20, p - 4] };
  });
def("trick_x8", "trick", [2, 3], (r, lvl) => { const [lo, hi] = lvl === 2 ? [12, 40] : [41, 99]; return { n: draw(r, () => R(r, lo, hi), nz), flip: flip(r) }; },
  ({ n, flip: fl }) => {
    const p = n * 8;
    return { q: pair(fl, n, 8, "×"), showEq: true, a: p, say: sayPair(fl, n, 8, "fois"), ops: [n, 8],
      hint: doubling(n, 3, `${n} × 8 → je double trois fois`), err: [n * 4, n * 6, p + 10, p - 10, p + 8, p - 8] };
  });
def("trick_x25", "trick", [1, 2, 3], (r, lvl) => {
  if (lvl === 1) return { n: pick(r, [12, 16, 24, 28, 32, 36]), flip: flip(r) };
  if (lvl === 2) return { n: draw(r, () => 4 * R(r, 11, 25), nz), flip: flip(r) };
  return { n: draw(r, () => R(r, 13, 99), (n) => nz(n) && n % 4 !== 0), flip: flip(r) };
}, ({ n, flip: fl }) => {
  const p = n * 25;
  return { q: pair(fl, n, 25, "×"), showEq: true, a: p, say: sayPair(fl, n, 25, "fois"), ops: [n, 25], hint: x100Hint(n, 4),
    err: [p + 25, p - 25, p + 50, p - 50, n * 20, p + 100] };
});
def("trick_x50", "trick", [2, 3], (r, lvl) => ({ n: lvl === 2 ? draw(r, () => 2 * R(r, 6, 30), nz) : draw(r, () => R(r, 13, 99), nz), flip: flip(r) }),
  ({ n, flip: fl }) => {
    const p = n * 50;
    return { q: pair(fl, n, 50, "×"), showEq: true, a: p, say: sayPair(fl, n, 50, "fois"), ops: [n, 50], hint: x100Hint(n, 2),
      err: [n * 25, p + 50, p - 50, p + 100, p - 100, n * 5] };
  });

// --- Niveau 1 « très facile » : mêmes types de calcul, nombres plus petits, sans retenue ni emprunt quand c'est possible.
easy("add_2d", (r) => draw(r, () => ({ a: R(r, 12, 58), b: R(r, 11, 39) }), (p) => nz(p.a) && nz(p.b) && p.a % 10 + p.b % 10 < 10));
easy("sub_2d", (r) => draw(r, () => { const a = R(r, 32, 99); return { a, b: R(r, 11, a - 12) }; }, (p) => nz(p.b) && p.a % 10 >= p.b % 10 && p.a % 10 !== 0));
easy("mul_table", (r) => ({ a: pick(r, [4, 6]), b: pick(r, TAB), flip: flip(r) }));
easy("dbl_double", (r) => ({ n: draw(r, () => R(r, 12, 49), (n) => nz(n) && n % 10 < 5) }));
easy("dbl_triple", (r) => ({ n: draw(r, () => R(r, 12, 33), (n) => nz(n) && n % 10 <= 3) }));
easy("frac_half", (r) => ({ n: draw(r, () => R(r, 6, 24) * 2, nz) }));
easy("frac_third", (r) => ({ n: draw(r, () => 3 * R(r, 12, 16), (n) => n % 30 !== 0) }));
easy("frac_quarter", (r) => ({ n: draw(r, () => 4 * R(r, 12, 17), (n) => n % 10 !== 0) }));
easy("comp_100", (r) => ({ n: draw(r, () => R(r, 11, 99), (n) => n % 5 === 0 && n % 10 !== 0) }));
easy("div_inv", (r) => ({ d: pick(r, [4, 6]), q: pick(r, TAB) }));
easy("trick_x4", (r) => ({ n: draw(r, () => R(r, 12, 25), nz), flip: flip(r) }));
easy("trick_x25", (r) => ({ n: pick(r, [8, 12, 16, 24]), flip: flip(r) }));

// ---------- construction / génération ----------
export function build(kind, p) {
  const k = KINDS[kind];
  if (!k) throw new Error("type de calcul inconnu : " + kind);
  const out = k.make(p);
  const seen = new Set([out.a]);
  const err = [];
  for (const v of out.err) if (Number.isInteger(v) && v > 0 && !seen.has(v)) { seen.add(v); err.push(v); }
  return { k: kind, fam: k.fam, p, key: `${kind}|${out.q}`, ...out, err };
}

export const MAX_LEVEL = 4;
export const kindsFor = (fam, level) => Object.values(KINDS).filter((k) => k.fam === fam && k.levels.includes(level));

export function generate(fam, level, rng = Math.random, opts = {}) {
  let ks = kindsFor(fam, level);
  if (opts.kinds) {
    const sub = ks.filter((k) => opts.kinds.includes(k.id));
    ks = sub.length ? sub : Object.values(KINDS).filter((k) => k.fam === fam && opts.kinds.includes(k.id));
  }
  const kind = pick(rng, ks);
  const lvl = kind.levels.includes(level) ? level : kind.levels.reduce((b, l) => (Math.abs(l - level) < Math.abs(b - level) ? l : b));
  const prob = build(kind.id, kind.params(rng, lvl));
  prob.lvl = lvl;
  return prob;
}

// QCM : 3 mauvaises réponses issues d'erreurs typiques (complétées au besoin), positions mélangées.
export function choices(prob, rng = Math.random) {
  const a = prob.a, seen = new Set([a]), wrong = [];
  const take = (v) => { if (wrong.length < 3 && Number.isInteger(v) && v > 0 && !seen.has(v)) { seen.add(v); wrong.push(v); } };
  const plausible = shuffle(prob.err.filter((v) => v >= a / 3 && v <= a * 3), rng);
  plausible.forEach(take);
  shuffle(prob.err, rng).forEach(take);
  const step = a >= 100 ? 10 : a >= 20 ? 10 : 1;
  for (const v of [a + step, a - step, a + 1, a - 1, a + 2, a - 2, a + 2 * step, a - 2 * step, a + 3, a + 5, a + 7]) take(v);
  return shuffle([a, ...wrong], rng);
}
