// Créatures originales à collectionner (dessinées en SVG, aucune licence) : une par famille de calcul.
// Les identifiants (add, sub, mul…) sont ceux des familles et ne changent JAMAIS : c'est la clé des sauvegardes.
// Elles éclosent à 10 bonnes réponses dans leur famille, puis évoluent en 4 stades.
import { dressing } from "./accessories.js";

export const STAGE_XP = [0, 10, 50, 150, 350]; // bonnes réponses de la famille pour atteindre le stade 0..4
export const STAGE_NAMES = ["Œuf", "Bébé", "Jeune", "Adulte", "Légendaire"];

// forms : nom de l'espèce à chaque stade ; story : l'histoire de chaque évolution (stades 1 à 4).
export const CREATURES = [
  { id: "add", name: "Braise", species: "Dragon", fam: "add", c1: "#ff9a6b", c2: "#e8512f", c3: "#8c2412", belly: "#ffe3b0", acc: "#ffd84a", spot: "#ffd84a",
    forms: ["Dragonneau", "Jeune dragon", "Dragon", "Dragon d'or"],
    desc: "Un dragon au grand cœur : chaque addition fait jaillir une flamme.",
    story: ["Une petite flamme, un grand bâillement : Braise le dragonneau est né !", "Ses ailes poussent et il sait déjà planer d'un coussin à l'autre.", "Braise est un vrai dragon : ses flammes réchauffent tous les calculs.", "Dragon d'or ! Son feu ne brûle pas, il fait briller tout ce qu'il touche."] },
  { id: "sub", name: "Mistral", species: "Chat", fam: "sub", c1: "#b6e8fb", c2: "#4cb6e6", c3: "#1b5f88", belly: "#f4fcff", acc: "#ffd84a", spot: "#d7f3ff",
    forms: ["Chaton des neiges", "Chat des neiges", "Chat des glaces", "Chat des étoiles"],
    desc: "Un chat des neiges silencieux, expert pour retirer ce qui est en trop.",
    story: ["Mistral, un chaton des neiges, ronronne déjà sur tes soustractions.", "Il bondit sur les calculs comme sur une souris de glace.", "Chat des glaces, il retire tout ce qui est en trop, sans un bruit.", "Chat des étoiles : une étoile brille sur son front."] },
  { id: "mul", name: "Filou", species: "Belette", fam: "mul", c1: "#e3c196", c2: "#b9803f", c3: "#6b4423", belly: "#fff1da", acc: "#2d2118", spot: "#d9b47e",
    forms: ["Belette", "Belette agile", "Belette rusée", "Hermine blanche"],
    desc: "Une belette qui se faufile partout et connaît ses tables par cœur.",
    story: ["Filou la belette se faufile partout et trouve le chemin le plus court.", "Il connaît déjà ses tables par cœur, même celles de 7 et de 8 !", "Filou a une queue au bout noir et plus d'un tour dans son sac.", "L'hiver est venu : Filou devient une hermine blanche comme la neige."] },
  { id: "dbl", name: "Roux", species: "Renard", fam: "dbl", c1: "#ffb978", c2: "#f0832f", c3: "#9c4510", belly: "#fff3e3", acc: "#fff", spot: "#ffd3a6",
    forms: ["Renardeau", "Renard", "Renard rusé", "Renard solaire"],
    desc: "Un renard malin qui double et triple tout ce qu'il touche.",
    story: ["Roux le renardeau est né, la queue en panache et l'œil malin.", "Il double chaque idée : un malin, deux malins !", "Un renard rusé, qui double et triple sans jamais se tromper.", "Le bout de sa queue s'enflamme : un esprit renard se réveille…"] },
  { id: "frac", name: "Rayure", species: "Tigre", fam: "frac", c1: "#f6f4ff", c2: "#cfc8f7", c3: "#4a3bb0", belly: "#ffffff", acc: "#ffd84a", spot: "#d9d3fa",
    forms: ["Tigreau blanc", "Jeune tigre", "Tigre blanc", "Tigre de la lune"],
    desc: "Un tigre blanc aux rayures violettes qui partage en parts bien égales.",
    story: ["Un bébé tigre blanc aux rayures violettes : Rayure est né !", "Il partage tout en parts bien égales, c'est le tigre le plus juste.", "Rayure grandit et ses rayures violettes brillent de plus en plus.", "Tigre de la lune : il rugit, et tous les nombres se rangent en parts égales !"] },
  { id: "comp", name: "Yuzu", species: "Kitsune à 4 queues", fam: "comp", c1: "#fff0c2", c2: "#f5c24d", c3: "#a06a08", belly: "#fffaf0", acc: "#2ec4b6", spot: "#8be8de",
    forms: ["Petit kitsune (1 queue)", "Kitsune à 2 queues", "Kitsune à 3 queues", "Kitsune à 4 queues"],
    desc: "Un renard-esprit qui trouve toujours ce qui manque, une queue de plus à chaque stade.",
    story: ["Yuzu, un petit renard-esprit, apparaît avec une seule queue.", "Une deuxième queue pousse ! Il sait toujours ce qui manque.", "Trois queues : une flamme bleue danse au bout de chacune.", "Quatre queues ! Yuzu complète tout, il trouve à coup sûr ce qui manque."] },
  { id: "div", name: "Luno", species: "Loup", fam: "div", c1: "#d3dbe8", c2: "#8c9cb6", c3: "#424f66", belly: "#f1f4f9", acc: "#ffd84a", spot: "#b7c3d6",
    forms: ["Louveteau", "Jeune loup", "Loup gris", "Loup de la pleine lune"],
    desc: "Un loup qui partage tout en parts égales pour que toute la meute en ait.",
    story: ["Luno, un louveteau, hurle à la lune sa toute première division.", "Il partage le butin en parts égales pour toute la meute.", "Un loup gris à la fourrure argentée veille sur les nombres.", "Loup de la pleine lune : toute la meute compte sur lui !"] },
  { id: "trick", name: "Aurore", species: "Kitsune à 9 queues", fam: "trick", c1: "#ffffff", c2: "#e4e7ff", c3: "#4a57d6", belly: "#ffffff", acc: "#ffd84a", spot: "#c9cfff",
    forms: ["Kitsune à 3 queues", "Kitsune à 5 queues", "Kitsune à 7 queues", "Kitsune à 9 queues"],
    desc: "Le grand esprit-renard des raccourcis : neuf queues pour neuf astuces.",
    story: ["Aurore, esprit-renard, apparaît avec trois queues scintillantes.", "Cinq queues, cinq astuces de plus dans son sac.", "Sept queues : les raccourcis des grands n'ont plus de secret.", "Neuf queues ! Aurore est le grand kitsune des astuces."] },
];
export const creatureById = (id) => CREATURES.find((c) => c.id === id);

