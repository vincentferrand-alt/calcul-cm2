// Petit utilitaire de création de DOM (aucun texte utilisateur n'est jamais injecté en HTML).
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

// Pour les SVG internes à l'appli (chaînes que nous écrivons nous-mêmes).
export function svgEl(markup, cls) {
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  const node = t.content.firstChild;
  if (cls) node.setAttribute("class", cls);
  return node;
}

export const $ = (sel, root = document) => root.querySelector(sel);
