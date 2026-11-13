// Sons synthétisés (aucun fichier audio). Le son ne démarre qu'après un appui, comme l'exigent les navigateurs.
let ctx = null, muted = false;
function ac() {
  if (!ctx) { const C = globalThis.AudioContext || globalThis.webkitAudioContext; if (!C) return null; ctx = new C(); }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function tone(freq, t0, dur, type = "sine", vol = 0.14) {
  if (muted) return;
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.03);
}
export const setMuted = (m) => { muted = !!m; };
export const isMuted = () => muted;
export const sfx = {
  tap: () => tone(520, 0, 0.05, "sine", 0.06),
  ok: () => { tone(660, 0, 0.12, "triangle"); tone(880, 0.09, 0.2, "triangle"); },
  wrong: () => { tone(330, 0, 0.2, "sine", 0.09); tone(262, 0.14, 0.28, "sine", 0.07); }, // doux, jamais agressif
  star: (i = 0) => tone(523 + i * 131, 0, 0.3, "triangle", 0.12),
  level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.28, "triangle", 0.12)),
  hatch: () => [392, 523, 659, 784, 988, 1175].forEach((f, i) => tone(f, i * 0.09, 0.3, "triangle", 0.12)),
  trophy: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.08, 0.3, "square", 0.05)),
};
