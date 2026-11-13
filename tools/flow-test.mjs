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
await page.reload(); await page.waitForSelector(".splash"); await page.locator(".splash").click(); await page.waitForSelector(".splash", { state: "detached" }); await page.waitForSelector(".home-hero");
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
// 3. exercices : la flèche de retour
await tap("text=Exercices"); await page.waitForSelector(".fam-grid");
await page.screenshot({ path: `${out}/flow-4-exercices.png` });
await tap(".icon-btn"); await page.waitForSelector(".home-hero");
console.log(errors.length ? "ERREURS : " + errors.join("\n") : "parcours OK, pas d'erreur JS");
await browser.close(); srv.close();
if (errors.length) process.exit(1);
