// Parcours v0.15 « La course des réponses » dans un vrai navigateur, heure fixée : téléphone 384×824 (jour) et iMac 1200×800 (soir),
// puis animations réduites. node tools/flow-course.mjs [dossier-captures]
// L'horloge de la page est simulée (page.clock) : requestAnimationFrame avance avec clock.runFor, la course se joue donc vite.
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
const STATE = { v: 1, c: { stars: 40 }, fam: { add: { xp: 60, n: 70, lvl: 2, maxLvl: 2, recent: [] }, sub: { xp: 12, n: 15, lvl: 1, maxLvl: 1, recent: [] } }, cre: { add: { s: 2, d: {} }, sub: { s: 1, d: {} } },
  eve: { "2026-11-12": { ok: true, n: 1, c: "add", st: 2, bg: "bg_lac", q: "12 + 9", a: 21, eq: true } },
  decor: { owned: { bg_lac: "2026-11-10", wx_feuilles: "2026-11-10", pet_papillons: "2026-11-10", fx_etincelles: "2026-11-10" },
    pick: { add: { bg: { id: "bg_lac", t: 1 }, wx: { id: "wx_feuilles", t: 1 }, pet: { id: "pet_papillons", t: 1 }, fx: { id: "fx_etincelles", t: 1 } } } } };
async function open(size, time, motion = "auto") {
  const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: size.width < 500 ? 2 : 1, serviceWorkers: "block", hasTouch: false });
  await ctx.addInitScript(([st, motion]) => { if (!localStorage.getItem("ccm2:profile")) {
    localStorage.setItem("ccm2:profile", JSON.stringify({ name: "Test", id: null }));
    localStorage.setItem("ccm2:state", st);
    localStorage.setItem("ccm2:settings", JSON.stringify({ companion: "add", answer: "qcm", motion }));
  } }, [JSON.stringify(STATE), motion]);
  const page = await ctx.newPage(); page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install({ time: new Date(time) });
  await page.goto(`http://localhost:${srv.address().port}/`);
  await page.waitForSelector(".splash");
  if (await page.locator(".splash .btn", { hasText: "Plus tard" }).count()) await page.locator(".splash .btn", { hasText: "Plus tard" }).click();
  else await page.locator(".splash-hello").click();
  await page.waitForSelector(".splash", { state: "detached" });
  return page;
}
// Fait avancer le temps de la page jusqu'à ce que la condition soit vraie.
async function until(page, fn, arg, ms = 20000) {
  for (let t = 0; t < ms; t += 200) { if (await page.evaluate(fn, arg)) return; await page.clock.runFor(200); }
  await page.screenshot({ path: `${out}/course-ECHEC.png` });
  throw new Error("délai dépassé : " + fn.toString() + " " + JSON.stringify(await page.evaluate(() => ({ pill: document.querySelector(".course .pill")?.textContent, over: document.querySelector(".cr-over")?.className, hidden: document.querySelector(".cr-over")?.hidden, row: document.querySelector(".cr-row")?.outerHTML.slice(0, 200) }))));
}
const good = (page) => page.evaluate(() => Number(document.querySelector(".cr-track").dataset.good));
const done = (page) => page.evaluate(() => document.querySelectorAll(".gate.good").length);
const nthGate = (page) => page.evaluate(() => document.querySelector(".course .pill").textContent);
const rowY = (page) => page.evaluate(() => document.querySelector(".cr-row").style.transform);
const waitRow = (page) => until(page, () => { if (document.querySelector(".result")) return true; const r = document.querySelector(".cr-row"); return r && !r.classList.contains("gone") && !document.querySelector(".gate.good") && document.querySelector(".gate-v").textContent !== ""; });
const waitPass = (page) => until(page, () => !!document.querySelector(".gate.good") || !!document.querySelector(".result"));
async function answerKey(page, ok = true) {
  await waitRow(page); if (await page.locator(".result").count()) return; const g = await good(page);
  await page.keyboard.press(String((ok ? g : (g + 1) % 3) + 1));
  await waitPass(page);
}
const toCourse = async (page, fam = null) => {
  await page.locator(".tab-b", { hasText: "Exercices" }).click(); await page.waitForSelector(".course-card");
  if (fam) await page.locator(".course-fam", { hasText: fam }).click(); else await page.locator(".course-mix").click();
  await page.waitForSelector(".cr-track"); await page.clock.runFor(300);
};

