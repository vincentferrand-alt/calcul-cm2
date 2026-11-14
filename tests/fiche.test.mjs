import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeRng, FAMILIES } from "../js/generator.js";
import { emptyState, migrate, merge, missingFrom } from "../js/state.js";
import { HOLE, fmtDec, parseAnswer, sameValue, typeKey, buildSheet, makeFiche, RHYTHMS, rhythmById, rhythmLine, perCalc, PERIODS, LINES, periodFor, periodOf,
  scoreFiche, recordFiche, recKey, ficheBest, ficheBestAny, ficheCount, ficheHistory, evenParts, filled, solved, UNITS,
  practiceSet, typesOf, ficheTrend, revengeTypes, REVENGE } from "../js/fiche.js";
import { afterFiche, afterPractice } from "../js/game.js";
import { refillMissions, TEMPLATES, missionText } from "../js/missions.js";
import { allTrophyIds, lineById } from "../js/trophies.js";
import { todaySummary } from "../js/today.js";
import { launchGame, gameById } from "../js/games.js";
import { playableMissions, launchFor } from "../js/next.js";

const D = "2026-11-14";
const clean = (t) => String(t).replace(/[  ]/g, "").replace(/,/g, ".");
const ev = (expr) => {
  const e = clean(expr).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  if (!/^[\d.\s+\-*/()]+$/.test(e)) throw new Error("expression inattendue : " + expr);
  return Function(`"use strict"; return (${e})`)();
};
const near = (a, b) => Math.abs(a - b) < 1e-7;
function checkEq(eq) {
  for (const seg of eq.split(" ; ")) {
    const parts = seg.split(" = ");
    assert.equal(parts.length, 2, "égalité mal formée : " + eq);
    assert.ok(near(ev(parts[0]), ev(parts[1])), "égalité fausse : " + seg);
  }
}
const WORDS = { "Moitié": 1 / 2, "Double": 2, "Triple": 3, "Quadruple": 4, "Quart": 1 / 4, "Tiers": 1 / 3 };
const UNIT_VAL = Object.fromEntries(Object.values(UNITS).flatMap(([w, v]) => [[w, v], [w.replace(/^(\S+)/, "$1s"), v]]));
// La réponse attendue, recalculée à partir de l'énoncé seul.
function expected(q) {
  let m;
  if ((m = q.match(/^(Moitié|Double|Triple|Quadruple|Quart|Tiers) de (.+) = □$/))) return ev(m[2]) * WORDS[m[1]];
  if ((m = q.match(/^(\d+) (.+?) et (\d+) (.+) = □$/))) { assert.ok(m[2] in UNIT_VAL && m[4] in UNIT_VAL, "unité inconnue : " + q); return m[1] * UNIT_VAL[m[2]] + m[3] * UNIT_VAL[m[4]]; }
  return null;
}

test("fiche : écriture des nombres à virgule et lecture de la réponse tapée", () => {
  assert.equal(fmtDec(7.6), "7,6"); assert.equal(fmtDec(0.07), "0,07"); assert.equal(fmtDec(760), "760"); assert.equal(clean(fmtDec(440040)), "440040");
  assert.match(fmtDec(440040), /^440\D040$/); assert.equal(fmtDec(0.1 + 0.2), "0,3"); assert.equal(fmtDec(0.00199), "0,00199"); assert.equal(fmtDec(15.40), "15,4");
  assert.equal(parseAnswer("0,7"), 0.7); assert.equal(parseAnswer("6,60"), 6.6); assert.equal(parseAnswer("1 250"), 1250); assert.equal(parseAnswer("12"), 12); assert.equal(parseAnswer("5,"), 5);
  for (const bad of ["", ",", "abc", "1,2,3", "-4", null, undefined]) assert.equal(parseAnswer(bad), null, String(bad));
  assert.ok(sameValue(parseAnswer("0,70"), 0.7)); assert.ok(!sameValue(null, 0)); assert.ok(!sameValue(0.71, 0.7));
});

