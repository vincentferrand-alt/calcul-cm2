import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs"; import path from "node:path";
import { CREATURES, creatureImg, creatureShadow } from "../js/creatures.js";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const webp = (f) => { const b = fs.readFileSync(path.join(root, f)); return b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" ? b : null; };
// Dimensions et canal alpha d'un WebP (VP8X étendu : drapeau alpha + largeur/hauteur sur 24 bits).
function info(b) {
  const chunk = b.toString("ascii", 12, 16);
  if (chunk !== "VP8X") return { alpha: false };
  return { alpha: !!(b[20] & 0x10), w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
}

test("images des créatures : 8 × 4 stades + 32 ombres, WebP 512 × 512 avec transparence, poids raisonnable", () => {
  let total = 0;
  for (const c of CREATURES) for (let st = 1; st <= 4; st++) {
    for (const f of [creatureImg(c.id, st), creatureShadow(c.id, st)]) {
      const b = webp(f); assert.ok(b, `${f} absent ou pas en WebP`);
      const i = info(b); assert.ok(i.alpha, `${f} sans transparence`); assert.equal(i.w, 512, f); assert.equal(i.h, 512, f);
      total += b.length;
    }
    assert.ok(fs.statSync(path.join(root, creatureImg(c.id, st))).size < 80 * 1024, `${c.id}-${st} trop lourde`);
    assert.ok(fs.statSync(path.join(root, creatureShadow(c.id, st))).size < 6 * 1024, `ombre ${c.id}-${st} trop lourde`);
  }
  assert.ok(total < 1.6 * 1024 * 1024, `total ${Math.round(total / 1024)} Ko`);
});

test("chaque créature a une couleur d'aura et des couleurs de particules (sans rose)", () => {
  for (const c of CREATURES) {
    assert.match(c.aura, /^#[0-9a-f]{6}$/i); assert.ok(c.parts.length >= 3);
    for (const hex of [c.aura, ...c.parts]) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      assert.ok(!(r > 200 && b > 150 && g < r - 40 && b > g + 10), `${c.id} : couleur rosée ${hex}`);
    }
  }
});
