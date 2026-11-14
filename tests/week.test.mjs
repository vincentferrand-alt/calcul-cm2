import test from "node:test";
import assert from "node:assert/strict";
import { weekSummary } from "../js/week.js";
import { emptyState, merge } from "../js/state.js";

test("Ma semaine : 7 pastilles du lundi au dimanche, jours joués et bonnes réponses de la semaine", () => {
  const s = emptyState();
  s.days["2026-11-09"] = { ok: 12, tot: 15, fam: {}, learn: [], easy: [] }; // lundi
  s.days["2026-11-11"] = { ok: 0, tot: 3, fam: {}, learn: [], easy: [] }; // joué, aucune bonne réponse
  s.days["2026-11-14"] = { ok: 8, tot: 10, fam: {}, learn: [], easy: [] }; // samedi = aujourd'hui
  s.days["2026-11-08"] = { ok: 99, tot: 99, fam: {}, learn: [], easy: [] }; // dimanche d'avant : pas compté
  const w = weekSummary(s, "2026-11-14");
  assert.deepEqual(w.days.map((d) => d.letter).join(""), "LMMJVSD");
  assert.deepEqual(w.days.map((d) => (d.played ? 1 : 0)), [1, 0, 1, 0, 0, 1, 0]);
  assert.equal(w.ok, 20); assert.equal(w.played, 3);
  assert.equal(w.days[5].today, true); assert.equal(w.days[6].future, true); assert.equal(w.days[0].future, false);
  assert.equal(weekSummary(emptyState(), "2026-11-14").ok, 0);
  // fusion de deux appareils : le maximum de chaque jour (rien n'est compté deux fois)
  const b = emptyState(); b.days["2026-11-14"] = { ok: 10, tot: 12, fam: {}, learn: [], easy: [] };
  assert.equal(weekSummary(merge(s, b), "2026-11-14").ok, 22);
  assert.equal(weekSummary(s, "2026-11-16").ok, 0, "lundi suivant : nouvelle semaine");
});
