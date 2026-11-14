import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { speak, voiceStatus, speechSupported, NO_VOICE_MESSAGE } from "../speech.js";
import { VERSION } from "../version.js";
import { topbar } from "./common.js";
import { sync, onSyncStatus, runSync, syncAvailable } from "../syncer.js";
import { FIREBASE } from "../firebase-config.js";
import { syncConfigured } from "../sync.js";
import { exportData, importData } from "../state.js";
import { toKey } from "../dates.js";
import { toast } from "./notify.js";
import { applyMotion, systemReduced } from "../motion.js";

const RATES = [[0.75, "🐢 Lente"], [0.9, "Normale"], [1.1, "🐇 Rapide"]];

const hhmm = (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export function reglagesScreen({ go }) {
  const root = h("main", { class: "screen" });
  const syncBox = h("div", { class: "card" });
  function drawSync() {
    const configured = syncConfigured(FIREBASE), hasId = !!(store.profile && store.profile.id);
    let line, btn = null;
    if (!configured) line = "Pas encore activée : ta progression est gardée sur cet appareil. Pense à faire une sauvegarde dans un fichier (juste en dessous).";
    else if (!hasId) { line = "Pour retrouver ta progression sur un autre appareil, crée ton prénom et ton code secret."; btn = h("button", { class: "btn light", type: "button", onclick: () => go("profil") }, "🔑 Créer mon code secret"); }
    else {
      line = sync.state === "syncing" ? "Synchronisation en cours…" : sync.state === "ok" && sync.at ? `✅ Tout est à jour (${hhmm(sync.at)}). Tes trophées te suivent sur tes autres appareils.`
        : sync.state === "error" ? `⚠️ ${sync.message}` : "Ta progression se synchronise toute seule entre tes appareils.";
      btn = h("button", { class: "btn light", type: "button", disabled: sync.state === "syncing", onclick: () => { sfx.tap(); runSync(); } }, "↻ Synchroniser maintenant");
    }
    syncBox.replaceChildren(h("h2", {}, "☁️ Synchronisation"), h("p", {}, line), btn);
  }
  const off = onSyncStatus(drawSync);
  function exportFile() {
    const blob = new Blob([exportData(store.state, VERSION)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = h("a", { href: url, download: `calcul-cm2-sauvegarde-${toKey()}.json` });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast("Sauvegarde enregistrée dans tes téléchargements", { icon: "💾", sound: false });
  }
  async function importFile(file) {
    if (!file) return;
    try { store.replaceState(importData(await file.text(), store.state)); toast("Sauvegarde ajoutée : rien n'a été effacé !", { icon: "💾", sound: false }); }
    catch (e) { toast(e.message || "Ce fichier ne marche pas.", { icon: "⚠️", sound: false }); }
  }
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
        h("div", { class: "card" }, h("h2", {}, "✨ Animations"),
          h("div", { class: "seg" }, [["auto", "Automatique"], ["on", "Toujours"], ["off", "Réduites"]].map(([val, label]) =>
            h("button", { class: "seg-b" + ((s.motion || "auto") === val ? " on" : ""), type: "button", onclick: () => { store.set("motion", val); applyMotion(val); sfx.tap(); draw(); } }, label))),
          h("p", { class: "small" }, systemReduced()
            ? "Ton appareil demande de réduire les animations (souvent le mode économie d'énergie). En « Automatique », la neige, les feuilles et les effets restent immobiles : choisis « Toujours » pour les voir bouger."
            : "En « Automatique », l'appli suit le réglage de ton appareil. « Réduites » arrête les animations (décors, évolutions).")),
        h("div", { class: "card" }, h("h2", {}, "✍️ Façon de répondre"),
          seg("answer", [["qcm", "4 choix"], ["input", "Je tape"]])),
        syncBox,
        h("div", { class: "card" }, h("h2", {}, "💾 Sauvegarde dans un fichier"),
          h("p", {}, "Un fichier de secours avec tous tes trophées et tes créatures. Quand tu l'ajoutes, rien n'est jamais effacé : tout est fusionné."),
          h("button", { class: "btn light", type: "button", onclick: () => { sfx.tap(); exportFile(); } }, "⬇️ Enregistrer ma sauvegarde"),
          h("label", { class: "btn light file-btn" }, "⬆️ Ajouter une sauvegarde", h("input", { type: "file", accept: ".json,application/json", onchange: (e) => importFile(e.target.files[0]) }))),
        h("p", { class: "muted center small", style: { color: "#dff3ff" } }, `Calcul CM2 · version ${VERSION}`)));
  }
  draw(); drawSync();
  return { el: root, destroy: off };
}
