// Parcours automatique dans un vrai navigateur (téléphone 384×824) : node tools/flow-test.mjs [dossier-captures]
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import assert from "node:assert/strict";
const root = path.resolve(new URL("..", import.meta.url).pathname), out = process.argv[2] || "/tmp";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".json": "application/json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(0);
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 384, height: 824 }, deviceScaleFactor: 2, serviceWorkers: "block" });
const page = await ctx.newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`http://localhost:${srv.address().port}/`);
const tap = (sel, nth = 0) => page.locator(sel).nth(nth).click();
// 1. première ouverture : prénom puis code (deux fois) → on doit arriver sur l'accueil sans recharger
await page.fill(".text-input", "Test"); await tap("text=Suivant");
for (let pass = 0; pass < 2; pass++) { for (const d of "1234") await page.locator(`.key:text-is("${d}")`).click(); await page.locator(".key-ok").click(); await page.waitForTimeout(150); }
await page.waitForSelector(".home-hero", { timeout: 3000 });
await page.screenshot({ path: `${out}/flow-1-home.png` });
// 2. défi du jour : on répond (saisie) à tout, puis « Retour » ramène à l'accueil
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("ccm2:settings") || "{}"); s.answer = "qcm"; localStorage.setItem("ccm2:settings", JSON.stringify(s)); });
await page.reload(); await page.waitForSelector(".splash"); await (await page.locator(".splash .btn", { hasText: "Plus tard" }).count() ? page.locator(".splash .btn", { hasText: "Plus tard" }) : page.locator(".splash")).click(); await page.waitForSelector(".splash", { state: "detached" }); await page.waitForSelector(".home-hero");
await tap("text=C'est parti");
await page.waitForSelector(".choice");
await page.waitForTimeout(12500); // hésitation : le coup de pouce doit apparaître
await page.waitForSelector(".nudge-btn", { timeout: 2000 });
await page.locator(".nudge-btn").click({ force: true }); await page.waitForSelector(".nudge-line");
await page.screenshot({ path: `${out}/flow-2-nudge.png` });
for (let i = 0; i < 150; i++) {
  if (await page.locator(".result").count()) break;
  if (await page.locator(".wrong-zone").count()) { await tap(".wrong-zone .btn"); continue; }
  if (await page.locator(".choice").count()) await tap(".choice", 0);
  await page.waitForTimeout(500);
}
await page.waitForSelector(".result", { timeout: 5000 });
await tap("text=Retour");
await page.waitForSelector(".home-hero", { timeout: 3000 });
await page.screenshot({ path: `${out}/flow-3-after-daily.png` });
// 3. barre d'onglets (v0.13) : chaque onglet ouvre son écran, l'onglet actif est allumé ; pas de barre pendant une partie
const tab = (label) => page.locator(".tab-b", { hasText: label }).click();
assert.ok(!(await page.locator(".next-l").innerText()).includes("Défi du jour"), "défi fait : « Que faire maintenant ? » propose autre chose");
await tab("Exercices"); await page.waitForSelector(".fam-grid");
assert.equal(await page.locator(".tab-b.on").innerText(), "🎯\nExercices");
await page.screenshot({ path: `${out}/flow-4-exercices.png` });
await page.locator("text=Apprendre : les fiches").click(); await page.waitForSelector(".learn-item");
assert.match(await page.locator(".tab-b.on").innerText(), /Exercices/, "Apprendre est rangé sous Exercices");
await tab("Créatures"); await page.waitForSelector(".pets");
await tab("Trophées"); await page.waitForSelector(".trophy");
await tab("Boutique"); await page.waitForSelector(".items");
await tab("Accueil"); await page.waitForSelector(".home-hero");
// 4. l'objectif sous la scène lance une série de la bonne famille ; fin de série « Encore 10 additions et Braise évolue ! » + Continuer
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("ccm2:state")); s.fam.add = { ...(s.fam.add || { n: 40, lvl: 1, maxLvl: 1, recent: [] }), xp: 40 }; localStorage.setItem("ccm2:state", JSON.stringify(s));
  const st = JSON.parse(localStorage.getItem("ccm2:settings") || "{}"); st.answer = "input"; localStorage.setItem("ccm2:settings", JSON.stringify(st)); });
