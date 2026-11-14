import test from "node:test";
import assert from "node:assert/strict";
import { de, elide, badDe } from "../js/fr.js";
import { FAMILIES } from "../js/generator.js";
import { TEMPLATES, missionText } from "../js/missions.js";
import { LINES } from "../js/trophies.js";
import { FICHES } from "../js/learn.js";
import { CREATURES } from "../js/creatures.js";
import { homeGoal } from "../js/goal.js";
import { emptyState } from "../js/state.js";
import { syncCreatures } from "../js/creatures.js";

test("de / d' : élision devant une voyelle ou un h muet", () => {
  assert.equal(de("additions"), "d'additions");
  assert.equal(de("astuces ×4 ×8 ×25 ×50"), "d'astuces ×4 ×8 ×25 ×50");
  assert.equal(de("Aurore"), "d'Aurore");
  assert.equal(de("soustractions"), "de soustractions");
  assert.equal(de("heures"), "d'heures"); assert.equal(de("hiboux"), "de hiboux"); assert.equal(de("héros"), "de héros");
  assert.equal(de("œufs"), "d'œufs"); assert.equal(de("Yuzu"), "de Yuzu");
  assert.equal(elide(""), false);
});

test("les 8 familles : jamais « de a/e/i/o/u/h muet »", () => {
  const got = Object.fromEntries(FAMILIES.map((f) => [f.id, de(f.name.toLowerCase())]));
  assert.equal(got.add, "d'additions"); assert.equal(got.trick, "d'astuces ×4 ×8 ×25 ×50");
  assert.equal(got.sub, "de soustractions"); assert.equal(got.mul, "de multiplications"); assert.equal(got.dbl, "de doubles et triples");
  assert.equal(got.frac, "de moitiés et tiers"); assert.equal(got.comp, "de compléments"); assert.equal(got.div, "de divisions");
});

test("tous les textes de missions, de trophées, de fiches et d'objectifs sont bien élidés", () => {
  const texts = [];
  for (const f of FAMILIES) texts.push(missionText({ tpl: "fam", params: { fam: f.id }, target: 10 }));
  for (const [tpl, t] of Object.entries(TEMPLATES)) if (tpl !== "fam") for (const params of [{}, { mode: "qcm" }, { mode: "input" }]) { try { texts.push(t.text({ tpl, params, target: 3 }, "2026-11-14")); } catch { /* paramètres sans objet */ } }
  for (const l of LINES) for (const n of l.tiers) texts.push(l.desc(n), l.name);
  const walk = (o) => { if (typeof o === "string") texts.push(o); else if (o && typeof o === "object") Object.values(o).forEach(walk); };
  walk(FICHES); walk(CREATURES);
  for (const c of CREATURES) { const s = emptyState(); s.fam[c.fam] = { xp: 20, n: 20, lvl: 1, maxLvl: 1, recent: [] }; syncCreatures(s, "2026-11-14"); texts.push(homeGoal(s, c.id).text); }
  const bad = texts.flatMap((t) => badDe(t).map((b) => `${b} ← ${t}`));
  assert.deepEqual(bad, []);
  assert.ok(texts.includes("Réussis 10 calculs d'additions"));
  assert.ok(texts.includes("Réussir 20 calculs d'astuces ×4 ×8 ×25 ×50"));
  assert.ok(texts.some((t) => t.startsWith("Prochaine évolution d'Aurore")));
});
