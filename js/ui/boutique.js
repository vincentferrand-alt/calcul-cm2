// Boutique de DÉCORS (v0.11) : on achète avec ses étoiles des fonds, de la météo, des effets et des petits animaux,
// puis on compose la scène de chaque créature éclose (et on choisit la forme affichée parmi les stades débloqués).
// Un appui sur une vignette non achetée = un essai dans l'aperçu, sans rien dépenser.
// v0.16 : 5 nouveaux rayons — Ciel et lumières, Objets (deux emplacements), Saison (vendus pendant leur saison, gardés toute
// l'année), Cadres du carnet, et l'onglet Collections. Onglets sur 2 rangées de 5 (lisibles sur 384 px).
import { h, svgEl } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { toKey } from "../dates.js";
import { CREATURES, featured, creatureById, STAGE_XP } from "../creatures.js";
import { RAYONS, DECOR, decorById, decorIcon, noneIcon, NONE_LABEL, rayonOf, inSeason, seasonBack, saisonDe, SEASONS, CARNET } from "../decor.js";
import { balance, buyDecor, hasDecor, scenePick, setPick, carnetFrame, collectionsOf } from "../shop.js";
import { creatureArt } from "./art.js";
import { sceneEl } from "./scene.js";
import { topbar } from "./common.js";
import { toast, confetti } from "./notify.js";
import { checkTrophies, trophyLabel } from "../trophies.js";
import { isCalm, applyMotion } from "../motion.js";
import { famById } from "../generator.js";

// Ordre des onglets : 2 rangées de 5.
const TABS = [...RAYONS.slice(0, 5), ...RAYONS.slice(5), { id: "col", name: "Collections", emoji: "🏅" }, { id: "st", name: "Forme", emoji: "🐣" }];
const ANIMATED = ["sky", "wx", "fx", "pet", "obj"];

