// Fiche chrono « 50 calculs en 5 minutes » (v0.18) : comme en classe. Un calcul à la fois, la réponse se tape DANS le trou de
// l'énoncé (« 0,3 + □ = 1 »), clavier avec virgule. On peut passer un calcul et y revenir : la bande des numéros (une grille
// sur l'iMac) montre ce qui est rempli ; un appui sur un numéro y ramène. Rien n'est corrigé pendant l'épreuve ; à la fin :
// les points, les calculs à reprendre avec leur astuce, et « Refaire mes erreurs » (sans chrono).
import { h } from "../dom.js";
import { store } from "../store.js";
import { sfx } from "../audio.js";
import { toKey } from "../dates.js";
import { makeFiche, rhythmById, periodOf, scoreFiche, HOLE, fmtDec, parseAnswer, sameValue, ficheBest, solved, typeKey } from "../fiche.js";
import { afterFiche } from "../game.js";
import { hintPanel } from "./play.js";
import { iconBtn, topbar } from "./common.js";
import { trophyLabel } from "../trophies.js";
import { missionText } from "../missions.js";
import { creatureCard } from "./album.js";
import { playEvolutions } from "./evolve.js";

const clock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const longTime = (secs) => { const m = Math.floor(secs / 60), s = secs % 60; return m ? `${m} min${s ? " " + String(s).padStart(2, "0") : ""}` : `${s} s`; };
const pl = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;
// L'énoncé avec son trou : les morceaux de texte autour d'un élément « trou ».
function eqEl(p, hole, cls = "") {
  const [before, after] = p.q.split(HOLE);
  const len = p.q.length;
  return h("div", { class: "ch-eq" + (len > 28 ? " xlong" : len > 16 ? " long" : "") + (cls ? " " + cls : "") }, before, hole, after);
}

