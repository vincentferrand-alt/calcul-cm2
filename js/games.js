// Les jeux de l'onglet « Jouer » (v0.17) : on choisit d'abord un jeu, puis un thème — une seule grille de thèmes pour tous les jeux.
// Logique pure, testée (tests/games.test.mjs) : launchGame() traduit (jeu, thème, réglages) en écran + série à jouer.
import { FAMILIES } from "./generator.js";

export const GAMES = [
  { id: "serie", icon: "🎲", name: "Série", sub: "10 à 20 calculs", themed: true, options: true },
  { id: "course", icon: "🏃", name: "Course", sub: "10 portes, sans chrono", themed: true, options: false },
  { id: "dictee", icon: "🎧", name: "Dictée", sub: "Écoute et calcule", themed: true, options: true },
];
export const gameById = (id) => GAMES.find((g) => g.id === id) || GAMES[0];

// theme : "mix" ou l'identifiant d'une famille. settings : { answer, count }. back : l'écran où revenir.
export function launchGame(game, theme, settings = {}, back = "exercices") {
  const g = gameById(game);
  const families = theme !== "mix" && FAMILIES.some((f) => f.id === theme) ? [theme] : "mix";
  const count = [10, 15, 20].includes(settings.count) ? settings.count : 10;
  if (g.id === "course") return { route: "course", opts: { families, count: 10, mode: "course", back } };
  if (g.id === "dictee") return { route: "jouer", opts: { families, count, mode: "dictee", back } };
  return { route: "jouer", opts: { families, count, mode: settings.answer === "input" ? "input" : "qcm", back } };
}
