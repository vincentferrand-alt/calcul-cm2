// Image d'une créature (ou de son œuf) à un stade donné.
// v0.12 : image détourée (WebP) + ombre douce au sol, dans un fichier séparé (la créature semble posée dans n'importe quel décor).
// Si l'image manque (ou ne se charge pas), le dessin SVG d'origine prend le relais. L'œuf reste en SVG.
import { h, svgEl } from "../dom.js";
import { creatureSVG, creatureEgg, creatureById, creatureImg, creatureShadow } from "../creatures.js";

export function creatureArt(id, stage, xp = 0, uid = "a") {
  if (stage <= 0) { const w = h("div", { class: "creature-art" }); w.append(svgEl(creatureEgg(id, xp, uid))); return w; }
  const st = Math.min(4, stage), c = creatureById(id);
  const fallback = () => { w.className = "creature-art"; w.replaceChildren(svgEl(creatureSVG(id, st, uid))); };
  const shadow = h("img", { class: "cre-shadow", src: creatureShadow(id, st), alt: "", "aria-hidden": "true", decoding: "async", draggable: "false" });
  const img = h("img", { class: "cre-img", src: creatureImg(id, st), alt: `${c.name}, ${c.forms[st - 1]}`, decoding: "async", draggable: "false" });
  shadow.addEventListener("error", () => shadow.remove(), { once: true });
  img.addEventListener("error", fallback, { once: true });
  const w = h("div", { class: `creature-art img st-${st}` }, h("div", { class: "cre-scale" }, shadow, img));
  return w;
}
