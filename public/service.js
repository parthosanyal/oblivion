/* Report service: one function that turns a request into report points.
 * Used by the Node server (paid reports) and by the single-file demo build (no payments).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../public/engine.js'), require('../public/predict.js'), require('./reports.js'), require('./koota.js'), require('./pro.js'));
  else root.ReportService = factory(root.VedicEngine, root.Predict, root.Reports, root.Koota, root.Pro);
})(typeof self !== 'undefined' ? self : this, function (E, P, R, K, Pro) {
  const TYPES = ['kundli', 'marriage', 'career', 'numerology', 'yearly'];
  const TITLES = { kundli: 'Kundli analysis', marriage: 'Marriage compatibility', career: 'Career and finance', numerology: 'Numerology report', yearly: 'Yearly horoscope' };

  const num = (v, lo, hi, what, int) => {
    const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    if (typeof n !== 'number' || !isFinite(n) || n < lo || n > hi || (int && !Number.isInteger(n))) throw new Error('Invalid ' + what + '.');
    return n;
  };
  /** Validates and normalises birth details. Throws Error with a message safe to show the user. */
  function cleanBirth(b, label) {
    if (!b || typeof b !== 'object') throw new Error('Birth details are missing.');
    const out = { year: num(b.year, 1800, 2050, 'year', true), month: num(b.month, 1, 12, 'month', true), day: num(b.day, 1, 31, 'day', true), hour: num(b.hour, 0, 23, 'hour', true), minute: num(b.minute, 0, 59, 'minute', true), lat: num(b.lat, -90, 90, 'latitude'), lon: num(b.lon, -180, 180, 'longitude') };
    if (typeof b.tz !== 'string' || b.tz.length > 64) throw new Error('Invalid time zone.');
    try { new Intl.DateTimeFormat('en', { timeZone: b.tz }); } catch (e) { throw new Error('Unknown time zone.'); }
    out.tz = b.tz;
    out.name = typeof b.name === 'string' ? b.name.replace(/[\u0000-\u001f<>]/g, '').slice(0, 80) : '';
    return out;
  }
  const chartOf = b => E.computeChart(b);

  const cache = new Map();   // small LRU of chart + predictions, so stepping between reports is cheap
  function base(b, now) {
    const key = [b.year, b.month, b.day, b.hour, b.minute, b.lat, b.lon, b.tz, Math.floor(now / 864e5)].join('|');
    let v = cache.get(key);
    if (!v) { const chart = chartOf(b); v = { chart, pred: P.compute(chart, now) }; cache.set(key, v); if (cache.size > 100) cache.delete(cache.keys().next().value); }
    return v;
  }

  /** req: { type, birth, partner?, year?, numName? } -> { type, points, varsha?, names? } */
  function build(req, nowMs) {
    if (!req || !TYPES.includes(req.type)) throw new Error('Unknown report.');
    const now = nowMs != null ? nowMs : Date.now(), b = cleanBirth(req.birth), { chart, pred } = base(b, now);
    let rep;
    if (req.type === 'kundli') rep = Pro.kundli(chart, pred, b);
    else if (req.type === 'career') rep = R.career(chart, pred);
    else if (req.type === 'numerology') rep = R.numerology(b, typeof req.numName === 'string' ? req.numName.replace(/[\u0000-\u001f<>]/g, '').slice(0, 80) : null, new Date(now));
    else if (req.type === 'yearly') {
      const first = b.year, last = b.year + pred.lifeYears - 1, def = Math.min(b.year + Math.floor(pred.nowAge), last);
      const y = req.year == null ? def : num(req.year, first, last, 'year', true);
      rep = R.yearly(chart, pred, y);
      rep.year = y; rep.firstYear = first; rep.lastYear = last; rep.currentYear = def;
    } else {
      let res = null, names, pcx = null, pcRole = null;
      if (req.partner) {
        const p = cleanBirth(req.partner), role = req.partner.role === 'bride' ? 'bride' : 'groom', pc = chartOf(p);
        const bride = role === 'groom' ? pc : chart, groom = role === 'groom' ? chart : pc, mn = b.name || 'You', pn = p.name || 'Partner';
        res = K.match(bride, groom); names = role === 'groom' ? { bride: pn, groom: mn } : { bride: mn, groom: pn };
        pcx = pc; pcRole = role;
      }
      rep = res ? Pro.marriage(chart, pred, res, names, pcx, P.compute(pcx, now), pcRole) : Pro.marriage(chart, pred, null, names);
      rep.matched = !!res;
    }
    const out = { type: req.type, points: rep.points, meta: {} };
    if (rep.varsha) out.varsha = { lagnaSign: rep.varsha.lagna.sign, planets: rep.varsha.planets.map(p => ({ key: p.key, sign: p.sign, retro: p.retro })) };
    if (req.type === 'yearly') out.meta = { year: rep.year, firstYear: rep.firstYear, lastYear: rep.lastYear, currentYear: rep.currentYear };
    if (req.type === 'marriage') out.meta = { matched: rep.matched };
    return out;
  }
  return { build, cleanBirth, TYPES, TITLES };
});