await page.reload(); await page.waitForSelector(".splash"); await page.locator(".splash").click(); await page.waitForSelector(".splash", { state: "detached" });
assert.match(await page.locator(".goal-t").innerText(), /Prochaine évolution de Braise : encore 10 additions/);
await page.locator(".goal").click(); await page.waitForSelector(".keypad");
assert.equal(await page.locator(".tabbar").count(), 0, "pas de barre d'onglets pendant une partie");
assert.match(await page.locator(".q-fam").innerText(), /Additions/);
for (let i = 0; i < 80; i++) { // on répond 0 (toujours faux) : Braise ne grandit pas, il reste à 10 bonnes réponses
  if (await page.locator(".result").count()) break;
  if (await page.locator(".wrong-zone").count()) { await tap(".wrong-zone .btn.green"); continue; }
  if (await page.locator(".key-ok").count()) { await page.locator(".key", { hasText: /^0$/ }).click(); await page.locator(".key-ok").click(); }
  await page.waitForTimeout(150);
}
await page.waitForSelector(".near", { timeout: 4000 });
assert.equal(await page.locator(".near-t").innerText(), "Encore 10 additions et Braise évolue !");
await page.screenshot({ path: `${out}/flow-5-near.png` });
await page.locator(".near .btn", { hasText: "Continuer" }).click(); await page.waitForSelector(".keypad");
assert.match(await page.locator(".q-fam").innerText(), /Additions/, "Continuer relance une série de la même famille");
await tap(".icon-btn"); await page.waitForSelector(".home-hero");
// 5. v0.14.1 : calculs à revoir visibles — pastille « 4 » sur l'onglet Exercices, carte en haut de l'écran, série « à revoir »
assert.equal(await page.locator(".tab-badge").count(), 0, "pas de pastille sans calcul à revoir");
const tabFont = await page.locator(".tab-b").first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
assert.ok(tabFont >= 12.5, "libellés des onglets ≈ .8rem : " + tabFont);
await page.evaluate(async () => {
  const { store } = await import("./js/store.js"); const { generate } = await import("./js/generator.js"); const { toKey, addDays } = await import("./js/dates.js");
  store.update((s) => { let n = 0; for (let i = 0; i < 40 && n < 4; i++) { const p = generate("sub", 1); if (s.review[p.key]) continue; s.review[p.key] = { k: p.k, p: p.p, box: 0, due: addDays(toKey(), -1), miss: 1, done: false }; n++; } });
  location.hash = "#/exercices";
});
await page.waitForSelector(".review-card");
assert.equal(await page.locator(".tab-badge").innerText(), "4");
assert.match(await page.locator(".tab-b", { hasText: "Exercices" }).getAttribute("aria-label"), /4 calculs à revoir/);
assert.match(await page.locator(".review-card h2").innerText(), /Calculs à revoir \(4\)/);
await page.screenshot({ path: `${out}/flow-6-a-revoir.png` });
await page.locator(".review-card .btn").click(); await page.waitForSelector(".q-tag");
assert.match(await page.locator(".q-tag").innerText(), /Un calcul à revoir/);
assert.match(await page.locator(".q-fam").innerText(), /Soustractions/);
assert.equal(await page.locator(".pill").first().innerText(), "1 / 4", "une série faite seulement des 4 calculs à revoir");
await tap(".icon-btn"); await page.waitForSelector(".fam-grid");
console.log(errors.length ? "ERREURS : " + errors.join("\n") : "parcours OK, pas d'erreur JS");
await browser.close(); srv.close();
if (errors.length) process.exit(1);
