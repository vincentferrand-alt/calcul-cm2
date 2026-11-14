// Nouveaux décors de la boutique (v0.16), dessinés ici en SVG/CSS originaux (aucune image externe, aucun personnage ni marque connus,
// pas de rose dominant) : ciels et lumières, objets posés au sol, fonds de saison et cadres du carnet.
// Animations en transform/opacity uniquement (CSS), coupées en mode « animations réduites » (html.calm), en pause en arrière-plan.

const f1 = (n) => Number(n.toFixed(1));
const strip = (svg) => svg.replace(/<\/?svg[^>]*>/g, "");

// ---------- fonds de saison (vue 400 × 300, ciel transparent : il est peint par la scène selon l'heure) ----------
const pumpkin = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <ellipse cx="0" cy="0" rx="17" ry="13" fill="#f08a24"/><ellipse cx="-8" cy="0" rx="9" ry="12.5" fill="#f59a3a"/><ellipse cx="8" cy="0" rx="9" ry="12.5" fill="#e8801f"/>
  <path d="M-1-12q1-7 5-8" stroke="#4f8f3a" stroke-width="3.2" fill="none" stroke-linecap="round"/>
  <circle cx="-6" cy="-3" r="2.4" fill="#5a2a00"/><circle cx="6" cy="-3" r="2.4" fill="#5a2a00"/><circle cx="-5.3" cy="-3.8" r=".8" fill="#fff"/><circle cx="6.7" cy="-3.8" r=".8" fill="#fff"/>
  <path d="M-7 3q7 7 14 0" stroke="#5a2a00" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>`;
const flw = (x, y, c, r = 3.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${f1(r * 0.4)}" fill="#e0a100"/>`;
const fir = (x, y, s) => {
  let t = `<rect x="${f1(x - 5 * s)}" y="${f1(y - 10 * s)}" width="${f1(10 * s)}" height="${f1(14 * s)}" fill="#6b4423"/>`;
  for (const [w, top, bot] of [[36, -46, -6], [28, -70, -32], [19, -90, -56]]) t += `<path d="M${x} ${f1(y + top * s)}L${f1(x + w * s)} ${f1(y + bot * s)}H${f1(x - w * s)}Z" fill="#2f8a55"/>`;
  return t;
};
export const SEASON_LANDS = {
  season_halloween: () => `<path d="M0 198Q100 174 200 192T400 184V300H0Z" fill="#d6ad5c"/>
    <path d="M0 228Q130 206 260 222T400 218V300H0Z" fill="#a8b94f"/><path d="M0 262Q200 244 400 262V300H0Z" fill="#8fae45"/>
    <rect x="62" y="168" width="8" height="42" rx="3" fill="#7a4d2a"/><circle cx="66" cy="160" r="20" fill="#e8a23a"/><circle cx="52" cy="170" r="13" fill="#d98a2a"/><circle cx="80" cy="168" r="14" fill="#f0b84a"/>
    ${[110, 140, 170, 200].map((x) => `<rect x="${x}" y="212" width="6" height="28" rx="2" fill="#9c6a3a"/>`).join("")}<path d="M108 220H208M108 232H208" stroke="#b9803f" stroke-width="4" stroke-linecap="round"/>
    ${pumpkin(90, 262, 1.15)}${pumpkin(300, 250, 1.35)}${pumpkin(346, 272, 0.9)}${pumpkin(250, 278, 0.75)}
    ${[[30, 250, 20, "#e0782a"], [196, 268, -30, "#d9b03a"], [376, 236, 40, "#e0782a"], [150, 284, 10, "#c9701f"]].map(([x, y, a, c]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3.2" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`).join("")}`,
  season_noel: () => `<path d="M0 196Q100 172 200 188T400 180V240H0Z" fill="#cfe3f5"/>
    <path d="M0 216Q120 198 240 212T400 206V300H0Z" fill="#eef7ff"/><path d="M0 254Q200 238 400 254V300H0Z" fill="#ffffff"/>
    ${fir(322, 262, 1.25)}
    <path d="M290 222Q322 236 356 220M298 196Q322 208 346 194M306 170Q322 178 338 168" stroke="#ffd84a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    ${[[300, 230, "#4cb8f0"], [344, 226, "#ffd84a"], [312, 204, "#ffffff"], [334, 200, "#4cb8f0"], [322, 180, "#ffd84a"], [296, 246, "#ffd84a"], [350, 244, "#ffffff"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}" stroke="#1f5f3a" stroke-width=".8"/>`).join("")}
    <path d="M322 134l4 8.6 9.4 1-7 6.4 2 9.2-8.4-4.8-8.4 4.8 2-9.2-7-6.4 9.4-1Z" fill="#ffd84a" stroke="#e0a100" stroke-width="1.2"/>
    ${[[246, 266, 22, "#4cb8f0", "#ffd84a"], [272, 274, 16, "#ffd84a", "#2f8a55"], [366, 272, 18, "#2fbf71", "#ffffff"]].map(([x, y, w, c, r]) => `<rect x="${x}" y="${y - w * 0.8}" width="${w}" height="${f1(w * 0.8)}" rx="2" fill="${c}"/><path d="M${x + w / 2} ${y - w * 0.8}V${y}M${x} ${f1(y - w * 0.4)}H${x + w}" stroke="${r}" stroke-width="3"/>`).join("")}
    ${[[60, 236], [120, 252], [190, 240], [40, 270]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="16" ry="4" fill="#dcebf8"/>`).join("")}
    <g class="sc-gold">${[[30, 40], [80, 90], [140, 30], [200, 70], [250, 20], [110, 140], [40, 160], [220, 130], [380, 60], [180, 180], [270, 100], [60, 110]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${2 + (i % 3)}" fill="#ffd84a" opacity=".85"/>`).join("")}</g>`,
  season_printemps: () => `<path d="M0 196Q90 162 190 186T400 172V300H0Z" fill="#a8e28e"/>
    <path d="M0 224Q120 194 250 214T400 206V300H0Z" fill="#7fd06b"/><path d="M0 258Q200 238 400 258V300H0Z" fill="#62bd58"/>
    <rect x="320" y="166" width="9" height="46" rx="3" fill="#8a5a33"/>
    ${[[324, 150, 24], [304, 164, 16], [344, 162, 17], [326, 132, 14]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff6d6"/>`).join("")}
    ${[[312, 146], [334, 140], [322, 160], [346, 156], [300, 160], [328, 124]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#ffd84a"/>`).join("")}
    ${[[40, 240, "#ffd84a"], [70, 262, "#fff"], [104, 236, "#7fc8ff"], [140, 270, "#9c8cff"], [176, 246, "#ffd84a"], [214, 272, "#fff"], [250, 238, "#7fc8ff"], [286, 262, "#ffd84a"], [356, 270, "#9c8cff"], [384, 244, "#fff"], [20, 278, "#7fc8ff"], [120, 286, "#ffd84a"], [236, 290, "#9c8cff"], [330, 290, "#fff"], [160, 226, "#fff"]].map(([x, y, c]) => flw(x, y, c, 4.2)).join("")}
    ${[[80, 150, "#ffd84a", "#4cc9f0"], [210, 120, "#ffffff", "#ffb347"]].map(([x, y, a, b]) => `<g transform="translate(${x} ${y}) scale(.9)"><path d="M12 10C7 0 0 1 1.5 7.5C2.5 11 8 11 12 10Z" fill="${a}" stroke="#5b3b00" stroke-width=".9"/><path d="M12 10C17 0 24 1 22.5 7.5C21.5 11 16 11 12 10Z" fill="${a}" stroke="#5b3b00" stroke-width=".9"/><path d="M12 10C8 12 3 14 5 18C7 20 10 15 12 10Z" fill="${b}" stroke="#5b3b00" stroke-width=".9"/><path d="M12 10C16 12 21 14 19 18C17 20 14 15 12 10Z" fill="${b}" stroke="#5b3b00" stroke-width=".9"/><rect x="11" y="4" width="2" height="12" rx="1" fill="#3a2a1a"/></g>`).join("")}`,
  season_ete: () => `<rect y="176" width="400" height="72" fill="#2f86bf"/><rect y="176" width="400" height="8" fill="#ffc46b" opacity=".75"/>
    ${[[150, 190, 100], [170, 204, 60], [182, 218, 36], [140, 230, 22]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="4" rx="2" fill="#ffb347" opacity=".75"/>`).join("")}
    <path d="M0 238Q140 222 260 232T400 228V300H0Z" fill="#f6d891"/><path d="M0 238Q140 222 260 232T400 228" stroke="#e8c374" stroke-width="5" fill="none"/>
    <path d="M42 272Q36 230 54 186" stroke="#9c6a3a" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M54 186Q28 176 10 192M54 186Q38 160 18 160M54 186Q66 160 86 162M54 186Q80 176 92 196" stroke="#3fa55a" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M300 262V214" stroke="#8a5a33" stroke-width="3"/><path d="M270 216Q300 192 330 216Z" fill="#4cb8f0"/><path d="M285 216Q300 196 315 216" fill="#ffd84a"/>
    <path d="M120 112L136 90L152 112L136 140Z" fill="#ffd84a" stroke="#c9881a" stroke-width="1.4"/><path d="M120 112H152M136 90V140" stroke="#4cb8f0" stroke-width="2"/>
    <path d="M136 140q-6 12 2 20t-2 22" stroke="#4cb8f0" stroke-width="2.4" fill="none"/><path d="M136 140Q190 210 222 260" stroke="#fff" stroke-width="1" opacity=".8" fill="none"/>
    <path d="M300 60L318 42L336 60L318 86Z" fill="#2ec4b6" stroke="#1b8a80" stroke-width="1.4"/><path d="M300 60H336M318 42V86" stroke="#ffb347" stroke-width="2"/>
    <path d="M318 86q8 10 0 18t4 18" stroke="#ffb347" stroke-width="2.4" fill="none"/><path d="M318 86Q330 180 340 266" stroke="#fff" stroke-width="1" opacity=".8" fill="none"/>
    <path d="M196 274a8 8 0 0 1 16 0Z" fill="#ff9f43"/><circle cx="96" cy="282" r="3" fill="#fff"/>`,
};
export const SEASON_SKY = { season_halloween: "#ffcf8a", season_noel: "#bfe3ff", season_printemps: "#a8e2ff", season_ete: "#ffc480" };
// Couleur du sol de la course (v0.15) pour ces fonds.
export const SEASON_GROUND = { season_halloween: "#a8b94f", season_noel: "#eef7ff", season_printemps: "#7fd06b", season_ete: "#f1cf86" };

// ---------- ciels et lumières (calque entre le ciel et le paysage) ----------
const LANTERN = `<svg viewBox="0 0 20 28" aria-hidden="true"><ellipse cx="10" cy="14" rx="10" ry="12" fill="#ffd84a" opacity=".28"/><path d="M4 7Q10 3 16 7L15 21Q10 24 5 21Z" fill="#ffb347" stroke="#c9701f" stroke-width="1"/><path d="M6.5 8Q10 6 13.5 8L13 19Q10 21 7 19Z" fill="#ffe08a"/><rect x="7" y="21" width="6" height="2.4" rx="1" fill="#c9701f"/></svg>`;
export function skyHTML(id, lite = false) {
  switch (id) {
    case "sky_aurore": return `<div class="sc-skyx sky-aurore" aria-hidden="true"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMin slice"><defs>
      <linearGradient id="au1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cf0c0" stop-opacity="0"/><stop offset=".55" stop-color="#5ee8b0" stop-opacity=".75"/><stop offset="1" stop-color="#2ec4b6" stop-opacity="0"/></linearGradient>
      <linearGradient id="au2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f9bff" stop-opacity="0"/><stop offset=".5" stop-color="#7a8cff" stop-opacity=".6"/><stop offset="1" stop-color="#4cc9f0" stop-opacity="0"/></linearGradient></defs>
      <g class="sx-wave"><path d="M-20 40Q60 10 120 50T260 40T420 30V110Q340 140 260 110T120 120T-20 110Z" fill="url(#au1)"/></g>
      <g class="sx-wave sx-w2"><path d="M-20 80Q80 50 160 86T320 70T420 80V140Q330 160 240 136T80 150T-20 140Z" fill="url(#au2)"/></g></svg></div>`;
    case "sky_arcenciel": return `<div class="sc-skyx sky-arcenciel" aria-hidden="true"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice">
      ${[["#ff5a4a", 168], ["#ffa040", 160], ["#ffd84a", 152], ["#5ccf6a", 144], ["#4cb8f0", 136], ["#5a6cf0", 128], ["#8f6cf0", 120]].map(([c, r]) => `<path d="M${200 - r} 230A${r} ${r} 0 0 1 ${200 + r} 230" stroke="${c}" stroke-width="8.5" fill="none"/>`).join("")}</svg></div>`;
    case "sky_filantes": return `<div class="sc-skyx sky-filantes" aria-hidden="true">${[[8, 6, 0], [44, 14, 2.3], [24, 30, 4.6], [62, 4, 6.1]].slice(0, lite ? 2 : 4).map(([x, y, dl]) => `<i class="sx-shoot" style="left:${x}%;top:${y}%;animation-delay:${dl}s"></i>`).join("")}${[[14, 20], [36, 8], [58, 26], [80, 12], [90, 30], [70, 40], [6, 40]].map(([x, y], i) => `<i class="sx-dot" style="left:${x}%;top:${y}%;animation-delay:-${i * 0.7}s"></i>`).join("")}</div>`;
    case "sky_lanternes": return `<div class="sc-skyx sky-lanternes" aria-hidden="true">${[[10, 8, 0, 6], [26, 11, 4, 4.5], [44, 9, 7, 5.5], [62, 12, 2, 4], [78, 10, 5.5, 6], [90, 13, 8.5, 4.5]].slice(0, lite ? 3 : 6).map(([x, d, dl, w]) => `<i class="sx-lan" style="left:${x}%;width:${w}%;--d:${d}s;--dl:-${dl}s">${LANTERN}</i>`).join("")}</div>`;
    case "sky_lune": return `<div class="sc-skyx sky-lune" aria-hidden="true"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMin slice">
      <circle class="sx-halo" cx="92" cy="74" r="62" fill="#ffd76a" opacity=".22"/><circle cx="92" cy="74" r="40" fill="#ffd76a"/><circle cx="92" cy="74" r="40" fill="#fff3c0" opacity=".35"/>
      <circle cx="78" cy="64" r="7" fill="#f0c050"/><circle cx="104" cy="88" r="9" fill="#f0c050"/><circle cx="104" cy="58" r="4" fill="#f0c050"/><circle cx="80" cy="92" r="4.5" fill="#f0c050"/></svg></div>`;
    default: return "";
  }
}

// ---------- objets posés au sol, à gauche (o1) et à droite (o2) de la créature ----------
const OBJ = {
  obj_lanterne: { w: 13, svg: `<svg viewBox="0 0 40 60" aria-hidden="true"><ellipse class="ob-glow" cx="20" cy="34" rx="20" ry="20" fill="#ffd84a" opacity=".35"/><path d="M20 4v6" stroke="#3a2a1a" stroke-width="2.4"/><circle cx="20" cy="4" r="3" fill="none" stroke="#3a2a1a" stroke-width="2"/><path d="M8 18L20 10L32 18Z" fill="#4a3424"/><rect x="10" y="18" width="20" height="30" rx="3" fill="#ffe08a" stroke="#4a3424" stroke-width="2.4"/><path d="M20 18v30M10 33h20" stroke="#4a3424" stroke-width="1.6"/><rect x="7" y="48" width="26" height="6" rx="2" fill="#4a3424"/><ellipse cx="20" cy="57" rx="14" ry="2.6" fill="rgba(0,0,0,.18)"/></svg>` },
  obj_coussin: { w: 16, svg: `<svg viewBox="0 0 60 40" aria-hidden="true"><ellipse cx="30" cy="37" rx="25" ry="3" fill="rgba(0,0,0,.18)"/><path d="M6 14Q4 34 10 34Q30 38 50 34Q56 34 54 14Q30 8 6 14Z" fill="#4cb8f0" stroke="#1f7aa8" stroke-width="2"/><path d="M10 15Q30 10 50 15Q48 20 30 20Q12 20 10 15Z" fill="#8ad8ff"/><circle cx="30" cy="25" r="2.6" fill="#1f7aa8"/><path d="M6 14l-4-4M54 14l4-4M10 34l-4 4M50 34l4 4" stroke="#ffd84a" stroke-width="3" stroke-linecap="round"/></svg>` },
  obj_cristaux: { w: 14, svg: `<svg viewBox="0 0 50 60" aria-hidden="true"><ellipse class="ob-glow" cx="25" cy="36" rx="24" ry="22" fill="#8be8de" opacity=".3"/><ellipse cx="25" cy="57" rx="20" ry="2.6" fill="rgba(0,0,0,.18)"/><path d="M20 56L16 22L24 6L30 22L28 56Z" fill="#2ec4b6" stroke="#167a72" stroke-width="1.6"/><path d="M24 6L22 50" stroke="#c9fff6" stroke-width="2" opacity=".8"/><path d="M30 56L32 30L40 20L44 32L40 56Z" fill="#8f9bff" stroke="#4a57d6" stroke-width="1.6"/><path d="M8 56L6 38L12 30L18 40L16 56Z" fill="#8be8de" stroke="#167a72" stroke-width="1.6"/><path d="M40 20l-3 30M12 30l-2 20" stroke="#ffffff" stroke-width="1.4" opacity=".7"/></svg>` },
  obj_cerfvolant: { w: 15, svg: `<svg viewBox="0 0 50 90" aria-hidden="true"><ellipse cx="25" cy="87" rx="10" ry="2.4" fill="rgba(0,0,0,.18)"/><path d="M25 86V58" stroke="#8a5a33" stroke-width="3" stroke-linecap="round"/><g class="ob-sway"><path d="M25 58Q34 40 26 30" stroke="#fff" stroke-width="1.2" fill="none"/><path d="M26 4L40 18L26 34L12 18Z" fill="#ffd84a" stroke="#c9881a" stroke-width="1.4"/><path d="M26 4V34M12 18H40" stroke="#4cb8f0" stroke-width="2"/><path d="M26 34q-6 6 0 11t0 11" stroke="#2ec4b6" stroke-width="2.4" fill="none"/><path d="M22 41l4 3 4-3M22 51l4 3 4-3" stroke="#ff9f43" stroke-width="2.4" fill="none" stroke-linecap="round"/></g></svg>` },
  obj_cabane: { w: 21, svg: `<svg viewBox="0 0 70 64" aria-hidden="true"><ellipse cx="35" cy="61" rx="32" ry="3" fill="rgba(0,0,0,.18)"/><rect x="48" y="8" width="7" height="16" fill="#7a4d2a"/><rect x="10" y="28" width="50" height="32" fill="#c9884a"/><path d="M10 36h50M10 44h50M10 52h50" stroke="#a86a32" stroke-width="1.6"/><path d="M4 30L35 6L66 30Z" fill="#8c4a2a" stroke="#5a2a14" stroke-width="2" stroke-linejoin="round"/><path d="M28 60V44a7 7 0 0 1 14 0V60Z" fill="#6b4423"/><circle cx="39" cy="52" r="1.4" fill="#ffd84a"/><rect x="14" y="36" width="10" height="9" rx="1" fill="#ffe08a" stroke="#6b4423" stroke-width="1.6"/><path d="M19 36v9M14 40.5h10" stroke="#6b4423" stroke-width="1.2"/></svg>` },
  obj_feu: { w: 15, svg: `<svg viewBox="0 0 50 50" aria-hidden="true"><ellipse class="ob-glow" cx="25" cy="30" rx="25" ry="20" fill="#ffb347" opacity=".3"/><g class="ob-flick"><path d="M25 8C28 16 34 19 34 27a9 9 0 0 1-18 0C16 21 21 18 22 12C24 16 24 17 25 8Z" fill="#ff8a2a"/><path d="M25 18C27 23 30 25 30 29a5 5 0 0 1-10 0C20 25 23 23 25 18Z" fill="#ffd84a"/></g><path d="M10 40L40 32M10 32L40 40" stroke="#7a4d2a" stroke-width="5" stroke-linecap="round"/>${[6, 14, 25, 36, 44].map((x, i) => `<ellipse cx="${x}" cy="${44 - (i % 2)}" rx="5" ry="3.6" fill="#a7b1c2" stroke="#7d879a" stroke-width="1"/>`).join("")}</svg>` },
  obj_panier: { w: 15, svg: `<svg viewBox="0 0 50 44" aria-hidden="true"><ellipse cx="25" cy="42" rx="20" ry="2.4" fill="rgba(0,0,0,.18)"/><path d="M10 20Q25 -2 40 20" stroke="#a86a32" stroke-width="3" fill="none"/><circle cx="18" cy="18" r="6" fill="#e8512f"/><circle cx="30" cy="16" r="6.5" fill="#ff9f43"/><circle cx="24" cy="12" r="5" fill="#ffd84a"/>${[[36, 20], [40, 16], [38, 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#7a68f0"/>`).join("")}<path d="M24 7l4-4" stroke="#4f8f3a" stroke-width="2.4" stroke-linecap="round"/><path d="M6 20H44L40 40H10Z" fill="#c9884a" stroke="#8a5a2a" stroke-width="1.6"/><path d="M8 27H42M9 33H41M16 20l2 20M25 20v20M34 20l-2 20" stroke="#8a5a2a" stroke-width="1.4"/></svg>` },
  obj_banc: { w: 20, svg: `<svg viewBox="0 0 70 40" aria-hidden="true"><ellipse cx="35" cy="38" rx="32" ry="2.4" fill="rgba(0,0,0,.18)"/><rect x="10" y="22" width="5" height="16" fill="#6b4423"/><rect x="55" y="22" width="5" height="16" fill="#6b4423"/><rect x="4" y="18" width="62" height="7" rx="2" fill="#a87447" stroke="#7a4d2a" stroke-width="1.4"/><rect x="12" y="4" width="4" height="16" fill="#6b4423"/><rect x="54" y="4" width="4" height="16" fill="#6b4423"/><rect x="8" y="5" width="54" height="6" rx="2" fill="#b9803f" stroke="#7a4d2a" stroke-width="1.4"/></svg>` },
};
export const objectWidth = (id) => (OBJ[id] ? OBJ[id].w : 15);
export function objectHTML(id, side = "left") {
  const o = OBJ[id]; if (!o) return "";
  return `<i class="sc-obj o-${side} ${id.replace("_", "-")}" style="width:${o.w}%">${o.svg}</i>`;
}

// ---------- cadres du carnet (vignettes de la boutique ; le cadre lui-même est en CSS : .frame-<id>) ----------
const FRAME_ICON = {
  frame_bois: `<rect x="3" y="3" width="34" height="34" rx="5" fill="none" stroke="#a86a32" stroke-width="6"/><path d="M6 10h6M28 30h6M10 34v-4" stroke="#7a4d2a" stroke-width="1.6"/>`,
  frame_etoiles: `<rect x="3" y="3" width="34" height="34" rx="5" fill="none" stroke="#24326f" stroke-width="6"/>${[[6, 6], [34, 6], [6, 34], [34, 34], [20, 4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#ffd84a"/>`).join("")}`,
  frame_givre: `<rect x="3" y="3" width="34" height="34" rx="5" fill="none" stroke="#bfe6ff" stroke-width="6"/><path d="M6 6l4 4M34 6l-4 4M6 34l4-4M34 34l-4-4" stroke="#ffffff" stroke-width="2"/>`,
  frame_or: `<defs><linearGradient id="fi-or" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".5" stop-color="#e0a100"/><stop offset="1" stop-color="#ffd84a"/></linearGradient></defs><rect x="3" y="3" width="34" height="34" rx="5" fill="none" stroke="url(#fi-or)" stroke-width="6"/>`,
  frame_nuages: `<rect x="5" y="5" width="30" height="30" rx="4" fill="none" stroke="#ffffff" stroke-width="5"/>${[[6, 6], [20, 4], [34, 6], [4, 20], [36, 20], [6, 34], [20, 36], [34, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="#ffffff" stroke="#bcd8ef" stroke-width=".8"/>`).join("")}`,
};
const SKY_ICON = {
  sky_aurore: `<rect width="40" height="40" rx="8" fill="#13286a"/><path d="M-2 14Q10 4 20 14T42 12V22Q30 30 20 22T-2 24Z" fill="#5ee8b0" opacity=".8"/><path d="M-2 22Q12 16 22 24T42 22V28Q30 34 20 30T-2 30Z" fill="#7a8cff" opacity=".7"/>`,
  sky_arcenciel: `<rect width="40" height="40" rx="8" fill="#9fdcff"/>${[["#ff5a4a", 16], ["#ffd84a", 13], ["#5ccf6a", 10], ["#4cb8f0", 7]].map(([c, r]) => `<path d="M${20 - r} 32A${r} ${r} 0 0 1 ${20 + r} 32" stroke="${c}" stroke-width="3" fill="none"/>`).join("")}`,
  sky_filantes: `<rect width="40" height="40" rx="8" fill="#1a2f6b"/><path d="M6 8L22 18M16 22L30 30M24 6L36 14" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/><circle cx="22" cy="18" r="2.2" fill="#fff6b0"/><circle cx="30" cy="30" r="2" fill="#fff6b0"/><circle cx="36" cy="14" r="1.8" fill="#fff6b0"/>`,
  sky_lanternes: `<rect width="40" height="40" rx="8" fill="#34337f"/><g transform="translate(6 12) scale(.7)">${strip(LANTERN)}</g><g transform="translate(22 4) scale(.8)">${strip(LANTERN)}</g>`,
  sky_lune: `<rect width="40" height="40" rx="8" fill="#13286a"/><circle cx="20" cy="20" r="15" fill="#ffd76a" opacity=".25"/><circle cx="20" cy="20" r="11" fill="#ffd76a"/><circle cx="16" cy="17" r="2.4" fill="#f0c050"/><circle cx="24" cy="24" r="3" fill="#f0c050"/>`,
};
export function extraIcon(id) {
  if (SKY_ICON[id]) return `<svg viewBox="0 0 40 40" aria-hidden="true">${SKY_ICON[id]}</svg>`;
  if (FRAME_ICON[id]) return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="8" y="8" width="24" height="24" fill="#22306f"/><circle cx="26" cy="14" r="3" fill="#fff4c8"/>${FRAME_ICON[id]}</svg>`;
  if (OBJ[id]) return OBJ[id].svg;
  return "";
}
