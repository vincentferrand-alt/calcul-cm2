// Crée la sauvegarde de référence de la version courante : node tests/make-fixture.mjs
// À lancer UNE FOIS à chaque mise en ligne ; les anciens fichiers ne sont jamais modifiés ni supprimés.
import fs from "node:fs"; import path from "node:path";
import { VERSION } from "../js/version.js";
import { makeRng } from "../js/generator.js";
import { randState } from "./helpers.mjs";
const out = path.join(path.resolve(new URL(".", import.meta.url).pathname), "fixtures", `v${VERSION}.json`);
if (fs.existsSync(out)) { console.log("existe déjà (jamais écrasé) :", out); process.exit(0); }
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(randState(makeRng(Number(VERSION.split(".").join("")) + 1000)), null, 1));
console.log("créé :", out);
