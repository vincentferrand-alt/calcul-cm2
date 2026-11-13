import { VERSION } from "./version.js";
import { h, svgEl } from "./dom.js";
import { eggSVG } from "./creatures.js";

const app = document.getElementById("app");

function home() {
  const mascot = h("div", { class: "mascot" });
  mascot.append(svgEl(eggSVG({ uid: "home" })));
  app.replaceChildren(
    h("main", { class: "screen" },
      h("div", { class: "screen-body" },
        h("div", { class: "home-hero" },
          h("h1", { style: { margin: "18px 0 0", fontSize: "2rem" } }, "Calcul CM2 ✨"),
          mascot,
          h("div", { class: "bubble" }, "Bientôt, des calculs à croquer ! Cet œuf cache une surprise…"),
        ),
      ),
    ),
    h("div", { class: "badge-version" }, "v" + VERSION),
  );
}

home();

// Service worker : jouable hors ligne + mise à jour proposée sans rien casser.
if ("serviceWorker" in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return; // première installation
    const t = h("div", { class: "toast" }, "Nouvelle version prête ",
      h("button", { onclick: () => location.reload() }, "Recharger"));
    document.body.append(t);
  });
}
