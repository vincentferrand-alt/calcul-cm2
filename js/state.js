// État de progression : versionné, migrations ADDITIVES uniquement, fusion sans perte.
//
// Règles d'or (exigence absolue : ne JAMAIS perdre un trophée) :
//  - on n'efface ni ne renomme jamais une clé ; on n'en ajoute que de nouvelles (migrate() ne fait que compléter) ;
//  - merge(a, b) = union des trophées/créatures/fiches/jours, maximum des compteurs ; jamais « le dernier gagne » ;
//  - merge est idempotent, commutatif et associatif (testé) : l'ordre des synchronisations n'a aucune importance.

export const SCHEMA = 1;
export const COUNTERS = ["ok", "tot", "perfect", "learn", "dict", "daily", "easy", "speed", "missions", "sessions", "stars", "streakBest"];

export function emptyState() {
  return {
    v: SCHEMA,
    c: Object.fromEntries(COUNTERS.map((k) => [k, 0])), // compteurs (fusion : maximum)
    fam: {},      // par famille : { xp, n, lvl, maxLvl, recent[] }
    days: {},     // par jour AAAA-MM-JJ : { ok, tot, fam:{}, learn:[], easy:[] } — sert aussi à « Ma semaine »
    tro: {},      // trophées gagnés : "id:palier" -> date (jamais retirés)
    cre: {},      // créatures : id -> { s: stade max atteint, d: { stade: date } }
    learn: {},    // fiches lues : id -> date
    review: {},   // calculs à revoir : clé -> { k, p, box, due, miss, done, doneAt }
    daily: {},    // défis du jour : date -> { done, ok, n, stars }
    rec: {},      // records personnels (défis de temps)
    shop: { owned: {}, worn: {} }, // v0.10 : accessoires achetés (id -> date) et portés — conservés en lecture (plus en vente)
    decor: { owned: {}, pick: {} }, // v0.11 : décors achetés (id -> date) et choix par créature (créature -> type -> { id, t })
    eve: {},      // v0.12 : énigmes du soir : date -> { ok, n } (une par jour ; chacune rapporte une étoile)
    m: { active: [], done: [] }, // missions en cours / identifiants des missions terminées
  };
}

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const clone = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));

// Complète un état (ancienne version, import, synchro) sans rien supprimer.
export function migrate(raw) {
  const s = isObj(raw) ? clone(raw) : {};
  const base = emptyState();
  s.v = Number.isFinite(s.v) ? Math.max(s.v, 1) : 1; // une version plus récente est conservée telle quelle
  for (const [k, def] of Object.entries(base)) {
    if (k === "v") continue;
    if (!isObj(s[k])) s[k] = def;
  }
  for (const c of COUNTERS) if (!Number.isFinite(s.c[c])) s.c[c] = 0;
  if (!isObj(s.shop.owned)) s.shop.owned = {};
  if (!isObj(s.shop.worn)) s.shop.worn = {};
  if (!isObj(s.decor.owned)) s.decor.owned = {};
  if (!isObj(s.decor.pick)) s.decor.pick = {};
  if (!Array.isArray(s.m.active)) s.m.active = [];
  if (!Array.isArray(s.m.done)) s.m.done = [];
  return s;
}

// ---------- fusion ----------
const maxN = (a, b) => Math.max(Number(a) || 0, Number(b) || 0);
const minStr = (a, b) => (!a ? b : !b ? a : a < b ? a : b);
const uniq = (...arrs) => [...new Set(arrs.flat())].sort();
const sj = (x) => JSON.stringify(x);

function mergeMap(a, b, fn) {
  a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
  const out = {};
  for (const k of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    out[k] = k in a && k in b ? fn(a[k], b[k], k) : clone(k in a ? a[k] : b[k]);
  }
  return out;
}

