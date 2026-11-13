// Capture d'écran locale pour vérifier l'affichage : node tools/shot.mjs <hash> <largeur> <hauteur> <sortie.png> [script-js-à-exécuter]
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const [, , hash = "", w = "384", hh = "824", out = "/tmp/shot.png", script = ""] = process.argv;
const root = path.resolve(new URL("..", import.meta.url).pathname);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".json": "application/json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +hh }, deviceScaleFactor: 2, serviceWorkers: "block" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
await page.goto(`http://localhost:${port}/${hash ? "#" + hash : ""}`);
await page.waitForTimeout(600);
if (script) { await page.evaluate(script); await page.waitForTimeout(500); }
await page.screenshot({ path: out });
console.log(errors.length ? errors.join("\n") : "pas d'erreur JS");
await browser.close(); srv.close();
