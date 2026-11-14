// « Aujourd'hui » (v0.17) : le résumé en trois pastilles de l'accueil — défi du jour, missions, semaine.
// Logique pure, testée (tests/today.test.mjs). Elle ne lit que l'état ; elle ne lance rien.
import { themeFor } from "./daily.js";
import { missionText, missionIcon } from "./missions.js";
import { weekSummary } from "./week.js";
import { ficheBestAny, ficheCount } from "./fiche.js";

const ratio = (m) => (m && m.target ? Math.max(0, Math.min(1, (m.progress || 0) / m.target)) : 0);

export function todaySummary(s, date) {
  const d = (s.daily || {})[date], theme = themeFor(date);
  const missions = ((s.m && s.m.active) || []).filter((m) => m && !m.done).map((m) => {
    let text = "Une mission t'attend", icon = "🧭";
    try { text = missionText(m, date); icon = missionIcon(m); } catch { /* mission abîmée : texte de secours */ }
    return { id: m.id, text, icon, progress: Math.min(m.progress || 0, m.target || 0), target: m.target || 0, pct: Math.round(100 * ratio(m)), mission: m };
  });
  const w = weekSummary(s, date);
  // La mission la plus avancée donne le « presque ! » de la pastille.
  const best = missions.reduce((b, m) => (m.pct > (b ? b.pct : -1) ? m : b), null);
  const fb = ficheBestAny(s), fc = ficheCount(s);
  return {
    fiche: { best: fb, count: fc, status: fc ? `${fb} point${fb > 1 ? "s" : ""}` : "À essayer" }, // v0.18 : la fiche chrono (meilleur score, tous rythmes confondus)
    daily: { done: !!(d && d.done), label: theme.label, status: d && d.done ? "Fait ✓" : "À faire" },
    missions: { list: missions, count: missions.length, best, status: best && best.pct >= 60 ? "Presque !" : `${missions.length} en cours` },
    week: { played: w.played, ok: w.ok, days: w.days, status: `${w.played} jour${w.played > 1 ? "s" : ""}` },
  };
}