export function boutiqueScreen({ go, args = [] }) {
  const root = h("main", { class: "screen" });
  const hatched = () => CREATURES.filter((c) => (store.state.cre[c.id] || { s: 0 }).s > 0);
  const first = () => { const comp = store.settings.companion; if (comp && hatched().some((c) => c.id === comp)) return comp; const f = featured(store.state); return f ? f.c.id : null; };
  let who = args[0] && hatched().some((c) => c.id === args[0]) ? args[0] : first(), tab = "bg", trying = null, slot = "o1"; // #/boutique/<id> : depuis la page d'une créature (v0.14)

  function preview(s, pick, shownPick) {
    if (tab === "frame") { // aperçu d'une carte du carnet avec le cadre choisi (ou essayé)
      const fr = trying && decorById(trying).kind === "frame" ? trying : carnetFrame(s);
      const id = who || CREATURES[0].id, st = who ? pick.st : 0;
      return h("div", { class: "frame-prev" }, h("article", { class: "dream" + (fr ? " frame-" + fr.replace("frame_", "") : "") },
        sceneEl({ id, stage: st, pick: { bg: pick.bg }, variant: "dream", lite: true, hour: 22, sleepy: true }),
        h("div", { class: "dream-date" }, fr ? decorById(fr).name : "Sans cadre")));
    }
    return who ? sceneEl({ id: who, stage: pick.st, pick: shownPick, variant: "shop" }) : sceneEl({ id: CREATURES[0].id, stage: 0, pick: shownPick, variant: "shop" });
  }

  function draw() {
    const s = store.state, bal = balance(s), list = hatched(), date = toKey();
    if (who && !list.some((c) => c.id === who)) who = first();
    const pick = who ? scenePick(s, who) : { st: 0, bg: "bg_prairie", wx: null, fx: null, pet: null, sky: null, o1: null, o2: null };
    let shownPick = pick;
    if (trying) { // essai gratuit : dans l'aperçu seulement
      const d = decorById(trying);
      if (d.kind === "obj") { const other = slot === "o1" ? "o2" : "o1"; shownPick = { ...pick, [slot]: trying, [other]: pick[other] === trying ? null : pick[other] }; }
      else if (d.kind !== "frame") shownPick = { ...pick, [d.kind]: trying };
    }
    const card = h("div", { class: "card shop-card" }, preview(s, pick, shownPick));
    if (who) { const c = creatureById(who); if (tab !== "frame") card.append(h("div", { class: "shop-who" }, `${c.name} · ${c.forms[pick.st - 1]}`)); }
    else card.append(h("p", { class: "muted center small" }, "Fais éclore ta première créature (10 bonnes réponses dans un type de calcul) : tu pourras alors lui choisir un décor. Tu peux déjà acheter et essayer !"));
    if (trying) {
      const d = decorById(trying), can = bal >= d.price, open = !d.season || inSeason(d.season, date);
      card.append(h("div", { class: "try-note" }, h("span", {}, `👀 Essai : ${d.name}`),
        !open ? h("span", {}, seasonBack(d.season))
          : can ? h("button", { class: "btn small green", type: "button", onclick: () => buyIt(d) }, `Acheter · ⭐ ${d.price}`)
            : h("span", {}, `⭐ ${d.price} · encore ${d.price - bal}`)));
    }
    if (list.length > 1 && tab !== "frame") card.append(h("div", { class: "shop-chips" }, list.map((c) => {
      const b = h("button", { class: "chip" + (c.id === who ? " on" : ""), type: "button", "aria-label": c.name, onclick: () => { who = c.id; sfx.tap(); draw(); } });
      b.append(creatureArt(c.id, scenePick(s, c.id).st, 0, "chip")); return b;
    })));
    const tabs = h("div", { class: "seg kinds" }, TABS.map((t) => h("button", { class: "seg-b" + (t.id === tab ? " on" : ""), type: "button", "aria-pressed": t.id === tab ? "true" : "false",
      onclick: () => { tab = t.id; trying = null; sfx.tap(); draw(); } }, h("b", {}, t.emoji), t.name)));
    const cards = tab === "st" ? stageCards(s, pick) : tab === "col" ? collectionCards(s) : itemCards(s, pick, bal, date);
    const done = collectionsOf(s).filter((c) => c.done);
    root.replaceChildren(topbar("Boutique de décors", null, h("span", { class: "pill big-pill" }, `⭐ ${bal}`)),
      h("div", { class: "screen-body" }, card, done.length ? h("div", { class: "shop-col-badges" }, done.map((c) => h("span", { class: "col-badge", title: "Collection complète" }, `🏅 ${c.name}`))) : null,
        tabs, h("div", { class: "items" }, cards),
        h("p", { class: "muted center small", style: { color: "#dff3ff" } }, "Tu gagnes des étoiles à chaque série de calculs : ★ 1 à 3 par série. Le ciel suit l'heure : jour, soir et nuit !")));
  }

  function itemCards(s, pick, bal, date) {
    const out = [];
    const rayon = tab, kind = rayon === "season" ? "bg" : rayon, slotKind = kind === "obj" ? slot : kind;
    const current = kind === "frame" ? carnetFrame(s) : pick[slotKind];
    if (ANIMATED.includes(rayon) && isCalm()) { // décors animés achetés… mais animations coupées par l'appareil : on explique et on propose de les rallumer
      out.push(h("div", { class: "motion-note" }, h("span", {}, store.settings.motion === "off"
        ? "🐢 Les animations sont réduites dans les Réglages : les décors animés (ciel, météo, effets, animaux, objets) restent immobiles."
        : "🐢 Ton téléphone demande de réduire les animations (souvent le mode économie d'énergie) : les décors animés (ciel, météo, effets, animaux, objets) restent immobiles."),
        h("button", { class: "btn small green", type: "button", onclick: () => { store.set("motion", "on"); applyMotion("on"); sfx.tap(); draw(); } }, "✨ Les faire bouger quand même")));
    }
    if (kind === "obj") { // deux emplacements : à gauche et à droite de la créature
      const lab = (k) => (pick[k] ? decorById(pick[k]).name : "vide");
      out.push(h("div", { class: "slots" }, [["o1", "⬅️ À gauche"], ["o2", "À droite ➡️"]].map(([k, t]) =>
        h("button", { class: "slot-b" + (slot === k ? " on" : ""), type: "button", "aria-pressed": slot === k ? "true" : "false", onclick: () => { slot = k; trying = null; sfx.tap(); draw(); } }, t, h("small", {}, lab(k))))));
    }
    if (rayon === "season") {
      const now = saisonDe(date);
      out.push(h("p", { class: "motion-note", style: { background: "#eef7ff", borderColor: "#4cb8f0", color: "#04364f" } },
        now ? `🍂 C'est la saison : ${SEASONS[now].name} ! Les décors de saison se vendent pendant leur saison, qui revient chaque année. Une fois achetés, ils sont à toi toute l'année.`
          : "🍂 Les décors de saison se vendent pendant leur saison, qui revient chaque année. Une fois achetés, ils sont à toi toute l'année. Tu peux toujours les essayer."));
    }
    if (kind !== "bg") { // « rien » : enlever le ciel / la météo / l'effet / les animaux / l'objet / le cadre
      const on = !current;
      const ic = h("div", { class: "item-ic" }); ic.append(svgEl(noneIcon()));
      const can = kind === "frame" || !!who;
      out.push(h("div", { class: "item" + (on ? " on" : "") }, ic, h("div", { class: "item-name" }, NONE_LABEL[kind]),
        on ? h("span", { class: "item-note" }, "✓ Choisi") : h("button", { class: "btn small light", type: "button", disabled: !can, onclick: () => apply(slotKind, null) }, "Choisir")));
    }
    for (const d of DECOR.filter((x) => rayonOf(x) === rayon)) {
      const has = hasDecor(s, d.id), on = current === d.id, open = !d.season || inSeason(d.season, date);
      const elsewhere = kind === "obj" && !on && (pick.o1 === d.id || pick.o2 === d.id);
      const ic = h("div", { class: "item-ic" + (d.kind === "bg" ? " bgthumb" : "") + (has ? "" : " locked") }); ic.append(svgEl(decorIcon(d.id)));
      const can = kind === "frame" || !!who;
      let btn;
      if (has) btn = on ? h("span", { class: "item-note" }, "✓ Choisi") : h("button", { class: "btn small light", type: "button", disabled: !can, onclick: () => apply(slotKind, d.id) }, can ? (elsewhere ? "Changer de côté" : "Choisir") : "Acheté ✓");
      else if (!open) btn = h("span", { class: "item-note back" }, `${seasonBack(d.season)} · ⭐ ${d.price}`);
      else if (bal >= d.price) btn = h("button", { class: "btn small", type: "button", onclick: () => buyIt(d) }, `Acheter · ⭐ ${d.price}`);
      else btn = h("button", { class: "btn small ghost-dark", type: "button", disabled: true }, `⭐ ${d.price} · encore ${d.price - bal}`);
      const el = h("div", { class: "item" + (on ? " on" : "") + (trying === d.id ? " trying" : "") + (!has && !open ? " off" : "") }, ic, h("div", { class: "item-name" }, d.price === 0 ? `${d.name} (offert)` : d.name), btn);
      if (!has) { // essayer sans acheter (aussi hors saison)
        ic.setAttribute("role", "button"); ic.setAttribute("tabindex", "0"); ic.setAttribute("aria-label", `Essayer : ${d.name}`);
        const tryIt = () => { trying = trying === d.id ? null : d.id; sfx.tap(); draw(); };
        ic.addEventListener("click", tryIt); ic.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tryIt(); } });
      }
      out.push(el);
    }
    return out;
  }

  function collectionCards(s) {
    return collectionsOf(s).map((c) => h("div", { class: "col-card" + (c.done ? " done" : "") },
      h("div", { class: "col-head" }, h("span", { "aria-hidden": "true" }, c.emoji), h("span", { class: "grow" }, c.name),
        c.done ? h("span", { class: "col-badge" }, "🏅 Complète !") : h("span", { class: "col-n" }, `${c.n} / ${c.total}`)),
      h("div", { class: "bar small" }, h("div", { class: "bar-fill", style: { width: Math.round(100 * c.n / c.total) + "%" } })),
      h("div", { class: "col-items" }, c.items.map((id) => {
        const d = decorById(id), ic = h("div", { class: "item-ic" + (d.kind === "bg" ? " bgthumb" : "") }); ic.append(svgEl(decorIcon(id)));
        return h("button", { class: "col-it" + (c.have.includes(id) ? "" : " miss"), type: "button", "aria-label": `${d.name}${c.have.includes(id) ? " (à toi)" : ""}`,
          onclick: () => { sfx.tap(); tab = rayonOf(d); trying = c.have.includes(id) ? null : id; if (d.kind === "obj") slot = "o1"; draw(); } }, ic, d.name);
      }))));
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
    sfx.tap(); trying = null;
    if (kind === "frame") store.update((st) => { setPick(st, CARNET, "frame", id); });
    else { if (!who) return; store.update((st) => { setPick(st, who, kind, id); }); }
    draw();
  }
  function buyIt(d) {
    let r, fresh = [], before = collectionsOf(store.state).filter((c) => c.done).map((c) => c.id);
    store.update((st) => {
      r = buyDecor(st, d.id, toKey());
      if (r.ok) {
        if (d.kind === "frame") setPick(st, CARNET, "frame", d.id);
        else if (who) setPick(st, who, d.kind === "obj" ? slot : d.kind, d.id);
        fresh = checkTrophies(st, toKey());
      }
    });
    if (r.ok) {
      trying = null; sfx.hatch(); confetti(24); toast(`${d.name} : acheté !`, { icon: "🛍️", sound: false });
      for (const c of collectionsOf(store.state)) if (c.done && !before.includes(c.id)) toast(`Collection « ${c.name} » complète ! 🏅`, { icon: c.emoji });
      fresh.forEach((t) => toast("Nouveau trophée : " + trophyLabel(t.line, t.tier)));
    } else if (r.why === "saison") toast(`${seasonBack(d.season)} : en vente seulement pendant sa saison.`, { icon: "🍂", sound: false });
    draw();
  }
  draw();
  return { el: root };
}
