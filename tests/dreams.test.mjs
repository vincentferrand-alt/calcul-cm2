import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs"; import path from "node:path";
import { emptyState, merge, migrate, missingFrom } from "../js/state.js";
import { completeEvening, eveningRiddle } from "../js/evening.js";
import { dreamCards } from "../js/dreams.js";
import { setPick } from "../js/shop.js";
import { fmt } from "../js/generator.js";

const memo = (c, st, bg) => ({ c, st, bg, q: "47 + 38", a: 85, eq: true });

test("carnet de rêves : une carte par énigme faite, la plus récente d'abord, avec créature, forme, décor et calcul", () => {
  const s = emptyState();
  completeEvening(s, "2026-11-12", true, 1, memo("add", 2, "bg_lac"));
  completeEvening(s, "2026-11-14", false, 2, { c: "sub", st: 1, bg: "bg_nuit", q: "Double de 69", a: 138, eq: false });
  const cards = dreamCards(s, "add");
  assert.deepEqual(cards.map((c) => c.date), ["2026-11-14", "2026-11-12"]);
  assert.deepEqual({ c: cards[1].c, st: cards[1].st, bg: cards[1].bg, calc: cards[1].calc, legacy: cards[1].legacy }, { c: "add", st: 2, bg: "bg_lac", calc: "47 + 38 = 85", legacy: false });
  assert.equal(cards[0].calc, "Double de 69 : 138");
  assert.equal(s.eve["2026-11-14"].ok, false, "la carte existe même après deux essais (l'étoile aussi)");
});

test("carnet : les anciennes entrées (v0.12) utilisent la créature compagnon et son décor", () => {
  const s = emptyState(); s.fam.mul = { xp: 60, n: 60, lvl: 2, maxLvl: 2, recent: [] }; s.cre.mul = { s: 2, d: {} };
  s.decor.owned.bg_foret = "2026-11-01"; setPick(s, "mul", "bg", "bg_foret");
  s.eve["2026-11-10"] = { ok: true, n: 1 }; // format v0.12
  const [c] = dreamCards(s, "mul");
  assert.equal(c.legacy, true); assert.equal(c.c, "mul"); assert.equal(c.st, 2); assert.equal(c.bg, "bg_foret");
  const r = eveningRiddle(s, "2026-11-10", "mul").prob;
  assert.equal(c.calc, r.showEq ? `${r.q} = ${fmt(r.a)}` : `${r.q} : ${fmt(r.a)}`);
  assert.deepEqual(s.eve["2026-11-10"], { ok: true, n: 1 }, "aucune réécriture de l'ancienne entrée");
  const egg = dreamCards({ ...emptyState(), eve: { "2026-11-09": { ok: true, n: 1 } } }, "inconnu")[0];
  assert.equal(egg.c, "add"); assert.equal(egg.st, 0);
});

test("carnet : une donnée abîmée ne casse rien (décor ou forme inconnus)", () => {
  const s = emptyState(); s.eve["2026-11-11"] = { ok: true, n: 1, c: "add", st: 9, bg: "pas-un-decor", q: 3, a: "x" };
  const [c] = dreamCards(s, "add");
  assert.equal(c.st, 4); assert.equal(c.bg, "bg_prairie"); assert.match(c.calc, /[=:]/);
});

test("carnet : la fusion entre appareils garde toutes les cartes (union) et les souvenirs", () => {
  const a = emptyState(), b = emptyState();
  completeEvening(a, "2026-11-12", true, 1, memo("add", 2, "bg_lac"));
  completeEvening(b, "2026-11-13", true, 1, memo("sub", 1, "bg_prairie"));
  b.eve["2026-11-10"] = { ok: true, n: 1 }; // ancienne entrée sur l'autre appareil
  completeEvening(b, "2026-11-12", false, 2, memo("add", 1, "bg_prairie")); // ignorée : déjà faite ce jour-là sur b ? non : b ne l'avait pas
  const m = merge(a, b), m2 = merge(b, a);
  assert.deepEqual(JSON.parse(JSON.stringify(m)), JSON.parse(JSON.stringify(m2)), "commutatif");
  assert.deepEqual(Object.keys(m.eve).sort(), ["2026-11-10", "2026-11-12", "2026-11-13"]);
  assert.equal(dreamCards(m, "add").length, 3);
  assert.equal(m.eve["2026-11-12"].ok, true); assert.equal(m.eve["2026-11-12"].c, "add");
  assert.deepEqual(missingFrom(m, a), []); assert.deepEqual(missingFrom(m, b), []);
  assert.deepEqual(JSON.parse(JSON.stringify(merge(m, a))), JSON.parse(JSON.stringify(m)), "idempotent");
});

test("migration : toutes les anciennes sauvegardes de référence se lisent dans le carnet", () => {
  const dir = path.join(path.resolve(new URL(".", import.meta.url).pathname), "fixtures");
  for (const f of fs.readdirSync(dir)) {
    const s = migrate(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
    const cards = dreamCards(s, "add");
    assert.equal(cards.length, Object.keys(s.eve).length, f);
    for (const c of cards) assert.ok(c.calc && c.bg && c.c, f);
  }
});
