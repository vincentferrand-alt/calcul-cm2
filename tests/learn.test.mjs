import test from "node:test";
import assert from "node:assert/strict";
import { FICHES } from "../js/learn.js";
import { build, KINDS, FAMILIES } from "../js/generator.js";
import { checkEq } from "./helpers.mjs";

test("fiches : identifiants uniques, familles et types connus, exemples exacts", () => {
  assert.equal(new Set(FICHES.map((f) => f.id)).size, FICHES.length);
  for (const f of FICHES) {
    assert.ok(FAMILIES.some((x) => x.id === f.fam), f.id);
    assert.ok(f.title && f.intro && f.idea && f.emoji, f.id);
    if (f.chrono) continue; // v0.19 : fiches des nombres à virgule, vérifiées plus bas
    assert.ok(f.examples.length >= 1, f.id);
    for (const k of f.kinds) { assert.ok(KINDS[k], k); assert.equal(KINDS[k].fam, f.fam, `${f.id} : ${k}`); }
    for (const ex of f.examples) {
      assert.ok(f.kinds.includes(ex.kind), `${f.id} : exemple ${ex.label}`);
      const p = build(ex.kind, ex.p);
      assert.equal(Function(`"use strict";return(${p.hint.calc})`)(), p.a);
      p.hint.steps.forEach((s) => checkEq(s.eq));
    }
  }
});
test("fiches : chaque type de calcul du générateur a une fiche", () => {
  const covered = new Set(FICHES.flatMap((f) => f.kinds));
  for (const k of Object.keys(KINDS)) assert.ok(covered.has(k), `pas de fiche pour ${k}`);
});

import { exampleOf, practiceSet, typesOf, fmtDec, PERIODS, HOLE } from "../js/fiche.js";
const near = (a, b) => Math.abs(a - b) < 1e-7;
const val = (t) => Number(String(t).replace(/[\u202f\u00a0 ]/g, "").replace(",", ".").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-"));
const calc = (e) => Function(`"use strict";return(${String(e).replace(/[\u202f\u00a0]/g, "").replace(/(\d),(\d)/g, "$1.$2").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")})`)();

test("fiches à virgule (v0.19) : exemples exacts, étiquettes fidèles, types connus et jouables", () => {
  const chrono = FICHES.filter((f) => f.chrono);
  assert.equal(chrono.length, 5);
  assert.equal(FICHES.length, 22);
  const known = new Set(PERIODS.flatMap((p) => typesOf(p)));
  for (const f of chrono) {
    assert.deepEqual(f.kinds, [], f.id);
    assert.ok(f.chrono.types.length >= 1 && f.chrono.examples.length >= 1, f.id);
    for (const t of f.chrono.types) { assert.ok(known.has(t), `${f.id} : type ${t}`); assert.ok(practiceSet(2, [t], 5).length >= 3, `${f.id} : ${t} jouable`); }
    for (const ex of f.chrono.examples) {
      assert.ok(f.chrono.types.includes(ex.t), `${f.id} : ${ex.label}`);
      const p = exampleOf(ex.t, ex.opts, ...ex.vals);
      assert.equal(p.q.replace(HOLE, "?").replace(/ = \?$/, "").replace(/\u202f/g, " "), ex.label.replace(/\u202f/g, " "), "l'étiquette dit le calcul de l'exemple");
      for (const st of p.hint.steps) for (const seg of st.eq.split(" ; ")) { const [l, r] = seg.split(" = "); assert.ok(near(calc(l), calc(r)), `${f.id} : ${seg}`); }
      assert.ok(near(val(p.hint.text.split(" = ").pop()), p.a), `${f.id} : ${ex.label}`);
    }
  }
  assert.throws(() => exampleOf("gapone", {}, 3, 4), /en trop/);
});