test("fiche : le clavier — une seule virgule, « ,5 » → « 0,5 », longueur bornée", () => {
  let t = ""; for (const k of [",", "5", ",", "2"]) t = typeKey(t, k);
  assert.equal(t, "0,52");
  assert.equal(typeKey("0", "7"), "7"); assert.equal(typeKey("12", "del"), "1"); assert.equal(typeKey("", "del"), "");
  let long = ""; for (let i = 0; i < 20; i++) long = typeKey(long, "9");
  assert.equal(long.length, 9);
});

test("fiche : 5 périodes × 50 lignes — énoncés, réponses et astuces exacts (beaucoup de tirages)", () => {
  const fams = new Set(FAMILIES.map((f) => f.id));
  for (const period of PERIODS) for (let seed = 1; seed <= 60; seed++) {
    const sheet = buildSheet(period, makeRng(period * 1000 + seed));
    assert.equal(sheet.length, LINES);
    sheet.forEach((p, k) => {
      const where = `P${period} ligne ${p.line} : ${p.q}`;
      assert.equal(p.line, k + 1);
      assert.equal(p.q.split(HOLE).length, 2, "un seul trou — " + where);
      assert.ok(Number.isFinite(p.a) && p.a >= 0, "réponse positive — " + where);
      assert.ok(near(p.a, Math.round(p.a * 1e5) / 1e5), "au plus 5 décimales — " + where);
      assert.ok(fmtDec(p.a).replace(/\D/g, "").length <= 9, "réponse tapable — " + where);
      assert.ok(fams.has(p.fam), "famille connue — " + where);
      assert.ok(p.t && typeof p.t === "string");
      const exp = expected(p.q);
      if (exp !== null) assert.ok(near(exp, p.a), `${where} → attendu ${exp}, obtenu ${p.a}`);
      else { const [l, r] = filled(p, fmtDec(p.a)).split(" = "); assert.ok(near(ev(l), ev(r)), "égalité de l'énoncé — " + where + " avec " + p.a); }
      assert.ok(p.hint && p.hint.steps.length >= 1 && p.hint.steps.length <= 5, "astuce — " + where);
      for (const st of p.hint.steps) { assert.ok(st.t && st.eq, where); checkEq(st.eq); }
      assert.ok(clean(p.hint.text).endsWith("= " + clean(fmtDec(p.a))), "l'astuce se termine par la réponse — " + where + " / " + p.hint.text);
      assert.doesNotMatch(p.hint.text + p.hint.steps.map((s) => s.t + s.eq).join(""), /undefined|NaN|null|Infinity/, where);
    });
  }
});

