import test from "node:test";
import assert from "node:assert/strict";
import { GAMES, gameById, launchGame } from "../js/games.js";
import { FAMILIES } from "../js/generator.js";
import { TABS, tabFor, showsTabs, COLLECTION } from "../js/ui/tabs.js";

test("jouer : les jeux ont un nom, une icône et une phrase courte", () => {
  assert.ok(GAMES.length >= 3);
  assert.equal(new Set(GAMES.map((g) => g.id)).size, GAMES.length);
  for (const g of GAMES) { assert.ok(g.icon && g.name && g.sub); assert.ok(g.name.length <= 12 && g.sub.length <= 26, g.id); }
  assert.equal(gameById("nimporte").id, "serie", "jeu inconnu → la série");
});

test("jouer : série, dictée et course se lancent avec le bon thème et les bons réglages", () => {
  const a = launchGame("serie", "mix", { answer: "input", count: 15 });
  assert.deepEqual(a, { route: "jouer", opts: { families: "mix", count: 15, mode: "input", back: "exercices" } });
  assert.equal(launchGame("serie", "mul", {}).opts.mode, "qcm"); assert.deepEqual(launchGame("serie", "mul", {}).opts.families, ["mul"]);
  assert.equal(launchGame("serie", "mul", { count: 999 }).opts.count, 10, "nombre de calculs inconnu → 10");
  const d = launchGame("dictee", "frac", { answer: "qcm", count: 20 });
  assert.equal(d.route, "jouer"); assert.equal(d.opts.mode, "dictee"); assert.deepEqual(d.opts.families, ["frac"]); assert.equal(d.opts.count, 20);
  const c = launchGame("course", "add", { count: 20 });
  assert.deepEqual(c, { route: "course", opts: { families: ["add"], count: 10, mode: "course", back: "exercices" } });
  assert.equal(launchGame("course", "inconnue", {}).opts.families, "mix", "thème inconnu → mélange");
  for (const f of FAMILIES) assert.deepEqual(launchGame("serie", f.id, {}).opts.families, [f.id]);
});

test("familles : un nom court pour les tuiles de thème", () => {
  for (const f of FAMILIES) assert.ok(f.mini && f.mini.length <= 15, f.id);
});

test("onglets v0.17 : Accueil · Jouer · Apprendre · Collection · Boutique", () => {
  assert.deepEqual(TABS.map((t) => t.label), ["Accueil", "Jouer", "Apprendre", "Collection", "Boutique"]);
  assert.deepEqual(TABS.map((t) => t.id), ["", "exercices", "apprendre", "album", "boutique"]);
  for (const t of TABS) assert.ok(t.label.length <= 10, "libellé court : " + t.label);
  assert.deepEqual(COLLECTION.map((c) => c[0]), ["album", "carnet", "trophees"]);
  for (const [id] of COLLECTION) { assert.equal(tabFor(id), "album"); assert.ok(showsTabs(id)); }
  assert.equal(tabFor("fiche"), "apprendre");
});
