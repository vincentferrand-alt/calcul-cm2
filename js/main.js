import { VERSION } from "./version.js";
import { h } from "./dom.js";
import { store } from "./store.js";
import { demanderStockagePersistant } from "./storage.js";
import { playScreen } from "./ui/play.js";
import { exercicesScreen } from "./ui/exercices.js";
import { apprendreScreen, ficheScreen } from "./ui/apprendre.js";
import { homeScreen } from "./ui/home.js";
import { trophiesScreen } from "./ui/trophees.js";
import { profilScreen } from "./ui/profil.js";
import { refreshState } from "./game.js";
import { toKey } from "./dates.js";
import { toast } from "./ui/notify.js";
import { trophyLabel } from "./trophies.js";

const app = document.getElementById("app");

const routes = { "": homeScreen, exercices: exercicesScreen, jouer: playScreen, apprendre: apprendreScreen, fiche: ficheScreen, trophees: trophiesScreen, profil: profilScreen };
let current = null;

function go(name, force) {
  const target = "#/" + name;
  if (location.hash === target || (name === "" && !location.hash)) { if (force) render(); return; }
  location.hash = target;
}
function render() {
  if (current && current.destroy) current.destroy();
  let [name, ...args] = location.hash.replace(/^#\/?/, "").split("/");
  if (!store.profile && name !== "profil") name = "profil";
  const screen = (routes[name] || routes[""])({ go, args });
  current = screen;
  app.replaceChildren(screen.el, h("div", { class: "badge-version" }, "v" + VERSION));
}
addEventListener("hashchange", render);
let fresh;
store.update((st) => { fresh = refreshState(st, toKey()); });
render();
fresh.trophies.forEach((t) => toast("Nouveau trophée : " + trophyLabel(t.line, t.tier)));
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
