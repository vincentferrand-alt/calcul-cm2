import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { emptyState, merge, missingFrom } from "../js/state.js";
import { computeStreak } from "../js/streak.js";
import { refillMissions, missionEvent, SLOTS, TEMPLATES, missionText } from "../js/missions.js";
import { LINES, checkTrophies, allTrophyIds, nextTier, earnedTier } from "../js/trophies.js";
import { afterAnswer, afterSession, afterLearn, refreshState } from "../js/game.js";
import { THEMES, themeFor } from "../js/daily.js";
import { generate, makeRng } from "../js/generator.js";
import { addDays } from "../js/dates.js";

const day = (s, d, tot = 5) => { s.days[d] = { ok: tot, tot, fam: {}, learn: [], easy: [] }; };
const rng = makeRng(5);

test("série : jours consécutifs, joker pour un jour manqué, puis rupture", () => {
  let s = emptyState();
  ["2026-11-01", "2026-11-02", "2026-11-03"].forEach((d) => day(s, d));
  assert.equal(computeStreak(s, "2026-11-03").current, 3);
  assert.equal(computeStreak(s, "2026-11-04").current, 3, "aujourd'hui pas encore joué : pas de rupture");
  // un jour manqué : le joker sauve la série
  assert.equal(computeStreak(s, "2026-11-05").current, 3);
  day(s, "2026-11-05");
  assert.equal(computeStreak(s, "2026-11-05").current, 4, "joker utilisé, la série continue");
  // deux jours manqués d'affilée sans nouveau joker : la série repart
  assert.equal(computeStreak(s, "2026-11-08").current, 0);
  day(s, "2026-11-08"); assert.equal(computeStreak(s, "2026-11-08").current, 1);
});
test("série : 7 jours rapportent un joker, 2 maximum ; la meilleure série est conservée", () => {
  const s = emptyState();
  for (let i = 0; i < 14; i++) day(s, addDays("2026-10-01", i));
  const r = computeStreak(s, "2026-10-14");
  assert.equal(r.current, 14); assert.equal(r.jokers, 2); assert.equal(r.best, 14);
  const t = computeStreak(s, "2026-10-30"); // longue pause
  assert.equal(t.current, 0); assert.equal(t.best, 14);
});
test("série : sûre à fusionner (jours joués = union)", () => {
  const a = emptyState(), b = emptyState();
  day(a, "2026-11-01"); day(a, "2026-11-02"); day(b, "2026-11-03");
  assert.equal(computeStreak(merge(a, b), "2026-11-03").current, 3);
});

test("missions : 3 en cours, variées, remplacées dès qu'elles sont terminées, jamais rejouées", () => {
  const s = emptyState(); refillMissions(s, rng, "2026-11-13");
  assert.equal(s.m.active.length, SLOTS);
  assert.equal(new Set(s.m.active.map((m) => m.id)).size, SLOTS);
  // on force 3 missions qui avancent avec de simples réponses justes, pour tester le remplacement
  s.m.active = [
    { id: "m-a", tpl: "fam", params: { fam: "add" }, target: 8, progress: 0, done: false },
    { id: "m-b", tpl: "run", params: {}, target: 5, progress: 0, done: false },
    { id: "m-c", tpl: "today", params: {}, target: 15, progress: 0, done: false },
  ];
  const finishedIds = [];
  for (let i = 0; i < 60; i++) {
    const p = generate("add", 1, rng);
    const r = afterAnswer(s, { prob: p, ok: true, review: false, run: i + 1, date: "2026-11-13", mode: "qcm" });
    assert.equal(s.m.active.length, SLOTS, "toujours 3 missions");
    r.missions.forEach((m) => finishedIds.push(m.id));
  }
  assert.ok(["m-a", "m-b", "m-c"].every((id) => finishedIds.includes(id)), "les trois missions de départ sont accomplies");
  assert.equal(s.c.missions, s.m.done.length);
  assert.ok(s.c.missions >= 3);
  assert.equal(new Set(s.m.done).size, s.m.done.length, "aucune mission comptée deux fois");
  assert.ok(s.m.active.every((m) => !s.m.done.includes(m.id)), "une mission terminée ne revient pas");
  assert.equal(new Set(s.m.active.map((m) => m.id)).size, SLOTS);
  for (const m of s.m.active) assert.ok(missionText(m, "2026-11-13").length > 5);
});
test("missions : chaque modèle produit un texte et la fin de série / fiche les fait avancer", () => {
  const s = emptyState(); s.m.active = [];
  const mk = (tpl, params = {}, target = 1) => s.m.active.push({ id: "m-" + tpl, tpl, params, target, progress: 0, done: false });
  mk("mode", { mode: "qcm" }); mk("learn"); mk("perfect");
  const r = missionEvent(s, { type: "session", mode: "qcm", ok: 10, total: 10, perfect: true, daily: false }, rng, "2026-11-13");
  assert.deepEqual(r.map((m) => m.tpl).sort(), ["mode", "perfect"]);
  assert.equal(s.m.active.length, SLOTS);
  const l = afterLearn(s, "x11", "2026-11-13");
  assert.ok(l.first);
  for (const t of Object.keys(TEMPLATES)) assert.ok(typeof TEMPLATES[t].text({ params: { fam: "add", mode: "qcm" }, target: 5 }, "2026-11-13") === "string");
});

