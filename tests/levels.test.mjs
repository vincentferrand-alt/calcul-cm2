import test from "node:test";
import assert from "node:assert/strict";
import { FAMILIES, KINDS, generate, kindsFor, makeRng, MAX_LEVEL } from "../js/generator.js";
import { nudgeLines, hasNumber } from "../js/hints.js";
import { emptyState } from "../js/state.js";
import { buildSession, recordAnswer } from "../js/progress.js";

const rng = makeRng(777);

test("4 niveaux : chaque famille a des calculs à chaque niveau, et le niveau 1 existe pour toutes", () => {
  assert.equal(MAX_LEVEL, 4);
  for (const f of FAMILIES) for (let l = 1; l <= 4; l++) assert.ok(kindsFor(f.id, l).length > 0, `${f.id} niveau ${l}`);
  for (const k of Object.values(KINDS)) for (const l of k.levels) assert.ok(l >= 1 && l <= 4);
});

test("niveau 1 : additions sans retenue, soustractions sans emprunt, tables de 4 et 6 seulement", () => {
  for (let i = 0; i < 2000; i++) {
    const a = generate("add", 1, rng, { kinds: ["add_2d"] });
    assert.ok(a.p.a % 10 + a.p.b % 10 < 10, `retenue dans ${a.q}`);
    const s = generate("sub", 1, rng, { kinds: ["sub_2d"] });
    assert.ok(s.p.a % 10 >= s.p.b % 10, `emprunt dans ${s.q}`);
    const m = generate("mul", 1, rng);
    assert.ok(m.p.a === 4 || m.p.a === 6, `table trop dure au niveau 1 : ${m.q}`);
  }
});

test("niveau 1 plus facile que le niveau 2 : résultats plus petits en moyenne (additions, soustractions, doubles)", () => {
  const mean = (fam, lvl, kinds) => { let t = 0; for (let i = 0; i < 1500; i++) t += generate(fam, lvl, rng, { kinds }).a; return t / 1500; };
  for (const [fam, kinds] of [["add", ["add_2d", "add_n"]], ["dbl", ["dbl_double", "dbl_triple"]], ["trick", ["trick_x4"]]]) {
    assert.ok(mean(fam, 1, kinds) < mean(fam, 3, kinds), `${fam}`);
  }
});

test("coup de pouce : jamais la réponse, toujours au moins une ligne (tous types, tous niveaux)", () => {
  for (const k of Object.values(KINDS)) for (const lvl of k.levels) for (let i = 0; i < 300; i++) {
    const p = generate(k.fam, lvl, rng, { kinds: [k.id] });
    const lines = nudgeLines(p);
    assert.ok(lines.length >= 1 && lines.length <= 2);
    for (const l of lines) assert.ok(!hasNumber(l, p.a), `fuite de la réponse ${p.a} : « ${l} » (${p.q})`);
  }
  assert.ok(hasNumber("on obtient 1 200 au total", 1200)); assert.ok(!hasNumber("120 + 30", 1200)); assert.ok(!hasNumber("1200", 200));
});

test("défi du jour : les premiers calculs sont d'un cran plus faciles que le niveau de la famille", () => {
  const s = emptyState(); s.fam.add = { xp: 50, n: 50, lvl: 3, maxLvl: 3, recent: [] };
  let early = 0, late = 0;
  for (let i = 0; i < 40; i++) {
    const list = buildSession(s, { families: ["add"], count: 20, daily: true, noReview: true }, makeRng(i), "2026-11-13");
    // buildSession mélange : on compte seulement la répartition des niveaux
    early += list.filter((p) => p.lvl === 2).length; late += list.filter((p) => p.lvl === 3).length;
  }
  assert.ok(early > 0 && late > early, `${early} faciles / ${late} au niveau`);
  const none = buildSession(s, { families: ["add"], count: 20, noReview: true }, makeRng(1), "2026-11-13");
  assert.ok(none.every((p) => p.lvl === 3), "hors défi du jour : toujours le niveau de la famille");
});

test("avec un coup de pouce, la bonne réponse compte mais ne valide pas la maîtrise d'une révision", () => {
  const s = emptyState(), p = generate("add", 1, rng);
  recordAnswer(s, p, false, { date: "2026-11-01" });
  const r = s.review[p.key];
  recordAnswer(s, p, true, { date: "2026-11-02", review: true, hinted: true });
  assert.equal(r.box, 0, "pas de progrès de boîte avec indice"); assert.equal(s.c.ok, 1, "la réponse juste compte quand même");
  recordAnswer(s, p, true, { date: "2026-11-02", review: true });
  assert.equal(r.box, 1);
});
