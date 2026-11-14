// Orchestration : applique une réponse / une fin de série / une fiche lue à l'état, puis missions, trophées et série.
import { recordAnswer, endSession, markLearn } from "./progress.js";
import { missionEvent, refillMissions } from "./missions.js";
import { checkTrophies } from "./trophies.js";
import { computeStreak } from "./streak.js";
import { syncCreatures } from "./creatures.js";
import { recordFiche } from "./fiche.js";

export function afterAnswer(s, { prob, ok, review, run, date, mode, adapt, hinted }) {
  const ev = recordAnswer(s, prob, ok, { date, mode, review, adapt, hinted });
  const missions = missionEvent(s, { type: "answer", prob, ok, review, run }, Math.random, date);
  const creatures = syncCreatures(s, date);
  return { ev, missions, creatures, trophies: checkTrophies(s, date) };
}

export function afterSession(s, { ok, total, mode, daily, date }) {
  const r = endSession(s, { ok, total });
  if (mode === "course") s.c.course = (s.c.course || 0) + 1; // v0.15 : une course terminée
  if (daily) {
    const d = (s.daily[date] ||= { done: false, ok: 0, n: 0, stars: 0 });
    d.done = true; d.ok = Math.max(d.ok, ok); d.n = Math.max(d.n, total); d.stars = Math.max(d.stars, r.stars);
    s.c.daily = Object.values(s.daily).filter((x) => x.done).length;
  }
  const streak = computeStreak(s, date);
  s.c.streakBest = Math.max(s.c.streakBest, streak.best);
  const missions = missionEvent(s, { type: "session", mode, ok, total, perfect: r.perfect, daily }, Math.random, date);
  return { ...r, streak, missions, trophies: checkTrophies(s, date) };
}

// v0.18 : une fiche chrono terminée. Tout est appliqué d'un coup, à la fin (rien n'est corrigé pendant l'épreuve).
// info : { period, rhythm, score (scoreFiche), secs, date, stamp }
export function afterFiche(s, info) {
  const r = recordFiche(s, info), date = info.date;
  const missions = []; let run = 0;
  for (const row of info.score.rows) {
    if (row.state === "todo") continue;
    const ok = row.state === "ok"; run = ok ? run + 1 : 0;
    missions.push(...missionEvent(s, { type: "answer", prob: row.p, ok, review: false, run }, Math.random, date));
  }
  const streak = computeStreak(s, date);
  s.c.streakBest = Math.max(s.c.streakBest, streak.best);
  missions.push(...missionEvent(s, { type: "session", mode: "fiche", ok: info.score.ok, total: info.score.total, perfect: r.perfect, daily: false }, Math.random, date));
  const creatures = syncCreatures(s, date);
  return { ...r, streak, missions, creatures, trophies: checkTrophies(s, date) };
}

export function afterLearn(s, id, date) {
  const first = markLearn(s, id, date);
  const missions = missionEvent(s, { type: "learn", first }, Math.random, date);
  return { first, missions, trophies: checkTrophies(s, date) };
}

// À l'ouverture : missions toujours au complet, trophées à jour (utile après une fusion entre appareils).
export function refreshState(s, date) {
  refillMissions(s, Math.random, date);
  const streak = computeStreak(s, date);
  s.c.streakBest = Math.max(s.c.streakBest, streak.best);
  const creatures = syncCreatures(s, date);
  return { trophies: checkTrophies(s, date), streak, creatures };
}
