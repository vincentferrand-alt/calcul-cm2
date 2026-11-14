import { h } from "../dom.js";
import { sfx } from "../audio.js";
import { isCalm } from "../motion.js";
import { newsSummary } from "../news.js";

let stack = null;
// discreet : pendant une partie, un petit message bref en haut (pas de son : la partie a déjà les siens).
export function toast(text, { icon = "🏆", ms = 4200, sound = true, discreet = false } = {}) {
  if (!stack || !stack.isConnected) { stack = h("div", { class: "toasts" }); document.body.append(stack); }
  const t = h("div", { class: "toast-item" + (discreet ? " discreet" : "") }, h("span", { class: "toast-icon" }, icon), h("span", {}, text));
  stack.append(t);
  if (sound && !discreet) sfx.trophy();
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 400); }, discreet ? Math.min(ms, 2600) : ms);
}

// Bandeau unique des nouvelles (v0.13) : en bas, au-dessus de la barre d'onglets, jamais sur la scène.
// Un appui mène au bon écran (créatures, trophées ou boutique) ; il se range tout seul après quelques secondes.
let banner = null, hideT = null;
export function closeBanner() {
  clearTimeout(hideT);
  if (!banner) return;
  const b = banner; banner = null;
  b.classList.add("out"); setTimeout(() => b.remove(), 350);
}
export function newsBanner(news, go, { ms = 8000 } = {}) {
  const sum = newsSummary(news);
  if (!sum) return null;
  closeBanner();
  const host = document.getElementById("app") || document.body;
  const el = h("div", { class: "news-banner", role: "status" },
    h("button", { class: "nb-main", type: "button", onclick: () => { closeBanner(); go(sum.target); } },
      h("span", { class: "nb-icon", "aria-hidden": "true" }, sum.icon), h("span", { class: "nb-text" }, sum.text), h("span", { class: "nb-go" }, "Voir ›")),
    h("button", { class: "nb-x", type: "button", "aria-label": "Fermer", onclick: closeBanner }, "✕"));
  host.append(el); banner = el;
  sfx.trophy();
  hideT = setTimeout(closeBanner, ms);
  return el;
}
export const bannerEl = () => banner;

// Pluie de confettis (CSS) pour fêter une éclosion.
export function confetti(n = 36) {
  if (isCalm()) return;
  const box = h("div", { class: "confetti", "aria-hidden": "true" });
  const cols = ["#ffc933", "#4cc9f0", "#2fbf71", "#ff9f43", "#8f9bff", "#ffffff"];
  for (let i = 0; i < n; i++) box.append(h("i", { style: { left: Math.random() * 100 + "%", background: cols[i % cols.length], animationDelay: Math.random() * 0.5 + "s", animationDuration: 1.6 + Math.random() * 1.2 + "s", transform: `rotate(${Math.random() * 360}deg)` } }));
  document.body.append(box); setTimeout(() => box.remove(), 3600);
}
