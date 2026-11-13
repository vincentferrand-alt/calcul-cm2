import test from "node:test";
import assert from "node:assert/strict";
import { syncOnce, syncConfigured, explain, stable, COLLECTION } from "../js/sync.js";
import { emptyState, merge, missingFrom } from "../js/state.js";
import { makeRng } from "../js/generator.js";
import { randState } from "./helpers.mjs";

const cfg = { apiKey: "AIza-test", projectId: "calcul-test" };
const ID = "a".repeat(64);

// Fausse base Firestore (API REST) : mêmes réponses que la vraie pour GET / PATCH avec précondition.
function fakeFirestore() {
  const docs = new Map(); let clock = 1; const log = [];
  const f = { docs, log, hooks: { beforePatch: null, failWith: null, offline: false },
    async fetch(url, init = {}) {
      if (f.hooks.offline) throw new TypeError("Failed to fetch");
      const u = new URL(url); const m = u.pathname.match(/\/documents\/([^/]+)\/([^/]+)$/);
      assert.equal(m[1], COLLECTION); assert.equal(u.searchParams.get("key"), cfg.apiKey);
      const id = m[2], method = init.method || "GET"; log.push(method);
      const reply = (status, body) => ({ status, json: async () => body });
      if (f.hooks.failWith) return reply(f.hooks.failWith.status, f.hooks.failWith.body);
      const d = docs.get(id);
      if (method === "GET") return d ? reply(200, { name: u.pathname, fields: { data: { stringValue: d.data } }, updateTime: d.t }) : reply(404, { error: { code: 404, status: "NOT_FOUND", message: "Document \"projects/p/databases/(default)/documents/profils/abc\" not found." } });
      if (f.hooks.beforePatch) { const h = f.hooks.beforePatch; f.hooks.beforePatch = null; h(); }
      const cur = docs.get(id);
      const pre = u.searchParams.get("currentDocument.updateTime"), mustNotExist = u.searchParams.get("currentDocument.exists") === "false";
      if ((mustNotExist && cur) || (pre && (!cur || cur.t !== pre))) return reply(400, { error: { code: 400, status: "FAILED_PRECONDITION", message: "precondition" } });
      const body = JSON.parse(init.body);
      docs.set(id, { data: body.fields.data.stringValue, t: `2026-11-13T22:00:${String(clock++).padStart(2, "0")}Z` });
      return reply(200, { name: u.pathname });
    } };
  return f;
}
const run = (fs, local, extra = {}) => syncOnce({ id: ID, local, cfg, fetchFn: (u, i) => fs.fetch(u, i), now: () => "2026-11-13T22:00:00Z", ...extra });

test("config : sans clé ou sans projet, la synchro est simplement désactivée", async () => {
  assert.equal(syncConfigured(null), false); assert.equal(syncConfigured({ apiKey: "x" }), false); assert.equal(syncConfigured(cfg), true);
  const fs = fakeFirestore();
  const r = await syncOnce({ id: ID, local: emptyState(), cfg: null, fetchFn: (u, i) => fs.fetch(u, i) });
  assert.equal(r.ok, false); assert.equal(r.code, "off"); assert.equal(fs.log.length, 0, "aucun accès réseau");
});

test("première synchro : le document est créé, puis une 2e synchro identique n'écrit rien", async () => {
  const fs = fakeFirestore(), local = randState(makeRng(1));
  const r = await run(fs, local);
  assert.equal(r.ok, true); assert.equal(r.pushed, true); assert.equal(fs.docs.size, 1);
  assert.deepEqual(missingFrom(JSON.parse(fs.docs.get(ID).data), local), []);
  fs.log.length = 0;
  const r2 = await run(fs, r.merged);
  assert.equal(r2.pushed, false); assert.deepEqual(fs.log, ["GET"]);
});

