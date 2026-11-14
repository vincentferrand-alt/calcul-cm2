// « La course des réponses » 🏃 (v0.15) — l'écran. Toute la logique de jeu est dans js/course.js (pure, testée).
// Rendu : DOM + transform/opacity, une boucle requestAnimationFrame qui ne crée AUCUN élément à chaque image (une rangée de
// portes réutilisée, des couches de paysage en tuiles). Paysage en parallaxe à 2 couches (le fond acheté au loin, la piste
// devant), météo, effet et petit animal du décor de la créature. Pause : bouton ⏸, Échap, ou appli en arrière-plan.
// Animations réduites (html.calm) : pas de défilement, les 3 portes attendent qu'elle choisisse, pas de glissement.
import { h, svgEl } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { toKey } from "../dates.js";
import { famById, fmt } from "../generator.js";
import { creatureById } from "../creatures.js";
import { landSVG, weatherHTML, effectHTML, petHTML, timeOfDay, DEFAULT_BG, SEASON_GROUND } from "../decor.js";
import { scenePick } from "../shop.js";
import { homeCreature } from "../goal.js";
import { isCalm } from "../motion.js";
import { LANES, GATES, courseProblems, gateRow, passGate, startPace, paceAfter, speedOf, moveLane, laneAt, courseAnswer, courseEnd, addRunPhoto } from "../course.js";
import { creatureArt } from "./art.js";
import { iconBtn } from "./common.js";
import { toast, confetti } from "./notify.js";
import { hintPanel, session, showResults } from "./play.js";
import { runPhotoEl } from "./carnet.js";

