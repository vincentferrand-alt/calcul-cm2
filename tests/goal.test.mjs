import test from "node:test";
import assert from "node:assert/strict";
import { emptyState } from "../js/state.js";
import { syncCreatures, CREATURES } from "../js/creatures.js";
import { growthOf, homeGoal, homeCreature, nearEvolution, closestToGrow, unit } from "../js/goal.js";

const withXp = (xps) => { const s = emptyState(); for (const [f, xp] of Object.entries(xps)) s.fam[f] = { xp, n: xp, lvl: 1, maxLvl: 1, recent: [] }; syncCreatures(s, "2026-11-14"); return s; };

test("unités : singulier / pluriel", () => {
  assert.equal(unit("add", 1), "1 addition"); assert.equal(unit("add", 18), "18 additions");
  assert.equal(unit("dbl", 2), "2 calculs de doubles"); assert.equal(unit("comp", 1), "1 complément");
});

test("objectif de l'accueil : prochaine évolution du compagnon", () => {
  const s = withXp({ add: 32 }); // Braise bébé (10), jeune à 50
  assert.equal(homeCreature(s, null).id, "add");
  const g = homeGoal(s, "add");
  assert.equal(g.text, "Prochaine évolution de Braise : encore 18 additions");
  assert.equal(g.target, "add"); assert.equal(g.remaining, 18); assert.equal(g.pct, 55); assert.equal(g.fam, "add");
});

test("objectif de l'accueil : l'œuf à faire éclore", () => {
  const s = withXp({ sub: 4 });
  const hc = homeCreature(s, "add"); // compagnon pas encore éclos : ignoré
  assert.deepEqual(hc, { id: "sub", stage: 0 });
  const g = homeGoal(s, hc.id);
  assert.equal(g.text, "Encore 6 soustractions pour faire éclore l'œuf"); assert.equal(g.pct, 40);
  assert.deepEqual(homeCreature(emptyState(), null), { id: "add", stage: 0 }, "rien joué : l'œuf du dragon");
});

test("objectif de l'accueil : stade maximum → autre créature la plus proche d'évoluer", () => {
  const s = withXp({ add: 400, mul: 45, sub: 140 });
  const g = homeGoal(s, "add");
  assert.equal(g.target, "mul"); assert.equal(g.remaining, 5);
  assert.match(g.text, /Braise est au maximum ! Prochain objectif : Filou, encore 5 multiplications/);
  const all = withXp(Object.fromEntries(CREATURES.map((c) => [c.fam, 999])));
  assert.equal(homeGoal(all, "add").target, null);
  assert.equal(closestToGrow(all), null);
});

test("compagnon choisi : il passe avant la créature la plus avancée", () => {
  const s = withXp({ add: 400, sub: 12 });
  assert.equal(homeCreature(s, "sub").id, "sub"); assert.equal(homeCreature(s, null).id, "add");
});

test("fin de série : « Encore 5 additions et Braise évolue ! » seulement à ≤ 10", () => {
  const s = withXp({ add: 45, sub: 30 });
  assert.equal(nearEvolution(s, ["add"]).text, "Encore 5 additions et Braise évolue !");
  assert.equal(nearEvolution(s, ["sub"]), null, "20 de plus : trop loin");
  assert.equal(nearEvolution(s, "mix").id, "add", "mélange : la plus proche de toutes");
  assert.equal(nearEvolution(withXp({ sub: 30 }), "mix").id, "add", "un œuf à 10 bonnes réponses compte aussi");
  const e = withXp({ div: 7 });
  assert.equal(nearEvolution(e, ["div"]).text, "Encore 3 divisions et l'œuf éclot !");
  assert.equal(nearEvolution(withXp({ add: 999 }), ["add"]), null);
});

test("croissance : jamais incohérente avec un stade plus haut que l'expérience (fusion)", () => {
  const s = withXp({ add: 20 }); s.cre.add.s = 3;
  const g = growthOf(s, "add");
  assert.equal(g.stage, 3); assert.ok(g.remaining >= 1); assert.ok(g.pct >= 0 && g.pct <= 100);
});
