// Créatures originales à collectionner (dessinées en SVG, aucune licence) : une par famille de calcul.
// Elles éclosent à 10 bonnes réponses dans leur famille, puis évoluent en 4 stades.
export const STAGE_XP = [0, 10, 50, 150, 350]; // bonnes réponses de la famille pour atteindre le stade 0..4
export const STAGE_NAMES = ["Œuf", "Bébé", "Jeune", "Adulte", "Légendaire"];

export const CREATURES = [
  { id: "add", name: "Pomplo", fam: "add", desc: "Un oiseau-soleil joyeux qui additionne tout ce qu'il trouve.", c1: "#ffe27a", c2: "#ffc233", c3: "#c78a00", belly: "#fff4c9", acc: "#ff8a3d", spot: "#ff9f43" },
  { id: "sub", name: "Frimo", fam: "sub", desc: "Un petit manchot des glaces, champion pour retirer et rendre.", c1: "#8fe0fa", c2: "#37b4e0", c3: "#146f94", belly: "#f1fbff", acc: "#ffb84a", spot: "#bff0ff" },
  { id: "mul", name: "Kroko", fam: "mul", desc: "Un dragonnet vert qui multiplie ses écailles chaque jour.", c1: "#7fe0a8", c2: "#34b073", c3: "#166a43", belly: "#e8fbe9", acc: "#ffcc4d", spot: "#a6f0c4" },
  { id: "dbl", name: "Duplo", fam: "dbl", desc: "Un renard à deux queues : il double et triple tout !", c1: "#ffb06d", c2: "#f0802c", c3: "#a24b10", belly: "#fff1e0", acc: "#fff", spot: "#ffd0a0" },
  { id: "frac", name: "Parto", fam: "frac", desc: "Une boule de gelée violette qui partage tout en parts égales.", c1: "#b6a9ff", c2: "#8068ee", c3: "#4a3bb0", belly: "#ece8ff", acc: "#ffd84a", spot: "#d3cbff" },
  { id: "comp", name: "Complo", fam: "comp", desc: "Un hibou turquoise qui trouve toujours ce qui manque.", c1: "#7eeadf", c2: "#25b9ad", c3: "#0d6c64", belly: "#e3fbf8", acc: "#ffb84a", spot: "#a5f3ea" },
  { id: "div", name: "Piko", fam: "div", desc: "Un hérisson roux qui partage ses pommes équitablement.", c1: "#e8a07e", c2: "#c8683f", c3: "#7d3a1c", belly: "#ffe9d6", acc: "#5a3320", spot: "#f0b99a" },
  { id: "trick", name: "Astro", fam: "trick", desc: "Un chat magicien des étoiles, plein de raccourcis secrets.", c1: "#8f9bff", c2: "#5663e6", c3: "#2a3396", belly: "#e8ebff", acc: "#ffd84a", spot: "#b6bdff" },
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
const star = (cx, cy, r, fill, extra = "") => {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`; }).join(" ");
  return `<polygon points="${pts}" fill="${fill}" ${extra}/>`;
};
const spark = (x, y, r, d) => `<g class="spark" style="animation-delay:${d}s"><path d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z" fill="#fff6b0" stroke="#ffd84a" stroke-width="1.5"/></g>`;
const tri = (x1, y1, x2, y2, x3, y3, fill, stroke) => `<path d="M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>`;

function face(c, st, owl) {
  const r = owl ? 13 : st === 1 ? 12 : st === 2 ? 10.5 : 9.5;
  const eye = (x) => `${owl ? `<circle cx="${x}" cy="108" r="19" fill="${c.belly}" stroke="${c.c3}" stroke-width="3"/>` : ""}<circle cx="${x}" cy="108" r="${r}" fill="#fff"/><circle cx="${x + 1.5}" cy="109.5" r="${r * 0.58}" fill="#1c2340"/><circle cx="${x + 3.5}" cy="106" r="${r * 0.2}" fill="#fff"/>`;
  return `${eye(80)}${eye(120)}<circle cx="68" cy="131" r="7" fill="#ffc48a" opacity=".55"/><circle cx="132" cy="131" r="7" fill="#ffc48a" opacity=".55"/>${owl ? "" : `<path d="M91 130Q100 139 109 130" fill="none" stroke="#1c2340" stroke-width="3.5" stroke-linecap="round"/>`}`;
}

// Éléments propres à chaque créature : { back, front, body? }
function features(c, st) {
  const big = st >= 3, k = st >= 2;
  switch (c.id) {
    case "add": return {
      back: `<ellipse cx="42" cy="135" rx="${big ? 18 : 13}" ry="${big ? 30 : 22}" transform="rotate(-18 42 135)" fill="${c.c2}" stroke="${c.c3}" stroke-width="3"/><ellipse cx="158" cy="135" rx="${big ? 18 : 13}" ry="${big ? 30 : 22}" transform="rotate(18 158 135)" fill="${c.c2}" stroke="${c.c3}" stroke-width="3"/>`,
      front: `<ellipse cx="100" cy="158" rx="34" ry="26" fill="${c.belly}"/><path d="M93 123L107 123L100 136Z" fill="${c.acc}" stroke="${c.c3}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M100 72Q92 ${k ? 44 : 54} 98 ${k ? 38 : 50}Q106 ${k ? 52 : 58} 100 72Z" fill="${c.acc}" stroke="${c.c3}" stroke-width="2.5"/>${k ? `<path d="M88 76Q76 54 80 48Q92 58 88 76Z" fill="${c.c2}" stroke="${c.c3}" stroke-width="2.5"/><path d="M112 76Q124 54 120 48Q108 58 112 76Z" fill="${c.c2}" stroke="${c.c3}" stroke-width="2.5"/>` : ""}` };
    case "sub": return {
      back: `<ellipse cx="40" cy="140" rx="12" ry="${big ? 30 : 24}" transform="rotate(14 40 140)" fill="${c.c3}"/><ellipse cx="160" cy="140" rx="12" ry="${big ? 30 : 24}" transform="rotate(-14 160 140)" fill="${c.c3}"/>`,
      front: `<ellipse cx="100" cy="150" rx="40" ry="36" fill="${c.belly}"/><path d="M92 123L108 123L100 136Z" fill="${c.acc}" stroke="${c.c3}" stroke-width="2.5" stroke-linejoin="round"/>
        ${tri(84, 78, 92, k ? 44 : 58, 100, 74, "#d9f6ff", c.c3)}${k ? tri(100, 74, 108, 44, 116, 78, "#d9f6ff", c.c3) : ""}` };
    case "mul": return {
      back: `<path d="M150 160Q196 170 190 124Q180 150 150 146Z" fill="${c.c2}" stroke="${c.c3}" stroke-width="3"/>${big ? `<path d="M52 110Q10 70 24 54Q50 66 62 96Z" fill="${c.acc}" stroke="${c.c3}" stroke-width="3"/><path d="M148 110Q190 70 176 54Q150 66 138 96Z" fill="${c.acc}" stroke="${c.c3}" stroke-width="3"/>` : ""}`,
      front: `<ellipse cx="100" cy="152" rx="36" ry="32" fill="${c.belly}"/>${k ? `<path d="M76 146h48M80 158h40M86 170h28" stroke="${c.c1}" stroke-width="3" stroke-linecap="round"/>` : ""}
        ${tri(78, 76, 70, 52, 90, 72, c.belly, c.c3)}${tri(122, 76, 130, 52, 110, 72, c.belly, c.c3)}${tri(94, 72, 100, k ? 50 : 60, 106, 72, c.c3, c.c3)}<circle cx="94" cy="127" r="2" fill="${c.c3}"/><circle cx="106" cy="127" r="2" fill="${c.c3}"/>` };
    case "dbl": return {
      back: `<path d="M58 160Q6 150 12 96Q40 112 62 140Z" fill="${c.c2}" stroke="${c.c3}" stroke-width="3"/><path d="M20 110Q14 104 12 96Q22 98 28 104Z" fill="#fff"/><path d="M142 160Q194 150 188 96Q160 112 138 140Z" fill="${c.c2}" stroke="${c.c3}" stroke-width="3"/><path d="M180 110Q186 104 188 96Q178 98 172 104Z" fill="#fff"/>${big ? `<path d="M64 170Q16 190 8 150Q36 150 62 156Z" fill="${c.c1}" stroke="${c.c3}" stroke-width="3"/>` : ""}`,
      front: `${tri(66, 86, 62, 50, 92, 72, c.c2, c.c3)}${tri(134, 86, 138, 50, 108, 72, c.c2, c.c3)}${tri(70, 78, 68, 60, 84, 72, c.belly, c.belly)}${tri(130, 78, 132, 60, 116, 72, c.belly, c.belly)}
        <ellipse cx="100" cy="142" rx="28" ry="20" fill="${c.belly}"/><ellipse cx="100" cy="128" rx="5" ry="3.5" fill="#1c2340"/>` };
    case "frac": return {
      back: k ? `<path d="M84 70Q76 44 66 40" stroke="${c.c3}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="66" cy="40" r="6" fill="${c.acc}" stroke="${c.c3}" stroke-width="2.5"/><path d="M116 70Q124 44 134 40" stroke="${c.c3}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="134" cy="40" r="6" fill="${c.acc}" stroke="${c.c3}" stroke-width="2.5"/>` : "",
      front: `<path d="M100 150L100 176A56 56 0 0 0 148 150Z" fill="${c.belly}" opacity=".9"/><path d="M100 150L148 150A56 56 0 0 0 100 94Z" fill="${c.c1}" opacity=".55"/><path d="M100 150L52 150M100 150L100 94" stroke="${c.c3}" stroke-width="2" opacity=".5"/>
        ${big ? `<ellipse cx="46" cy="152" rx="9" ry="12" fill="${c.c2}" stroke="${c.c3}" stroke-width="3"/><ellipse cx="154" cy="152" rx="9" ry="12" fill="${c.c2}" stroke="${c.c3}" stroke-width="3"/>` : ""}` };
    case "comp": return {
      back: `<ellipse cx="38" cy="140" rx="14" ry="${big ? 34 : 26}" transform="rotate(10 38 140)" fill="${c.c2}" stroke="${c.c3}" stroke-width="3"/><ellipse cx="162" cy="140" rx="14" ry="${big ? 34 : 26}" transform="rotate(-10 162 140)" fill="${c.c2}" stroke="${c.c3}" stroke-width="3"/>`,
      front: `<ellipse cx="100" cy="158" rx="34" ry="26" fill="${c.belly}"/><path d="M84 150Q100 160 116 150M86 162Q100 172 114 162" fill="none" stroke="${c.c1}" stroke-width="3" stroke-linecap="round"/>
        ${tri(66, 80, 62, 46, 90, 70, c.c2, c.c3)}${tri(134, 80, 138, 46, 110, 70, c.c2, c.c3)}<path d="M93 128L107 128L100 142Z" fill="${c.acc}" stroke="${c.c3}" stroke-width="2.5" stroke-linejoin="round"/>
        ${big ? `<circle cx="80" cy="108" r="24" fill="none" stroke="${c.c3}" stroke-width="3" opacity=".6"/><circle cx="120" cy="108" r="24" fill="none" stroke="${c.c3}" stroke-width="3" opacity=".6"/>` : ""}` };
    case "div": {
      const nsp = k ? 13 : 9, spikes = Array.from({ length: nsp }, (_, i) => { const t = -165 + (i * 150) / (nsp - 1), r = (t * Math.PI) / 180, x = 100 + 54 * Math.cos(r), y = 128 + 54 * Math.sin(r), x2 = 100 + (big ? 86 : 78) * Math.cos(r), y2 = 128 + (big ? 86 : 78) * Math.sin(r), w = 9, nx = -Math.sin(r) * w, ny = Math.cos(r) * w; return `<path d="M${(x + nx).toFixed(1)} ${(y + ny).toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}Z" fill="${c.c3}"/>`; }).join("");
      return { back: spikes, front: `<ellipse cx="100" cy="146" rx="38" ry="34" fill="${c.belly}"/><circle cx="76" cy="76" r="9" fill="${c.c2}" stroke="${c.c3}" stroke-width="3"/><circle cx="124" cy="76" r="9" fill="${c.c2}" stroke="${c.c3}" stroke-width="3"/><ellipse cx="100" cy="124" rx="7" ry="5" fill="#2a160d"/>` };
    }
    case "trick": return {
      back: `<path d="M148 168Q196 168 186 120" fill="none" stroke="${c.c2}" stroke-width="12" stroke-linecap="round"/><path d="M148 168Q196 168 186 120" fill="none" stroke="${c.c3}" stroke-width="3" stroke-linecap="round" opacity=".5"/>${star(186, 112, 11, c.acc, `stroke="${c.c3}" stroke-width="2"`)}`,
      front: `<ellipse cx="100" cy="154" rx="34" ry="28" fill="${c.belly}"/>${tri(64, 88, 62, 54, 92, 74, c.c2, c.c3)}${tri(136, 88, 138, 54, 108, 74, c.c2, c.c3)}
        ${star(100, 86, k ? 10 : 8, c.acc, `stroke="${c.c3}" stroke-width="2"`)}<path d="M62 126L40 120M62 134L40 138M138 126L160 120M138 134L160 138" stroke="${c.c3}" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="100" cy="125" rx="4.5" ry="3" fill="${c.c3}"/>
        ${big ? `<path d="M66 78L100 8L134 78Z" fill="${c.c3}" stroke="#1c2340" stroke-width="3" stroke-linejoin="round"/><path d="M68 72Q100 84 132 72" fill="none" stroke="${c.acc}" stroke-width="6"/>${star(100, 40, 9, c.acc)}<path d="M150 158L176 112" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/>${star(178, 108, 12, c.acc, `stroke="${c.c3}" stroke-width="2"`)}` : ""}` };
    default: return { back: "", front: "" };
  }
}

const SCALE = [0, 0.7, 0.86, 0.98, 1.02];

export function creatureSVG(id, stage, uid = "c") {
  const c = creatureById(id);
  if (stage <= 0) return eggSVG({ a: c.c1, b: c.c2, spot: c.spot, uid: `${uid}-${id}` });
  const st = Math.min(4, stage), f = features(c, st), g = `${uid}-${id}-b`;
  const owl = id === "comp";
  const aura = st >= 4 ? `<circle cx="100" cy="125" r="92" fill="url(#${uid}-${id}-a)" class="aura"/>` : "";
  const halo = st >= 4 ? `<ellipse cx="100" cy="46" rx="30" ry="9" fill="none" stroke="#ffd84a" stroke-width="6"/><ellipse cx="100" cy="46" rx="30" ry="9" fill="none" stroke="#fff6b0" stroke-width="2"/>` : "";
  const sparks = st >= 4 ? spark(30, 56, 9, 0) + spark(172, 70, 7, 0.6) + spark(24, 150, 6, 1.1) + spark(178, 160, 8, 0.3) : "";
  const body = id === "frac" ? `<path d="M44 150Q40 80 100 76Q160 80 156 150Q154 188 100 190Q46 188 44 150Z" fill="url(#${g})" stroke="${c.c3}" stroke-width="4"/>`
    : `<ellipse cx="100" cy="132" rx="${id === "div" ? 52 : 56}" ry="${id === "div" ? 54 : 58}" fill="url(#${g})" stroke="${c.c3}" stroke-width="4"/>`;
  const feet = id === "frac" ? "" : `<ellipse cx="76" cy="190" rx="16" ry="8" fill="${c.c3}"/><ellipse cx="124" cy="190" rx="16" ry="8" fill="${c.c3}"/>`;
  return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.name}, stade ${STAGE_NAMES[st]}">
  <defs><radialGradient id="${g}" cx="38%" cy="30%" r="85%"><stop offset="0" stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></radialGradient>
  <radialGradient id="${uid}-${id}-a"><stop offset="0" stop-color="#fff2a8" stop-opacity=".75"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="100" cy="204" rx="${48 * SCALE[st] + 14}" ry="8" fill="#000" opacity=".16"/>
  <g transform="translate(100 196) scale(${SCALE[st]}) translate(-100 -196)">${aura}${f.back}${feet}${body}${f.front}${face(c, st, owl)}${halo}${sparks}</g>
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
