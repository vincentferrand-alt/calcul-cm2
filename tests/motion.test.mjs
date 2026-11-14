import test from "node:test";
import assert from "node:assert/strict";
import { motionCalm } from "../js/motion.js";
import { DEFAULT_SETTINGS } from "../js/storage.js";

test("réglage Animations : automatique suit l'appareil, « toujours » et « réduites » l'emportent", () => {
  assert.equal(DEFAULT_SETTINGS.motion, "auto");
  assert.equal(motionCalm("on"), false); assert.equal(motionCalm("off"), true);
  assert.equal(motionCalm("auto"), false, "sans matchMedia (Node) : l'appareil ne demande rien");
});
