// Usage : node tools/release.mjs 0.2.0  → aligne js/version.js et sw.js, régénère la liste des fichiers pré-cachés.
import fs from "node:fs"; import path from "node:path";
const root = path.resolve(new URL("..", import.meta.url).pathname);
const v = process.argv[2];
const rd = (f) => fs.readFileSync(path.join(root, f), "utf8");
const wr = (f, s) => fs.writeFileSync(path.join(root, f), s);
const walk = (d) => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
if (v) {
  wr("js/version.js", rd("js/version.js").replace(/VERSION = "[^"]+"/, `VERSION = "${v}"`));
  wr("sw.js", rd("sw.js").replace(/const VERSION = "[^"]+"/, `const VERSION = "${v}"`));
}
const files = ["./", "index.html", "manifest.webmanifest", ...walk("css").sort(), ...walk("js").sort(), ...walk("icons").sort()];
const block = "const ASSETS = [\n" + files.map((f) => `  "${f}",`).join("\n") + "\n];";
wr("sw.js", rd("sw.js").replace(/const ASSETS = \[[\s\S]*?\n\];/, block));
console.log("sw.js à jour :", files.length, "fichiers", v ? "— version " + v : "");
