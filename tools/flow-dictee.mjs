// Parcours Dictée + réglages + compagnon avec une fausse voix : node tools/flow-dictee.mjs [dossier-captures]
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
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 384, height: 824 }, deviceScaleFactor: 2, serviceWorkers: "block" });
await ctx.addInitScript(() => {
  window.__said = [];
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speaking: false, pending: false, getVoices: () => [{ lang: "fr-FR", name: "Mock" }], speak(u) { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 10); }, cancel() {}, addEventListener() {} } });
  if (!localStorage.getItem("ccm2:profile")) localStorage.setItem("ccm2:profile", JSON.stringify({ name: "Test", id: "x" }));
});
const page = await ctx.newPage();
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`http://localhost:${srv.address().port}/`);
await page.waitForSelector(".home-hero");
await (await page.locator(".splash .btn", { hasText: "Plus tard" }).count() ? page.locator(".splash .btn", { hasText: "Plus tard" }) : page.locator(".splash")).click({ timeout: 2000 }).catch(() => {}); await page.waitForSelector(".splash", { state: "detached" });
// réglages
await page.locator(".gear").click(); await page.waitForSelector("text=Vitesse de lecture");
await page.locator(".seg-b:has-text('Lente')").click();
await page.locator("text=Tester la voix").click();
assert.match(await page.evaluate(() => window.__said.at(-1)), /Quarante-sept plus trente-huit/i);
await page.waitForTimeout(400); await page.screenshot({ path: `${out}/dictee-reglages.png` });
await page.locator(".icon-btn").click(); await page.waitForSelector(".home-hero");
// dictée
await page.locator(".tab-b", { hasText: "Jouer" }).click(); await page.waitForSelector(".fam-grid");
await page.locator('.game-tile[data-game="dictee"]').click(); await page.locator('.fam-card[data-theme="mix"]').click(); await page.waitForSelector(".dict-play"); // v0.17 : jeu puis thème
await page.waitForTimeout(600);
const said = await page.evaluate(() => window.__said.slice());
assert.ok(said.length >= 2 && /\D/.test(said.at(-1)) && !/\d/.test(said.at(-1)), "la phrase de dictée est lue en toutes lettres : " + said.at(-1));
assert.equal(await page.locator(".q-text").count(), 0, "le calcul est caché avant « Voir le calcul »");
await page.screenshot({ path: `${out}/dictee-ecoute.png` });
await page.locator("text=Répéter").click();
assert.equal((await page.evaluate(() => window.__said.length)) > said.length, true, "Répéter relit");
await page.locator("text=Voir le calcul").click(); await page.waitForSelector(".q-text");
// mauvaise réponse -> astuce lue
const before = await page.evaluate(() => window.__said.length);
const choices = page.locator(".choice");
const wrong = await choices.evaluateAll((els) => els.map((e) => e.dataset.v));
await page.evaluate(() => {}); // pas de moyen simple de connaître la bonne réponse : on essaie jusqu'à tomber sur une erreur
for (let i = 0; i < 4; i++) { await choices.nth(i).click(); if (await page.locator(".wrong-zone").count()) break; await page.waitForTimeout(1000); if (!(await page.locator(".choice").count())) break; }
if (await page.locator(".wrong-zone").count()) {
  await page.waitForTimeout(700);
  const t = await page.evaluate(() => window.__said.at(-1));
  assert.match(t, /La réponse est/); assert.ok(!/[×÷−+=]/.test(t));
  await page.screenshot({ path: `${out}/dictee-astuce.png` });
}
// compagnon
await page.goto(page.url().split("#")[0] + "#/album"); await page.waitForSelector(".pets");
console.log(errors.length ? "ERREURS : " + errors.join("\n") : "parcours dictée OK, pas d'erreur JS");
await browser.close(); srv.close();
if (errors.length) process.exit(1);
