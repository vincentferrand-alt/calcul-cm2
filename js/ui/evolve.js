// Transformation animée d'un stade à l'autre (éclosion / évolution), jouée dans l'appli (aucune vidéo) :
// l'ancienne forme se charge de lumière, flash, fondu enchaîné vers la nouvelle forme avec un léger grossissement,
// particules aux couleurs de la créature, son synthétisé. Si « réduire les animations » est demandé : simple fondu.
import { h } from "../dom.js";
import { sfx } from "../audio.js";
import { creatureById } from "../creatures.js";
import { creatureArt } from "./art.js";

const reduced = () => globalThis.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function playEvolution(id, from, to) {
  return new Promise((resolve) => {
    const c = creatureById(id), calm = reduced();
    const parts = calm ? [] : Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2 + (i % 2) * 0.17, d = 34 + (i % 3) * 9;
      return h("i", { class: "evo-p", style: { "--tx": `${(Math.cos(a) * d).toFixed(1)}vmin`, "--ty": `${(Math.sin(a) * d * 0.85 - 4).toFixed(1)}vmin`, background: c.parts[i % c.parts.length], animationDelay: `${1.25 + (i % 4) * 0.05}s` } });
    });
    const oldArt = creatureArt(id, from, from === 0 ? 10 : 0, "evo-o"), newArt = creatureArt(id, to, 0, "evo-n");
    const title = from === 0 ? `${c.name} est né !` : `${c.name} évolue !`;
    const btn = h("button", { class: "btn big green evo-btn", type: "button" }, "Super !");
    const box = h("div", { class: "evo" + (calm ? " calm" : ""), role: "dialog", "aria-label": title, style: { "--glow": c.aura || "#ffd84a" } },
      h("div", { class: "evo-stage" },
        h("div", { class: "evo-halo" }), h("div", { class: "evo-old" }, oldArt), h("div", { class: "evo-new" }, newArt),
        h("div", { class: "evo-flash" }), h("div", { class: "evo-parts", "aria-hidden": "true" }, parts)),
      h("div", { class: "evo-text" }, h("div", { class: "evo-title" }, title), h("div", { class: "evo-form" }, c.forms[to - 1]),
        h("p", { class: "evo-story" }, c.story[to - 1]), btn));
    let done = false;
    const close = () => { if (done) return; done = true; clearTimeout(t1); clearTimeout(t2); box.classList.add("out"); setTimeout(() => { box.remove(); resolve(); }, 300); };
    btn.addEventListener("click", (e) => { e.stopPropagation(); close(); });
    const onKey = (e) => { if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); document.removeEventListener("keydown", onKey, true); close(); } };
    document.addEventListener("keydown", onKey, true);
    document.body.append(box);
    sfx.level();
    const t1 = setTimeout(() => sfx.hatch(), calm ? 300 : 1250);
    const t2 = setTimeout(() => btn.focus(), calm ? 700 : 2300);
  });
}

// Plusieurs évolutions d'une même série : une animation par créature, du premier au dernier stade atteint.
export async function playEvolutions(events) {
  const by = new Map();
  for (const e of events) { const p = by.get(e.id); by.set(e.id, p ? { id: e.id, from: Math.min(p.from, e.from), to: Math.max(p.to, e.to) } : { ...e }); }
  for (const e of by.values()) await playEvolution(e.id, e.from, e.to);
}
