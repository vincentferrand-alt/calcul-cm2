import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const [, , w = "384", hh = "824", out = "/tmp/result.png"] = process.argv;
const root = path.resolve(new URL("..", import.meta.url).pathname);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res); }).listen(0);
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: +w, height: +hh }, deviceScaleFactor: 2, serviceWorkers: "block" })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => { if (!localStorage.getItem("ccm2:profile")) localStorage.setItem("ccm2:profile", JSON.stringify({ name: "Camille", id: null })); });
await page.goto(`http://localhost:${srv.address().port}/#/exercices`); await page.waitForTimeout(300);
await page.click("text=4 choix"); await page.click("text=Mélange"); await page.waitForTimeout(400);
for (let i = 0; i < 60; i++) {
  if (await page.locator(".result").count()) break;
  if (await page.locator(".wrong-zone .btn").count()) { await page.click(".wrong-zone .btn"); await page.waitForTimeout(80); continue; }
  const c = page.locator(".choice"); if (await c.count()) { await c.nth(i % 4).click({ timeout: 800 }).catch(() => {}); }
  await page.waitForTimeout(1000);
}
await page.waitForTimeout(1500);
await page.screenshot({ path: out });
console.log(errors.length ? errors.join("\n") : "pas d'erreur JS", "| résultat affiché :", await page.locator(".result").count() > 0);
console.log(await page.evaluate(() => JSON.stringify(Object.keys(localStorage))));
await browser.close(); srv.close();
