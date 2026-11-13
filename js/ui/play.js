import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { toKey } from "../dates.js";
import { build, choices, famById, fmt } from "../generator.js";
import { buildSession } from "../progress.js";
import { afterAnswer, afterSession } from "../game.js";
import { trophyLabel } from "../trophies.js";
import { missionText } from "../missions.js";
import { keypad } from "./keypad.js";
import { toast, confetti } from "./notify.js";
import { creatureById, STAGE_NAMES } from "../creatures.js";
import { creatureCard } from "./album.js";
import { iconBtn } from "./common.js";
import { nudgeLines, NUDGE_DELAY, hintSpeech } from "../hints.js";
import { speak, stopSpeaking, speechSupported, voiceStatus, NO_VOICE_MESSAGE } from "../speech.js";

export const lvlStars = (l) => "★".repeat(l) + "☆".repeat(Math.max(0, 4 - l));
export const session = { opts: null }; // réglages de la série à jouer (posés par les autres écrans)

const BRAVO = ["Bravo !", "Super !", "Exact !", "Bien joué !", "Parfait !", "Excellent !", "Tu gères !"];
const OUPS = ["Presque !", "Pas tout à fait…", "Ce n'est pas grave !", "On regarde ensemble !"];
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

export function hintPanel(prob, { animate = true } = {}) {
  return h("div", { class: "hint" },
    h("div", { class: "hint-title" }, "💡 L'astuce pour ces nombres"),
    h("div", { class: "hint-text" }, prob.hint.text),
    h("div", { class: "steps" }, prob.hint.steps.map((s, i) =>
      h("div", { class: "step", style: animate ? { animationDelay: 0.25 + i * 0.35 + "s" } : { animation: "none" } },
        h("span", { class: "step-n" }, String(i + 1)),
        h("div", {}, h("div", { class: "step-t" }, s.t), h("div", { class: "step-eq" }, s.eq))))));
}

export function questionText(prob) {
  return [h("div", { class: "q-text" }, prob.q), prob.showEq ? h("div", { class: "q-eq" }, "= ?") : null];
}

