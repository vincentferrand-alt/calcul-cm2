// Onglet « Jouer » (v0.17) : 1. on choisit son jeu (tuiles identiques) ; 2. on choisit son thème (UNE grille pour tous les jeux),
// et un appui sur le thème lance la partie. Les réglages de réponse n'apparaissent que pour les jeux qu'ils concernent.
import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { FAMILIES } from "../generator.js";
import { session, lvlStars } from "./play.js";
import { topbar } from "./common.js";
import { dueReviews } from "../progress.js";
import { launchFor, REVIEW_MAX } from "../next.js";
import { toKey } from "../dates.js";
import { GAMES, gameById, launchGame } from "../games.js";
import { RHYTHMS, PERIODS, rhythmLine, perCalc, periodOf, periodFor, ficheBest } from "../fiche.js";

export function exercicesScreen({ go }) {
  const root = h("main", { class: "screen" });
  const s = store.state;
  const launch = (l) => { session.opts = l.opts; go(l.route, true); };
  function draw() {
    const set = store.settings, game = gameById(set.game);
    const seg = (key, options, label) => h("div", { class: "opt-row" }, h("span", { class: "opt-l" }, label),
      h("div", { class: "seg", role: "group", "aria-label": label }, options.map(([val, text]) => {
        const on = set[key] === val || (key === "count" && !set.count && val === 10);
        return h("button", { class: "seg-b" + (on ? " on" : ""), type: "button", "aria-pressed": on ? "true" : "false", onclick: () => { sfx.tap(); store.set(key, val); draw(); } }, text);
      })));
    // Les calculs à revoir : une ligne fine tout en haut (rien s'il n'y en a pas).
    const date = toKey(), due = dueReviews(s, date).length, n = Math.min(due, REVIEW_MAX);
    const review = due ? h("button", { class: "review-row", type: "button", "aria-label": `Calculs à revoir : ${due}. Revoir ${n} calcul${n > 1 ? "s" : ""}`, onclick: () => {
      launch({ route: "jouer", opts: launchFor({ kind: "review", n }, date, { answer: set.answer, count: set.count }, "exercices").opts });
    } }, h("span", { class: "review-ic", "aria-hidden": "true" }, "🎯"),
      h("span", { class: "grow" }, h("b", {}, `Calculs à revoir (${due})`), h("small", {}, "Ceux qui t'ont résisté : on les retravaille.")),
      h("span", { class: "review-go" }, `Revoir ${n} ›`)) : null;
    const tiles = h("div", { class: "game-grid n" + GAMES.length, role: "radiogroup", "aria-label": "Choisis ton jeu" }, GAMES.map((g) =>
      h("button", { class: "game-tile" + (g.id === game.id ? " on" : ""), type: "button", role: "radio", "aria-checked": g.id === game.id ? "true" : "false", "data-game": g.id,
        onclick: () => { sfx.tap(); store.set("game", g.id); draw(); } },
        h("span", { class: "game-ic", "aria-hidden": "true" }, g.icon), h("span", { class: "game-n" }, g.name), h("span", { class: "game-s" }, g.sub))));
    const opts = game.options ? h("div", { class: "card play-opts" },
      seg("answer", [["qcm", "4 choix"], ["input", "Je tape"]], "Je réponds"), seg("count", [[10, "10"], [15, "15"], [20, "20"]], "Calculs")) : null;
    const go1 = (theme) => { sfx.tap(); launch(launchGame(game.id, theme, { answer: set.answer, count: set.count }, "exercices")); };
    const themes = h("div", { class: "fam-grid theme-grid" },
      h("button", { class: "fam-card theme-mix", type: "button", "data-theme": "mix", "aria-label": `${game.name} : mélange de tout`, onclick: () => go1("mix") },
        h("span", { class: "fam-sym", "aria-hidden": "true" }, "🎲"), h("span", { class: "fam-name" }, "Mélange"), h("span", { class: "fam-lvl" }, "de tout")),
      FAMILIES.map((f) => {
        const fs = s.fam[f.id];
        return h("button", { class: "fam-card", type: "button", "data-theme": f.id, style: { "--fam": f.color, "--fam-ink": f.ink }, "aria-label": `${game.name} : ${f.name}`, title: f.name, onclick: () => go1(f.id) },
          h("span", { class: "fam-sym", "aria-hidden": "true" }, f.short), h("span", { class: "fam-name" }, f.mini || f.name),
          h("span", { class: "fam-lvl", "aria-label": `niveau ${fs ? fs.lvl : 1}` }, lvlStars(fs ? fs.lvl : 1)));
      }));
    // v0.18 : la fiche chrono n'a pas de thème (ses 50 lignes sont celles de la classe) : on choisit son rythme et sa période.
    let step2;
    if (game.id === "chrono") {
      const period = periodOf(set.fichePeriod, date), auto = !PERIODS.includes(Number(set.fichePeriod));
      const rhythms = h("div", { class: "rhythm-grid" }, RHYTHMS.map((x) => {
        const best = ficheBest(s, period, x.id);
        return h("button", { class: "rhythm-card" + (x.id === (set.ficheRhythm || "classe") ? " last" : ""), type: "button", "data-rhythm": x.id,
          "aria-label": `${x.name} : ${rhythmLine(x)}${best ? ", record " + best : ""}`, onclick: () => { sfx.tap(); store.set("ficheRhythm", x.id); go("chrono"); } },
          h("span", { class: "rhythm-ic", "aria-hidden": "true" }, x.icon),
          h("span", { class: "grow" }, h("b", {}, x.name), h("small", {}, `${rhythmLine(x)} · ≈ ${perCalc(x)} s par calcul`)),
          h("span", { class: "rhythm-rec" }, best ? `🏅 ${best}` : "›"));
      }));
      const per = h("div", { class: "card play-opts" }, h("div", { class: "opt-row" }, h("span", { class: "opt-l" }, "Période"),
        h("div", { class: "seg period-seg", role: "group", "aria-label": "Période de l'année" }, [[0, "Auto"], ...PERIODS.map((n) => [n, String(n)])].map(([val, text]) => {
          const on = val === 0 ? auto : !auto && Number(set.fichePeriod) === val;
          return h("button", { class: "seg-b" + (on ? " on" : ""), type: "button", "aria-pressed": on ? "true" : "false", onclick: () => { sfx.tap(); store.set("fichePeriod", val); draw(); } }, text);
        }))),
        h("p", { class: "opt-note" }, auto ? `Auto : période ${periodFor(date)} en ce moment, comme en classe.` : `Période ${period} choisie : les calculs de cette partie de l'année.`));
      step2 = [h("h2", { class: "step-h" }, h("span", { class: "step-num" }, "2"), "Choisis ton rythme"), rhythms, per];
    } else step2 = [h("h2", { class: "step-h" }, h("span", { class: "step-num" }, "2"), "Choisis ton thème", h("small", {}, "un appui et c'est parti")), themes];
    root.replaceChildren(
      topbar("Jouer", null),
      h("div", { class: "screen-body jouer" }, review,
        h("h2", { class: "step-h" }, h("span", { class: "step-num" }, "1"), "Choisis ton jeu"),
        tiles, opts, step2));
  }
  draw();
  return { el: root };
}
