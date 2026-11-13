import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, merge, migrate, missingFrom } from "../js/state.js";
import { eveningOpen, eveningDone, eveningRiddle, completeEvening, eveningCount } from "../js/evening.js";
import { balance, starsEarned, buyDecor } from "../js/shop.js";
import { checkTrophies, lineById } from "../js/trophies.js";
import { CREATURES } from "../js/creatures.js";

test("énigme du soir : seulement à partir de 18 h, une fois par jour", () => {
  const s = emptyState();
  assert.equal(eveningOpen(s, "2026-11-14", 17), false); assert.equal(eveningOpen(s, "2026-11-14", 18), true); assert.equal(eveningOpen(s, "2026-11-14", 23), true);
  assert.equal(completeEvening(s, "2026-11-14", true, 1), true); assert.equal(completeEvening(s, "2026-11-14", false, 2), false, "pas deux fois le même jour");
  assert.equal(eveningOpen(s, "2026-11-14", 20), false); assert.equal(eveningDone(s, "2026-11-14"), true); assert.equal(eveningOpen(s, "2026-11-15", 19), true);
});

test("énigme du soir : la même le même soir, un vrai calcul de la famille de la créature, QCM valide", () => {
  const s = emptyState(); s.fam.mul = { xp: 60, n: 60, lvl: 3, maxLvl: 3, recent: [] };
  for (const c of CREATURES) for (const d of ["2026-11-14", "2026-11-15", "2026-12-24"]) {
    const a = eveningRiddle(s, d, c.id), b = eveningRiddle(s, d, c.id);
    assert.deepEqual(a, b);
    assert.equal(a.prob.fam, c.fam); assert.ok(Number.isInteger(a.prob.a) && a.prob.a > 0);
    assert.equal(a.options.length, 4); assert.ok(a.options.includes(a.prob.a)); assert.equal(new Set(a.options).size, 4);
    assert.ok(a.prob.hint && a.prob.hint.text);
  }
  assert.equal(eveningRiddle(s, "2026-11-14", "inconnu").creature, CREATURES[0].id);
});

test("une étoile en cadeau, même après deux essais ; elle s'additionne entre appareils ; trophée Énigmes du soir", () => {
  const s = emptyState(); s.c.stars = 4;
  completeEvening(s, "2026-11-14", false, 2);
  assert.equal(starsEarned(s), 5); assert.equal(balance(s), 5);
  const other = emptyState(); other.c.stars = 4; completeEvening(other, "2026-11-13", true, 1);
  const m = merge(s, other); assert.equal(eveningCount(m), 2); assert.equal(starsEarned(m), 6, "une étoile par soir, sur n'importe quel appareil");
  const same = emptyState(); same.c.stars = 4; completeEvening(same, "2026-11-14", true, 1);
  const m2 = merge(s, same); assert.equal(starsEarned(m2), 5, "le même soir sur deux appareils = une seule étoile"); assert.equal(m2.eve["2026-11-14"].ok, true);
  assert.deepEqual(missingFrom(m, s), []); assert.deepEqual(missingFrom(m, other), []);
  assert.ok(checkTrophies(m, "2026-11-14").some((t) => t.id === "t_eve:1")); assert.equal(lineById("t_stars").value(m), 6);
  assert.equal(buyDecor(m, "bg_lac", "d").ok, true); assert.equal(balance(m), 1);
});

test("migration : une ancienne sauvegarde reçoit eve = {}", () => {
  const m = migrate({ v: 1, c: { stars: 2 } }); assert.deepEqual(m.eve, {}); assert.equal(starsEarned(m), 2);
});
