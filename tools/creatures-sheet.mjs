// Planche de contact de toutes les créatures (8 espèces × œuf + 4 stades) : node tools/creatures-sheet.mjs [sortie.png] [ligne-début] [ligne-fin]
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import { CREATURES, creatureSVG, creatureEgg } from "../js/creatures.js";
const [, , out = "/tmp/sheet.png", from = "0", to = "8"] = process.argv;
const rows = CREATURES.slice(+from, +to).map((c) => `<div class="row"><div class="n">${c.name}<br><small>${c.species}</small></div>${[0, 1, 2, 3, 4].map((st) => `<div class="c">${st ? creatureSVG(c.id, st, "s" + st) : creatureEgg(c.id, 20, "s0")}</div>`).join("")}</div>`).join("");
const html = `<body style="margin:0;background:linear-gradient(#16316b,#0e8a8f);font-family:sans-serif;color:#fff"><style>.row{display:flex;align-items:center;border-bottom:1px solid #fff3}.n{width:110px;padding:8px;font-weight:800}.c{width:190px}.c svg{width:100%;display:block}</style>${rows}</body>`;
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1090, height: 240 * (+to - +from) }, deviceScaleFactor: 1 });
await p.setContent(html); await p.screenshot({ path: out }); await b.close(); console.log("ok", out);
