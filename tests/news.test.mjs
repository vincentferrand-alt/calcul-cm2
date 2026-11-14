import test from "node:test";
import assert from "node:assert/strict";
import { emptyNews, mergeNews, newsSummary, isEmpty } from "../js/news.js";
import { tabFor, showsTabs } from "../js/ui/tabs.js";

const t = (id) => ({ id, tier: 1 });

test("nouvelles : rien → pas de bandeau", () => {
  assert.equal(newsSummary(emptyNews()), null); assert.ok(isEmpty(mergeNews(null, null)));
});

test("nouvelles : tout est regroupé en UN bandeau court, sans doublon", () => {
  let n = mergeNews(emptyNews(), { trophies: [t("t_calc:1"), t("t_calc:2")], creatures: [{ id: "add", from: 1, to: 2 }], stars: 0 });
  n = mergeNews(n, { trophies: [t("t_calc:2"), t("t_eve:1")], creatures: [{ id: "add", from: 2, to: 3 }], stars: 3 });
  assert.equal(n.trophies.length, 3); assert.deepEqual(n.creatures, [{ id: "add", from: 1, to: 3 }]); assert.equal(n.stars, 3);
  const s = newsSummary(n);
  assert.equal(s.text, "Braise a évolué ! · 3 nouveaux trophées · +3 ⭐"); assert.equal(s.target, "album");
});

test("nouvelles : un appui mène au bon écran", () => {
  assert.equal(newsSummary({ trophies: [t("a:1")], creatures: [], stars: 2 }).target, "trophees");
  assert.equal(newsSummary({ trophies: [], creatures: [], stars: 2 }).target, "boutique");
  assert.equal(newsSummary({ trophies: [], creatures: [{ id: "sub", from: 0, to: 1 }, { id: "mul", from: 1, to: 2 }], stars: 0 }).text, "2 créatures ont grandi !");
  assert.equal(newsSummary({ trophies: [], creatures: [{ id: "sub", from: 0, to: 1 }] }).text, "Mistral est né !");
  assert.equal(newsSummary({ trophies: [t("a:1")], creatures: [] }).text, "1 nouveau trophée");
  assert.equal(newsSummary({ trophies: [], creatures: [{ id: "inconnu", from: 0, to: 1 }] }), null, "une créature inconnue est ignorée");
});

test("onglets : sous-écrans rattachés, cachés pendant une partie", () => {
  assert.equal(tabFor(""), ""); assert.equal(tabFor("fiche"), "exercices"); assert.equal(tabFor("apprendre"), "exercices");
  assert.equal(tabFor("album"), "album"); assert.equal(tabFor("reglages"), null);
  assert.equal(showsTabs("jouer"), false); assert.equal(showsTabs("profil"), false); assert.equal(showsTabs("trophees"), true);
});
