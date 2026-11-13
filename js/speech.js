// Lecture à voix haute (synthèse vocale du navigateur, en français). Aucun enregistrement, aucun micro.
// La voix ne démarre qu'après un appui de l'élève (exigence des navigateurs) ; tout est facultatif : sans voix, l'appli reste jouable.
const synth = () => (typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined" ? speechSynthesis : null);
export const speechSupported = () => !!synth();

let voices = [];
function refresh() { const s = synth(); if (s) voices = s.getVoices() || []; }
if (synth()) { refresh(); try { synth().addEventListener("voiceschanged", refresh); } catch { /* ancien navigateur */ } }

export function frenchVoice() {
  refresh();
  return voices.find((v) => /^fr[-_]FR/i.test(v.lang)) || voices.find((v) => /^fr/i.test(v.lang)) || null;
}
// "ok" : on sait lire en français (ou la liste des voix n'est pas encore connue : on essaie quand même) ;
// "no-french" : l'appareil a des voix mais aucune française ; "none" : pas de synthèse vocale.
export function voiceStatus() {
  if (!synth()) return "none";
  refresh();
  if (!voices.length) return "ok";
  return frenchVoice() ? "ok" : "no-french";
}
export const NO_VOICE_MESSAGE = "Ton appareil ne sait pas lire à voix haute en français pour le moment. Ce n'est pas grave : le calcul s'affiche, comme d'habitude 🙂";

export function speak(text, { rate = 0.9, onend } = {}) {
  const s = synth();
  if (!s || !text) { if (onend) onend(); return false; }
  if (s.speaking || s.pending) s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "fr-FR"; u.rate = rate; u.pitch = 1;
  const v = frenchVoice(); if (v) u.voice = v;
  if (onend) { u.onend = onend; u.onerror = onend; }
  s.speak(u);
  return true;
}
export function stopSpeaking() { const s = synth(); if (s && (s.speaking || s.pending)) s.cancel(); }
