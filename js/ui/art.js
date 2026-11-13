// Image d'une créature (ou de son œuf) à un stade donné. Les accessoires de la v0.10 ne sont plus affichés (remplacés par les décors).
import { h, svgEl } from "../dom.js";
import { creatureSVG, creatureEgg } from "../creatures.js";

export function creatureArt(id, stage, xp = 0, uid = "a") {
  const w = h("div", { class: "creature-art" });
  w.append(svgEl(stage <= 0 ? creatureEgg(id, xp, uid) : creatureSVG(id, stage, uid)));
  return w;
}
