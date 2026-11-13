// Mémorise tous les identifiants de trophées déjà publiés : ils doivent exister pour toujours (union, jamais de retrait).
import fs from "node:fs"; import path from "node:path";
import { allTrophyIds } from "../js/trophies.js";
const f = path.join(path.resolve(new URL("..", import.meta.url).pathname), "tests", "trophy-ids.json");
const old = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : [];
const all = [...new Set([...old, ...allTrophyIds()])].sort();
fs.writeFileSync(f, JSON.stringify(all, null, 1));
console.log(all.length, "identifiants de trophées mémorisés");