// Repli générique pour les clés inconnues : nombres -> max, tableaux -> union, objets -> récursif.
function mergeAny(a, b) {
  if (a === undefined) return clone(b);
  if (b === undefined) return clone(a);
  if (sj(a) === sj(b)) return clone(a);
  if (typeof a === "number" && typeof b === "number") return Math.max(a, b);
  if (typeof a === "boolean" && typeof b === "boolean") return a || b;
  if (Array.isArray(a) && Array.isArray(b)) {
    const seen = new Map();
    for (const x of [...a, ...b]) seen.set(sj(x), x);
    return [...seen.entries()].sort((p, q) => (p[0] < q[0] ? -1 : 1)).map(([, v]) => clone(v));
  }
  if (isObj(a) && isObj(b)) return mergeMap(a, b, mergeAny);
  return sj(a) >= sj(b) ? clone(a) : clone(b);
}

const famRank = (x) => String(x.n || 0).padStart(9, "0") + sj(x.recent || []) + (x.lvl || 1);
const mergeFam = (a, b) => {
  const win = famRank(a) >= famRank(b) ? a : b;
  return { ...mergeAny(isObj(a) ? a : {}, isObj(b) ? b : {}), xp: maxN(a.xp, b.xp), n: maxN(a.n, b.n), maxLvl: maxN(a.maxLvl, b.maxLvl) || 1,
    lvl: win.lvl || 1, recent: clone(win.recent || []) };
};
const mergeDay = (a, b) => ({ ...mergeAny(a, b), ok: maxN(a.ok, b.ok), tot: maxN(a.tot, b.tot),
  fam: mergeMap(a.fam, b.fam, maxN), learn: uniq(a.learn || [], b.learn || []), easy: uniq(a.easy || [], b.easy || []) });
const mergeReview = (a, b) => {
  const win = (a.box || 0) > (b.box || 0) ? a : (b.box || 0) > (a.box || 0) ? b : (a.due || "") >= (b.due || "") ? a : b;
  const out = { ...mergeAny(a, b), k: win.k, p: clone(win.p), box: maxN(a.box, b.box), due: win.due, miss: maxN(a.miss, b.miss),
    done: !!(a.done || b.done) };
  const d = minStr(a.doneAt, b.doneAt);
  if (d) out.doneAt = d; else delete out.doneAt;
  return out;
};
const mergeMission = (a, b) => ({ ...mergeAny(a, b), progress: maxN(a.progress, b.progress), done: !!(a.done || b.done) });

export function merge(x, y) {
  const a = migrate(x), b = migrate(y);
  const out = mergeAny(a, b); // clés inconnues : conservées
  out.v = Math.max(a.v, b.v);
  out.c = mergeMap(a.c, b.c, maxN);
  out.fam = mergeMap(a.fam, b.fam, mergeFam);
  out.days = mergeMap(a.days, b.days, mergeDay);
  out.tro = mergeMap(a.tro, b.tro, minStr);
  out.cre = mergeMap(a.cre, b.cre, (p, q) => ({ ...mergeAny(p, q), s: maxN(p.s, q.s), d: mergeMap(p.d, q.d, minStr) }));
  out.learn = mergeMap(a.learn, b.learn, minStr);
  out.review = mergeMap(a.review, b.review, mergeReview);
  out.daily = mergeMap(a.daily, b.daily, (p, q) => ({ ...mergeAny(p, q), done: !!(p.done || q.done), ok: maxN(p.ok, q.ok), n: maxN(p.n, q.n), stars: maxN(p.stars, q.stars) }));
  out.rec = mergeMap(a.rec, b.rec, maxN);
  out.eve = mergeMap(a.eve, b.eve, (p, q) => ({ ...mergeAny(p, q), ok: !!(p.ok || q.ok), n: maxN(p.n, q.n) }));
  const done = uniq(a.m.done, b.m.done);
  const byId = mergeMap(Object.fromEntries(a.m.active.map((m) => [m.id, m])), Object.fromEntries(b.m.active.map((m) => [m.id, m])), mergeMission);
  // Au plus 3 missions actives (celles qui sont le plus avancées ; à égalité, ordre des identifiants) : le choix est déterministe,
  // donc deux appareils qui fusionnent aboutissent à la même liste et ne se « renvoient » jamais des missions en boucle.
  const ratio = (m) => (m.target ? Math.min(1, (m.progress || 0) / m.target) : 0);
  const active = Object.values(byId).filter((m) => !m.done && !done.includes(m.id))
    .sort((p, q) => ratio(q) - ratio(p) || (p.id < q.id ? -1 : p.id > q.id ? 1 : 0)).slice(0, 3).sort((p, q) => (p.id < q.id ? -1 : p.id > q.id ? 1 : 0));
  out.m = { ...mergeAny(a.m, b.m), done, active };
  // Boutique : les accessoires achetés s'additionnent (date la plus ancienne) ; ce qui est porté suit le choix le plus récent.
  const latest = (p, q) => { const d = (p.t || 0) - (q.t || 0); return d > 0 ? p : d < 0 ? q : sj(p) >= sj(q) ? p : q; };
  out.shop = { ...mergeAny(a.shop, b.shop), owned: mergeMap(a.shop.owned, b.shop.owned, minStr),
    worn: mergeMap(a.shop.worn, b.shop.worn, (x, y) => mergeMap(x, y, latest)) };
  // Décors : mêmes règles (achats additionnés ; fond, météo, effet, animal et forme affichée : le choix le plus récent gagne).
  out.decor = { ...mergeAny(a.decor, b.decor), owned: mergeMap(a.decor.owned, b.decor.owned, minStr),
    pick: mergeMap(a.decor.pick, b.decor.pick, (x, y) => mergeMap(x, y, latest)) };
  return out;
}