test("trophées : paliers atteints une seule fois, jamais retirés, toujours un prochain but", () => {
  const s = emptyState();
  s.c.ok = 26; s.c.stars = 12;
  const first = checkTrophies(s, "2026-11-13").map((t) => t.id);
  assert.ok(first.includes("t_calc:1") && first.includes("t_stars:1"));
  assert.deepEqual(checkTrophies(s, "2026-11-14"), [], "pas de doublon");
  assert.equal(s.tro["t_calc:1"], "2026-11-13", "la date du premier gain est conservée");
  const line = LINES.find((l) => l.id === "t_calc");
  assert.equal(earnedTier(s, line), 1);
  const nt = nextTier(s, line); assert.equal(nt.target, 100); assert.equal(nt.value, 26);
  s.c.ok = 99999; checkTrophies(s, "2026-11-20");
  assert.equal(nextTier(s, line), null);
  s.c.ok = 0; assert.ok(s.tro["t_calc:5"], "même si un compteur redescendait, un trophée gagné reste");
});
test("trophées : identifiants uniques et stables (tout identifiant déjà publié existe toujours)", () => {
  const ids = allTrophyIds();
  assert.equal(new Set(ids).size, ids.length);
  const published = JSON.parse(fs.readFileSync(new URL("./trophy-ids.json", import.meta.url), "utf8"));
  assert.ok(published.length > 0);
  for (const id of published) assert.ok(ids.includes(id), `trophée disparu : ${id} (les identifiants ne doivent JAMAIS être supprimés ni renommés)`);
  for (const l of LINES) assert.ok(l.tiers.every((t, i) => i === 0 || t > l.tiers[i - 1]), `${l.id} : paliers croissants`);
});
test("trophées : la fusion de deux appareils garde tous les trophées", () => {
  const a = emptyState(), b = emptyState(); a.c.ok = 120; b.c.stars = 60; b.c.streakBest = 8;
  checkTrophies(a, "2026-11-13"); checkTrophies(b, "2026-11-12");
  const m = merge(a, b);
  assert.deepEqual(missingFrom(m, a), []); assert.deepEqual(missingFrom(m, b), []);
  assert.ok(m.tro["t_calc:2"] && m.tro["t_stars:2"] && m.tro["t_streak:2"]);
});

test("défi du jour : un jour = un thème, identique sur tous les appareils, qui change d'un jour à l'autre", () => {
  assert.equal(themeFor("2026-11-13").id, themeFor("2026-11-13").id);
  const ids = new Set(Array.from({ length: 7 }, (_, i) => themeFor(addDays("2026-11-13", i)).id));
  assert.equal(ids.size, THEMES.length);
});
test("fin de série du défi : compté une fois par jour, les parties en plus rapportent quand même", () => {
  const s = emptyState(); const date = "2026-11-13"; day(s, date, 20);
  const a = afterSession(s, { ok: 18, total: 20, mode: "qcm", daily: true, date });
  assert.equal(s.c.daily, 1); assert.equal(a.stars, 3);
  const b = afterSession(s, { ok: 10, total: 20, mode: "qcm", daily: true, date });
  assert.equal(s.c.daily, 1, "le défi du jour ne compte qu'une fois");
  assert.equal(s.daily[date].stars, 3, "on garde le meilleur résultat");
  assert.equal(s.c.sessions, 2); assert.equal(s.c.stars, 3 + b.stars, "chaque partie rapporte des étoiles");
});
test("ouverture : missions complétées et trophées recalculés après une fusion", () => {
  const s = emptyState(); s.c.ok = 30;
  const r = refreshState(s, "2026-11-13");
  assert.equal(s.m.active.length, SLOTS); assert.ok(r.trophies.some((t) => t.id === "t_calc:1"));
});
