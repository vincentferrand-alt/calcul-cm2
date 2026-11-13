import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { makeProfileId } from "../profile.js";
import { keypad } from "./keypad.js";

// Une seule fois par appareil : prénom + code secret (4 chiffres). Reste sur l'appareil ; sert à retrouver la progression ailleurs.
export function profilScreen({ go }) {
  const root = h("main", { class: "screen" });
  let name = "", first = "";
  function stepName() {
    const input = h("input", { class: "text-input", type: "text", maxlength: "20", autocomplete: "off", autocapitalize: "words", placeholder: "Ton prénom", "aria-label": "Ton prénom" });
    const next = () => { name = input.value.trim(); if (!name) { input.focus(); return; } sfx.tap(); stepCode(false); };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") next(); });
    root.replaceChildren(h("div", { class: "screen-body center-col" },
      h("h1", { class: "big-title" }, "Bienvenue ! 👋"),
      h("p", { class: "lead center" }, "Comment t'appelles-tu ?"), input,
      h("button", { class: "btn big", onclick: next }, "Suivant ▶"),
      h("button", { class: "link", onclick: () => { store.setProfile({ name: "", id: null }); go(""); } }, "Plus tard")));
    setTimeout(() => input.focus(), 50);
  }
  function stepCode(confirm) {
    let code = "";
    const dots = h("div", { class: "dots" });
    const draw = () => dots.replaceChildren(...[0, 1, 2, 3].map((i) => h("span", { class: "dot" + (i < code.length ? " on" : "") })));
    const msg = h("p", { class: "lead center" }, confirm ? "Retape ton code pour confirmer" : `Choisis un code secret (4 chiffres), ${name}`);
    async function ok() {
      if (code.length !== 4) return;
      if (!confirm) { first = code; return stepCode(true); }
      if (code !== first) { msg.textContent = "Ce n'est pas le même code, on recommence."; first = ""; code = ""; draw(); setTimeout(() => stepCode(false), 900); return; }
      const id = await makeProfileId(name, code);
      store.setProfile({ name, id }); sfx.level(); go("");
    }
    draw();
    root.replaceChildren(h("div", { class: "screen-body center-col" }, msg, dots,
      h("p", { class: "muted center small", style: { color: "#dff3ff" } }, "Ce code te permettra de retrouver tes trophées sur un autre appareil."),
      keypad({ onDigit: (d) => { if (code.length < 4) { code += d; draw(); } }, onDel: () => { code = code.slice(0, -1); draw(); }, onOk: ok })));
  }
  stepName();
  return { el: root };
}
