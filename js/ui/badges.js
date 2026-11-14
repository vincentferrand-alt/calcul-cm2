// Pastilles de familles (v0.13) : le symbole de chaque famille de calcul dans sa couleur (celles du générateur).
import { h } from "../dom.js";
import { famById } from "../generator.js";

export const famPill = (id, cls = "") => { const f = famById(id); return h("span", { class: "fam-pill " + cls, style: { "--fam": f.color, "--fam-ink": f.ink }, title: f.name }, f.short); };
export const famPills = (ids) => h("span", { class: `fam-pills n${ids.length}`, "aria-hidden": "true" }, ids.map((id) => famPill(id)));
