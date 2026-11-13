import { h } from "../dom.js";
import { sfx } from "../audio.js";

// Clavier numérique intégré : gros boutons, pour que le clavier du téléphone ne masque jamais l'écran.
export function keypad({ onDigit, onDel, onOk }) {
  const key = (label, cls, fn, aria) => h("button", { class: "key " + cls, type: "button", "aria-label": aria || label, onclick: () => { sfx.tap(); fn(); } }, label);
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => key(String(d), "", () => onDigit(String(d))));
  return h("div", { class: "keypad" }, ...digits,
    key("⌫", "key-del", onDel, "Effacer"), key("0", "", () => onDigit("0")), key("✓", "key-ok", onOk, "Valider"));
}