test("deux appareils : chacun retrouve les trophées / créatures de l'autre, rien ne se perd", async () => {
  const fs = fakeFirestore();
  const phone = randState(makeRng(2)), imac = randState(makeRng(3));
  const a = await run(fs, phone);
  const b = await run(fs, imac);
  const a2 = await run(fs, a.merged);
  for (const [name, res] of [["téléphone", a2], ["iMac", b]]) {
    assert.deepEqual(missingFrom(res.merged, phone), [], name + " : perte vs téléphone");
    assert.deepEqual(missingFrom(res.merged, imac), [], name + " : perte vs iMac");
  }
  assert.equal(stable(a2.merged), stable(b.merged), "les deux appareils convergent vers la même sauvegarde");
  assert.equal(a2.changedLocal, true);
});

test("conflit : l'autre appareil écrit entre la lecture et l'écriture → on relit, refusionne, réessaie", async () => {
  const fs = fakeFirestore();
  const phone = randState(makeRng(4)), imac = randState(makeRng(5));
  await run(fs, phone);
  fs.hooks.beforePatch = () => { fs.docs.set(ID, { data: JSON.stringify(merge(JSON.parse(fs.docs.get(ID).data), imac)), t: "2026-11-13T23:59:59Z" }); };
  const extra = randState(makeRng(6)); const mine = merge(phone, extra);
  const r = await run(fs, mine);
  assert.equal(r.ok, true);
  const online = JSON.parse(fs.docs.get(ID).data);
  for (const s of [phone, imac, extra]) assert.deepEqual(missingFrom(online, s), []);
  assert.ok(fs.log.filter((m) => m === "GET").length >= 2, "relecture après le conflit");
});

test("hors ligne ou erreur serveur : message clair, aucune perte, rien d'écrit", async () => {
  const fs = fakeFirestore(), local = randState(makeRng(7));
  fs.hooks.offline = true;
  let r = await run(fs, local); assert.equal(r.ok, false); assert.match(r.message, /connexion/); assert.equal(fs.docs.size, 0);
  fs.hooks.offline = false;
  for (const [status, body, re] of [
    [403, { error: { message: "Missing or insufficient permissions." } }, /règles/],
    [403, { error: { message: "Cloud Firestore API has not been used in project" } }, /API Firestore/],
    [404, { error: { message: "The database (default) does not exist for project x. Please visit https://console.cloud.google.com/datastore/setup?project=x to create a database." } }, /base Firestore/],
    [400, { error: { message: "API key not valid" } }, /clé/],
  ]) { fs.hooks.failWith = { status, body }; r = await run(fs, local); assert.equal(r.ok, false); assert.match(r.message, re); }
  fs.hooks.failWith = null;
  assert.match(explain(500, null), /500/);
});

test("copie en ligne illisible : on ne l'écrase pas et on ne touche pas à la copie locale", async () => {
  const fs = fakeFirestore(); fs.docs.set(ID, { data: "{pas du json", t: "2026-11-13T21:00:00Z" });
  const r = await run(fs, randState(makeRng(8)));
  assert.equal(r.ok, false); assert.equal(r.code, "remote-unreadable"); assert.equal(fs.docs.get(ID).data, "{pas du json"); assert.deepEqual(fs.log, ["GET"]);
});

test("copie en ligne d'une ancienne version de l'appli : migrée et fusionnée sans perte", async () => {
  const fs = fakeFirestore(); const old = randState(makeRng(9)); delete old.cre; delete old.rec; old.v = 1;
  fs.docs.set(ID, { data: JSON.stringify(old), t: "2026-11-13T21:00:00Z" });
  const local = randState(makeRng(10)); const r = await run(fs, local);
  assert.equal(r.ok, true); assert.deepEqual(missingFrom(r.merged, local), []); assert.deepEqual(missingFrom(r.merged, old), []);
});

test("un document pas encore créé (404 « Document … databases/(default) … not found ») n'est PAS pris pour une base absente", () => {
  const body = { error: { code: 404, status: "NOT_FOUND", message: 'Document "projects/calcul-cm2-famille/databases/(default)/documents/profils/abc" not found.' } };
  assert.doesNotMatch(explain(404, body), /base Firestore/);
});