test("fiche : les lignes suivent la fiche de la classe (formes des énoncés, progression des périodes)", () => {
  const P = (period, seed = 5) => buildSheet(period, makeRng(seed));
  for (let seed = 1; seed <= 30; seed++) {
    const p1 = P(1, seed), p2 = P(2, seed), p3 = P(3, seed), p4 = P(4, seed), p5 = P(5, seed);
    const q = (sheet, n) => clean(sheet[n - 1].q);
    assert.match(q(p1, 1), /^\d(\.\d)? × 10{1,3} = □$/);            // 7,6 × 100
    assert.match(q(p1, 2), /^[1-9]00 ÷ 10{1,3} = □$/);              // 400 ÷ 1 000
    assert.match(q(p1, 6), /^□ × \d+ = \d+$/);                      // □ × 7 = 56
    assert.match(q(p1, 9), /^\d+ \+ □ = [1-9]00$/);                 // 642 + □ = 700
    assert.match(q(p1, 12), /^Moitié de \d+ = □$/);
    assert.match(q(p1, 19), /^\d(\.\d)? \+ □ = 10$/);               // 6,9 + □ = 10
    assert.match(q(p1, 27), /^0\.\d \+ □ = 1$/);                    // 0,3 + □ = 1
    assert.match(q(p1, 34), /^\d unités? et \d dixièmes? = □$/);
    assert.match(q(p1, 38), /^\d+ \+ \d+ \+ \d+ = □$/);
    assert.match(q(p1, 42), /^\d+ × □ = \d+$/);
    assert.match(q(p1, 47), /^\d+ dizaines? de mille et \d dizaines? = □$/);
    assert.match(q(p1, 50), /^\d\.?\d* × 10{1,3} = □$/);
    assert.match(q(p2, 9), /^\d+ \+ □ = [2-9]000$/);                // période 2 : compléments au millier
    assert.match(q(p2, 22), /^\d+ ÷ □ = \d$/); assert.match(q(p2, 30), /^\d+ ÷ □ = \d$/); // divisions à trou
    assert.match(q(p2, 47), /centaines?/);
    assert.match(q(p3, 1), /^0\.\d+ × 10{1,3} = □$/); assert.match(q(p3, 2), /^[1-9]0 ÷ 10{1,3} = □$/);
    assert.match(q(p4, 36), /^Double de \d(\.\d)? = □$/); assert.match(q(p4, 47), /centaines? de mille/);
    assert.match(q(p5, 3), /^\d{4} \+ (9|19|11|21) = □$/); assert.match(q(p5, 5), /÷ 9 = □$/); assert.match(q(p5, 9), /= [2-9]0000$/);
    assert.match(q(p5, 34), /^\d+ dizaines? et \d centièmes? = □$/);
    assert.ok(p1[5].a >= 1 && p1[41].a >= 2, "jamais « 0 × □ = 0 » (réponse indéterminée)");
  }
  assert.equal(filled({ q: "0,3 + □ = 1" }, "0,7"), "0,3 + 0,7 = 1");
  assert.match(solved(P(1)[26]), /^0,\d \+ 0,\d = 1$/);
});

test("fiche : accords — 0 et 1 au singulier, 2 et plus au pluriel", () => {
  const seen = new Set();
  for (let seed = 1; seed <= 400; seed++) for (const period of [1, 5]) for (const n of [34, 47]) seen.add(buildSheet(period, makeRng(seed))[n - 1].q);
  for (const q of seen) {
    for (const m of q.matchAll(/(\d+) (unités?|dizaines?|centaines?|dixièmes?|centièmes?)/g)) assert.equal(/s$/.test(m[2]), Number(m[1]) > 1, q);
    assert.doesNotMatch(q, /de milles/, q);
  }
});

test("fiche : moitiés — découpage en morceaux faciles", () => {
  for (let n = 20; n <= 1000; n += 2) {
    const parts = evenParts(n);
    assert.equal(parts.reduce((a, b) => a + b, 0), n, String(n));
    for (const p of parts) assert.ok(Number.isInteger(p / 2), `${n} : ${p}`);
  }
  assert.deepEqual(evenParts(730), [600, 120, 10]); assert.deepEqual(evenParts(760), [600, 160]); assert.deepEqual(evenParts(1000), [1000]); assert.deepEqual(evenParts(48), [40, 8]);
});

test("fiche : 4 rythmes — même contenu, moins de calculs ou moins de temps ; ordre de la fiche conservé", () => {
  assert.deepEqual(RHYTHMS.map((x) => [x.id, x.n, x.secs]), [["decouverte", 20, 300], ["entrainement", 35, 300], ["classe", 50, 300], ["championne", 50, 240]]);
  assert.equal(rhythmById("inconnu").id, "classe"); assert.equal(rhythmLine(rhythmById("classe")), "50 calculs · 5 minutes"); assert.equal(perCalc(rhythmById("classe")), 6);
  for (const x of RHYTHMS) for (let seed = 1; seed <= 10; seed++) {
    const f = makeFiche(2, x.id, makeRng(seed));
    assert.equal(f.length, x.n);
    for (let k = 1; k < f.length; k++) assert.ok(f[k].line > f[k - 1].line, "ordre de la fiche");
  }
  const a = makeFiche(1, "decouverte", makeRng(1)).map((p) => p.line), b = makeFiche(1, "decouverte", makeRng(2)).map((p) => p.line);
  assert.notDeepEqual(a, b, "le tirage des 20 lignes change d'une fiche à l'autre");
});