export const stageForXp = (xp) => STAGE_XP.reduce((st, t, i) => (xp >= t ? i : st), 0);
export function progressInfo(xp) {
  const st = stageForXp(xp);
  if (st >= 4) return { stage: 4, pct: 100, remaining: 0, next: null };
  const lo = STAGE_XP[st], hi = STAGE_XP[st + 1];
  return { stage: st, pct: Math.round(100 * (xp - lo) / (hi - lo)), remaining: hi - xp, next: st + 1 };
}

// Fait éclore / évoluer : le stade atteint ne redescend jamais (fusion = maximum). Retourne les évolutions.
export function syncCreatures(s, date) {
  const events = [];
  for (const c of CREATURES) {
    const xp = s.fam[c.fam] ? s.fam[c.fam].xp : 0;
    const st = stageForXp(xp);
    const cur = s.cre[c.id] || { s: 0, d: {} };
    if (st > cur.s) {
      for (let k = cur.s + 1; k <= st; k++) if (!cur.d[k]) cur.d[k] = date;
      events.push({ id: c.id, from: cur.s, to: st });
      cur.s = st;
    }
    if (cur.s > 0 || s.cre[c.id]) s.cre[c.id] = cur;
  }
  return events;
}

// La créature mise en avant à l'accueil : la plus grande (puis celle qui a le plus d'expérience).
export function featured(s) {
  let best = null;
  for (const c of CREATURES) {
    const st = s.cre[c.id] ? s.cre[c.id].s : 0, xp = s.fam[c.fam] ? s.fam[c.fam].xp : 0;
    if (st < 1) continue;
    if (!best || st > best.st || (st === best.st && xp > best.xp)) best = { c, st, xp };
  }
  return best;
}

