// Accessoires de la boutique : dessins SVG (coordonnées d'une créature : vue 200×220, visage centré en (100, 108)).
// Chaque accessoire a un dessin `front` (par-dessus la créature) et, parfois, `back` (derrière elle, comme une cape).
const P = (d, fill, stroke = "#1c2340", sw = 3) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
const C = (cx, cy, r, fill, stroke = "none", sw = 3) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const E = (cx, cy, rx, ry, fill, stroke = "none", sw = 3) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const star = (cx, cy, r, fill, stroke = "none") => {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`; }).join(" ");
  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
};

export const SLOTS = [
  { id: "head", name: "Chapeaux", emoji: "🎩" },
  { id: "face", name: "Lunettes", emoji: "🕶️" },
  { id: "neck", name: "Cou", emoji: "🧣" },
];

// price : en étoiles. Les prix restent petits : une étoile par série réussie, on en gagne plusieurs par jour.
export const ITEMS = [
  { id: "cap", slot: "head", name: "Casquette bleue", price: 4, front: P("M72 86Q72 56 100 56Q128 56 128 86Z", "#3b7de0") + P("M98 84h46q7 0 7 7h-53z", "#2a62bd") + C(100, 57, 4, "#ffd84a", "#1c2340", 2) },
  { id: "beanie", slot: "head", name: "Bonnet rayé", price: 6, front: P("M70 88Q70 54 100 54Q130 54 130 88Z", "#2ec4b6") + `<path d="M76 70Q100 62 124 70M72 80Q100 72 128 80" stroke="#ffd84a" stroke-width="5" fill="none"/>` + P("M68 86h64v10H68z", "#1f9e92") + C(100, 50, 9, "#fff", "#1c2340", 2.5) },
  { id: "flowers", slot: "head", name: "Couronne de fleurs", price: 5, front: [[76, 78, "#ffd84a"], [88, 72, "#fff"], [100, 70, "#ff9f43"], [112, 72, "#fff"], [124, 78, "#ffd84a"]].map(([x, y, c]) => C(x, y, 7, c, "#1c2340", 2) + C(x, y, 2.4, "#1c2340")).join("") },
  { id: "party", slot: "head", name: "Chapeau de fête", price: 8, front: P("M82 84L100 34L118 84Z", "#ffd84a") + `<path d="M87 70L113 70M92 56L108 56" stroke="#e8512f" stroke-width="5"/>` + C(100, 33, 6, "#4cc9f0", "#1c2340", 2.5) },
  { id: "wizard", slot: "head", name: "Chapeau de magicien", price: 12, front: P("M66 88L100 8L134 88Z", "#4a57d6") + E(100, 88, 40, 9, "#3a46b8", "#1c2340", 3) + star(100, 46, 8, "#ffd84a", "#1c2340") + star(88, 70, 5, "#ffd84a") + star(114, 64, 4, "#fff") },
  { id: "crown", slot: "head", name: "Couronne dorée", price: 20, front: P("M70 86L72 54L88 70L100 46L112 70L128 54L130 86Z", "#ffd84a") + C(100, 62, 4.5, "#e8512f", "#1c2340", 2) + C(80, 72, 3.5, "#4cc9f0", "#1c2340", 2) + C(120, 72, 3.5, "#2fbf71", "#1c2340", 2) },
  { id: "glasses", slot: "face", name: "Lunettes rondes", price: 5, front: `<circle cx="80" cy="108" r="17" fill="#fff" fill-opacity=".25" stroke="#1c2340" stroke-width="3.5"/><circle cx="120" cy="108" r="17" fill="#fff" fill-opacity=".25" stroke="#1c2340" stroke-width="3.5"/><path d="M97 106Q100 102 103 106M63 104L52 100M137 104L148 100" stroke="#1c2340" stroke-width="3.5" fill="none" stroke-linecap="round"/>` },
  { id: "shades", slot: "face", name: "Lunettes de soleil", price: 8, front: P("M62 98h36v14Q98 124 80 124Q62 124 62 112Z", "#1c2340", "#1c2340", 2.5) + P("M102 98h36v14Q138 124 120 124Q102 124 102 112Z", "#1c2340", "#1c2340", 2.5) + `<path d="M98 102h4M62 100L52 96M138 100L148 96" stroke="#1c2340" stroke-width="3.5" stroke-linecap="round"/><path d="M68 103l8 0M108 103l8 0" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>` },
  { id: "stars", slot: "face", name: "Lunettes étoiles", price: 12, front: star(80, 108, 22, "#ffd84a", "#1c2340") + star(120, 108, 22, "#ffd84a", "#1c2340") + C(80, 108, 8, "#fff", "none") + C(120, 108, 8, "#fff", "none") + `<path d="M99 106h2" stroke="#1c2340" stroke-width="4"/>` },
  { id: "bow", slot: "neck", name: "Nœud papillon", price: 5, front: P("M100 156L80 144L80 168Z", "#4cc9f0") + P("M100 156L120 144L120 168Z", "#4cc9f0") + C(100, 156, 6, "#2a9fc4", "#1c2340", 2.5) },
  { id: "scarf", slot: "neck", name: "Écharpe", price: 6, front: P("M52 146Q100 166 148 146L150 160Q100 182 50 160Z", "#2ec4b6") + `<path d="M62 152Q100 170 138 152M60 160Q100 178 140 160" stroke="#ffd84a" stroke-width="4" fill="none" opacity=".9"/>` + P("M126 164L142 196L124 196L114 170Z", "#2ec4b6") + `<path d="M120 182h20M122 190h18" stroke="#ffd84a" stroke-width="3.5"/>` },
  { id: "medal", slot: "neck", name: "Médaille d'or", price: 10, front: `<path d="M72 148L100 172L128 148" stroke="#4a57d6" stroke-width="6" fill="none" stroke-linejoin="round"/>` + C(100, 176, 13, "#ffd84a", "#1c2340", 3) + star(100, 176, 7, "#e0a800") },
  { id: "cape", slot: "neck", name: "Cape de héros", price: 15, back: P("M62 124Q30 170 24 204L176 204Q170 170 138 124Z", "#e8512f") + `<path d="M62 124Q100 150 138 124" stroke="#8c2412" stroke-width="3" fill="none"/>`, front: C(66, 138, 5, "#ffd84a", "#1c2340", 2) + C(134, 138, 5, "#ffd84a", "#1c2340", 2) + `<path d="M66 138Q100 154 134 138" stroke="#ffd84a" stroke-width="4" fill="none"/>` },
];
export const itemById = (id) => ITEMS.find((i) => i.id === id);

// Marques à insérer dans une créature : { back, front } pour ce qu'elle porte ({ head, face, neck } -> identifiants).
export function dressing(worn) {
  let back = "", front = "";
  for (const slot of ["neck", "face", "head"]) { // du plus bas au plus haut : le chapeau est toujours au-dessus
    const it = worn && worn[slot] ? itemById(worn[slot]) : null;
    if (!it || it.slot !== slot) continue;
    if (it.back) back += it.back;
    front += it.front;
  }
  return { back, front };
}

// Petite vignette d'un accessoire (pour la boutique) : l'accessoire seul, cadré.
const VIEW = { head: "56 4 88 100", face: "40 80 120 64", neck: "30 120 140 90" };
export function itemIcon(id) {
  const it = itemById(id);
  return `<svg viewBox="${VIEW[it.slot]}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${it.name}">${it.back || ""}${it.front}</svg>`;
}
