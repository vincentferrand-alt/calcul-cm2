// L'énigme du soir : la créature pose un calcul bonus avant de dormir (QCM, deux essais, une étoile en cadeau).
import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { toKey } from "../dates.js";
import { fmt } from "../generator.js";
import { creatureById } from "../creatures.js";
import { de } from "../fr.js";
import { nudgeLines } from "../hints.js";
import { eveningRiddle, completeEvening } from "../evening.js";
import { checkTrophies, trophyLabel } from "../trophies.js";
import { scenePick } from "../shop.js";
import { sceneEl } from "./scene.js";
import { toast, confetti } from "./notify.js";

// Le panneau de l'énigme. onDone(ok) est appelé une fois l'étoile donnée.
export function riddlePanel(creatureId, onDone) {
  const date = toKey(), r = eveningRiddle(store.state, date, creatureId), c = creatureById(r.creature), prob = r.prob;
  let tries = 0, over = false;
  const msg = h("div", { class: "riddle-msg", "aria-live": "polite" });
  const btns = r.options.map((v) => h("button", { class: "choice", type: "button", "data-v": v, onclick: (e) => pickIt(v, e.currentTarget) }, fmt(v)));
  const end = h("div", { class: "riddle-end" });
  const panel = h("div", { class: "riddle", onclick: (e) => e.stopPropagation() },
    h("div", { class: "riddle-who" }, store.state.cre[c.id] && store.state.cre[c.id].s > 0 ? `🌙 L'énigme ${de(c.name)}` : "🌙 L'énigme du soir"),
    h("div", { class: "riddle-q" }, prob.q, prob.showEq ? h("span", { class: "q-eq" }, " = ?") : null),
    h("div", { class: "choices riddle-choices" }, btns), msg, end);
  function finish(ok) {
    over = true;
    let fresh = [];
    store.update((s) => {
      const hatched = s.cre[c.id] && s.cre[c.id].s > 0, p = hatched ? scenePick(s, c.id) : null;
      // souvenir pour le carnet de rêves (v0.14) : la créature, sa forme, son décor et le calcul de l'énigme
      completeEvening(s, date, ok, tries, { c: c.id, st: p ? p.st : 0, bg: p ? p.bg : "bg_prairie", q: prob.q, a: prob.a, eq: !!prob.showEq });
      fresh = checkTrophies(s, date);
    });
    sfx.star(2); confetti(20);
    toast("Une étoile en cadeau pour l'énigme du soir !", { icon: "⭐", sound: false });
    fresh.forEach((t) => toast("Nouveau trophée : " + trophyLabel(t.line, t.tier)));
    end.append(h("p", { class: "riddle-night" }, store.state.cre[c.id] && store.state.cre[c.id].s > 0 ? `${c.name} bâille… Bonne nuit ! 💤` : "Ton œuf s'endort au chaud… Bonne nuit ! 💤"));
    if (onDone) onDone(ok, end);
  }
  function pickIt(v, el) {
    if (over || el.classList.contains("soft")) return;
    tries++;
    if (v === prob.a) {
      sfx.ok(); el.classList.add("good");
      msg.replaceChildren(h("b", {}, tries === 1 ? "Bravo, du premier coup ! ⭐ +1 étoile" : "Bravo, tu l'as trouvée ! ⭐ +1 étoile"));
      return finish(true);
    }
    sfx.wrong(); el.classList.add("soft");
    if (tries === 1) { msg.replaceChildren(h("b", {}, "Presque ! Essaie encore 😊"), h("div", { class: "nudge-line" }, "💡 " + nudgeLines(prob)[0])); return; }
    btns.forEach((b) => { if (Number(b.dataset.v) === prob.a) b.classList.add("good"); });
    msg.replaceChildren(h("b", {}, `La réponse était ${fmt(prob.a)}. ⭐ Une étoile quand même, pour avoir cherché !`), h("div", { class: "nudge-line" }, "💡 " + prob.hint.text));
    finish(false);
  }
  return panel;
}

// Fenêtre de l'énigme (depuis l'accueil) : la scène de la créature + le panneau.
export function openRiddle(creatureId, onClose) {
  const s = store.state, p = creatureId && s.cre[creatureId] && s.cre[creatureId].s > 0 ? scenePick(s, creatureId) : null;
  const scene = sceneEl({ id: creatureId, stage: p ? p.st : 0, pick: p || {}, variant: "shop" });
  const close = () => { box.remove(); document.removeEventListener("keydown", onKey); if (onClose) onClose(); };
  const onKey = (e) => { // Échap ferme la fenêtre ; 1 à 4 choisissent une réponse (clavier de l'iMac)
    if (e.key === "Escape") return close();
    const i = "1234".indexOf(e.key), b = box.querySelectorAll(".riddle-choices .choice")[i];
    if (i >= 0 && b) { e.preventDefault(); b.click(); }
  };
  const panel = riddlePanel(creatureId, (ok, end) => { scene.classList.add("sleepy"); end.append(h("button", { class: "btn green", type: "button", onclick: close }, "Bonne nuit !")); });
  const box = h("div", { class: "modal", role: "dialog", "aria-label": "Énigme du soir" },
    h("div", { class: "modal-in" }, h("button", { class: "modal-x", type: "button", "aria-label": "Fermer", onclick: close }, "✕"), scene, panel,
      h("div", { class: "kbd-hint" }, "Clavier : 1 à 4 pour répondre · Échap pour fermer")));
  document.addEventListener("keydown", onKey);
  document.body.append(box);
}
