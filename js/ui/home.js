import { h, svgEl } from "../dom.js";
import { store } from "../store.js";
import { toKey } from "../dates.js";
import { CREATURES, featured, creatureEgg, creatureById } from "../creatures.js";
import { creatureArt } from "./album.js";
import { computeStreak } from "../streak.js";
import { themeFor, DAILY_COUNT } from "../daily.js";
import { missionText, missionIcon } from "../missions.js";
import { session } from "./play.js";
import { sync, onSyncStatus, syncAvailable } from "../syncer.js";

export function homeScreen({ go }) {
  const s = store.state, date = toKey();
  const streak = computeStreak(s, date), theme = themeFor(date), done = !!(s.daily[date] && s.daily[date].done);
  const name = store.profile && store.profile.name;
  const comp = store.settings.companion && s.cre[store.settings.companion] && s.cre[store.settings.companion].s > 0 ? store.settings.companion : null;
  const feat = comp ? { c: { id: comp }, st: s.cre[comp].s, xp: (s.fam[creatureById(comp).fam] || { xp: 0 }).xp } : featured(s);
  const mascot = h("div", { class: "mascot" });
  if (feat) mascot.append(creatureArt(feat.c.id, feat.st, feat.xp, "home"));
  else { // pas encore d'éclosion : l'œuf de la famille la plus avancée
    const best = CREATURES.reduce((b, c) => ((s.fam[c.fam] ? s.fam[c.fam].xp : 0) > (s.fam[b.fam] ? s.fam[b.fam].xp : 0) ? c : b), CREATURES[0]);
    mascot.append(svgEl(creatureEgg(best.id, s.fam[best.fam] ? s.fam[best.fam].xp : 0, "home")));
  }
  const msg = done ? "Défi du jour réussi, bravo ! Tu peux continuer à jouer autant que tu veux."
    : streak.current >= 2 ? `Ta série : ${streak.current} jours ! Continue avec le défi du jour.` : `Ton défi du jour t'attend. Chaque bonne réponse fait grandir ${feat ? "tes créatures" : "ton œuf"} !`;
  // Petit nuage : la synchro est-elle à jour ? (n'apparaît que si elle est activée)
  const cloud = h("button", { class: "pill cloud", type: "button", "aria-label": "Synchronisation", onclick: () => go("reglages") });
  const drawCloud = () => {
    if (!syncAvailable()) { cloud.style.display = "none"; return; }
    cloud.style.display = "";
    cloud.textContent = sync.state === "syncing" ? "☁️ …" : sync.state === "error" ? "☁️ ⚠️" : sync.state === "ok" ? "☁️ ✓" : "☁️";
  };
  drawCloud(); const offCloud = onSyncStatus(drawCloud);
  const startDaily = () => {
    session.opts = { families: theme.families, count: DAILY_COUNT, mode: store.settings.answer === "qcm" ? "qcm" : "input", daily: true, back: "" };
    go("jouer");
  };
  const mis = s.m.active.map((m) => h("div", { class: "mission" },
    h("span", { class: "mission-icon" }, missionIcon(m)),
    h("div", { class: "grow" }, h("div", { class: "mission-t" }, missionText(m, date)),
      h("div", { class: "bar small" }, h("div", { class: "bar-fill", style: { width: Math.min(100, 100 * m.progress / m.target) + "%" } }))),
    h("span", { class: "mission-n" }, `${Math.min(m.progress, m.target)}/${m.target}`)));
  return { destroy: offCloud, el: h("main", { class: "screen" }, h("div", { class: "screen-body" },
    h("div", { class: "home-hero" },
      h("button", { class: "gear", type: "button", "aria-label": "Réglages", onclick: () => go("reglages") }, "⚙️"),
      h("h1", { class: "hello" }, name ? `Salut ${name} !` : "Calcul CM2 ✨"),
      h("div", { class: "pills" },
        h("span", { class: "pill" }, `🔥 ${streak.current} jour${streak.current > 1 ? "s" : ""}`),
        streak.jokers ? h("span", { class: "pill", title: "Un jour manqué ne casse pas ta série" }, `🃏 joker ×${streak.jokers}`) : null,
        h("span", { class: "pill" }, `⭐ ${s.c.stars}`), cloud),
      mascot, h("div", { class: "bubble" }, msg)),
    h("div", { class: "card daily" }, h("div", { class: "row" }, h("span", { class: "daily-emoji" }, theme.emoji),
      h("div", { class: "grow" }, h("h2", {}, done ? "Défi du jour ✅" : "Défi du jour"), h("p", {}, `${theme.label} · environ ${DAILY_COUNT} calculs, sans chrono`))),
      h("button", { class: "btn big green", onclick: startDaily }, done ? "Rejouer le défi (nouveaux calculs)" : "C'est parti !")),
    h("div", { class: "card" }, h("h2", {}, "🧭 Tes missions"), mis),
    h("div", { class: "menu-grid" },
      h("button", { class: "btn big", onclick: () => go("apprendre") }, "💡 Apprendre"),
      h("button", { class: "btn big", onclick: () => go("exercices") }, "🎯 Exercices"),
      h("button", { class: "btn big light", onclick: () => go("album") }, "🥚 Créatures"),
      h("button", { class: "btn big light", onclick: () => go("trophees") }, "🏆 Trophées"),
      h("button", { class: "btn big light", onclick: () => go("boutique") }, "🛍️ Boutique")))) };
}