export function playScreen({ go }) {
  const opts = session.opts;
  if (!opts) { go("exercices"); return { el: h("div") }; }
  const date = toKey();
  const list = buildSession(store.state, opts, Math.random, date);
  const total = list.length;
  const S = { i: 0, n: 0, ok: 0, run: 0, best: 0, input: "", locked: false, up: [], mastered: 0, timer: null, tro: [], mis: [], cre: [] };
  const root = h("main", { class: "screen play" });
  const fam0 = opts.families !== "mix" && opts.families && opts.families.length === 1 ? famById(opts.families[0]) : null;

  const bar = h("div", { class: "bar" }, h("div", { class: "bar-fill" }));
  const counter = h("span", { class: "pill" }, "");
  const top = h("div", { class: "topbar" },
    iconBtn("close", "Quitter", () => { clearTimeout(S.timer); go(opts.back ?? "exercices"); }),
    bar, counter);
  const body = h("div", { class: "play-body" });
  root.append(top, body);

  function setProgress() {
    bar.firstChild.style.width = (100 * S.n / total) + "%";
    counter.textContent = `${Math.min(S.n + 1, total)} / ${total}`;
  }

  // Coup de pouce : si elle hésite, un bouton discret apparaît ; chaque appui dévoile un peu plus de la méthode (jamais le résultat).
  function showNudge(prob, card) {
    if (S.locked || S.done || list[S.i] !== prob) return;
    const lines = nudgeLines(prob); let n = 0;
    const shown = h("div", { class: "nudge-lines" });
    const btn = h("button", { class: "nudge-btn", type: "button" }, "💡 Un coup de pouce ?");
    btn.onclick = () => {
      sfx.tap(); S.hinted = true;
      shown.append(h("div", { class: "nudge-line" }, lines[n++]));
      if (n >= lines.length) btn.remove(); else btn.textContent = "💡 Encore un indice";
    };
    card.append(h("div", { class: "nudge" }, shown, btn));
  }

  function render() {
    S.locked = false; S.input = ""; S.hinted = false; setProgress();
    const prob = list[S.i];
    const fam = famById(prob.fam);
    const dict = opts.mode === "dictee", canSpeak = voiceStatus() === "ok";
    const qMain = h("div", { class: "q-main" });
    const sayIt = () => speak(prob.say, { rate: store.settings.rate });
    const reveal = () => qMain.replaceChildren(...questionText(prob));
    S.reveal = reveal;
    if (dict && canSpeak) {
      qMain.append(
        h("button", { class: "dict-play", type: "button", "aria-label": "Écouter le calcul", onclick: () => { sfx.tap(); sayIt(); } }, "🔊"),
        h("div", { class: "dict-label" }, "Écoute le calcul"),
        h("div", { class: "dict-actions" },
          h("button", { class: "btn small light", type: "button", onclick: () => { sfx.tap(); sayIt(); } }, "↻ Répéter"),
          h("button", { class: "btn small light", type: "button", onclick: () => { sfx.tap(); reveal(); } }, "👁 Voir le calcul")));
    } else {
      reveal();
      if (dict) qMain.append(h("div", { class: "dict-note" }, NO_VOICE_MESSAGE));
    }
    const card = h("div", { class: "q-card", style: { "--fam": fam.color } },
      h("div", { class: "q-fam" }, `${fam.short}  ${fam.name} · ${lvlStars(prob.lvl || 1)}`),
      prob.review ? h("div", { class: "q-tag" }, "↻ Un calcul à revoir") : prob.retry ? h("div", { class: "q-tag" }, "↻ On le refait") : null,
      !dict && store.settings.readAloud && canSpeak ? h("button", { class: "speak-btn", type: "button", "aria-label": "Lire le calcul à voix haute", onclick: () => { sfx.tap(); sayIt(); } }, "🔊") : null,
      qMain, h("div", { class: "q-flash" }));
    if (canSpeak && (dict || store.settings.readAloud)) setTimeout(() => { if (!S.locked && list[S.i] === prob && !S.done) sayIt(); }, 350);
    body.replaceChildren(card);
    if (store.settings.answer === "qcm") renderChoices(prob, card);
    else renderInput(prob, card);
    clearTimeout(S.nudgeT);
    S.nudgeT = setTimeout(() => showNudge(prob, card), NUDGE_DELAY[store.settings.answer === "qcm" ? "qcm" : "input"]);
  }

  function renderChoices(prob, card) {
    const opts4 = choices(prob);
    const grid = h("div", { class: "choices" }, opts4.map((v, i) =>
      h("button", { class: "choice", type: "button", "data-v": v, onclick: () => { sfx.tap(); answer(v, grid.children[i]); } },
        h("span", { class: "choice-n" }, String(i + 1)), fmt(v))));
    body.append(grid);
    S.choicesEl = grid; S.optValues = opts4;
  }

  function renderInput(prob) {
    const box = h("div", { class: "answer", "aria-live": "polite" }, h("span", { class: "ph" }, "?"));
    const upd = () => { box.replaceChildren(S.input ? h("span", {}, S.input) : h("span", { class: "ph" }, "?")); };
    const pad = keypad({
      onDigit: (d) => { if (S.locked || S.input.length >= 6) return; S.input = S.input === "0" ? d : S.input + d; upd(); },
      onDel: () => { if (S.locked) return; S.input = S.input.slice(0, -1); upd(); },
      onOk: () => { if (S.locked || !S.input) return; answer(Number(S.input), box); },
    });
    body.append(box, pad);
    S.box = box; S.upd = upd;
  }

  function answer(value, el) {
    if (S.locked) return; S.locked = true;
    clearTimeout(S.nudgeT); stopSpeaking();
    const prob = list[S.i], ok = value === prob.a;
    if (S.reveal) S.reveal();
    let res;
    const run = ok ? S.run + 1 : 0;
    store.update((s) => { res = afterAnswer(s, { prob, ok, hinted: S.hinted, review: !!prob.review, run, date, mode: opts.mode, adapt: opts.adapt !== false }); });
    const ev = res.ev; S.tro.push(...res.trophies); S.mis.push(...res.missions); S.cre.push(...res.creatures);
    res.creatures.forEach((e) => { sfx.hatch(); confetti(); toast(e.from === 0 ? `${creatureById(e.id).name} est né !` : `${creatureById(e.id).name} évolue : ${STAGE_NAMES[e.to]} !`, { icon: "🥚", sound: false }); });
    if (ev.levelUp) S.up.push(ev.levelUp);
    if (ev.mastered) S.mastered++;
    if (!prob.retry) { S.n++; if (ok) S.ok++; }
    const card = body.querySelector(".q-card");
    if (ok) {
      S.run++; S.best = Math.max(S.best, S.run); sfx.ok();
      el.classList.add("good"); card.classList.add("good");
      card.querySelector(".q-flash").textContent = S.hinted ? "✓ Bravo, tu y es arrivée avec un coup de pouce !" : "✓ " + rnd(BRAVO) + (S.run >= 3 ? `  🔥 ${S.run}` : "");
      S.timer = setTimeout(next, 900);
      card.onclick = () => { clearTimeout(S.timer); next(); };
    } else {
      S.run = 0; sfx.wrong();
      el.classList.add("soft");
      if (S.choicesEl) [...S.choicesEl.children].forEach((b) => { if (Number(b.dataset.v) === prob.a) b.classList.add("good"); });
      if (!prob.retry) list.splice(Math.min(S.i + 4, list.length), 0, { ...build(prob.k, prob.p), lvl: prob.lvl, retry: true });
      showWrong(prob, card);
    }
    setProgress();
  }

  function showWrong(prob, card) {
    card.classList.add("soft");
    card.querySelector(".q-flash").textContent = `${rnd(OUPS)} La réponse : ${fmt(prob.a)}`;
    const next_ = h("button", { class: "btn green big", type: "button", onclick: next }, "J'ai compris →");
    const talk = voiceStatus() === "ok" && speechSupported();
    const hear = () => speak(hintSpeech(prob), { rate: store.settings.rate });
    if (talk && (opts.mode === "dictee" || store.settings.readAloud)) setTimeout(hear, 400);
    body.replaceChildren(card, h("div", { class: "wrong-zone" }, hintPanel(prob),
      talk && (opts.mode === "dictee" || store.settings.readAloud) ? h("button", { class: "btn light", type: "button", onclick: () => { sfx.tap(); hear(); } }, "🔊 Écouter l'astuce") : null, h("p", { class: "muted center small" }, "On le reverra bientôt, pour bien l'apprendre."), next_));
  }

  function next() {
    clearTimeout(S.timer); stopSpeaking();
    if (S.i + 1 >= list.length) return finish();
    S.i++; render();
  }

  function finish() {
    S.done = true;
    let r; store.update((s) => { r = afterSession(s, { ok: S.ok, total: S.n, mode: opts.mode, daily: !!opts.daily, date }); });
    S.tro.push(...r.trophies); S.mis.push(...r.missions);
    sfx.level();
    results(r);
  }

  function results(r) {
    const titres = ["", "Bravo d'avoir joué !", "Très bien !", "Magnifique !"];
    const titre = opts.daily ? "Défi du jour terminé !" : titres[r.stars] || "Bravo !";
    const stars = h("div", { class: "stars" }, [1, 2, 3].map((n) => h("span", { class: "star" + (n <= r.stars ? " on" : ""), style: { animationDelay: 0.3 + n * 0.25 + "s" } }, "★")));
    [1, 2, 3].forEach((n) => { if (n <= r.stars) setTimeout(() => sfx.star(n), 300 + n * 250); });
    const notes = [];
    S.up.forEach((u) => notes.push(`🚀 Niveau ${u.to} débloqué en ${famById(u.fam).name} !`));
    if (S.mastered) notes.push(`✨ ${S.mastered} calcul${S.mastered > 1 ? "s" : ""} devenu${S.mastered > 1 ? "s" : ""} facile${S.mastered > 1 ? "s" : ""} !`);
    if (S.best >= 3) notes.push(`🔥 Meilleure série : ${S.best} bonnes réponses d'affilée`);
    if (r.perfect) notes.push("💯 Zéro faute !");
    if (opts.daily && r.streak) notes.push(`🔥 Série : ${r.streak.current} jour${r.streak.current > 1 ? "s" : ""}`);
    root.replaceChildren(h("div", { class: "screen-body result" },
      h("h1", { class: "result-title" }, titre),
      stars,
      h("div", { class: "card center" }, h("div", { class: "big-num" }, `${S.ok} / ${S.n}`), h("p", {}, "bonnes réponses du premier coup")),
      notes.length ? h("div", { class: "card" }, notes.map((n) => h("p", { class: "note" }, n))) : null,
      S.tro.length ? h("div", { class: "card" }, h("h2", {}, "🏆 Nouveau" + (S.tro.length > 1 ? "x" : "") + " trophée" + (S.tro.length > 1 ? "s" : "") + " !"), S.tro.map((t) => h("p", { class: "note" }, trophyLabel(t.line, t.tier)))) : null,
      S.cre.length ? h("div", { class: "card center" }, h("h2", {}, S.cre.some((e) => e.from === 0) ? "🥚 Une créature est née !" : "🌟 Ta créature évolue !"), S.cre.map((e) => creatureCard(e))) : null,
      S.mis.length ? h("div", { class: "card" }, h("h2", {}, "🧭 Mission accomplie !"), S.mis.map((m) => h("p", { class: "note" }, missionText(m, date)))) : null,
      h("button", { class: "btn green big", onclick: () => go("jouer", true) }, "Rejouer (nouveaux calculs)"),
      h("button", { class: "btn ghost big", onclick: () => go(opts.back ?? "exercices") }, "Retour")));
  }

  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const handled = () => e.preventDefault();
    if (S.done) return;
    if (S.locked) {
      if (e.key === "Enter" || e.key === " ") { handled(); const b = document.querySelector(".wrong-zone .btn"); if (b) b.click(); else { clearTimeout(S.timer); next(); } }
      return;
    }
    if (store.settings.answer === "qcm") {
      const i = "1234".indexOf(e.key);
      if (i >= 0 && S.choicesEl) { handled(); S.choicesEl.children[i].click(); }
    } else if (/^\d$/.test(e.key)) { handled(); if (S.input.length < 6) { S.input = S.input === "0" ? e.key : S.input + e.key; S.upd(); } }
    else if (e.key === "Backspace") { handled(); S.input = S.input.slice(0, -1); S.upd(); }
    else if (e.key === "Enter" && S.input) { handled(); answer(Number(S.input), S.box); }
  };
  document.addEventListener("keydown", onKey);

  render();
  return { el: root, destroy: () => { clearTimeout(S.timer); clearTimeout(S.nudgeT); stopSpeaking(); document.removeEventListener("keydown", onKey); } };
}
