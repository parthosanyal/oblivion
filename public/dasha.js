/* Dasha systems: Vimshottari, Yogini, Ashtottari, Tribhagi (one-third Vimshottari) and Chara (Jaimini).
 * build(chart, id) -> { id, name, blurb, applies?, maha: [{ label, years, start, end, antars: [{ label, start, end }] }] }
 * Every period has a start and end in ms. The same shape is used for all systems so one screen can show any of them.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('./predict.js'));
  else root.Dasha = factory(root.VedicEngine, root.Predict);
})(typeof self !== 'undefined' ? self : this, function (E, P) {
  const YEAR = 365.25 * 86400000, NL = 360 / 27, SPAN = 120;     // list periods for 120 years from birth
  const SYSTEMS = [
    ['vimshottari', 'Vimshottari', '120-year cycle, the most used system. Starts from the Moon\'s nakshatra.'],
    ['yogini', 'Yogini', '36-year cycle of eight Yoginis. Often used to confirm Vimshottari results.'],
    ['ashtottari', 'Ashtottari', '108-year cycle with eight planets (no Ketu). Classically used when Rahu stands in a kendra or trikona from the Lagna lord.'],
    ['tribhagi', 'Tribhagi', 'Vimshottari shortened to one third (40 years), repeated three times. Gives faster-moving periods.'],
    ['chara', 'Chara (Jaimini)', 'Sign-based dasha from Jaimini astrology. Each sign rules for 1 to 12 years, counted from the Lagna.']
  ];
  const ALL = { vimshottari: 1, yogini: 1, ashtottari: 1, tribhagi: 1, chara: 1 };

  const VIM = [['Ketu', 7], ['Venus', 20], ['Sun', 6], ['Moon', 10], ['Mars', 7], ['Rahu', 18], ['Jupiter', 16], ['Saturn', 19], ['Mercury', 17]];
  // Ashtottari: nakshatras are handed out in groups, starting from Ardra (index 5)
  const ASH = [['Sun', 6, 4], ['Moon', 15, 3], ['Mars', 8, 4], ['Mercury', 17, 3], ['Saturn', 10, 3], ['Jupiter', 19, 3], ['Rahu', 12, 4], ['Venus', 21, 3]];
  const ASH_START = 5;

  /** Builds mahadashas from a repeating [label, lord, years] sequence. start: index in seq, frac: part of the first period already used. */
  function fromSequence(seq, startIdx, frac, birthMs, scale) {
    const total = seq.reduce((s, x) => s + x[2] * scale, 0), maha = [];
    let t = birthMs - seq[startIdx][2] * scale * frac * YEAR;
    for (let i = 0; t < birthMs + SPAN * YEAR && i < 400; i++) {
      const k = (startIdx + i) % seq.length, [label, lord, y0] = seq[k], y = y0 * scale, end = t + y * YEAR, antars = [];
      let at = t;
      for (let j = 0; j < seq.length; j++) {
        const a = seq[(k + j) % seq.length], len = y * (a[2] * scale) / total * YEAR;
        antars.push({ label: label + ' – ' + a[0], start: at, end: at + len }); at += len;
      }
      maha.push({ label: label, lord: lord, years: y, start: t, end, antars });
      t = end;
    }
    return maha.filter(m => m.end > birthMs);
  }

  const moonOf = chart => chart.planets.find(p => p.key === 'Moon').lon;
  const info = id => SYSTEMS.find(s => s[0] === id);

  function build(chart, id) {
    if (!ALL[id]) throw new Error('Unknown dasha system.');
    const birth = chart.utcMs, moon = moonOf(chart), nak = Math.floor(moon / NL), frac = (moon - nak * NL) / NL, meta = info(id);
    const out = { id, name: meta[1], blurb: meta[2] };
    if (id === 'vimshottari' || id === 'tribhagi') {
      const seq = VIM.map(x => [x[0], x[0], x[1]]), scale = id === 'tribhagi' ? 1 / 3 : 1;
      out.maha = fromSequence(seq, nak % 9, frac, birth, scale);
      out.balanceYears = seq[nak % 9][2] * scale * (1 - frac);
      out.first = seq[nak % 9][0];
    } else if (id === 'yogini') {
      const Y = P.yoginiDasha(moon, birth);
      out.maha = Y.maha.filter(m => m.start < birth + SPAN * YEAR).map(m => ({ label: m.name + ' (' + m.lord + ')', lord: m.lord, years: m.years, start: m.start, end: m.end, antars: m.antars.map(a => ({ label: m.name + ' – ' + a.name, start: a.start, end: a.end })) }));
      out.balanceYears = Y.balanceYears; out.first = Y.maha[0].name + ' (' + Y.maha[0].lord + ')';
    } else if (id === 'ashtottari') {
      const rel = (nak - ASH_START + 27) % 27;
      let g = 0, used = 0;
      while (rel >= used + ASH[g][2]) { used += ASH[g][2]; g++; }
      const within = (rel - used + frac) / ASH[g][2];
      const seq = ASH.map(x => [x[0], x[0], x[1]]);
      out.maha = fromSequence(seq, g, within, birth, 1);
      out.balanceYears = ASH[g][1] * (1 - within); out.first = ASH[g][0];
      // classical condition: Rahu in a kendra or trikona (not the 1st) from the Lagna lord
      const ll = chart.planets.find(p => p.key === chart.lagna.signLord), ra = chart.planets.find(p => p.key === 'Rahu'), h = ((ra.sign - ll.sign + 12) % 12) + 1;
      const ok = [4, 5, 7, 9, 10].includes(h);
      out.applies = ok;
      out.applyNote = ok ? `Rahu is in the ${P.ord(h)} house from the Lagna lord (${ll.key}), so the classical condition for Ashtottari is met in this chart.` : `Rahu is in the ${P.ord(h)} house from the Lagna lord (${ll.key}), so the classical condition for Ashtottari is not met. Treat this as a secondary view and use Vimshottari first.`;
    } else {
      Object.assign(out, chara(chart, birth));
    }
    return out;
  }

  // ---------- Chara dasha (Jaimini) ----------
  const SAVYA = [0, 1, 2, 6, 7, 8];                        // Aries, Taurus, Gemini, Libra, Scorpio, Sagittarius count forward; the other six count backward
  const LORD_SIGN = (chart, sign) => {
    const lord = sign === 7 ? 'Mars' : sign === 10 ? 'Saturn' : E.SIGN_LORDS[sign];
    return chart.planets.find(p => p.key === lord).sign;
  };
  function chara(chart, birth) {
    const lag = chart.lagna.sign, fwd = SAVYA.includes(lag), step = fwd ? 1 : -1, order = [], yrs = {};
    for (let i = 0; i < 12; i++) order.push((lag + step * i + 120) % 12);
    for (let s = 0; s < 12; s++) {
      const ls = LORD_SIGN(chart, s), d = SAVYA.includes(s) ? (ls - s + 12) % 12 : (s - ls + 12) % 12;      // signs passed counting from s to the lord's sign
      yrs[s] = d === 0 ? 12 : d;
    }
    const maha = [];
    let t = birth;
    for (let cyc = 0; cyc < 2 && t < birth + SPAN * YEAR; cyc++) {
      for (const s of order) {
        const y = cyc === 0 ? yrs[s] : 12 - yrs[s]; if (y <= 0) continue;
        const end = t + y * YEAR, aStep = SAVYA.includes(s) ? 1 : -1, antars = [];
        for (let j = 0; j < 12; j++) { const a = (s + aStep * j + 120) % 12; antars.push({ label: E.SIGNS[s] + ' – ' + E.SIGNS[a], start: t + y / 12 * j * YEAR, end: t + y / 12 * (j + 1) * YEAR }); }
        maha.push({ label: E.SIGNS[s], lord: E.SIGN_LORDS[s], years: y, start: t, end, antars }); t = end;
        if (t >= birth + SPAN * YEAR) break;
      }
    }
    return { maha, first: E.SIGNS[lag], balanceYears: null, direction: fwd ? 'forward (Aries to Pisces order)' : 'backward (Pisces to Aries order)' };
  }

  return { SYSTEMS: SYSTEMS.map(s => ({ id: s[0], name: s[1], blurb: s[2] })), build };
});
