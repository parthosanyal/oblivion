(function () {
  const E = window.VedicEngine, $ = id => document.getElementById(id);
  const ABBR = { Sun:'Su', Moon:'Mo', Mars:'Ma', Mercury:'Me', Jupiter:'Ju', Venus:'Ve', Saturn:'Sa', Rahu:'Ra', Ketu:'Ke' };
  const fmtDeg = d => { const dd = Math.floor(d), m = Math.floor((d - dd) * 60), s = Math.round(((d - dd) * 60 - m) * 60); return `${dd}°${String(m).padStart(2,'0')}′${String(s%60).padStart(2,'0')}″`; };
  const fmtDate = ms => new Date(ms).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'2-digit' });
  const esc = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  let chart = null;

  // ----- setup -----
  const tzs = (Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['Asia/Kolkata', 'UTC']);
  { const dl = document.createElement('datalist'); dl.id = 'tzs'; tzs.forEach(z => { const o = document.createElement('option'); o.value = z; dl.appendChild(o); }); document.body.appendChild(dl); $('tz').setAttribute('list', 'tzs'); }
  // --- place search: instant built-in matches, then live worldwide results
  let placeItems = [], placeSel = -1, placeTimer = null, placeAbort = null;
  function showPlaces() {
    const ul = $('placeList'); ul.innerHTML = '';
    placeItems.forEach((c, i) => { const li = document.createElement('li'); li.role = 'option'; li.setAttribute('aria-selected', i === placeSel ? 'true' : 'false'); li.innerHTML = `<span>${esc(c.label)}</span><small>${c.lat.toFixed(2)}, ${c.lon.toFixed(2)}</small>`; li.addEventListener('mousedown', e => { e.preventDefault(); pickPlace(c); }); ul.appendChild(li); });
    ul.hidden = !placeItems.length; $('place').setAttribute('aria-expanded', String(!ul.hidden));
  }
  function pickPlace(c) {
    $('place').value = c.label; $('lat').value = c.lat; $('lon').value = c.lon; $('tz').value = c.tz;
    placeItems = []; showPlaces(); $('placeMsg').textContent = `Using ${c.label}: latitude ${c.lat}, longitude ${c.lon}, time zone ${c.tz}.`;
  }
  $('place').addEventListener('input', () => {
    const q = $('place').value; clearTimeout(placeTimer); if (placeAbort) placeAbort.abort();
    const off = window.Geo.searchOffline(q, 8); placeItems = off; placeSel = -1; showPlaces();
    if (window.Geo.norm(q).length < 2) { $('placeMsg').textContent = ''; return; }
    $('placeMsg').textContent = 'Searching worldwide…';
    placeTimer = setTimeout(async () => {
      placeAbort = new AbortController();
      try { const on = await window.Geo.searchOnline(q, placeAbort.signal); if ($('place').value !== q) return; placeItems = window.Geo.merge(on, off); placeSel = -1; showPlaces(); $('placeMsg').textContent = on.length ? `${on.length} worldwide match${on.length > 1 ? 'es' : ''}. Choose one, or fill the coordinates yourself.` : (off.length ? 'No worldwide match; showing the built-in list.' : 'No match found. Enter latitude, longitude and time zone yourself.'); }
      catch (e) { if (e.name === 'AbortError') return; $('placeMsg').textContent = off.length ? 'Live worldwide search is unavailable here; showing the built-in list.' : 'Live search is unavailable. Enter latitude, longitude and time zone yourself.'; }
    }, 350);
  });
  $('place').addEventListener('keydown', e => {
    if (!placeItems.length) return;
    if (e.key === 'ArrowDown') { placeSel = (placeSel + 1) % placeItems.length; showPlaces(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { placeSel = (placeSel - 1 + placeItems.length) % placeItems.length; showPlaces(); e.preventDefault(); }
    else if (e.key === 'Enter' && placeSel >= 0) { pickPlace(placeItems[placeSel]); e.preventDefault(); }
    else if (e.key === 'Escape') { placeItems = []; showPlaces(); }
  });
  $('place').addEventListener('blur', () => setTimeout(() => { placeItems = []; showPlaces(); }, 120));
  try { const s = JSON.parse(localStorage.getItem('jyotish-last') || 'null'); if (s) Object.keys(s).forEach(k => $(k) && ($(k).value = s[k])); } catch (e) {}

  $('form').addEventListener('submit', ev => {
    ev.preventDefault(); $('error').hidden = true;
    try {
      const [y, mo, d] = $('date').value.split('-').map(Number), [h, mi] = $('time').value.split(':').map(Number);
      const tz = $('tz').value.trim();
      try { new Intl.DateTimeFormat('en', { timeZone: tz }); } catch (e) { throw new Error(`Unknown time zone “${tz}”. Use an IANA name like Asia/Kolkata.`); }
      if (!y || !h && h !== 0) throw new Error('Please enter a valid date and time.');
      if (y < 1800 || y > 2050) throw new Error('Planet positions are only reliable for years 1800–2050.');
      chart = E.computeChart({ name: $('name').value, year: y, month: mo, day: d, hour: h, minute: mi, lat: +$('lat').value, lon: +$('lon').value, tz });
      try { localStorage.setItem('jyotish-last', JSON.stringify(Object.fromEntries(['name','date','time','place','lat','lon','tz'].map(k => [k, $(k).value])))); } catch (e) {}
      render();
      $('result').hidden = false; $('result').scrollIntoView({ behavior: 'smooth' });
    } catch (e) { $('error').textContent = e.message; $('error').hidden = false; }
  });
  $('tabs').addEventListener('click', e => {
    const t = e.target.dataset.tab; if (!t) return;
    [...$('tabs').children].forEach(b => b.classList.toggle('on', b === e.target));
    document.querySelectorAll('.tab').forEach(x => x.hidden = x.id !== 'tab-' + t);
  });
  document.querySelectorAll('input[name=style]').forEach(r => r.addEventListener('change', drawCharts));
  if ($('print')) $('print').addEventListener('click', () => window.print());

  function fillVargaSelects() {
    [['vSel1', 1], ['vSel2', 9]].forEach(([id, def]) => {
      const s = $(id); if (s.options.length) return;
      for (let n = 1; n <= 60; n++) { const o = document.createElement('option'); o.value = n; const nm = E.VARGA_NAMES[n]; o.textContent = `D${n}${nm ? ' · ' + nm : ''}${E.CLASSICAL_VARGAS.includes(n) ? '' : ' (non-classical)'}`; s.appendChild(o); }
      s.value = def; s.addEventListener('change', drawCharts);
    });
  }
  fillVargaSelects();
  // ----- charts -----
  const NORTH = [ // polygon points + label anchor for houses 1..12 on a 400x400 canvas
    { p:'200,0 100,100 200,200 300,100', t:[200,105], s:[200,150] },
    { p:'0,0 200,0 100,100', t:[100,38], s:[100,70] },
    { p:'0,0 100,100 0,200', t:[34,100], s:[82,100] },
    { p:'0,200 100,100 200,200 100,300', t:[100,205], s:[100,245] },
    { p:'0,200 100,300 0,400', t:[34,300], s:[82,300] },
    { p:'0,400 100,300 200,400', t:[100,362], s:[100,330] },
    { p:'200,200 100,300 200,400 300,300', t:[200,305], s:[200,345] },
    { p:'200,400 300,300 400,400', t:[300,362], s:[300,330] },
    { p:'400,400 300,300 400,200', t:[366,300], s:[318,300] },
    { p:'400,200 300,100 200,200 300,300', t:[300,205], s:[300,245] },
    { p:'400,0 300,100 400,200', t:[366,100], s:[318,100] },
    { p:'200,0 400,0 300,100', t:[300,38], s:[300,70] }
  ];
  function planetLabels(list, useNav) {
    return list.map(p => `${ABBR[p.key]}${p.retro && p.key !== 'Rahu' && p.key !== 'Ketu' ? '℞' : ''}`);
  }
  function northSvg(lagnaSign, bodies) { // bodies: [{sign, label}]
    let s = `<svg class="chart" viewBox="-4 -4 408 408" role="img" aria-label="North Indian chart"><rect x="0" y="0" width="400" height="400" fill="var(--chart)" stroke="var(--gold)" stroke-width="2"/>`;
    NORTH.forEach((h, i) => {
      const sign = (lagnaSign + i) % 12;
      const here = bodies.filter(b => b.sign === sign).map(b => b.label);
      s += `<polygon points="${h.p}" fill="${i === 0 ? 'color-mix(in srgb,var(--gold) 14%,transparent)' : 'none'}" stroke="var(--gold)" stroke-width="1.5"/>`;
      s += `<text x="${h.s[0]}" y="${h.s[1]}" text-anchor="middle" font-size="13" fill="var(--mute)">${sign + 1}</text>`;
      const lng = bodies.some(b => b.label.length > 4), per = [0,3,6,9].includes(i) ? (lng ? 2 : 3) : 2, fs = lng ? (here.length > 4 ? 10 : 11.5) : (here.length > 4 ? 12 : 14), lh = fs + 3;
      const rows = []; for (let k = 0; k < here.length; k += per) rows.push(here.slice(k, k + per).join(' '));
      rows.forEach((r, k) => s += `<text x="${h.t[0]}" y="${h.t[1] + (k - (rows.length - 1) / 2) * lh + 5}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="var(--accent2)">${esc(r)}</text>`);
    });
    return s + '</svg>';
  }
  const SOUTH_POS = { 11:[0,0], 0:[1,0], 1:[2,0], 2:[3,0], 10:[0,1], 3:[3,1], 9:[0,2], 4:[3,2], 8:[0,3], 7:[1,3], 6:[2,3], 5:[3,3] };
  function southSvg(lagnaSign, bodies) {
    let s = `<svg class="chart" viewBox="-4 -4 408 408" role="img" aria-label="South Indian chart"><rect x="0" y="0" width="400" height="400" fill="var(--chart)" stroke="var(--gold)" stroke-width="2"/>`;
    for (let sign = 0; sign < 12; sign++) {
      const [cx, cy] = SOUTH_POS[sign], x = cx * 100, y = cy * 100;
      s += `<rect x="${x}" y="${y}" width="100" height="100" fill="${sign === lagnaSign ? 'color-mix(in srgb,var(--gold) 14%,transparent)' : 'none'}" stroke="var(--gold)" stroke-width="1.5"/>`;
      if (sign === lagnaSign) s += `<line x1="${x}" y1="${y}" x2="${x + 18}" y2="${y}" stroke="var(--accent)" stroke-width="3"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 18}" stroke="var(--accent)" stroke-width="3"/>`;
      s += `<text x="${x + 50}" y="${y + 14}" text-anchor="middle" font-size="11" fill="var(--mute)">${E.SIGNS[sign].slice(0, 3)}${sign === lagnaSign ? ' · Asc' : ''}</text>`;
      const here = bodies.filter(b => b.sign === sign).map(b => b.label);
      const lng = bodies.some(b => b.label.length > 4), fz = lng ? 12 : 15;
      const rows = []; for (let k = 0; k < here.length; k += 2) rows.push(here.slice(k, k + 2).join(' '));
      rows.forEach((r, k) => s += `<text x="${x + 50}" y="${y + 52 + (k - (rows.length - 1) / 2) * (fz + 3)}" text-anchor="middle" font-size="${fz}" font-weight="600" fill="var(--accent2)">${esc(r)}</text>`);
    }
    return s + '</svg>';
  }
  function vargaInfo(n) {
    const nm = E.VARGA_NAMES[n];
    return { title: `D${n}${nm ? ' · ' + nm : ''}`, note: E.VARGA_USE[n] ? E.VARGA_USE[n] : 'Non-classical (equal division)' };
  }
  function svgFor(n, f) {
    return f(E.vargaSign(chart.lagna.lon, n), chart.planets.map(p => ({ sign: E.vargaSign(p.lon, n), label: ABBR[p.key] + (n === 1 && p.retro && !['Rahu','Ketu'].includes(p.key) ? '℞' : '') })));
  }
  function drawGallery() {
    const f = document.querySelector('input[name=style]:checked').value === 'north' ? northSvg : southSvg;
    let html = '';
    for (let n = 1; n <= 60; n++) { const v = vargaInfo(n); html += `<figure class="gcard" data-n="${n}" tabindex="0"><b>${v.title}</b><small>${v.note}</small>${svgFor(n, f)}</figure>`; }
    $('vargas').innerHTML = html;
  }
  function zoom(n) {
    const f = document.querySelector('input[name=style]:checked').value === 'north' ? northSvg : southSvg, v = vargaInfo(n);
    $('zoomTitle').textContent = v.title; $('zoomBody').innerHTML = svgFor(n, f);
    $('zoomNote').textContent = (E.VARGA_USE[n] ? `Signifies: ${E.VARGA_USE[n]}.` : 'Non-classical division: equal parts counted from the sign itself; conventions vary.');
    $('zoom').showModal();
  }
  $('vargas').addEventListener('click', e => { const g = e.target.closest('.gcard'); if (g) zoom(+g.dataset.n); });
  $('vargas').addEventListener('keydown', e => { const g = e.target.closest('.gcard'); if (g && e.key === 'Enter') zoom(+g.dataset.n); });
  $('zoomClose').addEventListener('click', () => $('zoom').close());
  function drawCharts() {
    if (!chart) return;
    drawGallery();
    if (typeof drawAV === 'function' && AV) { drawAV(); renderGochar(curGDate()); }
    const style = document.querySelector('input[name=style]:checked').value, f = style === 'north' ? northSvg : southSvg;
    [['vSel1','d1','vNote1'],['vSel2','d9','vNote2']].forEach(([sel, box, note]) => {
      const n = +$(sel).value;
      const bodies = chart.planets.map(p => ({ sign: E.vargaSign(p.lon, n), label: ABBR[p.key] + (n === 1 && p.retro && !['Rahu','Ketu'].includes(p.key) ? '℞' : '') }));
      $(box).innerHTML = f(E.vargaSign(chart.lagna.lon, n), bodies);
      $(note).textContent = (E.VARGA_USE[n] ? `Signifies: ${E.VARGA_USE[n]}. ` : 'Non-classical division (equal parts counted from the sign itself); conventions vary. ') + (n === 11 ? 'Rudramsa conventions vary between schools. ' : '');
    });
  }

  // ----- life predictions -----
  const P = window.Predict, AB = ABBR;
  const toneName = t => ({ good: 'Favourable', mid: 'Mixed', bad: 'Challenging' }[t]);
  const pill = (sc, label) => `<span class="tag ${P.tone(sc)}">${label || P.outlook(sc)} · ${sc}</span>`;
  const ageStr = (ms, birth) => ((ms - birth) / 31557600000);
  let pred = null;

  function lifeChart(R, birth) {
    const W = 900, L = 34, Rr = 8, pw = W - L - Rr, N = R.years.length, bw = pw / N, top = 16, ph = 150, base = top + ph;
    const x = age => L + age * bw;
    let s = `<svg class="pchart" viewBox="0 0 ${W} 330" role="img" aria-label="Life outlook by age">`;
    [0, 25, 50, 75, 100].forEach(v => { const y = base - ph * v / 100; s += `<line x1="${L}" x2="${W - Rr}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${L - 5}" y="${y + 4}" text-anchor="end">${v}</text>`; });
    R.years.forEach(y => { const h = ph * y.score / 100; s += `<rect class="b${y.tone[0]}" x="${x(y.age) + 0.8}" y="${base - h}" width="${Math.max(1, bw - 1.6)}" height="${h}" rx="1.5"><title>Age ${y.age} (${y.year}): ${y.outlook}, ${y.score}\n${y.vMD}–${y.vAD} · Yogini ${y.yMD}\nJupiter in ${y.jH}th, Saturn in ${y.sH}th from Moon${y.sade ? '\nSade Sati' : ''}</title></rect>`; });
    const strip = (list, yy, label) => {
      s += `<text x="${L}" y="${yy - 4}">${label}</text>`;
      list.forEach(m => {
        const a = Math.max(0, ageStr(m.start, birth)), b = Math.min(N, ageStr(m.end, birth)); if (b <= a) return;
        const w = (b - a) * bw, t = m.tone ? m.tone[0] : 'm';
        s += `<rect class="s${t}" x="${x(a)}" y="${yy}" width="${w}" height="26" stroke="var(--card)" stroke-width="1.5"><title>${m.lord} ${m.name ? '(' + m.name + ') ' : ''}· age ${a.toFixed(1)}–${b.toFixed(1)} · ${m.outlook} ${m.avg}</title></rect>`;
        if (w > 20) s += `<text class="seglab" x="${x(a) + w / 2}" y="${yy + 17}" text-anchor="middle">${AB[m.lord]}</text>`;
      });
    };
    strip(R.vimsh, 190, 'Vimshottari Mahadasha'); strip(R.yogini, 238, 'Yogini Mahadasha');
    s += `<text x="${L}" y="286">Sade Sati (Saturn over, before and after your Moon sign)</text>`;
    R.sade.forEach(b => s += `<rect x="${x(b.from)}" y="291" width="${Math.max(2, (b.to - b.from) * bw)}" height="10" fill="var(--bad)" opacity=".55" rx="2"><title>Sade Sati · age ${b.from.toFixed(1)}–${b.to.toFixed(1)}</title></rect>`);
    for (let a = 0; a <= N; a += 10) s += `<text x="${x(a)}" y="322" text-anchor="middle">${a}</text>`;
    if (R.nowAge >= 0 && R.nowAge <= N) s += `<line class="now" x1="${x(R.nowAge)}" x2="${x(R.nowAge)}" y1="${top - 8}" y2="304"/><text class="nowlab" x="${Math.min(x(R.nowAge), W - 40)}" y="${top - 3}" text-anchor="middle">Now · ${R.nowAge.toFixed(1)}</text>`;
    return s + '</svg>';
  }

  function renderPredict() {
    const c = chart; pred = P.compute(c, Date.now()); const R = pred, n = R.now, S = R.strengths;
    const themes = [`${P.HOUSE_THEME[S[n.vAD].house]} <small>(${n.vAD} sub-period, placed in the ${P.ord(S[n.vAD].house)} house)</small>`, `${P.HOUSE_THEME[n.jL]} <small>(Jupiter transiting your ${P.ord(n.jL)} house)</small>`, `${P.HOUSE_THEME[S[n.yAD].house]} <small>(Yogini ${n.yAD} sub-period)</small>`];
    $('pNow').innerHTML = `<h2>Where you are now</h2><div class="pnow">
      <div class="kv"><small>Outlook index</small><div class="score ${P.tone(n.score)}">${n.score}</div><b>${P.outlook(n.score)}</b></div>
      <div class="kv"><small>Vimshottari</small><b>${n.vMD} – ${n.vAD}</b><div class="meta">Natal strength: ${S[n.vMD].label} / ${S[n.vAD].label}</div></div>
      <div class="kv"><small>Yogini</small><b>${n.yMDName} (${n.yMD}) – ${n.yAD}</b><div class="meta">Natal strength: ${S[n.yMD].label} / ${S[n.yAD].label}</div></div>
      <div class="kv"><small>Transits from your Moon</small><b>Jupiter ${P.ord(n.jH)} · Saturn ${P.ord(n.sH)}</b><div class="meta">${n.sade ? 'Sade Sati is running.' : 'Sade Sati is not running.'}</div></div>
    </div>
    <p class="meta" style="margin:12px 0 0">Themes in focus now:</p><ul class="themes">${themes.map(t => `<li>${t}</li>`).join('')}</ul>
    <p class="meta" style="margin:12px 0 0">Next 12 months</p>
    <div class="mini">${R.next12.map(m => `<span class="${P.tone(m.score)}" style="height:${m.score}%" title="${new Date(m.t).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}: ${m.score}"></span>`).join('')}</div>
    <div class="minilab">${R.next12.map(m => `<span>${new Date(m.t).toLocaleDateString(undefined, { month: 'short' }).slice(0, 3)}</span>`).join('')}</div>`;

    $('pChart').innerHTML = `<h2>Lifetime outlook</h2><p class="hint">Each bar is one year of life (average of its months). Taller and greener means the running Dasha periods and the Jupiter and Saturn transits support each other. Coloured bands below show your Mahadasha periods in both systems.</p>${lifeChart(R, c.utcMs)}
      <div class="legend"><span><i style="background:var(--ok)"></i>Favourable (62+)</span><span><i style="background:var(--gold)"></i>Mixed (46–61)</span><span><i style="background:var(--bad)"></i>Challenging (&lt;46)</span></div>
      <div class="grid2" style="margin-top:14px"><div><b>Strongest upcoming years</b><ul class="themes">${R.best.map(y => `<li>${y.year} (age ${y.age}) · ${y.score} · ${y.vMD}–${y.vAD}</li>`).join('')}</ul></div>
      <div><b>Most demanding upcoming years</b><ul class="themes">${R.hard.map(y => `<li>${y.year} (age ${y.age}) · ${y.score} · ${y.vMD}–${y.vAD}</li>`).join('')}</ul></div></div>`;

    $('pWhy').innerHTML = `<h2>How the outlook is worked out</h2>
      <p class="ptext">For each month of life the app takes the running Vimshottari Mahadasha and Antardasha lords and the running Yogini Mahadasha and Antardasha lords, scores each planet by its dignity, the house it sits in and the houses it rules, then adds the effect of Jupiter and Saturn in the sign they occupy that month, counted from your natal Moon. The result is an index from 5 to 95. It is a transparent rule-of-thumb model, not a verdict, and it ignores many classical factors such as aspects, divisional charts, Ashtakavarga and the strength of the houses involved. Transit positions beyond 2050 are approximate.</p>
      <details class="dasha-row"><summary><b>Natal planet strengths used</b></summary><div class="antars">${Object.values(S).map(x => `<div class="row"><span><b>${x.key}</b> · ${x.sign}, ${P.ord(x.house)} house${x.owned.length ? ', rules ' + x.owned.map(P.ord).join(' & ') : ''}</span><span>${x.label} (${x.score > 0 ? '+' : ''}${x.score})</span><small>${x.notes.join('; ') || 'no special factors'}</small></div>`).join('')}</div></details>`;
    drawPredictList();
  }

  function drawPredictList() {
    if (!pred) return; const R = pred, view = document.querySelector('input[name=pview]:checked').value, now = Date.now(), birth = chart.utcMs, S = R.strengths;
    const age = (ms, lo) => Math.max(0, (ms - birth) / 31557600000).toFixed(1);
    if (view === 'yr') {
      $('pList').innerHTML = `<h2>Year by year</h2><div class="scroll"><table><thead><tr><th>Age</th><th>Year</th><th>Outlook</th><th>Vimshottari</th><th>Yogini</th><th>Jupiter / Saturn from Moon</th><th>Themes in focus</th></tr></thead><tbody>` +
        R.years.map(y => `<tr${Math.floor(R.nowAge) === y.age ? ' style="background:color-mix(in srgb,var(--accent2) 12%,transparent)"' : ''}><td>${y.age}</td><td>${y.year}</td><td>${pill(y.score)}</td><td>${y.vMD}–${y.vAD}</td><td>${y.yMD}</td><td>${P.ord(y.jH)} / ${P.ord(y.sH)}${y.sade ? ' <span class="tag bad">Sade Sati</span>' : ''}</td><td style="white-space:normal;min-width:260px">${y.themes[0]}<br><small class="meta">${y.themes[1]}</small></td></tr>`).join('') + `</tbody></table></div>`;
      return;
    }
    const list = view === 'v' ? R.vimsh : R.yogini, title = view === 'v' ? 'Vimshottari Dasha: life periods' : `Yogini Dasha: life periods (36-year cycle, starting ${list[0].name}, balance ${R.yoginiBalance.toFixed(2)} y)`;
    $('pList').innerHTML = `<h2>${title}</h2>` + list.filter(m => ageStr(m.start, birth) < R.lifeYears).map(m => {
      const cur = m.start <= now && now < m.end;
      return `<details class="dasha-row ${cur ? 'now' : ''}" ${cur ? 'open' : ''}><summary><span>${m.lord} ${view === 'y' ? '– ' + m.name + ' ' : ''}Mahadasha ${cur ? '<span class="tag good">running now</span>' : ''} ${m.avg != null ? pill(m.avg) : ''}</span><span class="d">age ${age(m.start)}–${age(m.end)} · ${fmtDate(Math.max(m.start, birth))} → ${fmtDate(m.end)}</span></summary>
        <p class="ptext">${m.text}</p>
        ${m.best ? `<p class="meta">Strongest stretch around ${m.best}; most demanding around ${m.worst}.</p>` : ''}
        <p class="meta">${(m.end - m.start) < 4.2 * 31557600000 ? (m.transit || '') : ''}</p>
        <div class="antars">${m.antars.map(a => `<div class="row ${a.start <= now && now < a.end ? 'now' : ''}"><span>${m.lord} – ${a.lord}${view === 'y' ? ' (' + a.name + ')' : ''}</span><span>${a.avg != null ? pill(a.avg) : ''} ${fmtDate(Math.max(a.start, birth))} → ${fmtDate(a.end)}</span><small>${a.lord} in your ${P.ord(a.house)} house: ${a.focus}.${a.transit ? ' ' + a.transit : ''}</small></div>`).join('')}</div></details>`;
    }).join('');
  }
  document.querySelectorAll('input[name=pview]').forEach(r => r.addEventListener('change', drawPredictList));

  // ----- Shadbala, Ashtakavarga, transit charts -----
  const BL = window.Bala;
  const COMP = [['sthana','Sthana','--c1'],['dig','Dig','--c2'],['kala','Kala','--c3'],['cheshta','Cheshta','--c4'],['naisargika','Naisargika','--c5'],['drik','Drik','--c6']];
  const r2 = x => (Math.round(x * 100) / 100).toFixed(2);
  let SB = null, AV = null, avPick = 'SAV';
  const toneOf = (v, good, ok) => v >= good ? 'fgood' : v >= ok ? 'fmid' : 'fbad';

  function renderBala() {
    SB = BL.shadbala(chart); AV = BL.ashtakavarga(chart);
    const rows = SB.order.map(k => SB.planets[k]);
    const scale = Math.max(...rows.map(r => Math.max(r.rupas, r.required))) * 1.1;
    const key = `<div class="key">${COMP.map(c => `<span><i style="background:var(${c[2]})"></i>${c[1]}</span>`).join('')}<span><i style="border-left:2px dashed var(--ink);width:0;border-radius:0"></i>Minimum required</span></div>`;
    $('sbBars').innerHTML = `<h2>Shadbala: six-fold strength (rupas)</h2><p class="hint">Each bar adds the six strengths of a planet. The dashed line is the minimum the classics ask for. Reaching it means 100%.</p>${key}` + rows.map(r => {
      let x = 0, segs = '';
      COMP.forEach(c => { const v = c[0] === 'drik' ? Math.max(0, r.drik) : r[c[0]]; const w = v / 60 / scale * 100; segs += `<i style="left:${x}%;width:${w}%;background:var(${c[2]})" title="${c[1]}: ${r2(r[c[0]] / 60)} rupas"></i>`; x += w; });
      if (r.drik < 0) { const w = -r.drik / 60 / scale * 100; segs += `<i class="neg" style="left:${x - w}%;width:${w}%" title="Drik (negative): ${r2(r.drik / 60)} rupas"></i>`; }
      return `<div class="hb"><span class="nm">${r.key}</span><div class="tr">${segs}<span class="mk" style="left:${r.required / scale * 100}%"></span></div><span class="val">${r2(r.rupas)}</span><span class="sub">needs ${r.required} · ${r.percent}% · ${r.label}</span></div>`;
    }).join('');

    $('sbPct').innerHTML = `<h2>Strength as a percentage of the requirement</h2><p class="hint">100% is the classical minimum. Above 150% is very strong, below 75% is weak.</p>` + rows.map(r => {
      const sc = Math.max(200, ...rows.map(x => x.percent)) * 1.05;
      return `<div class="hb"><span class="nm">${r.key}</span><div class="tr"><i class="fill ${toneOf(r.percent, 100, 75)}" style="left:0;width:${r.percent / sc * 100}%"></i><span class="mk" style="left:${100 / sc * 100}%"></span></div><span class="val">${r.percent}%</span><span class="sub">Rank ${r.rank} of 7 · Ishta ${r.ishta.toFixed(0)} / Kashta ${r.kashta.toFixed(0)} (benefic vs malefic result, out of 60)</span></div>`;
    }).join('');

    const m = SB.meta, f = x => x.toFixed(1);
    $('sbTable').innerHTML = `<table><thead><tr><th>Planet</th><th>Uchcha</th><th>Saptavargaja</th><th>Ojhayugma</th><th>Kendradi</th><th>Drekkana</th><th>Sthana</th><th>Dig</th><th>Kala</th><th>Cheshta</th><th>Naisargika</th><th>Drik</th><th>Total (virupa)</th><th>Rupas</th><th>%</th></tr></thead><tbody>` +
      rows.map(r => `<tr><td><b>${r.key}</b></td><td>${f(r.uchcha)}</td><td>${f(r.sapta)}</td><td>${f(r.ojha)}</td><td>${f(r.kendra)}</td><td>${f(r.drekkana)}</td><td><b>${f(r.sthana)}</b></td><td>${f(r.dig)}</td><td>${f(r.kala)}</td><td>${f(r.cheshta)}</td><td>${f(r.naisargika)}</td><td>${f(r.drik)}</td><td><b>${f(r.total)}</b></td><td>${r2(r.rupas)}</td><td><b>${r.percent}%</b></td></tr>`).join('') + `</tbody></table>
      <p class="hint"><b>Kala bala detail:</b> ${rows.map(r => `${r.key}: Nathonnata ${f(r.nathonnata)}, Paksha ${f(r.paksha)}, Tribhaga ${f(r.tribhaga)}, Abda ${f(r.abda)}, Masa ${f(r.masa)}, Vara ${f(r.vara)}, Hora ${f(r.hora)}, Ayana ${f(r.ayana)}`).join(' · ')}</p>
      <p class="hint">Birth was in the ${m.isDay ? 'day' : 'night'}. Vara lord ${m.varaLord}, Hora lord ${m.horaLord}, Masa lord ${m.masaLord}, Varsha lord ${m.abdaLord}, Tribhaga lord ${m.tribhagaLord}. 1 rupa = 60 virupa.</p>
      <ul class="hint">${SB.notes.map(n => `<li>${n}</li>`).join('')}</ul>`;

    // Ashtakavarga selector
    $('avSel').innerHTML = `<span>Show:</span>` + ['SAV', ...BL.SEVEN].map(k => `<label class="seg avbtn"><input type="radio" name="avp" value="${k}" ${k === avPick ? 'checked' : ''}><span>${k === 'SAV' ? 'Sarvashtakavarga' : k}</span></label>`).join('');
    document.querySelectorAll('input[name=avp]').forEach(r => r.addEventListener('change', () => { avPick = r.value; drawAV(); }));
    const heat = v => `background:color-mix(in srgb,var(--ok) ${Math.round(v / 8 * 55)}%,transparent)`;
    $('avTable').innerHTML = `<h2>Bhinnashtakavarga by sign</h2><table class="heat"><thead><tr><th class="h">Sign (house)</th>${BL.SEVEN.map(k => `<th>${k}</th>`).join('')}<th>SAV</th><th>SAV %</th></tr></thead><tbody>` +
      AV.byHouse.map(h => `<tr><td class="h"><b>${E.SIGNS[h.sign]}</b> (${h.house})</td>${BL.SEVEN.map(k => `<td style="${heat(h.bav[k])}">${h.bav[k]}</td>`).join('')}<td><b>${h.sav}</b></td><td>${Math.round(h.sav / 56 * 100)}%</td></tr>`).join('') +
      `<tr><td class="h"><b>Total</b></td>${BL.SEVEN.map(k => `<td><b>${AV.bav[k].total}</b></td>`).join('')}<td><b>${AV.savTotal}</b></td><td></td></tr></tbody></table><p class="hint">Percent = bindus ÷ 56, the most any sign can hold in the Sarvashtakavarga (8 per planet column). Signs at or above 28 are considered supportive. Tables follow Brihat Parashara Hora Shastra.</p>`;
    drawAV();
  }

  function drawAV() {
    if (!AV) return;
    const style = document.querySelector('input[name=style]:checked').value, f = style === 'north' ? northSvg : southSvg;
    const sav = avPick === 'SAV', arr = sav ? AV.sav : AV.bav[avPick].signs, max = sav ? 56 : 8, avg = sav ? 28 : null;
    $('avTitle').textContent = sav ? `Sarvashtakavarga (total ${AV.savTotal})` : `${avPick} Bhinnashtakavarga (total ${AV.bav[avPick].total})`;
    $('avChart').innerHTML = f(chart.lagna.sign, arr.map((v, s) => ({ sign: s, label: String(v) })));
    $('avBars').innerHTML = `<h2>${sav ? 'Sarvashtakavarga' : avPick} by house</h2><p class="hint">Bars show bindus as a percentage of the maximum (${max}).${sav ? ' Dashed line = 28, the average.' : ' Dashed line = 4, the usual favourable level.'}</p>` +
      AV.byHouse.map(h => { const v = arr[h.sign], pc = Math.round(v / max * 100), line = (sav ? 28 : 4) / max * 100, tone = sav ? toneOf(v, 28, 25) : toneOf(v, 5, 4);
        return `<div class="hb"><span class="nm">${h.house}H ${E.SIGNS[h.sign].slice(0, 3)}</span><div class="tr"><i class="fill ${tone}" style="left:0;width:${pc}%"></i><span class="mk" style="left:${line}%"></span></div><span class="val">${v} · ${pc}%</span></div>`; }).join('');
  }

  function renderGochar(ms) {
    const g = E.computeGochar(chart, ms), style = document.querySelector('input[name=style]:checked').value, f = style === 'north' ? northSvg : southSvg, showDeg = $('gDeg').checked;
    $('gSade').innerHTML = `<b>Saturn status on ${new Date(ms).toLocaleDateString()}:</b> ${g.sadeSati}`;
    const rx = p => p.retro && !['Rahu','Ketu'].includes(p.key) ? '℞' : '';
    $('gChart').innerHTML = f(chart.lagna.sign, g.planets.map(p => ({ sign: p.sign, label: ABBR[p.key] + rx(p) + (showDeg ? ' ' + Math.floor(p.deg) + '°' : '') })));
    const nav = p => { const w = 30 / 9; return { sign: E.vargaSign(p.lon, 9), deg: ((p.deg % w) / w) * 30 }; };
    $('gChart9').innerHTML = f(E.vargaSign(chart.lagna.lon, 9), g.planets.map(p => { const n = nav(p); return { sign: n.sign, label: ABBR[p.key] + rx(p) + (showDeg ? ' ' + Math.floor(n.deg) + '°' : '') }; }));
    const rows = g.planets.filter(p => BL.SEVEN.includes(p.key));
    $('gBars').innerHTML = `<h2>Transit strength (Ashtakavarga)</h2><p class="hint">For each planet, the bindus it holds in its own Bhinnashtakavarga for the sign it is transiting, as a percentage of 8. Five or more is favourable, four is neutral, three or fewer is testing.</p>` + rows.map(p => {
      const v = AV.bav[p.key].signs[p.sign], pc = Math.round(v / 8 * 100), sv = AV.sav[p.sign];
      return `<div class="hb"><span class="nm">${p.key}</span><div class="tr"><i class="fill ${toneOf(v, 5, 4)}" style="left:0;width:${pc}%"></i><span class="mk" style="left:50%"></span></div><span class="val">${v}/8 · ${pc}%</span><span class="sub">${fmtDeg(p.deg)} ${p.signName} (your ${P.ord(p.fromLagna)} house, ${P.ord(p.fromMoon)} from Moon) · sign total ${sv}/56 = ${Math.round(sv / 56 * 100)}%${p.retro && !['Rahu','Ketu'].includes(p.key) ? ' · retrograde' : ''}</span></div>`;
    }).join('');
    $('gRead').innerHTML = `<h2>What each transit is touching</h2><p class="hint">Read by the house the planet occupies from your Lagna and from your Moon, plus its Ashtakavarga support.</p>` + RD.transits(chart, g).map(t => `<div class="rcard"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><b>${esc(t.headline)}</b><span class="tag ${t.tone === 'good' ? 'good' : t.tone === 'bad' ? 'bad' : 'mid'}">${t.tone === 'good' ? 'Supportive' : t.tone === 'bad' ? 'Testing' : 'Neutral'}</span></div><p class="rtext">${esc(t.text)}</p></div>`).join('');
    $('gochar').innerHTML = `<h2>Transit positions</h2><table><thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>Nakshatra</th><th>Navamsa (D9)</th><th>House from Lagna</th><th>House from Moon</th><th>Bindus</th></tr></thead><tbody>` +
      g.planets.map(p => `<tr><td><b>${p.key}</b>${rx(p) ? ' ℞' : ''}</td><td>${p.signName}</td><td>${fmtDeg(p.deg)}</td><td>${p.nakshatra}, pada ${p.pada}</td><td>${E.SIGNS[nav(p).sign]} ${fmtDeg(nav(p).deg)}</td><td>${p.fromLagna}</td><td>${p.fromMoon}</td><td>${BL.SEVEN.includes(p.key) ? AV.bav[p.key].signs[p.sign] + '/8' : '–'}</td></tr>`).join('') + `</tbody></table>`;
  }
  const RD = window.Reading;
  $('gDeg').addEventListener('change', () => { if (chart) renderGochar(curGDate()); });
  function curGDate() { return $('gDate').value ? Date.UTC(...$('gDate').value.split('-').map((x, i) => i === 1 ? x - 1 : +x), 6, 30) : Date.now(); }
  function renderReadings() {
    const pl = RD.planets(chart), hs = RD.houses(chart);
    $('rdIntro').innerHTML = `<h2>Readings by placement</h2><p class="ptext">Each planet is read by the sign it occupies (own, friend or enemy sign), its house and house type, dignity, retrogression, conjunctions, aspects received, the houses it rules, its nakshatra and its Ashtakavarga support. Each house is read by its sign, lord, occupants, aspects and Sarvashtakavarga bindus. These are rule-based classical significations for reflection, not a consultation.</p>`;
    $('rdPlanets').innerHTML = `<h2>Planets</h2>` + pl.map((p, i) => `<details class="rcard" ${i < 2 ? 'open' : ''}><summary><span>${esc(p.headline)}</span><span class="tag ${p.score >= 0.5 ? 'good' : p.score <= -0.5 ? 'bad' : 'mid'}">${p.strength} · ${p.score > 0 ? '+' : ''}${p.score}</span></summary><dl>${p.parts.map(x => `<dt>${x.h}</dt><dd>${esc(x.t)}</dd>`).join('')}</dl></details>`).join('');
    $('rdHouses').innerHTML = `<h2>Houses</h2>` + hs.map(h => `<details class="rcard"><summary><span>${P.ord(h.house)} house · ${h.sign} · lord ${h.lord}</span><span class="tag ${h.tone}">${h.sav} bindus</span></summary><p class="rtext">${esc(h.text)}</p></details>`).join('');
  }
  $('gDate').addEventListener('change', () => { if (chart && $('gDate').value) renderGochar(curGDate()); });

  // ----- tables & text -----
  function render() {
    const c = chart, moon = c.planets.find(p => p.key === 'Moon'), sun = c.planets.find(p => p.key === 'Sun');
    const kv = (k, v) => `<div class="kv"><small>${k}</small><b>${v}</b></div>`;
    const off = c.offsetMin, offS = `UTC${off < 0 ? '−' : '+'}${String(Math.floor(Math.abs(off) / 60)).padStart(2, '0')}:${String(Math.abs(off) % 60).padStart(2, '0')}`;
    $('summary').innerHTML = `<h2>${esc(c.input.name || 'Birth chart')}</h2>` +
      kv('Lagna (Ascendant)', `${c.lagna.signName} ${fmtDeg(c.lagna.deg)}`) + kv('Rashi (Moon sign)', `${moon.signName} · ${moon.signSa}`) +
      kv('Nakshatra', `${moon.nakshatra} · pada ${moon.pada}`) + kv('Sun sign (sidereal)', sun.signName) +
      kv('Birth time zone', `${esc(c.input.tz)} (${offS})`) + kv('Lahiri ayanamsa', fmtDeg(c.ayanamsa));
    drawCharts();
    renderPredict();
    $('planetsTable').innerHTML = `<table><thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>Nakshatra</th><th>Pada</th><th>House</th><th>Navamsa</th><th>Status</th></tr></thead><tbody>` +
      `<tr><td><b>Lagna</b></td><td>${c.lagna.signName}</td><td>${fmtDeg(c.lagna.deg)}</td><td>${c.lagna.nakshatra}</td><td>${c.lagna.pada}</td><td>1</td><td>${E.SIGNS[c.lagna.navSign]}</td><td></td></tr>` +
      c.planets.map(p => `<tr><td><b>${p.key}</b></td><td>${p.signName}</td><td>${fmtDeg(p.deg)}</td><td>${p.nakshatra}</td><td>${p.pada}</td><td>${p.house}</td><td>${E.SIGNS[p.navSign]}</td><td>${p.retro && !['Rahu','Ketu'].includes(p.key) ? '<span class="tag bad">Retrograde</span> ' : ''}${p.dignity ? `<span class="tag ${p.dignity === 'Debilitated' ? 'bad' : 'good'}">${p.dignity}</span>` : ''}</td></tr>`).join('') + `</tbody></table>
      <p class="hint">Rahu/Ketu are the mean nodes (always retrograde). House = whole-sign house counted from Lagna.</p>`;

    const now = Date.now();
    $('dasha').innerHTML = `<h2>Vimshottari Dasha</h2><p class="hint">Starting Mahadasha: <b>${c.dasha.maha[0].lord}</b> — balance at birth ≈ ${c.dasha.balanceYears.toFixed(2)} years (year = 365.25 days). Click a period for its sub-periods (Antardasha).</p>` +
      c.dasha.maha.map(m => {
        const cur = m.start <= now && now < m.end;
        return `<details class="dasha-row ${cur ? 'now' : ''}" ${cur ? 'open' : ''}><summary><span>${m.lord} Mahadasha ${cur ? '<span class="tag good">running now</span>' : ''}</span><span class="d">${fmtDate(Math.max(m.start, c.utcMs))} → ${fmtDate(m.end)} · ${m.years}y</span></summary><div class="antars">` +
          m.antars.filter(a => a.end > c.utcMs).map(a => `<div class="${a.start <= now && now < a.end ? 'now' : ''}"><span>${m.lord} – ${a.lord}</span><span>${fmtDate(Math.max(a.start, c.utcMs))} → ${fmtDate(a.end)}</span></div>`).join('') + `</div></details>`;
      }).join('');

    const pc = c.panchang;
    $('panchang').innerHTML = `<h2>Panchang at birth</h2><div class="grid2">${kv('Vara (weekday)', pc.vara)}${kv('Tithi', `${pc.tithi} · ${pc.paksha}`)}${kv('Nakshatra', `${pc.nakshatra} (pada ${pc.pada})`)}${kv('Yoga', pc.yoga)}${kv('Karana', pc.karana)}</div><p class="hint">Weekday is the civil day; in strict Vedic reckoning the day begins at sunrise, so a birth before sunrise belongs to the previous Vara.</p>`;
    $('yogas').innerHTML = `<h2>Yogas &amp; doshas</h2>` + c.yogas.map(y => `<div class="yoga"><b>${y.name}</b> <span class="tag ${y.present ? (/dosha|sarp/i.test(y.name) ? 'bad' : 'good') : ''}">${y.present ? 'Present' : 'Absent'}</span><div class="hint">${esc(y.detail)}</div></div>`).join('') + `<p class="hint">Rule-based checks only; classical judgement also weighs strength, aspects and cancellations.</p>`;

    renderBala();
    renderReadings();
    const t = new Date(); $('gDate').value = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    renderGochar(now);
  }
})();
