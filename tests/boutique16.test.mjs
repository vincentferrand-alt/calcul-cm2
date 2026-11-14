// v0.16 — boutique agrandie : ciel, objets (o1/o2), collections, saisons, cadres du carnet ; aucun achat jamais perdu.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DECOR, decorById, RAYONS, rayonOf, inSeason, saisonDe, seasonBack, SEASONS, COLLECTIONS, CARNET, skyHTML, objectHTML, landSVG, decorIcon } from "../js/decor.js";
import { balance, buyDecor, setPick, scenePick, carnetFrame, collectionsOf, collectionsDone, spent, decorCount } from "../js/shop.js";
import { emptyState, merge, migrate, missingFrom } from "../js/state.js";
import { checkTrophies, lineById } from "../js/trophies.js";

const rich = (n = 2000) => { const s = emptyState(); s.c.stars = n; s.cre.add = { s: 2, d: {} }; return s; };
const own = (s, ...ids) => { for (const id of ids) s.decor.owned[id] = "2026-11-14"; return s; };

test("5 nouveaux rayons, ids préfixés, prix croissants, total de la boutique = 620 ⭐", () => {
  const by = (r) => DECOR.filter((d) => rayonOf(d) === r);
  assert.deepEqual(by("sky").map((d) => d.id), ["sky_aurore", "sky_arcenciel", "sky_filantes", "sky_lanternes", "sky_lune"]);
  assert.ok(by("sky").every((d) => d.price >= 25 && d.price <= 40));
  assert.equal(by("obj").length, 8); assert.ok(by("obj").every((d) => d.price >= 8 && d.price <= 20));
  assert.equal(by("season").length, 4); assert.ok(by("season").every((d) => d.kind === "bg" && SEASONS[d.season]));
  assert.equal(by("frame").length, 5); assert.ok(by("frame").every((d) => d.price >= 6 && d.price <= 15));
  assert.equal(DECOR.reduce((t, d) => t + d.price, 0), 620, "nouveau total de la boutique (noté dans le CHANGELOG)");
  assert.deepEqual(RAYONS.map((r) => r.id), ["bg", "sky", "wx", "fx", "pet", "obj", "season", "frame"]);
  const ids = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "decor-ids.json"), "utf8"));
  for (const d of DECOR) assert.ok(ids.includes(d.id), "id figé : " + d.id);
  for (const d of DECOR) assert.match(decorIcon(d.id), /^<svg/, d.id);
  for (const d of by("sky")) assert.ok(skyHTML(d.id).length > 50 && !/NaN|undefined/.test(skyHTML(d.id)), d.id);
  for (const d of by("obj")) assert.ok(objectHTML(d.id, "left").includes("o-left") && !/NaN|undefined/.test(objectHTML(d.id)), d.id);
  for (const d of by("season")) assert.ok(!/NaN|undefined/.test(landSVG(d.id)) && landSVG(d.id) !== landSVG("bg_prairie"), d.id);
});

