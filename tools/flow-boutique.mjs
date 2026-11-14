// Parcours v0.16 « Boutique agrandie » dans un vrai navigateur, heure fixée : achat d'un objet de chaque nouveau rayon, essai gratuit,
// deux objets posés, collection complétée → badge + trophée, saison simulée (décembre puis février), cadre visible dans le carnet ;
// puis captures de la boutique et de l'accueil (384×824, 1200×800, 1600×1000 ; jour, soir ; animations réduites).
// node tools/flow-boutique.mjs [dossier-captures]
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import assert from "node:assert/strict";
const root = path.resolve(new URL("..", import.meta.url).pathname), out = process.argv[2] || "/tmp";
fs.mkdirSync(out, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".json": "application/json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(0);
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const errors = [];
const START = JSON.stringify({ v: 1, c: { stars: 400 }, fam: { add: { xp: 60, n: 70, lvl: 2, maxLvl: 2, recent: [] }, sub: { xp: 12, n: 15, lvl: 1, maxLvl: 1, recent: [] } },
  cre: { add: { s: 2, d: {} }, sub: { s: 1, d: {} } }, eve: { "2026-11-12": { ok: true, n: 1, c: "add", st: 2, bg: "bg_lac", q: "12 + 9", a: 21, eq: true } },
  decor: { owned: { bg_banquise: "2026-11-01", wx_neige: "2026-11-01", fx_aura: "2026-11-01" }, pick: {} } });
async function open(size, time, state, motion = "auto", hash = "") {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: size.width < 500 ? 2 : 1, serviceWorkers: "block" });
  await ctx.addInitScript(([st, motion]) => { if (!localStorage.getItem("ccm2:profile")) {
    localStorage.setItem("ccm2:profile", JSON.stringify({ name: "Test", id: null })); localStorage.setItem("ccm2:state", st);
    localStorage.setItem("ccm2:settings", JSON.stringify({ companion: "add", motion }));
  } }, [state, motion]);
  const page = await ctx.newPage(); page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install({ time: new Date(time) });
  await page.goto(`http://localhost:${srv.address().port}/${hash}`);
  if (!hash) {
    await page.waitForSelector(".splash");
    if (await page.locator(".splash .btn", { hasText: "Plus tard" }).count()) await page.locator(".splash .btn", { hasText: "Plus tard" }).click(); else await page.locator(".splash-hello").click();
    await page.waitForSelector(".splash", { state: "detached" });
  }
  await page.waitForTimeout(300);
  return page;
}
const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")));
const stars = async (page) => Number((await page.locator(".big-pill").innerText()).replace(/\D/g, ""));
const tab = async (page, name) => { await page.locator(".seg.kinds .seg-b", { hasText: name }).click(); await page.waitForTimeout(80); };
const item = (page, name) => page.locator(".item", { has: page.locator(".item-name", { hasText: name }) });
const buy = async (page, name) => { await item(page, name).locator(".btn", { hasText: "Acheter" }).click(); await page.waitForTimeout(120); };

// ---------- téléphone, en décembre (saison de Noël) ----------
const page = await open({ width: 384, height: 824 }, "2026-12-10T10:00:00", START);
await page.locator(".tab-b", { hasText: "Boutique" }).click(); await page.waitForSelector(".items");
assert.equal(await page.locator(".seg.kinds .seg-b").count(), 10, "10 onglets");
const rows = await page.locator(".seg.kinds .seg-b").evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))).size);
assert.equal(rows, 2, "onglets sur 2 rangées");
const over = await page.locator(".seg.kinds .seg-b").evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
assert.deepEqual(over, [], "aucun libellé d'onglet ne déborde sur 384 px");
// 1. Ciel : essai gratuit, puis achat
const s0 = await stars(page);
await tab(page, "Ciel"); await item(page, "Aurore boréale").locator(".item-ic").click();
assert.equal(await page.locator(".shop-card .sky-aurore").count(), 1, "essai gratuit dans l'aperçu");
assert.equal(await stars(page), s0, "l'essai ne coûte rien");
await page.clock.runFor(9000); await page.waitForTimeout(250); await page.screenshot({ path: `${out}/boutique-1-essai-ciel.png` });
await buy(page, "Grande lune dorée");
assert.equal(await page.locator(".shop-card .sky-lune").count(), 1); assert.equal(await stars(page), s0 - 40);
// 2. Objets : deux emplacements
await tab(page, "Objets");
await buy(page, "Lanterne");
await page.locator(".slot-b", { hasText: "À droite" }).click(); await buy(page, "Banc de bois");
assert.equal(await page.locator(".shop-card .sc-obj.o-left.obj-lanterne").count(), 1); assert.equal(await page.locator(".shop-card .sc-obj.o-right.obj-banc").count(), 1);
let st = await state(page); assert.equal(st.decor.pick.add.o1.id, "obj_lanterne"); assert.equal(st.decor.pick.add.o2.id, "obj_banc");
await page.clock.runFor(9000); await page.waitForTimeout(250); await page.screenshot({ path: `${out}/boutique-2-objets.png` });
// 3. Saison (décembre) : Noël en vente ; les autres « Revient en … »
await tab(page, "Saison");
assert.match(await item(page, "Halloween douce").innerText(), /Revient en octobre/);
assert.equal(await item(page, "Halloween douce").locator(".btn", { hasText: "Acheter" }).count(), 0);
await buy(page, "Noël");
assert.equal(await page.locator(".shop-card .scene.bg-season_noel, .shop-card .scene[data-bg=season_noel]").count(), 1, "le fond de Noël est choisi");
await page.clock.runFor(9000); await page.waitForTimeout(250); await page.screenshot({ path: `${out}/boutique-3-saison-decembre.png` });
// 4. Cadres : achat → aperçu de carte du carnet avec le cadre
await tab(page, "Cadres"); await buy(page, "Cadre étoilé");
assert.equal(await page.locator(".shop-card .dream.frame-etoiles").count(), 1);
await page.clock.runFor(9000); await page.waitForTimeout(250); await page.screenshot({ path: `${out}/boutique-4-cadre.png` });
// 5. Collections : Hiver à 3/4 → la chouette → collection complète, badge et trophée
await tab(page, "Collections");
assert.match(await page.locator(".col-card", { hasText: "Hiver" }).innerText(), /3 \/ 4/);
await page.locator(".col-card", { hasText: "Hiver" }).locator(".col-it.miss").click();
assert.equal(await page.locator(".seg.kinds .seg-b.on").innerText().then((t) => t.includes("Animaux")), true, "la vignette mène au bon rayon, en essai");
await buy(page, "Chouette");
await page.waitForSelector(".toast-item:has-text('Collection « Hiver » complète')");
await tab(page, "Collections");
assert.match(await page.locator(".col-card.done", { hasText: "Hiver" }).innerText(), /Complète/);
assert.equal(await page.locator(".shop-col-badges .col-badge", { hasText: "Hiver" }).count(), 1, "petit badge");
st = await state(page); assert.ok(st.tro["t_collec:1"], "trophée Collectionneur");
await page.clock.runFor(9000); await page.waitForTimeout(250); await page.screenshot({ path: `${out}/boutique-5-collections.png` });
// 6. accueil : ciel + objets autour de la créature ; carnet : cadre visible
await page.locator(".tab-b", { hasText: "Accueil" }).click(); await page.waitForSelector(".home-hero");
assert.equal(await page.locator(".home .sky-lune").count(), 1); assert.equal(await page.locator(".home .sc-obj").count(), 2);
await page.waitForTimeout(300); await page.clock.runFor(9000); await page.waitForTimeout(250); await page.screenshot({ path: `${out}/boutique-6-accueil.png` });
await page.evaluate(() => { location.hash = "#/carnet"; }); await page.waitForSelector(".dream");
assert.equal(await page.locator(".dream.frame-etoiles").count(), 1, "le cadre est appliqué aux cartes du carnet");
await page.waitForTimeout(400); await page.clock.runFor(9000); await page.waitForTimeout(250); await page.screenshot({ path: `${out}/boutique-7-carnet-cadre.png` });
const saved = JSON.stringify(await state(page));
assert.ok(JSON.parse(saved).decor.owned.season_noel);

