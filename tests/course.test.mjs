import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { LANES, GATES, TRAVEL, gateRow, passGate, startPace, paceAfter, speedOf, moveLane, laneAt, courseProblems, courseAnswer, courseEnd, addRunPhoto, runKey, runCount } from "../js/course.js";
import { FAMILIES, generate, makeRng, MAX_LEVEL } from "../js/generator.js";
import { emptyState, merge, migrate, missingFrom } from "../js/state.js";
import { afterAnswer, afterSession } from "../js/game.js";
import { syncCreatures } from "../js/creatures.js";
import { runCards, memoryCards } from "../js/dreams.js";
import { TEMPLATES, missionEvent } from "../js/missions.js";
import { checkTrophies, lineById } from "../js/trophies.js";
import { whatNext, launchFor } from "../js/next.js";

const D = "2026-11-14";

test("portes : une seule juste par rangée, 3 réponses distinctes et positives (toutes familles, tous niveaux)", () => {
  const rng = makeRng(42);
  for (const f of FAMILIES) for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) for (let i = 0; i < 60; i++) {
    const p = generate(f.id, lvl, rng), row = gateRow(p, rng);
    assert.equal(row.values.length, LANES);
    assert.equal(row.values.filter((v) => v === p.a).length, 1, "une seule porte juste");
    assert.equal(new Set(row.values).size, LANES, "réponses distinctes");
    assert.ok(row.values.every((v) => Number.isInteger(v) && v > 0), "réponses positives");
    assert.equal(row.values[row.good], p.a);
    assert.equal(passGate(row, row.good).ok, true);
    assert.equal(passGate(row, (row.good + 1) % 3).ok, false);
  }
});

test("rythme doux : accélère après 3 bonnes réponses, ralentit après une erreur, plafond bas ; calme = 0 (les portes attendent)", () => {
  let p = startPace();
  assert.equal(speedOf(p), 1 / TRAVEL[0]);
  p = paceAfter(paceAfter(p, true), true); assert.equal(p.level, 0);
  p = paceAfter(p, true); assert.equal(p.level, 1, "3 d'affilée : un cran plus vite");
  const v1 = speedOf(p);
  p = paceAfter(p, false); assert.equal(p.level, 0); assert.ok(speedOf(p) < v1, "ralentit après une erreur");
  for (let i = 0; i < 100; i++) p = paceAfter(p, true);
  assert.equal(p.level, TRAVEL.length - 1);
  assert.ok(speedOf(p) <= 1 / 6 + 1e-9, "plafond bas : au moins 6 s pour voir arriver chaque porte");
  assert.equal(speedOf(p, true), 0); assert.equal(speedOf(startPace(), true), 0);
  assert.equal(paceAfter({ level: 0, streak: 2 }, false).level, 0, "jamais en dessous du plus lent");
});

test("couloirs : glisser et toucher", () => {
  assert.equal(moveLane(1, -1), 0); assert.equal(moveLane(0, -1), 0); assert.equal(moveLane(2, 1), 2); assert.equal(moveLane(1, 1), 2);
  assert.equal(laneAt(10, 384), 0); assert.equal(laneAt(200, 384), 1); assert.equal(laneAt(383, 384), 2); assert.equal(laneAt(500, 384), 2); assert.equal(laneAt(-5, 384), 0);
  assert.equal(passGate({ values: [1, 2, 3], good: 0, a: 1 }, 7).lane, 2);
});

test("calculs d'un cran plus faciles que le niveau de la famille, 10 portes", () => {
  const s = emptyState(); s.fam.add = { xp: 100, n: 100, lvl: 3, maxLvl: 3, recent: [] };
  const list = courseProblems(s, ["add"], makeRng(5), D);
  assert.equal(list.length, GATES);
  assert.ok(list.every((p) => p.fam === "add" && p.lvl <= 2));
  assert.equal(courseProblems(emptyState(), "mix", makeRng(6), D).length, GATES);
});

test("une course compte exactement comme une série normale (compteurs, familles, créatures, à revoir, étoiles)", () => {
  const rng = makeRng(9), probs = Array.from({ length: 10 }, () => generate("sub", 1, rng));
  const answers = [1, 1, 0, 1, 1, 1, 1, 0, 1, 1].map(Boolean);
  const a = emptyState(), b = emptyState();
  let run = 0;
  probs.forEach((p, i) => { run = answers[i] ? run + 1 : 0; courseAnswer(a, { prob: p, ok: answers[i], run, date: D }); afterAnswer(b, { prob: p, ok: answers[i], review: false, run, date: D, mode: "qcm", adapt: true }); });
  const ra = courseEnd(a, { ok: 8, total: 10, date: D }), rb = afterSession(b, { ok: 8, total: 10, mode: "qcm", daily: false, date: D });
  assert.equal(ra.stars, rb.stars); assert.equal(ra.stars, 2);
  for (const k of ["ok", "tot", "sessions", "stars", "perfect"]) assert.equal(a.c[k], b.c[k], k);
  assert.deepEqual(a.fam, b.fam); assert.deepEqual(a.days, b.days); assert.deepEqual(a.review, b.review); assert.deepEqual(a.cre, b.cre);
  assert.equal(a.c.course, 1); assert.equal(b.c.course, 0);
  assert.equal(courseEnd(emptyState(), { ok: 0, total: 10, date: D }).stars, 1, "toujours au moins une étoile");
});

