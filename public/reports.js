/* Report builders: Kundli analysis, Marriage, Career & finance, Yearly horoscope.
 * Each returns { points: [{ id, title, tag?, html }], ... }. HTML strings only, no DOM, so Node can test them.
 * Everything is rule-based from the chart; every claim is traceable to a placement printed in the text.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('./predict.js'), require('./bala.js'), require('./koota.js'));
  else root.Reports = factory(root.VedicEngine, root.Predict, root.Bala, root.Koota);
})(typeof self !== 'undefined' ? self : this, function (E, P, B, K) {
  const ord = P.ord, HT = P.HOUSE_THEME, SIGNS = E.SIGNS, LORD = E.SIGN_LORDS, MONTH = 30.4375 * 86400000;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const BEN = ['Jupiter', 'Venus', 'Mercury', 'Moon'];

  const LAGNA_TXT = ['Direct, energetic and quick to act; a natural starter who prefers to lead.', 'Steady, patient and practical; values comfort, loyalty and tangible results.', 'Curious, talkative and versatile; learns fast and likes variety.', 'Caring, protective and sensitive; feelings and family sit at the centre.', 'Confident, warm and proud; likes to lead and to be recognised.', 'Careful, analytical and service-minded; notices detail and wants to improve things.', 'Diplomatic, fair-minded and sociable; looks for balance and partnership.', 'Intense, private and determined; deep feelings and strong will.', 'Optimistic, philosophical and freedom-loving; drawn to learning and travel.', 'Disciplined, ambitious and responsible; builds slowly and lasts.', 'Independent, original and humanitarian; thinks differently from the crowd.', 'Compassionate, imaginative and intuitive; absorbs the mood around them.'];
  const MOON_TXT = ['emotions are quick and direct; you recover fast but can be impatient', 'emotions are steady and sensual; you need security and dislike sudden change', 'the mind is restless and curious; talking and learning settle you', 'feelings run deep and protective; home and family are your anchor', 'the heart is generous and proud; you need appreciation and warmth', 'the mind is analytical and self-critical; usefulness calms you', 'the mind seeks harmony; you dislike conflict and weigh both sides', 'feelings are intense and guarded; you remember everything', 'the mind is hopeful and restless; meaning and freedom matter', 'feelings are reserved and dutiful; you carry responsibility early', 'the mind is detached and inventive; friendships and ideas matter', 'feelings are soft and imaginative; you are easily moved and need quiet time'];
  const FIELDS = { Sun: 'government and public service, administration, leadership roles, medicine, politics, authority-based work', Moon: 'hospitality, nursing and care, food, public-facing work, psychology, shipping, anything involving people\'s daily needs', Mars: 'engineering, defence and police, surgery, sports, real estate, construction, machinery and technical trades', Mercury: 'writing, teaching, accounts, trading, IT and software, media, analysis, commerce', Jupiter: 'teaching, law, advisory, finance and banking, counselling, publishing, religion and education', Venus: 'arts, design, fashion, entertainment, beauty, luxury goods, hospitality, diplomacy', Saturn: 'manufacturing, mining, agriculture, labour management, infrastructure, research, long-term institutional work', Rahu: 'technology, foreign trade, aviation, research, unconventional or fast-growing industries', Ketu: 'research, spirituality, healing, coding, investigation, work that rewards detachment' };

  const hb = (label, v, sub, max) => { max = max || 100; const t = v >= 62 ? 'fgood' : v >= 46 ? 'fmid' : 'fbad'; return `<div class="hb"><span class="nm">${esc(label)}</span><div class="tr"><i class="fill ${t}" style="left:0;width:${clamp(v / max * 100, 0, 100)}%"></i></div><span class="val">${Math.round(v)}</span>${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</div>`; };
  const pill = sc => `<span class="tag ${P.tone(sc)}">${P.outlook(sc)} · ${Math.round(sc)}</span>`;
  const ul = items => '<ul>' + items.filter(Boolean).map(i => `<li>${i}</li>`).join('') + '</ul>';

  function ctx(chart) {
    const S = P.planetStrength(chart), AV = B.ashtakavarga(chart), SB = B.shadbala(chart), pl = k => chart.planets.find(p => p.key === k);
    const house = n => {
      const hh = chart.houses[n - 1], lord = hh.lord, lp = pl(lord), occ = chart.planets.filter(p => p.house === n);
      const sav = AV.byHouse[n - 1].sav, ls = S[lord];
      const score = ls.score + (sav - 28) / 8 + occ.reduce((a, p) => a + 0.3 * S[p.key].score, 0);
      const label = score >= 1.5 ? 'Strong' : score >= 0.5 ? 'Good' : score >= -0.5 ? 'Mixed' : 'Needs care';
      const lh = lp.house, placed = [1, 4, 5, 7, 9, 10].includes(lh) ? 'a supportive placement' : [6, 8, 12].includes(lh) ? 'a demanding placement' : [2, 3, 11].includes(lh) ? 'a moderate placement' : 'a neutral placement';
      const text = `The ${ord(n)} house (${HT[n]}) is in ${hh.signName}, ruled by ${lord}. ${lord} sits in ${lp.signName} in the ${ord(lh)} house${lp.dignity ? `, ${lp.dignity === 'Own sign' ? 'in its own sign' : lp.dignity.toLowerCase()}` : ''}${lp.retro && !['Sun', 'Moon'].includes(lord) ? ', retrograde' : ''}, ${placed}. ` +
        (occ.length ? `Planets here: ${occ.map(p => p.key).join(', ')}. ` : 'No planet sits in it. ') + `Ashtakavarga support: ${sav} bindus (average 28).`;
      return { n, sign: hh.signName, lord, lordHouse: lh, lordSign: lp.signName, occ, sav, score, label, text, tone: score >= 1.5 ? 'good' : score >= 0.5 ? 'good' : score >= -0.5 ? 'mid' : 'bad' };
    };
    return { S, AV, SB, pl, house };
  }
  const htag = h => `<span class="tag ${h.tone}">${h.label}</span>`;
  const houseBlock = h => `<p><b>${ord(h.n)} house</b> ${htag(h)}<br>${esc(h.text)}</p>`;

  // ------------------------------------------------------------------ KUNDLI ANALYSIS
  function kundli(chart, pred) {
    const c = ctx(chart), L = chart.lagna, moon = c.pl('Moon'), sun = c.pl('Sun'), pts = [];
    const ll = chart.houses[0].lord, llp = c.pl(ll);
    pts.push({ id: 'lagna', title: 'Lagna and personality', tag: L.signName, html: `<p>Your Lagna (ascendant) is <b>${L.signName}</b>, at ${Math.floor(L.deg)}° in ${L.nakshatra}. ${LAGNA_TXT[L.sign]}</p><p>The Lagna lord is <b>${ll}</b>, placed in ${llp.signName} in the ${ord(llp.house)} house (${HT[llp.house]}). This is where your life energy tends to be directed.${llp.dignity ? ` It is ${llp.dignity === 'Own sign' ? 'in its own sign' : llp.dignity.toLowerCase()}.` : ''} Natal strength: ${c.S[ll].score >= 1 ? 'good' : c.S[ll].score >= 0 ? 'average' : 'under pressure'}.</p>` });
    pts.push({ id: 'mind', title: 'Mind and emotions', tag: moon.signName, html: `<p>Your Moon (Rashi) is in <b>${moon.signName}</b>, in <b>${moon.nakshatra}</b> nakshatra (pada ${moon.pada}, ruled by ${moon.nakLord}). In this placement ${MOON_TXT[moon.sign]}.</p><p>The Moon sits in the ${ord(moon.house)} house (${HT[moon.house]}), so emotional energy goes there. ${moon.dignity ? `It is ${moon.dignity.toLowerCase()}. ` : ''}Your Vimshottari dasha starts from ${moon.nakLord}, the lord of your Moon nakshatra.</p>` });
    pts.push({ id: 'sun', title: 'Sun, purpose and vitality', tag: `${sun.signName}, ${ord(sun.house)} house`, html: `<p>The Sun, the significator of self, authority and vitality, is in <b>${sun.signName}</b> in the ${ord(sun.house)} house (${HT[sun.house]}).${sun.dignity ? ` It is ${sun.dignity.toLowerCase()}.` : ''} ${[1, 10, 11, 3, 6, 9, 5].includes(sun.house) ? 'This is a comfortable house for the Sun: recognition tends to come through effort.' : 'The Sun works harder here; recognition may come later or by indirect routes.'}</p>` });
    const ranked = c.SB.ranked, top = ranked.slice(0, 2), low = ranked.slice(-2);
    pts.push({ id: 'strength', title: 'Strongest and weakest planets', tag: `${top[0]} leads`, html: `<p>By Shadbala (six-fold strength) the strongest planets are <b>${top.map(k => `${k} (${c.SB.planets[k].percent}%)`).join(' and ')}</b>; the weakest are <b>${low.map(k => `${k} (${c.SB.planets[k].percent}%)`).join(' and ')}</b>. Strong planets deliver their results more easily; weak ones need more effort in the areas they govern.</p>` +
      ranked.map(k => hb(k, Math.min(100, c.SB.planets[k].percent / 1.5), `${c.SB.planets[k].label}: ${c.SB.planets[k].rupas.toFixed(2)} rupas against ${c.SB.planets[k].required} needed`)).join('') +
      '<p class="hint">Bar length is percentage of the required strength, scaled so 150% fills the bar.</p>' });
    const present = chart.yogas.filter(y => y.present);
    pts.push({ id: 'yogas', title: 'Yogas and doshas', tag: present.length + ' present', html: present.length ? '<p>These classical combinations are present in your chart:</p>' + ul(present.map(y => `<b>${esc(y.name)}</b>: ${esc(y.detail)}`)) + '<p class="hint">A yoga shows potential; its result depends on the strength of the planets involved and on the dasha running.</p>' : '<p>None of the classical combinations checked here are present. That is common, and says nothing about quality of life.</p>' });
    const hs = Array.from({ length: 12 }, (_, i) => c.house(i + 1)), best = hs.slice().sort((a, b) => b.score - a.score).slice(0, 3), worst = hs.slice().sort((a, b) => a.score - b.score).slice(0, 3);
    pts.push({ id: 'houses', title: 'Strong and sensitive life areas', tag: `House ${best[0].n} strongest`, html: `<p>Combining the house lord\'s strength, occupants and Ashtakavarga bindus:</p><p><b>Strongest areas</b><br>${best.map(h => `${ord(h.n)} house (${HT[h.n]}), ${h.label.toLowerCase()}`).join('<br>')}</p><p><b>Areas that need more care</b><br>${worst.map(h => `${ord(h.n)} house (${HT[h.n]}), ${h.label.toLowerCase()}`).join('<br>')}</p><p class="hint">The Readings tab has a full house-by-house reading.</p>` });
    const now = Date.now(), vm = pred.vimsh.find(m => m.start <= now && now < m.end), va = vm && vm.antars.find(a => a.start <= now && now < a.end), r = pred.now, f = d => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    pts.push({ id: 'now', title: 'Where you are now', tag: vm ? `${vm.lord}–${va ? va.lord : ''}` : '', html: vm ? `<p>You are in the <b>${vm.lord}</b> Mahadasha${va ? `, <b>${va.lord}</b> Antardasha (until ${f(va.end)})` : ''}. ${esc(vm.text)}</p><p>Overall outlook right now: ${pill(r.score)}. Jupiter is ${ord(r.jH)} from your Moon and Saturn ${ord(r.sH)}${r.sade ? ' (Sade Sati is running)' : ''}.</p><p class="hint">See the Life Predictions tab for the full timeline.</p>` : '<p>No dasha data.</p>' });
    return { points: pts };
  }

  // ------------------------------------------------------------------ month adjustments for areas
  const W4 = [['vMD', 0.3], ['vAD', 0.3], ['yMD', 0.24], ['yAD', 0.16]];
  function areaScore(rec, S, spec) {
    let a = 0;
    W4.forEach(([k, w]) => { const s = S[rec[k]], g = (spec.good.includes(s.house) ? 1 : 0) + s.owned.filter(o => spec.good.includes(o)).length, bd = (spec.bad.includes(s.house) ? 1 : 0) + s.owned.filter(o => spec.bad.includes(o)).length;
      a += w * (7 * Math.min(g, 2) * clamp(s.score / 1.5, -1, 1) - 3 * Math.min(bd, 2)); });
    if (spec.jup && spec.jup.includes(rec.jL)) a += 4;
    return clamp(Math.round(rec.score + a), 5, 95);
  }
  const AREAS = { career: { good: [10, 6, 11], bad: [], jup: [10, 2, 11, 6] }, finance: { good: [2, 11, 5, 9], bad: [], jup: [2, 11, 5, 9] }, love: { good: [7, 5, 2], bad: [], jup: [7, 5, 1, 11] }, health: { good: [1], bad: [6, 8, 12], jup: [1, 5, 9] }, home: { good: [4, 2], bad: [], jup: [4, 2, 9] } };

  // ------------------------------------------------------------------ MARRIAGE
  function marriageTiming(chart, pred, S) {
    const h7 = chart.houses[6].lord, set = new Set([h7, 'Venus']); chart.planets.forEach(p => { if (p.house === 7 && !['Rahu', 'Ketu'].includes(p.key)) set.add(p.key); });
    const byYear = {};
    pred.months.forEach(m => { if (m.age < 18 || m.age > 50) return; const ok = set.has(m.vAD) && [1, 3, 7, 11].includes(m.jL);
      if (ok) { const y = Math.floor(m.age); (byYear[y] = byYear[y] || { age: y, n: 0, rec: m }).n++; } });
    return { set: [...set], years: Object.values(byYear).sort((a, b) => a.age - b.age), h7 };
  }
  function marriage(chart, pred, res, names) {
    const c = ctx(chart), h7 = c.house(7), pts = [], ven = c.pl('Venus'), jup = c.pl('Jupiter'), nm = names || {};
    const navL = E.vargaSign(chart.lagna.lon, 9), l7 = c.pl(chart.houses[6].lord);
    pts.push({ id: 'seventh', title: 'Your marriage indicators', tag: `7th house ${h7.label}`, html: houseBlock(h7) +
      `<p><b>Venus</b> (the natural significator of partnership) is in ${ven.signName} in the ${ord(ven.house)} house${ven.dignity ? `, ${ven.dignity.toLowerCase()}` : ''}${ven.navSign === ven.sign ? ' and is Vargottama (same sign in D1 and D9), which adds strength' : ''}. <b>Jupiter</b> (significator of the husband for women and of wisdom in the bond) is in ${jup.signName} in the ${ord(jup.house)} house${jup.dignity ? `, ${jup.dignity.toLowerCase()}` : ''}.</p>` +
      `<p>In the Navamsa (D9), the chart of marriage, the Lagna is ${SIGNS[navL]}, and the 7th lord ${l7.key} is in ${SIGNS[l7.navSign]} (${ord(l7.navHouse)} house of D9).</p>` });
    const mg = chart.yogas.find(y => /Manglik/.test(y.name));
    pts.push({ id: 'manglik', title: 'Mangal dosha (Manglik) status', tag: mg && mg.present ? 'Present' : 'Absent', html: `<p>${mg && mg.present ? '<b>Mangal dosha is present.</b>' : '<b>Mangal dosha is not present.</b>'} ${esc(mg ? mg.detail : '')}</p><p class="hint">Mars in the 1st, 2nd, 4th, 7th, 8th or 12th house, counted from the Lagna or Moon, is the usual test. Traditions differ on how strictly it applies and on cancellations, so treat it as one factor among several.</p>` });
    const need = 'Enter your partner\'s details in the form above and press <b>Match charts</b>.';
    if (!res) {
      pts.push({ id: 'guna', title: 'Guna Milan (36 points)', tag: 'needs partner', html: `<p>${need}</p>` });
      pts.push({ id: 'cancel', title: 'Doshas and cancellations', tag: 'needs partner', html: `<p>${need}</p>` });
      pts.push({ id: 'mcomp', title: 'Manglik comparison', tag: 'needs partner', html: `<p>${need}</p>` });
    } else {
      const pct = Math.round(res.total / 36 * 100), tone = res.total >= 25 ? 'good' : res.total >= 18 ? 'mid' : 'bad';
      pts.push({ id: 'guna', title: 'Guna Milan (36 points)', tag: `${res.total}/36`, html: `<p style="font-size:18px"><b>${res.total} out of 36</b> <span class="tag ${tone}">${res.verdict}</span></p><div class="hb"><span class="nm">Total</span><div class="tr"><i class="fill ${tone === 'good' ? 'fgood' : tone === 'mid' ? 'fmid' : 'fbad'}" style="left:0;width:${pct}%"></i><span class="mk" style="left:50%"></span></div><span class="val">${pct}%</span></div>` +
        `<div class="scroll"><table><thead><tr><th>Koota</th><th>Meaning</th><th>${esc(nm.bride || 'Bride')}</th><th>${esc(nm.groom || 'Groom')}</th><th>Score</th></tr></thead><tbody>` + res.kootas.map(k => `<tr><td><b>${k.key}</b></td><td>${esc(k.means)}</td><td>${esc(k.bride)}</td><td>${esc(k.groom)}</td><td><b>${k.got}</b> / ${k.max}</td></tr>`).join('') + `</tbody></table></div>` +
        `<p class="hint">Verdict bands: below 18 is under the usual minimum, 18–24 acceptable, 25–32 very good, 33 and above excellent. The score uses Moon sign and nakshatra only. Published tables differ slightly (Vashya, Gana direction, Yoni): this app uses the matrices listed in the About section.</p>` });
      pts.push({ id: 'cancel', title: 'Doshas and cancellations', tag: res.notes.some(n => n.kind === 'warn') ? 'check' : 'clear', html: ul(res.notes.map(n => `<span class="tag ${n.kind === 'ok' ? 'good' : 'bad'}">${n.kind === 'ok' ? 'OK' : 'Check'}</span> ${esc(n.text)}`)) });
      pts.push({ id: 'mcomp', title: 'Manglik comparison', tag: res.manglik.result.kind === 'ok' ? 'balanced' : 'check', html: `<p><b>${esc(nm.bride || 'Bride')}</b>: ${res.manglik.bride.present ? 'Mangal dosha present' : 'no Mangal dosha'}<br><b>${esc(nm.groom || 'Groom')}</b>: ${res.manglik.groom.present ? 'Mangal dosha present' : 'no Mangal dosha'}</p><p><span class="tag ${res.manglik.result.kind === 'ok' ? 'good' : 'bad'}">${res.manglik.result.kind === 'ok' ? 'OK' : 'Check'}</span> ${esc(res.manglik.result.text)}</p>` });
    }
    const t = marriageTiming(chart, pred, c.S), now = Date.now(), by = chart.input.year;
    const up = t.years.filter(y => by + y.age + 1 >= new Date(now).getFullYear());
    pts.push({ id: 'timing', title: 'Timing windows for marriage', tag: up.length ? `${by + up[0].age}` : 'none ahead', html: `<p>Classical timing looks for a dasha or sub-period of the <b>7th lord (${t.h7})</b>, Venus, or a planet in the 7th house, together with Jupiter transiting or aspecting the 7th house from the Lagna. Periods that qualify in this chart (ages 18–50):</p>` +
      (t.years.length ? '<div class="scroll"><table><thead><tr><th>Year</th><th>Age</th><th>Months that fit</th><th>Dasha</th><th>Jupiter from Lagna</th></tr></thead><tbody>' + t.years.map(y => `<tr${by + y.age + 1 < new Date(now).getFullYear() ? ' style="opacity:.55"' : ''}><td>${by + y.age}–${String(by + y.age + 1).slice(2)}</td><td>${y.age}</td><td>${y.n}</td><td>${y.rec.vMD}–${y.rec.vAD}</td><td>${ord(y.rec.jL)} house</td></tr>`).join('') + '</tbody></table></div>' : '<p>No period meets all of the conditions in this age range.</p>') +
      '<p class="hint">Faded rows are in the past. These are windows where supportive conditions overlap, not a prediction of a date. Many people marry outside them.</p>' });
    pts.push({ id: 'advice', title: 'Reading it together', tag: '', html: ul(['The 36-point score is a traditional screen based on the Moon. Charts of both people (7th houses, Venus, Mars, dashas) matter as much.', 'A low score with strong 7th houses and friendly dashas is not a verdict against a match; a high score does not remove the need for compatibility in values and conduct.', 'Where a dosha is flagged, traditional texts list cancellations; this app mentions only the commonly accepted ones.', 'Please treat everything here as a starting point for reflection.']) });
    return { points: pts };
  }

  // ------------------------------------------------------------------ CAREER & FINANCE
  function dhanaYogas(chart, c) {
    const L = n => chart.houses[n - 1].lord, pl = c.pl, out = [], seen = new Set();
    const pairs = [[2, 11], [1, 2], [1, 11], [5, 9], [2, 5], [2, 9], [9, 11], [5, 11], [1, 5], [1, 9]];
    pairs.forEach(([a, b]) => { const la = L(a), lb = L(b), key = [la, lb].sort().join('-') + a + b; if (la === lb || seen.has(key)) return; seen.add(key);
      const pa = pl(la), pb = pl(lb);
      if (pa.sign === pb.sign) out.push(`${ord(a)} lord ${la} and ${ord(b)} lord ${lb} are together in ${pa.signName}: a wealth-linking combination.`);
      else if (pa.house === b && pb.house === a) out.push(`${ord(a)} lord ${la} and ${ord(b)} lord ${lb} exchange houses: a strong wealth-linking combination.`); });
    [1, 2, 5, 9, 11].forEach(n => { const l = L(n), p = pl(l); if (l !== L(n === 1 ? 2 : 1) && (p.house === 2 || p.house === 11) && n !== 2 && n !== 11) out.push(`${ord(n)} lord ${l} sits in the ${ord(p.house)} house of wealth/gains.`); });
    return [...new Set(out)].slice(0, 6);
  }
  function career(chart, pred) {
    const c = ctx(chart), pts = [], h10 = c.house(10), h2 = c.house(2), h11 = c.house(11), h6 = c.house(6), h7 = c.house(7);
    const moon = c.pl('Moon'), m10 = (moon.sign + 9) % 12;
    pts.push({ id: 'tenth', title: 'Career indicators (10th house)', tag: h10.label, html: houseBlock(h10) + `<p>From the Moon, the 10th sign is ${SIGNS[m10]} (ruled by ${LORD[m10]}); classical practice reads the career from both the Lagna and the Moon.</p>` +
      `<p><b>Sun</b> (authority) is in the ${ord(c.pl('Sun').house)} house and <b>Saturn</b> (work and discipline) in the ${ord(c.pl('Saturn').house)} house (${c.pl('Saturn').signName}).</p>` });
    // fields
    const score = {}, add = (k, w) => score[k] = (score[k] || 0) + w;
    add(h10.lord, 3); h10.occ.forEach(p => add(p.key, 2)); add(c.SB.ranked[0], 2); add(chart.houses[0].lord, 1); add(LORD[m10], 1.5); add(chart.houses[5].lord, 1);
    const topF = Object.entries(score).sort((a, b) => b[1] - a[1]).slice(0, 3);
    pts.push({ id: 'fields', title: 'Work areas that suit the chart', tag: topF[0][0], html: '<p>Planets that carry the most weight for career here (10th lord, planets in the 10th, 10th from the Moon, strongest planet, Lagna and 6th lords) point towards:</p>' + ul(topF.map(([k]) => `<b>${k}</b>: ${FIELDS[k]}`)) + '<p class="hint">These are tendencies. Skills, education and opportunity decide the actual career.</p>' });
    const svc = h6.score, biz = h7.score;
    pts.push({ id: 'style', title: 'Service, business or independent', tag: biz > svc + 0.4 ? 'partnerships' : svc > biz + 0.4 ? 'service' : 'either', html: `<p>The 6th house (service, employment) scores <b>${h6.label}</b> and the 7th house (business, partnerships, dealing with the public) scores <b>${h7.label}</b>. ${biz > svc + 0.4 ? 'The chart leans towards business, partnerships or client-facing work.' : svc > biz + 0.4 ? 'The chart leans towards structured employment or service roles.' : 'Neither stands out, so either route can work depending on the dasha.'}</p><p>The 10th lord ${h10.lord} is in the ${ord(h10.lordHouse)} house: ${[1, 5, 9].includes(h10.lordHouse) ? 'self-directed, independent work comes naturally' : [7].includes(h10.lordHouse) ? 'work through partners or the public suits you' : [6].includes(h10.lordHouse) ? 'steady service and problem-solving roles suit you' : [2, 11].includes(h10.lordHouse) ? 'career and earnings are closely tied' : [4].includes(h10.lordHouse) ? 'work from or near home, or in property and education, can suit' : [3].includes(h10.lordHouse) ? 'communication, enterprise and effort-based work suit' : 'career runs through hidden, research or foreign channels'}.</p>` });
    const dy = dhanaYogas(chart, c);
    pts.push({ id: 'wealth', title: 'Wealth and finance', tag: `2nd ${h2.label}`, html: houseBlock(h2) + houseBlock(h11) + `<p>The 5th house (speculation, investments) is <b>${c.house(5).label}</b> and the 9th (fortune) is <b>${c.house(9).label}</b>.</p>` + (dy.length ? '<p><b>Wealth-linking combinations found</b></p>' + ul(dy) : '<p>No simple wealth-linking combination among the 1st, 2nd, 5th, 9th and 11th lords. That does not mean low earnings.</p>') });
    const d10L = E.vargaSign(chart.lagna.lon, 10), d10 = {}; chart.planets.forEach(p => d10[p.key] = E.vargaSign(p.lon, 10));
    const tenth = (d10L + 9) % 12, inTenth = Object.keys(d10).filter(k => d10[k] === tenth);
    pts.push({ id: 'd10', title: 'Career chart (Dasamsa, D10)', tag: SIGNS[d10L], html: `<p>The Dasamsa Lagna is <b>${SIGNS[d10L]}</b> and its 10th sign is ${SIGNS[tenth]} (ruled by ${LORD[tenth]}). ${inTenth.length ? `Planets in the D10 10th: ${inTenth.join(', ')}.` : 'No planet occupies the D10 10th.'} The D10 position of the natal 10th lord ${h10.lord} is ${SIGNS[d10[h10.lord]]}${d10[h10.lord] === c.pl(h10.lord).sign ? ' (same as D1, Vargottama-like strength)' : ''}.</p><p class="hint">The All Charts tab shows D10 as a drawn chart.</p>` });
    // momentum
    const nowAge = Math.floor(pred.nowAge), yrs = [];
    for (let a = nowAge; a < Math.min(pred.lifeYears, nowAge + 10); a++) { const ms = pred.months.slice(a * 12, a * 12 + 12); if (!ms.length) break;
      const avg = k => Math.round(ms.reduce((s, m) => s + areaScore(m, c.S, AREAS[k]), 0) / ms.length), mid = ms[6];
      yrs.push({ a, year: chart.input.year + a, career: avg('career'), finance: avg('finance'), mid }); }
    pts.push({ id: 'ten', title: 'Next ten years: career and finance momentum', tag: yrs.length ? `best ${yrs.slice().sort((x, y) => y.career - x.career)[0].year}` : '', html: '<p>Each year (birthday to birthday) is scored from how strongly the running dasha lords connect with the career houses (10, 6, 11) or the money houses (2, 11, 5, 9), their natal strength, and Jupiter\'s transit. Higher is easier.</p>' +
      yrs.map(y => `<div style="margin:10px 0"><b>${y.year}–${String(y.year + 1).slice(2)}</b> <span class="hint">${y.mid.vMD}–${y.mid.vAD} dasha, Jupiter in your ${ord(y.mid.jL)} house</span>${hb('Career', y.career)}${hb('Finance', y.finance)}</div>`).join('') + '<p class="hint">A rule-of-thumb index from 5 to 95, not a forecast of income.</p>' });
    const n12 = pred.next12;
    pts.push({ id: 'next12', title: 'Next 12 months', tag: '', html: '<div class="scroll"><table><thead><tr><th>From</th><th>Dasha</th><th>Career</th><th>Finance</th></tr></thead><tbody>' + n12.map(m => `<tr><td>${new Date(m.t).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</td><td>${m.vMD}–${m.vAD}</td><td>${pill(areaScore(m, c.S, AREAS.career))}</td><td>${pill(areaScore(m, c.S, AREAS.finance))}</td></tr>`).join('') + '</tbody></table></div><p class="hint">Use the strong months for launches, negotiations and big commitments; use the weak ones for consolidation.</p>' });
    return { points: pts };
  }

  // ------------------------------------------------------------------ YEARLY HOROSCOPE
  function varsha(chart, year) {
    const nat = chart.planets.find(p => p.key === 'Sun').lon, age = year - chart.input.year;
    let jd = chart.jd + age * 365.2422;
    for (let i = 0; i < 12; i++) { const d = ((nat - E.siderealLon('Sun', jd) + 540) % 360) - 180; jd += d / 0.9856; if (Math.abs(d) < 1e-6) break; }
    const ms = (jd - 2440587.5) * 86400000, u = new Date(Math.round(ms / 60000) * 60000);
    const vc = E.computeChart({ year: u.getUTCFullYear(), month: u.getUTCMonth() + 1, day: u.getUTCDate(), hour: u.getUTCHours(), minute: u.getUTCMinutes(), lat: chart.input.lat, lon: chart.input.lon, tz: 'UTC', name: 'Varsha' });
    return { chart: vc, ms: u.getTime(), age };
  }
  function yearly(chart, pred, year) {
    const c = ctx(chart), age = year - chart.input.year, pts = [];
    if (age < 0 || age * 12 + 12 > pred.months.length) return { points: [{ id: 'na', title: 'Year not available', html: '<p>Choose a year between your birth year and the end of the supported range.</p>' }], error: true };
    const ms = pred.months.slice(age * 12, age * 12 + 12), yr = pred.years[age], mid = ms[6], sc = x => Math.round(x.reduce((a, b) => a + b, 0) / x.length);
    const area = k => sc(ms.map(m => areaScore(m, c.S, AREAS[k])));
    const V = varsha(chart, year), vc = V.chart;
    const muntha = (chart.lagna.sign + age) % 12, mh = ((muntha - vc.lagna.sign + 12) % 12) + 1, ml = LORD[muntha], mlp = vc.planets.find(p => p.key === ml);
    const f = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    const bd = new Date(chart.utcMs + age * 365.2422 * 86400000);
    const pairs = []; ms.forEach(m => { const k = m.vMD + '–' + m.vAD, last = pairs[pairs.length - 1]; if (last && last.k === k) last.to = m.t; else pairs.push({ k, from: m.t, to: m.t, md: m.vMD, ad: m.vAD }); });
    pts.push({ id: 'glance', title: `${year}–${String(year + 1).slice(2)} at a glance`, tag: P.outlook(yr.score), html: `<p>Your age ${age} year runs from your birthday around <b>${f(bd.getTime())}</b>. Overall outlook: ${pill(yr.score)}</p>` + ul([`Main dasha: <b>${mid.vMD}</b> Mahadasha${pairs.length > 1 ? ' with sub-periods ' + pairs.map(p => p.ad).join(' → ') : `, <b>${mid.vAD}</b> Antardasha`}.`, `Jupiter transits your ${ord(mid.jL)} house (${ord(mid.jH)} from the Moon): ${esc(P.HOUSE_THEME[mid.jL])}.`, `Saturn is ${ord(mid.sH)} from your Moon${yr.sade ? ' (Sade Sati is active)' : ''}.`, ...yr.themes.map(esc)]) + '<p class="hint">Index from 5 to 95. It blends dasha strength with Jupiter and Saturn transits; it is a rule of thumb.</p>' });
    pts.push({ id: 'varsha', title: 'Varsha chart (solar return) and Muntha', tag: `Muntha ${ord(mh)}`, html: `<p>The Varsha chart is cast for the moment the Sun returns to its birth position: <b>${new Date(V.ms).toLocaleString(undefined, { timeZone: chart.input.tz, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</b> (${esc(chart.input.tz)}), at your birthplace.</p><div data-varsha="${year}"></div>` +
      `<p>Varsha Lagna: <b>${vc.lagna.signName}</b>. <b>Muntha</b> (your natal Lagna advanced one sign per year) is in <b>${SIGNS[muntha]}</b>, the ${ord(mh)} house of the Varsha chart${[6, 8, 12].includes(mh) ? ', a demanding placement that asks for care with health and effort' : mh === 1 || mh === 10 || mh === 11 ? ', a favourable placement for confidence, standing and gains' : ', a moderate placement'}. Its lord ${ml} sits in the ${ord(mlp.house)} house of the Varsha chart${mlp.dignity ? `, ${mlp.dignity.toLowerCase()}` : ''}.</p><p class="hint">Cast for the birthplace; if you live elsewhere the Lagna may differ. Year-lord (Varshesha) and Tajika aspects are not included.</p>`, varsha: vc });
    const A = [['Career and status', 'career'], ['Money and finances', 'finance'], ['Relationships and marriage', 'love'], ['Health and energy', 'health'], ['Home and family', 'home']];
    pts.push({ id: 'areas', title: 'Life areas this year', tag: '', html: A.map(([nm, k]) => hb(nm, area(k), `${P.outlook(area(k))}`)).join('') + '<p class="hint">Each bar uses the months of this year, adjusting the overall index by how closely the running dasha lords relate to that area\'s houses. Health also counts the 6th, 8th and 12th.</p>' });
    pts.push({ id: 'months', title: 'Month by month', tag: '', html: '<div class="scroll"><table><thead><tr><th>Month</th><th>Dasha</th><th>Jupiter / Saturn from Moon</th><th>Outlook</th></tr></thead><tbody>' + ms.map((m, i) => `<tr><td>${f(chart.utcMs + (age * 12 + i) * MONTH).replace(/ \d{4}$/, '')} →</td><td>${m.vMD}–${m.vAD}</td><td>${ord(m.jH)} / ${ord(m.sH)}${m.sade ? ' · Sade Sati' : ''}</td><td>${pill(m.score)}</td></tr>`).join('') + '</tbody></table></div>' });
    const sorted = ms.map((m, i) => ({ m, i })).sort((a, b) => b.m.score - a.m.score), lab = x => f(chart.utcMs + (age * 12 + x.i) * MONTH).replace(/ \d{4}$/, '');
    pts.push({ id: 'bestworst', title: 'Strongest and most demanding months', tag: '', html: `<p><b>Strongest</b>: ${sorted.slice(0, 3).map(x => `from ${lab(x)} (${x.m.score}, ${x.m.vMD}–${x.m.vAD})`).join('; ')}.</p><p><b>Most demanding</b>: ${sorted.slice(-3).reverse().map(x => `from ${lab(x)} (${x.m.score}, ${x.m.vMD}–${x.m.vAD})`).join('; ')}.</p><p class="hint">Month boundaries are counted from your birthday and are approximate to a few days.</p>` });
    pts.push({ id: 'dashas', title: 'Dasha periods in this year', tag: '', html: ul(pairs.map(p => `<b>${p.md}–${p.ad}</b>: about ${f(p.from - MONTH / 2).replace(/ \d{4}$/, '')} to ${f(p.to + MONTH / 2).replace(/ \d{4}$/, '')}. ${esc(P.KARAKA[p.ad])}.`)) });
    return { points: pts, varsha: vc, age };
  }

  return { kundli, marriage, career, yearly, areaScore, AREAS, varsha, marriageTiming };
});