test("fiche : période de l'année (automatique) et choix à la main", () => {
  const exp = { "2026-09-01": 1, "2026-10-15": 1, "2026-11-01": 1, "2026-11-02": 2, "2026-11-14": 2, "2026-12-31": 2, "2027-01-04": 2, "2027-01-05": 3, "2027-02-28": 3, "2028-02-29": 3,
    "2027-03-01": 4, "2027-04-30": 4, "2027-05-01": 5, "2027-07-06": 5, "2027-08-31": 5 };
  for (const [d, p] of Object.entries(exp)) assert.equal(periodFor(d), p, d);
  assert.equal(periodOf(4, D), 4); assert.equal(periodOf("3", D), 3); assert.equal(periodOf(0, D), 2); assert.equal(periodOf(undefined, D), 2); assert.equal(periodOf(9, D), 2);
});

const play = (problems, fn) => problems.map((p, k) => fn(p, k));

test("fiche : correction — juste, à reprendre, pas encore fait (jamais une faute)", () => {
  const f = makeFiche(2, "classe", makeRng(4));
  const answers = play(f, (p, k) => (k < 30 ? fmtDec(p.a) : k < 34 ? "99999" : ""));
  answers[0] = fmtDec(f[0].a) + (fmtDec(f[0].a).includes(",") ? "0" : ",0"); // « 7,60 » ou « 76,0 » : accepté
  const sc = scoreFiche(f, answers);
  assert.equal(sc.ok, 30); assert.equal(sc.miss, 4); assert.equal(sc.todo, 16); assert.equal(sc.answered, 34); assert.equal(sc.total, 50);
  assert.equal(scoreFiche(f, []).todo, 50); assert.equal(scoreFiche(f, [" "]).rows[0].state, "todo");
});

test("fiche : enregistrement — compteurs, familles, record, étoiles ; ni niveau ni calculs à revoir", () => {
  const s = emptyState(); s.fam.mul = { xp: 3, n: 5, lvl: 2, maxLvl: 2, recent: [1, 1, 0] };
  const f = makeFiche(2, "classe", makeRng(9));
  const sc = scoreFiche(f, play(f, (p, k) => (k < 20 ? fmtDec(p.a) : k < 25 ? "7777777" : "")));
  const r = recordFiche(s, { period: 2, rhythm: "classe", score: sc, secs: 300, date: D, stamp: D + "T10:00:00" });
  assert.equal(s.c.tot, 25); assert.equal(s.c.ok, 20); assert.equal(s.days[D].tot, 25); assert.equal(s.days[D].ok, 20);
  assert.equal(Object.values(s.fam).reduce((t, x) => t + x.xp, 0), 3 + 20, "une bonne réponse = un point pour sa famille");
  assert.equal(Object.values(s.days[D].fam).reduce((a, b) => a + b, 0), 20);
  assert.equal(s.fam.mul.lvl, 2); assert.deepEqual(s.fam.mul.recent, [1, 1, 0], "le niveau adaptatif ne bouge pas");
  assert.deepEqual(s.review, {}, "rien dans les calculs à revoir (nombres à virgule seulement dans ce mode)");
  assert.equal(r.stars, 1); assert.equal(s.c.stars, 1); assert.equal(s.c.sessions, 1); assert.equal(r.perfect, false);
  assert.deepEqual(r.record, { best: 20, before: 0, beaten: false, first: true }); assert.equal(s.c.speed, 0, "premier record : pas encore « battu »");
  assert.equal(s.rec[recKey(2, "classe")], 20); assert.equal(ficheBest(s, 2, "classe"), 20); assert.equal(ficheBest(s, 2, "decouverte"), 0);
  const e = s.fiche[D + "T10:00:00"]; assert.deepEqual([e.p, e.r, e.ok, e.n, e.tot, e.t], [2, "classe", 20, 25, 50, 300]); assert.ok(e.miss.length >= 1 && e.miss.length <= 5);
  // moins bien : le record reste ; mieux : record battu → trophée « Éclair »
  const worse = scoreFiche(f, play(f, (p, k) => (k < 10 ? fmtDec(p.a) : "")));
  assert.equal(recordFiche(s, { period: 2, rhythm: "classe", score: worse, secs: 200, date: D, stamp: D + "T11:00:00" }).record.beaten, false);
  assert.equal(s.rec[recKey(2, "classe")], 20);
  const better = scoreFiche(f, play(f, (p) => fmtDec(p.a)));
  const r3 = recordFiche(s, { period: 2, rhythm: "classe", score: better, secs: 250, date: D, stamp: D + "T12:00:00" });
  assert.deepEqual(r3.record, { best: 50, before: 20, beaten: true, first: false }); assert.equal(s.c.speed, 1); assert.equal(r3.stars, 3); assert.equal(r3.perfect, true); assert.equal(s.c.perfect, 1);
  assert.equal(ficheCount(s), 3); assert.equal(s.c.fiche, 3); assert.equal(ficheBestAny(s), 50);
  assert.deepEqual(ficheHistory(s).map((x) => x.ok), [50, 10, 20], "de la plus récente à la plus ancienne");
});

