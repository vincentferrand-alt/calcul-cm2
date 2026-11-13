import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs"; import path from "node:path";
import { emptyState, merge, missingFrom, migrate } from "../js/state.js";
import { CREATURES, creatureSVG } from "../js/creatures.js";
import { ITEMS, SLOTS, itemById, itemIcon, dressing } from "../js/accessories.js";
import { owned, ownedCount, wornBy, balance, spent, buyDecor, hasDecor, decorCount, setPick, scenePick } from "../js/shop.js";
import { DECOR, KINDS, decorById, decorIcon, landSVG, weatherHTML, effectHTML, petHTML, timeOfDay, DEFAULT_BG } from "../js/decor.js";
import { lineById, checkTrophies, nextTier } from "../js/trophies.js";
import { randState } from "./helpers.mjs";
import { makeRng } from "../js/generator.js";

const bad = /NaN|undefined|null/;

test("créatures : 8 espèces dans l'ordre voulu, 4 formes et 4 histoires chacune, ids de sauvegarde inchangés", () => {
  assert.equal(CREATURES.length, 8);
  assert.deepEqual(CREATURES.map((c) => c.id).sort(), ["add", "comp", "dbl", "div", "frac", "mul", "sub", "trick"]);
  const order = ["dragon", "chat", "belette", "renard", "tigre", "kitsune", "loup", "kitsune"];
  CREATURES.forEach((c, i) => assert.ok(c.species.toLowerCase().includes(order[i]), `${c.id} ≠ ${order[i]}`));
  for (const c of CREATURES) { assert.equal(c.forms.length, 4); assert.equal(c.story.length, 4); }
});

test("anciens accessoires : toujours lisibles (ids stables), dessins valides", () => {
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length);
  for (const i of ITEMS) { assert.ok(SLOTS.some((s) => s.id === i.slot)); assert.match(itemIcon(i.id), /^<svg/); }
  for (const c of CREATURES) assert.ok(!/NaN|undefined/.test(creatureSVG(c.id, 3, "w", { head: "crown" })));
  assert.deepEqual(dressing(null), { back: "", front: "" });
  const s = emptyState(); s.shop.owned.crown = "d"; s.shop.worn.add = { head: { id: "crown", t: 1 } };
  assert.equal(owned(s, "crown"), true); assert.equal(ownedCount(s), 1); assert.deepEqual(wornBy(s, "add"), { head: "crown" });
});

test("décors : ids uniques et stables, types connus, prix croissants, un fond gratuit par défaut, dessins valides", () => {
  assert.equal(new Set(DECOR.map((d) => d.id)).size, DECOR.length);
  for (const d of DECOR) {
    assert.ok(KINDS.some((k) => k.id === d.kind), d.id); assert.ok(d.id.startsWith(d.kind + "_"), d.id);
    assert.ok(Number.isInteger(d.price) && d.price >= 0);
    assert.match(decorIcon(d.id), /^<svg/); assert.ok(!bad.test(decorIcon(d.id)), d.id);
  }
  assert.equal(decorById(DEFAULT_BG).price, 0);
  assert.deepEqual(DECOR.filter((d) => d.price === 0).map((d) => d.id), [DEFAULT_BG], "un seul décor offert : le fond par défaut");
  for (const k of KINDS) { const p = DECOR.filter((d) => d.kind === k.id).map((d) => d.price); assert.deepEqual(p, [...p].sort((a, b) => a - b), `prix croissants (${k.id})`); assert.ok(Math.min(...p.filter(Boolean)) <= 6, "début abordable"); }
  // Les ids publiés ne disparaissent jamais (sauvegardes) : liste figée.
  const f = path.join(path.resolve(new URL(".", import.meta.url).pathname), "decor-ids.json");
  for (const id of JSON.parse(fs.readFileSync(f, "utf8"))) assert.ok(decorById(id), `décor disparu : ${id}`);
  for (const d of DECOR.filter((x) => x.kind === "bg")) assert.ok(!bad.test(landSVG(d.id)), d.id);
  for (const d of DECOR.filter((x) => x.kind === "wx")) { const x = weatherHTML(d.id, false, 5); assert.ok(x.includes("<i") && !bad.test(x), d.id); assert.ok((x.match(/<i /g) || []).length <= 14, "peu de particules"); assert.ok((weatherHTML(d.id, true, 5).match(/<i /g) || []).length <= 7, "version légère"); }
  for (const d of DECOR.filter((x) => x.kind === "fx")) { const x = effectHTML(d.id, "#ffd84a"); assert.ok((x.back + x.front).length > 20 && !bad.test(x.back + x.front), d.id); }
  for (const d of DECOR.filter((x) => x.kind === "pet")) assert.ok(petHTML(d.id).length > 20 && !bad.test(petHTML(d.id)), d.id);
});