test("saisons : saisonDe(date), bascule de fin d'année, chaque année, achat seulement pendant la saison", () => {
  assert.equal(saisonDe("2026-10-09"), null); assert.equal(saisonDe("2026-10-10"), "halloween"); assert.equal(saisonDe("2026-11-10"), "halloween"); assert.equal(saisonDe("2026-11-11"), null);
  assert.equal(saisonDe("2026-11-30"), null); assert.equal(saisonDe("2026-12-01"), "noel"); assert.equal(saisonDe("2026-12-31"), "noel"); assert.equal(saisonDe("2027-01-01"), "noel"); assert.equal(saisonDe("2027-01-06"), "noel"); assert.equal(saisonDe("2027-01-07"), null);
  assert.equal(saisonDe("2027-03-19"), null); assert.equal(saisonDe("2027-03-20"), "printemps"); assert.equal(saisonDe("2027-04-30"), "printemps"); assert.equal(saisonDe("2027-05-01"), null);
  assert.equal(saisonDe("2027-06-20"), null); assert.equal(saisonDe("2027-06-21"), "ete"); assert.equal(saisonDe("2027-08-31"), "ete"); assert.equal(saisonDe("2027-09-01"), null);
  for (const y of [2026, 2030, 2041]) { assert.equal(saisonDe(`${y}-12-24`), "noel", "revient chaque année"); assert.equal(saisonDe(`${y}-07-14`), "ete"); }
  assert.equal(inSeason("noel", "pas une date"), false);
  assert.equal(seasonBack("noel"), "Revient en décembre"); assert.equal(seasonBack("halloween"), "Revient en octobre");
  const s = rich();
  assert.deepEqual(buyDecor(s, "season_noel", "2027-02-10"), { ok: false, why: "saison" }, "hors saison : pas en vente");
  assert.equal(buyDecor(s, "season_noel", "2026-12-15").ok, true);
  // une fois acheté : gardé et utilisable toute l'année
  assert.equal(setPick(s, "add", "bg", "season_noel"), true);
  assert.equal(scenePick(s, "add").bg, "season_noel");
  assert.deepEqual(buyDecor(s, "season_noel", "2026-12-16"), { ok: false, why: "déjà" });
});

test("ciel : un par créature, choix le plus récent gagne à la fusion", () => {
  const s = own(rich(), "sky_aurore", "sky_lune");
  assert.equal(setPick(s, "add", "sky", "sky_aurore", 10), true);
  assert.equal(setPick(s, "add", "sky", "sky_arcenciel", 11), false, "pas acheté");
  assert.equal(setPick(s, "add", "sky", "bg_lac", 11), false, "pas un ciel");
  assert.equal(scenePick(s, "add").sky, "sky_aurore");
  const b = JSON.parse(JSON.stringify(s)); setPick(b, "add", "sky", "sky_lune", 20);
  assert.equal(scenePick(merge(s, b), "add").sky, "sky_lune"); assert.equal(scenePick(merge(b, s), "add").sky, "sky_lune");
  setPick(s, "add", "sky", null, 30); assert.equal(scenePick(merge(s, b), "add").sky, null);
});

test("objets : deux emplacements o1 / o2, jamais le même des deux côtés, fusion « le plus récent gagne »", () => {
  const s = own(rich(), "obj_lanterne", "obj_banc", "obj_feu");
  assert.equal(setPick(s, "add", "o1", "obj_lanterne", 10), true);
  assert.equal(setPick(s, "add", "o2", "obj_banc", 11), true);
  assert.deepEqual([scenePick(s, "add").o1, scenePick(s, "add").o2], ["obj_lanterne", "obj_banc"]);
  assert.equal(setPick(s, "add", "o1", "obj_coussin", 12), false, "pas acheté");
  assert.equal(setPick(s, "add", "o1", "sky_aurore", 12), false, "pas un objet");
  assert.equal(setPick(s, "add", "obj", "obj_feu", 12), false, "on choisit un emplacement, pas « obj »");
  assert.equal(setPick(s, "add", "o2", "obj_lanterne", 13), true, "la lanterne change de côté");
  assert.deepEqual([scenePick(s, "add").o1, scenePick(s, "add").o2], [null, "obj_lanterne"]);
  // fusion : l'iMac a mis le feu à gauche plus tard ; le téléphone a la lanterne à droite
  const b = JSON.parse(JSON.stringify(s)); setPick(b, "add", "o1", "obj_feu", 20);
  const m = merge(s, b);
  assert.deepEqual([scenePick(m, "add").o1, scenePick(m, "add").o2], ["obj_feu", "obj_lanterne"]); assert.deepEqual(merge(b, s), m);
  // fusion qui mettrait le même objet des deux côtés : l'affichage n'en garde qu'un
  const c = JSON.parse(JSON.stringify(m)); c.decor.pick.add.o1 = { id: "obj_lanterne", t: 99 };
  assert.deepEqual([scenePick(c, "add").o1, scenePick(c, "add").o2], ["obj_lanterne", null]);
});

