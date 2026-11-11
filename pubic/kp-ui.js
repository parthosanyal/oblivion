/* KP Astrology tab. Uses window.KP (kp.js) and window.JK (app.js). */
(function () {
  const $ = id => document.getElementById(id), sw = $('kpSwitch'); if (!sw) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PAGES = [['chart', 'Planets & cusps'], ['sig', 'Significators'], ['csl', 'Cuspal sub-lords'], ['dasha', 'Dasha & timing'], ['rp', 'Ruling planets'], ['horary', 'Horary 1–249']];
  const st = { cur: 'chart', rpTime: null, hnum: '' }; let K = null, E = window.VedicEngine;
  sw.innerHTML = PAGES.map(([k, t]) => `<button type="button" data-sec="${k}" role="tab">${t}</button>`).join('');
  sw.addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (!b) return; st.cur = b.dataset.sec; render(); });
  document.addEventListener('kundli:ready', () => { K = null; st.rpTime = null; render(); });
  document.querySelectorAll('input[name=style]').forEach(r => r.addEventListener('change', () => { if (st.cur === 'chart') render(); }));
  const dms = d => window.JK.fmtDeg(d), ab = k => k, fmtD = ms => new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  const hs = a => a.length ? a.join(', ') : '–';
  const table = (head, rows) => `<div class="scroll"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const intro = (t, d) => `<div class="card"><h2>${t}</h2><p class="hint" style="margin-bottom:0">${d}</p></div>`;
  const NOTE = '<p class="hint">KP uses Placidus house cusps and the KP ayanamsa (about 6 arc-minutes less than Lahiri), so degrees here differ slightly from the Lahiri chart. Rahu and Ketu use the mean node. Rule-based reading for reflection, not professional advice.</p>';

  function get() { if (!K) K = window.KP.compute(window.JK.chart); return K; }

  function pageChart(k) {
    const J = window.JK, signs = k.cusps.map(c => c.sign), bodies = k.planets.map(p => ({ house: p.house - 1, sign: p.sign, label: J.ABBR[p.key] + (p.retro && !['Rahu', 'Ketu'].includes(p.key) ? '℞' : '') }));
    const svg = J.northSvg(signs[0], bodies, { signs });
    const cr = k.cusps.map(c => [c.n, c.signName, dms(c.deg), c.signLord, c.star, `<b>${c.sub}</b>`, c.subsub]);
    const pr = k.planets.map(p => [p.key + (p.retro && !['Rahu', 'Ketu'].includes(p.key) ? ' ℞' : ''), p.signName, dms(p.deg), p.house, p.signLord, p.star, `<b>${p.sub}</b>`, p.subsub]);
    return intro('KP chart: planets and cusps', 'The Krishnamurti Paddhati chart: 12 Placidus house cusps, and for every planet and cusp its sign lord, star lord, sub lord and sub-sub lord. The sub lord is the heart of KP: it decides whether a house matter is promised.') +
      `<div class="card"><h3 style="margin-top:0">Bhava chart</h3><div class="repchart">${svg}</div><p class="hint">Planets sit in the house whose Placidus cusps contain them (not necessarily the sign shown in the whole-sign chart). The small number in each house is the sign on its cusp.</p></div>` +
      `<div class="card"><h3 style="margin-top:0">House cusps (Placidus)</h3>${table(['Cusp', 'Sign', 'Degree', 'Sign lord', 'Star lord', 'Sub lord', 'Sub-sub'], cr)}</div>` +
      `<div class="card"><h3 style="margin-top:0">Planets</h3>${table(['Planet', 'Sign', 'Degree', 'House', 'Sign lord', 'Star lord', 'Sub lord', 'Sub-sub'], pr)}${NOTE}</div>`;
  }
  function pageSig(k) {
    const hr = k.hSig.map(h => [h.house, hs(h.A), hs(h.B), hs(h.C), hs(h.D)]);
    const pr = window.KP.ORDER.length && ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].map(p => { const s = k.pSig[p]; return [p, s.levels.map(l => hs(l.h)).join(' &nbsp;|&nbsp; '), `<b>${hs(s.houses)}</b>`]; });
    return intro('Significators', 'In KP every planet signifies houses in four ways, and every house has four grades of significators. A matter flourishes when its dasha lords signify the right houses.') +
      `<div class="card"><h3 style="margin-top:0">Significators of each house</h3><p class="hint">A strongest to D weakest. A: planets in the star of an occupant of the house. B: occupants. C: planets in the star of the house's owner (cusp sign lord). D: the owner.</p>${table(['House', 'A', 'B', 'C', 'D'], hr)}</div>` +
      `<div class="card"><h3 style="margin-top:0">Houses signified by each planet</h3><p class="hint">Levels, strongest first: (1) house held by its star lord, (2) house it occupies, (3) houses owned by its star lord, (4) houses it owns.</p>${table(['Planet', '1 | 2 | 3 | 4', 'All houses'], pr)}<p class="hint">Rahu and Ketu own no house; they are read through their sign lord, star lord and conjunctions, so treat their rows with care.</p></div>`;
  }
  function pageCsl(k) {
    const cards = k.analysis.map(a => `<div class="kpcard ${a.verdict === 'Promised' ? 'good' : a.verdict.startsWith('Partly') ? 'mid' : 'low'}"><b>${esc(a.title)}</b><span class="tag">${a.verdict}</span><p class="hint" style="margin:4px 0">Cusp ${a.cusp} sub lord: <b>${a.csl}</b> (star lord ${a.star}) signifies houses ${hs(a.sig)}.</p><p style="margin:2px 0">Supporting houses (${hs(a.yes)}): <b>${hs(a.hits)}</b>${a.deny.length ? `<br>Denying houses (${hs(a.no)}) also signified: <b>${hs(a.deny)}</b>` : ''}</p><p class="hint" style="margin:4px 0">${esc(a.note)}</p></div>`).join('');
    const rows = k.cusps.map(c => [c.n, c.signName + ' ' + dms(c.deg), `<b>${c.sub}</b>`, c.star, hs(k.pSig[c.sub].houses)]);
    return intro('Cuspal sub-lords', 'The sub lord of a house cusp is the judge of that house. If it signifies the houses that support a matter, the matter is promised; the dasha then gives the timing.') +
      `<div class="kpgrid">${cards}</div><div class="card"><h3 style="margin-top:0">Sub lord of every cusp</h3>${table(['Cusp', 'Position', 'Sub lord', 'Its star lord', 'Houses the sub lord signifies'], rows)}<p class="hint">Verdicts are a simple rule-based reading of the standard KP house groups. A real KP analysis also weighs the star lord, retrogression and the dasha chain. Use it for reflection, not decisions.</p></div>`;
  }
  function pageDasha(k) {
    const c = k.current, S = p => `<b>${p}</b> signifies ${hs(k.pSig[p].houses)}`;
    const chain = c.md ? `<div class="card"><h3 style="margin-top:0">Running now</h3><ul><li>Mahadasha: ${S(c.md.lord)} (${fmtD(c.md.start)} to ${fmtD(c.md.end)})</li>${c.ad ? `<li>Antardasha (bhukti): ${S(c.ad.lord)} (${fmtD(c.ad.start)} to ${fmtD(c.ad.end)})</li>` : ''}${c.pd ? `<li>Pratyantar: ${S(c.pd.lord)} (${fmtD(c.pd.start)} to ${fmtD(c.pd.end)})</li>` : ''}</ul></div>` : '';
    const big = k.periods.map(m => `<details class="pt"><summary><span class="ptt">${m.lord} Mahadasha</span><span class="tag">${fmtD(m.start)} – ${fmtD(m.end)}</span></summary><div class="pbody">${table(['Antardasha', 'From', 'To', 'Signifies'], m.antars.map(a => [a.lord, fmtD(a.start), fmtD(a.end), hs(k.pSig[a.lord].houses)]))}</div></details>`).join('');
    const w = window.KP.TOPICS.map(t => { const ws = k.windows[t.key]; return `<li><b>${esc(t.title)}</b>: ${ws.length ? ws.map(x => `${x.md}–${x.ad} (${fmtD(x.start)} to ${fmtD(x.end)})`).join('; ') : 'no matching Dasha-Bhukti in the next 25 years'}</li>`; }).join('');
    return intro('Dasha and timing (KP Vimshottari)', 'KP uses the Vimshottari dasha from the Moon\'s star with the KP ayanamsa. A matter happens in a period whose lords signify its houses.') + chain +
      `<div class="card"><h3 style="margin-top:0">Windows that favour each matter (next 25 years)</h3><p class="hint">Shown when both the Mahadasha lord and the Antardasha lord signify at least two supporting houses, and the Antardasha lord signifies the matter's own cusp house. A rough guide only.</p><ul>${w}</ul></div><div class="card"><h3 style="margin-top:0">All periods</h3>${big}</div>`;
  }
  function localParts(ms, tz) {
    const p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' }).formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; });
    return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour, minute: +p.minute, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
  }
  function pageRp() {
    const i = window.JK.chart.input, tz = i.tz, base = st.rpTime || localParts(Date.now(), tz);
    const pad = n => String(n).padStart(2, '0'), val = `${base.year}-${pad(base.month)}-${pad(base.day)}T${pad(base.hour)}:${pad(base.minute)}`;
    let body = '';
    try {
      const c = E.computeChart({ name: '', year: base.year, month: base.month, day: base.day, hour: base.hour, minute: base.minute, lat: i.lat, lon: i.lon, tz }), wd = new Date(Date.UTC(base.year, base.month - 1, base.day)).getUTCDay(), r = window.KP.ruling(c, wd);
      if (r.error) body = `<p class="error">${r.error}</p>`;
      else body = `<div class="scroll"><table><thead><tr><th>Ruling planet source</th><th>Planet</th></tr></thead><tbody>${r.list.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table></div><p><b>Strongest (repeated):</b> ${r.strongest.filter(p => r.count[p] > 1).join(', ') || 'none repeated'}. <b>All ruling planets:</b> ${r.strongest.join(', ')}.</p><p class="hint">At that moment Lagna is ${r.asc.signName} ${dms(r.asc.deg)} (sub lord ${r.asc.sub}) and the Moon is in ${r.moon.signName} ${dms(r.moon.deg)} (${r.moon.nak}, sub lord ${r.moon.sub}).</p>`;
    } catch (e) { body = `<p class="error">${esc(e.message)}</p>`; }
    return intro('Ruling planets', 'Ruling planets (RP) are the day lord, the Moon\'s sign and star lords and the Lagna\'s sign and star lords at the moment a question is asked. KP uses them to confirm or reject a promise and to choose among dasha periods.') +
      `<form class="card" id="rpForm"><label>Moment (local time at the birth place, ${esc(tz)})<input type="datetime-local" id="rpTime" value="${val}"></label><button class="primary" type="submit">Calculate</button> <button class="ghost" type="button" id="rpNow">Use now</button></form><div class="card">${body}<p class="hint">The day lord uses the calendar weekday; KP traditionally changes the day at sunrise, so before sunrise the previous day's lord is the more traditional choice.</p></div>`;
  }
  function pageHorary() {
    const t = window.KP.horaryTable(), n = +st.hnum, hit = n >= 1 && n <= 249 ? t[n - 1] : null;
    const rows = t.map(r => [r.n, r.signName, dms(r.from - r.sign * 30) + ' – ' + dms(r.to - r.sign * 30), r.signLord, r.star, r.sub].map((c, k) => k === 0 && hit && hit.n === r.n ? `<b>${c}</b>` : c));
    return intro('KP horary numbers (1 to 249)', 'In KP horary (prashna) the querent names a number from 1 to 249. Each number is one sub-division of the zodiac and fixes the Lagna (ascendant) for the question.') +
      `<form class="card" id="hForm"><label>Number (1 to 249)<input id="hNum" type="number" min="1" max="249" value="${esc(st.hnum)}"></label><button class="primary" type="submit">Look up</button>${hit ? `<p><b>${hit.n}</b>: Lagna begins at ${hit.signName} ${dms(hit.from - hit.sign * 30)} and runs to ${dms(hit.to - hit.sign * 30)}. Sign lord ${hit.signLord}, star lord ${hit.star}, sub lord <b>${hit.sub}</b> (${hit.nak}).</p>` : ''}</form>` +
      `<div class="card"><h3 style="margin-top:0">The 249 sub-divisions</h3>${table(['No.', 'Sign', 'From – to (in sign)', 'Sign lord', 'Star lord', 'Sub lord'], rows)}<p class="hint">The 243 sub-divisions are cut at sign boundaries, giving 249.</p></div>`;
  }
  function render() {
    sw.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.sec === st.cur));
    const body = $('kpBody'); if (!window.JK) { body.innerHTML = '<div class="card"><p class="hint">Generate a Kundli first.</p></div>'; return; }
    let html;
    try {
      if (st.cur === 'horary') html = pageHorary();
      else if (st.cur === 'rp') html = pageRp();
      else { const k = get(); if (k.error) { body.innerHTML = `<div class="card"><p class="error">${esc(k.error)}</p></div>`; return; } html = st.cur === 'sig' ? pageSig(k) : st.cur === 'csl' ? pageCsl(k) : st.cur === 'dasha' ? pageDasha(k) : pageChart(k); }
    } catch (e) { body.innerHTML = `<div class="card"><p class="error">Could not build this page: ${esc(e.message)}</p></div>`; return; }
    body.innerHTML = html;
    const rf = $('rpForm'); if (rf) { rf.addEventListener('submit', e => { e.preventDefault(); const v = $('rpTime').value; if (!v) return; const [d, t] = v.split('T'), [y, m, dd] = d.split('-').map(Number), [h, mi] = t.split(':').map(Number); st.rpTime = { year: y, month: m, day: dd, hour: h, minute: mi }; render(); }); $('rpNow').addEventListener('click', () => { st.rpTime = null; render(); }); }
    const hf = $('hForm'); if (hf) hf.addEventListener('submit', e => { e.preventDefault(); st.hnum = $('hNum').value; render(); });
  }
  render();
})();
