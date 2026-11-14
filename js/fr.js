// Petites règles de français (v0.14.1), pures et testées (tests/fr.test.mjs).
// de(mot) : « de » devant une consonne, « d' » devant une voyelle ou un h muet (« d'additions », « d'astuces », « d'Aurore »).
const VOWEL = /^[aeiouàâäéèêëîïôöùûüœæ]/i;
// h aspirés courants : on garde « de » (« de hiboux », « de héros »). Tous les autres h sont muets (« d'heures »).
const H_ASPIRE = ["haricot", "hibou", "héros", "hérisson", "hamster", "hache", "haut", "hutte", "houx", "hêtre", "hall", "harpe", "hangar", "hockey", "hublot", "huit"];

export function elide(word) {
  const w = String(word || "").trim();
  if (!w) return false;
  if (VOWEL.test(w)) return true;
  if (/^h/i.test(w)) { const low = w.toLowerCase(); return !H_ASPIRE.some((x) => low.startsWith(x)); }
  return false;
}
export const de = (word) => (elide(word) ? "d'" : "de ") + String(word || "").trim();
// Repère un « de » qui aurait dû être élidé (sert aux tests de tous les textes de l'appli).
export const badDe = (text) => {
  const out = [];
  for (const m of String(text).matchAll(/(^|[\s(«])[Dd]e ([^\s,.;:!?»)]+)/g)) if (elide(m[2])) out.push(m[0].trim());
  return out;
};
