// Language switcher (English / Amharic / Arabic). Translates every label on screen, including
// built-in names (classes, statuses, rules...) that match src/dict.js. Typed data (names...) stays as typed.
import rows from './dict.js';
import { SURAS } from './data/suras.js';
const D = {};
rows.forEach(([e, a, r]) => { D[e] = [a, r]; });
SURAS.forEach(([e, a]) => { if (!D[e]) D[e] = [e, a]; });
let lang = 'en';
export const getLang = () => lang;
const look = (t) => { const x = D[t]; return x ? x[lang === 'am' ? 0 : 1] : null; };
const SEP = /[·—–|]/;
function core(t) {
  let r = look(t); if (r) return r;
  let m = t.match(/^(.*?)(\s*\(\d+\))$/); if (m && (r = look(m[1]))) return r + m[2];
  m = t.match(/^(.*?)\s*:$/); if (m && (r = look(m[1]))) return r + ':';
  m = t.match(/^(.*?)\s+(\d+)$/); if (m && (r = look(m[1]))) return r + ' ' + m[2];
  m = t.match(/^(\d+)\.\s+(.*)$/); if (m && (r = look(m[2]))) return m[1] + '. ' + r;
  if (SEP.test(t)) return t.split(/(\s*[·—–|]\s*)/).map((p) => (/^\s*[·—–|]\s*$/.test(p) ? p : tr(p))).join('');
  return t;
}
export function tr(s) {
  if (lang === 'en') return s;
  const t = s.trim(); if (!t) return s;
  const i = s.indexOf(t);
  return s.slice(0, i) + core(t) + s.slice(i + t.length);
}
const texts = new WeakMap(); const attrs = new WeakMap();
const SKIP = ['STYLE', 'SCRIPT', 'TEXTAREA'];
function doText(n, force) {
  if (n.parentNode && SKIP.includes(n.parentNode.nodeName)) return;
  let r = texts.get(n);
  if (r && n.nodeValue === r.out) { if (!force) return; } else { r = { en: n.nodeValue, out: n.nodeValue }; texts.set(n, r); }
  const o = tr(r.en); if (o !== n.nodeValue) n.nodeValue = o; r.out = o;
}
function doAttr(el, force) {
  for (const a of ['placeholder', 'title']) {
    if (!el.hasAttribute(a)) continue;
    const v = el.getAttribute(a); const m = attrs.get(el) || {}; let r = m[a];
    if (r && v === r.out) { if (!force) continue; } else r = { en: v, out: v };
    const o = tr(r.en); if (o !== v) el.setAttribute(a, o); r.out = o; m[a] = r; attrs.set(el, m);
  }
}
function scan(root, force) {
  if (root.nodeType === 3) return doText(root, force);
  const w = document.createTreeWalker(root, 5); let n = w.currentNode;
  while (n) { if (n.nodeType === 3) doText(n, force); else if (n.nodeType === 1) doAttr(n, force); n = w.nextNode(); }
}
export function setLang(l) {
  lang = l;
  document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  scan(document.body, true);
}
if (typeof document !== 'undefined') {
  new MutationObserver((ms) => {
    if (lang === 'en') return;
    ms.forEach((m) => {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttr(m.target);
      else m.addedNodes.forEach((n) => (n.nodeType === 3 || n.nodeType === 1) && scan(n));
    });
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title'] });
}
