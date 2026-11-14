// Deux « appareils » (téléphone 384×824 et iMac) qui se synchronisent via une fausse base Firestore : node tools/flow-sync.mjs [dossier-captures]
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
const ID = "b".repeat(64);
const docs = new Map(); let clock = 1; const calls = [];
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,PATCH,OPTIONS" };
async function firestore(route) {
  const req = route.request(), u = new URL(req.url());
  if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
  calls.push(req.method());
  const id = u.pathname.split("/").pop(), d = docs.get(id);
  const json = (status, body) => route.fulfill({ status, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(body) });
  if (req.method() === "GET") return d ? json(200, { fields: { data: { stringValue: d.data } }, updateTime: d.t }) : json(404, { error: { status: "NOT_FOUND", message: "Document \"projects/p/databases/(default)/documents/profils/abc\" not found." } });
  const pre = u.searchParams.get("currentDocument.updateTime"), mustNew = u.searchParams.get("currentDocument.exists") === "false";
  if ((mustNew && d) || (pre && (!d || d.t !== pre))) return json(400, { error: { status: "FAILED_PRECONDITION", message: "p" } });
  docs.set(id, { data: JSON.parse(req.postData()).fields.data.stringValue, t: `2026-11-13T22:30:${String(clock++).padStart(2, "0")}Z` });
  return json(200, {});
}
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
async function device(label, size, fixture) {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2, serviceWorkers: "block" });
  const state = fs.readFileSync(path.join(root, "tests/fixtures", fixture), "utf8");
  await ctx.addInitScript(([st, id]) => { if (!localStorage.getItem("ccm2:profile")) { localStorage.setItem("ccm2:profile", JSON.stringify({ name: "Test", id })); localStorage.setItem("ccm2:state", st); } }, [state, ID]);
  await ctx.route("**/js/firebase-config.js", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: 'export const FIREBASE = { apiKey: "test-key", projectId: "test-proj" };' }));
  await ctx.route("https://firestore.googleapis.com/**", firestore);
  const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://localhost:${srv.address().port}/`); await page.waitForSelector(".home-hero"); await (await page.locator(".splash .btn", { hasText: "Plus tard" }).count() ? page.locator(".splash .btn", { hasText: "Plus tard" }) : page.locator(".splash")).click({ timeout: 2000 }).catch(() => {}); await page.waitForSelector(".splash", { state: "detached" });
  return { page, errors, label };
}
const trophies = (page) => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("ccm2:state")).tro).length);
const phone = await device("téléphone", { width: 384, height: 824 }, "v0.7.0.json");
await phone.page.waitForFunction(() => true); await phone.page.waitForTimeout(1500);
assert.equal(docs.size, 1, "le téléphone a créé la sauvegarde en ligne");
const before = await trophies(phone.page);
const imac = await device("iMac", { width: 1280, height: 800 }, "v0.8.0.json");
await imac.page.waitForTimeout(2000);
const a = JSON.parse(docs.get(ID).data), nTro = Object.keys(a.tro).length;
assert.ok(nTro >= before, "rien de perdu en ligne");
assert.equal(await trophies(imac.page), nTro, "l'iMac a récupéré les trophées du téléphone");
// v0.13 : ce qui arrive de l'autre appareil est annoncé dans UN bandeau en bas (au-dessus des onglets), le nuage passe à ✓
await imac.page.waitForSelector(".news-banner", { timeout: 4000 });
assert.equal(await imac.page.locator(".news-banner").count(), 1, "un seul bandeau");
assert.equal(await imac.page.locator(".toast-item").count(), 0, "plus de pile de messages en haut");
await imac.page.waitForFunction(() => document.querySelector(".pill.cloud") && document.querySelector(".pill.cloud").textContent.includes("✓"), null, { timeout: 4000 });
await imac.page.screenshot({ path: `${out}/sync-imac-banner.png` });
// le téléphone récupère à son tour ce que l'iMac a apporté
await phone.page.evaluate(() => document.dispatchEvent(new Event("visibilitychange"))); // (visible : programme une synchro)
await phone.page.goto(phone.page.url().split("#")[0] + "#/reglages"); await phone.page.waitForSelector("text=Synchronisation");
await phone.page.locator("text=Synchroniser maintenant").click(); await phone.page.waitForSelector("text=Tout est à jour", { timeout: 4000 });
assert.equal(await trophies(phone.page), nTro, "le téléphone a aussi tout");
await phone.page.screenshot({ path: `${out}/sync-reglages.png` });
// v0.14.1 : double dépense — les deux appareils achètent en même temps avec les mêmes étoiles : rien n'est retiré, solde 0, explication
const syncNow = (p) => p.evaluate(async () => { const { runSync } = await import("./js/syncer.js"); await runSync(); });
await syncNow(phone.page); await syncNow(imac.page); await syncNow(phone.page); // les deux appareils et la copie en ligne sont identiques
// solde exactement 20 ⭐ partout (le compteur d'étoiles fusionne au maximum : on le règle aussi dans la copie en ligne)
const V = await phone.page.evaluate(async () => { const { store } = await import("./js/store.js"); const shop = await import("./js/shop.js"); return store.state.c.stars - (shop.balance(store.state) - 20); });
for (const p of [phone.page, imac.page]) await p.evaluate(async (v) => { const { store } = await import("./js/store.js"); store.update((s) => { s.c.stars = v; }); }, V);
{ const d = docs.get(ID), o = JSON.parse(d.data); o.c.stars = V; d.data = JSON.stringify(o); }
const prep = await phone.page.evaluate(async () => {
  const { store } = await import("./js/store.js"); const shop = await import("./js/shop.js"); const { DECOR } = await import("./js/decor.js");
  const free = DECOR.filter((d) => d.price > 0 && !shop.hasDecor(store.state, d.id)).sort((a, b) => b.price - a.price);
  const a = free.find((d) => d.price <= 20 && d.price > 10), b = free.find((d) => d !== a && d.price <= 20 && d.price > 20 - a.price);
  return { a: a.id, b: b.id };
});
const bal = (p) => p.evaluate(async () => { const { store } = await import("./js/store.js"); const shop = await import("./js/shop.js"); return shop.balance(store.state); });
assert.equal(await bal(phone.page), 20); assert.equal(await bal(imac.page), 20, "même solde sur les deux appareils");
const buy = (p, id) => p.evaluate(async (id) => { const { store } = await import("./js/store.js"); const shop = await import("./js/shop.js"); let r; store.update((s) => { r = shop.buyDecor(s, id, "2026-11-14"); }); return r.ok; }, id);
assert.ok(await buy(phone.page, prep.a)); assert.ok(await buy(imac.page, prep.b), "chacun peut acheter avec ses 20 ⭐");
await phone.page.evaluate(async () => { const { runSync } = await import("./js/syncer.js"); await runSync(); });
await imac.page.goto(imac.page.url().split("#")[0] + "#/boutique"); await imac.page.waitForSelector(".items"); await imac.page.locator(".news-banner:not(.out) .nb-x").click().catch(() => {});
await imac.page.evaluate(async () => { const { runSync } = await import("./js/syncer.js"); await runSync(); });
await imac.page.waitForSelector(".news-banner:not(.out)", { timeout: 4000 });
assert.match(await imac.page.locator(".news-banner:not(.out)").innerText(), /Tes deux appareils ont fait des achats en même temps : ton solde repart de 0, tu gardes tout ce que tu as acheté\./);
await imac.page.screenshot({ path: `${out}/sync-double-depense.png` });
const owned = await imac.page.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")).decor.owned);
assert.ok(owned[prep.a] && owned[prep.b], "les deux achats restent");
assert.equal(await bal(imac.page), 0, "solde 0, jamais négatif");
await imac.page.locator(".news-banner:not(.out) .nb-x").click(); await imac.page.waitForTimeout(400);
await imac.page.evaluate(async () => { const { runSync } = await import("./js/syncer.js"); await runSync(); });
await imac.page.waitForTimeout(300);
assert.equal(await imac.page.locator(".news-banner:not(.out)").count(), 0, "expliqué une seule fois");
// v0.15 : une photo de course faite sur le téléphone arrive dans le carnet de l'iMac (union, rien ne se perd)
const rk = await phone.page.evaluate(async () => { const { store } = await import("./js/store.js"); const { addRunPhoto } = await import("./js/course.js"); let k; store.update((s) => { k = addRunPhoto(s, { c: "add", st: 1, bg: "bg_prairie", ok: 8, n: 10, fam: "mix" }, new Date(2026, 10, 14, 17, 5)); }); return k; });
await syncNow(phone.page); await syncNow(imac.page);
assert.ok(await imac.page.evaluate((k) => !!JSON.parse(localStorage.getItem("ccm2:state")).run[k], rk), "la photo de course est sur l'iMac");
console.log("appels Firestore :", calls.join(" "));
const errors = [...phone.errors, ...imac.errors];
console.log(errors.length ? "ERREURS : " + errors.join("\n") : "synchro entre deux appareils OK, pas d'erreur JS");
await browser.close(); srv.close(); if (errors.length) process.exit(1);