test("fiche : mission, trophées et créatures comme une série normale", () => {
  const s = emptyState(); refillMissions(s, makeRng(1), D);
  s.m.active[0] = { id: "m-fiche", tpl: "fiche", params: {}, target: 1, progress: 0, done: false };
  assert.equal(missionText(s.m.active[0], D), "Fais une fiche « 50 calculs en 5 minutes »");
  assert.ok(playableMissions(s, D).some((m) => m.tpl === "fiche")); assert.deepEqual(launchFor({ kind: "mission", mission: s.m.active[0] }, D), { route: "chrono" });
  const f = makeFiche(1, "decouverte", makeRng(2));
  const r = afterFiche(s, { period: 1, rhythm: "decouverte", score: scoreFiche(f, play(f, (p) => fmtDec(p.a))), secs: 180, date: D, stamp: D + "T09:30:00" });
  assert.ok(r.missions.some((m) => m.id === "m-fiche"), "mission accomplie");
  assert.ok(r.trophies.some((t) => t.id === "t_fiche:1")); assert.ok(s.tro["t_fiche:1"]);
  assert.equal(s.c.ok, 20); assert.ok(Array.isArray(r.creatures)); assert.ok(r.streak.current >= 1);
  assert.ok(allTrophyIds().includes("t_fiche:4")); assert.equal(lineById("t_fiche").tiers.length, 4); assert.match(lineById("t_speed").desc(5), /record/);
  assert.ok(TEMPLATES.fiche);
});

test("fiche : sauvegarde additive — anciennes sauvegardes, fusion sans perte, record = maximum", () => {
  for (const file of fs.readdirSync(new URL("./fixtures/", import.meta.url))) {
    const s = migrate(JSON.parse(fs.readFileSync(new URL("./fixtures/" + file, import.meta.url), "utf8")));
    assert.ok(s.fiche && typeof s.fiche === "object", file); assert.ok(Number.isFinite(s.c.fiche), file);
    assert.ok(todaySummary(s, D).fiche.status.length > 0, file);
  }
  const a = emptyState(), b = emptyState();
  a.fiche["2026-11-14T10:00:00"] = { p: 2, r: "classe", ok: 31, n: 40, tot: 50, t: 300, miss: ["dmul"] }; a.rec["fiche:p2:classe"] = 31; a.c.fiche = 1;
  b.fiche["2026-11-14T18:00:00"] = { p: 2, r: "classe", ok: 36, n: 44, tot: 50, t: 300, miss: [] }; b.rec["fiche:p2:classe"] = 36; b.c.fiche = 1;
  const m = merge(a, b);
  assert.equal(Object.keys(m.fiche).length, 2); assert.equal(m.rec["fiche:p2:classe"], 36); assert.equal(ficheCount(m), 2);
  assert.deepEqual(merge(b, a), m, "commutative"); assert.deepEqual(merge(m, a), m, "idempotente");
  assert.deepEqual(missingFrom(m, a), []); assert.deepEqual(missingFrom(m, b), []);
  assert.ok(missingFrom(a, b).includes("fiche:2026-11-14T18:00:00"), "une fiche perdue serait détectée");
  assert.equal(todaySummary(m, D).fiche.status, "36 points"); assert.equal(todaySummary(emptyState(), D).fiche.status, "À essayer");
});

