// Joue une partie scriptée et prend des captures : node tools/play-shot.mjs <largeur> <hauteur> <préfixe>
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const [, , w = "384", hh = "824", pre = "/tmp/play"] = process.argv;
const root = path.resolve(new URL("..", import.meta.url).pathname);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".json": "application/json" };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res); }).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +hh }, deviceScaleFactor: 2, serviceWorkers: "block", hasTouch: +w < 700 });
const page = await ctx.newPage(); const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message)); page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
await page.goto(`http://localhost:${port}/`); await page.waitForTimeout(400);
await page.evaluate(() => { location.hash = "#/exercices"; }); await page.waitForTimeout(300); // v0.17 : onglet « Jouer »
await page.click("text=Je tape"); await page.click("text=Additions"); await page.waitForTimeout(500);
await page.screenshot({ path: pre + "-input.png" });
// réponse fausse volontaire
await page.keyboard.type("1"); await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
await page.screenshot({ path: pre + "-wrong.png" });
await page.click("text=J'ai compris"); await page.waitForTimeout(300);
await page.evaluate(() => { location.hash = "#/exercices"; }).catch(() => {});
console.log(errors.length ? errors.join("\n") : "pas d'erreur JS");
// QCM + fin de série en jouant les bonnes réponses via le DOM
await page.goto(`http://localhost:${port}/#/exercices`); await page.waitForTimeout(300);
await page.click("text=4 choix"); await page.click("text=Multiplications"); await page.waitForTimeout(500);
await page.screenshot({ path: pre + "-qcm.png" });
await browser.close(); srv.close();
