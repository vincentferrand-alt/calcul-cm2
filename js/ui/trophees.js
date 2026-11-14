import { h, svgEl } from "../dom.js";
import { store } from "../store.js";
import { LINES, TIER_NAMES, TIER_COLORS, nextTier, earnedTier } from "../trophies.js";
import { topbar } from "./common.js";
import { collectionTabs } from "./tabs.js";

export function medalSVG(tier) {
  const c = tier ? TIER_COLORS[tier - 1] : "#7b8db3";
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 4h10l4 18H24z" fill="#4f5ff0" opacity="${tier ? 1 : .4}"/><path d="M44 4H34l-4 18h10z" fill="#2ec4b6" opacity="${tier ? 1 : .4}"/><circle cx="32" cy="40" r="20" fill="${c}" opacity="${tier ? 1 : .35}"/><circle cx="32" cy="40" r="15" fill="none" stroke="#fff" stroke-opacity="${tier ? .55 : .25}" stroke-width="3"/></svg>`;
}

export function trophiesScreen({ go }) {
  const s = store.state;
  const total = Object.keys(s.tro).length;
  // Une ligne retirée (Garde-robe) ne s'affiche que si elle a déjà rapporté un palier : il est gardé pour toujours.
  const cards = LINES.filter((l) => !l.retired || earnedTier(s, l) > 0).map((l) => {
    const tier = earnedTier(s, l), nt = nextTier(s, l), v = l.value(s);
    const pct = nt ? Math.min(100, Math.round(100 * v / nt.target)) : 100;
    const medal = h("div", { class: "medal" }); medal.append(svgEl(medalSVG(tier)), h("span", { class: "medal-emoji" }, l.emoji));
    return h("div", { class: "trophy" + (tier ? " got" : "") }, medal,
      h("div", { class: "grow" },
        h("div", { class: "trophy-name" }, l.name, tier ? h("span", { class: "tier-tag", style: { background: TIER_COLORS[tier - 1] } }, TIER_NAMES[tier - 1]) : null),
        h("div", { class: "trophy-desc" }, nt ? `${TIER_NAMES[nt.tier - 1]} : ${l.desc(nt.target)}` : l.retired ? "Trophée de collection : les accessoires ont laissé place aux décors." : "Tous les paliers gagnés, bravo ! 🎉"),
        nt ? h("div", { class: "bar small" }, h("div", { class: "bar-fill", style: { width: pct + "%" } })) : null,
        nt ? h("div", { class: "trophy-count" }, `${Math.min(v, nt.target)} / ${nt.target}`) : null));
  });
  return { el: h("main", { class: "screen" }, topbar("Ma collection", null),
    h("div", { class: "screen-body" }, collectionTabs("trophees", go), h("div", { class: "card center" }, h("div", { class: "big-num" }, `🏆 ${total}`), h("p", {}, total === 1 ? "trophée gagné" : "trophées gagnés")), cards)) };
}