// ---------- dessin ----------
const f1 = (n) => Number(n.toFixed(1));
const star = (cx, cy, r, fill, extra = "") => {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; return `${f1(cx + rr * Math.cos(a))},${f1(cy + rr * Math.sin(a))}`; }).join(" ");
  return `<polygon points="${pts}" fill="${fill}" ${extra}/>`;
};
const spark = (x, y, r, d) => `<g class="spark" style="animation-delay:${d}s"><path d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z" fill="#fff6b0" stroke="#ffd84a" stroke-width="1.5"/></g>`;
const P = (d, fill, stroke, sw = 3, extra = "") => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
const E = (cx, cy, rx, ry, fill, stroke = "none", sw = 3, rot = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ""}/>`;
const tri = (x1, y1, x2, y2, x3, y3, fill, stroke) => P(`M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}Z`, fill, stroke);
// Oreille pointue : base centrée en (x, y), s = taille, lean = inclinaison (vers l'extérieur si > 0)
const ear = (x, y, s, lean, c, inner) => tri(f1(x - 14 * s), y, f1(x + lean * s), f1(y - 36 * s), f1(x + 14 * s), y, c.c2, c.c3) + tri(f1(x - 7 * s), f1(y - 2), f1(x + lean * 0.7 * s), f1(y - 24 * s), f1(x + 7 * s), f1(y - 2), inner, inner);
const stripes = (list, color, w = 4) => list.map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1}Q${(x1 + x2) / 2 + 3} ${(y1 + y2) / 2} ${x2} ${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`).join("");

// Queues de renard en éventail (derrière le corps) : n queues, dégradé du pelage vers le bout coloré.
function foxTails(n, c, tip, big = 1) {
  const span = n === 1 ? 0 : n === 2 ? 36 : n === 3 ? 50 : n === 4 ? 58 : 68;
  const angles = n === 1 ? [56] : Array.from({ length: n }, (_, i) => -span + (2 * span * i) / (n - 1));
  return [...angles].sort((a, b) => Math.abs(b) - Math.abs(a)).map((a) => {
    const r = (a * Math.PI) / 180, L = n === 1 ? 60 : n <= 4 ? 80 : 76, cx = f1(100 + Math.sin(r) * L), cy = f1(172 - Math.cos(r) * L * 0.85 + 6);
    const rx = f1((n >= 7 ? 11 : n >= 5 ? 12 : 15) * big), ry = f1((n >= 7 ? 34 : n >= 5 ? 36 : 38) * big);
    return `<g transform="rotate(${f1(a)} ${cx} ${cy})">${E(cx, cy, rx, ry, c.c2, c.c3, 3)}${E(cx, f1(cy - ry * 0.55), f1(rx * 0.86), f1(ry * 0.42), tip, "none")}</g>`;
  }).join("");
}

function face(c, st, o = {}) {
  const r = st === 1 ? 12 : st === 2 ? 10.5 : 9.5;
  const eye = (x) => `<circle cx="${x}" cy="108" r="${r}" fill="#fff"/><circle cx="${x + 1.5}" cy="109.5" r="${f1(r * 0.58)}" fill="#1c2340"/><circle cx="${x + 3.5}" cy="106" r="${f1(r * 0.2)}" fill="#fff"/>`;
  const nose = o.nose === false ? "" : `<ellipse cx="100" cy="123" rx="5" ry="3.5" fill="${o.noseColor || "#1c2340"}"/>`;
  return `${eye(80)}${eye(120)}<circle cx="66" cy="130" r="7" fill="#ffc48a" opacity=".5"/><circle cx="134" cy="130" r="7" fill="#ffc48a" opacity=".5"/>${nose}<path d="M91 130Q100 139 109 130" fill="none" stroke="#1c2340" stroke-width="3.2" stroke-linecap="round"/>`;
}

// Palette par stade (la belette devient une hermine blanche au dernier stade).
function palette(c, st) {
  if (c.id === "mul" && st >= 4) return { ...c, c1: "#ffffff", c2: "#f3f6fb", c3: "#5b6b82", belly: "#ffffff" };
  return c;
}

