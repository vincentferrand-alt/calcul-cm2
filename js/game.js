// Orchestration : applique une réponse / une fin de série / une fiche lue à l'état, puis missions, trophées et série.
import { recordAnswer, endSession, markLearn } from "./progress.js";
import { missionEvent, refillMissions } from "./missions.js";
import { checkTrophies } from "./trophies.js";
import { computeStreak } from "./streak.js";

export function afterAnswer(s, { prob, ok, review, run, date, mode, adapt }) {
  const ev = recordAnswer(s, prob, ok, { date, mode, review, adapt });
  const missions = missionEvent(s, { type: "answer", prob, ok, review, run }, Math.random, date);
  return { ev, missions, trophies: checkTrophies(s, date) };
}

export function afterSession(s, { ok, total, mode, daily, date }) {
  const r = endSession(s, { ok, total });
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
  return { trophies: checkTrophies(s, date), streak };
}
