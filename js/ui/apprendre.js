import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { toKey } from "../dates.js";
import { FAMILIES, famById, build, generate, shuffle, fmt } from "../generator.js";
import { FICHES, ficheById } from "../learn.js";
import { afterLearn } from "../game.js";
import { trophyLabel } from "../trophies.js";
import { missionText } from "../missions.js";
import { toast } from "./notify.js";
import { session } from "./play.js";
import { topbar } from "./common.js";
import { exampleOf, practiceSet, periodOf, fmtDec, parseAnswer, HOLE, r5 } from "../fiche.js";

// v0.17 : « Apprendre » est un onglet à part entière : toutes les fiches en tuiles sur deux colonnes (rangées par famille,
// la couleur et le symbole de la famille sur chaque tuile), avec le compteur des astuces découvertes.
export function apprendreScreen({ go }) {
  const s = store.state;
  const seen = FICHES.filter((f) => s.learn[f.id]).length, pct = Math.round(100 * seen / FICHES.length);
  const ordered = FAMILIES.flatMap((fam) => FICHES.filter((f) => f.fam === fam.id).map((f) => ({ f, fam })));
  const tiles = ordered.map(({ f, fam }) => h("button", { class: "learn-item" + (s.learn[f.id] ? " seen" : ""), type: "button", style: { "--fam": fam.color, "--fam-ink": fam.ink },
    "aria-label": `${f.title} (${fam.name})${s.learn[f.id] ? ", déjà vue" : ""}`, onclick: () => { sfx.tap(); go("fiche/" + f.id); } },
    h("span", { class: "learn-top" }, h("span", { class: "learn-emoji", "aria-hidden": "true" }, f.emoji), h("span", { class: "fam-dot", "aria-hidden": "true" }, fam.short)),
    h("span", { class: "learn-t" }, f.title),
    s.learn[f.id] ? h("span", { class: "learn-done", "aria-hidden": "true" }, "✓") : null));
  return { el: h("main", { class: "screen" }, topbar("Apprendre", null),
    h("div", { class: "screen-body apprendre" },
      h("div", { class: "card learn-head" },
        h("div", { class: "row" }, h("span", { class: "learn-bulb", "aria-hidden": "true" }, "💡"),
          h("div", { class: "grow" }, h("b", {}, `${seen} / ${FICHES.length} astuces découvertes`), h("p", {}, seen === FICHES.length ? "Tu les connais toutes, bravo ! Tu peux les revoir quand tu veux." : "Une astuce, un exemple, et c'est parti !"))),
        h("div", { class: "bar small" }, h("div", { class: "bar-fill", style: { width: pct + "%" } }))),
      h("div", { class: "learn-grid" }, tiles))) };
}

const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter(Boolean));
const splitLast = (eq) => {
  const segs = eq.split(" ; "), last = segs.pop(), i = last.lastIndexOf(" = ");
  return { before: segs.length ? segs.join(" ; ") + " ; " : "", lhs: last.slice(0, i), rhs: last.slice(i + 3) };
};
function stepChoices(v) {
  // v0.19 : nombres à virgule — les pièges classiques sont la virgule mal placée (× 10, ÷ 10) et l'erreur d'un dixième.
  const cands = Number.isInteger(v) ? [v + 10, v - 10, v + 1, v - 1, v + 2, v - 2, v + 20] : [v * 10, v / 10, v + 1, v - 1, v + 0.1, v - 0.1, v + 0.2];
  const wrong = []; for (const c of cands.map(r5)) if (c > 0 && c !== v && !wrong.includes(c) && wrong.length < 2) wrong.push(c);
  return shuffle([v, ...wrong]);
}
// v0.19 : un calcul d'exemple, qu'il vienne du générateur (fiches d'origine) ou de la fiche chrono (fiches à virgule).
const exProblem = (f, ex) => (f.chrono ? exampleOf(ex.t, ex.opts, ...ex.vals) : build(ex.kind, ex.p));
// L'énoncé d'un calcul de la fiche chrono, à la manière des fiches : « 7,6 × 100 = ? », « 0,3 + ? = 1 ».
const qText = (p) => p.q.replace(HOLE, "?");