// Éléments propres à chaque espèce : back (derrière le corps) et front (devant le corps, sous le visage).
function features(c, st) {
  const k = st >= 2, big = st >= 3, top = st >= 4;
  const bellyOval = (rx = 36, ry = 30, cy = 154) => E(100, cy, rx, ry, c.belly);
  switch (c.id) {
    case "add": { // Dragon
      const wing = (s) => { const x = 100 + s * 54;
        return P(`M${x} 128Q${100 + s * (big ? 92 : 84)} ${big ? 66 : 84} ${100 + s * (big ? 84 : 78)} ${big ? 46 : 70}Q${100 + s * 66} ${big ? 84 : 94} ${100 + s * 52} 100Z`, c.c1, c.c3) + `<path d="M${x} 120Q${100 + s * 74} 90 ${100 + s * (big ? 82 : 76)} ${big ? 52 : 74}" stroke="${c.c3}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`; };
      return {
        back: (k ? wing(-1) + wing(1) : "") + P(`M148 168Q184 176 180 136`, "none", c.c2, 13) + P(`M148 168Q184 176 180 136`, "none", c.c3, 2.5, 'opacity=".5"') + tri(171, 140, 180, 114, 190, 140, c.acc, c.c3),
        front: bellyOval() + `<path d="M80 146h40M82 158h36M86 170h28" stroke="${c.c1}" stroke-width="3" stroke-linecap="round"/>`
          + tri(76, 82, 66, f1(big ? 40 : 52), 90, 76, c.belly, c.c3) + tri(124, 82, 134, f1(big ? 40 : 52), 110, 76, c.belly, c.c3)
          + (top ? P("M100 70Q86 44 100 26Q114 44 100 70Z", "#ffb02e", c.c3, 2.5) + P("M100 64Q94 48 100 38Q106 48 100 64Z", "#ffe27a", "none", 0) : "")
          + `<circle cx="93" cy="124" r="2.2" fill="${c.c3}"/><circle cx="107" cy="124" r="2.2" fill="${c.c3}"/>`, nose: false };
    }
    case "sub": // Chat des neiges
      return {
        back: P(`M52 170Q8 160 14 110Q22 96 32 112Q26 140 56 150Z`, c.c2, c.c3) + (big ? stripes([[22, 118, 30, 132], [24, 134, 34, 146]], c.c3, 3) : ""),
        front: bellyOval(34, 28) + ear(70, 84, 1, -4, c, c.belly) + ear(130, 84, 1, 4, c, c.belly)
          + stripes([[100, 76, 100, 88], [90, 78, 92, 88], [110, 78, 108, 88]], c.c3, 3.5)
          + (k ? `<path d="M52 126L30 118M52 134L30 140M148 126L170 118M148 134L170 140" stroke="${c.c3}" stroke-width="2.5" stroke-linecap="round"/>` : "")
          + (top ? star(100, 72, 8, c.acc, `stroke="${c.c3}" stroke-width="2"`) : ""), nose: true };
    case "mul": { // Belette
      return {
        back: P(`M146 172Q196 180 190 120Q182 112 174 126Q180 156 144 158Z`, c.c2, c.c3) + (k ? tri(180, 128, 186, 112, 192, 128, top ? c.c3 : "#2d2118", top ? c.c3 : "#2d2118") : ""),
        front: bellyOval(30, 34, 150) + E(68, 80, 9, 9, c.c2, c.c3) + E(132, 80, 9, 9, c.c2, c.c3) + E(68, 81, 4, 4, c.belly) + E(132, 81, 4, 4, c.belly)
          + (k ? `<path d="M56 128L36 124M56 136L36 142M144 128L164 124M144 136L164 142" stroke="${c.c3}" stroke-width="2.2" stroke-linecap="round"/>` : "")
          + (big ? `<path d="M88 168Q100 176 112 168" stroke="${c.c3}" stroke-width="3" fill="none" stroke-linecap="round"/>` : ""), nose: true };
    }
    case "dbl": // Renard
      return {
        back: foxTails(1, c, top ? "#ffb02e" : c.belly, big ? 1.08 : 1),
        front: bellyOval(32, 28) + ear(68, 84, 1.15, -6, c, c.belly) + ear(132, 84, 1.15, 6, c, c.belly)
          + P("M52 126Q60 140 76 132Q70 144 54 144Z", c.belly, "none", 0) + P("M148 126Q140 140 124 132Q130 144 146 144Z", c.belly, "none", 0)
          + (big ? star(100, 84, 6, c.acc, `stroke="${c.c3}" stroke-width="1.5"`) : ""), nose: true };
    case "frac": { // Tigre blanc
      const sw = c.c3;
      return {
        back: P(`M148 170Q200 176 192 124Q184 118 178 130Q184 160 146 160Z`, c.c2, c.c3) + stripes([[180, 134, 188, 134], [178, 146, 187, 148]], sw, 4),
        front: bellyOval(34, 28) + E(68, 82, 14, 13, c.c2, c.c3) + E(132, 82, 14, 13, c.c2, c.c3) + E(68, 83, 7, 7, c.belly) + E(132, 83, 7, 7, c.belly)
          + stripes([[100, 70, 100, 90], [88, 72, 90, 88], [112, 72, 110, 88], [48, 112, 62, 114], [46, 124, 60, 124], [152, 112, 138, 114], [154, 124, 140, 124], [70, 150, 82, 156], [130, 150, 118, 156]], sw, 4.5)
          + (big ? `<path d="M93 132l2 7 3-5 2 5 2-7" fill="#fff" stroke="${sw}" stroke-width="1.5" stroke-linejoin="round"/>` : "")
          + (top ? star(100, 66, 7, c.acc, `stroke="${sw}" stroke-width="1.5"`) : ""), nose: true, noseColor: "#4a3bb0" };
    }
    case "comp": // Kitsune à 4 queues (1, 2, 3, 4 selon le stade)
      return {
        back: foxTails(st, c, c.acc, 1),
        front: bellyOval(32, 28) + ear(68, 84, 1.15, -6, c, c.belly) + ear(132, 84, 1.15, 6, c, c.belly)
          + `<path d="M100 74l-5 12h10z" fill="${c.acc}" stroke="${c.c3}" stroke-width="1.5" stroke-linejoin="round"/>`
          + (big ? `<path d="M64 120q-10 6-8 16M136 120q10 6 8 16" stroke="${c.acc}" stroke-width="3" fill="none" stroke-linecap="round"/>` : "")
          + (top ? `<g class="spark">${P("M30 70Q22 58 30 46Q38 58 30 70Z", c.acc, "none", 0)}</g><g class="spark" style="animation-delay:.5s">${P("M172 78Q164 66 172 54Q180 66 172 78Z", c.acc, "none", 0)}</g>` : ""), nose: true };
    case "div": { // Loup
      const ruff = k ? P("M44 128l10-8 2 12 10-8 2 12 8-6M156 128l-10-8-2 12-10-8-2 12-8-6", "none", c.c3, 3) : "";
      return {
        back: (top ? E(100, 124, 84, 84, "#fff7c9", "none", 0).replace('fill="#fff7c9"', 'fill="#fff7c9" opacity=".32"') : "") + P(`M148 172Q202 176 190 118Q180 124 178 136Q176 160 146 160Z`, c.c2, c.c3),
        front: bellyOval(32, 28) + ear(66, 86, 1.25, -2, c, c.belly) + ear(134, 86, 1.25, 2, c, c.belly) + ruff
          + E(100, 128, 24, 17, c.belly, c.c3, 2.5)
          + (top ? `<path d="M100 66a9 9 0 1 0 6 14a7 7 0 1 1-6-14z" fill="${c.acc}" stroke="${c.c3}" stroke-width="1.5"/>` : ""), nose: true, wolf: true };
    }
    case "trick": // Kitsune à 9 queues (3, 5, 7, 9)
      return {
        back: (top ? E(100, 126, 88, 88, "#c9cfff", "none", 0).replace('fill="#c9cfff"', 'fill="#c9cfff" opacity=".3"') : "") + foxTails([0, 3, 5, 7, 9][st], c, c.acc, 1),
        front: bellyOval(34, 28) + ear(66, 84, 1.2, -6, c, "#cfd4ff") + ear(134, 84, 1.2, 6, c, "#cfd4ff")
          + star(100, 80, k ? 9 : 7, c.acc, `stroke="${c.c3}" stroke-width="1.8"`)
          + `<path d="M64 122q8 6 14 4M136 122q-8 6-14 4" stroke="${c.c3}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
          + (top ? `<ellipse cx="100" cy="52" rx="30" ry="8" fill="none" stroke="#ffd84a" stroke-width="5"/>` : ""), nose: true };
    default: return { back: "", front: "" };
  }
}

const SCALE = [0, 0.7, 0.86, 0.98, 1.02];

export function creatureSVG(id, stage, uid = "c", worn = null) {
  const base = creatureById(id), dress = dressing(worn);
  if (stage <= 0) return eggSVG({ a: base.c1, b: base.c2, spot: base.spot, uid: `${uid}-${id}` });
  const st = Math.min(4, stage), c = palette(base, st), f = features(c, st), g = `${uid}-${id}-b`;
  const aura = st >= 4 && c.id !== "div" && c.id !== "trick" ? `<circle cx="100" cy="125" r="92" fill="url(#${uid}-${id}-a)" class="aura"/>` : "";
  const sparks = st >= 4 ? spark(30, 56, 9, 0) + spark(172, 70, 7, 0.6) + spark(24, 150, 6, 1.1) + spark(178, 160, 8, 0.3) : "";
  const body = `<ellipse cx="100" cy="132" rx="56" ry="58" fill="url(#${g})" stroke="${c.c3}" stroke-width="4"/>`;
  const feet = `<ellipse cx="76" cy="190" rx="16" ry="8" fill="${c.c3}"/><ellipse cx="124" cy="190" rx="16" ry="8" fill="${c.c3}"/>`;
  return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${base.name}, ${base.forms[st - 1]}">
  <defs><radialGradient id="${g}" cx="38%" cy="30%" r="85%"><stop offset="0" stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></radialGradient>
  <radialGradient id="${uid}-${id}-a"><stop offset="0" stop-color="#fff2a8" stop-opacity=".75"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="100" cy="204" rx="${f1(48 * SCALE[st] + 14)}" ry="8" fill="#000" opacity=".16"/>
  <g transform="translate(100 196) scale(${SCALE[st]}) translate(-100 -196)">${aura}${f.back}${dress.back}${feet}${body}${f.front}${face(c, st, f)}${dress.front}${sparks}</g>
</svg>`;
}

// ---------- œufs ----------
export function eggSVG({ a = "#ffd75e", b = "#ffb703", spot = "#3aa6b9", uid = "egg", cracked = false } = {}) {
  return `<svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Un œuf">
  <defs><radialGradient id="${uid}-g" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>
  <ellipse cx="100" cy="236" rx="62" ry="10" fill="#000" opacity=".18"/>
  <path d="M100 18C150 18 176 100 176 152C176 202 142 228 100 228C58 228 24 202 24 152C24 100 50 18 100 18Z" fill="url(#${uid}-g)"/>
  <circle cx="70" cy="150" r="13" fill="${spot}" opacity=".85"/><circle cx="128" cy="120" r="9" fill="${spot}" opacity=".85"/><circle cx="122" cy="176" r="15" fill="${spot}" opacity=".85"/><circle cx="86" cy="96" r="6" fill="${spot}" opacity=".85"/>
  ${cracked ? `<path d="M30 140l22-14 18 16 20-18 20 16 20-16 20 14 18-12" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" opacity=".9"/><path d="M30 140l22-14 18 16 20-18 20 16 20-16 20 14 18-12" fill="none" stroke="#5b3b00" stroke-width="2" stroke-linejoin="round" opacity=".6"/>` : ""}
  <ellipse cx="72" cy="68" rx="12" ry="22" transform="rotate(25 72 68)" fill="#fff" opacity=".55"/>
</svg>`;
}
// Œuf d'une créature (se fissure à mi-chemin de l'éclosion).
export function creatureEgg(id, xp, uid = "e") {
  const c = creatureById(id);
  return eggSVG({ a: c.c1, b: c.c2, spot: c.spot, uid: `${uid}-${id}`, cracked: xp >= STAGE_XP[1] / 2 });
}
