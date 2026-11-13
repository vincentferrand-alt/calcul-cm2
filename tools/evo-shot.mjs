// Captures de la v0.12 : transformation animée (plusieurs instants), énigme du soir (ouverture et accueil), créatures en images.
// node tools/evo-shot.mjs [dossier]
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = path.resolve(new URL("..", import.meta.url).pathname), out = process.argv[2] || "/tmp";
fs.mkdirSync(out, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".json": "application/json" };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res); }).listen(0);
const url = `http://localhost:${srv.address().port}/`;
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const errors = [];
const STATE = { v: 1, c: { stars: 30 }, fam: { add: { xp: 400, n: 300, lvl: 3, maxLvl: 3, recent: [] }, frac: { xp: 160, n: 90, lvl: 2, maxLvl: 2, recent: [] }, trick: { xp: 400, n: 300, lvl: 3, maxLvl: 3, recent: [] } },
  days: {}, tro: {}, cre: { add: { s: 4, d: {} }, frac: { s: 3, d: {} }, trick: { s: 4, d: {} } }, learn: {}, review: {}, daily: {}, rec: {}, m: { done: [], active: [] },
  decor: { owned: { bg_montagne: "d", wx_neige: "d", fx_aura: "d" }, pick: { trick: { bg: { id: "bg_montagne", t: 1 }, wx: { id: "wx_neige", t: 1 } }, add: { fx: { id: "fx_aura", t: 1 } } } } };
async function ctxAt(w, h, hour, reduced = false) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, serviceWorkers: "block", reducedMotion: reduced ? "reduce" : "no-preference" });
  await ctx.addInitScript((H) => { Date.prototype.getHours = function () { return H; }; }, hour);
  const page = await ctx.newPage(); page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  await page.goto(url);
  await page.evaluate((st) => { localStorage.setItem("ccm2:state", JSON.stringify(st)); localStorage.setItem("ccm2:profile", JSON.stringify({ name: "Test", id: null })); localStorage.setItem("ccm2:settings", JSON.stringify({ companion: "trick" })); }, STATE);
  return { ctx, page };
}
for (const [label, w, h] of [["phone", 384, 824], ["desk", 1200, 800]]) {
  // Énigme du soir à l'ouverture (19 h)
  let { ctx, page } = await ctxAt(w, h, 19, true);
  await page.reload(); await page.waitForSelector(".splash.has-riddle"); await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/v12-${label}-soir-ouverture.png` });
  await page.locator(".splash .btn", { hasText: "Voir l'énigme" }).click(); await page.waitForSelector(".riddle"); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/v12-${label}-soir-enigme.png` });
  const wrong = await page.evaluate(() => { const r = document.querySelector(".riddle"); return [...r.querySelectorAll(".choice")].map((b) => b.dataset.v); });
  await page.locator(".riddle .choice").first().click(); await page.waitForTimeout(400);
  if (!(await page.locator(".riddle-end .btn").count())) { await page.locator(".riddle .choice:not(.soft)").first().click(); await page.waitForTimeout(400); }
  if (!(await page.locator(".riddle-end .btn").count())) { await page.locator(".riddle .choice:not(.soft)").first().click(); await page.waitForTimeout(400); }
  await page.screenshot({ path: `${out}/v12-${label}-soir-fin.png` });
  await page.locator(".riddle-end .btn").click(); await page.waitForSelector(".splash", { state: "detached" }); await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/v12-${label}-soir-accueil.png` });
  const eve = await page.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")).eve);
  if (!eve || Object.keys(eve).length !== 1) errors.push("énigme non enregistrée");
  await ctx.close();
  // Accueil de jour, boutique, album avec les images
  ({ ctx, page } = await ctxAt(w, h, 14, true));
  await page.goto(url + "#/album"); await page.reload(); await page.waitForSelector(".pets"); await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/v12-${label}-album.png` });
  await page.goto(url + "#/boutique"); await page.waitForSelector(".items"); await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/v12-${label}-boutique.png` });
  await ctx.close();
  // Transformation animée (depuis l'album : « Revoir l'évolution »)
  ({ ctx, page } = await ctxAt(w, h, 14, false));
  await page.goto(url + "#/album"); await page.reload(); await page.waitForSelector(".pet-replay"); await page.waitForTimeout(500);
  await page.locator(".pet-replay").first().click();
  for (const t of [600, 1250, 1600, 2700]) { await page.waitForTimeout(t === 600 ? 600 : t - [600, 1250, 1600, 2700][[600, 1250, 1600, 2700].indexOf(t) - 1]); await page.screenshot({ path: `${out}/v12-${label}-evo-${t}.png` }); }
  await page.locator(".evo-btn").click(); await page.waitForSelector(".evo", { state: "detached" });
  await ctx.close();
}
// Fusion avec images manquantes : le dessin SVG de secours s'affiche
{
  const { ctx, page } = await ctxAt(384, 824, 14, true);
  await page.route(/assets\/creatures\/add-4\.webp/, (r) => r.abort());
  await page.goto(url + "#/album"); await page.reload(); await page.waitForSelector(".pets"); await page.waitForTimeout(800);
  const fb = await page.evaluate(() => document.querySelectorAll(".pet .creature-art:not(.img) svg").length);
  if (fb < 1) errors.push("pas de secours SVG quand l'image manque");
  await page.screenshot({ path: `${out}/v12-phone-secours-svg.png` });
  await ctx.close();
}
console.log(errors.length ? errors.join("\n") : "pas d'erreur JS");
await browser.close(); srv.close();
