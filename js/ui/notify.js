import { h } from "../dom.js";
import { sfx } from "../audio.js";

let stack = null;
export function toast(text, { icon = "🏆", ms = 4200, sound = true } = {}) {
  if (!stack || !stack.isConnected) { stack = h("div", { class: "toasts" }); document.body.append(stack); }
  const t = h("div", { class: "toast-item" }, h("span", { class: "toast-icon" }, icon), h("span", {}, text));
  stack.append(t);
  if (sound) sfx.trophy();
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 400); }, ms);
}