export function chronoScreen({ go }) {
  const date = toKey(), set = store.settings;
  const period = periodOf(set.fichePeriod, date), rhythm = rhythmById(set.ficheRhythm);
  const root = h("main", { class: "screen chrono" });
  let phase = "ready", problems = [], answers = [], i = 0, seen = new Set();
  const total = rhythm.secs * 1000; let used = 0, startedAt = null, tick = null, timeUp = false;
  const remaining = () => total - used - (startedAt ? Date.now() - startedAt : 0);
  const stopClock = () => { if (startedAt) { used += Date.now() - startedAt; startedAt = null; } clearInterval(tick); tick = null; };
  const blanks = () => answers.map((a, k) => (a === "" ? k : -1)).filter((k) => k >= 0);

  // ---------- prête ? ----------
  function ready() {
    phase = "ready";
    const best = ficheBest(store.state, period, rhythm.id);
    root.replaceChildren(topbar("Fiche chrono", () => go("exercices")),
      h("div", { class: "screen-body ch-ready" },
        h("div", { class: "card center" },
          h("div", { class: "ch-big", "aria-hidden": "true" }, "⏱️"),
          h("h2", {}, `${rhythm.n} calculs en ${rhythm.secs / 60} minutes`),
          h("p", { class: "ch-sub" }, `${rhythm.icon} ${rhythm.name} · Période ${period}`),
          best ? h("p", { class: "ch-rec" }, `🏅 Ton record : ${pl(best, "point")}`) : null,
          h("ul", { class: "ch-rules" },
            h("li", {}, "Un point par réponse juste."),
            h("li", {}, "Tu peux passer un calcul et y revenir : touche son numéro."),
            h("li", {}, "La correction et les astuces arrivent à la fin."))),
        h("button", { class: "btn big green ch-go", type: "button", onclick: start }, "Je commence ▶"),
        h("button", { class: "btn ghost", type: "button", onclick: () => { store.set("game", "chrono"); go("exercices"); } }, "Changer de rythme ou de période"),
        h("div", { class: "kbd-hint" }, "Clavier : chiffres et virgule · Entrée ou Tab pour le suivant · ← → pour naviguer · Échap pour la pause")));
  }

  // ---------- l'épreuve ----------
  let timeEl, barEl, countEl, cellsEl, cardEl, noteEl, finishBtn, mainEl;
  function start() {
    sfx.tap();
    problems = makeFiche(period, rhythm.id); answers = problems.map(() => ""); i = 0; seen = new Set([0]); used = 0; timeUp = false;
    root._sheet = problems; // pour les parcours automatiques (tools/flow-chrono.mjs)
    phase = "run";
    timeEl = h("span", { class: "ch-time", role: "timer", "aria-label": "Temps restant" }, "");
    barEl = h("div", { class: "bar-fill" });
    countEl = h("span", { class: "pill ch-count" }, "");
    cellsEl = h("div", { class: "ch-cells", role: "group", "aria-label": "Les calculs de la fiche" }, problems.map((p, k) =>
      h("button", { class: "ch-cell", type: "button", "data-i": k, onclick: () => { sfx.tap(); goTo(k); } }, h("span", { class: "ch-n" }, String(k + 1)), h("span", { class: "ch-v" }, ""))));
    cardEl = h("div", { class: "q-card ch-card" });
    noteEl = h("div", { class: "ch-note", "aria-live": "polite" });
    const key = (label, k, cls = "", aria) => h("button", { class: "key " + cls, type: "button", "aria-label": aria || label, onclick: () => { sfx.tap(); press(k); } }, label);
    const pad = h("div", { class: "keypad ch-pad" }, [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => key(String(d), String(d))),
      key(",", ",", "key-comma", "Virgule"), key("0", "0"), key("⌫", "del", "key-del", "Effacer"));
    finishBtn = h("button", { class: "btn ghost small ch-finish", type: "button", onclick: () => pause("finish") }, "J'ai fini ✓");
    mainEl = h("div", { class: "ch-main" }, cellsEl,
      h("div", { class: "ch-work" }, cardEl, noteEl, pad,
        h("div", { class: "ch-nav" },
          h("button", { class: "btn light ch-prev", type: "button", "aria-label": "Calcul précédent", onclick: () => { sfx.tap(); prev(); } }, "‹"),
          h("button", { class: "btn green ch-next", type: "button", onclick: () => { sfx.tap(); next(); } }, "Suivant ›"),
          finishBtn)));
    root.replaceChildren(
      h("div", { class: "topbar ch-top" }, iconBtn("close", "Pause", () => pause("pause")),
        h("div", { class: "ch-timer" }, timeEl, h("div", { class: "bar" }, barEl)), countEl),
      mainEl);
    resume();
    draw();
  }
  function resume() {
    phase = "run"; startedAt = Date.now();
    clearInterval(tick); tick = setInterval(onTick, 250); onTick();
  }
  function onTick() {
    const left = remaining();
    timeEl.textContent = "⏳ " + clock(left);
    barEl.style.transform = `scaleX(${Math.max(0, Math.min(1, left / total))})`;
    barEl.classList.toggle("low", left <= 30000);
    if (left <= 0 && phase === "run") { timeUp = true; finish(); }
  }
  function draw() {
    const p = problems[i], filledN = answers.filter((a) => a !== "").length;
    countEl.textContent = `${filledN} / ${problems.length}`;
    [...cellsEl.children].forEach((c, k) => {
      c.className = "ch-cell" + (k === i ? " cur" : "") + (answers[k] !== "" ? " done" : seen.has(k) ? " skip" : "");
      c.lastChild.textContent = answers[k];
      c.setAttribute("aria-label", `Calcul ${k + 1}${answers[k] !== "" ? " : " + answers[k] : seen.has(k) ? " : passé" : ""}`);
      if (k === i) c.setAttribute("aria-current", "true"); else c.removeAttribute("aria-current");
    });
    const cur = cellsEl.children[i];
    if (cellsEl.scrollWidth > cellsEl.clientWidth) cellsEl.scrollLeft = cur.offsetLeft - cellsEl.clientWidth / 2 + cur.offsetWidth / 2;
    else if (cellsEl.scrollHeight > cellsEl.clientHeight) cellsEl.scrollTop = cur.offsetTop - cellsEl.clientHeight / 2 + cur.offsetHeight / 2;
    const hole = h("span", { class: "ch-hole" + (answers[i] ? "" : " empty"), "aria-label": answers[i] ? "Ta réponse : " + answers[i] : "Ta réponse" }, answers[i] || "?", h("i", { class: "ch-caret", "aria-hidden": "true" }));
    cardEl.replaceChildren(h("div", { class: "q-fam" }, `Calcul ${i + 1} sur ${problems.length}`), eqEl(p, hole));
    finishBtn.classList.toggle("ready", filledN === problems.length);
  }
  function press(k) { if (phase !== "run") return; answers[i] = typeKey(answers[i], k); noteEl.textContent = ""; draw(); }
  function goTo(k) { if (phase !== "run") return; i = Math.max(0, Math.min(problems.length - 1, k)); seen.add(i); noteEl.textContent = ""; draw(); }
  function prev() { if (i > 0) goTo(i - 1); }
  function next() {
    if (phase !== "run") return;
    if (i < problems.length - 1) return goTo(i + 1);
    const b = blanks();
    if (b.length) { goTo(b[0]); noteEl.textContent = `Il te reste ${pl(b.length, "calcul")} sans réponse : en voici un.`; }
    else noteEl.textContent = "Tout est rempli ! Vérifie tes réponses, ou touche « J'ai fini ».";
  }

  // ---------- pause (le calcul est caché : la pause ne sert pas à réfléchir) ----------
  let pauseEl = null;
  function pause(why) {
    if (phase !== "run") return;
    stopClock(); phase = "pause";
    const b = blanks().length, left = remaining();
    pauseEl = h("div", { class: "card center ch-pause" },
      h("div", { class: "ch-big", "aria-hidden": "true" }, why === "finish" ? "✋" : "⏸"),
      h("h2", {}, why === "finish" ? "Tu veux finir ?" : "Pause"),
      h("p", {}, `${pl(problems.length - b, "réponse")} sur ${problems.length} · il reste ${clock(left)}`),
      b && why === "finish" ? h("p", { class: "muted small" }, `Il reste ${pl(b, "calcul")} sans réponse : ils ne comptent pas comme des erreurs.`) : null,
      h("button", { class: "btn big green", type: "button", onclick: unpause }, "▶ Je continue"),
      h("button", { class: "btn big light", type: "button", onclick: finish }, "✓ J'ai fini : voir mes points"),
      h("button", { class: "btn ghost-dark", type: "button", onclick: () => go("exercices") }, "Quitter sans compter cette fiche"));
    mainEl.classList.add("paused"); mainEl.append(pauseEl);
  }
  function unpause() {
    if (phase !== "pause") return;
    sfx.tap(); pauseEl.remove(); pauseEl = null; mainEl.classList.remove("paused");
    resume(); draw();
  }

  // ---------- fin : les points, ce qu'il faut reprendre, les astuces ----------
  let score = null;
  function finish() {
    if (phase === "end") return;
    stopClock(); phase = "end";
    score = scoreFiche(problems, answers);
    const secs = Math.min(rhythm.secs, Math.round(used / 1000)), now = new Date();
    const stamp = `${date}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    let r; store.update((s) => { r = afterFiche(s, { period, rhythm: rhythm.id, score, secs, date, stamp }); });
    sfx.level();
    results(r, secs);
    if (r.creatures.length) playEvolutions(r.creatures);
  }
  function fixRow(row, k) {
    const hers = h("s", { class: "ch-bad" }, row.text);
    const box = h("div", { class: "ch-hintbox" });
    const btn = h("button", { class: "btn small light", type: "button", "aria-expanded": "false", onclick: () => {
      sfx.tap(); const open = !box.firstChild;
      box.replaceChildren(...(open ? [hintPanel(row.p)] : [])); btn.textContent = open ? "Fermer l'astuce" : "💡 L'astuce"; btn.setAttribute("aria-expanded", open ? "true" : "false");
    } }, "💡 L'astuce");
    return h("div", { class: "ch-fix" },
      h("div", { class: "ch-fix-n" }, String(k + 1)),
      h("div", { class: "grow" }, eqEl(row.p, hers, "small"), h("div", { class: "ch-good" }, "Bonne réponse : ", h("b", {}, fmtDec(row.p.a))), btn, box));
  }
  function results(r, secs) {
    const idx = (row) => score.rows.indexOf(row);
    const miss = score.rows.filter((x) => x.state === "miss"), todo = score.rows.filter((x) => x.state === "todo");
    const stars = h("div", { class: "stars" }, [1, 2, 3].map((n) => h("span", { class: "star" + (n <= r.stars ? " on" : ""), style: { animationDelay: 0.3 + n * 0.25 + "s" } }, "★")));
    [1, 2, 3].forEach((n) => { if (n <= r.stars) setTimeout(() => sfx.star(n), 300 + n * 250); });
    const rec = r.record.beaten ? `🏅 Nouveau record ! (avant : ${r.record.before})` : r.record.first ? "🏅 Ton premier record à ce rythme est enregistré." : `Ton record à ce rythme : ${pl(r.record.best, "point")}`;
    const todoBox = h("div", { class: "ch-todo-list" });
    const todoBtn = todo.length ? h("button", { class: "btn small light", type: "button", onclick: () => {
      sfx.tap(); const open = !todoBox.firstChild;
      todoBox.replaceChildren(...(open ? todo.map((row) => h("div", { class: "ch-todo" }, h("span", { class: "ch-fix-n" }, String(idx(row) + 1)), solved(row.p))) : []));
      todoBtn.textContent = open ? "Cacher les réponses" : "Voir les réponses";
    } }, "Voir les réponses") : null;
    root.replaceChildren(h("div", { class: "screen-body result ch-result" },
      h("h1", { class: "result-title" }, timeUp ? "⏳ Les minutes sont passées !" : "Fiche terminée !"),
      stars,
      h("div", { class: "card center ch-points" }, h("div", { class: "ch-points-l" }, "Mes points"), h("div", { class: "big-num" }, `${score.ok}`),
        h("p", {}, `sur ${score.total} · 1 point par réponse juste`),
        h("p", { class: "ch-meta" }, `${rhythm.icon} ${rhythm.name} · Période ${period} · ${timeUp ? "tout le temps utilisé" : "en " + longTime(secs)}`),
        h("p", { class: "ch-rec" }, rec)),
      !miss.length && !todo.length ? h("div", { class: "card center" }, h("p", { class: "note" }, "💯 Zéro faute, et tout est fait : bravo !")) : null,
      r.trophies.length ? h("div", { class: "card" }, h("h2", {}, "🏆 Nouveau" + (r.trophies.length > 1 ? "x" : "") + " trophée" + (r.trophies.length > 1 ? "s" : "") + " !"), r.trophies.map((t) => h("p", { class: "note" }, trophyLabel(t.line, t.tier)))) : null,
      r.creatures.length ? h("div", { class: "card center" }, h("h2", {}, r.creatures.some((e) => e.from === 0) ? "🥚 Une créature est née !" : "🌟 Ta créature évolue !"), r.creatures.map((e) => creatureCard(e))) : null,
      r.missions.length ? h("div", { class: "card" }, h("h2", {}, "🧭 Mission accomplie !"), r.missions.map((m) => h("p", { class: "note" }, missionText(m, date)))) : null,
      miss.length ? h("div", { class: "card ch-fixes" }, h("h2", {}, `🔧 À reprendre (${miss.length})`), h("p", { class: "muted small" }, "Regarde l'astuce, puis refais-les tranquillement, sans chrono."), miss.map((row) => fixRow(row, idx(row)))) : null,
      miss.length ? h("button", { class: "btn big green ch-redo", type: "button", onclick: () => redo(miss, "Je refais mes erreurs") }, `🔁 Refaire mes erreurs (${miss.length})`) : null,
      todo.length ? h("div", { class: "card ch-todos" }, h("h2", {}, `⏳ Pas encore faits (${todo.length})`), h("p", { class: "muted small" }, "Ils ne comptent pas comme des erreurs. Tu peux les faire maintenant, sans chrono."),
        h("button", { class: "btn light ch-do-todo", type: "button", onclick: () => redo(todo, "Je finis ma fiche") }, `✏️ Les faire maintenant (${todo.length})`), todoBtn, todoBox) : null,
      h("button", { class: "btn big " + (miss.length ? "light" : "green") + " ch-again", type: "button", onclick: () => { ready(); } }, "Nouvelle fiche"),
      h("button", { class: "btn ghost big", type: "button", onclick: () => go("exercices") }, "Retour")));
  }

  // ---------- refaire sans chrono : réponse vérifiée tout de suite, astuce si besoin ----------
  let redoS = null;
  function redo(rows, title) {
    sfx.tap(); phase = "redo";
    redoS = { list: rows.map((x) => x.p), k: 0, input: "", locked: false, ok: 0, title };
    drawRedo();
  }
  function drawRedo() {
    const R = redoS, p = R.list[R.k];
    const hole = h("span", { class: "ch-hole" + (R.input ? "" : " empty") }, R.input || "?", h("i", { class: "ch-caret", "aria-hidden": "true" }));
    const card = h("div", { class: "q-card ch-card" }, h("div", { class: "q-fam" }, `${R.title} · ${R.k + 1} sur ${R.list.length}`), eqEl(p, hole), h("div", { class: "q-flash" }));
    const key = (label, k, cls = "", aria) => h("button", { class: "key " + cls, type: "button", "aria-label": aria || label, onclick: () => { sfx.tap(); redoPress(k); } }, label);
    const pad = h("div", { class: "keypad ch-pad" }, [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => key(String(d), String(d))),
      key(",", ",", "key-comma", "Virgule"), key("0", "0"), key("⌫", "del", "key-del", "Effacer"));
    root.replaceChildren(
      h("div", { class: "topbar ch-top" }, iconBtn("close", "Arrêter", () => ready()), h("div", { class: "bar" }, h("div", { class: "bar-fill", style: { width: 100 * R.k / R.list.length + "%" } })), h("span", { class: "pill" }, `${R.k + 1} / ${R.list.length}`)),
      h("div", { class: "ch-main ch-redo-main" }, h("div", { class: "ch-work" }, card, pad,
        h("button", { class: "btn big green ch-check", type: "button", onclick: redoCheck }, "Valider ✓"))));
    R.card = card; R.hole = hole;
  }
  function redoPress(k) {
    const R = redoS; if (!R || R.locked) return;
    R.input = typeKey(R.input, k);
    R.hole.className = "ch-hole" + (R.input ? "" : " empty"); R.hole.firstChild.textContent = R.input || "?";
  }
  function redoNext() {
    const R = redoS; clearTimeout(R.timer);
    if (R.k + 1 >= R.list.length) {
      root.replaceChildren(h("div", { class: "screen-body result" },
        h("h1", { class: "result-title" }, "Bravo, tout est repris ! 🎉"),
        h("div", { class: "card center" }, h("div", { class: "big-num" }, `${R.ok} / ${R.list.length}`), h("p", {}, "réussis du premier coup cette fois-ci")),
        h("button", { class: "btn big green", type: "button", onclick: () => ready() }, "Nouvelle fiche"),
        h("button", { class: "btn ghost big", type: "button", onclick: () => go("exercices") }, "Retour")));
      phase = "after"; return;
    }
    R.k++; R.input = ""; R.locked = false; drawRedo();
  }
  function redoCheck() {
    const R = redoS; if (!R || R.locked || !R.input) return;
    R.locked = true;
    const p = R.list[R.k], ok = sameValue(parseAnswer(R.input), p.a);
    if (ok) {
      R.ok++; sfx.ok(); R.card.classList.add("good"); R.card.querySelector(".q-flash").textContent = "✓ Bravo !";
      R.timer = setTimeout(redoNext, 800);
    } else {
      sfx.wrong(); R.card.classList.add("soft"); R.card.querySelector(".q-flash").textContent = `Presque ! La réponse : ${fmtDec(p.a)}`;
      root.querySelector(".ch-work").replaceChildren(R.card, h("div", { class: "wrong-zone" }, hintPanel(p), h("button", { class: "btn green big", type: "button", onclick: redoNext }, "J'ai compris →")));
    }
  }

  // ---------- clavier (iMac) et arrière-plan ----------
  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key, done = () => e.preventDefault();
    if (phase === "ready") { if (k === "Enter") { done(); start(); } return; }
    if (phase === "pause") { if (k === "Escape" || k === "Enter") { done(); unpause(); } return; }
    if (phase === "run") {
      if (/^\d$/.test(k)) { done(); press(k); }
      else if (k === "," || k === "." || k === "Decimal") { done(); press(","); }
      else if (k === "Backspace") { done(); press("del"); }
      else if (k === "Enter" || (k === "Tab" && !e.shiftKey) || k === "ArrowRight" || k === "ArrowDown") { done(); next(); }
      else if ((k === "Tab" && e.shiftKey) || k === "ArrowLeft" || k === "ArrowUp") { done(); prev(); }
      else if (k === "Escape") { done(); pause("pause"); }
      return;
    }
    if (phase === "redo" && redoS) {
      if (redoS.locked) { if (k === "Enter" || k === " ") { done(); redoNext(); } return; }
      if (/^\d$/.test(k)) { done(); redoPress(k); }
      else if (k === "," || k === "." || k === "Decimal") { done(); redoPress(","); }
      else if (k === "Backspace") { done(); redoPress("del"); }
      else if (k === "Enter") { done(); redoCheck(); }
    }
  };
  const onHide = () => { if (document.hidden && phase === "run") pause("pause"); };
  document.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onHide);

  ready();
  return { el: root, destroy: () => { clearInterval(tick); if (redoS) clearTimeout(redoS.timer); document.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onHide); } };
}
