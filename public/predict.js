/* Life-timeline engine: Vimshottari + Yogini Dasha, natal planet strength, Jupiter/Saturn transits.
 * Rule-based and transparent: every score can be traced to the notes it prints.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.Predict = factory(root.VedicEngine);
})(typeof self !== 'undefined' ? self : this, function (E) {
  const DAY = 86400000, YEAR = 365.25 * DAY, MONTH = 30.4375 * DAY;
  const MALEFIC = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
  const YOGINI = [['Mangala','Moon',1],['Pingala','Sun',2],['Dhanya','Jupiter',3],['Bhramari','Mars',4],['Bhadrika','Mercury',5],['Ulka','Saturn',6],['Siddha','Venus',7],['Sankata','Rahu',8]];
  const HOUSE_THEME = { 1:'self, health and vitality', 2:'wealth, family and speech', 3:'effort, courage and siblings', 4:'home, mother and property', 5:'children, creativity and learning', 6:'work, service, health and debts', 7:'marriage and partnerships', 8:'transformation, sudden events and longevity', 9:'fortune, dharma and travel', 10:'career and status', 11:'gains and networks', 12:'expenses, foreign lands and rest' };
  const KARAKA = { Sun:'authority, vitality, recognition and the father', Moon:'the mind, emotions, mother and public life', Mars:'energy, courage, property and competition', Mercury:'intellect, trade, communication and skills', Jupiter:'wisdom, growth, children, teachers and wealth', Venus:'relationships, comfort, arts and income through pleasure or beauty', Saturn:'discipline, hard work, responsibility and delayed rewards', Rahu:'ambition, foreign links, technology and unconventional paths', Ketu:'detachment, spirituality, research and sudden endings' };
  const ord = n => n + (['th','st','nd','rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : (n % 10 < 4 ? n % 10 : 0)]);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const r1 = x => Math.round(x * 10) / 10;

  // ---------- Yogini Dasha (36-year cycle) ----------
  function yoginiDasha(moonLon, birthMs) {
    const NL = 360 / 27, nakIdx = Math.floor(moonLon / NL), frac = (moonLon - nakIdx * NL) / NL;
    let s = ((nakIdx + 1) + 3) % 8; if (s === 0) s = 8; s -= 1;
    const first = YOGINI[s], balance = first[2] * (1 - frac);
    let t = birthMs - (first[2] - balance) * YEAR; const out = [];
    for (let i = 0; i < 40; i++) {
      const y = YOGINI[(s + i) % 8], start = t, end = t + y[2] * YEAR, antars = []; let at = start;
      for (let j = 0; j < 8; j++) { const a = YOGINI[(s + i + j) % 8], len = y[2] * a[2] / 36 * YEAR; antars.push({ name: a[0], lord: a[1], start: at, end: at + len }); at += len; }
      out.push({ name: y[0], lord: y[1], years: y[2], start, end, antars }); t = end;
    }
    return { balanceYears: balance, maha: out.filter(m => m.end > birthMs) };
  }

  // ---------- Natal planet strength ----------
  function planetStrength(chart) {
    const P = {}; chart.planets.forEach(p => P[p.key] = p);
    const S = {};
    const calc = key => {
      const p = P[key], notes = []; let s = 0;
      if (p.dignity === 'Exalted') { s += 2; notes.push('exalted (+2)'); }
      else if (p.dignity === 'Own sign') { s += 1.5; notes.push('in own sign (+1.5)'); }
      else if (p.dignity === 'Debilitated') { s -= 2; notes.push('debilitated (−2)'); }
      const h = p.house;
      if (MALEFIC.includes(key) && [3, 6, 10, 11].includes(h)) { s += 1; notes.push(`natural malefic in ${ord(h)} house, a growth house (+1)`); }
      else if ([1, 4, 5, 7, 9, 10].includes(h)) { s += 1; notes.push(`in ${ord(h)} house, a kendra/trikona (+1)`); }
      else if ([2, 11].includes(h)) { s += 0.5; notes.push(`in ${ord(h)} house (+0.5)`); }
      else if ([6, 8, 12].includes(h)) { s -= 1; notes.push(`in ${ord(h)} house, a difficult house (−1)`); }
      const owned = chart.houses.filter(x => x.lord === key).map(x => x.house);
      owned.forEach(o => {
        if (o === 5 || o === 9) { s += 1; notes.push(`rules ${ord(o)} house, a trikona (+1)`); }
        else if (o === 1) { s += 0.5; notes.push('rules the Lagna (+0.5)'); }
        else if (o === 2) { s += 0.25; notes.push('rules the 2nd house (+0.25)'); }
        else if ([6, 8, 12].includes(o)) { s -= 0.75; notes.push(`rules ${ord(o)} house, a difficult house (−0.75)`); }
      });
      return { key, house: h, sign: p.signName, dignity: p.dignity, owned, notes, score: s };
    };
    ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].forEach(k => S[k] = calc(k));
    ['Rahu', 'Ketu'].forEach(k => {
      const x = calc(k), disp = S[E.SIGN_LORDS[P[k].sign]];
      x.score += 0.5 * disp.score; x.notes.push(`acts through its sign lord ${disp.key} (${disp.score >= 0 ? '+' : '−'}${Math.abs(r1(0.5 * disp.score))})`);
      S[k] = x;
    });
    Object.values(S).forEach(x => { x.score = r1(clamp(x.score, -3, 3)); x.label = strengthLabel(x.score); });
    return S;
  }
  const strengthLabel = s => s >= 1.5 ? 'strong' : s >= 0.5 ? 'good' : s > -0.5 ? 'moderate' : 'weak';
  const outlook = sc => sc >= 62 ? 'Favourable' : sc >= 46 ? 'Mixed' : 'Challenging';
  const tone = sc => sc >= 62 ? 'good' : sc >= 46 ? 'mid' : 'bad';

  // ---------- Transit scores (Gochar from natal Moon) ----------
  const JUP = { 1: 0.2, 2: 1.2, 3: 0, 4: 0, 5: 1.2, 6: -0.4, 7: 1.2, 8: -0.6, 9: 1.2, 10: -0.2, 11: 1.2, 12: -0.4 };
  const SAT = { 1: -1.2, 2: -1.2, 3: 1, 4: -0.8, 5: -0.3, 6: 1, 7: -0.3, 8: -0.8, 9: 0, 10: 0, 11: 1, 12: -1.2 };

  function compute(chart, nowMs) {
    nowMs = nowMs != null ? nowMs : Date.now();
    const birth = chart.utcMs, S = planetStrength(chart);
    const moonSign = chart.planets.find(p => p.key === 'Moon').sign, lagSign = chart.lagna.sign;
    const V = chart.dasha.maha, Y = yoginiDasha(chart.planets.find(p => p.key === 'Moon').lon, birth);
    const find = (list, t) => { const m = list.find(x => t >= x.start && t < x.end) || list[list.length - 1]; const a = m.antars.find(x => t >= x.start && t < x.end) || m.antars[m.antars.length - 1]; return { m, a }; };
    const lifeYears = Math.min(90, 2100 - chart.input.year);
    const sc = k => S[k].score;

    function recordAt(t) {
      const jd = E.jdFromMs(t), v = find(V, t), y = find(Y.maha, t);
      const jSign = Math.floor(E.siderealLon('Jupiter', jd) / 30), sSign = Math.floor(E.siderealLon('Saturn', jd) / 30);
      const jH = ((jSign - moonSign + 12) % 12) + 1, sH = ((sSign - moonSign + 12) % 12) + 1;
      const jL = ((jSign - lagSign + 12) % 12) + 1, sL = ((sSign - lagSign + 12) % 12) + 1;
      const dv = 0.5 * sc(v.m.lord) + 0.5 * sc(v.a.lord), dy = 0.6 * sc(y.m.lord) + 0.4 * sc(y.a.lord);
      const dasha = 0.6 * dv + 0.4 * dy, T = JUP[jH] + SAT[sH];
      const score = Math.round(clamp(50 + (dasha + 0.8 * T) * 11, 5, 95));
      return { t, age: (t - birth) / YEAR, vMD: v.m.lord, vAD: v.a.lord, yMD: y.m.lord, yAD: y.a.lord, yMDName: y.m.name, yADName: y.a.name,
        jH, sH, jL, sL, jSign, sSign, sade: [12, 1, 2].includes(sH), dasha, T, score };
    }

    // monthly series across life
    const months = [];
    for (let m = 0; m < lifeYears * 12; m++) months.push(recordAt(birth + (m + 0.5) * MONTH));
    const years = [];
    for (let y = 0; y < lifeYears; y++) {
      const ms = months.slice(y * 12, y * 12 + 12), mid = ms[6], avg = Math.round(ms.reduce((a, x) => a + x.score, 0) / 12);
      const adH = S[mid.vAD].house;
      years.push({ age: y, year: new Date(birth + (y + 0.5) * YEAR).getUTCFullYear(), score: avg, outlook: outlook(avg), tone: tone(avg),
        vMD: mid.vMD, vAD: mid.vAD, yMD: mid.yMD, yAD: mid.yAD, jH: mid.jH, sH: mid.sH, jL: mid.jL, sade: ms.some(x => x.sade),
        themes: [`${HOUSE_THEME[adH]} (${mid.vAD} period, placed in ${ord(adH)} house)`, `${HOUSE_THEME[mid.jL]} (Jupiter transiting your ${ord(mid.jL)} house)`] });
    }
    // Sade Sati bands
    const sade = []; let open = null;
    months.forEach((m, i) => { if (m.sade && !open) open = { from: m.age }; if (!m.sade && open) { open.to = months[i - 1].age; sade.push(open); open = null; } });
    if (open) { open.to = months[months.length - 1].age; sade.push(open); }

    // annotate periods
    const within = (a, b) => months.filter(m => m.t >= a && m.t < b);
    const rangeAges = list => { const ys = list.map(m => m.age); return `age ${Math.floor(Math.min(...ys))}–${Math.ceil(Math.max(...ys))}`; };
    function annotate(p, isMaha, system) {
      const ms = within(Math.max(p.start, birth), p.end);
      const avg = ms.length ? Math.round(ms.reduce((a, m) => a + m.score, 0) / ms.length) : null;
      const st = S[p.lord]; const o = { avg, outlook: avg == null ? '' : outlook(avg), tone: avg == null ? '' : tone(avg), strength: st };
      if (isMaha && ms.length > 24) {
        const ys = []; for (let i = 0; i + 12 <= ms.length; i += 12) ys.push({ a: ms[i].age, s: ms.slice(i, i + 12).reduce((x, m) => x + m.score, 0) / 12 });
        const best = ys.reduce((a, b) => b.s > a.s ? b : a), worst = ys.reduce((a, b) => b.s < a.s ? b : a);
        o.best = `age ${Math.floor(best.a)}`; o.worst = `age ${Math.floor(worst.a)}`;
      }
      if (ms.length) {
        const js = [...new Set(ms.map(m => m.jH))], ss = [...new Set(ms.map(m => m.sH))];
        o.transit = `Jupiter passes ${js.length > 1 ? 'through' : 'in'} house${js.length > 1 ? 's' : ''} ${js.join(', ')} from the Moon; Saturn in ${ss.join(', ')}${ms.some(m => m.sade) ? ' (includes Sade Sati)' : ''}.`;
      }
      return o;
    }
    const ann = (list, system) => list.map(m => Object.assign({}, m, annotate(m, true, system), {
      text: periodText(m.lord, S, chart),
      antars: m.antars.filter(a => a.end > birth).map(a => Object.assign({}, a, annotate(a, false, system), { focus: HOUSE_THEME[S[a.lord].house], house: S[a.lord].house }))
    }));
    const vim = ann(V, 'v'), yog = ann(Y.maha, 'y');

    const now = recordAt(nowMs), next12 = []; for (let k = 0; k < 12; k++) next12.push(recordAt(nowMs + k * MONTH));
    const nowAge = (nowMs - birth) / YEAR, future = years.filter(y => y.age >= Math.floor(nowAge));
    const sorted = future.slice().sort((a, b) => b.score - a.score);
    return { strengths: S, vimsh: vim, yogini: yog, yoginiBalance: Y.balanceYears, months, years, sade, now, next12, nowAge, lifeYears,
      best: sorted.slice(0, 5), hard: sorted.slice(-5).reverse(), HOUSE_THEME };
  }

  function periodText(lord, S, chart) {
    const st = S[lord], p = chart.planets.find(x => x.key === lord);
    const dig = st.dignity ? `${st.dignity === 'Own sign' ? 'in its own sign' : st.dignity.toLowerCase()}, ` : '';
    const rules = st.owned.length ? `rules the ${st.owned.map(ord).join(' and ')} house (${st.owned.map(o => HOUSE_THEME[o]).join('; ')})` : `has no house of its own and acts through its sign lord ${E.SIGN_LORDS[p.sign]}`;
    return `${lord} brings focus on ${KARAKA[lord]}. In your chart it sits ${dig}in ${p.signName} in the ${ord(st.house)} house (${HOUSE_THEME[st.house]}) and ${rules}. Natal strength: ${st.label} (${st.score > 0 ? '+' : ''}${st.score}).`;
  }

  return { compute, yoginiDasha, planetStrength, outlook, tone, HOUSE_THEME, KARAKA, YOGINI, ord };
});
