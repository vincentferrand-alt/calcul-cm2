// Parcours de la fiche chrono « 50 calculs en 5 minutes » (v0.18) : node tools/flow-chrono.mjs [dossier-captures]
// Téléphone 384 × 824 : Jouer → tuile « 50 en 5 min » → rythme → « Prête ? » → réponses (justes, fausse, passée, retour arrière par numéro),
// pause (calcul caché), arrière-plan, fin, correction, astuce, « Refaire mes erreurs », record, trophée, pastille de l'accueil.
// Puis les 5 minutes qui s'écoulent (horloge simulée) ; iMac 1200 × 800 au clavier (grille des 50 numéros) ; animations réduites.
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import assert from "node:assert/strict";
const root = path.resolve(new URL("..", import.meta.url).pathname), out = process.argv[2] || "/tmp/chrono"; fs.mkdirSync(out, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webp": "image/webp", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".json": "application/json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(0);
const url = `http://localhost:${srv.address().port}/`;
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const errors = [];
const fixture = fs.readFileSync(path.join(root, "tests/fixtures/v0.17.0.json"), "utf8");
async function open(viewport, settings = {}, motion = "auto") {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: viewport.width < 500 ? 2 : 1, serviceWorkers: "block" });
  await ctx.addInitScript(([st, set]) => { if (!localStorage.getItem("ccm2:profile")) { localStorage.setItem("ccm2:profile", JSON.stringify({ name: "Test", id: null })); localStorage.setItem("ccm2:state", st); localStorage.setItem("ccm2:settings", JSON.stringify(set)); } }, [fixture, { companion: "add", ...settings, motion }]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${viewport.width}: ${e.message}`));
  await page.clock.install({ time: new Date("2026-11-14T10:00:00") });
  await page.goto(url + "#/exercices"); await page.waitForSelector(".game-grid");
  await page.locator(".nb-x").click({ timeout: 1500 }).catch(() => {});
  return page;
}
const sheet = (page) => page.evaluate(() => document.querySelector(".chrono")._sheet.map((p) => ({ q: p.q, a: p.a, line: p.line })));
const dec = (a) => String(Math.round(a * 1e5) / 1e5).replace(".", ",");
const tapKeys = async (page, txt) => { for (const c of txt) await page.locator(".ch-pad .key", { hasText: new RegExp(`^${c === "," ? "," : c}$`) }).click(); };
// capture après la fin des animations d'apparition (elles suivent l'horloge réelle, pas l'horloge simulée)
const shot = async (pg, name) => { await pg.waitForTimeout(900); await pg.screenshot({ path: `${out}/${name}.png` }); };
const typeKb = async (page, txt) => { for (const c of txt) await page.keyboard.press(c); };

// ---------- téléphone : une fiche « Découverte » (20 calculs) jouée au doigt ----------
const page = await open({ width: 384, height: 824 });
await page.locator('.game-tile[data-game="chrono"]').click(); await page.waitForSelector(".rhythm-card");
assert.equal(await page.locator(".rhythm-card").count(), 4, "4 rythmes");
assert.equal(await page.locator(".theme-grid").count(), 0, "pas de grille de thèmes pour la fiche");
assert.match(await page.locator(".opt-note").innerText(), /période 2/, "période automatique : 2 à la mi-novembre");
await shot(page, "chrono-1-jouer");
await page.locator('.rhythm-card[data-rhythm="decouverte"]').click(); await page.waitForSelector(".ch-go");
assert.equal(await page.locator(".tabbar").count(), 0, "pas d'onglets sur la fiche");
assert.match(await page.locator(".ch-ready h2").innerText(), /20 calculs en 5 minutes/);
await shot(page, "chrono-2-prete");
await page.locator(".ch-go").click(); await page.waitForSelector(".ch-eq");
const S = await sheet(page);
assert.equal(S.length, 20); assert.equal(await page.locator(".ch-cell").count(), 20);
assert.match(await page.locator(".ch-time").innerText(), /5:00/);
// 1 à 12 : justes (au doigt), 13 : faux, 14 : passé, 15 à 20 : justes ; puis retour sur 14 par son numéro
for (let k = 0; k < 20; k++) {
  if (k === 13) { await page.locator(".ch-next").click(); continue; }
  await tapKeys(page, k === 12 ? "9999" : dec(S[k].a));
  if (k === 0) { assert.equal(await page.locator(".ch-hole").innerText(), dec(S[0].a), "la réponse s'écrit dans le trou de l'énoncé"); await shot(page, "chrono-3-saisie"); }
  await page.locator(".ch-next").click();
}
assert.equal(await page.locator(".ch-cell.skip").count(), 1, "le calcul passé est marqué");
assert.equal(await page.locator(".ch-count").innerText(), "19 / 20");
assert.match(await page.locator(".ch-note").innerText(), /1 calcul sans réponse/, "« Suivant » au bout ramène au calcul passé");
assert.equal(await page.locator(".ch-cell.cur").getAttribute("data-i"), "13");
await shot(page, "chrono-4-retour");
// une erreur corrigée avant la fin : on revient sur le 13 par son numéro et on efface
await page.locator('.ch-cell[data-i="12"]').click();
for (let d = 0; d < 4; d++) await page.locator(".key-del").click();
await tapKeys(page, "8888"); // reste faux : il sera « à reprendre »
// pause : le calcul est caché, le temps est arrêté
await page.clock.runFor(10000);
const before = await page.locator(".ch-time").innerText();
await page.locator(".ch-top .icon-btn").click(); await page.waitForSelector(".ch-pause");
assert.equal(await page.locator(".ch-eq").isVisible(), false, "pendant la pause, le calcul est caché");
await page.clock.runFor(60000);
await page.locator(".ch-pause .btn.green").click(); await page.waitForSelector(".ch-eq");
assert.equal(await page.locator(".ch-time").innerText(), before, "le temps ne s'écoule pas pendant la pause");
// arrière-plan → pause automatique
await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
await page.waitForSelector(".ch-pause");
await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); });
await page.locator(".ch-pause .btn.green").click(); await page.waitForSelector(".ch-eq");
// on laisse le 14 vide et on finit
await page.locator(".ch-finish").click(); await page.waitForSelector(".ch-pause");
assert.match(await page.locator(".ch-pause").innerText(), /1 calcul sans réponse : ils ne comptent pas comme des erreurs/);
await page.locator(".ch-pause .btn.light").click(); await page.waitForSelector(".ch-result");
await page.clock.runFor(2000);
assert.equal(await page.locator(".ch-points .big-num").innerText(), "18");
assert.match(await page.locator(".ch-points").innerText(), /sur 20/);
assert.match(await page.locator(".ch-rec").innerText(), /premier record/);
assert.match(await page.locator(".ch-fixes h2").innerText(), /À reprendre \(1\)/);
assert.match(await page.locator(".ch-todos h2").innerText(), /Pas encore faits \(1\)/);
assert.match(await page.locator(".ch-result").innerText(), /Fiches chrono/, "trophée « Fiches chrono » gagné");
await shot(page, "chrono-5-resultat");
await page.locator(".ch-fix .btn").first().click(); await page.waitForSelector(".ch-hintbox .hint");
await page.clock.runFor(2000); await page.locator(".ch-fixes").scrollIntoViewIfNeeded();
assert.ok(await page.locator(".ch-hintbox .step").first().isVisible(), "l'astuce s'affiche");
await shot(page, "chrono-6-astuce");
// « Refaire mes erreurs » : réponse vérifiée tout de suite, sans chrono
await page.locator(".ch-redo").click(); await page.waitForSelector(".ch-check");
assert.equal(await page.locator(".ch-time").count(), 0, "pas de chrono pour refaire");
await tapKeys(page, dec(S[12].a)); await page.locator(".ch-check").click();
await page.waitForSelector(".q-card.good"); await page.clock.runFor(1000);
await page.waitForSelector(".result"); assert.match(await page.locator(".result").innerText(), /1 \/ 1/);
await shot(page, "chrono-7-refait");
// les points sont enregistrés : record, compteur, pastille de l'accueil
const st = await page.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")));
assert.equal(st.rec["fiche:p2:decouverte"], 18); assert.equal(Object.keys(st.fiche).length, 1); assert.ok(st.tro["t_fiche:1"]);
await page.evaluate(() => { location.hash = "#/"; }); await page.waitForSelector(".home-hero");
assert.match(await page.locator('.tchip[data-chip="fiche"]').innerText(), /18 points/);
const fits = await page.locator(".home .screen-body").evaluate((e) => e.scrollHeight <= e.clientHeight + 1);
assert.ok(fits, "l'accueil tient toujours sur un écran avec 4 pastilles");
await shot(page, "chrono-8-accueil");
await page.locator('.tchip[data-chip="fiche"]').click(); await page.waitForSelector(".ch-go");
assert.match(await page.locator(".ch-rec").innerText(), /18 points/, "la pastille ouvre la fiche, avec le record");

// ---------- les 5 minutes s'écoulent : la fiche se termine seule ----------
await page.locator(".ch-go").click(); await page.waitForSelector(".ch-eq");
const S2 = await sheet(page);
for (let k = 0; k < 5; k++) { await tapKeys(page, dec(S2[k].a)); await page.locator(".ch-next").click(); }
await page.clock.runFor(270000);
assert.ok(await page.locator(".ch-timer .bar-fill.low").count(), "la barre change de couleur à la fin");
await page.clock.runFor(31000); await page.waitForSelector(".ch-result");
assert.match(await page.locator(".result-title").innerText(), /Les minutes sont passées/);
assert.equal(await page.locator(".ch-points .big-num").innerText(), "5");
assert.match(await page.locator(".ch-todos h2").innerText(), /Pas encore faits \(15\)/);
await page.locator(".ch-todos .btn.small").click(); assert.equal(await page.locator(".ch-todo").count(), 15, "les réponses des calculs pas faits");
assert.match(await page.locator(".ch-rec").innerText(), /record à ce rythme : 18 points/);
await shot(page, "chrono-9-temps");
// v0.19 : la courbe « Mes dernières fiches » (2 fiches) et la revanche de 2 minutes
assert.equal(await page.locator(".ch-trend .trend-col").count(), 2, "une barre par fiche");
assert.match(await page.locator(".ch-trend .trend-msg").innerText(), /fiche/);
await page.locator(".ch-trend").scrollIntoViewIfNeeded(); await shot(page, "chrono-9b-courbe");
await page.locator(".ch-revenge").click(); await page.waitForSelector(".ch-eq");
const RV = await sheet(page);
assert.equal(RV.length, 10, "10 calculs"); assert.match(await page.locator(".ch-time").innerText(), /2:00/, "2 minutes");
for (let k = 0; k < 6; k++) { await tapKeys(page, dec(RV[k].a)); await page.locator(".ch-next").click(); }
await page.locator(".ch-finish").click(); await page.locator(".ch-pause .btn.light").click(); await page.waitForSelector(".ch-result");
assert.match(await page.locator(".ch-points-l").innerText(), /revanche/i); assert.equal(await page.locator(".ch-points .big-num").innerText(), "6");
const st3 = await page.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")));
assert.equal(Object.keys(st3.fiche).length, 2, "la revanche n'est pas une fiche (pas de record)");
await shot(page, "chrono-9c-revanche");
// v0.19 : une fiche « Apprendre » des nombres à virgule, et son entraînement sans chrono
await page.evaluate(() => { location.hash = "#/apprendre"; }); await page.waitForSelector(".learn-item");
assert.equal(await page.locator(".learn-item").count(), 22);
await page.evaluate(() => { location.hash = "#/fiche/dec_x10"; }); await page.waitForSelector(".fiche-head");
assert.match(await page.locator(".ex-q").first().innerText(), /7,6 × 100 = \?/);
for (let k = 0; k < 3; k++) await page.locator(".card .btn", { hasText: /Montre-moi|Étape suivante/ }).first().click();
assert.match(await page.locator(".ex-result").first().innerText(), /760/);
// « À toi de jouer » : on trouve chaque étape (le bon choix est la valeur de l'égalité)
for (let guard = 0; guard < 20 && !(await page.locator(".ex-result", { hasText: "Bravo" }).count()); guard++) {
  await page.locator(".step.cur .mini:not([disabled])").first().click(); // un choix faux se grise : on essaie le suivant
}
assert.ok(await page.locator(".ex-result", { hasText: "Bravo" }).count(), "« À toi de jouer » terminé avec des nombres à virgule");
await shot(page, "chrono-9d-fiche-apprendre");
await page.locator(".btn.big.green", { hasText: "Je m'entraîne" }).click(); await page.waitForSelector(".ch-check");
for (let k = 0; k < 10; k++) {
  const q = await page.locator(".ch-card .ch-eq").innerText();
  assert.match(q.replace(/\u202f/g, ""), /× 10+ =/, "entraînement : uniquement des × 10, × 100…");
  // la réponse est calculée à partir de l'énoncé affiché : « 7,6 × 100 = ? »
  const [x, p] = q.replace(/[?\s\u202f]/g, "").replace(/=.*$/, "").split("×").map((v) => Number(v.replace(",", ".")));
  await tapKeys(page, dec(x * p)); await page.locator(".ch-check").click();
  await page.waitForSelector(".q-card.good"); await page.clock.runFor(900);
}
await page.waitForSelector(".result"); assert.match(await page.locator(".result").innerText(), /Entraînement terminé[\s\S]*10 \/ 10/);
await shot(page, "chrono-9e-entrainement");
await page.locator(".btn", { hasText: "Retour à la fiche" }).click(); await page.waitForSelector(".fiche-head");
await page.context().close();

// ---------- iMac : « Comme en classe » (50 calculs) au clavier ----------
const mac = await open({ width: 1200, height: 800 }, { game: "chrono", ficheRhythm: "classe", fichePeriod: 1 });
assert.match(await mac.locator(".opt-note").innerText(), /Période 1 choisie/);
await mac.locator('.rhythm-card[data-rhythm="classe"]').click(); await mac.waitForSelector(".ch-go");
await mac.keyboard.press("Enter"); await mac.waitForSelector(".ch-eq");
const M = await sheet(mac);
assert.equal(M.length, 50);
const cols = await mac.locator(".ch-cells").evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length);
assert.equal(cols, 5, "grille de 5 colonnes à côté du calcul");
for (let k = 0; k < 10; k++) { await typeKb(mac, dec(M[k].a)); await mac.keyboard.press(k % 2 ? "Tab" : "Enter"); }
assert.equal(await mac.locator(".ch-cell.done").count(), 10);
assert.equal(await mac.locator('.ch-cell[data-i="3"] .ch-v').innerText(), dec(M[3].a), "la grille montre les réponses");
await mac.keyboard.press("ArrowLeft"); assert.equal(await mac.locator(".ch-cell.cur").getAttribute("data-i"), "9", "← revient au calcul précédent");
await mac.keyboard.press("Backspace"); await typeKb(mac, "."); // « . » du pavé numérique = virgule
assert.match(await mac.locator(".ch-hole").innerText(), /,/);
await shot(mac, "chrono-10-imac");
await mac.keyboard.press("Escape"); await mac.waitForSelector(".ch-pause");
await mac.keyboard.press("Escape"); await mac.waitForSelector(".ch-eq");
await mac.locator(".ch-finish").click(); await mac.locator(".ch-pause .btn.light").click(); await mac.waitForSelector(".ch-result");
assert.equal(await mac.locator(".ch-points .big-num").innerText(), "9");
await mac.clock.runFor(2000); await shot(mac, "chrono-11-imac-resultat");
await mac.context().close();

// ---------- animations réduites ----------
const calm = await open({ width: 384, height: 824 }, { game: "chrono" }, "off");
assert.ok(await calm.evaluate(() => document.documentElement.classList.contains("calm")));
await calm.locator('.rhythm-card[data-rhythm="championne"]').click(); await calm.waitForSelector(".ch-go");
assert.match(await calm.locator(".ch-ready h2").innerText(), /50 calculs en 4 minutes/);
await calm.locator(".ch-go").click(); await calm.waitForSelector(".ch-eq");
assert.match(await calm.locator(".ch-time").innerText(), /4:00/);
await shot(calm, "chrono-12-calme");
await calm.locator(".ch-top .icon-btn").click(); await calm.locator(".ch-pause .btn.ghost-dark").click(); await calm.waitForSelector(".game-grid");
const st2 = await calm.evaluate(() => JSON.parse(localStorage.getItem("ccm2:state")));
assert.equal(Object.keys(st2.fiche || {}).length, 0, "« Quitter sans compter » n'enregistre rien");
await calm.context().close();

console.log(errors.length ? "ERREURS :\n" + errors.join("\n") : "parcours de la fiche chrono OK, pas d'erreur JS");
await browser.close(); srv.close();
if (errors.length) process.exit(1);
