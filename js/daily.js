// Défi du jour : le thème change chaque jour (même thème sur tous les appareils), les calculs sont toujours nouveaux.
import { dayNumber } from "./dates.js";

export const THEMES = [
  { id: "grand-melange", label: "Le grand mélange", families: "mix", emoji: "🎲" },
  { id: "calcul-malin", label: "Calcul malin", families: ["add", "sub", "trick"], emoji: "🧠" },
  { id: "tables", label: "Tables et divisions", families: ["mul", "div"], emoji: "✖️" },
  { id: "doubles-moities", label: "Doubles et moitiés", families: ["dbl", "frac"], emoji: "🍰" },
  { id: "sauts", label: "Sauts de nombres ronds", families: ["comp", "add", "sub"], emoji: "🦘" },
  { id: "champion", label: "Astuces de champion", families: ["trick", "mul", "dbl"], emoji: "🏅" },
  { id: "tout-terrain", label: "Tout-terrain", families: ["add", "mul", "frac", "comp"], emoji: "🧭" },
];
export const themeFor = (date) => THEMES[dayNumber(date) % THEMES.length];
export const DAILY_COUNT = 20;
// v0.13 : l'icône du défi = les symboles de ses familles en pastilles colorées (l'ancien « ✖️ » ressemblait à une erreur).
// Le grand mélange montre les 4 opérations.
export const themeFams = (t) => (t.families === "mix" ? ["add", "sub", "mul", "div"] : t.families).slice(0, 4);
