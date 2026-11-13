// Outils de test : analyseur de nombres français, évaluateur d'égalités, analyseur de phrases dictées.
const VAL = { zéro: 0, un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60 };

export function parseFr(words) {
  const tok = words.split(/[\s-]+/).filter((t) => t && t !== "et");
  let total = 0, cur = 0;
  for (let i = 0; i < tok.length; i++) {
    const t = tok[i];
    if (t === "quatre" && /^vingts?$/.test(tok[i + 1] || "")) { cur += 80; i++; continue; }
    if (t === "cent" || t === "cents") { cur = (cur || 1) * 100; continue; }
    if (t === "mille") { total += (cur || 1) * 1000; cur = 0; continue; }
    if (!(t in VAL)) throw new Error("mot inconnu : " + t);
    cur += VAL[t];
  }
  return total + cur;
}

// Vérifie une égalité du type "47 + 40 = 87" ou "10 × 42 = 420 ; 2 × 42 = 84" (chaque segment séparé par « ; »).
export function checkEq(eq) {
  const clean = eq.replace(/ /g, "");
  for (const seg of clean.split(" ; ")) {
    const parts = seg.split(" = ");
    if (parts.length !== 2) throw new Error("égalité mal formée : " + eq);
    const expr = parts[0].replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
    if (!/^[\d\s+\-*/()]+$/.test(expr)) throw new Error("caractère inattendu dans : " + eq);
    const left = Function(`"use strict"; return (${expr})`)();
    if (left !== Number(parts[1])) throw new Error(`égalité fausse : ${eq} (calculé ${left})`);
  }
  return true;
}

// Relit une phrase dictée et en déduit la réponse attendue.
export function answerFromSay(say) {
  let m;
  const N = "([a-zéèêàç\\s-]+?)";
  if ((m = say.match(new RegExp(`^combien pour aller de ${N} à ${N}$`)))) return parseFr(m[2]) - parseFr(m[1]);
  if ((m = say.match(new RegExp(`^combien fois ${N} égale ${N}$`)))) return parseFr(m[2]) / parseFr(m[1]);
  if ((m = say.match(new RegExp(`^${N} fois combien égale ${N}$`)))) return parseFr(m[2]) / parseFr(m[1]);
  if ((m = say.match(new RegExp(`^${N} divisé par ${N}$`)))) return parseFr(m[1]) / parseFr(m[2]);
  if ((m = say.match(new RegExp(`^${N} plus ${N}$`)))) return parseFr(m[1]) + parseFr(m[2]);
  if ((m = say.match(new RegExp(`^${N} moins ${N}$`)))) return parseFr(m[1]) - parseFr(m[2]);
  if ((m = say.match(new RegExp(`^${N} fois ${N}$`)))) return parseFr(m[1]) * parseFr(m[2]);
  if ((m = say.match(new RegExp(`^le double de ${N}$`)))) return 2 * parseFr(m[1]);
  if ((m = say.match(new RegExp(`^le triple de ${N}$`)))) return 3 * parseFr(m[1]);
  if ((m = say.match(new RegExp(`^le quadruple de ${N}$`)))) return 4 * parseFr(m[1]);
  if ((m = say.match(new RegExp(`^la moitié de ${N}$`)))) return parseFr(m[1]) / 2;
  if ((m = say.match(new RegExp(`^le tiers de ${N}$`)))) return parseFr(m[1]) / 3;
  if ((m = say.match(new RegExp(`^le quart de ${N}$`)))) return parseFr(m[1]) / 4;
  throw new Error("phrase non reconnue : " + say);
}
