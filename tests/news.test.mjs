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

import { overspent, overspendNotice, balance, spent, starsEarned, OVERSPENT_TEXT } from "../js/shop.js";
import { merge, emptyState as empty2, missingFrom } from "../js/state.js";
import { newsSummary as summary2, mergeNews as mergeN2, isEmpty as isEmpty2 } from "../js/news.js";

test("v0.14.1 : double dépense entre appareils → rien n'est retiré, solde 0, explication une seule fois", () => {
  const base = empty2(); base.c.stars = 10;
  const a = JSON.parse(JSON.stringify(base)); a.decor.owned.bg_foret = "2026-11-14"; // 8 ⭐ sur le téléphone
  const b = JSON.parse(JSON.stringify(base)); b.decor.owned.bg_plage = "2026-11-14"; // 10 ⭐ sur l'iMac, avec les mêmes étoiles
  assert.equal(overspent(a), false); assert.equal(overspent(b), false);
  const m = merge(a, b);
  assert.ok(m.decor.owned.bg_foret && m.decor.owned.bg_plage, "les deux achats restent");
  assert.deepEqual(missingFrom(m, a), []); assert.deepEqual(missingFrom(m, b), []);
  assert.equal(spent(m), 18); assert.equal(starsEarned(m), 10); assert.equal(balance(m), 0, "jamais négatif");
  assert.equal(overspendNotice(a, m), true, "la fusion le provoque : on explique");
  assert.equal(overspendNotice(m, merge(m, b)), false, "déjà expliqué : pas une deuxième fois");
  assert.equal(overspendNotice(a, a), false);
  const sum = summary2({ overspent: true, stars: 0 });
  assert.equal(sum.text, OVERSPENT_TEXT); assert.equal(sum.target, "boutique"); assert.ok(sum.long);
  assert.match(OVERSPENT_TEXT, /Tes deux appareils ont fait des achats en même temps : ton solde repart de 0, tu gardes tout ce que tu as acheté\./);
  assert.equal(isEmpty2({ overspent: true }), false);
  assert.equal(mergeN2({ overspent: true }, { stars: 2 }).overspent, true);
  assert.match(summary2({ overspent: true, stars: 2 }).text, /^Tes deux appareils.* · \+2 ⭐$/);
});
