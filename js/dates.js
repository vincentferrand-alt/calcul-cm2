// Dates « de calendrier » au format AAAA-MM-JJ (heure locale de l'appareil).
const pad = (n) => String(n).padStart(2, "0");
export const toKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function parseKey(k) { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d, 12); } // midi : évite les soucis d'heure d'été
export function addDays(k, n) { const d = parseKey(k); d.setDate(d.getDate() + n); return toKey(d); }
export const diffDays = (a, b) => Math.round((parseKey(a) - parseKey(b)) / 86400000);
export function weekStart(k) { const d = parseKey(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toKey(d); } // lundi
export const weekDays = (k) => Array.from({ length: 7 }, (_, i) => addDays(weekStart(k), i));
export const dayNumber = (k) => Math.round(parseKey(k).getTime() / 86400000);
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
export const jourCourt = (k) => JOURS[parseKey(k).getDay()].slice(0, 1).toUpperCase();
export const jourLong = (k) => JOURS[parseKey(k).getDay()];
export const dateLongue = (k) => { const d = parseKey(k); return `${d.getDate()} ${MOIS[d.getMonth()]}`; };
