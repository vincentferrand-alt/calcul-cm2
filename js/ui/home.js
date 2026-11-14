import { h } from "../dom.js";
import { store } from "../store.js";
import { toKey } from "../dates.js";
import { creatureById } from "../creatures.js";
import { scenePick, starsEarned } from "../shop.js";
import { eveningOpen, eveningDone, EVENING_HOUR } from "../evening.js";
import { openRiddle } from "./evening.js";
import { sceneEl } from "./scene.js";
import { computeStreak } from "../streak.js";
import { todaySummary } from "../today.js";
import { session } from "./play.js";
import { sync, onSyncStatus, syncAvailable } from "../syncer.js";
import { homeCreature, homeGoal } from "../goal.js";
import { whatNext, launchFor, playableMissions } from "../next.js";
import { VERSION } from "../version.js";
import { makeInteractive } from "./pet.js";

export function homeScreen({ go }) {
  const s = store.state, date = toKey();
  const streak = computeStreak(s, date);
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
  const launch = (l) => { if (l.opts) session.opts = l.opts; go(l.route, true); };
  const startDaily = () => launch(launchFor({ kind: "daily" }, date, settings, ""));

  // Objectif (v0.17) : collé sous la scène, il fait partie de la même carte. Un appui lance une série de la bonne famille.
  const g = homeGoal(s, hc.id);
  const goal = g.target
    ? h("button", { class: "goal", type: "button", "aria-label": `${g.text}. ${g.label}`, onclick: () => launch(launchFor({ kind: "grow", fam: g.fam }, date, settings, "")) },
      h("span", { class: "goal-row" }, h("span", { class: "goal-t" }, g.text), h("span", { class: "goal-go", "aria-hidden": "true" }, "›")),
      h("span", { class: "bar small goal-bar" }, h("span", { class: "bar-fill", style: { width: g.pct + "%" } })))
    : h("div", { class: "goal" }, h("span", { class: "goal-t" }, g.text));

  // « Que faire maintenant ? » : LE bouton de l'accueil ; il dit ce qu'il va lancer.
  const ln = store.settings.lastNext; // ce que proposait le bouton la fois précédente (ce jour-là) : on alterne (v0.14.1)
  const nx = whatNext(s, date, { last: ln && ln.date === date ? ln.kind : null, speech: typeof speechSynthesis !== "undefined" });
  if (!ln || ln.date !== date || ln.kind !== nx.kind) store.set("lastNext", { date, kind: nx.kind });
  const nextBtn = h("button", { class: "btn big green next-btn", type: "button", onclick: () => launch(launchFor(nx, date, settings, "")) },
    h("span", { class: "next-q" }, "Que faire maintenant ?"), h("span", { class: "next-l" }, `${nx.icon} ${nx.label}`));

  // « Aujourd'hui » (v0.17) : trois pastilles — défi du jour, missions, semaine. Les missions et la semaine se déplient dessous.
  const T = todaySummary(s, date);
  const playable = new Set(playableMissions(s, date, { speech: typeof speechSynthesis !== "undefined" }).map((m) => m.id));
  const panel = h("div", { class: "today-panel" });
  let open = store.settings.homePanel === "week" ? "week" : "missions"; // sur l'iMac le panneau est toujours visible
  let shownPanel = typeof matchMedia === "function" && matchMedia("(min-width: 900px)").matches; // replié sur le téléphone
  const missionRows = () => T.missions.list.map((m) => {
    const can = playable.has(m.id);
    return h(can ? "button" : "div", { class: "mission" + (can ? " can" : ""), type: can ? "button" : null,
      "aria-label": can ? `${m.text} : ${m.progress} sur ${m.target}. Jouer` : null,
      onclick: can ? () => launch(launchFor({ kind: "mission", mission: m.mission }, date, settings, "")) : null },
      h("span", { class: "mission-icon", "aria-hidden": "true" }, m.icon),
      h("span", { class: "grow" }, h("span", { class: "mission-t" }, m.text),
        h("span", { class: "bar small" }, h("span", { class: "bar-fill", style: { width: m.pct + "%" } }))),
      h("span", { class: "mission-n" }, `${m.progress}/${m.target}`, can ? h("span", { class: "mission-go", "aria-hidden": "true" }, " ›") : null));
  });
  const weekRows = () => [h("div", { class: "week-head" }, h("b", {}, "📅 Ma semaine"), h("span", { class: "week-ok" }, `✅ ${T.week.ok} bonne${T.week.ok > 1 ? "s" : ""} réponse${T.week.ok > 1 ? "s" : ""}`)),
    h("div", { class: "week-days" }, T.week.days.map((d) => h("span", { class: "week-day" + (d.played ? " on" : "") + (d.today ? " today" : "") + (d.future ? " future" : ""), title: d.played ? `${d.ok} bonnes réponses` : "" },
      h("span", { class: "week-dot" }, d.played ? "✓" : ""), h("span", { class: "week-l" }, d.letter))))];
  const chip = (id, icon, label, status, onclick, extra = {}) => h("button", { class: "tchip" + (extra.done ? " done" : "") + (extra.hot ? " hot" : ""), type: "button", "data-chip": id,
    "aria-label": `${label} : ${status}`, "aria-expanded": extra.panel ? "false" : null, onclick },
    h("span", { class: "tchip-i", "aria-hidden": "true" }, icon), h("span", { class: "tchip-l" }, label), h("span", { class: "tchip-s" }, status));
  const chips = h("div", { class: "today-chips", role: "group", "aria-label": "Aujourd'hui" });
  function drawPanel() {
    panel.className = "today-panel card" + (shownPanel ? " open" : "") + " p-" + open;
    panel.replaceChildren(...(open === "week" ? weekRows() : [h("h2", {}, "🧭 Tes missions"), ...missionRows()]));
    for (const c of chips.children) if (c.dataset.chip !== "daily") { const on = shownPanel && c.dataset.chip === open; c.classList.toggle("on", on); c.setAttribute("aria-expanded", on ? "true" : "false"); }
  }
  const toggle = (id) => { if (shownPanel && open === id) shownPanel = false; else { open = id; shownPanel = true; store.set("homePanel", id); } drawPanel(); };
  chips.append(
    chip("daily", "🏁", "Défi du jour", T.daily.status, startDaily, { done: T.daily.done }),
    chip("missions", "🧭", "Missions", T.missions.status, () => toggle("missions"), { panel: true, hot: !!(T.missions.best && T.missions.best.pct >= 60) }),
    chip("week", "📅", "Ma semaine", T.week.status, () => toggle("week"), { panel: true }));
  drawPanel();

  return { destroy: offCloud, el: h("main", { class: "screen home" }, h("div", { class: "screen-body" },
    h("div", { class: "home-grid" },
      h("div", { class: "home-left" },
        h("div", { class: "home-hero" },
          h("button", { class: "gear", type: "button", "aria-label": "Réglages", onclick: () => go("reglages") }, "⚙️"),
          h("h1", { class: "hello" }, name ? `Salut ${name} !` : "Calcul CM2 ✨"),
          h("div", { class: "pills" },
            h("span", { class: "pill" }, `🔥 ${streak.current} jour${streak.current > 1 ? "s" : ""}`),
            streak.jokers ? h("span", { class: "pill", title: "Un jour manqué ne casse pas ta série" }, `🃏 joker ×${streak.jokers}`) : null,
            h("button", { class: "pill star-pill", type: "button", "aria-label": `${starsEarned(s)} étoiles gagnées : ouvrir la boutique`, onclick: () => go("boutique") }, `⭐ ${starsEarned(s)}`), cloud,
            eveningOpen(s, date, hour) ? h("button", { class: "pill eve-pill", type: "button", onclick: () => openRiddle(hc.id, () => go("", true)) }, "🌙 Énigme du soir") : null),
          h("div", { class: "hero-card" }, mascot, goal)),
        // iMac (≥ 900 px) : « Ma semaine » reste visible sous la scène (v0.14.1) ; sur le téléphone elle se déplie depuis sa pastille.
        h("div", { class: "card week-card", "aria-label": `Ma semaine : ${T.week.played} jour${T.week.played > 1 ? "s" : ""} joué${T.week.played > 1 ? "s" : ""}, ${T.week.ok} bonnes réponses` }, weekRows())),
      h("div", { class: "home-right" },
        nextBtn,
        h("div", { class: "today-wrap" }, h("div", { class: "today-title" }, "Aujourd'hui"), chips),
        panel,
        h("p", { class: "home-version" }, `Calcul CM2 · v${VERSION}`))))) };
}