// Pour les tests et l'import : compare « ce qui ne doit jamais disparaître ».
export function missingFrom(big, small) {
  const lost = [];
  const s = migrate(small), b = migrate(big);
  for (const k of Object.keys(s.tro)) if (!(k in b.tro)) lost.push("tro:" + k);
  for (const k of Object.keys(s.cre)) if (!(k in b.cre) || b.cre[k].s < s.cre[k].s) lost.push("cre:" + k);
  for (const k of Object.keys(s.learn)) if (!(k in b.learn)) lost.push("learn:" + k);
  for (const k of Object.keys((s.shop || {}).owned || {})) if (!((b.shop || {}).owned || {})[k]) lost.push("shop:" + k);
  for (const k of Object.keys((s.decor || {}).owned || {})) if (!((b.decor || {}).owned || {})[k]) lost.push("decor:" + k);
  for (const k of Object.keys(s.days)) if (!(k in b.days) || b.days[k].ok < s.days[k].ok) lost.push("days:" + k);
  for (const k of Object.keys(s.c)) if ((b.c[k] || 0) < s.c[k]) lost.push("c:" + k);
  for (const k of Object.keys(s.fam)) if (!(k in b.fam) || b.fam[k].xp < s.fam[k].xp) lost.push("fam:" + k);
  for (const k of Object.keys(s.rec)) if ((b.rec[k] || 0) < s.rec[k]) lost.push("rec:" + k);
  for (const k of Object.keys(s.eve || {})) if (!(k in (b.eve || {}))) lost.push("eve:" + k);
  for (const k of Object.keys(s.daily)) if (s.daily[k].done && !(b.daily[k] && b.daily[k].done)) lost.push("daily:" + k);
  return lost;
}

// ---------- fichier de sauvegarde de secours ----------
export function exportData(state, version) {
  return JSON.stringify({ app: "calcul-cm2", schema: SCHEMA, version, exportedAt: new Date().toISOString(), state }, null, 1);
}
// L'import FUSIONNE : il ne peut qu'ajouter.
export function importData(text, current) {
  let obj;
  try { obj = JSON.parse(text); } catch { throw new Error("Ce fichier n'est pas une sauvegarde valide."); }
  if (!isObj(obj) || obj.app !== "calcul-cm2" || !isObj(obj.state)) throw new Error("Ce fichier n'est pas une sauvegarde de Calcul CM2.");
  return merge(current, obj.state);
}