test("collections : 4 collections de 4 décors existants, badge + trophée « Collectionneur » (1, 2, 3, 4)", () => {
  assert.deepEqual(COLLECTIONS.map((c) => c.name), ["Hiver", "Forêt", "Nuit magique", "Bord de l'eau"]);
  for (const c of COLLECTIONS) { assert.equal(c.items.length, 4); for (const id of c.items) assert.ok(decorById(id), id); }
  const s = rich();
  assert.equal(collectionsDone(s), 0);
  own(s, "bg_banquise", "wx_neige", "fx_aura");
  assert.deepEqual(collectionsOf(s).find((c) => c.id === "hiver").n, 3);
  assert.equal(buyDecor(s, "pet_chouette", "2026-11-14").ok, true);
  assert.equal(collectionsOf(s).find((c) => c.id === "hiver").done, true); assert.equal(collectionsDone(s), 1);
  const fresh = checkTrophies(s, "2026-11-14");
  assert.ok(fresh.some((t) => t.id === "t_collec:1"));
  assert.deepEqual(lineById("t_collec").tiers, [1, 2, 3, 4]);
  for (const c of COLLECTIONS) own(s, ...c.items);
  checkTrophies(s, "2026-11-14"); assert.ok(s.tro["t_collec:4"]);
  // Décorateur : paliers existants inchangés, un palier ajouté au-delà (35 ; 5 paliers au plus par ligne)
  assert.deepEqual(lineById("t_decor").tiers, [1, 5, 12, 20, 35]);
});

test("cadres du carnet : choix global decor.pick._carnet.frame, « le plus récent gagne »", () => {
  const s = own(rich(), "frame_bois", "frame_or");
  assert.equal(carnetFrame(s), null);
  assert.equal(setPick(s, CARNET, "frame", "frame_bois", 10), true); assert.equal(carnetFrame(s), "frame_bois");
  assert.equal(setPick(s, CARNET, "frame", "frame_givre", 11), false, "pas acheté");
  assert.equal(setPick(s, "add", "frame", "frame_or", 11), false, "le cadre ne se choisit pas par créature");
  assert.equal(setPick(s, CARNET, "bg", "bg_lac", 11), false);
  const b = JSON.parse(JSON.stringify(s)); setPick(b, CARNET, "frame", "frame_or", 20);
  assert.equal(carnetFrame(merge(s, b)), "frame_or"); assert.equal(carnetFrame(merge(b, s)), "frame_or");
  setPick(s, CARNET, "frame", null, 30); assert.equal(carnetFrame(merge(s, b)), null, "« sans cadre » plus récent");
  assert.equal(scenePick(s, CARNET).bg, "bg_prairie", "le carnet n'est pas une créature : rien ne casse");
});

test("solde jamais négatif ; achats des nouveaux rayons jamais perdus (fusion, migration de toutes les sauvegardes de référence)", () => {
  const a = rich(30), b = rich(30);
  assert.equal(buyDecor(a, "sky_aurore", "2026-11-14").ok, true);
  assert.equal(buyDecor(b, "obj_banc", "2026-11-14").ok, true);
  const m = merge(a, b);
  assert.ok(m.decor.owned.sky_aurore && m.decor.owned.obj_banc); assert.equal(balance(m), 0); assert.ok(spent(m) > 30);
  assert.equal(decorCount(m), 2);
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "fixtures");
  for (const f of fs.readdirSync(dir)) {
    const old = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const mig = migrate(old);
    assert.deepEqual(mig.decor.owned, (old.decor && old.decor.owned) || {}, f);
    const mm = merge(old, m);
    assert.deepEqual(missingFrom(mm, old), [], f); assert.deepEqual(missingFrom(mm, m), [], f);
    assert.ok(balance(mm) >= 0);
    for (const cid of Object.keys(mm.decor.pick || {})) { const p = scenePick(mm, cid); assert.ok(!p.o1 || p.o1 !== p.o2); }
  }
});
