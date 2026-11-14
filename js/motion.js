// Animations : « automatique » suit le réglage du téléphone (« réduire les animations », souvent activé par le mode
// économie d'énergie sur Android) ; « toujours » les garde ; « réduites » les arrête. Tout le CSS calme dépend de html.calm.
const mq = () => (globalThis.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null);
export const systemReduced = () => { const m = mq(); return !!(m && m.matches); };
export const motionCalm = (setting) => setting === "off" || (setting !== "on" && systemReduced());
let current = "auto";
export function applyMotion(setting = current) {
  current = setting;
  if (typeof document !== "undefined") document.documentElement.classList.toggle("calm", motionCalm(setting));
}
export const isCalm = () => typeof document !== "undefined" && document.documentElement.classList.contains("calm");
const m = mq();
if (m && m.addEventListener) m.addEventListener("change", () => applyMotion());
