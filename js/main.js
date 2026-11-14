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
import { carnetScreen } from "./ui/carnet.js";
import { courseScreen } from "./ui/course.js";
import { startSyncing, setSyncHook } from "./syncer.js";
import { refreshState } from "./game.js";
import { toKey } from "./dates.js";
import { eveningDone } from "./evening.js";
import { newsBanner, bannerEl, closeBanner } from "./ui/notify.js";
import { applyMotion } from "./motion.js";
import { tabBar, showsTabs } from "./ui/tabs.js";
import { emptyNews, mergeNews, isEmpty } from "./news.js";
import { dueReviews } from "./progress.js";

applyMotion(store.settings.motion);

const app = document.getElementById("app");

const routes = { "": homeScreen, exercices: exercicesScreen, jouer: playScreen, apprendre: apprendreScreen, fiche: ficheScreen, trophees: trophiesScreen, album: albumScreen, reglages: reglagesScreen, boutique: boutiqueScreen, profil: profilScreen, carnet: carnetScreen, course: courseScreen };
let current = null, shown = null; // shown = nom de l'écran réellement affiché
let pending = emptyNews(); // nouvelles en attente d'affichage

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
  if (!routes[name]) name = "";
  shown = name;
  const screen = routes[name]({ go, args });
  current = screen;
  const tabs = showsTabs(name);
  const keep = tabs ? bannerEl() : null; // le bandeau des nouvelles reste d'un onglet à l'autre (pas pendant une partie)
  if (!tabs) closeBanner();
  app.classList.toggle("has-tabs", tabs);
  app.replaceChildren(...[screen.el, tabs ? tabBar(name, go, { exercices: dueReviews(store.state, toKey()).length }) : null, h("div", { class: "badge-version" }, "v" + VERSION), keep].filter(Boolean));
  flushNews();
}
addEventListener("hashchange", render);
let fresh;
store.update((st) => { fresh = refreshState(st, toKey()); });
render();
// Annonces (au démarrage, ou après une fusion avec l'autre appareil) : trophées, évolutions et étoiles regroupés dans UN bandeau
// court, en bas (v0.13). Pendant une partie ou sur l'écran d'ouverture, elles attendent et s'affichent ensuite.
function announce(news) {
  if (!news) return;
  pending = mergeNews(pending, { trophies: news.trophies || [], creatures: news.creatures || [], stars: news.stars || 0, overspent: !!news.overspent });
  flushNews();
}
function flushNews() {
  if (isEmpty(pending) || !showsTabs(shown) || document.querySelector(".splash")) return;
  const n = pending; pending = emptyNews();
  newsBanner(n, go);
}
// Écran d'ouverture : une fois par ouverture de l'appli, seulement si on arrive sur l'accueil (pas en rouvrant un écran précis).
const opening = !!store.profile && shown === "";
// Si l'énigme du soir vient d'être faite sur l'écran d'ouverture, l'accueil est redessiné (créature endormie, plus de bouton 🌙).
if (opening) showSplash(() => { if (shown === "" && eveningDone(store.state, toKey())) render(); announce(fresh); }); else announce(fresh);
// Synchronisation (si elle est activée) : quand l'autre appareil a apporté du nouveau, on redessine l'accueil / l'album / les trophées (jamais en pleine partie).
setSyncHook((news) => { if (["", "album", "trophees", "reglages", "carnet", "boutique"].includes(shown)) render(); announce(news); });
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
