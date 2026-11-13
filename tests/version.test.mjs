import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { VERSION } from "../js/version.js";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

test("version : js/version.js = sw.js = CHANGELOG", () => {
  const sw = read("sw.js").match(/const VERSION = "([^"]+)"/)[1];
  assert.equal(sw, VERSION, "sw.js doit avoir la même version que js/version.js");
  const top = read("CHANGELOG.md").match(/^## (\d+\.\d+\.\d+)/m)[1];
  assert.equal(top, VERSION, "la première entrée du CHANGELOG doit être la version courante");
});

function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
}

test("service worker : tous les fichiers de l'appli sont pré-cachés", () => {
  const sw = read("sw.js");
  const listed = new Set([...sw.matchAll(/^\s+"([^"]+)",?$/gm)].map((m) => m[1]));
  const files = [...walk("js"), ...walk("css"), ...walk("icons"), "index.html", "manifest.webmanifest"];
  for (const f of files) assert.ok(listed.has(f), `sw.js ne liste pas ${f}`);
  for (const l of listed) if (l !== "./") assert.ok(fs.existsSync(path.join(root, l)), `sw.js liste un fichier inexistant : ${l}`);
});

test("le dépôt public ne contient aucun prénom ni code", () => {
  // Garde-fou simple : aucun fichier de l'appli ne doit contenir de donnée de profil en dur.
  for (const f of [...walk("js"), "index.html"]) {
    assert.ok(!/codeSecret\s*[:=]\s*["']\d/.test(read(f)), `code secret en dur dans ${f}`);
  }
});