// ---------- téléphone, jour ----------
const page = await open({ width: 384, height: 824 }, "2026-11-14T10:00:00");
await page.locator(".tab-b", { hasText: "Exercices" }).click(); await page.waitForSelector(".course-card");
await page.waitForTimeout(450); await page.screenshot({ path: `${out}/course-0-exercices.png` });
await toCourse(page);
assert.equal(await page.locator(".tabbar").count(), 0, "pas de barre d'onglets pendant la course");
assert.equal(await page.locator(".gate").count(), 3, "3 couloirs");
assert.ok(await page.locator(".cr-track .wx-p").count() > 0 && await page.locator(".cr-track .pt-row").count() > 0, "météo et petit animal du décor");
assert.ok(await page.locator(".cr-track.bg-lac").count(), "le fond acheté");
const lane0 = await page.locator(".gate").first().boundingBox(); assert.ok(lane0.width > 80 && lane0.width <= 128, "≈128 px par couloir : " + lane0.width);
// 1. au clavier
await waitRow(page); await page.clock.runFor(1500);
await page.screenshot({ path: `${out}/course-1-piste.png` });
await answerKey(page, true);
assert.equal(await done(page), 1);
// 2. au toucher : un appui sur le bon couloir
await waitRow(page);
{ const g = await good(page), box = await page.locator(".cr-track").boundingBox(); await page.mouse.click(box.x + box.width * (g + 0.5) / 3, box.y + box.height * 0.6); }
await waitPass(page);
const after2 = await page.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")).c.ok);
assert.equal(after2, 2, "deux bonnes réponses comptées comme ailleurs");
// 3. une erreur → la course se met en pause, bonne réponse + astuce, « J'ai compris » relance
await answerKey(page, false);
await page.waitForSelector(".cr-over.wrong .hint");
assert.match(await page.locator(".cr-oups").innerText(), /Presque ! La bonne réponse/);
const y1 = await rowY(page); await page.clock.runFor(1500); assert.equal(await rowY(page), y1, "la course attend pendant l'astuce");
await page.screenshot({ path: `${out}/course-2-erreur.png` });
const st3 = await page.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")));
assert.equal(Object.values(st3.review).filter((r) => !r.done).length, 1, "le calcul raté part dans les calculs à revoir");
await page.locator(".cr-over .btn", { hasText: "J'ai compris" }).click(); await page.waitForSelector(".cr-over", { state: "hidden" });
// 4. pause / reprise (bouton, puis Échap) ; glisser pour changer de couloir
await waitRow(page); await page.clock.runFor(400);
await page.locator(".cr-pause-btn").click(); await page.waitForSelector(".cr-paused");
const y2 = await rowY(page); await page.clock.runFor(2000); assert.equal(await rowY(page), y2, "rien ne bouge en pause");
await page.screenshot({ path: `${out}/course-3-pause.png` });
await page.locator(".cr-paused .btn", { hasText: "Reprendre" }).click(); await page.clock.runFor(300);
assert.notEqual(await rowY(page), y2, "la course reprend");
await page.keyboard.press("Escape"); await page.waitForSelector(".cr-paused"); await page.keyboard.press("Escape"); await page.waitForSelector(".cr-paused", { state: "detached" });
const tr = () => page.evaluate(() => document.querySelector(".cr-runner").style.transform);
const before = await tr(); const tb = await page.locator(".cr-track").boundingBox();
const dir = parseFloat(before.slice(12)) > tb.width / 3 ? -1 : 1; // vers la gauche, sauf si elle y est déjà
await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height * 0.7); await page.mouse.down(); await page.mouse.move(tb.x + tb.width / 2 + 90 * dir, tb.y + tb.height * 0.7, { steps: 4 }); await page.mouse.up();
await page.clock.runFor(300);
assert.notEqual(await tr(), before, "glisser change de couloir");
// l'appli passe en arrière-plan : pause automatique
await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
await page.waitForSelector(".cr-paused");
await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: false, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
await page.locator(".cr-paused .btn", { hasText: "Reprendre" }).click();
// 5. fin de course : écran de résultats + photo-souvenir dans le carnet
for (let i = 0; i < 20 && !(await page.locator(".result").count()); i++) await answerKey(page, true);
await page.waitForSelector(".result .run-souvenir");
assert.match(await page.locator(".result .big-num").innerText(), /^9 \/ 10$/);
assert.equal(await page.locator(".tabbar").count(), 0);
await page.waitForTimeout(1500); await page.screenshot({ path: `${out}/course-4-resultat.png` });
const st5 = await page.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")));
const keys = Object.keys(st5.run); assert.equal(keys.length, 1, "une seule photo par course");
assert.match(keys[0], /^2026-11-14T10:0\d$/); assert.deepEqual({ ...st5.run[keys[0]] }, { c: "add", st: 2, bg: "bg_lac", ok: 9, n: 10, fam: "mix" });
assert.equal(st5.c.course, 1); assert.ok(st5.tro["t_run:1"], "trophée Coureur");
await page.locator(".run-souvenir .btn", { hasText: "Voir le carnet" }).click(); await page.waitForSelector(".dream.run");
assert.equal(await page.locator(".dream").count(), 1, "filtre « Courses »");
await page.waitForTimeout(450); await page.screenshot({ path: `${out}/course-5-carnet.png` });
await page.locator(".dream-filter .seg-b", { hasText: "Tout" }).click(); await page.waitForTimeout(100);
assert.equal(await page.locator(".dream").count(), 2, "Tout : la course et le soir, la plus récente d'abord");
assert.ok(await page.locator(".dream").first().evaluate((e) => e.classList.contains("run")));

