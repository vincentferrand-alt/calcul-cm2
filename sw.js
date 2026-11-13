/* Service worker de Calcul CM2.
   - Mise en cache de la coque de l'appli (jouable hors ligne).
   - NE TOUCHE JAMAIS aux données de progression (localStorage / IndexedDB) : il ne gère que ses propres caches.
   - Le numéro de version doit correspondre à js/version.js (vérifié par tests/version.test.mjs). */
const VERSION = "0.12.0";
const PREFIX = "calcul-cm2-shell-";
const CACHE = PREFIX + VERSION;
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/accessories.js",
  "js/audio.js",
  "js/creatures.js",
  "js/daily.js",
  "js/dates.js",
  "js/decor.js",
  "js/dom.js",
  "js/evening.js",
  "js/firebase-config.js",
  "js/game.js",
  "js/generator.js",
  "js/hints.js",
  "js/learn.js",
  "js/main.js",
  "js/missions.js",
  "js/numbers-fr.js",
  "js/profile.js",
  "js/progress.js",
  "js/shop.js",
  "js/speech.js",
  "js/state.js",
  "js/storage.js",
  "js/store.js",
  "js/streak.js",
  "js/sync.js",
  "js/syncer.js",
  "js/trophies.js",
  "js/ui/album.js",
  "js/ui/apprendre.js",
  "js/ui/art.js",
  "js/ui/boutique.js",
  "js/ui/common.js",
  "js/ui/evening.js",
  "js/ui/evolve.js",
  "js/ui/exercices.js",
  "js/ui/home.js",
  "js/ui/keypad.js",
  "js/ui/notify.js",
  "js/ui/play.js",
  "js/ui/profil.js",
  "js/ui/reglages.js",
  "js/ui/scene.js",
  "js/ui/splash.js",
  "js/ui/trophees.js",
  "js/version.js",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "assets/creatures/add-1-ombre.webp",
  "assets/creatures/add-1.webp",
  "assets/creatures/add-2-ombre.webp",
  "assets/creatures/add-2.webp",
  "assets/creatures/add-3-ombre.webp",
  "assets/creatures/add-3.webp",
  "assets/creatures/add-4-ombre.webp",
  "assets/creatures/add-4.webp",
  "assets/creatures/comp-1-ombre.webp",
  "assets/creatures/comp-1.webp",
  "assets/creatures/comp-2-ombre.webp",
  "assets/creatures/comp-2.webp",
  "assets/creatures/comp-3-ombre.webp",
  "assets/creatures/comp-3.webp",
  "assets/creatures/comp-4-ombre.webp",
  "assets/creatures/comp-4.webp",
  "assets/creatures/dbl-1-ombre.webp",
  "assets/creatures/dbl-1.webp",
  "assets/creatures/dbl-2-ombre.webp",
  "assets/creatures/dbl-2.webp",
  "assets/creatures/dbl-3-ombre.webp",
  "assets/creatures/dbl-3.webp",
  "assets/creatures/dbl-4-ombre.webp",
  "assets/creatures/dbl-4.webp",
  "assets/creatures/div-1-ombre.webp",
  "assets/creatures/div-1.webp",
  "assets/creatures/div-2-ombre.webp",
  "assets/creatures/div-2.webp",
  "assets/creatures/div-3-ombre.webp",
  "assets/creatures/div-3.webp",
  "assets/creatures/div-4-ombre.webp",
  "assets/creatures/div-4.webp",
  "assets/creatures/frac-1-ombre.webp",
  "assets/creatures/frac-1.webp",
  "assets/creatures/frac-2-ombre.webp",
  "assets/creatures/frac-2.webp",
  "assets/creatures/frac-3-ombre.webp",
  "assets/creatures/frac-3.webp",
  "assets/creatures/frac-4-ombre.webp",
  "assets/creatures/frac-4.webp",
  "assets/creatures/mul-1-ombre.webp",
  "assets/creatures/mul-1.webp",
  "assets/creatures/mul-2-ombre.webp",
  "assets/creatures/mul-2.webp",
  "assets/creatures/mul-3-ombre.webp",
  "assets/creatures/mul-3.webp",
  "assets/creatures/mul-4-ombre.webp",
  "assets/creatures/mul-4.webp",
  "assets/creatures/sub-1-ombre.webp",
  "assets/creatures/sub-1.webp",
  "assets/creatures/sub-2-ombre.webp",
  "assets/creatures/sub-2.webp",
  "assets/creatures/sub-3-ombre.webp",
  "assets/creatures/sub-3.webp",
  "assets/creatures/sub-4-ombre.webp",
  "assets/creatures/sub-4.webp",
  "assets/creatures/trick-1-ombre.webp",
  "assets/creatures/trick-1.webp",
  "assets/creatures/trick-2-ombre.webp",
  "assets/creatures/trick-2.webp",
  "assets/creatures/trick-3-ombre.webp",
  "assets/creatures/trick-3.webp",
  "assets/creatures/trick-4-ombre.webp",
  "assets/creatures/trick-4.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase, etc. : jamais mis en cache
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => (req.mode === "navigate" ? caches.match("index.html") : Response.error()));
    }),
  );
});
