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

// Pluie de confettis (CSS) pour fêter une éclosion.
export function confetti(n = 36) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = h("div", { class: "confetti", "aria-hidden": "true" });
  const cols = ["#ffc933", "#4cc9f0", "#2fbf71", "#ff9f43", "#8f9bff", "#ffffff"];
  for (let i = 0; i < n; i++) box.append(h("i", { style: { left: Math.random() * 100 + "%", background: cols[i % cols.length], animationDelay: Math.random() * 0.5 + "s", animationDuration: 1.6 + Math.random() * 1.2 + "s", transform: `rotate(${Math.random() * 360}deg)` } }));
  document.body.append(box); setTimeout(() => box.remove(), 3600);
}