// ---------- iMac, soir ----------
const mac = await open({ width: 1200, height: 800 }, "2026-11-14T19:00:00");
await toCourse(mac, "−");
await waitRow(mac); await mac.clock.runFor(1200);
assert.match(await mac.locator(".cr-q .q-fam").innerText(), /Soustractions/);
assert.ok(await mac.locator(".course .kbd-hint").isVisible(), "raccourcis visibles");
await mac.screenshot({ path: `${out}/course-6-imac-soir.png` });
for (let i = 0; i < 20 && !(await mac.locator(".result").count()); i++) { // ← → puis Entrée n'est pas nécessaire : la rangée arrive sur elle
  await waitRow(mac); if (await mac.locator(".result").count()) break; const g = await good(mac);
  const cur = await mac.evaluate(() => { const r = document.querySelector(".cr-runner"), w = document.querySelector(".cr-track").clientWidth; return Math.floor((new DOMMatrix(getComputedStyle(r).transform).m41 + r.clientWidth / 2) / (w / 3)); });
  for (let k = cur; k < g; k++) await mac.keyboard.press("ArrowRight");
  for (let k = cur; k > g; k--) await mac.keyboard.press("ArrowLeft");
  await waitPass(mac);
}
await mac.waitForSelector(".result .run-souvenir");
assert.match(await mac.locator(".result .big-num").innerText(), /^10 \/ 10$/);
await mac.screenshot({ path: `${out}/course-7-imac-resultat.png` });

// ---------- animations réduites : pas de défilement, les portes attendent son choix ----------
const calm = await open({ width: 384, height: 824 }, "2026-11-14T19:00:00", "off");
assert.ok(await calm.evaluate(() => document.documentElement.classList.contains("calm")));
await toCourse(calm);
await waitRow(calm);
const yc = await rowY(calm); await calm.clock.runFor(15000);
assert.equal(await rowY(calm), yc, "calme : les portes attendent");
assert.equal(await calm.locator(".gate.good").count(), 0, "rien ne passe tout seul");
assert.match(await calm.locator(".cr-hint").innerText(), /Touche la bonne porte/);
await calm.screenshot({ path: `${out}/course-8-calme.png` });
{ const g = await good(calm), box = await calm.locator(".cr-track").boundingBox(); await calm.mouse.click(box.x + box.width * (g + 0.5) / 3, box.y + box.height * 0.5); }
await waitPass(calm);
for (let i = 0; i < 20 && !(await calm.locator(".result").count()); i++) await answerKey(calm, true);
await calm.waitForSelector(".result .run-souvenir");
await calm.screenshot({ path: `${out}/course-9-calme-resultat.png` });

console.log(errors.length ? "ERREURS : " + errors.join("\n") : "parcours de la course OK, pas d'erreur JS");
await browser.close(); srv.close(); if (errors.length) process.exit(1);
