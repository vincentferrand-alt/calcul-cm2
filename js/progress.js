// Règles de progression (pures : elles modifient l'état qu'on leur passe, sans toucher au navigateur).
import { addDays } from "./dates.js";
import { build, generate, FAMILIES, KINDS, shuffle } from "./generator.js";

export const INTERVALS = [1, 3, 7, 14]; // jours avant de revoir un calcul raté : 4 réussites espacées = « devenu facile »

export const famState = (s, id) => (s.fam[id] ||= { xp: 0, n: 0, lvl: 1, maxLvl: 1, recent: [] });
export const dayRec = (s, date) => (s.days[date] ||= { ok: 0, tot: 0, fam: {}, learn: [], easy: [] });

// Enregistre une réponse. ctx : { date, mode, review (calcul servi en révision), adapt (défaut true) }
export function recordAnswer(s, prob, ok, ctx) {
  const ev = {}, date = ctx.date;
  s.c.tot++;
  const d = dayRec(s, date); d.tot++;
  const fs = famState(s, prob.fam); fs.n++;
  if (ok) {
    s.c.ok++; d.ok++; fs.xp++;
    d.fam[prob.fam] = (d.fam[prob.fam] || 0) + 1;
    if (ctx.mode === "dictee") s.c.dict++;
  }
  // niveau adaptatif : on monte avec les réussites, on redescend d'un cran sans drame pour consolider
  if (ctx.adapt !== false && prob.lvl === fs.lvl) {
    fs.recent.push(ok ? 1 : 0); if (fs.recent.length > 10) fs.recent.shift();
    if (fs.recent.length >= 8) {
      const ratio = fs.recent.reduce((a, b) => a + b, 0) / fs.recent.length;
      if (ratio >= 0.85 && fs.lvl < 3) { fs.lvl++; fs.maxLvl = Math.max(fs.maxLvl, fs.lvl); fs.recent = []; ev.levelUp = { fam: prob.fam, to: fs.lvl }; }
      else if (ratio <= 0.4 && fs.lvl > 1) { fs.lvl--; fs.recent = []; ev.levelDown = { fam: prob.fam, to: fs.lvl }; }
    }
  }
  // révision espacée
  const r = s.review[prob.key];
  if (!ok) {
    ev.missed = true;
    if (!r) s.review[prob.key] = { k: prob.k, p: prob.p, box: 0, due: addDays(date, 1), miss: 1, done: false };
    else { r.miss = (r.miss || 0) + 1; if (!r.done) { r.box = 0; r.due = addDays(date, 1); } }
  } else if (r && !r.done && ctx.review && r.due <= date) {
    r.box++;
    if (r.box >= INTERVALS.length) {
      r.done = true; r.doneAt = date; s.c.easy++;
      if (!d.easy.includes(prob.key)) d.easy.push(prob.key);
      ev.mastered = prob.key;
    } else r.due = addDays(date, INTERVALS[r.box]);
  }
  return ev;
}

export function dueReviews(s, date) {
  return Object.values(s.review).filter((r) => !r.done && r.due <= date && KINDS[r.k]).sort((a, b) => (a.due < b.due ? -1 : 1));
}

export function starsFor(ok, total) {
  if (!total) return 0;
  const r = ok / total;
  return r >= 0.9 ? 3 : r >= 0.65 ? 2 : 1; // toujours au moins une étoile
}

export function endSession(s, info) {
  const stars = starsFor(info.ok, info.total);
  s.c.sessions++; s.c.stars += stars;
  const perfect = info.total >= 5 && info.ok === info.total;
  if (perfect) s.c.perfect++;
  return { stars, perfect };
}

// Compose une série de calculs : calculs à revoir (environ 1 sur 4) + calculs neufs au niveau de chaque famille.
export function buildSession(s, opts, rng = Math.random, date) {
  const fams = !opts.families || opts.families === "mix" ? FAMILIES.map((f) => f.id) : opts.families;
  const count = opts.count || 10, list = [], keys = new Set();
  if (!opts.noReview) {
    const kindOk = (k) => (!opts.kinds || opts.kinds.includes(k)) && fams.includes(KINDS[k].fam);
    const due = shuffle(dueReviews(s, date).filter((r) => kindOk(r.k)), rng).slice(0, Math.round(count * 0.25));
    for (const r of due) { const p = build(r.k, r.p); if (!keys.has(p.key)) { keys.add(p.key); list.push({ ...p, lvl: s.fam[p.fam]?.lvl || 1, review: true }); } }
  }
  const order = shuffle(fams, rng); let i = 0, guard = 0;
  while (list.length < count && guard++ < count * 40) {
    const fam = order[i++ % order.length];
    const lvl = s.fam[fam]?.lvl || 1;
    const p = generate(fam, lvl, rng, opts.kinds ? { kinds: opts.kinds } : {});
    if (keys.has(p.key)) continue;
    keys.add(p.key); list.push(p);
  }
  return shuffle(list, rng);
}

// Une fiche « Apprendre » vient d'être travaillée (la date du premier passage est conservée).
export function markLearn(s, id, date) {
  const first = !s.learn[id];
  if (first) { s.learn[id] = date; s.c.learn = Object.keys(s.learn).length; }
  const d = dayRec(s, date);
  if (!d.learn.includes(id)) d.learn.push(id);
  return first;
}
