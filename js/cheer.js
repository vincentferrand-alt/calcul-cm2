// Phrases d'encouragement de la créature (v0.14) quand on la touche : bienveillantes, jamais de reproche.
// Elles changent selon le moment de la journée, le jour, et à chaque appui. Logique pure, testée (tests/cheer.test.mjs).
import { dayNumber } from "./dates.js";

export const CHEERS = {
  matin: ["Bonjour ! Prête pour un petit calcul ?", "Le matin, le cerveau est tout frais !", "Un calcul au petit-déjeuner ? Miam !"],
  jour: ["On fait équipe aujourd'hui ?", "Chaque calcul me fait grandir un peu !", "Tu as le droit de te tromper : c'est comme ça qu'on apprend."],
  soir: ["Quelle belle journée ! Un dernier calcul ?", "Le soleil se couche… mais pas ton cerveau !", "Bravo pour tout ce que tu as appris aujourd'hui !"],
  nuit: ["Chut… je rêve de nombres ronds.", "Il est tard ! On se retrouve demain ?", "Bonne nuit, championne des calculs !"],
  toujours: ["Hé ! Ça chatouille !", "Tu es ma calculatrice préférée !", "Ensemble, on va loin !", "Un petit défi, ça te dit ?",
    "J'aime quand tu trouves l'astuce !", "Prends ton temps, je t'attends.", "Tu progresses à chaque partie !", "Merci de prendre soin de moi !"],
};

export const slotFor = (hour) => (hour >= 5 && hour < 11 ? "matin" : hour < 18 && hour >= 11 ? "jour" : hour >= 18 && hour < 21 ? "soir" : "nuit");
export const allCheers = () => Object.values(CHEERS).flat();

// n = numéro de l'appui (0, 1, 2…) : jamais deux fois de suite la même phrase.
// Un appui sur deux : une phrase du moment de la journée, sinon une phrase de tous les jours ; le jour décale le point de départ.
export function cheerLine(date, hour, n = 0) {
  const slot = CHEERS[slotFor(hour)], any = CHEERS.toujours, d = Math.abs(dayNumber(date)), k = Math.floor(n / 2);
  return n % 2 === 0 ? slot[(d + k) % slot.length] : any[(d + k) % any.length];
}

// Un appui toutes les ~2 s au plus : retourne true si la créature peut réagir maintenant.
export const REACT_GAP = 2000;
export const canReact = (last, now) => last == null || now - last >= REACT_GAP;
