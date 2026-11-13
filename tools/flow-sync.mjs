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
  if (req.method() === "GET") return d ? json(200, { fields: { data: { stringValue: d.data } }, updateTime: d.t }) : json(404, { error: { status: "NOT_FOUND", message: "not found" } });
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
  await page.goto(`http://localhost:${srv.address().port}/`); await page.waitForSelector(".home-hero");
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
// le téléphone récupère à son tour ce que l'iMac a apporté
await phone.page.evaluate(() => document.dispatchEvent(new Event("visibilitychange"))); // (visible : programme une synchro)
await phone.page.goto(phone.page.url().split("#")[0] + "#/reglages"); await phone.page.waitForSelector("text=Synchronisation");
await phone.page.locator("text=Synchroniser maintenant").click(); await phone.page.waitForSelector("text=Tout est à jour", { timeout: 4000 });
assert.equal(await trophies(phone.page), nTro, "le téléphone a aussi tout");
await phone.page.screenshot({ path: `${out}/sync-reglages.png` });
console.log("appels Firestore :", calls.join(" "));
const errors = [...phone.errors, ...imac.errors];
console.log(errors.length ? "ERREURS : " + errors.join("\n") : "synchro entre deux appareils OK, pas d'erreur JS");
await browser.close(); srv.close(); if (errors.length) process.exit(1);
