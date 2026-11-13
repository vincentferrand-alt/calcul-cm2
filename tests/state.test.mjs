import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { emptyState, migrate, merge, missingFrom, exportData, importData, SCHEMA } from "../js/state.js";
import { loadState, saveState, KEY, BAK, SNAP } from "../js/storage.js";
import { makeRng } from "../js/generator.js";
import { randState, fakeLS } from "./helpers.mjs";

const rng = makeRng(7);
const norm = (x) => JSON.parse(JSON.stringify(x));
const states = Array.from({ length: 60 }, () => randState(rng));

test("fusion : idempotente, commutative, associative", () => {
  for (let i = 0; i < states.length - 2; i++) {
    const [a, b, c] = [states[i], states[i + 1], states[i + 2]];
    assert.deepEqual(norm(merge(a, a)), norm(migrate(a)), "idempotence");
    assert.deepEqual(norm(merge(a, b)), norm(merge(b, a)), "commutativité");
    assert.deepEqual(norm(merge(merge(a, b), c)), norm(merge(a, merge(b, c))), "associativité");
  }
});

test("fusion : aucun trophée, créature, fiche, jour, compteur ni record ne disparaît (jamais d'écrasement)", () => {
  for (let i = 0; i < states.length - 1; i++) {
    const m = merge(states[i], states[i + 1]);
    assert.deepEqual(missingFrom(m, states[i]), []);
    assert.deepEqual(missingFrom(m, states[i + 1]), []);
    assert.ok(Object.keys(m.tro).length >= Math.max(Object.keys(states[i].tro).length, Object.keys(states[i + 1].tro).length));
  }
});

test("fusion : un appareil en retard ne peut pas faire reculer l'autre", () => {
  const phone = randState(rng), imac = norm(phone);
  imac.c.ok += 50; imac.tro["t_calc:9"] = "2026-11-13"; imac.cre.add = { s: 4, d: { 1: "2026-11-01" } };
  const merged = merge(phone, imac);
  assert.equal(merged.c.ok, imac.c.ok);
  assert.ok("t_calc:9" in merged.tro);
  assert.equal(merged.cre.add.s, 4);
  const back = merge(merged, phone); // l'ancien téléphone se resynchronise : rien ne régresse
  assert.deepEqual(norm(back), norm(merged));
});

test("migration : additive, idempotente, conserve les clés inconnues", () => {
  const old = { v: 1, c: { ok: 12 }, tro: { "t_calc:1": "2026-11-01" }, motFuturiste: { x: [1, 2] } };
  const m = migrate(old);
  assert.equal(m.c.ok, 12);
  assert.equal(m.tro["t_calc:1"], "2026-11-01");
  assert.deepEqual(m.motFuturiste, { x: [1, 2] });
  assert.ok(m.fam && m.days && m.review && m.m.active);
  assert.deepEqual(migrate(m), m);
  assert.equal(migrate({ v: 99 }).v, 99, "une version plus récente n'est jamais rétrogradée");
  assert.deepEqual(migrate(null), emptyState());
});

test("sauvegardes des versions précédentes : chacune se recharge sans RIEN perdre", () => {
  const dir = path.join(path.resolve(new URL(".", import.meta.url).pathname), "fixtures");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  assert.ok(files.length >= 1, "au moins une sauvegarde de référence");
  for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const m = migrate(raw);
    assert.deepEqual(missingFrom(m, raw), [], `${f} : perte après migration`);
    assert.deepEqual(missingFrom(merge(emptyState(), raw), raw), [], `${f} : perte après fusion`);
    // chargement réel via le stockage, comme dans l'appli
    const ls = fakeLS(); ls.setItem(KEY, JSON.stringify(raw));
    assert.deepEqual(missingFrom(loadState(ls), raw), [], `${f} : perte au chargement`);
    // une mise à jour de l'appli (nouvelle version) ne vide rien : on réécrit puis on relit
    saveState(loadState(ls), ls); assert.deepEqual(missingFrom(loadState(ls), raw), [], `${f} : perte après réécriture`);
  }
});

test("stockage : sauvegarde / chargement, copie de secours, instantanés quotidiens", () => {
  const ls = fakeLS();
  const s = randState(rng);
  assert.ok(saveState(s, ls, "2026-11-13"));
  assert.deepEqual(missingFrom(loadState(ls), s), []);
  assert.ok(ls.getItem(SNAP + "2026-11-13"));
  for (let d = 14; d < 24; d++) saveState(s, ls, `2026-11-${d}`);
  const snaps = [...ls._m.keys()].filter((k) => k.startsWith(SNAP));
  assert.equal(snaps.length, 5, "5 instantanés conservés");
});

test("stockage : copie principale abîmée → rien n'est perdu (copie de secours + instantané)", () => {
  const ls = fakeLS();
  const s = randState(rng); s.tro["t_calc:3"] = "2026-11-02"; delete s.tro["t_calc:4"];
  saveState(s, ls, "2026-11-13");
  const s2 = norm(s); s2.tro["t_calc:4"] = "2026-11-13"; saveState(s2, ls, "2026-11-13");
  saveState(s2, ls, "2026-11-13"); // la copie de secours est celle d'avant la dernière sauvegarde
  ls.setItem(KEY, "{pas du json"); // corruption
  const back = loadState(ls);
  assert.deepEqual(missingFrom(back, s), []);
  assert.ok("t_calc:4" in back.tro, "le dernier trophée est retrouvé dans la copie de secours");
  assert.ok([...ls._m.keys()].some((k) => k.startsWith("ccm2:corrupt:")), "la copie abîmée est gardée pour réparation");
});

test("stockage : un bug qui viderait l'état principal ne peut pas effacer les trophées (fusion au chargement)", () => {
  const ls = fakeLS();
  const s = randState(rng); s.tro["t_streak:2"] = "2026-11-05"; saveState(s, ls, "2026-11-13");
  ls.setItem(KEY, JSON.stringify(emptyState())); ls.setItem(BAK, JSON.stringify(emptyState()));
  assert.ok("t_streak:2" in loadState(ls).tro);
});

test("stockage plein : l'appli ne plante pas", () => {
  const ls = fakeLS(); ls.setItem = () => { throw new Error("QuotaExceededError"); };
  assert.equal(saveState(randState(rng), ls), false);
});

test("export / import : l'import fusionne, ne remplace jamais", () => {
  const a = randState(rng), b = randState(rng);
  const file = exportData(a, "0.3.0");
  const merged = importData(file, b);
  assert.deepEqual(missingFrom(merged, a), []);
  assert.deepEqual(missingFrom(merged, b), []);
  assert.deepEqual(norm(importData(file, a)), norm(migrate(a)), "importer sa propre sauvegarde ne change rien");
  assert.throws(() => importData("pas du json", a), /valide/);
  assert.throws(() => importData(JSON.stringify({ hello: 1 }), a), /Calcul CM2/);
  assert.equal(JSON.parse(file).schema, SCHEMA);
});
