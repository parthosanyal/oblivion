/* KP (Krishnamurti Paddhati) engine: Placidus cusps, star/sub/sub-sub lords, significators, cuspal sub-lord analysis,
 * KP Vimshottari periods, ruling planets and the 249 horary table. Built on the Lahiri chart from engine.js
 * with the KP ayanamsa (about 5'46" less than Lahiri) applied. Mean lunar node is used for Rahu/Ketu.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.KP = factory(root.VedicEngine);
})(typeof self !== 'undefined' ? self : this, function (E) {
  const D2R = Math.PI / 180, R2D = 180 / Math.PI, norm = x => ((x % 360) + 360) % 360, sin = x => Math.sin(x * D2R), cos = x => Math.cos(x * D2R), tan = x => Math.tan(x * D2R);
  const NL = 360 / 27, SHIFT = 0.096259;                       // KP ayanamsa = Lahiri - 0.096259 deg
  const ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
  const YRS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
  const SIGNS = E.SIGNS, SL = E.SIGN_LORDS, NAKS = E.NAKSHATRAS, PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const DAY_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  /** sign lord, star lord, sub lord and sub-sub lord for a KP sidereal longitude */
  function lords(lon) {
    lon = norm(lon); const ni = Math.floor(lon / NL), star = ORDER[ni % 9], si = ORDER.indexOf(star);
    let rem = lon - ni * NL, sub = null, subLen = 0;
    for (let k = 0; k < 9; k++) { const l = ORDER[(si + k) % 9], len = NL * YRS[l] / 120; if (rem < len || k === 8) { sub = l; subLen = len; break; } rem -= len; }
    const bi = ORDER.indexOf(sub); let ss = null;
    for (let k = 0; k < 9; k++) { const l = ORDER[(bi + k) % 9], len = subLen * YRS[l] / 120; if (rem < len || k === 8) { ss = l; break; } rem -= len; }
    const sign = Math.floor(lon / 30);
    return { lon, sign, deg: lon - sign * 30, signName: SIGNS[sign], signLord: SL[sign], nak: NAKS[ni], nakIndex: ni, star, sub, subsub: ss };
  }

  /** the 249 KP divisions: each sub of each nakshatra, cut at sign boundaries */
  function horaryTable() {
    const rows = [];
    for (let ni = 0; ni < 27; ni++) {
      const si = ni % 9; let a = ni * NL;
      for (let k = 0; k < 9; k++) {
        const sub = ORDER[(si + k) % 9], b = a + NL * YRS[sub] / 120;
        let from = a; const cut = Math.floor((a + 1e-9) / 30 + 1) * 30;
        const parts = (cut < b - 1e-9) ? [[a, cut], [cut, b]] : [[a, b]];
        parts.forEach(([f, t]) => { const sign = Math.floor((f + 1e-9) / 30); rows.push({ n: rows.length + 1, from: f, to: t, sign, signName: SIGNS[sign], signLord: SL[sign], nak: NAKS[ni], star: ORDER[si], sub }); });
        a = b;
      }
    }
    return rows;
  }

  /** Placidus cusps (tropical). Returns null above the polar circles where Placidus does not exist. */
  function placidusTropical(ramc, eps, lat, ascT, mcT) {
    const lonOf = (ra, dec) => norm(Math.atan2(sin(ra) * cos(eps) + tan(dec) * sin(eps), cos(ra)) * R2D);
    const solve = (kind) => {
      let ra = ramc + (kind === 11 ? 30 : kind === 12 ? 60 : kind === 2 ? 120 : 150), lam = lonOf(ra, 0);
      for (let i = 0; i < 60; i++) {
        const dec = Math.asin(sin(eps) * sin(lam)) * R2D, t = -tan(lat) * tan(dec); if (Math.abs(t) >= 1) return null;
        const dsa = Math.acos(t) * R2D, nsa = 180 - dsa;
        ra = kind === 11 ? ramc + dsa / 3 : kind === 12 ? ramc + 2 * dsa / 3 : kind === 2 ? ramc + 180 - 2 * nsa / 3 : ramc + 180 - nsa / 3;
        const nl = lonOf(ra, dec); if (Math.abs(((nl - lam + 540) % 360) - 180) < 1e-9) { lam = nl; break; } lam = nl;
      }
      return lam;
    };
    const c11 = solve(11), c12 = solve(12), c2 = solve(2), c3 = solve(3); if ([c11, c12, c2, c3].some(v => v == null)) return null;
    const c = [ascT, c2, c3, norm(mcT + 180), 0, 0, norm(ascT + 180), 0, 0, mcT, c11, c12];
    c[4] = norm(c11 + 180); c[5] = norm(c12 + 180); c[7] = norm(c2 + 180); c[8] = norm(c3 + 180);
    return c;
  }
  const dsaAsc = (ramc, eps, lat, ascT) => { const dec = Math.asin(sin(eps) * sin(ascT)) * R2D; return Math.acos(-tan(lat) * tan(dec)) * R2D; };

  function houseOfLon(lon, cusps) { for (let i = 0; i < 12; i++) { const a = cusps[i], b = cusps[(i + 1) % 12], span = norm(b - a), d = norm(lon - a); if (d < span) return i + 1; } return 12; }

  /** KP Vimshottari periods from the (KP) Moon longitude: mahadasha > antar > pratyantar */
  function periods(moonLon, birthMs) {
    const YEAR = 365.25 * 86400000, ni = Math.floor(moonLon / NL), frac = (moonLon - ni * NL) / NL, s0 = ni % 9;
    let t = birthMs - YRS[ORDER[s0]] * frac * YEAR; const out = [];
    for (let i = 0; i < 9; i++) {
      const lord = ORDER[(s0 + i) % 9], len = YRS[lord] * YEAR, ant = []; let at = t;
      for (let j = 0; j < 9; j++) {
        const al = ORDER[(s0 + i + j) % 9], alen = len * YRS[al] / 120; ant.push({ lord: al, start: at, end: at + alen }); at += alen;
      }
      out.push({ lord, start: t, end: t + len, antars: ant }); t += len;
    }
    return out.filter(m => m.end > birthMs);
  }
  const pratyantars = a => { const bi = ORDER.indexOf(a.lord); let t = a.start; return Array.from({ length: 9 }, (_, k) => { const l = ORDER[(bi + k) % 9], len = (a.end - a.start) * YRS[l] / 120, r = { lord: l, start: t, end: t + len }; t += len; return r; }); };

  const TOPICS = [
    { key: 'marriage', title: 'Marriage and partnership', cusp: 7, yes: [2, 7, 11], no: [1, 6, 10], note: 'Cusp 7 sub-lord; 2, 7, 11 support marriage; 1, 6, 10 deny or delay.' },
    { key: 'job', title: 'Job / service', cusp: 10, yes: [2, 6, 10, 11], no: [5, 9, 12], note: 'Cusp 10 sub-lord; 2, 6, 10, 11 support employment.' },
    { key: 'business', title: 'Business / profession', cusp: 10, yes: [7, 10, 11], no: [6, 12], note: 'Cusp 10 sub-lord; 7, 10, 11 support independent work.' },
    { key: 'wealth', title: 'Wealth and savings', cusp: 2, yes: [2, 6, 10, 11], no: [5, 8, 12], note: 'Cusp 2 sub-lord; 2, 6, 10, 11 support money.' },
    { key: 'gains', title: 'Gains and fulfilment of desires', cusp: 11, yes: [2, 6, 10, 11], no: [5, 8, 12], note: 'Cusp 11 sub-lord.' },
    { key: 'children', title: 'Children', cusp: 5, yes: [2, 5, 11], no: [1, 4, 10], note: 'Cusp 5 sub-lord; 2, 5, 11 support; 1, 4, 10 deny.' },
    { key: 'education', title: 'Education', cusp: 4, yes: [4, 9, 11], no: [3, 8, 12], note: 'Cusp 4 sub-lord; 4, 9, 11 support (9 for higher study).' },
    { key: 'property', title: 'Property and vehicles', cusp: 4, yes: [4, 11, 12], no: [3, 10], note: 'Cusp 4 sub-lord; 4, 11 (and 12 for a purchase) support.' },
    { key: 'foreign', title: 'Foreign travel / settlement', cusp: 12, yes: [3, 9, 12], no: [2, 4, 11], note: 'Cusp 12 sub-lord; 3, 9, 12 support.' },
    { key: 'health', title: 'Health and recovery', cusp: 6, yes: [1, 5, 11], no: [6, 8, 12], note: 'Cusp 6 sub-lord; 1, 5, 11 mean recovery; 6, 8, 12 mean illness.' },
    { key: 'legal', title: 'Legal matters and competition', cusp: 6, yes: [6, 11], no: [5, 12], note: 'Cusp 6 sub-lord; 6 and 11 support success.' }
  ];

  /** chart: from E.computeChart. */
  function compute(chart, nowMs) {
    const ayan = chart.ayanamsa, eps = chart.eps, lat = chart.input.lat, ramc = chart.ramc;
    const ascTrop = norm(chart.lagna.lon + ayan), mcTrop = norm(chart.mcLon + ayan);
    const cuspsT = placidusTropical(ramc, eps, lat, ascTrop, mcTrop);
    if (!cuspsT) return { error: 'Placidus houses cannot be computed at this latitude (beyond the polar circles).' };
    const cusps = cuspsT.map(c => norm(c - ayan + SHIFT));
    const cuspRows = cusps.map((lon, i) => Object.assign({ n: i + 1 }, lords(lon)));
    const planets = chart.planets.map(p => { const lon = norm(p.lon + SHIFT); return Object.assign({ key: p.key, retro: p.retro, house: houseOfLon(lon, cusps) }, lords(lon)); });
    const by = k => planets.find(p => p.key === k);
    const occ = h => planets.filter(p => p.house === h).map(p => p.key);
    const owned = k => cuspRows.filter(c => c.signLord === k).map(c => c.n);
    // houses signified by each planet, strongest first: star lord's occupied, own occupied, star lord's owned, own owned
    const pSig = {};
    PLANETS.forEach(k => {
      const p = by(k), s = by(p.star), L = [{ lvl: 1, h: [s.house] }, { lvl: 2, h: [p.house] }, { lvl: 3, h: owned(p.star) }, { lvl: 4, h: owned(k) }];
      const all = []; L.forEach(l => l.h.forEach(h => { if (!all.includes(h)) all.push(h); }));
      pSig[k] = { levels: L, houses: all.sort((a, b) => a - b), star: p.star };
    });
    // significators of each house: A star of occupants, B occupants, C star of owner, D owner
    const hSig = cuspRows.map(c => {
      const A = planets.filter(p => occ(c.n).includes(p.star)).map(p => p.key), B = occ(c.n), Lord = c.signLord, C = planets.filter(p => p.star === Lord).map(p => p.key);
      return { house: c.n, A, B, C, D: [Lord] };
    });
    // cuspal sub-lord analysis
    const analysis = TOPICS.map(t => {
      const c = cuspRows[t.cusp - 1], sig = pSig[c.sub].houses, hits = t.yes.filter(h => sig.includes(h)), deny = t.no.filter(h => sig.includes(h));
      const verdict = hits.length >= 2 && hits.length > deny.length ? 'Promised' : hits.length >= 1 ? 'Partly / delayed' : 'Not clearly promised';
      return Object.assign({}, t, { csl: c.sub, star: pSig[c.sub].star, sig, hits, deny, verdict });
    });
    // periods
    const moon = by('Moon'), per = periods(moon.lon, chart.utcMs), now = nowMs != null ? nowMs : Date.now();
    const cur = per.find(m => m.start <= now && now < m.end) || null; let curA = null, curP = null;
    if (cur) { curA = cur.antars.find(a => a.start <= now && now < a.end) || null; if (curA) curP = pratyantars(curA).find(a => a.start <= now && now < a.end) || null; }
    // upcoming windows per topic: mahadasha lord and antar lord both signify >= 2 supportive houses (and the antar lord signifies the cusp's own house)
    const windows = {};
    TOPICS.forEach(t => {
      const w = []; per.forEach(m => m.antars.forEach(a => {
        if (a.end < now || a.start > now + 25 * 365.25 * 864e5) return;
        const sm = pSig[m.lord].houses, sa = pSig[a.lord].houses, hm = t.yes.filter(h => sm.includes(h)).length, ha = t.yes.filter(h => sa.includes(h)).length;
        if (hm >= 2 && ha >= 2 && sa.includes(t.cusp)) w.push({ md: m.lord, ad: a.lord, start: Math.max(a.start, now), end: a.end });
      })); windows[t.key] = w.slice(0, 6);
    });
    return { shift: SHIFT, ayanamsa: ayan - SHIFT, cusps: cuspRows, planets, pSig, hSig, analysis, periods: per, current: { md: cur, ad: curA, pd: curP }, windows, lagna: cuspRows[0] };
  }

  /** ruling planets at a moment (needs a chart computed for that moment at the place) */
  function ruling(chartNow, weekday) {
    const kp = compute(chartNow); if (kp.error) return kp;
    const moon = kp.planets.find(p => p.key === 'Moon'), asc = kp.cusps[0], day = DAY_LORDS[weekday];
    const list = [['Day lord', day], ['Moon sign lord', moon.signLord], ['Moon star lord', moon.star], ['Lagna sign lord', asc.signLord], ['Lagna star lord', asc.star]];
    const count = {}; list.forEach(([, p]) => { count[p] = (count[p] || 0) + 1; });
    return { list, count, moon, asc, strongest: Object.keys(count).sort((a, b) => count[b] - count[a]) };
  }
  return { compute, ruling, lords, horaryTable, periods, pratyantars, TOPICS, ORDER, YRS, SHIFT, placidusTropical, houseOfLon, norm, dsaAsc };
});
