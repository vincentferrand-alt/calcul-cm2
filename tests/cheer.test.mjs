import test from "node:test";
import assert from "node:assert/strict";
import { cheerLine, allCheers, slotFor, canReact, REACT_GAP } from "../js/cheer.js";

test("créature interactive : une vingtaine de phrases bienveillantes", () => {
  const all = allCheers();
  assert.ok(all.length >= 18 && all.length <= 24, `${all.length} phrases`);
  assert.equal(new Set(all).size, all.length, "pas de doublon");
  for (const p of all) assert.ok(!/(nul|raté|faute|mauvais|dommage)/i.test(p), "jamais de reproche : " + p);
});

test("les phrases changent selon l'heure, le jour et à chaque appui", () => {
  assert.equal(slotFor(8), "matin"); assert.equal(slotFor(14), "jour"); assert.equal(slotFor(19), "soir"); assert.equal(slotFor(23), "nuit"); assert.equal(slotFor(3), "nuit");
  assert.notEqual(cheerLine("2026-11-14", 8, 0), cheerLine("2026-11-14", 8, 1), "deux appuis de suite : deux phrases");
  const days = new Set(["2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17"].map((d) => cheerLine(d, 14, 0)));
  assert.ok(days.size >= 2, "le jour change la première phrase");
  const slots = new Set([8, 14, 19, 23].map((hr) => cheerLine("2026-11-14", hr, 0)));
  assert.ok(slots.size >= 2, "l'heure change la phrase");
  assert.equal(cheerLine("2026-11-14", 10, 3), cheerLine("2026-11-14", 10, 3), "déterministe");
});

test("jamais plus d'une réaction toutes les ~2 s", () => {
  assert.equal(canReact(null, 1000), true); assert.equal(canReact(1000, 1000 + REACT_GAP - 1), false); assert.equal(canReact(1000, 1000 + REACT_GAP), true);
});
