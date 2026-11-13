// Captures de contrôle de la scène et de la boutique de décors : node tools/decor-shot.mjs [dossier] [heure]
// Téléphone (384×824) et bureau (1200×800) : ouverture, accueil, boutique, album ; plus une planche de tous les fonds (jour/soir/nuit).
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = path.resolve(new URL("..", import.meta.url).pathname), out = process.argv[2] || "/tmp", hour = Number(process.argv[3] || 14);
fs.mkdirSync(out, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".json": "application/json" };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res); }).listen(0);
const url = `http://localhost:${srv.address().port}/`;
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const errors = [];
const STATE = { v: 1, c: { stars: 60, streakBest: 3 }, fam: { add: { xp: 400, n: 300, lvl: 3, maxLvl: 3, recent: [] }, sub: { xp: 160, n: 90, lvl: 2, maxLvl: 2, recent: [] }, comp: { xp: 60, n: 40, lvl: 2, maxLvl: 2, recent: [] }, trick: { xp: 12, n: 10, lvl: 1, maxLvl: 1, recent: [] } },
  days: {}, tro: {}, cre: { add: { s: 4, d: {} }, sub: { s: 3, d: {} }, comp: { s: 2, d: {} }, trick: { s: 1, d: {} } }, learn: {}, review: {}, daily: {}, rec: {}, m: { done: [], active: [] },
  shop: { owned: { cap: "2026-11-01", crown: "2026-11-02" }, worn: { add: { head: { id: "crown", t: 5 } } } },
  decor: { owned: { bg_lac: "2026-11-14", wx_neige: "2026-11-14", fx_etincelles: "2026-11-14", pet_papillons: "2026-11-14", bg_nuit: "2026-11-14", wx_lucioles: "2026-11-14" },
    pick: { add: { bg: { id: "bg_lac", t: 9 }, wx: { id: "wx_neige", t: 9 }, fx: { id: "fx_etincelles", t: 9 }, pet: { id: "pet_papillons", t: 9 }, st: { id: 3, t: 9 } }, sub: { bg: { id: "bg_nuit", t: 9 }, wx: { id: "wx_lucioles", t: 9 } } } } };
for (const [label, w, h] of [["phone", 384, 824], ["desk", 1200, 800]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, serviceWorkers: "block", reducedMotion: "reduce" });
  await ctx.addInitScript((H) => { Date.prototype.getHours = function () { return H; }; }, hour);
  const page = await ctx.newPage(); page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(url);
  await page.evaluate((st) => { localStorage.setItem("ccm2:state", JSON.stringify(st)); localStorage.setItem("ccm2:profile", JSON.stringify({ name: "Test", id: null })); }, STATE);
  await page.reload(); await page.waitForSelector(".splash"); await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/decor-${label}-splash.png` });
  if (await page.locator(".splash .btn", { hasText: "Plus tard" }).count()) await page.locator(".splash .btn", { hasText: "Plus tard" }).click(); else await page.locator(".splash").click();
  await page.waitForSelector(".splash", { state: "detached" }); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/decor-${label}-home.png` });
  await page.goto(url + "#/boutique"); await page.waitForSelector(".items"); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/decor-${label}-boutique.png`, fullPage: true });
  await page.locator(".seg-b", { hasText: "Effets" }).click(); await page.locator(".item-ic[role=button]").first().click(); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/decor-${label}-boutique-essai.png` });
  await page.goto(url + "#/album"); await page.waitForSelector(".pets"); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/decor-${label}-album.png`, fullPage: true });
  await ctx.close();
}
// Planche : chaque fond au jour, au soir et la nuit, avec un élément de chaque type.
{
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 2000 }, deviceScaleFactor: 1, serviceWorkers: "block", reducedMotion: "reduce" });
  const page = await ctx.newPage(); page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url); await page.waitForTimeout(400);
  await page.evaluate(async () => {
    const { sceneEl } = await import("./js/ui/scene.js"); const { DECOR } = await import("./js/decor.js");
    const bgs = DECOR.filter((d) => d.kind === "bg").map((d) => d.id), wx = DECOR.filter((d) => d.kind === "wx").map((d) => d.id), fx = DECOR.filter((d) => d.kind === "fx").map((d) => d.id), pet = DECOR.filter((d) => d.kind === "pet").map((d) => d.id);
    const ids = ["add", "sub", "mul", "dbl", "frac", "comp", "div", "trick"];
    const grid = document.createElement("div"); grid.style.cssText = "display:grid;grid-template-columns:repeat(3,340px);gap:10px;padding:10px;background:#16316b";
    bgs.forEach((bg, i) => [8.5, 19, 23].forEach((hr, j) => grid.append(sceneEl({ id: ids[i], stage: 1 + ((i + j) % 4), pick: { bg, wx: wx[(i + j) % wx.length], fx: fx[(i + j) % fx.length], pet: pet[(i + j) % pet.length] }, variant: "home", hour: hr }))));
    document.body.replaceChildren(grid);
  });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete)); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/decor-planche.png`, fullPage: true });
  await ctx.close();
}
console.log(errors.length ? errors.join("\n") : "pas d'erreur JS");
await browser.close(); srv.close();
