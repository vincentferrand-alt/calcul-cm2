// Planche des accessoires portés : node tools/accessories-sheet.mjs [sortie.png]
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import { creatureSVG } from "../js/creatures.js";
import { ITEMS, itemIcon } from "../js/accessories.js";
const out = process.argv[2] || "/tmp/acc.png";
const ids = ["add", "sub", "dbl", "frac", "div", "trick", "mul", "comp"];
const cells = ITEMS.map((it, i) => `<div class="c"><div class="ic">${itemIcon(it.id)}</div>${creatureSVG(ids[i % 8], 3, "a" + i, { [it.slot]: it.id })}<small>${it.name}</small></div>`).join("");
const html = `<body style="margin:0;background:linear-gradient(#16316b,#0e8a8f);font-family:sans-serif;color:#fff"><style>body{display:grid;grid-template-columns:repeat(5,200px);gap:6px;padding:8px}.c{position:relative;text-align:center}.c svg{width:100%;display:block}.ic{position:absolute;left:0;top:0;width:60px;background:#fff;border-radius:10px}.ic svg{width:100%}small{font-weight:800}</style>${cells}</body>`;
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1060, height: 800 } });
await p.setContent(html); await p.screenshot({ path: out, fullPage: true }); await b.close(); console.log("ok");