// ---------- février : hors saison, Noël reste à elle et utilisable ----------
const feb = await open({ width: 384, height: 824 }, "2027-02-10T10:00:00", saved, "auto", "#/boutique");
await feb.waitForSelector(".items"); await tab(feb, "Saison");
for (const [n, m] of [["Halloween douce", "octobre"], ["Printemps", "mars"], ["Été", "juin"]]) {
  assert.match(await item(feb, n).innerText(), new RegExp("Revient en " + m)); assert.equal(await item(feb, n).locator(".btn", { hasText: "Acheter" }).count(), 0);
}
assert.equal(await item(feb, "Noël").locator(".item-note", { hasText: "Choisi" }).count(), 1, "Noël acheté en décembre : toujours là en février");
await item(feb, "Printemps").locator(".item-ic").click(); assert.match(await feb.locator(".try-note").innerText(), /Revient en mars/, "essai possible hors saison, sans achat");
await feb.waitForTimeout(300); await feb.clock.runFor(9000); await feb.waitForTimeout(250); await feb.screenshot({ path: `${out}/boutique-8-saison-fevrier.png` });
await tab(feb, "Fonds"); await item(feb, "Lac").locator(".item-ic").click(); await feb.locator(".try-note .btn").click(); await feb.waitForTimeout(150);
await tab(feb, "Saison"); await item(feb, "Noël").locator(".btn", { hasText: "Choisir" }).click();
assert.equal((await state(feb)).decor.pick.add.bg.id, "season_noel", "Noël choisi de nouveau en février");

// ---------- captures : boutique et accueil avec ciel + objets ----------
const SIZES = [["phone", 384, 824], ["desk", 1200, 800], ["wide", 1600, 1000]], TIMES = [["jour", "2026-12-10T10:00:00"], ["soir", "2026-12-10T19:30:00"]];
const cur = JSON.stringify(await state(feb));
for (const [label, w, hh] of SIZES) for (const [tl, time] of TIMES) {
  const p = await open({ width: w, height: hh }, time, cur);
  await p.waitForTimeout(500); await p.screenshot({ path: `${out}/b16-${label}-${tl}-accueil.png` });
  await p.locator(".tab-b", { hasText: "Boutique" }).click(); await p.waitForSelector(".items"); await tab(p, "Objets"); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/b16-${label}-${tl}-boutique.png` });
  const wide = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); assert.equal(wide, false, "rien ne déborde : " + label);
  await p.context().close();
}
const calm = await open({ width: 384, height: 824 }, "2026-12-10T19:30:00", cur, "off");
assert.ok(await calm.evaluate(() => document.documentElement.classList.contains("calm")));
await calm.waitForTimeout(300); await calm.screenshot({ path: `${out}/b16-calme-accueil.png` });
await calm.locator(".tab-b", { hasText: "Boutique" }).click(); await calm.waitForSelector(".items"); await tab(calm, "Ciel");
assert.equal(await calm.locator(".motion-note").count(), 1, "animations réduites : explication");
await calm.screenshot({ path: `${out}/b16-calme-boutique.png` });

console.log(errors.length ? "ERREURS : " + errors.join("\n") : "parcours de la boutique OK, pas d'erreur JS");
await browser.close(); srv.close(); if (errors.length) process.exit(1);