// Couleur du sol de la piste, selon le fond acheté (le paysage du fond défile par-dessus, au loin).
const GROUND = { bg_prairie: "#6cc65f", bg_lac: "#5aa860", bg_foret: "#4f9b58", bg_plage: "#f1cf86", bg_montagne: "#69bb5c", bg_desert: "#eaa85a", bg_banquise: "#e3f1fb", bg_nuit: "#1d3a63", ...SEASON_GROUND };
// La piste devant : 3 couloirs (lignes en pointillés) et quelques touffes d'herbe, en tuile répétée.
const trackTile = (dark) => `<svg viewBox="0 0 300 225" preserveAspectRatio="none" aria-hidden="true">
  <path d="M100 0V225M200 0V225" stroke="${dark ? "rgba(190,220,255,.45)" : "rgba(255,255,255,.7)"}" stroke-width="3" stroke-dasharray="16 14"/>
  ${[[30, 40], [168, 92], [262, 150], [70, 190], [236, 24], [130, 168]].map(([x, y]) => `<path d="M${x} ${y}l-4-9M${x} ${y}l0-11M${x} ${y}l4-9" stroke="${dark ? "rgba(140,200,255,.35)" : "rgba(30,90,40,.35)"}" stroke-width="2.4" stroke-linecap="round"/>`).join("")}
  ${[[52, 120], [214, 64], [150, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${dark ? "#8ff0ff" : "#fff"}" opacity=".7"/>`).join("")}</svg>`;

export function courseScreen({ go }) {
  const opts = session.opts;
  if (!opts || opts.mode !== "course") { go("exercices"); return { el: h("div") }; }
  const date = toKey(), calm = () => isCalm();
  const probs = courseProblems(store.state, opts.families, Math.random, date);
  const total = Math.min(GATES, probs.length);
  const fam0 = Array.isArray(opts.families) && opts.families.length === 1 ? opts.families[0] : "mix";
  // La créature : le compagnon (ou celle de l'accueil), dans SON décor.
  const s0 = store.state, hc = homeCreature(s0, store.settings.companion), c = creatureById(hc.id);
  const pick = hc.stage > 0 ? scenePick(s0, hc.id) : { st: 0, bg: DEFAULT_BG, wx: null, fx: null, pet: null };
  const xp = (s0.fam[c.fam] || { xp: 0 }).xp, tod = pick.bg === "bg_nuit" ? "night" : timeOfDay(new Date().getHours());
  const S = { i: 0, n: 0, ok: 0, run: 0, best: 0, up: [], mastered: 0, tro: [], mis: [], cre: [], done: false };
  let lane = 1, pace = startPace(), paused = false, blocked = false, raf = 0, last = 0, dist = 0;
  let row = null, phase = "gap", y = 0, wait = 0.35; // phase : gap → coming → passed → gap …

  // ---------- éléments (créés une seule fois) ----------
  const bar = h("div", { class: "bar" }, h("div", { class: "bar-fill" }));
  const counter = h("span", { class: "pill" }, "");
  const ICON = { pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.6" fill="currentColor"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.6" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>' };
  const pauseBtn = h("button", { class: "icon-btn cr-pause-btn", type: "button", "aria-label": "Pause", onclick: () => setPaused(!paused) });
  pauseBtn.append(svgEl(ICON.pause));
  const qText = h("div", { class: "q-text" }), qCard = h("div", { class: "q-card cr-q", "aria-live": "polite" }, h("div", { class: "q-fam" }), qText);
  const track = h("div", { class: `scene v-course cr-track tod-${tod} ${pick.bg.replace("_", "-")}`, style: { "--ground": GROUND[pick.bg] || GROUND.bg_prairie }, "aria-label": "La piste : 3 couloirs", role: "application" });
  const far = h("div", { class: "cr-layer cr-far" }), near = h("div", { class: "cr-layer cr-near" });
  const gates = [0, 1, 2].map((i) => h("div", { class: "gate", "data-lane": i }, h("span", { class: "gate-v" })));
  const rowEl = h("div", { class: "cr-row" }, gates);
  const fx = effectHTML(pick.fx, c.aura || c.c2);
  const fxb = h("div", { class: "cr-fx" }), fxf = h("div", { class: "cr-fx" }); fxb.innerHTML = fx.back; fxf.innerHTML = fx.front;
  const bob = h("div", { class: "cr-bob" }, fxb, creatureArt(hc.id, hc.stage > 0 ? pick.st : 0, xp, "course"), fxf);
  const runner = h("div", { class: "cr-runner" }, h("i", { class: "cr-shadow" }), bob);
  const puff = h("div", { class: "cr-puff", "aria-hidden": "true" }, h("i"), h("i"), h("i"), h("i"));
  const pets = h("div", { class: "sc-pets", "aria-hidden": "true" }); pets.innerHTML = pick.pet ? petHTML(pick.pet) : "";
  const wx = h("div", { class: "cr-wx" }); wx.innerHTML = pick.wx ? weatherHTML(pick.wx, true, 5) : "";
  const hint = h("div", { class: "cr-hint" }, "");
  track.append(h("div", { class: "cr-sky sc-sky" }), far, near, pets, rowEl, runner, puff, wx, hint);
  const overlay = h("div", { class: "cr-over", hidden: true });
  const root = h("main", { class: "screen play course" },
    h("div", { class: "topbar" }, iconBtn("close", "Quitter la course", () => go(opts.back ?? "exercices")), bar, counter, pauseBtn),
    h("div", { class: "cr-body" }, qCard, track, h("div", { class: "kbd-hint" }, "Clavier : ← → pour changer de couloir · 1 2 3 pour choisir · Échap pour la pause")),
    overlay);

  // ---------- mise en page (au départ et si la fenêtre change de taille, jamais à chaque image) ----------
  let W = 0, H = 0, tileH = 0, lineY = 0, gateH = 0;
  function layout() {
    W = track.clientWidth; H = track.clientHeight; if (!W || !H) return;
    tileH = Math.round(W * 0.75); gateH = Math.round(Math.min(96, H * 0.16));
    const rh = Math.min(W / LANES * 0.92, H * 0.27);
    runner.style.width = rh + "px"; runner.style.height = rh + "px";
    lineY = H - H * 0.04 - rh * 0.72; // la rangée « touche » la créature à cette hauteur
    rowEl.style.height = gateH + "px";
    const n = Math.ceil(H / tileH) + 1;
    far.replaceChildren(...Array.from({ length: n }, () => { const t = h("div", { class: "cr-tile" }); t.style.height = tileH + "px"; t.innerHTML = landSVG(pick.bg); return t; }));
    near.replaceChildren(...Array.from({ length: n }, () => { const t = h("div", { class: "cr-tile" }); t.style.height = tileH + "px"; t.append(svgEl(trackTile(pick.bg === "bg_nuit" || tod === "night"))); return t; }));
    far.style.top = near.style.top = -tileH + "px";
    placeRunner(true); draw();
  }
  const placeRunner = (instant) => {
    const lw = W / LANES, rw = parseFloat(runner.style.width) || lw;
    if (instant) runner.classList.add("no-slide");
    runner.style.transform = `translate3d(${(lane * lw + (lw - rw) / 2).toFixed(1)}px,0,0)`;
    if (instant) requestAnimationFrame(() => runner.classList.remove("no-slide"));
  };
  function draw() {
    const off = tileH ? dist % tileH : 0;
    far.style.transform = `translate3d(0,${(off * 0.35 % tileH).toFixed(1)}px,0)`;
    near.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
    rowEl.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
  }

  // ---------- déroulement ----------
  function setProgress() {
    bar.firstChild.style.width = (100 * S.n / total) + "%";
    counter.textContent = `${Math.min(S.n + 1, total)} / ${total}`;
  }
  function spawn() {
    const prob = probs[S.i]; row = gateRow(prob);
    const f = famById(prob.fam);
    qCard.style.setProperty("--fam", f.color);
    qCard.firstChild.textContent = `${f.short}  ${f.name}${prob.review ? " · ↻ à revoir" : ""}`;
    qText.textContent = prob.q + (prob.showEq ? " = ?" : "");
    gates.forEach((g, i) => { g.className = "gate"; g.firstChild.textContent = fmt(row.values[i]); g.setAttribute("aria-label", `Couloir ${i + 1} : ${fmt(row.values[i])}`); });
    if (navigator.webdriver) track.dataset.good = String(row.good); // pour les parcours automatiques seulement
    rowEl.classList.remove("gone");
    phase = "coming";
    y = calm() ? Math.max(0, Math.min(lineY - gateH * 1.6, H * 0.4 - gateH / 2)) : -gateH; // calme : les portes attendent au milieu de la piste
    hint.textContent = calm() ? "Touche la bonne porte (ou 1 2 3)" : "";
    setProgress(); draw();
  }
  function resolve(choice) {
    if (phase !== "coming" || blocked) return;
    phase = "passed";
    const prob = probs[S.i], r = passGate(row, choice);
    if (r.lane !== lane) { lane = r.lane; placeRunner(calm()); }
    const ok = r.ok, run = ok ? S.run + 1 : 0;
    let res; store.update((s) => { res = courseAnswer(s, { prob, ok, run, date }); });
    S.tro.push(...res.trophies); S.mis.push(...res.missions); S.cre.push(...res.creatures);
    if (res.ev.levelUp) S.up.push(res.ev.levelUp);
    if (res.ev.mastered) S.mastered++;
    res.creatures.forEach((e) => { sfx.hatch(); confetti(); toast(e.from === 0 ? `${creatureById(e.id).name} est né !` : `${creatureById(e.id).name} évolue : ${creatureById(e.id).forms[e.to - 1]} !`, { icon: "🥚", sound: false, discreet: true }); });
    S.n++; pace = paceAfter(pace, ok);
    gates[r.good].classList.add("good");
    if (ok) {
      S.ok++; S.run++; S.best = Math.max(S.best, S.run); sfx.ok();
      runner.classList.remove("hop"); void runner.offsetWidth; runner.classList.add("hop");
      wait = calm() ? 0.6 : 0.45;
    } else {
      S.run = 0; sfx.wrong();
      gates[r.lane].classList.add("soft");
      puff.style.transform = runner.style.transform; puff.classList.remove("show"); void puff.offsetWidth; puff.classList.add("show");
      wait = 0.3; showWrong(prob);
    }
    S.i++; setProgress();
  }
  function showWrong(prob) {
    blocked = true; stop();
    const btn = h("button", { class: "btn green big", type: "button", onclick: closeWrong }, "J'ai compris →");
    overlay.replaceChildren(h("div", { class: "cr-panel" },
      h("p", { class: "cr-oups" }, `☁️ Presque ! La bonne réponse : ${fmt(prob.a)}`),
      h("div", { class: "cr-calc" }, `${prob.q}${prob.showEq ? " = " : " : "}${fmt(prob.a)}`),
      hintPanel(prob, { animate: !calm() }),
      h("p", { class: "muted center small" }, "On le reverra bientôt, pour bien l'apprendre."), btn,
      h("div", { class: "kbd-hint" }, "Clavier : Entrée pour continuer")));
    overlay.hidden = false; overlay.className = "cr-over wrong";
    setTimeout(() => btn.focus({ preventScroll: true }), 50);
  }
  function closeWrong() {
    if (!blocked) return;
    sfx.tap(); blocked = false; overlay.hidden = true; overlay.replaceChildren();
    if (!paused) start();
  }
  function setPaused(p) {
    if (S.done || blocked) return;
    paused = p; track.classList.toggle("paused", p);
    pauseBtn.replaceChildren(svgEl(p ? ICON.play : ICON.pause)); pauseBtn.setAttribute("aria-label", p ? "Reprendre" : "Pause");
    if (p) {
      stop();
      overlay.replaceChildren(h("div", { class: "cr-panel cr-paused" }, h("div", { class: "cr-pz" }, "⏸"), h("h2", {}, "Course en pause"),
        h("p", {}, "Prends ton temps : rien ne bouge tant que tu n'as pas repris."),
        h("button", { class: "btn green big", type: "button", onclick: () => { sfx.tap(); setPaused(false); } }, "▶ Reprendre"),
        h("button", { class: "btn ghost big", type: "button", onclick: () => go(opts.back ?? "exercices") }, "Arrêter la course")));
      overlay.hidden = false; overlay.className = "cr-over";
    } else { overlay.hidden = true; overlay.replaceChildren(); start(); }
  }
  function finish() {
    S.done = true; stop();
    let r, key;
    store.update((s) => {
      r = courseEnd(s, { ok: S.ok, total: S.n, date });
      key = addRunPhoto(s, { c: hc.id, st: hc.stage > 0 ? pick.st : 0, bg: pick.bg, ok: S.ok, n: S.n, fam: fam0 }); // au plus une photo par course
    });
    S.tro.push(...r.trophies); S.mis.push(...r.missions);
    sfx.level();
    const entry = { key, ...store.state.run[key] };
    const photo = h("div", { class: "card center run-souvenir" }, h("h2", {}, "📸 Photo-souvenir"),
      runPhotoEl(entry, "result"),
      h("p", {}, "Elle est rangée dans ton carnet de rêves."),
      h("button", { class: "btn light", type: "button", onclick: () => go("carnet/courses") }, "📖 Voir le carnet"));
    showResults(root, { S, r, opts, date, go, replay: () => go("course", true), extra: photo });
  }

  // ---------- boucle ----------
  function frame(t) {
    raf = 0;
    if (paused || blocked || S.done) return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
    const v = speedOf(pace, calm()) * (lineY + gateH); // px par seconde (0 en mode calme)
    dist += v * dt;
    if (phase === "gap") { wait -= dt; if (wait <= 0) { if (S.i >= total) { finish(); return; } spawn(); } }
    else if (phase === "coming") { y += v * dt; if (y >= lineY - gateH * 0.35) resolve(lane); }
    else if (phase === "passed") {
      y += (calm() ? 0 : v) * dt; wait -= dt;
      if (wait <= 0 || y > H) { rowEl.classList.add("gone"); phase = "gap"; wait = calm() ? 0.15 : 0.5; }
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && !S.done) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  // ---------- commandes ----------
  const steer = (dir) => { if (blocked || paused || S.done) return; const nl = moveLane(lane, dir); if (nl !== lane) { lane = nl; sfx.tap(); placeRunner(calm()); } };
  const choose = (l) => { // toucher un couloir / 1 2 3 : on y va ; en mode calme, on passe aussi la porte
    if (blocked || paused || S.done) return;
    if (l !== lane) { lane = l; sfx.tap(); placeRunner(calm()); }
    if (calm() && phase === "coming") resolve(lane);
  };
  let p0 = null;
  track.addEventListener("pointerdown", (e) => { p0 = { x: e.clientX, y: e.clientY }; });
  track.addEventListener("pointerup", (e) => {
    if (!p0) return; const dx = e.clientX - p0.x, dy = e.clientY - p0.y; p0 = null;
    if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) steer(dx > 0 ? 1 : -1);
    else { const r = track.getBoundingClientRect(); choose(laneAt(e.clientX - r.left, r.width)); }
  });
  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || S.done) return;
    if (blocked) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); closeWrong(); } return; }
    if (e.key === "Escape") { e.preventDefault(); setPaused(!paused); return; }
    if (paused) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPaused(false); } return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); steer(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); steer(1); }
    else if ("123".includes(e.key) && e.key.length === 1) { e.preventDefault(); choose(Number(e.key) - 1); }
    else if ((e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") && calm()) { e.preventDefault(); choose(lane); }
  };
  const onVis = () => { if (document.hidden && !S.done && !paused && !blocked) setPaused(true); }; // en arrière-plan : pause automatique
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => layout()) : null;
  document.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onVis);
  if (ro) ro.observe(track);
  requestAnimationFrame(() => { layout(); setProgress(); start(); });
  return { el: root, destroy: () => { stop(); S.done = true; document.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVis); if (ro) ro.disconnect(); } };
}
