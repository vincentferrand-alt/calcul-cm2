// Nombres en toutes lettres (français, orthographe traditionnelle), de 0 à 999 999.
const UNITS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];

function below100(n, terminal) {
  if (n < 17) return UNITS[n];
  if (n < 20) return "dix-" + UNITS[n - 10];
  if (n < 70) {
    const t = Math.floor(n / 10), u = n % 10;
    if (u === 0) return TENS[t];
    if (u === 1) return TENS[t] + " et un";
    return TENS[t] + "-" + UNITS[u];
  }
  if (n < 80) return n === 71 ? "soixante et onze" : "soixante-" + below100(n - 60, terminal);
  if (n === 80) return terminal ? "quatre-vingts" : "quatre-vingt";
  return "quatre-vingt-" + below100(n - 80, terminal);
}

function below1000(n, terminal) {
  if (n < 100) return below100(n, terminal);
  const h = Math.floor(n / 100), r = n % 100;
  const cent = h === 1 ? "cent" : UNITS[h] + " cent" + (r === 0 && terminal ? "s" : "");
  return r ? cent + " " + below100(r, terminal) : cent;
}

export function enLettres(n) {
  if (!Number.isInteger(n) || n < 0 || n > 999999) throw new RangeError("nombre hors limites : " + n);
  if (n === 0) return "zéro";
  const th = Math.floor(n / 1000), r = n % 1000, out = [];
  if (th) out.push(th === 1 ? "mille" : below1000(th, false) + " mille");
  if (r) out.push(below1000(r, true));
  return out.join(" ");
}
