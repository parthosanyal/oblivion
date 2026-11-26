/* Prashna (horary) report: a chart cast for the moment a question is asked, with a reasoned yes/no reading,
 * timing estimate and a cross-check with the birth chart. HTML strings only, no DOM.
 * build(qchart, natal, categoryKey, questionText) -> { points, meta }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('./predict.js'));
  else root.Prashna = factory(root.VedicEngine, root.Predict);
})(typeof self !== 'undefined' ? self : this, function (E, P) {
  const SIGNS = E.SIGNS, LORD = E.SIGN_LORDS, ord = P.ord, HT = P.HOUSE_THEME;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ul = a => '<ul>' + a.filter(Boolean).map(i => `<li>${i}</li>`).join('') + '</ul>';
  const table = (head, rows) => `<div class="scroll"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const MODE = ['movable', 'fixed', 'dual'], BEN = ['Jupiter', 'Venus', 'Mercury'], MAL = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
  const KEND = [1, 4, 7, 10], TRIK = [1, 5, 9], DUS = [6, 8, 12];

  // category -> houses (first is the main house), natural significator, plain words
  const CATS = {
    marriage: { name: 'Marriage and relationships', h: [7], k: 'Venus', words: 'marriage, a partner or a relationship' },
    career: { name: 'Job and career', h: [10], k: 'Saturn', words: 'a job, promotion or career move' },
    money: { name: 'Money and gains', h: [11, 2], k: 'Jupiter', words: 'income, gains or money coming in' },
    health: { name: 'Health and recovery', h: [6, 1], k: 'Sun', words: 'recovery or an improvement in health' },
    children: { name: 'Children', h: [5], k: 'Jupiter', words: 'children or the wellbeing of a child' },
    property: { name: 'Home, property and vehicle', h: [4], k: 'Mars', words: 'a home, property or vehicle' },
    travel: { name: 'Travel and living abroad', h: [12, 9], k: 'Rahu', words: 'travel or moving abroad' },
    education: { name: 'Education and exams', h: [5, 9], k: 'Mercury', words: 'success in study or an exam' },
    lost: { name: 'Lost item or missing person', h: [2, 4], k: 'Moon', words: 'finding what was lost' },
    legal: { name: 'Court case or dispute', h: [6, 7], k: 'Mars', words: 'a favourable result in a dispute' },
    general: { name: 'Any yes or no question', h: [11, 1], k: 'Jupiter', words: 'the outcome you hope for' }
  };
  const CAT_LIST = Object.keys(CATS).map(k => ({ id: k, name: CATS[k].name }));

  // Parashari aspects (houses counted from the planet, the planet's own sign being 1)
  const ASP = { Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10], Rahu: [5, 7, 9], Ketu: [5, 7, 9] };
  const aspects = (p, sign) => ((ASP[p.key] || [7]).some(n => (p.sign + n - 1) % 12 === sign));

  function build(q, natal, catKey, text) {
    const cat = CATS[catKey] || CATS.general, g = k => q.planets.find(p => p.key === k), moon = g('Moon'), sun = g('Sun');
    const lagna = q.lagna, houseN = sign => ((sign - lagna.sign + 12) % 12) + 1, H = n => q.houses[n - 1];
    const mainH = cat.h[0], matterLord = g(H(mainH).lord), lagnaLord = g(lagna.signLord), karaka = g(cat.k);
    const waxing = ((moon.lon - sun.lon + 360) % 360) < 180;
    const f = []; // factors: [points, reason]
    const add = (pts, why) => f.push([pts, why]);
    const dignityWord = p => p.dignity ? p.dignity.toLowerCase() : null;
    const where = p => `${p.key} in ${p.signName} (${ord(p.house)} house)`;

    // --- 1. is the question readable?
    const cautions = [];
    if (lagna.deg < 1 || lagna.deg > 29) cautions.push(`The Lagna is at ${lagna.deg.toFixed(1)}° of ${lagna.signName}, right at a sign boundary. Classical texts treat a Lagna in the first or last degree as an unreliable moment to read; consider asking again at another time.`);
    if (moon.deg > 28) cautions.push(`The Moon is at ${moon.deg.toFixed(1)}° of ${moon.signName} and is about to change sign. The situation may shift soon after you ask.`);

    // --- 2. querent: Lagna lord and Moon
    const modeL = MODE[lagna.sign % 3];
    const ll = lagnaLord, llH = ll.house;
    if (ll.dignity === 'Exalted' || ll.dignity === 'Own sign') add(1, `Lagna lord ${ll.key} (you) is ${dignityWord(ll)}: you are in a position of strength in this matter.`);
    if (ll.dignity === 'Debilitated') add(-1, `Lagna lord ${ll.key} (you) is debilitated: you have less control over this matter.`);
    if ([...KEND, ...TRIK].includes(llH) && llH !== 1) add(0.5, `Lagna lord ${ll.key} is in the ${ord(llH)} house, a supportive position.`);
    if (DUS.includes(llH)) add(-1, `Lagna lord ${ll.key} is in the ${ord(llH)} house, a difficult house: effort may be wasted or opposed.`);
    if (ll.retro && !['Rahu', 'Ketu'].includes(ll.key)) add(-0.5, `Lagna lord ${ll.key} is retrograde: a delay or a change of mind is likely.`);

    if (waxing) add(0.5, 'The Moon is waxing, which favours new beginnings and growth.'); else add(-0.25, 'The Moon is waning, which favours endings and slower progress.');
    if ([3, 6, 10, 11].includes(houseN(moon.sign))) add(0.5, `The Moon is in the ${ord(houseN(moon.sign))} house from the Lagna, a house that supports effort and gain.`);
    if (DUS.includes(houseN(moon.sign))) add(-1, `The Moon is in the ${ord(houseN(moon.sign))} house from the Lagna, a difficult house: the mind is troubled about the matter.`);
    const moonMal = q.planets.filter(p => MAL.includes(p.key) && p.key !== 'Sun' && (p.sign === moon.sign || aspects(p, moon.sign)));
    const moonBen = q.planets.filter(p => ['Jupiter', 'Venus'].includes(p.key) && (p.sign === moon.sign || aspects(p, moon.sign)));
    if (moonMal.length) add(-0.5 * moonMal.length, `The Moon is joined or aspected by ${moonMal.map(p => p.key).join(' and ')}, which adds pressure or confusion.`);
    if (moonBen.length) add(0.5 * moonBen.length, `The Moon is joined or aspected by ${moonBen.map(p => p.key).join(' and ')}, which brings support.`);

    // --- 3. the matter: house, its lord and the planets there
    const ml = matterLord, mlH = ml.house;
    if (ml.dignity === 'Exalted' || ml.dignity === 'Own sign') add(1, `The ${ord(mainH)} house lord ${ml.key} (the matter) is ${dignityWord(ml)}: the matter is strongly placed.`);
    if (ml.dignity === 'Debilitated') add(-1, `The ${ord(mainH)} house lord ${ml.key} (the matter) is debilitated: the matter is weak.`);
    if ([...KEND, ...TRIK, 11].includes(mlH)) add(1, `The ${ord(mainH)} lord ${ml.key} is in the ${ord(mlH)} house, a favourable place for results.`);
    if (DUS.includes(mlH) && mlH !== mainH) add(-1, `The ${ord(mainH)} lord ${ml.key} is in the ${ord(mlH)} house, a difficult house: the matter meets obstacles or loss.`);
    if (ml.retro && !['Rahu', 'Ketu'].includes(ml.key)) add(-0.5, `The ${ord(mainH)} lord ${ml.key} is retrograde: the matter may be delayed or come back for review.`);
    const inH = q.planets.filter(p => p.house === mainH), seenBy = q.planets.filter(p => p.house !== mainH && aspects(p, H(mainH).sign));
    inH.forEach(p => { if (BEN.includes(p.key)) add(1, `${p.key}, a benefic, sits in the ${ord(mainH)} house and supports the matter.`); else if (MAL.includes(p.key)) { if (p.key !== 'Sun' && [3, 6, 10, 11].includes(mainH)) add(0.25, `${p.key} in the ${ord(mainH)} house gives drive here, a place where malefics do well.`); else add(-1, `${p.key}, a malefic, sits in the ${ord(mainH)} house and harms the matter.`); } });
    seenBy.forEach(p => { if (['Jupiter', 'Venus'].includes(p.key)) add(0.5, `${p.key} aspects the ${ord(mainH)} house and blesses it.`); else if (['Saturn', 'Mars', 'Rahu', 'Ketu'].includes(p.key)) add(-0.5, `${p.key} aspects the ${ord(mainH)} house and adds delay or friction.`); });
    if (BEN.includes(karaka.key) && karaka.dignity !== 'Debilitated' && !DUS.includes(karaka.house)) add(0.25, `${karaka.key}, the natural significator of this matter, is in good condition (${ord(karaka.house)} house).`);
    if (DUS.includes(karaka.house) || karaka.dignity === 'Debilitated') add(-0.25, `${karaka.key}, the natural significator of this matter, is weak (${ord(karaka.house)} house${karaka.dignity === 'Debilitated' ? ', debilitated' : ''}).`);

    // --- 4. link between you (Lagna lord) and the matter (house lord)
    let link = 'none', linkText;
    const llp = ll, mlp = ml;
    if (llp.key === mlp.key) { link = 'same'; add(1.5, `${ll.key} is both your Lagna lord and the ${ord(mainH)} lord: you and the matter are one.`); linkText = `${ll.key} rules both the Lagna and the ${ord(mainH)} house.`; }
    else if (llp.sign === mlp.sign) { link = 'conj'; add(2, `${ll.key} (you) and ${ml.key} (the matter) are together in ${llp.signName}: a direct union, the strongest sign of success.`); linkText = `They are together in ${llp.signName}.`; }
    else if (llp.house === mainH && mlp.house === 1 || (llp.sign === H(mainH).sign && mlp.sign === lagna.sign)) { link = 'exch'; add(2.5, `${ll.key} and ${ml.key} exchange signs: a powerful link between you and the matter.`); linkText = 'They exchange signs.'; }
    else if (aspects(llp, mlp.sign) && aspects(mlp, llp.sign)) { link = 'mutual'; add(2, `${ll.key} and ${ml.key} aspect each other: a strong connection that favours success.`); linkText = 'They aspect each other.'; }
    else if (aspects(llp, mlp.sign) || aspects(mlp, llp.sign)) { link = 'one'; add(1, `${aspects(llp, mlp.sign) ? ll.key : ml.key} aspects the other (${ll.key} and ${ml.key}): a link exists, though one-sided.`); linkText = 'One of them aspects the other.'; }
    else linkText = `They are not joined, and neither aspects the other.`;
    const moonLink = [llp, mlp].filter(p => p.sign === moon.sign || aspects(moon, p.sign));
    if (moonLink.length) add(1, `The Moon links to ${moonLink.map(p => p.key).join(' and ')}: your mind is tied to the outcome and carries it forward.`);
    else add(-0.25, 'The Moon is not linked to your Lagna lord or to the lord of the matter.');

    // --- 5. verdict
    const score = f.reduce((s, x) => s + x[0], 0), pct = Math.round(clamp(50 + score * 7, 5, 95));
    const verdict = score >= 5 ? ['Likely yes', 'good'] : score >= 2.5 ? ['Leans yes', 'good'] : score >= -0.5 ? ['Mixed: possible, with delay', 'mid'] : score >= -3 ? ['Leans no', 'bad'] : ['Unlikely as asked', 'bad'];

    // --- 6. timing
    const dist = ((mlp.sign - llp.sign + 12) % 12), n = Math.min(dist, 12 - dist) + 1, mode = MODE[mlp.sign % 3];
    const unit = mode === 'movable' ? 'day' : mode === 'dual' ? 'week' : 'month';
    let t1 = n, t2 = n + (ll.retro || ml.retro ? Math.max(1, Math.round(n / 2)) : 0);
    const timeTxt = link === 'conj' || link === 'same' ? `soon, within about ${n === 1 ? 'a ' + unit : '1 to 2 ' + unit + 's'}` : `about ${t1}${t2 > t1 ? ' to ' + t2 : ''} ${unit}${t2 > 1 ? 's' : ''}`;
    const moonSteps = ((mlp.sign - moon.sign + 12) % 12);

    // --- 7. natal cross-check
    let natalHtml = '';
    if (natal) {
      const now = q.utcMs, md = natal.dasha.maha.find(m => m.start <= now && now < m.end) || natal.dasha.maha[0], ad = md.antars.find(a => a.start <= now && now < a.end) || md.antars[0];
      const nh = natal.houses[mainH - 1], nGet = k => natal.planets.find(p => p.key === k);
      const rel = k => { const p = nGet(k), owns = natal.houses.filter(h => h.lord === k).map(h => h.house); const bits = []; if (owns.includes(mainH)) bits.push(`rules the ${ord(mainH)} house`); if (p.house === mainH) bits.push(`sits in the ${ord(mainH)} house`); if (k === cat.k) bits.push('is the natural significator of this matter'); return { p, owns, bits }; };
      const rm = rel(md.lord), ra = rel(ad.lord), fav = [rm, ra].filter(x => x.bits.length).length;
      const lineFor = (lab, k, r) => `${lab} <b>${k}</b> is in your ${ord(r.p.house)} house (${r.p.signName})${r.owns.length ? ' and rules the ' + r.owns.map(ord).join(' and ') : ''}${r.bits.length ? '; it ' + r.bits.join(' and ') + '.' : '; it has no direct link to this matter.'}`;
      natalHtml = `<p>Your birth chart gives the background to the question. Counted from your own Lagna, the ${ord(mainH)} house (${esc(HT[mainH])}) is in ${nh.signName} and its lord is ${nh.lord}, placed in the ${ord(nGet(nh.lord).house)} house.</p>` + ul([lineFor('Running Mahadasha lord', md.lord, rm), lineFor('Running Antardasha lord', ad.lord, ra)]) +
        `<p>${fav === 2 ? 'Both running periods connect to this matter, which supports the horary reading: the timing in your own life agrees with the question.' : fav === 1 ? 'One running period connects to this matter, so your own timing partly supports the horary reading.' : 'Neither running period connects directly to this matter. The horary reading stands, but your own timing is not especially focused on it right now.'}</p>`;
    }

    // --- build points
    const planetTable = table(['Planet', 'Sign', 'Degree', 'House', 'Nakshatra', 'Status'], [['<b>Lagna</b>', lagna.signName, E.SIGNS ? lagna.deg.toFixed(1) + '°' : '', '1', lagna.nakshatra, ''], ...q.planets.map(p => [`<b>${p.key}</b>`, p.signName, p.deg.toFixed(1) + '°', ord(p.house), p.nakshatra, [p.retro && !['Rahu', 'Ketu'].includes(p.key) ? 'Retrograde' : '', p.dignity || ''].filter(Boolean).join(', ')])]);
    const meter = `<div class="hb"><span class="nm">Favourable</span><div class="tr"><i class="fill ${verdict[1] === 'good' ? 'fgood' : verdict[1] === 'mid' ? 'fmid' : 'fbad'}" style="left:0;width:${pct}%"></i></div><span class="val">${pct}%</span></div>`;
    const wd = q.panchang.vara;
    const when = new Date(q.utcMs);
    const points = [
      { id: 'pq', title: 'Your question and the chart', tag: cat.name, html: `<p>${text ? `<b>Question:</b> “${esc(text)}”<br>` : ''}<b>Topic:</b> ${esc(cat.name)}, which is read from the ${cat.h.map(ord).join(' and ')} house${cat.h.length > 1 ? 's' : ''} (${cat.h.map(h => esc(HT[h])).join('; ')}).</p><p>The chart was cast for the moment of the question: <b>${esc(q.input.day)}/${esc(q.input.month)}/${esc(q.input.year)}, ${String(q.input.hour).padStart(2, '0')}:${String(q.input.minute).padStart(2, '0')}</b> (${esc(q.input.tz)}). It is a ${esc(wd)}, Moon in ${esc(q.panchang.nakshatra)}, ${esc(q.panchang.tithi)} (${esc(q.panchang.paksha)}). Lagna: <b>${lagna.signName} ${lagna.deg.toFixed(1)}°</b>.</p><p class="hint">In prashna the chart for the moment of the question answers it, so the exact time and place matter. Ask one clear question at a sincere moment.</p>${cautions.length ? '<div class="note warn"><b>Before you rely on this:</b>' + ul(cautions) + '</div>' : ''}` },
      { id: 'pv', title: 'The answer in short', tag: verdict[0], html: `<p class="big"><b>${verdict[0]}.</b> The chart favours ${esc(cat.words)} to the degree shown below.</p>${meter}<p>${esc(verdictLine(verdict[0]))}</p><p class="hint">This is a rule-based reading from the placements listed in the next points. It shows the tendency of the matter, not a certainty. Where the answer is a no or a delay, it often shows what to improve or when to try again.</p>` },
      { id: 'ps', title: 'Who stands for what', tag: `${ll.key} and ${ml.key}`, html: ul([
        `<b>You, the asker:</b> the Lagna is ${lagna.signName} (a ${MODE[lagna.sign % 3]} sign), so your Lagna lord is <b>${ll.key}</b>, in ${ll.signName} in the ${ord(llH)} house${ll.dignity ? ', ' + dignityWord(ll) : ''}${ll.retro && !['Rahu', 'Ketu'].includes(ll.key) ? ', retrograde' : ''}.`,
        `<b>Your mind:</b> the Moon is in ${moon.signName} in the ${ord(houseN(moon.sign))} house${waxing ? ', waxing' : ', waning'}.`,
        `<b>The matter:</b> the ${ord(mainH)} house is ${H(mainH).signName}, with lord <b>${ml.key}</b> in ${ml.signName} in the ${ord(mlH)} house${ml.dignity ? ', ' + dignityWord(ml) : ''}${ml.retro && !['Rahu', 'Ketu'].includes(ml.key) ? ', retrograde' : ''}.`,
        `<b>Natural significator:</b> ${karaka.key} in ${karaka.signName} (${ord(karaka.house)} house).`,
        `<b>Link between you and the matter:</b> ${esc(linkText)}`
      ]) },
      { id: 'pf', title: 'Why the chart says this', tag: `${f.filter(x => x[0] > 0).length} for, ${f.filter(x => x[0] < 0).length} against`, html: `<p>Each placement below adds or removes points. Together they give the score of ${score.toFixed(1)}.</p>` + table(['Point', 'Effect', 'Reason'], f.map(x => [(x[0] > 0 ? '+' : '') + x[0], `<span class="tag ${x[0] > 0 ? 'good' : 'bad'}">${x[0] > 0 ? 'Supports' : 'Against'}</span>`, x[1]])) },
      { id: 'pt', title: 'When it may happen', tag: timeTxt, html: `<p>If the answer is favourable, the result is expected <b>${timeTxt}</b>.</p>` + ul([`${ll.key} and ${ml.key} are ${n} sign${n > 1 ? 's' : ''} apart (counting both), and ${ml.key} is in a ${mode} sign, which counts in ${unit}s.`, ll.retro || ml.retro ? 'A retrograde significator stretches the time, so the range is widened.' : '', `The Moon needs ${moonSteps === 0 ? 'no sign change' : moonSteps + ' sign' + (moonSteps > 1 ? 's' : '')} to reach ${ml.key}'s sign, so the matter tends to move with the Moon's passage over the next ${moonSteps === 0 ? 'day or two' : Math.max(1, Math.round(moonSteps * 2.3)) + ' days'}.`]) + `<p class="hint">This is a traditional rule of thumb: movable signs count in days, dual signs in weeks and fixed signs in months. Treat it as a range to plan around.</p>` },
      { id: 'ph', title: `The ${ord(mainH)} house: the matter itself`, tag: H(mainH).signName, html: ul([`The ${ord(mainH)} house is ${H(mainH).signName}, ruled by ${ml.key}.`, inH.length ? `Planets in it: ${inH.map(p => `${p.key}${p.retro && !['Rahu', 'Ketu'].includes(p.key) ? ' (retrograde)' : ''}`).join(', ')}.` : 'No planet sits in it, so the lord decides the result.', seenBy.length ? `Aspected by: ${seenBy.map(p => p.key).join(', ')}.` : 'No planet aspects it.', cat.h.length > 1 ? `The ${cat.h.slice(1).map(ord).join(' and ')} house also matters here: ${cat.h.slice(1).map(h => `${H(h).signName}, lord ${H(h).lord} in the ${ord(g(H(h).lord).house)} house`).join('; ')}.` : ''].filter(Boolean)) },
      { id: 'pn', title: 'Cross-check with your birth chart', tag: natal ? 'Your Dasha' : 'Not available', html: natalHtml || '<p class="hint">Generate your Kundli first to see how your running Dasha relates to this question.</p>' },
      { id: 'pp', title: 'Planets at the time of the question', tag: 'Chart data', html: planetTable + `<p class="hint">Sidereal positions (Lahiri ayanamsa), whole-sign houses counted from the Lagna.</p>` }
    ];
    return { points, meta: { score, pct, verdict: verdict[0], cat: cat.name, when: when.toISOString(), lagnaSign: lagna.sign, planets: q.planets.map(p => ({ key: p.key, sign: p.sign, retro: p.retro })) } };
  }

  function verdictLine(v) {
    return { 'Likely yes': 'Both you and the matter are well placed and they are linked. This is a favourable moment for the question.', 'Leans yes': 'More points support the matter than oppose it. Success is likely with some effort or patience.', 'Mixed: possible, with delay': 'Support and opposition are close to even. The matter is possible but may be delayed or need extra effort. Look at the points against and see what can be improved.', 'Leans no': 'More points oppose the matter than support it. A change of plan, more preparation or a later attempt is likely to work better.', 'Unlikely as asked': 'The chart shows strong obstacles or no link between you and the matter. As worded, success looks unlikely at this time.' }[v];
  }

  return { build, CATS, CAT_LIST };
});
