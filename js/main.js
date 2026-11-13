import { VERSION } from "./version.js";
import { h, svgEl } from "./dom.js";
import { eggSVG } from "./creatures.js";
import { store } from "./store.js";
import { demanderStockagePersistant } from "./storage.js";
import { playScreen } from "./ui/play.js";
import { exercicesScreen } from "./ui/exercices.js";

const app = document.getElementById("app");

function homeScreen({ go }) {
  const mascot = h("div", { class: "mascot" });
  mascot.append(svgEl(eggSVG({ uid: "home" })));
  return { el: h("main", { class: "screen" },
    h("div", { class: "screen-body" },
      h("div", { class: "home-hero" },
        h("h1", { style: { margin: "18px 0 0", fontSize: "2rem" } }, "Calcul CM2 ✨"),
        mascot,
        h("div", { class: "bubble" }, "Prête pour quelques calculs ? Chaque bonne réponse fait grandir ton œuf !")),
      h("button", { class: "btn big", onclick: () => go("exercices") }, "Exercices ▶"))) };
}

const routes = { "": homeScreen, exercices: exercicesScreen, jouer: playScreen };
let current = null;

function go(name, force) {
  const target = "#/" + name;
  if (location.hash === target || (name === "" && !location.hash)) { if (force) render(); return; }
  location.hash = target;
}
function render() {
  if (current && current.destroy) current.destroy();
  const name = location.hash.replace(/^#\/?/, "").split("/")[0];
  const screen = (routes[name] || routes[""])({ go });
  current = screen;
  app.replaceChildren(screen.el, h("div", { class: "badge-version" }, "v" + VERSION));
}
addEventListener("hashchange", render);
render();
demanderStockagePersistant();
export { go };

// Service worker : jouable hors ligne + mise à jour proposée sans rien casser.
if ("serviceWorker" in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return;
    document.body.append(h("div", { class: "toast" }, "Nouvelle version prête ", h("button", { onclick: () => location.reload() }, "Recharger")));
  });
}
