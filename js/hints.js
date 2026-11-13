// Indices « coup de pouce » donnés AVANT la réponse : jamais le résultat, seulement le début de la méthode.

// Le nombre `a` apparaît-il (en entier, sans être collé à d'autres chiffres) dans le texte ?
export function hasNumber(text, a) {
  const t = String(text).replace(/(\d)[  ](?=\d{3}(\D|$))/g, "$1");
  return new RegExp(`(^|\\D)${a}(\\D|$)`).test(t);
}

export function nudgeLines(prob) {
  const earlier = prob.hint.steps.slice(0, -1); // la dernière étape donne la réponse : on ne la montre pas
  const first = earlier[0] || prob.hint.steps[0];
  const lines = [];
  if (first && !hasNumber(first.t, prob.a)) lines.push(first.t);
  if (earlier[0] && !hasNumber(earlier[0].eq, prob.a)) lines.push(earlier[0].eq);
  if (!lines.length) lines.push("Découpe le calcul en petites étapes : une opération facile à la fois.");
  return lines;
}

export const NUDGE_DELAY = { qcm: 12000, input: 16000 }; // millisecondes d'hésitation avant de proposer un coup de pouce
