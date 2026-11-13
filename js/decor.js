// Décors de la scène (v0.11) : fonds, météo animée, effets autour de la créature, petits animaux.
// Tout est dessiné ici, en SVG/CSS original (aucune image externe). Les IDENTIFIANTS sont stables : ce sont les clés de la
// sauvegarde (decor.owned / decor.pick). On peut en AJOUTER ; on ne renomme ni ne supprime jamais un id existant.

export const KINDS = [
  { id: "bg", name: "Fonds", emoji: "🏞️" },
  { id: "wx", name: "Météo", emoji: "🌦️" },
  { id: "fx", name: "Effets", emoji: "✨" },
  { id: "pet", name: "Animaux", emoji: "🦋" },
];
export const DEFAULT_BG = "bg_prairie";

// price : en étoiles (une série en rapporte 1 à 3). Début abordable, prix croissants ; la prairie est offerte.
export const DECOR = [
  { id: "bg_prairie", kind: "bg", name: "Prairie", price: 0 },
  { id: "bg_lac", kind: "bg", name: "Lac", price: 5 },
  { id: "bg_foret", kind: "bg", name: "Forêt", price: 8 },
  { id: "bg_plage", kind: "bg", name: "Plage", price: 10 },
  { id: "bg_montagne", kind: "bg", name: "Montagne", price: 12 },
  { id: "bg_desert", kind: "bg", name: "Désert", price: 14 },
  { id: "bg_banquise", kind: "bg", name: "Banquise", price: 16 },
  { id: "bg_nuit", kind: "bg", name: "Nuit étoilée", price: 20 },
  { id: "wx_feuilles", kind: "wx", name: "Feuilles qui tombent", price: 4 },
  { id: "wx_neige", kind: "wx", name: "Neige", price: 6 },
  { id: "wx_pluie", kind: "wx", name: "Pluie douce", price: 6 },
  { id: "wx_vent", kind: "wx", name: "Vent", price: 7 },
  { id: "wx_petales", kind: "wx", name: "Pétales", price: 9 },
  { id: "wx_lucioles", kind: "wx", name: "Lucioles", price: 12 },
  { id: "fx_etincelles", kind: "fx", name: "Étincelles", price: 5 },
  { id: "fx_aura", kind: "fx", name: "Aura", price: 8 },
  { id: "fx_coeurs", kind: "fx", name: "Cœurs d'étoiles", price: 10 },
  { id: "fx_flammes", kind: "fx", name: "Flammes", price: 12 },
  { id: "fx_eclairs", kind: "fx", name: "Éclairs", price: 15 },
  { id: "pet_papillons", kind: "pet", name: "Papillons", price: 4 },
  { id: "pet_oiseaux", kind: "pet", name: "Oiseaux", price: 6 },
  { id: "pet_libellules", kind: "pet", name: "Libellules", price: 7 },
  { id: "pet_lapin", kind: "pet", name: "Petit lapin", price: 8 },
  { id: "pet_poissons", kind: "pet", name: "Poissons volants", price: 9 },
  { id: "pet_chouette", kind: "pet", name: "Chouette", price: 11 },
];
export const decorById = (id) => DECOR.find((d) => d.id === id);
// Libellé « rien » pour chaque type facultatif.
export const NONE_LABEL = { wx: "Ciel calme", fx: "Sans effet", pet: "Personne" };

// Jour / soir / nuit selon l'heure réelle (sans rien acheter).
export function timeOfDay(hour) {
  if (hour >= 21 || hour < 6) return "night";
  if (hour >= 18 || hour < 8) return "eve";
  return "day";
}
export const TOD_NAMES = { day: "jour", eve: "soir", night: "nuit" };

