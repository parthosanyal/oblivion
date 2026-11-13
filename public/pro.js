/* Full-length reports: Kundli (with 10-year forecast, wide yoga and dosha scan) and two-chart Marriage compatibility.
 * Wraps reports.js. HTML strings only, no DOM. Every statement is tied to a placement printed in the text.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('./predict.js'), require('./bala.js'), require('./reading.js'), require('./koota.js'), require('./reports.js'), require('./texts.js'));
  else root.Pro = factory(root.VedicEngine, root.Predict, root.Bala, root.Reading, root.Koota, root.Reports, root.Texts);
})(typeof self !== 'undefined' ? self : this, function (E, P, B, RD, K, R, T) {
  const ord = P.ord, SIGNS = E.SIGNS, LORD = E.SIGN_LORDS, HT = P.HOUSE_THEME, join = RD.join, YEAR = 365.25 * 864e5;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const ul = a => '<ul>' + a.filter(Boolean).map(i => `<li>${i}</li>`).join('') + '</ul>';
  const h4 = t => `<h4>${t}</h4>`;
  const mon = ms => new Date(ms).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const pill = sc => `<span class="tag ${P.tone(sc)}">${P.outlook(sc)} · ${Math.round(sc)}</span>`;
  const hb = (label, v, sub) => { const t = v >= 62 ? 'fgood' : v >= 46 ? 'fmid' : 'fbad'; return `<div class="hb"><span class="nm">${esc(label)}</span><div class="tr"><i class="fill ${t}" style="left:0;width:${clamp(v, 0, 100)}%"></i></div><span class="val">${Math.round(v)}</span>${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</div>`; };
  const table = (head, rows) => `<div class="scroll"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const mode = a => { const c = {}; a.forEach(x => { c[x] = (c[x] || 0) + 1; }); return +Object.keys(c).sort((x, y) => c[y] - c[x])[0]; };
  const KEND = [1, 4, 7, 10], TRIK = [1, 5, 9], DUS = [6, 8, 12], EX = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
  const AREA_NAME = { career: 'Career', finance: 'Money', love: 'Relationships', health: 'Health', home: 'Home and family' };
  const AREA_LONG = { career: 'career, work and status', finance: 'income, savings and investments', love: 'love, marriage and partnerships', health: 'health and energy', home: 'home, property and family' };

  // =========================================================== YOGAS AND DOSHAS
  function scan(chart, pred) {
    const g = k => chart.planets.find(p => p.key === k), lord = n => chart.houses[n - 1].lord, S = P.planetStrength(chart), moon = g('Moon'), items = [];
    const strongSign = p => p.dignity === 'Own sign' || p.dignity === 'Exalted', fm = (a, b) => ((a.sign - b.sign + 12) % 12) + 1, seen = new Set();
    const add = (name, kind, level, detail, effect, advice) => items.push({ name, kind, level, detail, effect, advice: advice || '' });
    // ---- yogas
    const MP = { Mars: ['Ruchaka', 'courage, command and leadership in action, technical or athletic fields'], Mercury: ['Bhadra', 'a sharp intellect, eloquence and skill in business or learning'], Jupiter: ['Hamsa', 'wisdom, ethics, good standing and a gift for guiding others'], Venus: ['Malavya', 'refinement, comfort, charm and artistic or relationship gifts'], Saturn: ['Sasa', 'discipline, authority over many people and lasting achievement'] };
    Object.entries(MP).forEach(([k, [n, t]]) => { const p = g(k); if (strongSign(p) && KEND.includes(p.house)) add(`${n} Yoga (Pancha Mahapurusha)`, 'yoga', 'strong', `${k} is ${p.dignity === 'Exalted' ? 'exalted' : 'in its own sign'} in ${p.signName}, in the ${ord(p.house)} house (a kendra).`, `One of the five "great person" yogas. It points to ${t}.`); });
    chart.yogas.filter(y => y.present && /Gajakesari|Budhaditya|Chandra/.test(y.name)).forEach(y => { const m = T.YOGA[y.name]; add(y.name, 'yoga', 'moderate', y.detail, m ? m[0] : ''); });
    [...[4, 7, 10].map(n => [n, lord(n)])].forEach(([a, la]) => [[5, lord(5)], [9, lord(9)], [1, lord(1)]].forEach(([b, lb]) => {
      if (la === lb) return; const pa = g(la), pb = g(lb), key = [la, lb].sort().join(); if (seen.has(key)) return;
      const how = pa.sign === pb.sign ? `are together in ${pa.signName}` : (pa.house === b && pb.house === a) ? 'exchange signs' : ((pa.sign - pb.sign + 12) % 12 === 6) ? 'face each other (mutual 7th aspect)' : null;
      if (how) { seen.add(key); add('Raja Yoga (kendra and trikona lords)', 'yoga', S[la].score + S[lb].score >= 1.5 ? 'strong' : 'moderate', `${ord(a)} lord ${la} and ${ord(b)} lord ${lb} ${how}.`, 'A kendra lord joined with a trikona lord is the classical combination for rise in status, authority and recognition. It tends to show its results in the dasha of the planets involved.'); }
    }));
    ['Mars', 'Venus', 'Saturn', 'Mercury', 'Jupiter', 'Moon', 'Sun'].forEach(k => { const o = chart.houses.filter(h => h.lord === k).map(h => h.house); if (o.some(h => [4, 7, 10].includes(h)) && o.some(h => [5, 9].includes(h))) add(`Yogakaraka ${k}`, 'yoga', 'strong', `${k} rules both a kendra and a trikona (houses ${o.join(' and ')}) for this Lagna.`, `${k} acts as the most beneficial planet of the chart. Its dasha and antardasha are traditionally among the best periods.`); });
    const dh = []; [[2, 11], [1, 2], [1, 11], [5, 9], [2, 5], [2, 9], [9, 11], [5, 11], [1, 5], [1, 9]].forEach(([a, b]) => { const la = lord(a), lb = lord(b); if (la === lb) return; const pa = g(la), pb = g(lb); if (pa.sign === pb.sign) dh.push(`${ord(a)} lord ${la} and ${ord(b)} lord ${lb} are together in ${pa.signName}`); else if (pa.house === b && pb.house === a) dh.push(`${ord(a)} lord ${la} and ${ord(b)} lord ${lb} exchange houses`); });
    [...new Set(dh)].slice(0, 3).forEach(d => add('Dhana Yoga (wealth combination)', 'yoga', 'moderate', d + '.', 'Links the houses of income, gains and fortune. It supports earning and accumulation, especially in the related dashas.'));
    [[6, 'Harsha'], [8, 'Sarala'], [12, 'Vimala']].forEach(([n, nm]) => { const l = lord(n), p = g(l); if (DUS.includes(p.house)) add(`${nm} Yoga (Viparita Raja)`, 'yoga', 'moderate', `${ord(n)} lord ${l} sits in the ${ord(p.house)} house, another difficult house.`, 'A difficult-house lord placed in a difficult house is read as "reversal": trouble in that area eventually turns into gain, resilience and success after struggle.'); });
    Object.keys(EX).forEach(k => { const p = g(k); if (p.dignity !== 'Debilitated') return; const d = p.sign, disp = g(LORD[d]), exK = Object.keys(EX).find(x => EX[x] === d), ex = exK && g(exK);
      const ok = [disp, ex].filter(Boolean).find(q => KEND.includes(q.house) || KEND.includes(fm(q, moon)));
      if (ok) add(`Neecha Bhanga Raja Yoga (${k})`, 'yoga', 'strong', `${k} is debilitated in ${p.signName}, but ${ok.key} (${ok.key === LORD[d] ? 'its sign lord' : 'the planet exalted there'}) is in a kendra from the Lagna or the Moon.`, 'The weakness of the debilitated planet is cancelled and is read as a late-blooming strength: the area it rules improves after early difficulty.');
      else add(`Debilitated ${k}`, 'dosha', 'mild', `${k} is debilitated in ${p.signName} and no common cancellation applies.`, `${cap(P.KARAKA[k])} may need more effort. Debilitation is a tendency to work with, not a verdict.`); });
    const oth = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map(g), h2 = oth.filter(p => fm(p, moon) === 2), h12 = oth.filter(p => fm(p, moon) === 12), hc = oth.filter(p => fm(p, moon) === 1);
    if (!h2.length && !h12.length && !hc.length) { const canc = oth.some(p => KEND.includes(fm(p, moon))) || KEND.includes(moon.house);
      add('Kemadruma Yoga', 'dosha', canc ? 'mild' : 'moderate', 'No planet (other than the Sun and nodes) is in the 2nd, 12th or with the Moon.' + (canc ? ' It is cancelled because a planet or the Moon itself is in a kendra.' : ''), canc ? 'Cancelled, so it does not carry its usual meaning of loneliness or instability.' : 'Traditionally read as periods of emotional isolation or financial swings. Supportive routines and close relationships help.'); }
    else if (h2.length && h12.length) add('Durudhara Yoga', 'yoga', 'moderate', `${join(h2.map(p => p.key))} in the 2nd and ${join(h12.map(p => p.key))} in the 12th from the Moon.`, 'The Moon is flanked on both sides: comfort, generosity and a good reputation.');
    else if (h2.length) add('Sunapha Yoga', 'yoga', 'mild', `${join(h2.map(p => p.key))} in the 2nd from the Moon.`, 'Self-earned wealth and intelligence.');
    else if (h12.length) add('Anapha Yoga', 'yoga', 'mild', `${join(h12.map(p => p.key))} in the 12th from the Moon.`, 'Health, a pleasing personality and a good name.');
    const ben = ['Mercury', 'Jupiter', 'Venus'].map(g);
    if (ben.filter(p => [6, 7, 8].includes(fm(p, moon))).length >= 2) add('Adhi Yoga', 'yoga', 'moderate', 'Benefics occupy the 6th, 7th or 8th from the Moon.', 'Traditionally gives leadership, comfort and the ability to overcome opposition.');
    const am = ben.filter(p => p.house === 10 || fm(p, moon) === 10); if (am.length) add('Amala Yoga', 'yoga', 'moderate', `${join(am.map(p => p.key))} in the 10th from the Lagna or the Moon.`, 'A lasting good reputation built on conduct and service.');
    if (ben.filter(p => [3, 6, 10, 11].includes(p.house)).length >= 2) add('Vasumati Yoga', 'yoga', 'mild', 'Benefics occupy growth houses (3rd, 6th, 10th, 11th).', 'Steady growth of wealth through effort, and an improving income with time.');
    if (ben.every(p => [1, 2, 4, 5, 7, 9, 10].includes(p.house)) && (strongSign(g('Jupiter')) || [1, 4, 5, 7, 9, 10].includes(g('Jupiter').house))) add('Saraswati Yoga', 'yoga', 'strong', 'Jupiter, Venus and Mercury are all in good houses.', 'Learning, eloquence, creative and scholarly ability.');
    const l9 = g(lord(9)); if (TRIK.concat([4, 7, 10]).includes(l9.house) && strongSign(l9) && S[lord(1)].score >= 0.5) add('Lakshmi Yoga', 'yoga', 'strong', `9th lord ${l9.key} is strong in the ${ord(l9.house)} house and the Lagna lord is well placed.`, 'Fortune, comfort and prosperity, usually from mid-life.');
    if (g('Jupiter').sign === g('Mars').sign) add('Guru-Mangala Yoga', 'yoga', 'moderate', `Jupiter and Mars are together in ${g('Jupiter').signName}.`, 'Energy guided by wisdom; good for property, law, teaching and enterprise.');
    // ---- doshas
    const man = chart.yogas.find(y => /Manglik/.test(y.name));
    if (man && man.present) { const m = R.manglikDetail(chart, { pl: g }); add('Mangal Dosha (Manglik)', 'dosha', m.canc.length ? 'mild' : m.lagB && m.moonB ? 'strong' : 'moderate', `Mars is in the ${ord(m.hl)} house from the Lagna and the ${ord(m.hm)} from the Moon: ${m.sev}.` + (m.canc.length ? ' Cancellations: ' + m.canc.join('; ') + '.' : ''), 'Traditionally affects ease in marriage and temper at home. It is handled by matching with a similar chart, patience and calm communication.', 'Traditional: Hanuman worship on Tuesdays, charity of red lentils.'); }
    const ks = chart.yogas.find(y => /Kaal/.test(y.name));
    if (ks && ks.present) { const rh = g('Rahu').house, KSN = ['Anant', 'Kulik', 'Vasuki', 'Shankhpal', 'Padma', 'Mahapadma', 'Takshak', 'Karkotak', 'Shankhchur', 'Ghatak', 'Vishdhar', 'Sheshnag'][rh - 1]; add(`Kaal Sarp Yoga (${KSN})`, 'dosha', 'moderate', `All seven planets lie on one side of the Rahu-Ketu axis, with Rahu in the ${ord(rh)} house.`, `The ${KSN} type is linked with ${HT[rh]}. It is read as a life of sudden turns and delayed results that improves with time and effort.`, 'Traditional: Shiva worship, Naga Panchami observance.'); }
    const con = (a, b) => g(a).sign === g(b).sign;
    if (con('Sun', 'Rahu') || con('Sun', 'Ketu') || con('Moon', 'Rahu') || con('Moon', 'Ketu')) { const who = [['Sun', 'Rahu'], ['Sun', 'Ketu'], ['Moon', 'Rahu'], ['Moon', 'Ketu']].filter(([a, b]) => con(a, b)).map(([a, b]) => `${a} with ${b}`); add('Grahan Dosha (eclipse)', 'dosha', 'moderate', `${join(who)}.`, 'A luminary joined with a node is read as clouding the mind (Moon) or self-confidence and vitality (Sun). It tends to ease with maturity.', 'Traditional: charity and meditation on eclipse days.'); }
    if (con('Jupiter', 'Rahu')) add('Guru Chandal Yoga', 'dosha', 'moderate', `Jupiter is with Rahu in ${g('Jupiter').signName}.`, 'Wisdom mixed with unconventional or doubting views; guidance from teachers needs discernment. Can also give originality.', 'Traditional: respect to teachers, Thursday charity.');
    if (con('Saturn', 'Rahu')) add('Shrapit Dosha', 'dosha', 'moderate', `Saturn is with Rahu in ${g('Saturn').signName}.`, 'Read as delays, heavy responsibilities and karmic lessons, with the effect depending on the house involved.', 'Traditional: Saturday charity, Shani mantra.');
    if (con('Mars', 'Rahu')) add('Angarak Dosha', 'dosha', 'moderate', `Mars is with Rahu in ${g('Mars').signName}.`, 'Read as impulsiveness, temper and accident-proneness; channel the energy into sport or disciplined work.', 'Traditional: Hanuman worship.');
    if (con('Moon', 'Saturn')) add('Vish Yoga', 'dosha', 'moderate', `Moon and Saturn are together in ${moon.signName}.`, 'A serious, worried or reserved mind; emotions are held in. Often gives maturity and endurance.', 'Traditional: Shiva worship on Mondays.');
    if (con('Sun', 'Rahu') || con('Sun', 'Ketu') || con('Sun', 'Saturn') || [g('Rahu'), g('Ketu')].some(p => p.house === 9) || [g('Rahu'), g('Ketu')].some(p => p.sign === g(lord(9)).sign)) add('Pitra Dosha', 'dosha', 'mild', 'The Sun is joined with Saturn or a node, or a node influences the 9th house or its lord.', 'Read as unresolved ancestral or father-related themes, and delays in luck or support from elders.', 'Traditional: offerings on Amavasya, service to elders.');
    if ([0, 8, 9, 17, 18, 26].includes(moon.nakIndex)) add('Gandmool Nakshatra', 'dosha', 'mild', `The Moon is in ${moon.nakshatra}, a Gandmool star.`, 'Traditionally an intense birth star that benefits from a shanti ritual in childhood; many people with it do very well.', 'Traditional: Gandmool shanti puja.');
    if (pred && pred.now) { if (pred.now.sade) add('Sade Sati (running now)', 'dosha', 'moderate', `Saturn is ${ord(pred.now.sH)} from your Moon.`, 'The 7.5-year Saturn period over the Moon sign: more responsibility, slower progress and lessons in patience, followed by consolidation.', 'Traditional: Saturday service, Hanuman Chalisa.'); else if ([4, 8].includes(pred.now.sH)) add('Shani Dhaiya (running now)', 'dosha', 'mild', `Saturn is ${ord(pred.now.sH)} from your Moon.`, 'A 2.5-year Saturn phase read as pressure on home, comfort or health.', 'Traditional: Saturday charity.'); }
    if (g('Saturn').retro && [1, 7].includes(g('Saturn').house)) add('Saturn in a sensitive house', 'dosha', 'mild', `Saturn is retrograde in the ${ord(g('Saturn').house)} house.`, 'Slow, serious start with deepening results later.');
    if ([6, 8, 12].includes(((moon.sign - g('Jupiter').sign + 12) % 12) + 1) && !KEND.includes(moon.house)) add('Shakata Yoga', 'dosha', 'mild', `The Moon is in the ${ord(((moon.sign - g('Jupiter').sign + 12) % 12) + 1)} from Jupiter and not in a kendra.`, 'Read as ups and downs in fortune that level out with time.');
    return items;
  }
  const LV = { strong: 'Strong', moderate: 'Moderate', mild: 'Mild' };
  const yogaCard = y => `<div class="yoga"><b>${esc(y.name)}</b> <span class="tag ${y.kind === 'dosha' ? 'bad' : 'good'}">${y.kind === 'dosha' ? 'Dosha' : 'Yoga'} · ${LV[y.level]}</span><div class="rtext">${esc(y.detail)}</div><div class="rtext">${esc(y.effect)}</div>${y.advice ? `<div class="rtext hint">${esc(y.advice)}</div>` : ''}</div>`;

  // =========================================================== TEN-YEAR FORECAST
  function decade(chart, pred) {
    const now = Date.now(), S = pred.strengths, mths = pred.months, vim = pred.vimsh.flatMap(m => m.antars.map(a => Object.assign({ md: m.lord }, a)));
    const ARE = Object.keys(R.AREAS), yrs = [];
    for (let i = 0; i < 10; i++) {
      const A = now + i * YEAR, Bn = A + YEAR, ms = mths.filter(m => m.t >= A && m.t < Bn); if (ms.length < 6) break;
      const avg = Math.round(ms.reduce((a, m) => a + m.score, 0) / ms.length), area = {};
      ARE.forEach(k => { area[k] = Math.round(ms.reduce((a, m) => a + R.areaScore(m, S, R.AREAS[k]), 0) / ms.length); });
      const per = vim.filter(a => a.end > A && a.start < Bn), sorted = ms.slice().sort((a, b) => b.score - a.score);
      yrs.push({ i, A, B: Bn, ms, avg, area, per, jL: mode(ms.map(m => m.jL)), sL: mode(ms.map(m => m.sL)), sade: ms.some(m => m.sade), best: sorted.slice(0, 2).map(m => m.t).sort(), low: sorted.slice(-2).map(m => m.t).sort() });
    }
    const evs = []; let pv = null; mths.filter(m => m.t >= now && m.t < now + 10 * YEAR).forEach(m => {
      if (pv) {
        if (m.vMD !== pv.vMD) evs.push({ t: m.t, big: true, txt: `<b>Mahadasha change:</b> ${pv.vMD} to ${m.vMD}. The focus moves to ${P.KARAKA[m.vMD]}.` });
        if (m.jSign !== pv.jSign) evs.push({ t: m.t, txt: `<b>Jupiter</b> enters ${SIGNS[m.jSign]}, your ${ord(m.jL)} house from the Lagna: ${T.HOUSE_JUP[m.jL]}.` });
        if (m.sSign !== pv.sSign) evs.push({ t: m.t, txt: `<b>Saturn</b> enters ${SIGNS[m.sSign]}, your ${ord(m.sL)} house from the Lagna: ${T.HOUSE_SAT[m.sL]}.` });
        if (m.sade !== pv.sade) evs.push({ t: m.t, big: true, txt: m.sade ? '<b>Sade Sati begins:</b> Saturn starts its passage around your Moon sign.' : '<b>Sade Sati ends:</b> Saturn leaves the zone around your Moon sign, which usually lightens the load.' });
        if (m.vAD !== pv.vAD && m.vMD === pv.vMD) evs.push({ t: m.t, txt: `Antardasha changes to <b>${m.vAD}</b> (${HT[S[m.vAD].house]}).` });
      } pv = m; });
    return { yrs, evs };
  }
  function yearGuidance(y) {
    const ks = Object.keys(y.area).sort((a, b) => y.area[b] - y.area[a]), top = ks[0], low = ks[ks.length - 1];
    const lead = y.avg >= 62 ? `A supportive year. Good time for initiatives, especially in ${AREA_LONG[top]}.` : y.avg >= 46 ? `A mixed year: steady progress where effort is regular, and some friction to manage. ${cap(AREA_LONG[top])} is the best-supported area.` : `A demanding year that rewards consolidation, patience and health care. Avoid large risks; ${AREA_LONG[top]} is relatively the best-supported area.`;
    return `${lead} The area needing most care is ${AREA_LONG[low]}.`;
  }
  function yearBody(y) {
    const dates = a => `${mon(Math.max(a.start, y.A))} to ${mon(Math.min(a.end, y.B))}`;
    return `<p><b>Overall:</b> ${pill(y.avg)} ${esc(yearGuidance(y))}</p>` + h4('Dasha periods this year') + ul(y.per.map(a => `<b>${a.md}–${a.lord}</b> (${dates(a)}): ${esc(a.focus)}; ${a.lord} sits in your ${ord(a.house)} house. ${pill(a.avg)}`)) +
      h4('Transits') + `<p>Jupiter is mostly in your ${ord(y.jL)} house from the Lagna: ${esc(T.HOUSE_JUP[y.jL])}. Saturn is mostly in your ${ord(y.sL)} house: ${esc(T.HOUSE_SAT[y.sL])}${y.sade ? ' <b>Sade Sati is active in this year.</b>' : ''}</p>` +
      h4('Life areas') + Object.keys(y.area).map(k => hb(AREA_NAME[k], y.area[k], P.outlook(y.area[k]))).join('') +
      h4('Months to note') + `<p><b>Best-supported:</b> ${y.best.map(mon).join(', ')}. <b>Needs most care:</b> ${y.low.map(mon).join(', ')}.</p>`;
  }
  function decadePoints(chart, pred) {
    const d = decade(chart, pred); if (!d.yrs.length) return [];
    const yrs = d.yrs, bestY = yrs.slice().sort((a, b) => b.avg - a.avg)[0], worstY = yrs.slice().sort((a, b) => a.avg - b.avg)[0], lab = y => `${mon(y.A)} to ${mon(y.B)}`;
    const peak = k => yrs.slice().sort((a, b) => b.area[k] - a.area[k])[0];
    const over = `<p>A year-by-year reading of the next ten years from today, built from your Vimshottari and Yogini dashas, the strength of each planet in your chart and the transits of Jupiter and Saturn. Each year runs from today's date. Scores are 5 to 95 and compare years within this chart.</p>` +
      table(['Year', 'Period', 'Dasha', 'Overall', 'Career', 'Money', 'Love', 'Health', 'Home'], yrs.map(y => [`<b>${y.i + 1}</b>`, lab(y), y.per.map(a => `${a.md}–${a.lord}`).join(', '), pill(y.avg), ...['career', 'finance', 'love', 'health', 'home'].map(k => `<span class="tag ${P.tone(y.area[k])}">${y.area[k]}</span>`)])) +
      h4('Year-by-year strength') + yrs.map(y => hb(`Year ${y.i + 1}`, y.avg, lab(y))).join('') + h4('Decade highlights') +
      ul([`<b>Best year overall:</b> year ${bestY.i + 1} (${lab(bestY)}), score ${bestY.avg}.`, `<b>Most demanding year:</b> year ${worstY.i + 1} (${lab(worstY)}), score ${worstY.avg}. Use it for consolidation, not risk.`, `<b>Peak for career:</b> year ${peak('career').i + 1}. <b>For money:</b> year ${peak('finance').i + 1}. <b>For relationships:</b> year ${peak('love').i + 1}. <b>For health:</b> year ${peak('health').i + 1}. <b>For home and property:</b> year ${peak('home').i + 1}.`]) +
      '<p class="hint">These are tendencies from rule-based Jyotish. A year scored low does not mean a bad year, and a high score does not remove the need for effort and judgement.</p>';
    const yearly = '<p>Open any year for its dasha periods, transits, life areas and the months to watch.</p>' + yrs.map(y => `<details class="rcard"><summary><span>Year ${y.i + 1} · ${lab(y)}</span>${pill(y.avg)}</summary><div class="rtext">${yearBody(y)}</div></details>`).join('');
    const ms = new Map(); pred.vimsh.forEach(m => { if (m.end > Date.now() && m.start < Date.now() + 10 * YEAR) ms.set(m.lord, m); });
    const road = [...ms.values()].map(m => `<details class="rcard"><summary><span>${m.lord} Mahadasha · ${mon(Math.max(m.start, Date.now()))} to ${mon(Math.min(m.end, Date.now() + 10 * YEAR))}${m.end > Date.now() + 10 * YEAR ? ' (continues)' : ''}</span>${pill(m.avg)}</summary><p class="rtext">${esc(m.text)}</p>${m.transit ? `<p class="rtext">${esc(m.transit)}</p>` : ''}${table(['Antardasha', 'From', 'To', 'Outlook', 'Focus'], m.antars.filter(a => a.end > Date.now() && a.start < Date.now() + 10 * YEAR).map(a => [`${m.lord}–${a.lord}`, mon(a.start), mon(a.end), pill(a.avg), esc(a.focus)]))}</details>`).join('');
    const events = '<p>The turning points in the next ten years, in date order. Dates are monthly approximations.</p>' + (d.evs.length ? '<div class="scroll"><table><thead><tr><th>When</th><th>What changes</th></tr></thead><tbody>' + d.evs.map(e => `<tr${e.big ? ' style="font-weight:600"' : ''}><td>${mon(e.t)}</td><td>${e.txt}</td></tr>`).join('') + '</tbody></table></div>' : '<p>No major changes found.</p>') + h4('Mahadasha roadmap') + road;
    return [{ id: 'dec', title: 'Next 10 years: overview', tag: `Best: year ${bestY.i + 1}`, html: over }, { id: 'decy', title: 'Next 10 years: year by year', tag: '10 years', html: yearly }, { id: 'dece', title: 'Next 10 years: turning points and dasha roadmap', tag: `${d.evs.length} events`, html: events }];
  }

  // =========================================================== KUNDLI (full)
  function kundli(chart, pred, birth) {
    const pts = R.kundli(chart, pred).points, items = scan(chart, pred), ys = items.filter(i => i.kind === 'yoga'), ds = items.filter(i => i.kind === 'dosha');
    const now = Date.now(), vm = pred.vimsh.find(m => m.start <= now && now < m.end), L = chart.lagna, moon = chart.planets.find(p => p.key === 'Moon'), sun = chart.planets.find(p => p.key === 'Sun');
    const dec = decadePoints(chart, pred);
    const nm = birth && birth.name ? birth.name : '';
    const cover = { id: 'cover', title: 'Your report at a glance', tag: '', html: `<p>${nm ? `Prepared for <b>${esc(nm)}</b>. ` : ''}This report reads your birth chart in the Parashari tradition using the Lahiri ayanamsa and whole-sign houses. It covers your personality, planets, houses, yogas and doshas, the dasha periods now running, and a year-by-year forecast for the next ten years.</p>` +
      table(['', ''], [['Lagna (ascendant)', `${L.signName}, ${L.nakshatra} pada ${L.pada}`], ['Moon sign (Rashi)', `${moon.signName}, ${moon.nakshatra} pada ${moon.pada}`], ['Sun sign', sun.signName], ['Current Mahadasha', vm ? `${vm.lord} (until ${mon(vm.end)})` : '-'], ['Yogas found', `${ys.length}`], ['Doshas and cautions', `${ds.length}`], ['Strongest planets', pred.strengths ? Object.values(pred.strengths).sort((a, b) => b.score - a.score).slice(0, 2).map(s => s.key).join(', ') : '']]) +
      `<p class="hint">Read the points in order, or jump to the ones you need. Everything is rule-based and tied to a placement printed in the text. It describes tendencies, not fixed outcomes.</p>` };
    const yp = { id: 'yogas', title: 'Yogas: planetary combinations', tag: `${ys.length} found`, html: (ys.length ? `<p>These classical combinations are present in your chart, strongest first. A yoga shows potential; how much it delivers depends on the planets involved and the dasha running.</p>` + ['strong', 'moderate', 'mild'].flatMap(l => ys.filter(y => y.level === l)).map(yogaCard).join('') : '<p>None of the classical combinations checked here are present. That is common and says nothing about quality of life.</p>') + `<p class="hint">Checked: Pancha Mahapurusha, Raja, Yogakaraka, Dhana, Viparita Raja, Neecha Bhanga, Gajakesari, Budhaditya, Chandra-Mangala, Guru-Mangala, Sunapha, Anapha, Durudhara, Adhi, Amala, Vasumati, Saraswati and Lakshmi.</p>` };
    const dp = { id: 'doshas', title: 'Doshas and cautions', tag: ds.length ? `${ds.length} found` : 'none', html: (ds.length ? `<p>These afflictions are present. A dosha is a traditional caution, not a prediction of harm; most have cancellations and ease with time and conscious effort. Traditional measures are mentioned only as customs, not as a cure.</p>` + ['strong', 'moderate', 'mild'].flatMap(l => ds.filter(y => y.level === l)).map(yogaCard).join('') : '<p>None of the doshas checked here are present.</p>') + `<p class="hint">Checked: Mangal, Kaal Sarp (with type), Grahan, Guru Chandal, Shrapit, Angarak, Vish, Pitra, Kemadruma, Shakata, Gandmool, Sade Sati, Shani Dhaiya and debilitated planets.</p>` };
    const out = [cover]; pts.forEach(p => { if (p.id === 'yogas') out.push(yp, dp); else if (p.id === 'summary') { out.push(...dec); out.push(p); } else out.push(p); });
    return { points: out };
  }

  // =========================================================== MARRIAGE (both charts)
  function info(chart, pred) {
    const g = k => chart.planets.find(p => p.key === k), S = pred.strengths || P.planetStrength(chart), AV = B.ashtakavarga(chart), h7 = chart.houses[6], lord = h7.lord, lp = g(lord);
    const occ = chart.planets.filter(p => p.house === 7), asp = RD.aspectsOn(chart, h7.sign), sav = AV.byHouse[6].sav, ven = g('Venus'), jup = g('Jupiter');
    const score = S[lord].score + (sav - 28) / 8 + occ.reduce((a, p) => a + 0.3 * S[p.key].score, 0), idx = Math.round(clamp(50 + (score + 0.5 * S.Venus.score) * 11, 8, 95));
    const navL = E.vargaSign(chart.lagna.lon, 9), n7 = (navL + 6) % 12, n7l = LORD[n7], dk = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map(g).sort((a, b) => a.deg - b.deg)[0];
    const delay = [], support = [];
    if (occ.some(p => ['Saturn', 'Mars', 'Rahu', 'Ketu'].includes(p.key))) delay.push(`${join(occ.filter(p => ['Saturn', 'Mars', 'Rahu', 'Ketu'].includes(p.key)).map(p => p.key))} in the 7th house`);
    if (asp.includes('Saturn')) delay.push('Saturn aspects the 7th house'); if (asp.includes('Mars')) delay.push('Mars aspects the 7th house');
    if (DUS.includes(lp.house)) delay.push(`7th lord ${lord} is in the ${ord(lp.house)} house`); if (lp.dignity === 'Debilitated') delay.push('7th lord is debilitated');
    if (ven.dignity === 'Debilitated' || DUS.includes(ven.house)) delay.push(`Venus is ${ven.dignity === 'Debilitated' ? 'debilitated' : 'in the ' + ord(ven.house) + ' house'}`);
    if (asp.includes('Jupiter') || occ.some(p => p.key === 'Jupiter')) support.push('Jupiter influences the 7th house'); if (occ.some(p => ['Venus', 'Mercury', 'Moon'].includes(p.key))) support.push(`${join(occ.filter(p => ['Venus', 'Mercury', 'Moon'].includes(p.key)).map(p => p.key))} in the 7th house`);
    if ([1, 4, 5, 7, 9, 10].includes(lp.house)) support.push(`7th lord ${lord} is in the ${ord(lp.house)} house`); if (ven.dignity === 'Exalted' || ven.dignity === 'Own sign') support.push('Venus is strong by sign');
    const man = R.manglikDetail(chart, { pl: g }), t = R.marriageTiming(chart, pred, S), by = chart.input.year, ny = new Date().getFullYear();
    const dignity = p => p.dignity ? p.dignity.toLowerCase() : 'neutral sign';
    return { chart, pred, S, g, h7, lord, lp, occ, asp, sav, idx, label: idx >= 65 ? 'Strong' : idx >= 50 ? 'Good' : idx >= 38 ? 'Mixed' : 'Needs care', ven, jup, navL, n7, n7l, n7lp: g(n7l), dk, delay, support, man, moon: g('Moon'), lagLord: chart.houses[0].lord,
      win: t.years.filter(y => by + y.age + 1 >= ny).map(y => by + y.age), t, dignity };
  }
  function bothTable(a, b, na, nb) {
    const r = [
      ['Lagna', `${a.chart.lagna.signName}`, `${b.chart.lagna.signName}`], ['Moon sign and star', `${a.moon.signName}, ${a.moon.nakshatra}`, `${b.moon.signName}, ${b.moon.nakshatra}`],
      ['7th house sign', `${a.h7.signName} (${esc(T.SPOUSE[a.h7.sign])})`, `${b.h7.signName} (${esc(T.SPOUSE[b.h7.sign])})`],
      ['7th lord', `${a.lord} in ${a.lp.signName}, ${ord(a.lp.house)} house, ${a.dignity(a.lp)}`, `${b.lord} in ${b.lp.signName}, ${ord(b.lp.house)} house, ${b.dignity(b.lp)}`],
      ['Planets in the 7th', a.occ.length ? join(a.occ.map(p => p.key)) : 'none', b.occ.length ? join(b.occ.map(p => p.key)) : 'none'], ['Aspects on the 7th', a.asp.length ? join(a.asp) : 'none', b.asp.length ? join(b.asp) : 'none'],
      ['7th house bindus (average 28)', a.sav, b.sav], ['Venus', `${a.ven.signName}, ${ord(a.ven.house)} house, ${a.dignity(a.ven)}; D9 ${SIGNS[a.ven.navSign]}`, `${b.ven.signName}, ${ord(b.ven.house)} house, ${b.dignity(b.ven)}; D9 ${SIGNS[b.ven.navSign]}`],
      ['Jupiter', `${a.jup.signName}, ${ord(a.jup.house)} house, ${a.dignity(a.jup)}`, `${b.jup.signName}, ${ord(b.jup.house)} house, ${b.dignity(b.jup)}`], ['Darakaraka (lowest-degree planet)', `${a.dk.key} in ${a.dk.signName}`, `${b.dk.key} in ${b.dk.signName}`],
      ['Navamsa Lagna and its 7th lord', `${SIGNS[a.navL]}; ${a.n7l} in D9 ${SIGNS[a.n7lp.navSign]}`, `${SIGNS[b.navL]}; ${b.n7l} in D9 ${SIGNS[b.n7lp.navSign]}`],
      ['Mangal dosha', a.man.present ? `Present (${a.man.sev})${a.man.canc.length ? ', mitigated' : ''}` : 'Absent', b.man.present ? `Present (${b.man.sev})${b.man.canc.length ? ', mitigated' : ''}` : 'Absent'],
      ['Running dasha now', `${a.pred.now.vMD}–${a.pred.now.vAD}`, `${b.pred.now.vMD}–${b.pred.now.vAD}`], ['Next marriage window (calendar year)', a.win[0] || 'none ahead', b.win[0] || 'none ahead'],
      ['<b>7th-house strength index</b>', `<b>${a.idx}</b> ${a.label}`, `<b>${b.idx}</b> ${b.label}`]];
    return table(['Factor', esc(na), esc(nb)], r);
  }
  function cross(a, b, na, nb, res) {
    const out = [], add = (t, v, txt) => out.push({ t, v, txt }), el = s => s % 4, EN = ['fire', 'earth', 'air', 'water'];
    [[a, b, na, nb], [b, a, nb, na]].forEach(([X, Y, nx, ny]) => {
      const s7 = X.h7.sign, hit = Y.chart.lagna.sign === s7 || Y.moon.sign === s7, soft = !hit && (el(Y.chart.lagna.sign) === el(s7) || el(Y.moon.sign) === el(s7));
      add(`${nx}'s 7th house and ${ny}'s chart`, hit ? 1 : soft ? 1 : 0, `${nx}'s 7th house is ${SIGNS[s7]}. ${ny}'s Lagna is ${Y.chart.lagna.signName} and Moon is in ${Y.moon.signName}. ${hit ? 'One of them is exactly the partner sign described by the 7th house: a strong match of type.' : soft ? `They share the ${EN[el(s7)]} element with that sign: a natural match of temperament.` : 'No direct match with the sign described, which is common and neutral.'}`);
    });
    const r1 = rel(a.lagLord, b.lagLord), r2 = rel(b.lagLord, a.lagLord);
    add('Lagna lords', (r1 === 'enemy' || r2 === 'enemy') ? -1 : (r1 === 'friend' && r2 === 'friend') || r1 === 'same' ? 1 : 0, `${na}'s Lagna lord ${a.lagLord} is a ${r1} to ${nb}'s Lagna lord ${b.lagLord}; the reverse is ${r2}. Lagna lords show how the two personalities meet each other.`);
    const d = ((b.moon.sign - a.moon.sign + 12) % 12) + 1; add('Moon signs', [6, 8].includes(d) ? -1 : [5, 9, 2, 12].includes(d) ? 0 : 1, `${nb}'s Moon is in the ${ord(d)} sign from ${na}'s Moon. ${[6, 8].includes(d) ? 'The 6/8 relationship is traditionally the most difficult for emotional harmony.' : [5, 9, 2, 12].includes(d) ? 'A neutral relationship that needs some adjustment.' : 'A comfortable relationship for emotional understanding.'}`);
    const att = (a.ven.sign === b.g('Mars').sign || ((a.ven.sign - b.g('Mars').sign + 12) % 12) === 6 || b.ven.sign === a.g('Mars').sign || ((b.ven.sign - a.g('Mars').sign + 12) % 12) === 6);
    add('Venus and Mars (attraction)', att ? 1 : 0, att ? 'One partner\'s Venus is in the same sign as, or opposite, the other\'s Mars: classical sign of strong physical and romantic attraction.' : 'No direct Venus-Mars link between the charts; attraction rests on other factors.');
    [[a, b, na, nb], [b, a, nb, na]].forEach(([X, Y, nx, ny]) => {
      const pts = [X.h7.sign, X.chart.lagna.sign, X.moon.sign], mal = ['Saturn', 'Rahu', 'Ketu'].filter(k => pts.includes(Y.g(k).sign)), ben = ['Jupiter', 'Venus'].filter(k => pts.includes(Y.g(k).sign));
      add(`${ny}'s planets on ${nx}'s key points`, mal.length > ben.length ? -1 : ben.length ? 1 : 0, `${ny}'s ${mal.length ? join(mal) + ' fall' + (mal.length === 1 ? 's' : '') + ' on' : 'malefics do not fall on'} the signs of ${nx}'s Lagna, Moon or 7th house${mal.length ? ' (a strain, traditionally read as pressure or delay)' : ''}. ${ben.length ? `${ny}'s ${join(ben)} ${ben.length === 1 ? 'falls' : 'fall'} on them, which is supportive.` : ''}`);
    });
    const rd = rel(a.pred.now.vMD, b.pred.now.vMD); add('Running dashas', rd === 'enemy' ? -1 : rd === 'neutral' ? 0 : 1, `${na} is in ${a.pred.now.vMD} dasha and ${nb} in ${b.pred.now.vMD}; these planets are ${rd === 'same' ? 'the same' : 'natural ' + (rd === 'friend' ? 'friends' : rd === 'enemy' ? 'enemies' : 'neutral')}. Friendly dashas make it easier to move in step.`);
    const n1 = rel(LORD[a.navL], LORD[b.navL]), n2 = rel(LORD[b.navL], LORD[a.navL]); add('Navamsa Lagna lords', (n1 === 'enemy' || n2 === 'enemy') ? -1 : (n1 === 'friend' && n2 === 'friend') || n1 === 'same' ? 1 : 0, `The Navamsa shows the deeper, later-life bond. ${na}'s D9 Lagna lord is ${LORD[a.navL]} and ${nb}'s is ${LORD[b.navL]}: ${n1 === 'same' ? 'the same planet' : n1 + ' / ' + n2}.`);
    if (res) add('Mangal dosha balance', res.manglik.result.kind === 'ok' ? 1 : -1, res.manglik.result.text);
    return out;
  }
  const rel = (x, y) => (K.rel && ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].includes(x) && ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'].includes(y)) ? K.rel(x, y) : 'neutral';
  const verdictLabel = c => c >= 75 ? 'Very supportive' : c >= 60 ? 'Supportive' : c >= 45 ? 'Mixed, workable with care' : 'Needs careful consideration';

  function marriage(chart, pred, res, names, pc, ppred, role) {
    const base = R.marriage(chart, pred, res, names), pts = base.points; if (!res || !pc) { const need = 'Enter your partner\'s details in the form above and press <b>Match charts</b>.'; return { points: [{ id: 'verdict', title: 'Overall compatibility verdict', tag: 'needs partner', html: `<p>${need}</p>` }, { id: 'both7', title: 'Both 7th houses compared', tag: 'needs partner', html: `<p>${need}</p>` }, { id: 'cross', title: 'Cross-chart compatibility', tag: 'needs partner', html: `<p>${need}</p>` }, ...pts] }; }
    const nm = names || {}, nB = nm.bride || 'Bride', nG = nm.groom || 'Groom', bC = role === 'groom' ? chart : pc, gC = role === 'groom' ? pc : chart, bP = role === 'groom' ? pred : ppred, gP = role === 'groom' ? ppred : pred;
    const iB = info(bC, bP), iG = info(gC, gP), cr = cross(iB, iG, nB, nG, res), cs = cr.reduce((a, x) => a + x.v, 0), crossPct = Math.round((cs + cr.length) / (2 * cr.length) * 100), gunaPct = Math.round(res.total / 36 * 100), sevPct = Math.round((iB.idx + iG.idx) / 2);
    const comp = Math.round(0.5 * gunaPct + 0.25 * sevPct + 0.25 * crossPct), tone = comp >= 60 ? 'good' : comp >= 45 ? 'mid' : 'bad';
    const good = cr.filter(x => x.v > 0).map(x => x.t), care = cr.filter(x => x.v < 0).map(x => x.t);
    const common = iB.win.filter(y => iG.win.includes(y)), by = Math.min(...[iB.win[0], iG.win[0]].filter(Boolean));
    const verdict = { id: 'verdict', title: 'Overall compatibility verdict', tag: `${comp}/100`, html: `<p style="font-size:18px"><b>${esc(nB)} and ${esc(nG)}</b>: <span class="tag ${tone}">${verdictLabel(comp)} · ${comp} / 100</span></p>` + hb('Guna Milan (36 points)', gunaPct, `${res.total} of 36, ${res.verdict}. Weight 50%.`) + hb(`7th-house strength of both charts`, sevPct, `${esc(nB)} ${iB.idx}, ${esc(nG)} ${iG.idx}. Weight 25%.`) + hb('Cross-chart harmony', crossPct, `${cr.filter(x => x.v > 0).length} supportive, ${care.length} strained, out of ${cr.length} checks. Weight 25%.`) +
      `<p>The traditional 36-point score looks only at the two Moons. This verdict also weighs the strength of <b>both</b> 7th houses (lord, occupants, aspects, bindus, Venus) and how the two charts act on each other, so a match is not judged from one chart alone.</p>` + h4('Where the match is strong') + (good.length ? ul(good.map(esc)) : '<p>No clearly supportive cross-chart factor stands out.</p>') + h4('Where it needs care') + (care.length || res.notes.some(n => n.kind === 'warn') ? ul([...care.map(esc), ...res.notes.filter(n => n.kind === 'warn').map(n => esc(n.text))]) : '<p>No major strain found.</p>') +
      h4('Marriage timing for both') + `<p>${common.length ? `Years that favour <b>both</b> charts: <b>${common.slice(0, 6).join(', ')}</b>.` : `No calendar year favours both charts at once in the age range checked. ${esc(nB)}'s next window starts around ${iB.win[0] || 'none ahead'}; ${esc(nG)}'s around ${iG.win[0] || 'none ahead'}.`}</p><p class="hint">Weights are a transparent convention of this app, not a classical rule. Use the verdict as a structured starting point for conversation, not a decision.</p>` };
    const side = { id: 'both7', title: 'Both 7th houses compared', tag: `${iB.idx} / ${iG.idx}`, html: `<p>The bride's and the groom's charts are read separately for marriage, then set side by side.</p>` + bothTable(iB, iG, nB, nG) + h4(esc(nB) + ': marriage factors') + ul([...iB.support.map(s => `<span class="tag good">Support</span> ${esc(s)}`), ...iB.delay.map(s => `<span class="tag bad">Care</span> ${esc(s)}`)]) + h4(esc(nG) + ': marriage factors') + ul([...iG.support.map(s => `<span class="tag good">Support</span> ${esc(s)}`), ...iG.delay.map(s => `<span class="tag bad">Care</span> ${esc(s)}`)]) };
    const cx = { id: 'cross', title: 'Cross-chart compatibility', tag: `${crossPct}%`, html: '<p>How each chart acts on the other. Each line is a separate check; supportive, neutral or strained.</p>' + cr.map(x => `<p><b>${esc(x.t)}</b> <span class="tag ${x.v > 0 ? 'good' : x.v < 0 ? 'bad' : 'mid'}">${x.v > 0 ? 'Supportive' : x.v < 0 ? 'Strained' : 'Neutral'}</span><br>${esc(x.txt)}</p>`).join('') };
    const pick = (src, id, pre, title) => { const p = src.find(x => x.id === id); return p ? Object.assign({}, p, { id: pre + id, title: `${title}: ${p.title}` }) : null; };
    const bPts = R.marriage(bC, bP, null, nm).points, gPts = R.marriage(gC, gP, null, nm).points;
    const keep = (arr, pre, t) => ['seventh', 'venus', 'manglik'].map(i => pick(arr, i, pre, t)).filter(Boolean);
    const get = id => pts.find(p => p.id === id), jt = { id: 'timing', title: 'Timing windows for marriage', tag: common.length ? String(common[0]) : '', html: `<p>Windows from the dasha and Jupiter transit rule, for each chart separately.</p>` + h4(esc(nB)) + (iB.t.years.length ? table(['Year', 'Age', 'Months that fit', 'Dasha'], iB.t.years.map(y => [`${bC.input.year + y.age}`, y.age, y.n, `${y.rec.vMD}–${y.rec.vAD}`])) : '<p>None in the age range checked.</p>') + h4(esc(nG)) + (iG.t.years.length ? table(['Year', 'Age', 'Months that fit', 'Dasha'], iG.t.years.map(y => [`${gC.input.year + y.age}`, y.age, y.n, `${y.rec.vMD}–${y.rec.vAD}`])) : '<p>None in the age range checked.</p>') + '<p class="hint">Windows are overlaps of supportive conditions, not predicted dates.</p>' };
    const adv = { id: 'advice', title: 'Guidance for the couple', tag: '', html: h4('Reading the result') + ul([`Compatibility score: ${comp} out of 100 (${verdictLabel(comp)}).`, res.total < 18 ? 'The Guna Milan is below the traditional minimum of 18. Many families treat this as a caution; check the cancellations and the strength of both 7th houses.' : 'The Guna Milan meets the traditional minimum.', iB.man.present !== iG.man.present ? 'Only one chart carries Mangal dosha: discuss temperament, space and responsibilities openly.' : 'The Mangal dosha position is balanced between the two charts.', care.length ? `Give extra attention to: ${care.join('; ')}.` : 'No cross-chart strain stands out.']) + h4('For a real decision') + ul(['Compatibility in values, health, finances and family expectations matters as much as the charts.', 'A low score with strong 7th houses and friendly dashas is not a verdict against a match; a high score does not remove the need for honest conversation.', 'Where a dosha is flagged, texts list cancellations; this app mentions only the commonly accepted ones.']) + '<p class="hint">Please treat everything here as a starting point for reflection and conversation, not a decision.</p>' };
    return { points: [verdict, get('guna'), get('koota'), get('cancel'), side, cx, ...keep(bPts, 'b_', nB), ...keep(gPts, 'g_', nG), get('mcomp'), jt, adv].filter(Boolean) };
  }
  return { scan, kundli, marriage, decade, info, cross };
});
