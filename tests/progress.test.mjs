import test from "node:test";
import assert from "node:assert/strict";
import { emptyState } from "../js/state.js";
import { recordAnswer, buildSession, dueReviews, starsFor, endSession, INTERVALS } from "../js/progress.js";
import { build, generate, makeRng, FAMILIES } from "../js/generator.js";

const rng = makeRng(42);
const mk = (fam = "add", lvl = 1) => generate(fam, lvl, rng);

test("réponse juste : compteurs, jour et xp de la famille", () => {
  const s = emptyState(), p = mk();
  recordAnswer(s, p, true, { date: "2026-11-13", mode: "qcm" });
  assert.equal(s.c.ok, 1); assert.equal(s.c.tot, 1);
  assert.equal(s.days["2026-11-13"].ok, 1); assert.equal(s.fam.add.xp, 1);
  assert.deepEqual(s.review, {});
});

test("réponse fausse : aucune sanction, le calcul est programmé pour revenir demain", () => {
  const s = emptyState(), p = mk();
  const ev = recordAnswer(s, p, false, { date: "2026-11-13", mode: "qcm" });
  assert.ok(ev.missed);
  assert.equal(s.c.ok, 0); assert.equal(s.fam.add.xp, 0);
  assert.equal(s.review[p.key].due, "2026-11-14");
  assert.equal(dueReviews(s, "2026-11-13").length, 0);
  assert.equal(dueReviews(s, "2026-11-14").length, 1);
});

test("révision espacée : intervalles croissants jusqu'à « devenu facile »", () => {
  const s = emptyState(), p = mk(); let day = "2026-11-13";
  recordAnswer(s, p, false, { date: day });
  const dues = [];
  for (let i = 0; i < INTERVALS.length; i++) {
    day = s.review[p.key].due; dues.push(day);
    const ev = recordAnswer(s, p, true, { date: day, review: true });
    if (i < INTERVALS.length - 1) assert.ok(!ev.mastered && !s.review[p.key].done, "pas encore maîtrisé");
    else assert.equal(ev.mastered, p.key);
  }
  assert.equal(dues.length, 4);
  assert.ok(s.review[p.key].done); assert.equal(s.c.easy, 1);
  assert.deepEqual(s.days[day].easy, [p.key]);
  assert.equal(dueReviews(s, "2027-01-01").length, 0);
});

test("révision : une nouvelle erreur repart de zéro sans rien supprimer", () => {
  const s = emptyState(), p = mk();
  recordAnswer(s, p, false, { date: "2026-11-13" });
  recordAnswer(s, p, true, { date: "2026-11-14", review: true });
  assert.equal(s.review[p.key].box, 1);
  recordAnswer(s, p, false, { date: "2026-11-17", review: true });
  assert.equal(s.review[p.key].box, 0); assert.equal(s.review[p.key].miss, 2);
});

test("réussir hors révision (ou trop tôt) ne fait pas avancer le calcul à revoir", () => {
  const s = emptyState(), p = mk();
  recordAnswer(s, p, false, { date: "2026-11-13" });
  recordAnswer(s, p, true, { date: "2026-11-13", review: false });
  assert.equal(s.review[p.key].box, 0);
});

test("niveau adaptatif : monte avec les réussites, redescend doucement, jamais hors 1..4", () => {
  const s = emptyState();
  for (let i = 0; i < 8; i++) recordAnswer(s, mk("add", 1), true, { date: "2026-11-13" });
  assert.equal(s.fam.add.lvl, 2); assert.equal(s.fam.add.maxLvl, 2);
  for (let i = 0; i < 8; i++) recordAnswer(s, mk("add", 2), false, { date: "2026-11-13" });
  assert.equal(s.fam.add.lvl, 1); assert.equal(s.fam.add.maxLvl, 2, "le meilleur niveau atteint est conservé");
  for (let i = 0; i < 40; i++) recordAnswer(s, mk("add", 1), false, { date: "2026-11-13" });
  assert.equal(s.fam.add.lvl, 1);
  for (let i = 0; i < 90; i++) recordAnswer(s, mk("sub", s.fam.sub?.lvl || 1), true, { date: "2026-11-13" });
  assert.equal(s.fam.sub.lvl, 4);
});

test("niveau adaptatif : l'entraînement d'une fiche (adapt:false) ne change pas le niveau", () => {
  const s = emptyState();
  for (let i = 0; i < 12; i++) recordAnswer(s, mk("add", 1), true, { date: "2026-11-13", adapt: false });
  assert.equal(s.fam.add.lvl, 1);
});

test("étoiles : au moins une, jamais zéro quand on a joué", () => {
  assert.equal(starsFor(0, 10), 1); assert.equal(starsFor(7, 10), 2); assert.equal(starsFor(9, 10), 3); assert.equal(starsFor(0, 0), 0);
  const s = emptyState(); const r = endSession(s, { ok: 10, total: 10 });
  assert.equal(r.stars, 3); assert.ok(r.perfect); assert.equal(s.c.perfect, 1); assert.equal(s.c.sessions, 1);
});

test("série : bonne taille, sans doublons, mélange de toutes les familles, avec rappel des calculs ratés", () => {
  const s = emptyState(), date = "2026-11-13";
  for (const f of FAMILIES) for (let i = 0; i < 3; i++) recordAnswer(s, generate(f.id, 1, rng), false, { date: "2026-11-01" });
  const list = buildSession(s, { count: 20, families: "mix" }, rng, date);
  assert.equal(list.length, 20);
  assert.equal(new Set(list.map((p) => p.key)).size, 20);
  assert.ok(new Set(list.map((p) => p.fam)).size >= 7);
  const rev = list.filter((p) => p.review);
  assert.ok(rev.length >= 1 && rev.length <= 5, `calculs à revoir : ${rev.length}`);
});

test("série : une famille / des types précis seulement", () => {
  const s = emptyState();
  const list = buildSession(s, { count: 15, families: ["mul"], kinds: ["mul_11"] }, rng, "2026-11-13");
  assert.ok(list.every((p) => p.k === "mul_11"));
  const l2 = buildSession(s, { count: 10, families: ["div"] }, rng, "2026-11-13");
  assert.ok(l2.every((p) => p.fam === "div"));
});

test("rejouer : jamais deux séries identiques", () => {
  const s = emptyState(), a = buildSession(s, { count: 20 }, Math.random, "2026-11-13"), b = buildSession(s, { count: 20 }, Math.random, "2026-11-13");
  assert.notDeepEqual(a.map((p) => p.key), b.map((p) => p.key));
});
