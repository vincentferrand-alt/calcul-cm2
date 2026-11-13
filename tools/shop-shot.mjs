// Captures de l'écran d'ouverture, de la boutique et de l'accueil habillé : node tools/shop-shot.mjs [dossier]
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = path.resolve(new URL("..", import.meta.url).pathname), out = process.argv[2] || "/tmp";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".json": "application/json" };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res); }).listen(0);
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const errors = [];
for (const [label, w, h] of [["phone", 384, 824], ["desk", 1200, 800]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, serviceWorkers: "block" });
  const page = await ctx.newPage(); page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://localhost:${srv.address().port}/`);
  await page.evaluate(() => {
    const st = { v: 1, c: { stars: 40, streakBest: 3 }, fam: { add: { xp: 160, n: 90, lvl: 2, maxLvl: 2, recent: [] }, sub: { xp: 55, n: 30, lvl: 1, maxLvl: 1, recent: [] }, trick: { xp: 12, n: 10, lvl: 1, maxLvl: 1, recent: [] } },
      days: {}, tro: {}, cre: { add: { s: 3, d: {} }, sub: { s: 2, d: {} }, trick: { s: 1, d: {} } }, learn: {}, review: {}, daily: {}, rec: {}, m: { done: [], active: [] },
      shop: { owned: { cap: "2026-11-01", crown: "2026-11-02", shades: "2026-11-02" }, worn: { add: { head: { id: "crown", t: 5 }, face: { id: "shades", t: 5 } } } } };
    localStorage.setItem("ccm2:state", JSON.stringify(st)); localStorage.setItem("ccm2:profile", JSON.stringify({ name: "Test", id: null }));
  });
  await page.reload(); await page.waitForSelector(".splash"); await page.waitForTimeout(1300);
  await page.screenshot({ path: `${out}/shop-${label}-splash.png` });
  await page.locator(".splash").click(); await page.waitForSelector(".splash", { state: "detached" }); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/shop-${label}-home.png` });
  await page.goto(`http://localhost:${srv.address().port}/#/boutique`); await page.waitForSelector(".items"); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/shop-${label}-boutique.png`, fullPage: true });
  await ctx.close();
}
console.log(errors.length ? errors.join("\n") : "pas d'erreur JS");
await browser.close(); srv.close();
