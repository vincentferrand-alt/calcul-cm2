import { h, svgEl } from "../dom.js";

const ICONS = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4.5 7.5 12 15 19.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>',
};
// Bouton rond avec une icône dessinée (centrée, bien lisible, assez grand pour un doigt).
export const iconBtn = (kind, label, onclick) => {
  const b = h("button", { class: "icon-btn", type: "button", "aria-label": label, onclick });
  b.append(svgEl(ICONS[kind]));
  return b;
};

export const topbar = (title, onBack, right) =>
  h("div", { class: "topbar" },
    onBack ? iconBtn("back", "Retour", onBack) : null,
    h("h1", {}, title), right || null);
