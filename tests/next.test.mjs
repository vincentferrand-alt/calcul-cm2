import test from "node:test";
import assert from "node:assert/strict";
import { emptyState } from "../js/state.js";
import { syncCreatures, CREATURES } from "../js/creatures.js";
import { whatNext, launchFor, REVIEW_MAX } from "../js/next.js";
import { buildSession, recordAnswer } from "../js/progress.js";
import { generate, makeRng } from "../js/generator.js";
import { themeFor, DAILY_COUNT, themeFams, THEMES } from "../js/daily.js";

const D = "2026-11-14";
function stateWith({ daily = false, reviews = 0, xp = {} } = {}) {
  const s = emptyState();
  for (const [f, v] of Object.entries(xp)) s.fam[f] = { xp: v, n: v, lvl: 1, maxLvl: 1, recent: [] };
  if (daily) s.daily[D] = { done: true, ok: 15, n: 20, stars: 2 };
  const rng = makeRng(3);
  for (let i = 0; i < reviews; i++) { const p = generate("add", 2, rng); recordAnswer(s, p, false, { date: "2026-11-10", mode: "qcm" }); }
  syncCreatures(s, D);
  return s;
}

test("« Que faire maintenant ? » : d'abord le défi du jour", () => {
  const n = whatNext(stateWith({ reviews: 3 }), D);
  assert.equal(n.kind, "daily"); assert.equal(n.label, "Défi du jour : " + themeFor(D).label);
  const l = launchFor(n, D, { answer: "qcm" });
  assert.equal(l.route, "jouer"); assert.equal(l.opts.daily, true); assert.equal(l.opts.count, DAILY_COUNT); assert.deepEqual(l.opts.families, themeFor(D).families);
});

test("« Que faire maintenant ? » : puis les calculs à revoir (« 🎯 5 calculs à revoir »), une série faite seulement d'eux", () => {
  const s = stateWith({ daily: true, reviews: 5 });
  const n = whatNext(s, D);
  assert.equal(n.kind, "review"); assert.equal(`${n.icon} ${n.label}`, "🎯 5 calculs à revoir");
  const l = launchFor(n, D, { answer: "input" });
  assert.equal(l.opts.reviewOnly, true); assert.equal(l.opts.mode, "input");
  const list = buildSession(s, l.opts, makeRng(1), D);
  assert.equal(list.length, 5); assert.ok(list.every((p) => p.review));
  const many = stateWith({ daily: true, reviews: 14 });
  assert.equal(whatNext(many, D).n, REVIEW_MAX, "au plus 10 à la fois");
  assert.equal(buildSession(many, launchFor(whatNext(many, D), D).opts, makeRng(2), D).length, REVIEW_MAX);
  assert.equal(whatNext(stateWith({ daily: true, reviews: 1 }), D).label, "1 calcul à revoir");
});

test("« Que faire maintenant ? » : sinon la créature la plus proche d'évoluer", () => {
  const n = whatNext(stateWith({ daily: true, xp: { add: 46, sub: 30 } }), D);
  assert.equal(n.kind, "grow"); assert.equal(n.label, "Faire grandir Braise : encore 4 additions");
  assert.deepEqual(launchFor(n, D).opts.families, ["add"]);
  const egg = whatNext(stateWith({ daily: true, xp: { div: 8 } }), D);
  assert.equal(egg.label, "Faire éclore un œuf : encore 2 divisions"); assert.equal(egg.icon, "🥚");
});

test("« Que faire maintenant ? » : enfin une mission (toutes les créatures au maximum)", () => {
  const s = stateWith({ daily: true, xp: Object.fromEntries(CREATURES.map((c) => [c.fam, 999])) });
  s.m.active = [{ id: "m-a", tpl: "fam", params: { fam: "mul" }, target: 10, progress: 2, done: false }, { id: "m-b", tpl: "learn", params: {}, target: 1, progress: 0, done: false }];
  const n = whatNext(s, D);
  assert.equal(n.kind, "mission"); assert.equal(n.label, "Réussis 10 calculs de multiplications");
  assert.deepEqual(launchFor(n, D).opts.families, ["mul"]);
  assert.equal(launchFor({ kind: "mission", mission: s.m.active[1] }, D).route, "apprendre");
  assert.equal(launchFor({ kind: "mission", mission: { tpl: "dictee", params: {} } }, D).opts.mode, "dictee");
  s.m.active = [];
  assert.equal(whatNext(s, D).kind, "mix");
});

test("défi du jour : l'icône devient des pastilles de familles (plus de « ✖ » qui ressemble à une erreur)", () => {
  for (const t of THEMES) { const f = themeFams(t); assert.ok(f.length >= 1 && f.length <= 4); }
  assert.deepEqual(themeFams(THEMES.find((t) => t.id === "tables")), ["mul", "div"]);
  assert.deepEqual(themeFams(THEMES.find((t) => t.id === "grand-melange")), ["add", "sub", "mul", "div"]);
});

test("v0.14.1 : une mission presque finie (≥ 60 %) passe avant « faire grandir »", () => {
  const s = stateWith({ daily: true, xp: { add: 46 } });
  s.m.active = [{ id: "m-a", tpl: "fam", params: { fam: "mul" }, target: 10, progress: 6, done: false }, { id: "m-b", tpl: "today", params: {}, target: 20, progress: 2, done: false }];
  const n = whatNext(s, D);
  assert.equal(n.kind, "mission"); assert.equal(n.mission.id, "m-a"); assert.equal(n.label, "Réussis 10 calculs de multiplications");
  s.m.active[0].progress = 5; // 50 % : pas encore « presque finie »
  assert.equal(whatNext(s, D).kind, "grow");
  s.m.active[0].progress = 10; s.m.active[0].done = true; // déjà faite : ignorée
  assert.equal(whatNext(s, D).kind, "grow");
});

test("v0.14.1 : on alterne « faire grandir » et une mission jouable, ce jour-là", () => {
  const s = stateWith({ daily: true, xp: { add: 46 } });
  s.m.active = [{ id: "m-a", tpl: "fam", params: { fam: "sub" }, target: 10, progress: 1, done: false }];
  const a = whatNext(s, D, { last: null });
  assert.equal(a.kind, "grow");
  const b = whatNext(s, D, { last: a.kind });
  assert.equal(b.kind, "mission"); assert.equal(b.label, "Réussis 10 calculs de soustractions");
  assert.equal(whatNext(s, D, { last: b.kind }).kind, "grow", "puis de nouveau « faire grandir »");
  // pas de mission jouable : on garde « faire grandir »
  s.m.active = [{ id: "m-d", tpl: "dictee", params: {}, target: 1, progress: 0, done: false }];
  assert.equal(whatNext(s, D, { last: "grow", speech: false }).kind, "grow", "dictée impossible sans voix");
  assert.equal(whatNext(s, D, { last: "grow", speech: true }).kind, "mission");
  s.m.active = [{ id: "m-r", tpl: "review", params: {}, target: 2, progress: 0, done: false }];
  assert.equal(whatNext(s, D, { last: "grow" }).kind, "grow", "rien à revoir : la mission « à revoir » n'est pas jouable");
  s.m.active = [];
  assert.equal(whatNext(s, D, { last: "grow" }).kind, "grow");
});
