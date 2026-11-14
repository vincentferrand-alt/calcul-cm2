// Créature interactive (v0.14) : un appui sur la créature de la scène la fait réagir (petit saut, ou rebond pour l'œuf et le bébé),
// avec un son synthétisé et une bulle d'encouragement. Jamais plus d'une réaction toutes les ~2 s.
// Animations réduites (html.calm) : seulement la bulle, sans saut.
import { h } from "../dom.js";
import { sfx } from "../audio.js";
import { toKey } from "../dates.js";
import { isCalm } from "../motion.js";
import { cheerLine, canReact } from "../cheer.js";

let taps = 0; // numéro de l'appui : la phrase change à chaque fois
export function makeInteractive(scene, { stage = 0, onReact = null } = {}) {
  const cre = scene.querySelector(".sc-cre");
  const btn = h("button", { class: "sc-tap", type: "button", "aria-label": "Caresser la créature" });
  const bubble = h("div", { class: "sc-bubble", "aria-live": "polite" });
  let hideT = null, last = null;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (onReact) onReact();
    const now = Date.now();
    if (!canReact(last, now)) return;
    last = now;
    const d = new Date();
    bubble.textContent = cheerLine(toKey(d), d.getHours(), taps++);
    bubble.classList.remove("show"); void bubble.offsetWidth; bubble.classList.add("show");
    clearTimeout(hideT); hideT = setTimeout(() => bubble.classList.remove("show"), 2800);
    if (stage <= 0) sfx.tap(); else sfx.star(Math.min(3, stage));
    if (isCalm() || !cre) return;
    const cls = stage >= 2 ? "react-hop" : "react-bounce";
    cre.classList.remove("react-hop", "react-bounce"); void cre.offsetWidth; cre.classList.add(cls);
    setTimeout(() => cre.classList.remove(cls), 900);
  });
  scene.append(btn, bubble);
  scene.classList.add("petable");
  return scene;
}
