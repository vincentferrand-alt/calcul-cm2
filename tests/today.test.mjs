import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { emptyState, migrate } from "../js/state.js";
import { todaySummary } from "../js/today.js";
import { refillMissions } from "../js/missions.js";
import { makeRng } from "../js/generator.js";

const D = "2026-11-14"; // un samedi

test("aujourd'hui : état vide → défi à faire, aucune mission, 0 jour", () => {
  const t = todaySummary(emptyState(), D);
  assert.equal(t.daily.done, false); assert.equal(t.daily.status, "À faire"); assert.ok(t.daily.label.length > 3);
  assert.equal(t.missions.count, 0); assert.equal(t.missions.status, "0 en cours"); assert.equal(t.missions.best, null);
  assert.equal(t.week.played, 0); assert.equal(t.week.status, "0 jour"); assert.equal(t.week.days.length, 7);
});

test("aujourd'hui : défi fait, missions avec avancement, semaine", () => {
  const s = emptyState();
  s.daily[D] = { done: true, ok: 18, n: 20, stars: 3 };
  refillMissions(s, makeRng(3), D);
  assert.equal(s.m.active.length, 3);
  s.m.active[0].progress = Math.ceil(s.m.active[0].target * 0.7);
  s.days[D] = { ok: 12, tot: 15, fam: {}, learn: [], easy: [] };
  s.days["2026-11-12"] = { ok: 5, tot: 9, fam: {}, learn: [], easy: [] };
  const t = todaySummary(s, D);
  assert.equal(t.daily.status, "Fait ✓");
  assert.equal(t.missions.count, 3); assert.equal(t.missions.status, "Presque !");
  assert.ok(t.missions.best.pct >= 60 && t.missions.best.pct <= 100);
  for (const m of t.missions.list) { assert.ok(m.text.length > 5); assert.ok(m.progress <= m.target); assert.ok(m.pct >= 0 && m.pct <= 100); }
  assert.equal(t.week.played, 2); assert.equal(t.week.status, "2 jours"); assert.equal(t.week.ok, 17);
});

test("aujourd'hui : une mission abîmée ne casse jamais l'accueil", () => {
  const s = emptyState();
  s.m.active = [{ id: "x", tpl: "inconnu", params: null, target: 0, progress: 5 }, null, { id: "y", tpl: "fam", params: { fam: "zzz" }, target: 10, progress: 3 }];
  const t = todaySummary(s, D);
  assert.equal(t.missions.count, 2);
  for (const m of t.missions.list) assert.equal(typeof m.text, "string");
});

test("aujourd'hui : toutes les sauvegardes de référence se lisent", () => {
  for (const f of fs.readdirSync(new URL("./fixtures/", import.meta.url))) {
    const s = migrate(JSON.parse(fs.readFileSync(new URL("./fixtures/" + f, import.meta.url), "utf8")));
    const t = todaySummary(s, D);
    assert.ok(t.missions.count <= 3, f); assert.equal(t.week.days.length, 7, f);
  }
});