test("décors : aucune couleur rose dominante (palette bleu/turquoise/jaune)", () => {
  const all = DECOR.map((d) => decorIcon(d.id) + (d.kind === "bg" ? landSVG(d.id) : "") + JSON.stringify(effectHTML(d.id)) + petHTML(d.id) + weatherHTML(d.id)).join("");
  for (const [, hex] of all.matchAll(/#([0-9a-f]{6})\b/gi)) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    assert.ok(!(r > 200 && b > 150 && g < r - 40 && b > g + 10), `couleur rosée : #${hex}`);
  }
});

test("jour / soir / nuit selon l'heure", () => {
  assert.equal(timeOfDay(12), "day"); assert.equal(timeOfDay(8), "day"); assert.equal(timeOfDay(17), "day");
  assert.equal(timeOfDay(18), "eve"); assert.equal(timeOfDay(20), "eve"); assert.equal(timeOfDay(7), "eve");
  assert.equal(timeOfDay(21), "night"); assert.equal(timeOfDay(0), "night"); assert.equal(timeOfDay(5), "night");
});

test("achat de décor : solde = étoiles − décors possédés, jamais négatif, pas de doublon, le fond offert est déjà à elle", () => {
  const s = emptyState(); s.c.stars = 10;
  assert.equal(balance(s), 10); assert.equal(hasDecor(s, DEFAULT_BG), true); assert.equal(buyDecor(s, DEFAULT_BG, "d").why, "déjà");
  assert.equal(buyDecor(s, "bg_lac", "2026-11-14").ok, true); assert.equal(balance(s), 5); assert.equal(spent(s), 5);
  assert.equal(buyDecor(s, "bg_lac", "2026-11-15").why, "déjà"); assert.equal(s.decor.owned.bg_lac, "2026-11-14");
  const r = buyDecor(s, "bg_nuit", "d"); assert.equal(r.ok, false); assert.equal(r.missing, 15);
  assert.equal(buyDecor(s, "inconnu", "d").ok, false);
  s.c.stars = 0; assert.equal(balance(s), 0);
});

test("remboursement automatique des accessoires (v0.10) sans rien perdre", () => {
  // Une sauvegarde v0.10 : 30 étoiles gagnées, couronne (20) et casquette (4) achetées → solde v0.10 = 6.
  const old = { v: 1, c: { stars: 30 }, fam: {}, days: {}, tro: { "t_shop:1": "2026-11-10" }, cre: { add: { s: 2, d: {} } }, learn: {}, review: {}, daily: {}, rec: {}, m: { done: [], active: [] },
    shop: { owned: { crown: "2026-11-10", cap: "2026-11-11" }, worn: { add: { head: { id: "crown", t: 5 } } } } };
  const s = migrate(old);
  assert.equal(balance(s), 30, "les 24 étoiles des accessoires sont rendues");
  assert.deepEqual(Object.keys(s.shop.owned).sort(), ["cap", "crown"], "les achats d'accessoires restent dans la sauvegarde");
  assert.ok(s.tro["t_shop:1"]); assert.deepEqual(missingFrom(s, old), []);
  assert.equal(buyDecor(s, "bg_nuit", "d").ok, true); assert.equal(balance(s), 10);
  assert.ok(s.tro["t_shop:1"] && s.shop.owned.crown, "acheter un décor ne touche ni aux trophées ni aux anciens achats");
});

test("choix de la scène : fond, météo, effet, animal, forme parmi les stades débloqués", () => {
  const s = emptyState(); s.c.stars = 99; s.cre.add = { s: 3, d: {} };
  assert.deepEqual(scenePick(s, "add"), { st: 3, bg: DEFAULT_BG, wx: null, fx: null, pet: null });
  assert.equal(setPick(s, "add", "bg", "bg_lac", 1), false, "pas acheté");
  buyDecor(s, "bg_lac", "d"); buyDecor(s, "wx_neige", "d");
  assert.equal(setPick(s, "add", "bg", "bg_lac", 2), true); assert.equal(setPick(s, "add", "wx", "wx_neige", 2), true);
  assert.equal(setPick(s, "add", "wx", "bg_lac", 3), false, "mauvais type");
  assert.equal(setPick(s, "add", "bg", null, 3), false, "toujours un fond");
  assert.equal(setPick(s, "add", "st", 4, 3), false, "stade pas encore atteint"); assert.equal(setPick(s, "add", "st", 1, 3), true);
  assert.deepEqual(scenePick(s, "add"), { st: 1, bg: "bg_lac", wx: "wx_neige", fx: null, pet: null });
  assert.equal(setPick(s, "add", "wx", null, 4), true); assert.equal(scenePick(s, "add").wx, null);
  // Un choix abîmé ou inconnu (version future) retombe sur une valeur sûre.
  s.decor.pick.add.fx = { id: "fx_futur", t: 9 }; s.decor.pick.add.st = { id: 9, t: 9 };
  assert.equal(scenePick(s, "add").fx, null); assert.equal(scenePick(s, "add").st, 3);
});

test("trophée Décorateur (additif) ; Garde-robe gardée mais sans nouvel objectif", () => {
  const s = emptyState(); s.c.stars = 99;
  const t = lineById("t_decor"); assert.equal(t.value(s), 0);
  buyDecor(s, "bg_lac", "d"); assert.equal(decorCount(s), 1);
  const fresh = checkTrophies(s, "2026-11-14"); assert.ok(fresh.some((x) => x.id === "t_decor:1")); assert.ok(s.tro["t_decor:1"]);
  assert.equal(nextTier(s, lineById("t_shop")), null);
});

test("fusion : achats de décors jamais perdus, choix le plus récent gagne, idempotence / commutativité", () => {
  const rng = makeRng(11);
  for (let i = 0; i < 40; i++) {
    const a = randState(rng), b = randState(rng);
    const ab = merge(a, b), ba = merge(b, a);
    assert.deepEqual(ab, ba); assert.deepEqual(merge(ab, ab), ab);
    for (const id of Object.keys(a.decor.owned)) assert.ok(ab.decor.owned[id], "achat de décor perdu");
    assert.deepEqual(missingFrom(ab, a), []); assert.deepEqual(missingFrom(ab, b), []);
  }
  const p = emptyState(), q = emptyState();
  p.decor.owned.bg_lac = "2026-11-14"; q.decor.owned.wx_neige = "2026-11-13"; q.decor.owned.bg_lac = "2026-11-12";
  p.decor.pick.add = { bg: { id: "bg_lac", t: 300 }, st: { id: 2, t: 100 } }; q.decor.pick.add = { bg: { id: "bg_prairie", t: 200 }, st: { id: 4, t: 400 }, wx: { id: "wx_neige", t: 50 } };
  const m = merge(p, q);
  assert.deepEqual(Object.keys(m.decor.owned).sort(), ["bg_lac", "wx_neige"]); assert.equal(m.decor.owned.bg_lac, "2026-11-12", "date la plus ancienne");
  assert.equal(m.decor.pick.add.bg.id, "bg_lac"); assert.equal(m.decor.pick.add.st.id, 4); assert.equal(m.decor.pick.add.wx.id, "wx_neige");
});

test("migration : ancienne sauvegarde sans décors", () => {
  const old = { v: 1, c: { stars: 3 }, fam: {}, days: {}, tro: {}, cre: {}, learn: {}, review: {}, daily: {}, rec: {}, m: { done: [], active: [] } };
  const m = migrate(old); assert.deepEqual(m.decor, { owned: {}, pick: {} }); assert.deepEqual(m.shop, { owned: {}, worn: {} });
  assert.equal(hasDecor(m, "bg_lac"), false); assert.equal(balance(m), 3);
  const bent = migrate({ ...old, decor: { owned: 5, pick: [] } }); assert.deepEqual(bent.decor, { owned: {}, pick: {} });
});
