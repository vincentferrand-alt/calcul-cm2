import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, merge, missingFrom, migrate } from "../js/state.js";
import { CREATURES, creatureSVG } from "../js/creatures.js";
import { ITEMS, SLOTS, itemById, itemIcon, dressing } from "../js/accessories.js";
import { owned, ownedCount, balance, buy, toggleWear, wornBy } from "../js/shop.js";
import { lineById } from "../js/trophies.js";
import { randState } from "./helpers.mjs";
import { makeRng } from "../js/generator.js";

test("créatures : 8 espèces dans l'ordre voulu, 4 formes et 4 histoires chacune, ids de sauvegarde inchangés", () => {
  assert.equal(CREATURES.length, 8);
  assert.deepEqual(CREATURES.map((c) => c.id).sort(), ["add", "comp", "dbl", "div", "frac", "mul", "sub", "trick"]);
  assert.equal(CREATURES.find((c) => c.id === "add").species.toLowerCase().includes("dragon"), true, "le premier est un dragon");
  const order = ["dragon", "chat", "belette", "renard", "tigre", "kitsune", "loup", "kitsune"];
  CREATURES.forEach((c, i) => assert.ok(c.species.toLowerCase().includes(order[i]) || c.name.toLowerCase().includes(order[i]) || c.forms.join(" ").toLowerCase().includes(order[i]), `${c.id} ≠ ${order[i]}`));
  for (const c of CREATURES) { assert.equal(c.forms.length, 4); assert.equal(c.story.length, 4); }
});
test("accessoires : ids uniques, emplacements connus, dessins valides, icône pour chacun", () => {
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length);
  const slots = SLOTS.map((s) => s.id);
  for (const i of ITEMS) {
    assert.ok(slots.includes(i.slot)); assert.ok(i.price > 0 && Number.isInteger(i.price));
    assert.ok(i.front && !/NaN|undefined/.test(i.front + (i.back || "")), i.id);
    assert.match(itemIcon(i.id), /^<svg/);
  }
  for (const c of CREATURES) {
    const worn = { head: "crown", face: "stars", neck: "cape" };
    const x = creatureSVG(c.id, 3, "w", worn);
    assert.ok(x.includes(itemById("crown").front.slice(0, 30)) && !/NaN|undefined/.test(x), c.id);
    const ids = [...x.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]); assert.equal(new Set(ids).size, ids.length);
  }
  assert.deepEqual(dressing(null), { back: "", front: "" });
});
test("achat : solde = étoiles - achats, jamais négatif, pas de doublon", () => {
  const s = emptyState(); s.c.stars = 10;
  assert.equal(balance(s), 10);
  assert.equal(buy(s, "cap", "2026-11-01").ok, true); assert.equal(balance(s), 6);
  assert.equal(buy(s, "cap", "2026-11-02").why, "déjà"); assert.equal(s.shop.owned.cap, "2026-11-01");
  const r = buy(s, "crown", "2026-11-02"); assert.equal(r.ok, false); assert.equal(r.missing, 14);
  assert.equal(buy(s, "n'existe-pas", "x").ok, false);
  s.c.stars = 0; assert.equal(balance(s), 0);
});
test("porter : un seul accessoire par emplacement, retirer, impossible sans l'avoir acheté", () => {
  const s = emptyState(); s.c.stars = 50;
  assert.equal(toggleWear(s, "add", "cap"), null);
  buy(s, "cap", "d"); buy(s, "beanie", "d");
  assert.deepEqual(toggleWear(s, "add", "cap"), { head: "cap" });
  assert.deepEqual(toggleWear(s, "add", "beanie"), { head: "beanie" });
  assert.deepEqual(toggleWear(s, "add", "beanie"), {});
  assert.deepEqual(wornBy(s, "sub"), {});
});
test("trophée Garde-robe", () => {
  const s = emptyState(); s.c.stars = 99;
  const t = lineById("t_shop");
  assert.equal(t.value(s), 0);
  buy(s, "cap", "d"); assert.equal(t.value(s), 1); assert.equal(ownedCount(s), 1);
});
test("fusion : les achats ne se perdent jamais, idempotence / commutativité", () => {
  const rng = makeRng(7);
  for (let i = 0; i < 40; i++) {
    const a = randState(rng), b = randState(rng);
    const ab = merge(a, b), ba = merge(b, a);
    assert.deepEqual(ab, ba); assert.deepEqual(merge(ab, ab), ab);
    for (const id of Object.keys(a.shop.owned)) assert.ok(ab.shop.owned[id], "achat perdu");
    assert.deepEqual(missingFrom(ab, a), []); assert.deepEqual(missingFrom(ab, b), []);
  }
});
test("fusion : le choix porté le plus récent gagne ; ancienne sauvegarde sans boutique", () => {
  const a = emptyState(), b = emptyState();
  a.shop.owned.cap = "d"; b.shop.owned.cap = "d";
  a.shop.worn.add = { head: { id: "cap", t: 100 } }; b.shop.worn.add = { head: { id: null, t: 200 } };
  assert.equal(merge(a, b).shop.worn.add.head.id, null);
  const old = { v: 1, c: { stars: 3 }, fam: {}, days: {}, tro: {}, cre: {}, learn: {}, review: {}, daily: {}, rec: {}, m: { done: [], active: [] } };
  const m = migrate(old); assert.deepEqual(m.shop, { owned: {}, worn: {} }); assert.equal(owned(m, "cap"), false);
});
