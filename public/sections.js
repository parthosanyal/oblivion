/* Reports tab: Kundli analysis, Marriage compatibility, Career & finance, Numerology, Yearly horoscope.
 * Reports are built in the browser by ReportService.
 */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SECTIONS = [['kundli', 'Kundli analysis'], ['marriage', 'Marriage compatibility'], ['career', 'Career & finance'], ['numerology', 'Numerology'], ['yearly', 'Yearly horoscope']];
  const st = { cur: 'kundli', open: {}, partner: { name: '', role: 'groom', date: '', time: '12:00', place: '', lat: '', lon: '', tz: 'Asia/Kolkata' }, partnerReq: null, nameInput: null, year: null, last: null, busy: false };
  let seq = 0, varsha = null;

  const sw = $('repSwitch'); if (!sw) return;
  sw.innerHTML = SECTIONS.map(([k, t]) => `<button type="button" data-sec="${k}" role="tab">${t}</button>`).join('');
  sw.addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (!b) return; st.cur = b.dataset.sec; render(); });
  document.addEventListener('kundli:ready', () => { st.partnerReq = null; st.nameInput = null; st.year = null; st.open = {}; render(); });
  document.querySelectorAll('input[name=style]').forEach(r => r.addEventListener('change', fillVarsha));

  // ---------- data ----------
  const birthOf = () => { const i = window.JK.chart.input; return { name: i.name || '', year: i.year, month: i.month, day: i.day, hour: i.hour, minute: i.minute, lat: i.lat, lon: i.lon, tz: i.tz }; };
  function payload() {
    const p = { type: st.cur, birth: birthOf() };
    if (st.cur === 'yearly' && st.year != null) p.year = st.year;
    if (st.cur === 'numerology' && st.nameInput != null) p.numName = st.nameInput;
    if (st.cur === 'marriage' && st.partnerReq) p.partner = st.partnerReq;
    return p;
  }
  async function fetchReport(p) { return window.ReportService.build(p); }

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
    const a = e.target.closest('[data-all]'); if (a) { $('repBody').querySelectorAll('details.pt').forEach(d => d.open = a.dataset.all === '1'); return; }
    if (e.target.id === 'retryBtn') { render(); }
  });

  // ---------- main render ----------
  const TITLE = { kundli: ['Kundli analysis', 'A reading of your own birth chart in ten points: personality, mind, planets, strengths, yogas, houses, chart balance and the dasha you are in.'], marriage: ['Marriage compatibility', 'First your own marriage indicators, then an Ashtakoota (36-point Guna Milan) match with a partner\'s chart.'], career: ['Career and finance', 'The 10th, 2nd and 11th houses, suitable work areas, wealth combinations and a ten-year momentum view.'], numerology: ['Numerology report', 'Western (Pythagorean) and Indian (Chaldean) numbers from your birth date and name.'], yearly: ['Yearly horoscope', 'A year runs from one birthday to the next. Pick a year to see its dasha, Varsha (solar return) chart, life-area ratings and month-by-month outlook.'] };
  const intro = t => `<div class="card"><h2>${TITLE[t][0]}</h2><p class="hint" style="margin-bottom:0">${TITLE[t][1]} Step through the numbered points. These are rule-based readings for reflection, not a substitute for a consultation.</p></div>`;

  async function render() {
    const J = window.JK, my = ++seq; sw.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.sec === st.cur));
    const body = $('repBody'); if (!J) { body.innerHTML = '<div class="card"><p class="hint">Generate a Kundli first.</p></div>'; return; }
    const type = st.cur;
    // keep any form the user is typing in; only the report area below is replaced
    body.innerHTML = intro(type) + (type === 'marriage' ? partnerForm() : '') + (type === 'numerology' ? numForm() : '') + '<div id="repArea"><div class="card repload" role="status">Preparing your report…</div></div>';
    wireForms();
    let out, cfg;
    try { [out] = await Promise.all([fetchReport(payload())]); } catch (err) { if (my !== seq) return; $('repArea').innerHTML = `<div class="card"><p class="error">Could not build this report: ${esc(err.message)}</p><button type="button" class="ghost" id="retryBtn">Try again</button></div>`; return; }
    if (my !== seq) return;
    st.last = out; const m = out.meta || {};
    let head = '';
    if (type === 'kundli') head = `<div class="card" id="repChartCard"><div id="repChart" class="repchart"></div></div>`;
    if (type === 'yearly') head = yearlyHead(m);
    const wall = '';
    $('repArea').innerHTML = (type === 'marriage' && st.partnerReq && !out.paid ? '' : '') + head + wall + pointsHtml(out.points, type);
    if (type === 'kundli') drawMain(J.chart);
    if (type === 'yearly') { varsha = out.varsha || null; fillVarsha(); }
    wireYearly();
  }

  // ---------- charts ----------
  const chartSvg = (J, lagnaSign, bodies) => { return J.svgByStyle((document.querySelector('input[name=style]:checked') || {}).value || 'north')(lagnaSign, bodies); };
  const labelOf = (J, p) => J.ABBR[p.key] + (p.retro && !['Rahu', 'Ketu'].includes(p.key) ? '℞' : '');
  function drawMain(c) { const J = window.JK, el = $('repChart'); if (el) el.innerHTML = chartSvg(J, c.lagna.sign, c.planets.map(p => ({ sign: p.sign, label: labelOf(J, p) }))); }
  function fillVarsha() { const J = window.JK; if (!J || !varsha) return; document.querySelectorAll('[data-varsha]').forEach(el => { el.innerHTML = '<div class="repchart">' + chartSvg(J, varsha.lagnaSign, varsha.planets.map(p => ({ sign: p.sign, label: labelOf(J, p) }))) + '</div>'; }); }

  // ---------- forms ----------
  function partnerForm() {
    const p = st.partner;
    return `<form class="card" id="pForm" autocomplete="off"><h3 style="margin-top:0">Partner details</h3>
      <div class="row2"><label>Partner name<input id="pName" value="${esc(p.name)}" maxlength="60" placeholder="Optional"></label>
      <label>Your chart is the<select id="pRole"><option value="groom"${p.role === 'groom' ? ' selected' : ''}>Groom (boy)</option><option value="bride"${p.role === 'bride' ? ' selected' : ''}>Bride (girl)</option></select></label></div>
      <div class="row2"><label>Partner date of birth<input id="pDate" type="date" value="${esc(p.date)}" required></label><label>Time of birth<input id="pTime" type="time" value="${esc(p.time)}" required></label></div>
      <div class="combo"><label>Place of birth<input id="pPlace" type="text" aria-controls="pPlaceList" value="${esc(p.place)}" placeholder="Start typing any city, town or village" autocomplete="off"></label><ul id="pPlaceList" role="listbox" hidden></ul></div>
      <p id="pMsg" class="hint" aria-live="polite"></p>
      <div class="row3"><label>Latitude (+N)<input id="pLat" type="number" step="0.0001" min="-90" max="90" value="${esc(p.lat)}" required></label><label>Longitude (+E)<input id="pLon" type="number" step="0.0001" min="-180" max="180" value="${esc(p.lon)}" required></label><label>Time zone<input id="pTz" list="tzs" value="${esc(p.tz)}" required></label></div>
      <p class="hint">Pick a suggestion to fill the coordinates. If your city is not listed, type its latitude, longitude and time zone directly. If the birth time is unknown, 12:00 is used; the Moon sign is usually right but the nakshatra may be off. Details stay in your browser.</p>
      <button class="primary" type="submit">Match charts</button> <p id="pErr" class="error" hidden></p></form>`;
  }
  const numForm = () => `<form class="card" id="nForm"><label>Full name for numerology<input id="nName" value="${esc(st.nameInput != null ? st.nameInput : (window.JK.chart.input.name || ''))}" maxlength="80" placeholder="e.g. Rahul Kumar Sharma"></label><button class="primary" type="submit">Calculate</button></form>`;
  function yearlyHead(m) {
    const by = m.firstYear, last = m.lastYear, cur = m.currentYear, y = m.year; st.year = y; const opts = [];
    for (let k = by; k <= last; k++) opts.push(`<option value="${k}"${k === y ? ' selected' : ''}>${k}–${String(k + 1).slice(2)}${k === cur ? ' (current)' : ''}</option>`);
    return `<div class="card"><div class="row2" style="align-items:end"><label>Year<select id="yYear">${opts.join('')}</select></label><div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="ghost" data-yr="${Math.max(by, y - 1)}">← Previous year</button><button type="button" class="ghost" data-yr="${Math.min(last, y + 1)}">Next year →</button></div></div></div>`;
  }
  function wireYearly() {
    const ys = $('yYear'); if (ys) ys.addEventListener('change', () => { st.year = +ys.value; render(); });
    document.querySelectorAll('[data-yr]').forEach(b => b.addEventListener('click', () => { st.year = +b.dataset.yr; render(); }));
  }
  function wireForms() {
    const f = $('pForm');
    if (f) {
      const pl = $('pPlace');
      if (window.PlacePicker) window.PlacePicker.attach({ input: pl, list: $('pPlaceList'), msg: $('pMsg'), onPick: m => { $('pLat').value = m.lat; $('pLon').value = m.lon; $('pTz').value = m.tz; } });
      f.addEventListener('submit', e => {
        e.preventDefault(); const err = $('pErr'); err.hidden = true;
        const p = st.partner; p.name = $('pName').value.trim(); p.role = $('pRole').value; p.date = $('pDate').value; p.time = $('pTime').value || '12:00'; p.place = pl.value; p.lat = $('pLat').value; p.lon = $('pLon').value; p.tz = $('pTz').value.trim();
        try {
          const [y, mo, d] = p.date.split('-').map(Number), [h, mi] = p.time.split(':').map(Number);
          if (!y || !d) throw new Error('Enter the partner\'s date of birth.');
          if (p.lat === '' || p.lon === '') throw new Error('Choose the place of birth from the suggestions, or type its latitude and longitude.');
          try { new Intl.DateTimeFormat('en', { timeZone: p.tz }); } catch (x) { throw new Error('Unknown time zone. Use a name like Asia/Kolkata.'); }
          st.partnerReq = { name: p.name, role: p.role, year: y, month: mo, day: d, hour: h, minute: mi, lat: +p.lat, lon: +p.lon, tz: p.tz };
          st.open.marriage = 3; render();
        } catch (ex) { err.textContent = ex.message || 'Check the partner details.'; err.hidden = false; }
      });
    }
    const nf = $('nForm');
    if (nf) nf.addEventListener('submit', e => { e.preventDefault(); st.nameInput = $('nName').value; st.open.numerology = 0; render(); });
  }

  render();
})();
