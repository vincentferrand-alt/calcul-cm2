import test from "node:test";
import assert from "node:assert/strict";
import { FAMILIES, KINDS, build, generate, choices, kindsFor, makeRng, fmt } from "../js/generator.js";
import { checkEq, answerFromSay } from "./helpers.mjs";

const PER = 600; // tirages par type de calcul et par niveau
const TOO_SIMPLE = new Set([0, 1, 2, 3, 5, 10]);
const rng = makeRng(20261113);

function allProblems(count = PER) {
  const out = [];
  for (const k of Object.values(KINDS)) for (const lvl of k.levels) for (let i = 0; i < count; i++) {
    const p = build(k.id, k.params(rng, lvl)); p.lvl = lvl; out.push(p);
  }
  return out;
}
const problems = allProblems();

test("chaque famille a au moins un type de calcul à chacun des 3 niveaux", () => {
  for (const f of FAMILIES) for (const lvl of [1, 2, 3, 4]) assert.ok(kindsFor(f.id, lvl).length > 0, `${f.id} niveau ${lvl}`);
});

test(`résultats : entiers, positifs, bornés (${problems.length} calculs)`, () => {
  for (const p of problems) {
    assert.ok(Number.isInteger(p.a) && p.a > 0 && p.a < 100000, `${p.key} → ${p.a}`);
    assert.ok(p.ops.every((o) => Number.isInteger(o) && o > 0), `${p.key} opérandes`);
    assert.equal(typeof p.q, "string");
    assert.ok(!/[.,]\d/.test(p.q.replace(/ /g, "")), `nombre à virgule dans ${p.q}`);
  }
});

test("règles strictes : jamais de calcul trop simple", () => {
  for (const p of problems) {
    if (p.fam === "mul" && p.k !== "mul_10s" && p.k !== "mul_11" && p.k !== "mul_12") {
      const factors = p.k === "mul_gap" ? [p.p.x, p.p.y] : p.ops;
      assert.ok(factors.every((o) => !TOO_SIMPLE.has(o)), `table trop simple : ${p.q}`);
    }
    if (p.k === "div_inv") assert.ok(!TOO_SIMPLE.has(p.p.d) && !TOO_SIMPLE.has(p.p.q), `division trop simple : ${p.q}`);
    if (p.fam === "add" || p.fam === "sub") assert.ok(p.ops.every((o) => o > 1), `opérande trop simple : ${p.q}`);
    assert.ok(!p.ops.includes(3) || p.k === "dbl_triple", `« 3 » interdit hors triple : ${p.q}`); // le triple n'a que des nombres ≥ 12
    assert.ok(!p.ops.includes(1) && !p.ops.includes(2) || p.k === "div_2" || p.k === "dbl_double", `opérande 1 ou 2 : ${p.q}`);
    if (p.k === "dbl_triple") assert.ok(p.p.n >= 12, `triple d'un nombre < 12 : ${p.q}`);
    if (p.k === "mul_table") assert.ok(!p.ops.includes(11));
    if (p.k === "frac_third") assert.ok(p.a >= 12, `tiers trop simple : ${p.q}`);
    if (p.k === "frac_quarter") assert.ok(p.a >= 12, `quart trop simple : ${p.q}`);
  }
});

test("astuces : chaque calcul d'astuce est exact et chaque égalité des étapes est juste", () => {
  for (const p of problems) {
    const calc = Function(`"use strict"; return (${p.hint.calc})`)();
    assert.equal(calc, p.a, `${p.key} : calc ${p.hint.calc} = ${calc} ≠ ${p.a}`);
    assert.ok(p.hint.text.endsWith(`= ${fmt(p.a)}`), `texte d'astuce sans résultat : ${p.hint.text}`);
    assert.ok(p.hint.steps.length >= 1);
    for (const s of p.hint.steps) { assert.ok(s.t && s.eq); checkEq(s.eq); }
    const last = p.hint.steps.at(-1).eq.split(" = ").at(-1).replace(/ /g, "");
    assert.equal(Number(last), p.a, `la dernière étape doit donner la réponse : ${p.key}`);
  }
});

test("astuces : les exemples du cahier des charges", () => {
  assert.equal(build("add_2d", { a: 47, b: 38 }).hint.text, "47 + 38 → 47 + 40 − 2 = 85");
  assert.equal(build("mul_12", { n: 42, flip: false }).hint.text, "12 × 42 → 10 × 42 + 2 × 42 = 504");
  assert.equal(build("mul_11", { n: 34, flip: false }).hint.text, "11 × 34 → 340 + 34 = 374");
  assert.equal(build("sub_3d3d", { a: 402, b: 198 }).hint.text.split(" = ")[1], "204");
});

test("QCM : 4 choix uniques, positifs, avec la bonne réponse, mal placés au hasard", () => {
  const positions = new Set();
  for (const p of problems) {
    const c = choices(p, rng);
    assert.equal(c.length, 4, p.key);
    assert.equal(new Set(c).size, 4, `doublons ${p.key} ${c}`);
    assert.ok(c.includes(p.a));
    assert.ok(c.every((v) => Number.isInteger(v) && v > 0), `${p.key} ${c}`);
    positions.add(c.indexOf(p.a));
  }
  assert.equal(positions.size, 4, "la bonne réponse doit apparaître à toutes les positions");
});

test("QCM : les mauvaises réponses viennent surtout d'erreurs typiques (proches de la bonne)", () => {
  let near = 0, tot = 0;
  for (const p of problems) for (const v of choices(p, rng)) if (v !== p.a) { tot++; if (v >= p.a / 3 && v <= p.a * 3) near++; }
  assert.ok(near / tot > 0.97, `trop de réponses farfelues : ${(100 * near / tot).toFixed(1)} % proches`);
});

test("dictée : chaque phrase relue donne exactement la bonne réponse", () => {
  for (const p of problems) assert.equal(answerFromSay(p.say), p.a, `${p.key} → « ${p.say} »`);
});

test("dictée : formulations naturelles du cahier des charges", () => {
  assert.equal(build("add_2d", { a: 47, b: 38 }).say, "quarante-sept plus trente-huit");
  assert.equal(build("mul_1x2", { a: 6, n: 34, flip: false }).say, "six fois trente-quatre");
  assert.equal(build("div_inv", { d: 7, q: 8 }).say, "cinquante-six divisé par sept");
  assert.equal(build("dbl_double", { n: 75 }).say, "le double de soixante-quinze");
  assert.equal(build("frac_third", { n: 96 }).say, "le tiers de quatre-vingt-seize");
  assert.equal(build("comp_100", { n: 63 }).say, "combien pour aller de soixante-trois à cent");
});

test("les calculs sont sérialisables et reconstructibles à l'identique (révision espacée)", () => {
  for (const p of problems.filter((_, i) => i % 7 === 0)) {
    const again = build(p.k, JSON.parse(JSON.stringify(p.p)));
    assert.deepEqual(again, build(p.k, p.p));
    assert.equal(again.key, p.key);
    assert.equal(again.a, p.a);
  }
});

test("variété : jamais deux séries identiques, nouvelle variante à chaque rejeu", () => {
  const serie = () => Array.from({ length: 20 }, (_, i) => generate(FAMILIES[i % 8].id, 2, Math.random).key).join("#");
  const set = new Set(Array.from({ length: 30 }, serie));
  assert.equal(set.size, 30);
});

test("generate : respecte le filtre de types (fiches Apprendre) même hors niveau", () => {
  for (let i = 0; i < 200; i++) {
    const p = generate("mul", 1, Math.random, { kinds: ["mul_11"] });
    assert.equal(p.k, "mul_11");
  }
});
