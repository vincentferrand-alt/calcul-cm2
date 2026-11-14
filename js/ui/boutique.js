// Boutique de DÉCORS (v0.11) : on achète avec ses étoiles des fonds, de la météo, des effets et des petits animaux,
// puis on compose la scène de chaque créature éclose (et on choisit la forme affichée parmi les stades débloqués).
// Un appui sur une vignette non achetée = un essai dans l'aperçu, sans rien dépenser.
import { h, svgEl } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { toKey } from "../dates.js";
import { CREATURES, featured, creatureById, STAGE_XP } from "../creatures.js";
import { KINDS, DECOR, decorById, decorIcon, noneIcon, NONE_LABEL } from "../decor.js";
import { balance, buyDecor, hasDecor, scenePick, setPick } from "../shop.js";
import { creatureArt } from "./art.js";
import { sceneEl } from "./scene.js";
import { topbar } from "./common.js";
import { toast, confetti } from "./notify.js";
import { checkTrophies, trophyLabel } from "../trophies.js";
import { isCalm, applyMotion } from "../motion.js";
import { famById } from "../generator.js";

const TABS = [...KINDS, { id: "st", name: "Forme", emoji: "🐣" }];

export function boutiqueScreen({ go, args = [] }) {
  const root = h("main", { class: "screen" });
  const hatched = () => CREATURES.filter((c) => (store.state.cre[c.id] || { s: 0 }).s > 0);
  const first = () => { const comp = store.settings.companion; if (comp && hatched().some((c) => c.id === comp)) return comp; const f = featured(store.state); return f ? f.c.id : null; };
  let who = args[0] && hatched().some((c) => c.id === args[0]) ? args[0] : first(), tab = "bg", trying = null; // #/boutique/<id> : depuis la page d'une créature (v0.14) // trying = décor essayé (pas encore acheté)

  function draw() {
    const s = store.state, bal = balance(s), list = hatched();
    if (who && !list.some((c) => c.id === who)) who = first();
    const pick = who ? scenePick(s, who) : { st: 0, bg: "bg_prairie", wx: null, fx: null, pet: null };
    const shownPick = trying ? { ...pick, [decorById(trying).kind]: trying } : pick;
    const card = h("div", { class: "card shop-card" });
    if (who) {
      const c = creatureById(who);
      card.append(sceneEl({ id: who, stage: pick.st, pick: shownPick, variant: "shop" }), h("div", { class: "shop-who" }, `${c.name} · ${c.forms[pick.st - 1]}`));
    } else {
      card.append(sceneEl({ id: CREATURES[0].id, stage: 0, pick: shownPick, variant: "shop" }),
        h("p", { class: "muted center small" }, "Fais éclore ta première créature (10 bonnes réponses dans un type de calcul) : tu pourras alors lui choisir un décor. Tu peux déjà acheter et essayer !"));
    }
    if (trying) {
      const d = decorById(trying), can = bal >= d.price;
      card.append(h("div", { class: "try-note" }, h("span", {}, `👀 Essai : ${d.name}`),
        can ? h("button", { class: "btn small green", type: "button", onclick: () => buyIt(d) }, `Acheter · ⭐ ${d.price}`)
          : h("span", {}, `⭐ ${d.price} · encore ${d.price - bal}`)));
    }
    if (list.length > 1) card.append(h("div", { class: "shop-chips" }, list.map((c) => {
      const b = h("button", { class: "chip" + (c.id === who ? " on" : ""), type: "button", "aria-label": c.name, onclick: () => { who = c.id; sfx.tap(); draw(); } });
      b.append(creatureArt(c.id, scenePick(s, c.id).st, 0, "chip")); return b;
    })));
    const tabs = h("div", { class: "seg kinds" }, TABS.map((t) => h("button", { class: "seg-b" + (t.id === tab ? " on" : ""), type: "button",
      onclick: () => { tab = t.id; trying = null; sfx.tap(); draw(); } }, h("b", {}, t.emoji), t.name)));
    const cards = tab === "st" ? stageCards(s, pick) : itemCards(s, pick, bal);
    root.replaceChildren(topbar("Boutique de décors", null, h("span", { class: "pill big-pill" }, `⭐ ${bal}`)),
      h("div", { class: "screen-body" }, card, tabs, h("div", { class: "items" }, cards),
        h("p", { class: "muted center small", style: { color: "#dff3ff" } }, "Tu gagnes des étoiles à chaque série de calculs : ★ 1 à 3 par série. Le ciel suit l'heure : jour, soir et nuit !")));
  }

  function itemCards(s, pick, bal) {
    const out = [];
    if (tab !== "bg" && isCalm()) { // décors animés achetés… mais animations coupées par l'appareil : on explique et on propose de les rallumer
      out.push(h("div", { class: "motion-note" }, h("span", {}, store.settings.motion === "off"
        ? "🐢 Les animations sont réduites dans les Réglages : la météo, les effets et les animaux restent immobiles."
        : "🐢 Ton téléphone demande de réduire les animations (souvent le mode économie d'énergie) : la météo, les effets et les animaux restent immobiles."),
        h("button", { class: "btn small green", type: "button", onclick: () => { store.set("motion", "on"); applyMotion("on"); sfx.tap(); draw(); } }, "✨ Les faire bouger quand même")));
    }
    if (tab !== "bg") { // « rien » : enlever la météo / l'effet / les animaux
      const on = !pick[tab];
      const ic = h("div", { class: "item-ic" }); ic.append(svgEl(noneIcon()));
      out.push(h("div", { class: "item" + (on ? " on" : "") }, ic, h("div", { class: "item-name" }, NONE_LABEL[tab]),
        on ? h("span", { class: "item-note" }, "✓ Choisi") : h("button", { class: "btn small light", type: "button", disabled: !who, onclick: () => apply(tab, null) }, "Choisir")));
    }
    for (const d of DECOR.filter((x) => x.kind === tab)) {
      const has = hasDecor(s, d.id), on = pick[tab] === d.id;
      const ic = h("div", { class: "item-ic" + (d.kind === "bg" ? " bgthumb" : "") + (has ? "" : " locked") }); ic.append(svgEl(decorIcon(d.id)));
      let btn;
      if (has) btn = on ? h("span", { class: "item-note" }, "✓ Choisi") : h("button", { class: "btn small light", type: "button", disabled: !who, onclick: () => apply(d.kind, d.id) }, who ? "Choisir" : "Acheté ✓");
      else if (bal >= d.price) btn = h("button", { class: "btn small", type: "button", onclick: () => buyIt(d) }, `Acheter · ⭐ ${d.price}`);
      else btn = h("button", { class: "btn small ghost-dark", type: "button", disabled: true }, `⭐ ${d.price} · encore ${d.price - bal}`);
      const el = h("div", { class: "item" + (on ? " on" : "") + (trying === d.id ? " trying" : "") }, ic, h("div", { class: "item-name" }, d.price === 0 ? `${d.name} (offert)` : d.name), btn);
      if (!has) { // essayer sans acheter
        ic.setAttribute("role", "button"); ic.setAttribute("tabindex", "0"); ic.setAttribute("aria-label", `Essayer : ${d.name}`);
        const tryIt = () => { trying = trying === d.id ? null : d.id; sfx.tap(); draw(); };
        ic.addEventListener("click", tryIt); ic.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tryIt(); } });
      }
      out.push(el);
    }
    return out;
  }

  function stageCards(s, pick) {
    if (!who) return [h("p", { class: "muted center", style: { color: "#dff3ff", gridColumn: "1 / -1" } }, "Les formes apparaîtront quand ton œuf aura éclos.")];
    const c = creatureById(who), max = s.cre[who].s, xp = s.fam[c.fam] ? s.fam[c.fam].xp : 0;
    return [1, 2, 3, 4].map((n) => {
      const ok = n <= max, on = pick.st === n;
      const ic = h("div", { class: "item-ic" + (ok ? "" : " locked") });
      if (ok) ic.append(creatureArt(who, n, 0, "stc")); else ic.append(h("span", { style: { fontSize: "2rem" } }, "🔒"));
      return h("div", { class: "item" + (on ? " on" : "") }, ic, h("div", { class: "item-name" }, ok ? c.forms[n - 1] : "Forme mystère"),
        !ok ? h("span", { class: "item-note", style: { color: "#5b6b8a", fontSize: ".8rem" } }, `Encore ${STAGE_XP[n] - xp} bonnes réponses en ${famById(c.fam).name.toLowerCase()}`)
          : on ? h("span", { class: "item-note" }, "✓ Affichée") : h("button", { class: "btn small light", type: "button", onclick: () => apply("st", n) }, "Afficher"));
    });
  }

  function apply(kind, id) {
    if (!who) return;
    sfx.tap(); trying = null;
    store.update((st) => { setPick(st, who, kind, id); });
    draw();
  }
  function buyIt(d) {
    let r, fresh = [];
    store.update((st) => { r = buyDecor(st, d.id, toKey()); if (r.ok) { if (who) setPick(st, who, d.kind, d.id); fresh = checkTrophies(st, toKey()); } });
    if (r.ok) {
      trying = null; sfx.hatch(); confetti(24); toast(`${d.name} : acheté !`, { icon: "🛍️", sound: false });
      fresh.forEach((t) => toast("Nouveau trophée : " + trophyLabel(t.line, t.tier)));
    }
    draw();
  }
  draw();
  return { el: root };
}
