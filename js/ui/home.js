import { h } from "../dom.js";
import { store } from "../store.js";
import { toKey } from "../dates.js";
import { creatureById } from "../creatures.js";
import { scenePick, starsEarned } from "../shop.js";
import { eveningOpen, eveningDone, EVENING_HOUR } from "../evening.js";
import { openRiddle } from "./evening.js";
import { sceneEl } from "./scene.js";
import { computeStreak } from "../streak.js";
import { themeFor, themeFams, DAILY_COUNT } from "../daily.js";
import { missionText, missionIcon } from "../missions.js";
import { session } from "./play.js";
import { sync, onSyncStatus, syncAvailable } from "../syncer.js";
import { homeCreature, homeGoal } from "../goal.js";
import { whatNext, launchFor } from "../next.js";
import { famPills } from "./badges.js";
import { VERSION } from "../version.js";
import { makeInteractive } from "./pet.js";

export function homeScreen({ go }) {
  const s = store.state, date = toKey();
  const streak = computeStreak(s, date), theme = themeFor(date), done = !!(s.daily[date] && s.daily[date].done);
  const name = store.profile && store.profile.name;
  // La scène : le compagnon (ou la créature la plus avancée, ou l'œuf le plus avancé) dans son décor, à la forme choisie.
  const hc = homeCreature(s, store.settings.companion), xp = (s.fam[creatureById(hc.id).fam] || { xp: 0 }).xp;
  const hour = new Date().getHours(), sleepy = hour >= EVENING_HOUR && eveningDone(s, date);
  const p = hc.stage > 0 ? scenePick(s, hc.id) : null;
  const mascot = sceneEl({ id: hc.id, stage: p ? p.st : 0, xp, pick: p || {}, variant: "home", sleepy: !!p && sleepy });
  makeInteractive(mascot, { stage: hc.stage }); // un appui : la créature réagit (v0.14)
  // Petit nuage : la synchro est-elle à jour ? (n'apparaît que si elle est activée)
  const cloud = h("button", { class: "pill cloud", type: "button", "aria-label": "Synchronisation", onclick: () => go("reglages") });
  const drawCloud = () => {
    if (!syncAvailable()) { cloud.style.display = "none"; return; }
    cloud.style.display = "";
    cloud.textContent = sync.state === "syncing" ? "☁️ …" : sync.state === "error" ? "☁️ ⚠️" : sync.state === "ok" ? "☁️ ✓" : "☁️";
  };
  drawCloud(); const offCloud = onSyncStatus(drawCloud);
  const settings = { answer: store.settings.answer, count: store.settings.count };
  const launch = (l) => { if (l.route === "jouer") session.opts = l.opts; go(l.route, true); };
  const startDaily = () => launch(launchFor({ kind: "daily" }, date, settings, ""));

  // Objectif sous la scène : un appui lance une série de la bonne famille (comme « Faire grandir » de l'album).
  const g = homeGoal(s, hc.id);
  const goal = g.target
    ? h("button", { class: "goal", type: "button", "aria-label": `${g.text}. ${g.label}`, onclick: () => launch(launchFor({ kind: "grow", fam: g.fam }, date, settings, "")) },
      h("span", { class: "goal-t" }, g.text),
      h("span", { class: "bar small goal-bar" }, h("span", { class: "bar-fill", style: { width: g.pct + "%" } })),
      h("span", { class: "goal-go" }, g.label + " ›"))
    : h("div", { class: "goal" }, h("span", { class: "goal-t" }, g.text));

  // « Que faire maintenant ? » : le bouton dit ce qu'il va lancer.
  const nx = whatNext(s, date);
  const nextBtn = h("button", { class: "btn big green next-btn", type: "button", onclick: () => launch(launchFor(nx, date, settings, "")) },
    h("span", { class: "next-q" }, "Que faire maintenant ?"), h("span", { class: "next-l" }, `${nx.icon} ${nx.label}`));

  const mis = s.m.active.map((m) => h("div", { class: "mission" },
    h("span", { class: "mission-icon" }, missionIcon(m)),
    h("div", { class: "grow" }, h("div", { class: "mission-t" }, missionText(m, date)),
      h("div", { class: "bar small" }, h("div", { class: "bar-fill", style: { width: Math.min(100, 100 * m.progress / m.target) + "%" } }))),
    h("span", { class: "mission-n" }, `${Math.min(m.progress, m.target)}/${m.target}`)));

  return { destroy: offCloud, el: h("main", { class: "screen home" }, h("div", { class: "screen-body" },
    h("div", { class: "home-grid" },
      h("div", { class: "home-left" },
        h("div", { class: "home-hero" },
          h("button", { class: "gear", type: "button", "aria-label": "Réglages", onclick: () => go("reglages") }, "⚙️"),
          h("h1", { class: "hello" }, name ? `Salut ${name} !` : "Calcul CM2 ✨"),
          h("div", { class: "pills" },
            h("span", { class: "pill" }, `🔥 ${streak.current} jour${streak.current > 1 ? "s" : ""}`),
            streak.jokers ? h("span", { class: "pill", title: "Un jour manqué ne casse pas ta série" }, `🃏 joker ×${streak.jokers}`) : null,
            h("span", { class: "pill" }, `⭐ ${starsEarned(s)}`), cloud,
            eveningOpen(s, date, hour) ? h("button", { class: "pill eve-pill", type: "button", onclick: () => openRiddle(hc.id, () => go("", true)) }, "🌙 Énigme du soir") : null),
          mascot),
        goal),
      h("div", { class: "home-right" },
        nextBtn,
        h("div", { class: "card daily" }, h("div", { class: "row" }, famPills(themeFams(theme)),
          h("div", { class: "grow" }, h("h2", {}, done ? "Défi du jour ✅" : "Défi du jour"), h("p", {}, `${theme.label} · environ ${DAILY_COUNT} calculs, sans chrono`))),
          h("button", { class: "btn big" + (done ? " light" : " green"), onclick: startDaily }, done ? "Rejouer le défi (nouveaux calculs)" : "C'est parti !")),
        h("div", { class: "card" }, h("h2", {}, "🧭 Tes missions"), mis),
        h("p", { class: "home-version" }, `Calcul CM2 · v${VERSION}`))))) };
}
