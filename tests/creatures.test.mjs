import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, merge, missingFrom } from "../js/state.js";
import { CREATURES, STAGE_XP, stageForXp, progressInfo, syncCreatures, featured, creatureSVG, creatureEgg } from "../js/creatures.js";
import { FAMILIES } from "../js/generator.js";
import { afterAnswer } from "../js/game.js";
import { generate, makeRng } from "../js/generator.js";

test("une créature par famille, couleurs distinctes, aucune rose", () => {
  assert.deepEqual(CREATURES.map((c) => c.fam).sort(), FAMILIES.map((f) => f.id).sort());
  assert.equal(new Set(CREATURES.map((c) => c.c2)).size, CREATURES.length);
  for (const c of CREATURES) for (const k of ["c1", "c2", "c3"]) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(c[k].slice(i, i + 2), 16));
    assert.ok(!(r > 200 && g < 140 && b > 140 && b < 220 && r - g > 70), `${c.id}.${k} ressemble à du rose`);
  }
});
test("stades : monotones, seuils exacts", () => {
  assert.equal(stageForXp(0), 0); assert.equal(stageForXp(9), 0); assert.equal(stageForXp(10), 1);
  assert.equal(stageForXp(49), 1); assert.equal(stageForXp(50), 2); assert.equal(stageForXp(150), 3); assert.equal(stageForXp(349), 3); assert.equal(stageForXp(350), 4); assert.equal(stageForXp(99999), 4);
  let last = 0; for (let x = 0; x < 500; x++) { const st = stageForXp(x); assert.ok(st >= last); last = st; }
  assert.equal(progressInfo(30).remaining, 20); assert.equal(progressInfo(30).pct, 50); assert.equal(progressInfo(400).pct, 100);
});
test("dessins : chaque créature x stade produit un SVG valide, ids uniques", () => {
  for (const c of CREATURES) for (let st = 0; st <= 4; st++) {
    const x = creatureSVG(c.id, st, "t");
    assert.match(x, /^<svg[\s\S]*<\/svg>$/); assert.ok(!/NaN|undefined|\$\{/.test(x), `${c.id}/${st}`);
    const ids = [...x.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]); assert.equal(new Set(ids).size, ids.length);
  }
  assert.ok(creatureEgg("add", 6, "e").includes("cracked") === false && creatureEgg("add", 6, "e").includes('stroke-linejoin="round" opacity=".9"'), "fissures à mi-chemin");
  assert.ok(!creatureEgg("add", 2, "e").includes('opacity=".9"/><path'), "œuf intact au début");
});
test("éclosion et évolution : événements, dates, jamais de régression", () => {
  const s = emptyState();
  s.fam.mul = { xp: 12, n: 20, lvl: 1, maxLvl: 1, recent: [] };
  let ev = syncCreatures(s, "2026-11-13");
  assert.deepEqual(ev, [{ id: "mul", from: 0, to: 1 }]); assert.equal(s.cre.mul.s, 1); assert.equal(s.cre.mul.d[1], "2026-11-13");
  assert.deepEqual(syncCreatures(s, "2026-11-14"), [], "idempotent");
  s.fam.mul.xp = 400; ev = syncCreatures(s, "2026-11-15");
  assert.deepEqual(ev, [{ id: "mul", from: 1, to: 4 }]); assert.deepEqual(Object.keys(s.cre.mul.d), ["1", "2", "3", "4"]);
  s.fam.mul.xp = 3; assert.deepEqual(syncCreatures(s, "2026-11-16"), []); assert.equal(s.cre.mul.s, 4, "le stade ne redescend pas");
  assert.equal(featured(s).c.id, "mul");
});
test("créatures : sûres à fusionner entre appareils", () => {
  const a = emptyState(), b = emptyState();
  a.cre.add = { s: 2, d: { 1: "2026-11-02", 2: "2026-11-09" } }; b.cre.add = { s: 1, d: { 1: "2026-11-01" } }; b.cre.div = { s: 1, d: { 1: "2026-11-05" } };
  const m = merge(a, b);
  assert.equal(m.cre.add.s, 2); assert.equal(m.cre.add.d[1], "2026-11-01"); assert.equal(m.cre.div.s, 1);
  assert.deepEqual(missingFrom(m, a), []); assert.deepEqual(missingFrom(m, b), []);
});
test("jeu réel : des bonnes réponses font éclore la créature de la famille", () => {
  const s = emptyState(), rng = makeRng(11); let born = null;
  for (let i = 0; i < 12 && !born; i++) {
    const prob = generate("div", 1, rng);
    const r = afterAnswer(s, { prob, ok: true, review: false, run: i, date: "2026-11-13", mode: "input", adapt: true });
    born = r.creatures.find((e) => e.id === "div") || null;
  }
  assert.ok(born && born.from === 0 && born.to === 1); assert.equal(s.cre.div.s, 1);
});
