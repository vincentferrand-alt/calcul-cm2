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
import { boutiqueScreen } from "./ui/boutique.js";
import { showSplash } from "./ui/splash.js";
import { startSyncing, setSyncHook } from "./syncer.js";
import { creatureById, STAGE_NAMES } from "./creatures.js";
import { refreshState } from "./game.js";
import { toKey } from "./dates.js";
import { toast } from "./ui/notify.js";
import { trophyLabel } from "./trophies.js";
import { applyMotion } from "./motion.js";

applyMotion(store.settings.motion);

const app = document.getElementById("app");

const routes = { "": homeScreen, exercices: exercicesScreen, jouer: playScreen, apprendre: apprendreScreen, fiche: ficheScreen, trophees: trophiesScreen, album: albumScreen, reglages: reglagesScreen, boutique: boutiqueScreen, profil: profilScreen };
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
// Annonces (au démarrage, ou après une fusion avec l'autre appareil) : regroupées pour ne pas couvrir l'écran.
function announce(news) {
  if (!news) return;
  if (news.trophies.length > 2) toast(`${news.trophies.length} nouveaux trophées t'attendent !`);
  else news.trophies.forEach((t) => toast("Nouveau trophée : " + trophyLabel(t.line, t.tier)));
  if (news.creatures.length > 2) toast("Tes créatures ont grandi ! Va voir dans « Créatures ».", { icon: "🥚" });
  else news.creatures.forEach((e) => toast(`${creatureById(e.id).name} : ${creatureById(e.id).forms[e.to - 1]} !`, { icon: "🥚" }));
}
// Écran d'ouverture : une fois par ouverture de l'appli, seulement si on arrive sur l'accueil (pas en rouvrant un écran précis).
const opening = !!store.profile && shown === "";
if (opening) showSplash(() => announce(fresh)); else announce(fresh);
// Synchronisation (si elle est activée) : quand l'autre appareil a apporté du nouveau, on redessine l'accueil / l'album / les trophées (jamais en pleine partie).
setSyncHook((news) => { if (["", "album", "trophees", "reglages"].includes(shown)) render(); announce(news); });
startSyncing();
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
