// node tools/nav-shot.mjs <hash> <w> <h> <out> [js à exécuter avant la capture]
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const [, , hash = "", w = "384", hh = "824", out = "/tmp/nav.png", js = ""] = process.argv;
const root = path.resolve(new URL("..", import.meta.url).pathname);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res); }).listen(0);
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: +w, height: +hh }, deviceScaleFactor: 2, serviceWorkers: "block" })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(`http://localhost:${srv.address().port}/#${hash}`); await page.waitForTimeout(500);
if (js) { const steps = js.split("||"); for (const st of steps) { await page.evaluate(st); await page.waitForTimeout(450); } }
await page.screenshot({ path: out });
console.log(errors.length ? errors.join("\n") : "pas d'erreur JS");
await browser.close(); srv.close();