export function ficheScreen({ go, args }) {
  const f = ficheById(args[0]);
  if (!f) { go("apprendre"); return { el: h("div") }; }
  const fam = famById(f.fam);
  const date = toKey();
  const learned = () => {
    let r; store.update((st) => { r = afterLearn(st, f.id, date); });
    r.trophies.forEach((t) => toast("Nouveau trophée : " + trophyLabel(t.line, t.tier)));
    r.missions.forEach((m) => toast("Mission accomplie : " + missionText(m, date), { icon: "🧭", sound: false }));
  };
  const root = h("main", { class: "screen", style: { "--fam": fam.color, "--fam-ink": fam.ink } });

  // --- exemple pas à pas (écrit à l'avance)
  let exIdx = 0, shown = 0;
  const exBox = h("div", { class: "card" });
  function drawExample() {
    const exs = f.chrono ? f.chrono.examples : f.examples;
    const ex = exs[exIdx], p = exProblem(f, ex), steps = p.hint.steps;
    const tabs = exs.length > 1 ? h("div", { class: "tabs" }, exs.map((e, i) => h("button", { class: "tab" + (i === exIdx ? " on" : ""), onclick: () => { exIdx = i; shown = 0; drawExample(); } }, e.label))) : null;
    const done = shown >= steps.length;
    fill(exBox, h("h2", {}, "👀 L'exemple pas à pas"), tabs,
      h("div", { class: "ex-q" }, f.chrono ? qText(p) : ex.label, p.showEq ? " = ?" : ""),
      h("div", { class: "steps" }, steps.slice(0, shown).map((st, i) =>
        h("div", { class: "step", style: { animationDelay: "0s" } }, h("span", { class: "step-n" }, String(i + 1)), h("div", {}, h("div", { class: "step-t" }, st.t), h("div", { class: "step-eq" }, st.eq))))),
      done ? h("div", { class: "ex-result" }, `Résultat : ${fmtDec(p.a)} ✓`) : null,
      h("button", { class: "btn " + (done ? "light" : ""), onclick: () => { sfx.tap(); if (done) { shown = 0; } else { shown++; if (shown >= steps.length) { sfx.ok(); learned(); } } drawExample(); } },
        done ? "↺ Revoir" : shown === 0 ? "Montre-moi l'astuce ▶" : "Étape suivante ▶"));
  }

  // --- mini-exemple interactif : elle trouve elle-même chaque étape
  const gBox = h("div", { class: "card" });
  let gp, gi, gwrong;
  function newGuided() { gp = f.chrono ? practiceSet(periodOf(store.settings.fichePeriod, date), f.chrono.types, 1)[0] : generate(f.fam, Math.random() < 0.5 ? 1 : 2, Math.random, { kinds: f.kinds }); gi = 0; gwrong = new Set(); drawGuided(); }
  function drawGuided() {
    const steps = gp.hint.steps, finished = gi >= steps.length;
    const doneSteps = steps.slice(0, gi).map((st, i) => h("div", { class: "step ok", style: { animation: "none", opacity: 1 } }, h("span", { class: "step-n" }, "✓"), h("div", {}, h("div", { class: "step-t" }, st.t), h("div", { class: "step-eq" }, st.eq))));
    let current = null;
    if (!finished) {
      const st = steps[gi], { before, lhs, rhs } = splitLast(st.eq), v = parseAnswer(rhs); // v0.19 : lit aussi les nombres à virgule
      current = h("div", { class: "step cur", style: { animation: "none", opacity: 1 } },
        h("span", { class: "step-n" }, String(gi + 1)),
        h("div", { class: "grow" }, h("div", { class: "step-t" }, st.t), h("div", { class: "step-eq" }, before + lhs + " = ", h("span", { class: "blank" }, "▢")),
          h("div", { class: "mini-choices" }, stepChoices(v).map((c) => h("button", { class: "mini" + (gwrong.has(c) ? " soft" : ""), disabled: gwrong.has(c), onclick: () => {
            if (c === v) { sfx.ok(); gi++; gwrong = new Set(); if (gi >= steps.length) { sfx.level(); learned(); } } else { sfx.wrong(); gwrong.add(c); }
            drawGuided();
          } }, fmtDec(c))))));
    }
    fill(gBox, h("h2", {}, "🎮 À toi de jouer !"), h("p", { class: "muted" }, "Trouve chaque étape de l'astuce."),
      h("div", { class: "ex-q" }, f.chrono ? qText(gp) : gp.q, gp.showEq ? " = ?" : ""),
      h("div", { class: "steps" }, doneSteps, current),
      finished ? h("div", { class: "ex-result" }, `Bravo ! ${fmtDec(gp.a)} ✓`) : null,
      h("button", { class: "btn light", onclick: newGuided }, finished ? "Un autre exemple ▶" : "Changer de calcul"));
  }

  drawExample(); newGuided();
  const train = () => {
    learned();
    if (f.chrono) { go("chrono/train/" + f.id); return; } // v0.19 : 10 calculs sans chrono, réponse tapée avec la virgule
    session.opts = { families: [f.fam], kinds: f.kinds, count: store.settings.count || 10, mode: store.settings.answer === "qcm" ? "qcm" : "input", adapt: false, noReview: true, back: "fiche/" + f.id };
    go("jouer");
  };
  root.append(topbar(f.title, () => go("apprendre")),
    h("div", { class: "screen-body" },
      h("div", { class: "fiche-head" }, h("div", { class: "fiche-emoji" }, f.emoji), h("div", { class: "idea" }, f.idea)),
      h("div", { class: "card" }, h("h2", {}, "💡 Le principe"), h("p", {}, f.intro), f.tip ? h("p", { class: "tip" }, f.tip) : null),
      exBox, gBox,
      h("button", { class: "btn big green", onclick: train }, "Je m'entraîne ▶")));
  return { el: root };
}
