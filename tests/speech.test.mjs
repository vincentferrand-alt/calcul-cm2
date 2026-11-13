import test from "node:test";
import assert from "node:assert/strict";
import { KINDS, generate, makeRng } from "../js/generator.js";
import { speakable, hintSpeech } from "../js/hints.js";
import { speak, speechSupported, voiceStatus, stopSpeaking } from "../js/speech.js";
import { TEMPLATES, missionText } from "../js/missions.js";
import { emptyState } from "../js/state.js";
import { missionEvent } from "../js/missions.js";
import { DEFAULT_SETTINGS } from "../js/storage.js";

const rng = makeRng(4242);

test("lecture à voix haute : aucun symbole mathématique dans le texte lu, nombres sans séparateur", () => {
  for (const k of Object.values(KINDS)) for (const lvl of k.levels) for (let i = 0; i < 150; i++) {
    const p = generate(k.fam, lvl, rng, { kinds: [k.id] });
    const t = hintSpeech(p);
    assert.ok(!/[×÷−+=→]/.test(t), `symbole restant : ${t}`);
    assert.ok(!/\d[   ]\d{3}(\D|$)/.test(t) || !/\d{1,3}[  ]\d{3}/.test(t), `séparateur de milliers : ${t}`);
    assert.ok(t.includes(String(p.a)), "la réponse est annoncée");
    assert.ok(p.say && !/\d/.test(p.say), `la phrase de dictée est en toutes lettres : ${p.say}`);
  }
  assert.equal(speakable("12 × 4 = 48"), "12 fois 4 égale 48");
  assert.equal(speakable("1 200 − 300 → 900"), "1200 moins 300, 900");
});

test("sans synthèse vocale (ou voix absente) : tout reste silencieux et sans erreur", () => {
  assert.equal(speechSupported(), false); assert.equal(voiceStatus(), "none");
  let ended = 0; assert.equal(speak("bonjour", { onend: () => ended++ }), false); assert.equal(ended, 1);
  stopSpeaking();
});

test("mission dictée : ne se valide qu'avec une vraie dictée d'au moins 5 calculs", () => {
  assert.equal(TEMPLATES.dictee.make(emptyState(), rng), null, "pas de mission dictée sans voix");
  const s = emptyState();
  s.m.active = [{ id: "m-d", tpl: "dictee", params: {}, target: 1, progress: 0, done: false }];
  missionEvent(s, { type: "session", mode: "qcm", ok: 9, total: 10 }, rng, "2026-11-13");
  assert.equal(s.m.active[0].progress, 0);
  missionEvent(s, { type: "session", mode: "dictee", ok: 3, total: 4 }, rng, "2026-11-13");
  assert.equal(s.m.active[0].progress, 0);
  const done = missionEvent(s, { type: "session", mode: "dictee", ok: 8, total: 10 }, rng, "2026-11-13");
  assert.equal(done.length, 1); assert.ok(missionText({ tpl: "dictee", params: {}, target: 1 }).includes("dictée"));
});

test("réglages : valeurs par défaut sûres (vitesse normale, lecture désactivée, aucun compagnon imposé)", () => {
  assert.equal(DEFAULT_SETTINGS.rate, 0.9); assert.equal(DEFAULT_SETTINGS.readAloud, false); assert.equal(DEFAULT_SETTINGS.companion, null);
});
