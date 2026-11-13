import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { speak, voiceStatus, speechSupported, NO_VOICE_MESSAGE } from "../speech.js";
import { VERSION } from "../version.js";
import { topbar } from "./common.js";

const RATES = [[0.75, "🐢 Lente"], [0.9, "Normale"], [1.1, "🐇 Rapide"]];

export function reglagesScreen({ go }) {
  const root = h("main", { class: "screen" });
  function seg(key, options) {
    return h("div", { class: "seg" }, options.map(([val, label]) =>
      h("button", { class: "seg-b" + (store.settings[key] === val ? " on" : ""), type: "button", onclick: () => { store.set(key, val); sfx.tap(); draw(); } }, label)));
  }
  function draw() {
    const status = voiceStatus(), s = store.settings;
    const voiceNote = status === "none" ? "Ton appareil ne propose pas la lecture à voix haute. L'appli marche très bien sans." : status === "no-french" ? NO_VOICE_MESSAGE : null;
    root.replaceChildren(topbar("Réglages", () => go("")),
      h("div", { class: "screen-body" },
        h("div", { class: "card" }, h("h2", {}, "🔔 Sons et bruitages"),
          seg("muted", [[false, "Avec le son"], [true, "Sans le son"]])),
        h("div", { class: "card" }, h("h2", {}, "🗣️ Voix"),
          h("p", {}, "Vitesse de lecture"), seg("rate", RATES),
          h("p", { style: { marginTop: "12px" } }, "Lire les calculs à voix haute pendant les exercices"),
          seg("readAloud", [[false, "Non"], [true, "Oui"]]),
          speechSupported() ? h("button", { class: "btn light", type: "button", onclick: () => { sfx.tap(); speak("Quarante-sept plus trente-huit", { rate: s.rate }); } }, "🔊 Tester la voix") : null,
          voiceNote ? h("p", { class: "small" }, voiceNote) : null),
        h("div", { class: "card" }, h("h2", {}, "✍️ Façon de répondre"),
          seg("answer", [["qcm", "4 choix"], ["input", "Je tape"]])),
        h("p", { class: "muted center small", style: { color: "#dff3ff" } }, `Calcul CM2 · version ${VERSION}`)));
  }
  draw();
  return { el: root };
}
