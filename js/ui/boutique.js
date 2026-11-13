import { h, svgEl } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { toKey } from "../dates.js";
import { CREATURES, featured, creatureById } from "../creatures.js";
import { SLOTS, ITEMS, itemIcon } from "../accessories.js";
import { balance, buy, owned, toggleWear, wornBy } from "../shop.js";
import { creatureArt } from "./album.js";
import { topbar } from "./common.js";
import { toast, confetti } from "./notify.js";

export function boutiqueScreen({ go }) {
  const root = h("main", { class: "screen" });
  const hatched = () => CREATURES.filter((c) => (store.state.cre[c.id] || { s: 0 }).s > 0);
  const first = () => { const comp = store.settings.companion; if (comp && hatched().some((c) => c.id === comp)) return comp; const f = featured(store.state); return f ? f.c.id : null; };
  let who = first(), slot = "head";

  function draw() {
    const s = store.state, bal = balance(s), list = hatched();
    if (who && !list.some((c) => c.id === who)) who = first();
    const stage = who ? s.cre[who].s : 0;
    const preview = h("div", { class: "shop-preview" });
    if (who) preview.append(creatureArt(who, stage, 0, "shop", wornBy(s, who)), h("div", { class: "shop-who" }, `${creatureById(who).name} · ${creatureById(who).forms[stage - 1]}`));
    else preview.append(h("div", { class: "shop-empty" }, "🥚", h("p", {}, "Fais éclore ta première créature (10 bonnes réponses dans un type de calcul) pour pouvoir l'habiller !")));
    const chips = list.length > 1 ? h("div", { class: "shop-chips" }, list.map((c) => {
      const b = h("button", { class: "chip" + (c.id === who ? " on" : ""), type: "button", "aria-label": c.name, onclick: () => { who = c.id; sfx.tap(); draw(); } });
      b.append(creatureArt(c.id, s.cre[c.id].s, 0, "chip", wornBy(s, c.id))); return b;
    })) : null;
    const tabs = h("div", { class: "seg" }, SLOTS.map((sl) => h("button", { class: "seg-b" + (sl.id === slot ? " on" : ""), type: "button", onclick: () => { slot = sl.id; sfx.tap(); draw(); } }, `${sl.emoji} ${sl.name}`)));
    const wornNow = who ? wornBy(s, who) : {};
    const cards = ITEMS.filter((i) => i.slot === slot).map((it) => {
      const has = owned(s, it.id), on = wornNow[it.slot] === it.id;
      const ic = h("div", { class: "item-ic" }); ic.append(svgEl(itemIcon(it.id)));
      let btn;
      if (has) btn = who ? h("button", { class: "btn small" + (on ? " green" : " light"), type: "button", onclick: () => { sfx.tap(); store.update((st) => { toggleWear(st, who, it.id); }); draw(); } }, on ? "✓ Porté" : "Mettre") : h("span", { class: "item-note" }, "Acheté ✓");
      else if (bal >= it.price) btn = h("button", { class: "btn small", type: "button", onclick: () => buyIt(it) }, `Acheter · ⭐ ${it.price}`);
      else btn = h("button", { class: "btn small ghost-dark", type: "button", disabled: true }, `⭐ ${it.price} · encore ${it.price - bal}`);
      return h("div", { class: "item" + (has ? " has" : "") }, ic, h("div", { class: "item-name" }, it.name), btn);
    });
    root.replaceChildren(topbar("Boutique", () => go(""), h("span", { class: "pill big-pill" }, `⭐ ${bal}`)),
      h("div", { class: "screen-body" }, h("div", { class: "card shop-card" }, preview, chips),
        tabs, h("div", { class: "items" }, cards),
        h("p", { class: "muted center small", style: { color: "#dff3ff" } }, "Tu gagnes des étoiles à chaque série de calculs : ★ 1 à 3 par série.")));
  }
  function buyIt(it) {
    let r; store.update((st) => { r = buy(st, it.id, toKey()); if (r.ok && who) toggleWear(st, who, it.id); });
    if (r.ok) { sfx.hatch(); confetti(24); toast(`${it.name} : acheté !`, { icon: "🛍️", sound: false }); }
    draw();
  }
  draw();
  return { el: root };
}
