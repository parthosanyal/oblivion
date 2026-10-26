/* Reports tab: Kundli analysis, Marriage compatibility, Career & finance, Numerology, Yearly horoscope.
 * Renders each report as numbered points the reader can step through. Uses window.JK (set by app.js).
 */
(function () {
  const $ = id => document.getElementById(id), R = window.Reports, K = window.Koota, N = window.Numerology, E = window.VedicEngine, G = window.Geo;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SECTIONS = [['kundli', 'Kundli analysis'], ['marriage', 'Marriage compatibility'], ['career', 'Career & finance'], ['numerology', 'Numerology'], ['yearly', 'Yearly horoscope']];
  const st = { cur: 'kundli', open: {}, match: null, names: {}, partner: { name: '', role: 'groom', date: '', time: '12:00', place: '', lat: '', lon: '', tz: 'Asia/Kolkata' }, nameInput: null, year: null };
  let varshaChart = null;

  const sw = $('repSwitch'); if (!sw) return;
  sw.innerHTML = SECTIONS.map(([k, t]) => `<button type="button" data-sec="${k}" role="tab">${t}</button>`).join('');
  sw.addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (!b) return; st.cur = b.dataset.sec; render(); });
  document.addEventListener('kundli:ready', () => { st.match = null; st.nameInput = null; st.year = null; st.open = {}; render(); });
  document.querySelectorAll('input[name=style]').forEach(r => r.addEventListener('change', fillVarsha));

  // ---------- points UI ----------
  function pointsHtml(points, key) {
    const open = st.open[key] == null ? 0 : st.open[key];
    const nav = points.map((p, i) => `<button type="button" class="${i === open ? 'on' : ''}" data-go="${i}" title="${esc(p.title)}">${i + 1}. ${esc(p.title.length > 24 ? p.title.slice(0, 22) + '…' : p.title)}</button>`).join('');
    const items = points.map((p, i) => `<details class="pt" id="pt-${i}" data-i="${i}" ${i === open ? 'open' : ''}><summary><span class="pn">${i + 1}</span><span class="ptt">${esc(p.title)}</span>${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}</summary><div class="pbody">${p.html}</div><div class="pfoot">${i > 0 ? `<button type="button" class="ghost" data-go="${i - 1}">← Previous</button>` : '<span></span>'}${i < points.length - 1 ? `<button type="button" class="primary" data-go="${i + 1}">Next point →</button>` : '<span class="hint" style="margin:0">End of report</span>'}</div></details>`).join('');
    return `<div class="pnav" role="navigation" aria-label="Points">${nav}</div><div class="pctl"><button type="button" class="ghost" data-all="1">Expand all</button><button type="button" class="ghost" data-all="0">Collapse all</button></div>${items}`;
  }
  function go(i) {
    const body = $('repBody'); st.open[st.cur] = i;
    body.querySelectorAll('details.pt').forEach(d => { d.open = +d.dataset.i === i; });
    body.querySelectorAll('.pnav button').forEach((b, k) => b.classList.toggle('on', k === i));
    const t = $('pt-' + i); if (t) t.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }
  $('repBody').addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g) { go(+g.dataset.go); return; }
    const a = e.target.closest('[data-all]'); if (a) { $('repBody').querySelectorAll('details.pt').forEach(d => d.open = a.dataset.all === '1'); }
  });

  // ---------- main render ----------
  function render() {
    const J = window.JK; sw.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.sec === st.cur));
    const body = $('repBody'); if (!J) { body.innerHTML = '<div class="card"><p class="hint">Generate a Kundli first.</p></div>'; return; }
    const c = J.chart, pred = J.pred; let head = '', rep, key = st.cur;
    try {
      if (st.cur === 'kundli') { rep = R.kundli(c, pred); head = intro('Kundli analysis', 'A reading of your own birth chart in seven points: personality, mind, strengths, yogas, life areas and the dasha you are in.') + `<div class="card" id="repChartCard"><div id="repChart" class="repchart"></div></div>`; }
      else if (st.cur === 'marriage') { rep = R.marriage(c, pred, st.match, st.names); head = intro('Marriage compatibility', 'First your own marriage indicators, then an Ashtakoota (36-point Guna Milan) match with a partner\'s chart.') + partnerForm(); }
      else if (st.cur === 'career') { rep = R.career(c, pred); head = intro('Career and finance', 'The 10th, 2nd and 11th houses, suitable work areas, wealth combinations and a ten-year momentum view.'); }
      else if (st.cur === 'numerology') { const r = numerology(c); rep = r.rep; head = r.head; }
      else { const y = yearly(c, pred); rep = y.rep; head = y.head; key = 'yearly'; }
    } catch (err) { body.innerHTML = `<div class="card"><p class="error">Could not build this report: ${esc(err.message)}</p></div>`; return; }
    body.innerHTML = head + pointsHtml(rep.points, key);
    if (st.cur === 'kundli') drawMain(c);
    if (st.cur === 'yearly') { varshaChart = rep.varsha || null; fillVarsha(); }
    wireForms();
  }
  const intro = (t, d) => `<div class="card"><h2>${t}</h2><p class="hint" style="margin-bottom:0">${d} Step through the numbered points, or press Expand all. These are rule-based readings for reflection, not a substitute for a consultation.</p></div>`;

  function chartSvg(J, c, bodies) { const north = (document.querySelector('input[name=style]:checked') || {}).value !== 'south'; return (north ? J.northSvg : J.southSvg)(c.lagna.sign, bodies); }
  const labelOf = (J, p) => J.ABBR[p.key] + (p.retro && !['Rahu', 'Ketu'].includes(p.key) ? '℞' : '');
  function drawMain(c) { const J = window.JK, el = $('repChart'); if (el) el.innerHTML = chartSvg(J, c, c.planets.map(p => ({ sign: p.sign, label: labelOf(J, p) }))); }
  function fillVarsha() { const J = window.JK; if (!J || !varshaChart) return; document.querySelectorAll('[data-varsha]').forEach(el => { el.innerHTML = '<div class="repchart">' + chartSvg(J, varshaChart, varshaChart.planets.map(p => ({ sign: p.sign, label: labelOf(J, p) }))) + '</div>'; }); }

  // ---------- marriage form ----------
  function partnerForm() {
    const p = st.partner;
    return `<form class="card" id="pForm" autocomplete="off"><h3 style="margin-top:0">Partner details</h3>
      <div class="row2"><label>Partner name<input id="pName" value="${esc(p.name)}" maxlength="60" placeholder="Optional"></label>
      <label>Your chart is the<select id="pRole"><option value="groom"${p.role === 'groom' ? ' selected' : ''}>Groom (boy)</option><option value="bride"${p.role === 'bride' ? ' selected' : ''}>Bride (girl)</option></select></label></div>
      <div class="row2"><label>Partner date of birth<input id="pDate" type="date" value="${esc(p.date)}" required></label><label>Time of birth<input id="pTime" type="time" value="${esc(p.time)}" required></label></div>
      <label>Place of birth<input id="pPlace" list="pPlaces" value="${esc(p.place)}" placeholder="Start typing a city" autocomplete="off"><datalist id="pPlaces"></datalist></label>
      <div class="row3"><label>Latitude (+N)<input id="pLat" type="number" step="0.0001" min="-90" max="90" value="${esc(p.lat)}" required></label><label>Longitude (+E)<input id="pLon" type="number" step="0.0001" min="-180" max="180" value="${esc(p.lon)}" required></label><label>Time zone<input id="pTz" list="tzs" value="${esc(p.tz)}" required></label></div>
      <p class="hint">Pick a suggestion to fill the coordinates, or type them. If the birth time is unknown, 12:00 is used; the Moon sign is usually right but the nakshatra may be off. Details stay in your browser.</p>
      <button class="primary" type="submit">Match charts</button> <p id="pErr" class="error" hidden></p></form>`;
  }
  function wireForms() {
    const f = $('pForm');
    if (f) {
      const pl = $('pPlace'), dl = $('pPlaces'); let items = [];
      pl.addEventListener('input', () => { items = G ? G.searchOffline(pl.value, 10) : []; dl.innerHTML = items.map(c => `<option value="${esc(c.label)}"></option>`).join(''); const m = items.find(c => c.label === pl.value); if (m) fill(m); });
      pl.addEventListener('change', () => { const m = items.find(c => c.label === pl.value); if (m) fill(m); });
      const fill = m => { $('pLat').value = m.lat; $('pLon').value = m.lon; $('pTz').value = m.tz; };
      f.addEventListener('submit', e => {
        e.preventDefault(); const err = $('pErr'); err.hidden = true;
        const p = st.partner; p.name = $('pName').value.trim(); p.role = $('pRole').value; p.date = $('pDate').value; p.time = $('pTime').value || '12:00'; p.place = pl.value; p.lat = $('pLat').value; p.lon = $('pLon').value; p.tz = $('pTz').value.trim();
        try {
          const [y, mo, d] = p.date.split('-').map(Number), [h, mi] = p.time.split(':').map(Number);
          if (!y || !d) throw new Error('Enter the partner\'s date of birth.');
          const pc = E.computeChart({ name: p.name || 'Partner', year: y, month: mo, day: d, hour: h, minute: mi, lat: +p.lat, lon: +p.lon, tz: p.tz });
          const mine = window.JK.chart, bride = p.role === 'groom' ? pc : mine, groom = p.role === 'groom' ? mine : pc;
          st.match = K.match(bride, groom);
          const mn = mine.input.name || 'You', pn = p.name || 'Partner'; st.names = p.role === 'groom' ? { bride: pn, groom: mn } : { bride: mn, groom: pn };
          st.open.marriage = 2; render(); go(2);
        } catch (ex) { err.textContent = ex.message || 'Check the partner details.'; err.hidden = false; }
      });
    }
    const nf = $('nForm');
    if (nf) nf.addEventListener('submit', e => { e.preventDefault(); st.nameInput = $('nName').value; st.open.numerology = 0; render(); });
    const ys = $('yYear');
    if (ys) ys.addEventListener('change', () => { st.year = +ys.value; render(); });
    document.querySelectorAll('[data-yr]').forEach(b => b.addEventListener('click', () => { st.year = +b.dataset.yr; render(); }));
  }

  // ---------- yearly ----------
  function yearly(c, pred) {
    const by = c.input.year, last = by + pred.lifeYears - 1, nowY = by + Math.floor(pred.nowAge);
    if (st.year == null || st.year < by || st.year > last) st.year = Math.min(nowY, last);
    const rep = R.yearly(c, pred, st.year), opts = []; for (let y = by; y <= last; y++) opts.push(`<option value="${y}"${y === st.year ? ' selected' : ''}>${y}–${String(y + 1).slice(2)}${y === nowY ? ' (current)' : ''}</option>`);
    const head = intro('Yearly horoscope', 'A year runs from one birthday to the next. Pick a year to see its dasha, Varsha (solar return) chart, life-area ratings and month-by-month outlook.') + `<div class="card"><div class="row2" style="align-items:end"><label>Year<select id="yYear">${opts.join('')}</select></label><div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="ghost" data-yr="${Math.max(by, st.year - 1)}">← Previous year</button><button type="button" class="ghost" data-yr="${Math.min(last, st.year + 1)}">Next year →</button></div></div></div>`;
    return { rep, head };
  }

  // ---------- numerology ----------
  function numerology(c) {
    const name = st.nameInput != null ? st.nameInput : (c.input.name || ''), r = N.report({ name, day: c.input.day, month: c.input.month, year: c.input.year }), M = n => N.MEAN[n] || ['', '', ''];
    const row = (lab, n, how) => n == null ? `<tr><td><b>${lab}</b></td><td colspan="2" class="hint">Needs a name</td></tr>` : `<tr><td><b>${lab}</b><br><span class="hint" style="margin:0">${how}</span></td><td><b style="font-size:20px">${n}</b></td><td><b>${M(n)[0]}</b>. ${esc(M(n)[1])}<br><span class="hint" style="margin:0">Watch for: ${esc(M(n)[2])}</span></td></tr>`;
    const pts = [];
    pts.push({ id: 'core', title: 'Core numbers (Pythagorean)', tag: `Life Path ${r.lifePath}`, html: '<div class="scroll"><table><thead><tr><th>Number</th><th></th><th>Meaning</th></tr></thead><tbody>' + row('Life Path', r.lifePath, 'Day + month + year of birth') + row('Expression (Destiny)', r.expression, 'All letters of the name') + row('Soul Urge (Heart)', r.soul, 'Vowels of the name') + row('Personality', r.personality, 'Consonants of the name') + row('Birthday', r.birthday, 'Day of birth') + row('Maturity', r.maturity, 'Life Path + Expression') + '</tbody></table></div><p class="hint">Master numbers 11, 22 and 33 are kept unreduced. Y is counted as a consonant. Use the name as normally written on your birth records or in daily life.</p>' });
    const pm = n => `<b>${N.PLANET[n]}</b>`;
    pts.push({ id: 'indian', title: 'Indian numerology: Mulank and Bhagyank', tag: `${r.mulank} · ${r.bhagyank}`, html: `<p><b>Mulank</b> (Driver number, from the day of birth ${c.input.day}) is <b>${r.mulank}</b>, ruled by ${pm(r.mulank)}. ${esc(M(r.mulank)[1])}</p><p><b>Bhagyank</b> (Destiny number, sum of all digits of the birth date) is <b>${r.bhagyank}</b>, ruled by ${pm(r.bhagyank)}. ${esc(M(r.bhagyank)[1])}</p><p>${r.mulank === r.bhagyank ? 'Both numbers are the same, which concentrates the traits of this number.' : (N.LUCKY[r.mulank].friends.includes(r.bhagyank) ? `${N.PLANET[r.mulank]} and ${N.PLANET[r.bhagyank]} are generally considered friendly, so the two numbers support each other.` : `${N.PLANET[r.mulank]} and ${N.PLANET[r.bhagyank]} are not listed as friends, so the day-to-day self and the life direction may pull differently.`)}</p><p class="hint">Planet rulers: 1 Sun, 2 Moon, 3 Jupiter, 4 Rahu, 5 Mercury, 6 Venus, 7 Ketu, 8 Saturn, 9 Mars.</p>` });
    pts.push({ id: 'name', title: 'Name number (Chaldean)', tag: r.hasName ? String(r.chaldean) : 'needs name', html: r.hasName ? `<p>Using the Chaldean letter values, your name adds up to <b>${r.chaldeanRaw}</b>, which reduces to <b>${r.chaldean}</b> (${pm(r.chaldean)}). ${esc(M(r.chaldean)[1])}</p><p>${r.chaldean === r.mulank || r.chaldean === r.bhagyank ? 'It matches your birth numbers, which is considered harmonious.' : (N.LUCKY[r.chaldean].friends.includes(r.mulank) || N.LUCKY[r.chaldean].friends.includes(r.bhagyank)) ? 'It is friendly to at least one of your birth numbers.' : 'It differs from your birth numbers and is not listed as friendly to them. Some people explore a spelling variation; there is no scientific basis for expecting a change in outcomes.'}</p>` : '<p>Enter a name in the box above to see this.</p>' });
    const L = n => N.LUCKY[n];
    pts.push({ id: 'lucky', title: 'Lucky numbers, days and colours', tag: '', html: [r.mulank, r.bhagyank].filter((v, i, a) => a.indexOf(v) === i).map(n => `<p><b>For number ${n} (${N.PLANET[n]})</b></p>` + `<ul><li>Day: ${L(n).day}</li><li>Colours: ${L(n).colour}</li><li>Friendly numbers: ${L(n).friends.join(', ')}</li><li>Metal: ${L(n).metal}</li><li>Traditional gem: ${L(n).gem}</li></ul>`).join('') + '<p class="hint">These are traditional associations. Gems should not be bought on the strength of a number; consult a qualified person before spending significant money.</p>' });
    const cell = n => { const k = r.counts[n]; return `<div class="ls ${k ? 'has' : ''}" title="${n}: ${N.LOSHU_MEAN[n]}">${k ? String(n).repeat(k) : '·'}</div>`; };
    pts.push({ id: 'loshu', title: 'Lo Shu grid', tag: r.missing.length ? `${r.missing.length} missing` : 'complete', html: `<div class="loshu">${N.LOSHU_ROWS.map(rw => rw.map(cell).join('')).join('')}</div><p>The grid places the digits of your date of birth (${c.input.day}-${c.input.month}-${c.input.year}, zeros ignored) in the Lo Shu square. A repeated digit means that quality is emphasised; a dot means it is not present in the date.</p>` +
      (r.missing.length ? '<p><b>Missing digits</b></p>' + ul(r.missing.map(n => `<b>${n}</b>: ${N.LOSHU_MEAN[n]}`)) : '<p>All nine digits appear, which is rare.</p>') + (Object.keys(r.counts).filter(n => r.counts[n] > 1).length ? '<p><b>Emphasised</b>: ' + Object.keys(r.counts).filter(n => r.counts[n] > 1).map(n => `${n} (×${r.counts[n]}): ${N.LOSHU_MEAN[n]}`).join('; ') + '.</p>' : '') });
    pts.push({ id: 'year', title: 'Personal year and month', tag: `Year ${r.personalYear}`, html: `<p><b>${r.year} personal year ${r.personalYear}.</b> ${N.PYEAR[r.personalYear]}</p><p><b>This month: personal month ${r.personalMonth}.</b> ${N.PYEAR[r.personalMonth].replace('A year', 'A month').replace('year', 'month')}</p><p><b>Next year (${r.year + 1}): personal year ${r.personalYearNext}.</b> ${N.PYEAR[r.personalYearNext]}</p><p class="hint">Personal year = birth day + birth month + current calendar year, reduced to one digit.</p>` });
    const masters = [r.lifePath, r.expression, r.soul, r.personality, r.birthday, r.maturity].some(n => n === 11 || n === 22 || n === 33);
    pts.push({ id: 'notes', title: 'Master and karmic numbers', tag: masters || r.karmic.length ? 'present' : 'none', html: (masters ? '<p>One or more of your core numbers is a master number (11, 22 or 33). Traditionally these carry a larger potential and more pressure, and many people live them through the reduced number (2, 4 or 6).</p>' : '<p>None of your core numbers is a master number.</p>') + (r.karmic.length ? ul(r.karmic) : '<p>No karmic-debt compound (13, 14, 16, 19) appears in the Life Path or name totals.</p>') + '<p class="hint">Numerology is a symbolic tradition. It has no demonstrated predictive power, so read it as a prompt for reflection.</p>' });
    const head = intro('Numerology report', 'Western (Pythagorean) and Indian (Chaldean) numbers from your birth date and name.') + `<form class="card" id="nForm"><label>Full name for numerology<input id="nName" value="${esc(name)}" maxlength="80" placeholder="e.g. Rahul Kumar Sharma"></label><button class="primary" type="submit">Calculate</button></form>`;
    return { rep: { points: pts }, head };
  }
  const ul = items => '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';

  render();
})();
