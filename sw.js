/* Service worker de Calcul CM2.
   - Mise en cache de la coque de l'appli (jouable hors ligne).
   - NE TOUCHE JAMAIS aux données de progression (localStorage / IndexedDB) : il ne gère que ses propres caches.
   - Le numéro de version doit correspondre à js/version.js (vérifié par tests/version.test.mjs). */
const VERSION = "0.10.1";
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
  "js/dom.js",
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
  "js/ui/boutique.js",
  "js/ui/common.js",
  "js/ui/exercices.js",
  "js/ui/home.js",
  "js/ui/keypad.js",
  "js/ui/notify.js",
  "js/ui/play.js",
  "js/ui/profil.js",
  "js/ui/reglages.js",
  "js/ui/splash.js",
  "js/ui/trophees.js",
  "js/version.js",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
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
