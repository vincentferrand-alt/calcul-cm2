// Captures de contrôle (v0.13) : téléphone 384×824 et bureau 1200×800 / 1600×1000, heure fixée (jour 10 h et soir 19 h).
// node tools/capture.mjs [dossier] [fixture] — la sauvegarde de référence (tests/fixtures) est chargée avec un prénom de test.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = path.resolve(new URL("..", import.meta.url).pathname), out = process.argv[2] || "/tmp/shots", fixture = process.argv[3] || "v0.12.1.json";
fs.mkdirSync(out, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".json": "application/json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(0);
const url = `http://localhost:${srv.address().port}/`;
const state = fs.readFileSync(path.join(root, "tests/fixtures", fixture), "utf8");
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const errors = [];
const SIZES = [["phone", 384, 824], ["desk", 1200, 800], ["wide", 1600, 1000]];
const TIMES = [["jour", "2026-11-14T10:00:00"], ["soir", "2026-11-14T19:00:00"]];
const SCREENS = (process.env.SCREENS || "home,exercices,album,boutique,trophees").split(",");
for (const [label, w, hh] of SIZES) for (const [tl, time] of TIMES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: hh }, deviceScaleFactor: label === "phone" ? 2 : 1, serviceWorkers: "block" });
  await ctx.addInitScript(([st]) => { if (!localStorage.getItem("ccm2:profile")) { localStorage.setItem("ccm2:profile", JSON.stringify({ name: "Test", id: null })); localStorage.setItem("ccm2:state", st); localStorage.setItem("ccm2:settings", JSON.stringify({ companion: "add" })); } }, [state]);
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(time) });
  page.on("pageerror", (e) => errors.push(`${label}/${tl}: ${e.message}`));
  await page.goto(url);
  await page.waitForTimeout(500);
  if (label === "phone") await page.screenshot({ path: `${out}/${label}-${tl}-splash.png` });
  const plusTard = page.locator(".splash .btn", { hasText: "Plus tard" });
  if (await plusTard.count()) await plusTard.click(); else if (await page.locator(".splash").count()) await page.locator(".splash").click();
  await page.waitForTimeout(700);
  for (const sc of SCREENS) {
    await page.evaluate((h) => { location.hash = h; }, sc === "home" ? "#/" : "#/" + sc);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${label}-${tl}-${sc}.png` });
  }
  await ctx.close();
}
console.log(errors.length ? "ERREURS :\n" + errors.join("\n") : "captures OK, pas d'erreur JS");
await browser.close(); srv.close();
if (errors.length) process.exit(1);
