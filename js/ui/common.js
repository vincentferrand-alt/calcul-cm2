import { h } from "../dom.js";

export const topbar = (title, onBack, right) =>
  h("div", { class: "topbar" },
    onBack ? h("button", { class: "icon-btn", "aria-label": "Retour", onclick: onBack }, "←") : null,
    h("h1", {}, title), right || null);
