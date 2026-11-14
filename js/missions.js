// Missions : 3 en cours en permanence ; dès qu'une est terminée elle est remplacée par une nouvelle, tirée d'une réserve variée.
import { FAMILIES, famById, shuffle } from "./generator.js";
import { FICHES } from "./learn.js";
import { dueReviews } from "./progress.js";
import { themeFor } from "./daily.js";
import { de } from "./fr.js";

export const SLOTS = 3;
const R = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, a) => a[Math.floor(r() * a.length)];
const MODES = { qcm: "avec les 4 choix", input: "en tapant ta réponse", dictee: "en dictée" };

// Chaque modèle : make(s, r, date) -> { params, target } ou null s'il n'est pas pertinent maintenant ; text(m) -> phrase.
export const TEMPLATES = {
  fam: { make: (s, r) => ({ params: { fam: pick(r, FAMILIES).id }, target: R(r, 8, 14) }),
    text: (m) => `Réussis ${m.target} calculs ${de(famById(m.params.fam).name.toLowerCase())}`, icon: "🎯" },
  run: { make: (s, r) => ({ params: {}, target: R(r, 5, 8) }), text: (m) => `Réussis ${m.target} calculs d'affilée`, icon: "🔥" },
  today: { make: (s, r) => ({ params: {}, target: pick(r, [15, 20, 25]) }), text: (m) => `Réussis ${m.target} calculs aujourd'hui`, icon: "🌟" },
  mode: { make: (s, r) => ({ params: { mode: pick(r, ["qcm", "input"]) }, target: 1 }), text: (m) => `Termine une série ${MODES[m.params.mode]}`, icon: "🎮" },
  dictee: { make: () => (typeof speechSynthesis !== "undefined" ? { params: {}, target: 1 } : null), text: () => "Fais une dictée de calculs (au moins 5)", icon: "🎧" },
  perfect: { make: () => ({ params: {}, target: 1 }), text: () => "Fais une série de 8 calculs ou plus sans aucune faute", icon: "💯" },
  learn: { make: (s) => (FICHES.some((f) => !s.learn[f.id]) ? { params: {}, target: 1 } : null), text: () => "Découvre une nouvelle fiche dans « Apprendre »", icon: "💡" },
  review: { make: (s, r, date) => { const n = R(r, 2, 4); return dueReviews(s, date).length >= n ? { params: {}, target: n } : null; }, text: (m) => `Rattrape ${m.target} calculs à revoir`, icon: "↻" },
  daily: { make: (s, r, date) => (s.daily[date]?.done ? null : { params: {}, target: 1 }), text: (m, date) => `Termine le défi du jour${date ? " : " + themeFor(date).label : ""}`, icon: "📅" },
};
const sameMission = (a, b) => a.tpl === b.tpl && JSON.stringify(a.params) === JSON.stringify(b.params);
export const missionText = (m, date) => { try { return TEMPLATES[m.tpl].text(m, date); } catch { return "Une mission t'attend"; } }; // jamais d'écran blanc à cause d'une mission abîmée
const validMission = (m) => { try { return !!TEMPLATES[m.tpl].text(m, "2026-01-01"); } catch { return false; } };
export const missionIcon = (m) => TEMPLATES[m.tpl].icon;

export function refillMissions(s, r = Math.random, date) {
  s.m.active = s.m.active.filter((m) => TEMPLATES[m.tpl] && !m.done && validMission(m));
  let guard = 0;
  while (s.m.active.length < SLOTS && guard++ < 60) {
    const tpl = pick(r, Object.keys(TEMPLATES));
    const made = TEMPLATES[tpl].make(s, r, date);
    if (!made) continue;
    const m = { id: "m-" + Date.now().toString(36) + "-" + Math.floor(r() * 1e6).toString(36), tpl, ...made, progress: 0, done: false };
    if (s.m.active.some((o) => sameMission(o, m)) || (tpl !== "fam" && s.m.active.some((o) => o.tpl === tpl))) continue;
    s.m.active.push(m);
  }
}

// ev : { type:"answer", prob, ok, review, run } | { type:"session", mode, ok, total, perfect, daily } | { type:"learn", first }
export function missionEvent(s, ev, r = Math.random, date) {
  const finished = [];
  for (const m of s.m.active) {
    const before = m.progress;
    if (ev.type === "answer") {
      if (m.tpl === "fam" && ev.ok && ev.prob.fam === m.params.fam) m.progress++;
      else if (m.tpl === "today" && ev.ok) m.progress++;
      else if (m.tpl === "review" && ev.ok && ev.review) m.progress++;
      else if (m.tpl === "run") m.progress = Math.max(m.progress, ev.run || 0);
    } else if (ev.type === "session") {
      if (m.tpl === "mode" && ev.mode === m.params.mode && ev.total >= 5) m.progress = 1;
      else if (m.tpl === "dictee" && ev.mode === "dictee" && ev.total >= 5) m.progress = 1;
      else if (m.tpl === "perfect" && ev.perfect && ev.total >= 8) m.progress = 1;
      else if (m.tpl === "daily" && ev.daily) m.progress = 1;
    } else if (ev.type === "learn" && m.tpl === "learn" && ev.first) m.progress = 1;
    if (m.progress >= m.target && before < m.target) { m.done = true; finished.push(m); }
  }
  if (finished.length) {
    for (const m of finished) { if (!s.m.done.includes(m.id)) s.m.done.push(m.id); s.c.missions++; }
    refillMissions(s, r, date);
  }
  return finished;
}
