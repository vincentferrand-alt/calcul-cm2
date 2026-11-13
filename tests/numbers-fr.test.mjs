import test from "node:test";
import assert from "node:assert/strict";
import { enLettres } from "../js/numbers-fr.js";
import { parseFr } from "./helpers.mjs";

test("nombres en lettres : échantillons exacts", () => {
  const exp = {
    0: "zéro", 1: "un", 16: "seize", 17: "dix-sept", 21: "vingt et un", 22: "vingt-deux", 31: "trente et un", 47: "quarante-sept",
    60: "soixante", 61: "soixante et un", 70: "soixante-dix", 71: "soixante et onze", 77: "soixante-dix-sept", 80: "quatre-vingts",
    81: "quatre-vingt-un", 90: "quatre-vingt-dix", 91: "quatre-vingt-onze", 96: "quatre-vingt-seize", 99: "quatre-vingt-dix-neuf",
    100: "cent", 101: "cent un", 180: "cent quatre-vingts", 200: "deux cents", 201: "deux cent un", 280: "deux cent quatre-vingts",
    470: "quatre cent soixante-dix", 1000: "mille", 1001: "mille un", 2000: "deux mille", 2100: "deux mille cent", 80000: "quatre-vingt mille",
    200000: "deux cent mille", 999999: "neuf cent quatre-vingt-dix-neuf mille neuf cent quatre-vingt-dix-neuf",
  };
  for (const [n, w] of Object.entries(exp)) assert.equal(enLettres(+n), w, `n=${n}`);
});

test("nombres en lettres : aller-retour avec un analyseur indépendant, de 0 à 20 000", () => {
  for (let n = 0; n <= 20000; n++) assert.equal(parseFr(enLettres(n)), n, `${n} → ${enLettres(n)}`);
});