// ---------- petites aides ----------
const f1 = (n) => Number(n.toFixed(1));
// Hasard déterministe (même scène = mêmes positions : captures stables, pas de « saut » au redessin).
export function seeded(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pine = (x, y, s, c, trunk = "#6b4423") => `<rect x="${f1(x - 2.5 * s)}" y="${f1(y - 4 * s)}" width="${f1(5 * s)}" height="${f1(8 * s)}" fill="${trunk}"/><path d="M${x} ${f1(y - 58 * s)}L${f1(x + 15 * s)} ${f1(y - 30 * s)}H${f1(x + 8 * s)}L${f1(x + 22 * s)} ${f1(y - 4 * s)}H${f1(x - 22 * s)}L${f1(x - 8 * s)} ${f1(y - 30 * s)}H${f1(x - 15 * s)}Z" fill="${c}"/>`;
const flower = (x, y, c) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.4" fill="#e0a100"/>`;

// ---------- fonds (vue 400 × 300, ciel transparent : il est peint par la scène selon l'heure) ----------
const LANDS = {
  bg_prairie: () => `<path d="M0 196Q90 160 190 186T400 172V300H0Z" fill="#9edc84"/>
    <path d="M0 224Q120 192 250 214T400 206V300H0Z" fill="#6cc65f"/>
    <path d="M0 258Q200 238 400 258V300H0Z" fill="#58b24f"/>
    <rect x="47" y="172" width="9" height="36" rx="3" fill="#8a5a33"/><circle cx="51" cy="160" r="22" fill="#4fae55"/><circle cx="38" cy="172" r="14" fill="#5cbf5c"/><circle cx="64" cy="170" r="15" fill="#47a14d"/>
    <ellipse cx="340" cy="214" rx="26" ry="12" fill="#4fae55"/><ellipse cx="322" cy="218" rx="14" ry="8" fill="#5cbf5c"/>
    ${[[96, 236, "#ffd84a"], [128, 252, "#fff"], [300, 240, "#ffd84a"], [334, 262, "#fff"], [366, 236, "#fff"], [72, 272, "#ffd84a"], [258, 270, "#fff"], [160, 276, "#ffd84a"]].map(([x, y, c]) => flower(x, y, c)).join("")}`,
  bg_lac: () => `<path d="M0 186L50 158L96 182L160 136L224 178L280 150L340 176L400 158V216H0Z" fill="#8fb3d6"/>
    <path d="M160 136L174 148L166 150L160 145L152 152L146 148Z" fill="#fff" opacity=".9"/><path d="M280 150L290 159L284 160L280 156L274 161L270 158Z" fill="#fff" opacity=".9"/>
    <path d="M0 206Q100 190 200 202T400 198V218H0Z" fill="#5aa860"/>
    <rect y="214" width="400" height="50" fill="#3d9fd6"/><rect y="214" width="400" height="9" fill="#73c6ee" opacity=".8"/>
    <g class="sc-shim"><path d="M58 232h40M218 228h30M300 246h44M118 252h36M30 248h18" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/></g>
    <path d="M0 258Q120 242 220 252T400 250V300H0Z" fill="#7dcb6b"/>
    <path d="M22 262V226M30 262V218M38 262V230M370 258V224M378 258V216" stroke="#3f8f45" stroke-width="3" stroke-linecap="round"/>
    <rect x="27" y="214" width="6" height="14" rx="3" fill="#8a5a33"/><rect x="375" y="212" width="6" height="14" rx="3" fill="#8a5a33"/>`,
  bg_foret: () => {
    let back = "", mid = "";
    for (let x = -10, i = 0; x <= 420; x += 34, i++) back += pine(x, 206 - (i % 2) * 6, 0.9, "#2f7a59", "#4d3420");
    for (let x = 7, i = 0; x <= 420; x += 46, i++) if (x < 130 || x > 270) mid += pine(x, 236 + (i % 2) * 4, 1.25, "#3b9562");
    return `<path d="M0 200Q200 186 400 200V300H0Z" fill="#4f9b58"/>${back}<path d="M0 232Q200 218 400 232V300H0Z" fill="#5fb052"/>${mid}
    <path d="M0 262Q200 248 400 262V300H0Z" fill="#6bbd5c"/>
    <rect x="300" y="262" width="5" height="10" fill="#fff4e0"/><path d="M292 264Q302 248 312 264Z" fill="#e8512f"/><circle cx="299" cy="259" r="1.8" fill="#fff"/><circle cx="305" cy="257" r="1.5" fill="#fff"/>
    <rect x="96" y="268" width="4" height="8" fill="#fff4e0"/><path d="M90 270Q98 258 106 270Z" fill="#ff9f43"/>`;
  },
  bg_plage: () => `<rect y="176" width="400" height="70" fill="#35a9da"/><rect y="176" width="400" height="8" fill="#6fd0f2"/>
    <g class="sc-wave"><path d="M-40 214q10-6 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke="#e8f8ff" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <path d="M0 236Q140 222 260 232T400 228V300H0Z" fill="#f6d891"/><path d="M0 236Q140 222 260 232T400 228" stroke="#e8c374" stroke-width="5" fill="none"/>
    <path d="M354 270Q348 230 366 186" stroke="#9c6a3a" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M366 186Q340 176 322 192M366 186Q350 160 330 160M366 186Q378 160 398 162M366 186Q392 176 404 196M366 186Q366 170 360 152" stroke="#3fa55a" stroke-width="8" fill="none" stroke-linecap="round"/>
    <circle cx="362" cy="192" r="5" fill="#8a5a33"/><circle cx="370" cy="194" r="5" fill="#7a4d2a"/>
    <path d="M70 266a7 7 0 0 1 14 0Z" fill="#ffb347"/><path d="M226 276l6-8 6 8Z" fill="#fff4e0"/><circle cx="150" cy="282" r="3" fill="#fff"/>`,
  bg_montagne: () => `<path d="M0 204L70 118L130 182L200 92L272 170L330 116L400 182V244H0Z" fill="#9aaecd"/>
    <path d="M200 92L223 120L211 116L200 127L189 117L177 122Z" fill="#fff"/><path d="M70 118L88 140L78 137L70 145L61 137L53 140Z" fill="#fff"/><path d="M330 116L347 138L338 135L330 142L322 135L313 138Z" fill="#fff"/>
    <path d="M0 226L90 168L160 214L250 160L340 210L400 188V262H0Z" fill="#7186ad"/>
    <path d="M250 160L266 176L258 175L250 182L243 175L235 177Z" fill="#eef4ff"/>
    <path d="M0 248Q200 226 400 248V300H0Z" fill="#69bb5c"/>
    <ellipse cx="60" cy="262" rx="18" ry="9" fill="#8d98ab"/><ellipse cx="66" cy="258" rx="9" ry="5" fill="#a7b1c2"/><ellipse cx="342" cy="270" rx="14" ry="7" fill="#8d98ab"/>
    ${[[110, 268, "#fff"], [280, 262, "#ffd84a"], [300, 280, "#fff"]].map(([x, y, c]) => flower(x, y, c)).join("")}`,
  bg_desert: () => `<path d="M0 206Q110 168 220 200T400 188V300H0Z" fill="#f3c27a"/>
    <path d="M286 192V164h14l6-10h40l6 10h14v28Z" fill="#d98d4f"/><path d="M300 164h52" stroke="#c27a40" stroke-width="3"/>
    <path d="M0 242Q130 214 250 236T400 230V300H0Z" fill="#eaa85a"/>
    <path d="M150 262q20-6 40 0M240 270q24-6 48 0M40 276q22-6 44 0" stroke="#d48f45" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M56 250V200q0-9 8-9t8 9v50Z" fill="#3fa56a"/><path d="M56 226h-8q-6 0-6-6v-10q0-5 4-5t4 5v8h6Z" fill="#3fa56a"/><path d="M72 218h7q5 0 5-6v-8q0-5-4-5t-4 5v6h-4Z" fill="#3fa56a"/>
    <path d="M60 204v40M68 204v40" stroke="#2f8a55" stroke-width="1.5"/>
    <ellipse cx="340" cy="264" rx="12" ry="5" fill="#c9884a"/>`,
  bg_banquise: () => `<rect y="196" width="400" height="56" fill="#4aa7d4"/><rect y="196" width="400" height="7" fill="#7fc8ec"/>
    <path d="M30 208L66 166L100 186L124 208Z" fill="#eaf7ff"/><path d="M66 166L80 208H54Z" fill="#cfe9fb"/>
    <path d="M286 204L316 176L346 190L376 206Z" fill="#f2fbff"/><path d="M316 176L328 204H306Z" fill="#d6edfb"/>
    <g class="sc-shim"><path d="M150 222h36M232 230h28M40 236h22" stroke="#e8f8ff" stroke-width="3" stroke-linecap="round" opacity=".7"/></g>
    <path d="M0 248Q120 230 230 242T400 238V300H0Z" fill="#f2f9ff"/>
    <path d="M30 262q30-6 60 0M180 270q40-8 80 0M300 258q30-5 60 0" stroke="#cfe5f7" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse cx="350" cy="276" rx="24" ry="9" fill="#e3f1fb"/>`,
  bg_nuit: () => {
    let trees = "";
    for (const [x, s] of [[300, 1.1], [330, 0.9], [356, 1.25], [384, 1], [18, 1.05], [44, 0.85]]) trees += pine(x, 236, s, "#14284a", "#14284a");
    return `<path d="M0 210Q100 180 200 200T400 190V300H0Z" fill="#284a7a"/>${trees}
    <path d="M0 244Q140 218 280 238T400 232V300H0Z" fill="#1d3a63"/>
    ${[[96, 262], [128, 274], [250, 268], [210, 280], [160, 258]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${2.6 + (i % 2)}" fill="#8ff0ff" opacity=".85"/>`).join("")}`;
  },
};
export const landSVG = (id) => `<svg class="sc-land" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${(LANDS[id] || LANDS[DEFAULT_BG])()}</svg>`;

// ---------- formes réutilisées (icônes et scène) ----------
const SH = {
  sparkle: (c = "#fff6b0", s = "#ffd84a") => `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0L12.4 7.6L20 10L12.4 12.4L10 20L7.6 12.4L0 10L7.6 7.6Z" fill="${c}" stroke="${s}" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  heart: (c = "#ffd84a", s = "#e0a100") => `<svg viewBox="0 0 20 18" aria-hidden="true"><path d="M10 16.5C-4 7.5 3.5-2.5 10 4.2C16.5-2.5 24 7.5 10 16.5Z" fill="${c}" stroke="${s}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="6.5" cy="6" r="1.6" fill="#fff" opacity=".8"/></svg>`,
  bolt: () => `<svg viewBox="0 0 20 40" aria-hidden="true"><path d="M12 1L2 22h8L6 39L18 14h-8Z" fill="none" stroke="#4cc9f0" stroke-width="5" stroke-linejoin="round" opacity=".45"/><path d="M12 1L2 22h8L6 39L18 14h-8Z" fill="#fff36b" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>`,
  flame: () => `<svg viewBox="0 0 20 30" aria-hidden="true"><path d="M10 0C13 8 20 11 20 19a10 10 0 0 1-20 0C0 13 5 10 6 4C8 8 9 9 10 0Z" fill="#ff8a2a"/><path d="M10 9C12 14 15 16 15 21a5 5 0 0 1-10 0C5 17 8 15 10 9Z" fill="#ffd84a"/></svg>`,
  butterfly: (a = "#ffd84a", b = "#4cc9f0") => `<svg viewBox="0 0 24 20" aria-hidden="true"><g class="pt-flap"><path d="M12 10C7 0 0 1 1.5 7.5C2.5 11 8 11 12 10Z" fill="${a}" stroke="#5b3b00" stroke-width=".9"/><path d="M12 10C17 0 24 1 22.5 7.5C21.5 11 16 11 12 10Z" fill="${a}" stroke="#5b3b00" stroke-width=".9"/><path d="M12 10C8 12 3 14 5 18C7 20 10 15 12 10Z" fill="${b}" stroke="#5b3b00" stroke-width=".9"/><path d="M12 10C16 12 21 14 19 18C17 20 14 15 12 10Z" fill="${b}" stroke="#5b3b00" stroke-width=".9"/></g><rect x="11" y="4" width="2" height="12" rx="1" fill="#3a2a1a"/></svg>`,
  bird: () => `<svg viewBox="0 0 30 14" aria-hidden="true"><path class="pt-wing" d="M2 4Q8 0 15 8Q22 0 28 4" stroke="#24324f" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  fish: (c = "#ffb347", d = "#ff8a2a") => `<svg viewBox="0 0 34 20" aria-hidden="true"><path d="M24 10L33 3V17Z" fill="${d}" stroke="#a85a00" stroke-width="1"/><path d="M3 10Q13 0 25 10Q13 20 3 10Z" fill="${c}" stroke="#a85a00" stroke-width="1"/><path d="M13 5Q16 10 13 15" stroke="#a85a00" stroke-width="1" fill="none"/><circle cx="8" cy="9" r="1.7" fill="#1c2340"/></svg>`,
  rabbit: () => `<svg viewBox="0 0 40 40" aria-hidden="true"><g class="pt-ears"><ellipse cx="17" cy="9" rx="3.6" ry="9" fill="#f4f1ec" stroke="#8a7f74" stroke-width="1.2"/><ellipse cx="25" cy="9" rx="3.6" ry="9" fill="#f4f1ec" stroke="#8a7f74" stroke-width="1.2" transform="rotate(14 25 14)"/><ellipse cx="17" cy="10" rx="1.6" ry="6" fill="#ffd9b8"/></g><ellipse cx="22" cy="30" rx="13" ry="9" fill="#f4f1ec" stroke="#8a7f74" stroke-width="1.2"/><circle cx="33" cy="28" r="4" fill="#fff" stroke="#8a7f74" stroke-width="1.2"/><circle cx="20" cy="21" r="8" fill="#f4f1ec" stroke="#8a7f74" stroke-width="1.2"/><circle cx="17" cy="20" r="1.5" fill="#1c2340"/><circle cx="13.5" cy="23" r="1.2" fill="#c77d52"/><ellipse cx="14" cy="38" rx="5" ry="2" fill="#e6e0d8"/></svg>`,
  owl: () => `<svg viewBox="0 0 40 48" aria-hidden="true"><rect x="6" y="38" width="28" height="10" rx="3" fill="#8a5a33"/><ellipse cx="20" cy="38" rx="14" ry="3" fill="#a87447"/><path d="M8 10L12 4L15 9M32 10L28 4L25 9" fill="#7a5233" stroke="#5a3a20" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="20" cy="24" rx="13" ry="15" fill="#9a6a40" stroke="#5a3a20" stroke-width="1.2"/><ellipse cx="20" cy="29" rx="8" ry="9" fill="#f1dcb8"/><g class="pt-blink"><circle cx="14" cy="17" r="5" fill="#fff"/><circle cx="26" cy="17" r="5" fill="#fff"/><circle cx="14" cy="17" r="2.4" fill="#1c2340"/><circle cx="26" cy="17" r="2.4" fill="#1c2340"/></g><path d="M18 21L20 25L22 21Z" fill="#ffb347"/><path d="M15 30l2 2 2-2 2 2 2-2" stroke="#c9a77a" stroke-width="1" fill="none"/></svg>`,
  dragonfly: () => `<svg viewBox="0 0 34 22" aria-hidden="true"><g class="pt-buzz"><ellipse cx="12" cy="6" rx="9" ry="3" fill="#bff3ff" stroke="#4cc9f0" stroke-width=".8" opacity=".85" transform="rotate(-18 12 6)"/><ellipse cx="22" cy="6" rx="9" ry="3" fill="#bff3ff" stroke="#4cc9f0" stroke-width=".8" opacity=".85" transform="rotate(18 22 6)"/><ellipse cx="12" cy="14" rx="8" ry="2.6" fill="#bff3ff" stroke="#4cc9f0" stroke-width=".8" opacity=".85" transform="rotate(14 12 14)"/><ellipse cx="22" cy="14" rx="8" ry="2.6" fill="#bff3ff" stroke="#4cc9f0" stroke-width=".8" opacity=".85" transform="rotate(-14 22 14)"/></g><path d="M17 4V21" stroke="#2a9fc4" stroke-width="2.6" stroke-linecap="round"/><circle cx="17" cy="4" r="2.6" fill="#2ec4b6"/></svg>`,
};

// ---------- météo (particules CSS, peu nombreuses) ----------
const WX = {
  wx_neige: { n: 14, kind: "fall", d: [7, 12], s: [4, 8], c: ["#ffffff"] },
  wx_pluie: { n: 14, kind: "fall", d: [0.9, 1.4], s: [2, 2], c: ["#dff3ff"] },
  wx_feuilles: { n: 9, kind: "fall", d: [8, 12], s: [10, 14], c: ["#f0a030", "#e0782a", "#d9b03a", "#b5682a"] },
  wx_petales: { n: 10, kind: "fall", d: [9, 13], s: [8, 11], c: ["#ffffff", "#fff1c9", "#ffe0b3"] },
  wx_vent: { n: 6, kind: "blow", d: [2.6, 4], s: [40, 80], c: ["#ffffff"] },
  wx_lucioles: { n: 9, kind: "glow", d: [5, 9], s: [5, 7], c: ["#f4ff9a"] },
};
export function weatherHTML(id, lite = false, seed = 1) {
  const w = WX[id]; if (!w) return "";
  const r = seeded(seed), n = lite ? Math.ceil(w.n / 2) : w.n, pick = (a) => a[Math.floor(r() * a.length)], rng = (lo, hi) => f1(lo + (hi - lo) * r());
  let out = "";
  for (let i = 0; i < n; i++) {
    const d = rng(...w.d), x = f1(((i + r() * 0.8) / n) * 100), s = rng(...w.s), c = pick(w.c);
    if (w.kind === "fall") out += `<i class="wx-p" style="--x:${x}%;--y:${rng(5, 85)}%;--dx:${rng(-24, 24)}px;--d:${d}s;--dl:-${rng(0, d)}s;--s:${s}px;--c:${c}"></i>`;
    else if (w.kind === "blow") out += `<i class="wx-w" style="--y:${rng(8, 80)}%;--x0:${rng(0, 80)}%;--d:${d}s;--dl:-${rng(0, d)}s;--s:${s}px"></i>`;
    else out += `<i class="wx-f" style="--x:${rng(6, 90)}%;--y:${rng(25, 85)}%;--dx:${rng(-26, 26)}px;--dy:${rng(-22, 18)}px;--d:${d}s;--dl:-${rng(0, d)}s;--s:${s}px"></i>`;
  }
  return `<div class="sc-wx ${id.replace("_", "-")}" aria-hidden="true">${out}</div>`;
}

// ---------- effets autour de la créature (dans la boîte de la créature, en %) ----------
// back : derrière la créature ; front : devant.
export function effectHTML(id, color = "#ffd84a") {
  const at = (x, y, w, cls, inner, extra = "") => `<i class="${cls}" style="left:${x}%;top:${y}%;width:${w}%;${extra}">${inner}</i>`;
  switch (id) {
    case "fx_aura": return { back: `<i class="fx-aura" style="--aura:${color}"></i>`, front: "" };
    case "fx_etincelles": return { back: "", front: [[4, 18, 13, 0], [80, 8, 11, 0.5], [88, 52, 9, 1.1], [0, 58, 10, 0.8], [64, -4, 8, 1.4], [22, -2, 9, 0.3]].map(([x, y, w, dl]) => at(x, y, w, "fx-spark", SH.sparkle(), `animation-delay:${dl}s`)).join("") };
    case "fx_flammes": return { back: [[-8, 56, 24, 0], [84, 54, 24, 0.3], [2, 30, 18, 0.6], [82, 28, 18, 0.15]].map(([x, y, w, dl]) => at(x, y, w, "fx-flame", SH.flame(), `animation-delay:${dl}s`)).join(""), front: [[-2, 76, 15, 0.2], [88, 76, 14, 0.5]].map(([x, y, w, dl]) => at(x, y, w, "fx-flame", SH.flame(), `animation-delay:${dl}s`)).join("") };
    case "fx_eclairs": return { back: "", front: [[-4, 4, 14, 0, 3.2], [86, 0, 13, 1.1, 4.1], [-8, 46, 11, 2, 3.7], [92, 44, 11, 0.6, 3.4]].map(([x, y, w, dl, d]) => at(x, y, w, "fx-bolt", SH.bolt(), `animation-delay:${dl}s;animation-duration:${d}s`)).join("") };
    case "fx_coeurs": return { back: "", front: [[6, 0, 0], [78, 1.2, 1], [30, 2.3, 0], [62, 0.6, 1], [92, 1.8, 0], [-2, 2.9, 1]].map(([x, dl, k]) => `<i class="fx-rise" style="left:${x}%;animation-delay:-${dl}s">${k ? SH.sparkle("#bff3ff", "#4cc9f0") : SH.heart()}</i>`).join("") };
    default: return { back: "", front: "" };
  }
}

// ---------- petits animaux ----------
export function petHTML(id) {
  const row = (y, d, dl, w, inner, anim = "cross") => `<i class="pt-row pt-${anim}" style="top:${y}%;animation-duration:${d}s;animation-delay:-${dl}s"><i class="pt-bob" style="width:${w}%">${inner}</i></i>`;
  switch (id) {
    case "pet_papillons": return row(36, 10, 0, 7, SH.butterfly(), "roam") + row(52, 13, 6, 6, SH.butterfly("#ffffff", "#ffb347"), "roam2");
    case "pet_oiseaux": return row(10, 12, 2, 7, SH.bird()) + row(18, 16, 9, 5.5, SH.bird());
    case "pet_poissons": return row(48, 10, 3, 8, SH.fish(), "swim") + row(62, 14, 9, 6.5, SH.fish("#7fd0ff", "#4cc9f0"), "swim");
    case "pet_libellules": return row(44, 8, 1, 8, SH.dragonfly(), "roam");
    case "pet_lapin": return `<i class="pt-sit pt-hop" style="left:7%;bottom:6%;width:13%">${SH.rabbit()}</i>`;
    case "pet_chouette": return `<i class="pt-sit" style="right:5%;bottom:5%;width:12%">${SH.owl()}</i>`;
    default: return "";
  }
}

// ---------- vignettes pour la boutique ----------
export function decorIcon(id) {
  const d = decorById(id);
  if (!d) return "";
  if (d.kind === "bg") return `<svg viewBox="40 120 320 180" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><rect x="0" y="0" width="400" height="300" fill="${id === "bg_nuit" ? "#1a2f6b" : id === "bg_desert" ? "#ffd9a0" : "#9fdcff"}"/>${(LANDS[id])().replace(/class="sc-[a-z]+"/g, "")}</svg>`;
  const ic = {
    wx_neige: `<svg viewBox="0 0 40 40" aria-hidden="true">${[[10, 10, 3.5], [26, 8, 2.5], [18, 22, 4], [32, 24, 3], [8, 30, 2.5], [24, 34, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#9cc9ee" stroke-width="1"/>`).join("")}</svg>`,
    wx_pluie: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 6l-3 10M22 4l-3 10M32 10l-3 10M14 22l-3 10M27 22l-3 10" stroke="#4cc9f0" stroke-width="3" stroke-linecap="round"/></svg>`,
    wx_feuilles: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 18Q8 6 20 6Q20 18 8 18Z" fill="#f0a030"/><path d="M20 34Q20 22 32 22Q32 34 20 34Z" fill="#e0782a"/><path d="M26 12Q26 4 34 4Q34 12 26 12Z" fill="#d9b03a"/></svg>`,
    wx_vent: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M4 14h22a5 5 0 1 0-5-5M4 22h28a5 5 0 1 1-5 5M4 30h14" stroke="#4a8fd0" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
    wx_petales: `<svg viewBox="0 0 40 40" aria-hidden="true">${[[12, 12, 20, "#fff1c9"], [28, 10, -30, "#ffe0b3"], [20, 26, 50, "#fff"], [32, 30, 10, "#fff1c9"], [8, 30, -20, "#ffe0b3"]].map(([x, y, a, c]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="${c}" stroke="#e8c374" stroke-width=".8" transform="rotate(${a} ${x} ${y})"/>`).join("")}</svg>`,
    wx_lucioles: `<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="8" fill="#1d3a63"/>${[[10, 12], [28, 10], [20, 24], [32, 30], [8, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#f4ff9a" opacity=".3"/><circle cx="${x}" cy="${y}" r="2.2" fill="#f4ff9a"/>`).join("")}</svg>`,
    fx_aura: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#ffd84a" opacity=".25"/><circle cx="20" cy="20" r="12" fill="#ffd84a" opacity=".45"/><circle cx="20" cy="20" r="6" fill="#fff6b0"/></svg>`,
    fx_etincelles: `<svg viewBox="0 0 40 40" aria-hidden="true"><g transform="translate(4 4) scale(.9)">${SH.sparkle().replace(/<\/?svg[^>]*>/g, "")}</g><g transform="translate(22 18) scale(.7)">${SH.sparkle().replace(/<\/?svg[^>]*>/g, "")}</g></svg>`,
    fx_coeurs: `<svg viewBox="0 0 40 40" aria-hidden="true"><g transform="translate(4 8) scale(1.1)">${SH.heart().replace(/<\/?svg[^>]*>/g, "")}</g><g transform="translate(24 4) scale(.6)">${SH.sparkle("#bff3ff", "#4cc9f0").replace(/<\/?svg[^>]*>/g, "")}</g></svg>`,
    fx_flammes: `<svg viewBox="0 0 40 40" aria-hidden="true"><g transform="translate(4 8)">${SH.flame().replace(/<\/?svg[^>]*>/g, "")}</g><g transform="translate(20 4) scale(1.1)">${SH.flame().replace(/<\/?svg[^>]*>/g, "")}</g></svg>`,
    fx_eclairs: `<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="8" fill="#24324f"/><g transform="translate(10 0)">${SH.bolt().replace(/<\/?svg[^>]*>/g, "")}</g></svg>`,
  }[id];
  if (ic) return ic;
  const pet = { pet_papillons: SH.butterfly(), pet_oiseaux: SH.bird(), pet_poissons: SH.fish(), pet_libellules: SH.dragonfly(), pet_lapin: SH.rabbit(), pet_chouette: SH.owl() }[id];
  return pet || "";
}
export const noneIcon = () => `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="none" stroke="#9fb0cc" stroke-width="3" stroke-dasharray="5 4"/></svg>`;