test("mission « Termine une course des réponses » et trophée « Coureur » (1, 5, 20, 50)", () => {
  assert.equal(TEMPLATES.course.text(), "Termine une course des réponses");
  const s = emptyState(); s.m.active = [{ id: "m-c", tpl: "course", params: {}, target: 1, progress: 0, done: false }];
  missionEvent(s, { type: "session", mode: "qcm", ok: 5, total: 10 }, Math.random, D); assert.equal(s.m.active[0].progress, 0);
  const done = missionEvent(s, { type: "session", mode: "course", ok: 5, total: 10 }, Math.random, D);
  assert.equal(done.length, 1); assert.ok(s.m.done.includes("m-c"));
  const l = lineById("t_run"); assert.deepEqual(l.tiers, [1, 5, 20, 50]); assert.equal(l.name, "Coureur");
  const t = emptyState(); courseEnd(t, { ok: 7, total: 10, date: D }); assert.ok(t.tro["t_run:1"]);
  const u = emptyState(); for (let i = 0; i < 5; i++) addRunPhoto(u, { c: "add", st: 1, bg: "bg_prairie", ok: 5, n: 10, fam: "mix" }, new Date(2026, 10, 14, 10, i)); checkTrophies(u, D);
  assert.ok(u.tro["t_run:2"], "les photos des deux appareils comptent (union)");
  // « Que faire maintenant ? » peut proposer une course comme mission
  const v = emptyState(); v.daily[D] = { done: true }; v.fam = Object.fromEntries(FAMILIES.map((f) => [f.id, { xp: 999, n: 999, lvl: 1, maxLvl: 1, recent: [] }])); syncCreatures(v, D);
  v.m.active = [{ id: "m-c", tpl: "course", params: {}, target: 1, progress: 0, done: false }];
  const n = whatNext(v, D); assert.equal(n.kind, "mission"); assert.equal(n.label, "Termine une course des réponses");
  const go = launchFor(n, D); assert.equal(go.route, "course"); assert.equal(go.opts.mode, "course");
});

test("photo-souvenir : nouvelle clé run additive, union à la fusion, rien ne se perd, anciennes sauvegardes migrées", () => {
  assert.equal(runKey(new Date(2026, 10, 14, 9, 5)), "2026-11-14T09:05");
  const a = emptyState(), b = emptyState();
  const k1 = addRunPhoto(a, { c: "add", st: 2, bg: "bg_lac", ok: 8, n: 10, fam: "add" }, new Date(2026, 10, 14, 17, 30, 12));
  const k2 = addRunPhoto(a, { c: "add", st: 2, bg: "bg_lac", ok: 9, n: 10, fam: "mix" }, new Date(2026, 10, 14, 17, 30, 50));
  assert.equal(k1, "2026-11-14T17:30"); assert.equal(k2, "2026-11-14T17:30:50", "deux courses dans la même minute : deux photos");
  assert.deepEqual(a.run[k1], { c: "add", st: 2, bg: "bg_lac", ok: 8, n: 10, fam: "add" });
  addRunPhoto(b, { c: "sub", st: 1, bg: "bg_prairie", ok: 6, n: 10, fam: "sub" }, new Date(2026, 10, 13, 8, 0));
  const m = merge(a, b), m2 = merge(b, a);
  assert.equal(runCount(m), 3); assert.deepEqual(m, m2, "commutative"); assert.deepEqual(merge(m, m), m, "idempotente");
  assert.deepEqual(missingFrom(m, a), []); assert.deepEqual(missingFrom(m, b), []);
  const lost = JSON.parse(JSON.stringify(m)); delete lost.run[k1];
  assert.deepEqual(missingFrom(lost, m), ["run:" + k1], "une photo perdue est détectée");
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "fixtures");
  for (const f of fs.readdirSync(dir)) {
    const old = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const mig = migrate(old); assert.deepEqual(mig.run, old.run || {}, f); assert.equal(mig.c.course, (old.c && old.c.course) || 0);
    assert.deepEqual(missingFrom(merge(old, m), old), [], f); assert.deepEqual(missingFrom(merge(old, m), m), [], f);
  }
});

test("carnet : soirs et courses mélangés, du plus récent au plus ancien, filtre Tout / Soirs / Courses, données abîmées", () => {
  const s = emptyState();
  s.cre.add = { s: 2, d: {} }; s.fam.add = { xp: 60, n: 60, lvl: 1, maxLvl: 1, recent: [] };
  s.eve["2026-11-13"] = { ok: true, n: 1, c: "add", st: 2, bg: "bg_prairie", q: "12 + 9", a: 21, eq: true };
  s.eve["2026-11-14"] = { ok: true, n: 1 };
  s.run["2026-11-14T19:30"] = { c: "add", st: 2, bg: "bg_nuit", ok: 7, n: 10, fam: "add" };
  s.run["2026-11-14T10:00"] = { c: "zzz", st: 9, bg: "pas_un_fond", ok: 99, n: 10, fam: null };
  s.run["pas-une-date"] = { c: "add" };
  const all = memoryCards(s, "add");
  assert.deepEqual(all.map((d) => d.sort), ["2026-11-14T19:30", "2026-11-14T18:00", "2026-11-14T10:00", "2026-11-13T18:00"]);
  assert.deepEqual(memoryCards(s, "add", "run").map((d) => d.type), ["run", "run"]);
  assert.deepEqual(memoryCards(s, "add", "eve").map((d) => d.type), ["eve", "eve"]);
  const broken = runCards(s, "add").find((d) => d.key === "2026-11-14T10:00");
  assert.equal(broken.c, "add"); assert.equal(broken.st, 4); assert.equal(broken.bg, "bg_prairie"); assert.equal(broken.ok, 10); assert.equal(broken.fam, "mix");
  assert.equal(runCards(s).find((d) => d.key === "2026-11-14T19:30").hour, 19);
});
