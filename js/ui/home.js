import { h, svgEl } from "../dom.js";
import { store } from "../store.js";
import { toKey } from "../dates.js";
import { eggSVG } from "../creatures.js";
import { computeStreak } from "../streak.js";
import { themeFor, DAILY_COUNT } from "../daily.js";
import { missionText, missionIcon } from "../missions.js";
import { session } from "./play.js";

export function homeScreen({ go }) {
  const s = store.state, date = toKey();
  const streak = computeStreak(s, date), theme = themeFor(date), done = !!(s.daily[date] && s.daily[date].done);
  const name = store.profile && store.profile.name;
  const mascot = h("div", { class: "mascot" }); mascot.append(svgEl(eggSVG({ uid: "home" })));
  const msg = done ? "Défi du jour réussi, bravo ! Tu peux continuer à jouer autant que tu veux."
    : streak.current >= 2 ? `Ta série : ${streak.current} jours ! Continue avec le défi du jour.` : "Ton défi du jour t'attend. Chaque bonne réponse fait grandir ton œuf !";
  const startDaily = () => {
    session.opts = { families: theme.families, count: DAILY_COUNT, mode: store.settings.answer === "qcm" ? "qcm" : "input", daily: true, back: "" };
    go("jouer");
  };
  const mis = s.m.active.map((m) => h("div", { class: "mission" },
    h("span", { class: "mission-icon" }, missionIcon(m)),
    h("div", { class: "grow" }, h("div", { class: "mission-t" }, missionText(m, date)),
      h("div", { class: "bar small" }, h("div", { class: "bar-fill", style: { width: Math.min(100, 100 * m.progress / m.target) + "%" } }))),
    h("span", { class: "mission-n" }, `${Math.min(m.progress, m.target)}/${m.target}`)));
  return { el: h("main", { class: "screen" }, h("div", { class: "screen-body" },
    h("div", { class: "home-hero" },
      h("h1", { class: "hello" }, name ? `Salut ${name} !` : "Calcul CM2 ✨"),
      h("div", { class: "pills" },
        h("span", { class: "pill" }, `🔥 ${streak.current} jour${streak.current > 1 ? "s" : ""}`),
        streak.jokers ? h("span", { class: "pill", title: "Un jour manqué ne casse pas ta série" }, `🃏 joker ×${streak.jokers}`) : null,
        h("span", { class: "pill" }, `⭐ ${s.c.stars}`)),
      mascot, h("div", { class: "bubble" }, msg)),
    h("div", { class: "card daily" }, h("div", { class: "row" }, h("span", { class: "daily-emoji" }, theme.emoji),
      h("div", { class: "grow" }, h("h2", {}, done ? "Défi du jour ✅" : "Défi du jour"), h("p", {}, `${theme.label} · environ ${DAILY_COUNT} calculs, sans chrono`))),
      h("button", { class: "btn big green", onclick: startDaily }, done ? "Rejouer le défi (nouveaux calculs)" : "C'est parti !")),
    h("div", { class: "card" }, h("h2", {}, "🧭 Tes missions"), mis),
    h("div", { class: "menu-grid" },
      h("button", { class: "btn big", onclick: () => go("apprendre") }, "💡 Apprendre"),
      h("button", { class: "btn big", onclick: () => go("exercices") }, "🎯 Exercices"),
      h("button", { class: "btn big light", onclick: () => go("trophees") }, "🏆 Trophées")))) };
}
