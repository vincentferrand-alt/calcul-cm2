import test from "node:test";
import assert from "node:assert/strict";
import { FICHES } from "../js/learn.js";
import { build, KINDS, FAMILIES } from "../js/generator.js";
import { checkEq } from "./helpers.mjs";

test("fiches : identifiants uniques, familles et types connus, exemples exacts", () => {
  assert.equal(new Set(FICHES.map((f) => f.id)).size, FICHES.length);
  for (const f of FICHES) {
    assert.ok(FAMILIES.some((x) => x.id === f.fam), f.id);
    assert.ok(f.title && f.intro && f.idea && f.emoji && f.examples.length >= 1, f.id);
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