test("fiche : la tuile « 50 en 5 min » de l'onglet Jouer mène à l'écran de la fiche", () => {
  assert.equal(gameById("chrono").name, "50 en 5 min"); assert.equal(gameById("chrono").themed, false);
  assert.deepEqual(launchGame("chrono", "classe", {}), { route: "chrono", opts: null });
});

test("v0.19 : entraînement par type — bons types, pas de doublon, période la plus proche si besoin", () => {
  for (const period of PERIODS) for (const t of typesOf(period)) {
    const set = practiceSet(period, [t], 10, makeRng(t.length * period));
    assert.ok(set.length >= 3, `${t} en période ${period}`);
    assert.ok(set.every((p) => p.t === t), t);
    assert.equal(new Set(set.map((p) => p.q)).size, set.length, "jamais deux fois le même énoncé");
  }
  const mix = practiceSet(2, ["dmul", "gapone", "num"], 10, makeRng(5));
  assert.equal(mix.length, 10); assert.ok(new Set(mix.map((p) => p.t)).size >= 2);
  assert.ok(practiceSet(1, ["gapdiv"], 5, makeRng(1)).every((p) => p.t === "gapdiv"), "divisions à trou : prises en période 2");
  assert.deepEqual(practiceSet(1, ["inconnu"], 5), []);
});

test("v0.19 : revanche — types des erreurs d'abord, puis des calculs pas faits ; 10 calculs en 2 minutes", () => {
  assert.deepEqual(REVENGE, { n: 10, secs: 120 });
  const f = makeFiche(2, "classe", makeRng(8));
  const sc = scoreFiche(f, f.map((p, k) => (k < 40 ? fmtDec(p.a) : k < 42 ? "99999" : "")));
  const t = revengeTypes(sc);
  assert.ok(t.length >= 1 && t.length <= 3);
  assert.equal(t[0], f[40].t, "le type de la première erreur d'abord");
  assert.deepEqual(revengeTypes(scoreFiche(f, f.map((p) => fmtDec(p.a)))), [], "fiche parfaite : pas de revanche");
});

test("v0.19 : courbe « Mes fiches » — de la plus ancienne à la plus récente, 8 au plus", () => {
  const s = emptyState();
  assert.deepEqual(ficheTrend(s), []);
  for (let k = 0; k < 11; k++) s.fiche[`2026-11-${String(k + 1).padStart(2, "0")}T10:00:00`] = { p: 2, r: k % 2 ? "decouverte" : "classe", ok: 10 + k, n: 20, tot: k % 2 ? 20 : 50, t: 300, miss: [] };
  const t = ficheTrend(s);
  assert.equal(t.length, 8); assert.equal(t[7].ok, 20); assert.equal(t[0].ok, 13);
  assert.equal(t[7].pct, 40); assert.equal(t[6].pct, 95); assert.equal(t[7].icon, "🏫");
});

test("v0.19 : entraînement compté (jour, familles, missions), sans record ni fiche enregistrée", () => {
  const s = emptyState(); refillMissions(s, makeRng(2), D);
  const set = practiceSet(2, ["dmul"], 10, makeRng(3));
  const r = afterPractice(s, set.map((p, k) => ({ p, state: k < 7 ? "ok" : "miss" })), D);
  assert.equal(s.c.tot, 10); assert.equal(s.c.ok, 7); assert.equal(s.days[D].ok, 7); assert.equal(s.fam.mul.xp, 7);
  assert.deepEqual(s.fiche, {}); assert.deepEqual(s.rec, {}); assert.equal(s.c.sessions, 0);
  assert.ok(Array.isArray(r.missions) && Array.isArray(r.trophies) && Array.isArray(r.creatures));
});
