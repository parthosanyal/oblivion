/* Language switcher + translator for the interface (English, Hindi, Bengali, Odia).
 * Translates exact known strings and short planet/sign/month phrases. Longer generated reading paragraphs stay in English. */
(function () {
  const DATA = window.I18N_DATA || { dict: {}, gloss: {} }, D = DATA.dict, G = DATA.gloss;
  const LANGS = [['en', 'English', -1], ['hi', 'हिन्दी', 0], ['bn', 'বাংলা', 1], ['or', 'ଓଡ଼ିଆ', 2]];
  const IDX = { en: -1, hi: 0, bn: 1, or: 2 };
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, OPTION: 1, NOSCRIPT: 1 };
  let cur = 'en';
  const orig = new WeakMap();

  const get = () => { try { return localStorage.getItem('jk_lang'); } catch (e) { return null; } };
  const put = v => { try { localStorage.setItem('jk_lang', v); } catch (e) { /* ignore */ } };
  const detect = () => {
    const s = get(); if (s && IDX[s] !== undefined) return s;
    const l = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    for (const x of l) { const p = String(x).toLowerCase().slice(0, 2); if (IDX[p] !== undefined && p !== 'en') return p; if (p === 'en') return 'en'; }
    return 'en';
  };

  const tx = (s, k) => {
    const t = s.trim(); if (!t) return null;
    const key = t.replace(/\s+/g, ' ');
    const e = D[key]; if (e && e[k]) return e[k];
    if (key.length <= 70) {
      const tok = key.match(/[A-Za-z]+/g);
      if (tok && tok.every(w => G[w])) return key.replace(/[A-Za-z]+/g, w => G[w][k]);
    }
    return null;
  };
  const wrap = (s, out) => s.slice(0, s.length - s.trimStart().length) + out + s.slice(s.trimEnd().length);

  const doText = n => {
    const p = n.parentNode; if (!p || SKIP[p.nodeName] || (p.closest && p.closest('[data-noi18n]'))) return;
    const rec = orig.get(n), v = n.nodeValue, o = rec && v === rec.t ? rec.o : v;
    const k = IDX[cur];
    if (k < 0) { if (rec && v === rec.t) { n.nodeValue = rec.o; } orig.delete(n); return; }
    const r = tx(o, k);
    if (r === null) { if (rec) orig.delete(n); return; }
    const out = wrap(o, r);
    if (out !== v) n.nodeValue = out;
    orig.set(n, { o, t: out });
  };
  const doAttr = (el, a) => {
    const key = 'i18n' + a.replace(/-/g, ''), v = el.getAttribute(a); if (v == null) return;
    const stored = el.dataset[key], t = el.dataset[key + 't'];
    const o = stored !== undefined && v === t ? stored : v, k = IDX[cur];
    if (k < 0) { if (stored !== undefined && v === t) el.setAttribute(a, stored); delete el.dataset[key]; delete el.dataset[key + 't']; return; }
    const r = tx(o, k); if (r === null) return;
    if (r !== v) el.setAttribute(a, r);
    el.dataset[key] = o; el.dataset[key + 't'] = r;
  };
  const walk = root => {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    const base = root.nodeType === 9 ? root.body : root;
    const w = document.createTreeWalker(base, NodeFilter.SHOW_TEXT); let n; const list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(doText);
    const els = base.querySelectorAll ? base.querySelectorAll('[placeholder],[title],[aria-label]') : [];
    els.forEach(el => ATTRS.forEach(a => doAttr(el, a)));
    if (base.nodeType === 1) ATTRS.forEach(a => doAttr(base, a));
  };

  let pend = new Set(), raf = 0, obs;
  const flush = () => {
    raf = 0; const items = [...pend]; pend = new Set();
    items.forEach(x => { if (Array.isArray(x)) doAttr(x[0], x[1]); else if (x.isConnected !== false) walk(x); });
    if (obs) obs.takeRecords();
  };
  const queue = x => { pend.add(x); if (!raf) raf = requestAnimationFrame(flush); };
  obs = new MutationObserver(ms => {
    if (cur === 'en') { /* keep restored English as is */ }
    for (const m of ms) {
      if (m.type === 'childList') m.addedNodes.forEach(n => queue(n));
      else if (m.type === 'characterData') queue(m.target);
      else if (m.type === 'attributes') queue([m.target, m.attributeName]);
    }
  });

  const setLang = l => {
    if (IDX[l] === undefined) l = 'en';
    cur = l; put(l);
    document.documentElement.lang = l;
    const sel = document.getElementById('langSel'); if (sel) sel.value = l;
    walk(document); if (obs) obs.takeRecords();
    window.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  };

  const build = () => {
    const nav = document.querySelector('.topnav'); if (!nav || document.getElementById('langSel')) return;
    const sel = document.createElement('select'); sel.id = 'langSel'; sel.setAttribute('data-noi18n', ''); sel.setAttribute('aria-label', 'Language');
    sel.innerHTML = LANGS.map(x => `<option value="${x[0]}">${x[1]}</option>`).join('');
    sel.addEventListener('change', () => setLang(sel.value));
    nav.appendChild(sel);
  };

  window.I18N = { lang: () => cur, set: setLang, langs: LANGS };
  const start = () => {
    build(); cur = detect(); document.documentElement.lang = cur;
    const sel = document.getElementById('langSel'); if (sel) sel.value = cur;
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    if (cur !== 'en') walk(document);
    obs.takeRecords();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
