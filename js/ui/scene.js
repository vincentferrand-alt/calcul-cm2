// La « scène » (v0.11) : un composant unique utilisé sur l'accueil, l'écran d'ouverture, la boutique et l'album.
// Couches (de l'arrière vers l'avant) : ciel (selon l'heure réelle) · soleil/lune/étoiles · fond · petits animaux · voile du soir/de la nuit
// · effet (arrière) · créature · effet (avant) · météo. Animations en CSS (transform/opacity seulement), peu de particules,
// arrêtées si « réduire les animations » est demandé, et en pause quand l'appli passe en arrière-plan.
import { h } from "../dom.js";
import { creatureById } from "../creatures.js";
import { landSVG, weatherHTML, effectHTML, petHTML, skyHTML, objectHTML, timeOfDay, seeded, decorById, TOD_NAMES, DEFAULT_BG } from "../decor.js";
import { creatureArt } from "./art.js";

const f1 = (n) => Number(n.toFixed(1));
function astroHTML(tod, bg, lite) {
  const night = tod === "night" || bg === "bg_nuit";
  if (!night) return `<i class="sc-sun ${tod}"></i>`;
  const r = seeded(bg === "bg_nuit" ? 7 : 3), n = (lite ? 8 : 16) + (bg === "bg_nuit" ? 8 : 0);
  let stars = "";
  for (let i = 0; i < n; i++) stars += `<i class="sc-star" style="left:${f1(r() * 100)}%;top:${f1(r() * 52)}%;--s:${f1(1.5 + r() * 2.5)}px;animation-delay:-${f1(r() * 3)}s"></i>`;
  return `<svg class="sc-moon" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#fff4c8" opacity=".12"/><path d="M24 5a15 15 0 1 0 11 25A12 12 0 0 1 24 5Z" fill="#fff4c8"/></svg>${stars}${bg === "bg_nuit" && !lite ? '<i class="sc-shoot"></i>' : ""}`;
}

// opts : { id (créature, ou null), stage, xp, pick {bg,wx,fx,pet}, variant (home|splash|shop|album), lite, hour, art (élément à la place de la créature) }
export function sceneEl({ id = null, stage = 0, xp = 0, pick = {}, variant = "home", lite = false, hour = new Date().getHours(), art = null, sleepy = false } = {}) {
  const bg = decorById(pick.bg) ? pick.bg : DEFAULT_BG;
  const tod = bg === "bg_nuit" ? "night" : timeOfDay(hour);
  const c = id ? creatureById(id) : null;
  const fx = effectHTML(pick.fx, c ? c.aura || c.c2 : "#ffd84a");
  const parts = [bg, pick.sky, pick.wx, pick.fx, pick.pet, pick.o1, pick.o2].filter(Boolean).map((d) => decorById(d) && decorById(d).name.toLowerCase());
  const label = (c ? `${c.name}${stage > 0 ? ", " + c.forms[stage - 1] : ", dans son œuf"}` : "Un œuf") + ` : ${parts.join(", ")} (${TOD_NAMES[tod]})`;
  const el = h("div", { class: `scene v-${variant} tod-${tod} ${bg.replace("_", "-")}${lite ? " lite" : ""}`, role: "img", "aria-label": label, "data-tod": tod, "data-bg": bg });
  const seed = (id ? id.charCodeAt(0) + id.length * 7 : 1) + (variant === "album" ? 11 : 0);
  // v0.16 : ciel et lumières (entre le ciel et le paysage) ; deux objets posés au sol, à gauche et à droite de la créature
  el.innerHTML = `<div class="sc-sky"></div><div class="sc-astro" aria-hidden="true">${astroHTML(tod, bg, lite)}</div>${pick.sky === "sky_arcenciel" ? skyHTML(pick.sky, lite) : ""}${landSVG(bg)}`
    + `<div class="sc-pets" aria-hidden="true">${pick.pet ? petHTML(pick.pet) : ""}</div>`
    + (pick.o1 || pick.o2 ? `<div class="sc-objs" aria-hidden="true">${pick.o1 ? objectHTML(pick.o1, "left") : ""}${pick.o2 ? objectHTML(pick.o2, "right") : ""}</div>` : "")
    + `<div class="sc-shade"></div>${pick.sky && pick.sky !== "sky_arcenciel" ? skyHTML(pick.sky, lite) : ""}` // les lumières du ciel brillent par-dessus le voile du soir
    + `<div class="sc-box sc-fxb" aria-hidden="true">${fx.back}</div><div class="sc-box sc-cre"></div><div class="sc-box sc-fxf" aria-hidden="true">${fx.front}</div>`
    + (pick.wx ? weatherHTML(pick.wx, lite, seed) : "") + '<div class="sc-sleep" aria-hidden="true"><i class="sc-zzz">z z Z</i></div>';
  if (sleepy) el.classList.add("sleepy");
  el.querySelector(".sc-cre").append(art || creatureArt(id || "add", id ? stage : 0, xp, `sc${variant}`));
  return el;
}

// Le ciel suit l'heure : quand l'appli revient au premier plan, on met à jour les scènes affichées.
function refreshTod() {
  const tod = timeOfDay(new Date().getHours());
  for (const el of document.querySelectorAll(".scene[data-tod]")) {
    if (el.dataset.bg === "bg_nuit" || el.dataset.tod === tod) continue;
    el.classList.replace("tod-" + el.dataset.tod, "tod-" + tod); el.dataset.tod = tod;
    el.querySelector(".sc-astro").innerHTML = astroHTML(tod, el.dataset.bg, el.classList.contains("lite"));
  }
}
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    document.documentElement.classList.toggle("app-hidden", document.hidden);
    if (!document.hidden) refreshTod();
  });
  setInterval(() => { if (!document.hidden) refreshTod(); }, 5 * 60 * 1000);
}
