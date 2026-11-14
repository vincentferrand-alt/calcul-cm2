// Parcours v0.14 dans un vrai navigateur, heure fixée à 19 h : créature interactive, énigme du soir → carte du carnet de rêves,
// album (page d'une créature, raccourci vers ses décors), clavier de l'iMac. node tools/flow-soir.mjs [dossier-captures]
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import assert from "node:assert/strict";
const root = path.resolve(new URL("..", import.meta.url).pathname), out = process.argv[2] || "/tmp";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".json": "application/json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(0);
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const errors = [];
async function open(size) {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.addInitScript(() => { if (!localStorage.getItem("ccm2:profile")) {
    localStorage.setItem("ccm2:profile", JSON.stringify({ name: "Test", id: null }));
    localStorage.setItem("ccm2:state", JSON.stringify({ v: 1, fam: { add: { xp: 60, n: 70, lvl: 2, maxLvl: 2, recent: [] }, sub: { xp: 12, n: 15, lvl: 1, maxLvl: 1, recent: [] } }, cre: { add: { s: 2, d: {} }, sub: { s: 1, d: {} } }, eve: { "2026-11-12": { ok: true, n: 1 } } }));
  } });
  const page = await ctx.newPage(); page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install({ time: new Date("2026-11-14T19:00:00") });
  await page.goto(`http://localhost:${srv.address().port}/`);
  return page;
}
// --- téléphone ---
const page = await open({ width: 384, height: 824 });
await page.waitForSelector(".splash.has-riddle");
assert.equal(await page.locator(".tabbar").evaluate((e) => getComputedStyle(e).visibility), "hidden", "pas d'onglets sous l'écran d'ouverture");
// la créature réagit sur l'écran d'ouverture (bulle), sans fermer la fenêtre de l'énigme
await page.locator(".splash .sc-tap").click(); await page.waitForSelector(".splash .sc-bubble.show");
await page.locator("text=Voir l'énigme").click(); await page.waitForSelector(".riddle-choices .choice");
const q = await page.locator(".riddle-q").innerText();
for (let i = 0; i < 4 && !(await page.locator(".riddle-night").count()); i++) { const b = page.locator(".riddle-choices .choice:not(.soft):not(.good)").first(); if (await b.count()) await b.click(); await page.waitForTimeout(200); }
await page.waitForSelector(".riddle-night");
await page.screenshot({ path: `${out}/soir-1-enigme.png` });
await page.locator(".riddle-end .btn", { hasText: "Entrer" }).click(); await page.waitForSelector(".splash", { state: "detached" });
const st = await page.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")).eve["2026-11-14"]);
assert.equal(st.c, "add"); assert.equal(st.st, 2); assert.equal(st.bg, "bg_prairie"); assert.ok(st.q && Number.isFinite(st.a), "le calcul est gardé pour le carnet");
assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")).eve["2026-11-12"]), { ok: true, n: 1 }, "l'ancienne entrée n'est pas réécrite");
// créature de l'accueil : bulle, et pas de seconde réaction avant ~2 s
await page.locator(".home .sc-tap").click(); await page.waitForSelector(".home .sc-bubble.show");
const first = await page.locator(".home .sc-bubble").innerText();
await page.locator(".home .sc-tap").click(); assert.equal(await page.locator(".home .sc-bubble").innerText(), first, "une réaction toutes les ~2 s au plus");
await page.screenshot({ path: `${out}/soir-2-bulle.png` });
await page.clock.runFor(2100);
await page.locator(".home .sc-tap").click(); await page.waitForTimeout(50);
assert.notEqual(await page.locator(".home .sc-bubble").innerText(), first, "après 2 s : nouvelle phrase");
// album → page de la créature → ses décors → carnet de rêves
await page.locator(".tab-b", { hasText: "Collection" }).click(); await page.waitForSelector(".pet-card");
await page.locator(".pet-card").first().click(); await page.waitForSelector(".form-row");
assert.equal(await page.locator(".form-row.locked").count(), 2, "formes 3 et 4 en silhouette");
await page.locator(".form-row:not(.locked)").first().click(); await page.waitForSelector(".form-row.sel");
assert.match(await page.locator(".form-row.sel").innerText(), /Dragonneau/);
await page.screenshot({ path: `${out}/soir-3-fiche-creature.png` });
await page.locator("text=Ses décors").click(); await page.waitForSelector(".shop-who");
assert.match(await page.locator(".shop-who").innerText(), /Braise/);
await page.locator(".tab-b", { hasText: "Collection" }).click(); await page.waitForSelector(".sub-tabs");
await page.locator(".sub-tabs .seg-b", { hasText: "Carnet" }).click(); await page.waitForSelector(".dream"); // v0.17 : le carnet est un sous-onglet
assert.equal(await page.locator(".dream").count(), 2, "deux cartes : ce soir et l'ancienne");
assert.equal(await page.locator(".dream-calc").first().innerText(), `${q.replace(" = ?", "")} ${(await page.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")).eve["2026-11-14"].eq)) ? "=" : ":"} ${st.a}`.replace(/\s+/g, " "));
await page.screenshot({ path: `${out}/soir-4-carnet.png` });
await page.locator(".dream-nav .icon-round").last().click(); await page.waitForFunction(() => document.querySelector(".dream-count").textContent.startsWith("2"));
// --- iMac : deux colonnes, raccourcis visibles, Échap ferme l'énigme ---
const mac = await open({ width: 1200, height: 800 });
await mac.waitForSelector(".splash.has-riddle"); await mac.keyboard.press("Escape"); await mac.waitForSelector(".splash", { state: "detached" });
const cols = await mac.locator(".home-grid").evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length);
assert.equal(cols, 2, "deux colonnes sur l'iMac");
await mac.locator(".eve-pill").click({ force: true }); await mac.waitForSelector(".modal .kbd-hint");
assert.ok(await mac.locator(".modal .kbd-hint").isVisible(), "raccourcis visibles");
await mac.keyboard.press("1"); await mac.waitForTimeout(200);
assert.ok(await mac.locator(".riddle-choices .choice.good, .riddle-choices .choice.soft").count() >= 1, "la touche 1 répond");
await mac.keyboard.press("Escape"); await mac.waitForSelector(".modal", { state: "detached" });
// v0.14.1 : « Ma semaine » en petit dans la colonne de gauche (iMac seulement)
assert.ok(await mac.locator(".week-card").isVisible(), "Ma semaine visible sur l'iMac");
assert.equal(await mac.locator(".week-day").count(), 7);
assert.equal(await mac.locator(".week-day.today").count(), 1);
const leftHasWeek = await mac.locator(".home-left .week-card").count();
assert.equal(leftHasWeek, 1, "sous la scène et l'objectif, colonne de gauche");
assert.equal(await page.evaluate(() => { location.hash = "#/"; return true; }), true); await page.waitForSelector(".home-hero");
assert.equal(await page.locator(".week-card").isVisible(), false, "pas sur le téléphone");
await mac.screenshot({ path: `${out}/soir-5-imac.png` });
console.log(errors.length ? "ERREURS : " + errors.join("\n") : "parcours du soir OK, pas d'erreur JS");
await browser.close(); srv.close(); if (errors.length) process.exit(1);
