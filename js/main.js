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
import { albumScreen } from "./ui/album.js";
import { reglagesScreen } from "./ui/reglages.js";
import { creatureById, STAGE_NAMES } from "./creatures.js";
import { refreshState } from "./game.js";
import { toKey } from "./dates.js";
import { toast } from "./ui/notify.js";
import { trophyLabel } from "./trophies.js";

const app = document.getElementById("app");

const routes = { "": homeScreen, exercices: exercicesScreen, jouer: playScreen, apprendre: apprendreScreen, fiche: ficheScreen, trophees: trophiesScreen, album: albumScreen, reglages: reglagesScreen, profil: profilScreen };
let current = null, shown = null; // shown = nom de l'écran réellement affiché

const wanted = () => {
  const name = location.hash.replace(/^#\/?/, "").split("/")[0];
  return !store.profile && name !== "profil" ? "profil" : name;
};
function go(name, force) {
  const target = "#/" + name;
  if (location.hash !== target && !(name === "" && !location.hash)) { location.hash = target; return; }
  // l'adresse ne change pas : on redessine seulement si l'écran affiché n'est plus le bon (ex. après le code secret) ou sur demande
  if (force || shown !== wanted()) render();
}
function render() {
  if (current && current.destroy) current.destroy();
  let [name, ...args] = location.hash.replace(/^#\/?/, "").split("/");
  if (!store.profile && name !== "profil") name = "profil";
  shown = name;
  const screen = (routes[name] || routes[""])({ go, args });
  current = screen;
  app.replaceChildren(screen.el, h("div", { class: "badge-version" }, "v" + VERSION));
}
addEventListener("hashchange", render);
let fresh;
store.update((st) => { fresh = refreshState(st, toKey()); });
render();
// Au démarrage (surtout après une fusion téléphone/iMac) : on regroupe les annonces pour ne pas couvrir l'écran.
if (fresh.trophies.length > 2) toast(`${fresh.trophies.length} nouveaux trophées t'attendent !`);
else fresh.trophies.forEach((t) => toast("Nouveau trophée : " + trophyLabel(t.line, t.tier)));
if (fresh.creatures.length > 2) toast("Tes créatures ont grandi ! Va voir dans « Créatures ».", { icon: "🥚" });
else fresh.creatures.forEach((e) => toast(`${creatureById(e.id).name} : ${STAGE_NAMES[e.to]} !`, { icon: "🥚" }));
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
