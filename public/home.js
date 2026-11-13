/* Landing parts of the page: hero wheel, tool tiles, zodiac strip, header navigation. */
(function () {
  const $ = id => document.getElementById(id), body = document.body, NS = 'http://www.w3.org/2000/svg';
  const G = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map(g => g + '︎');
  // ---------- hero wheel ----------
  const spin = $('wheelSpin');
  if (spin) {
    const COL = { '#e6b94f': 'var(--deco)', '#f1d28a': 'var(--deco2)', '#cfd8ff': 'var(--soft)' }, el = (n, a, t) => { const e = document.createElementNS(NS, n); Object.keys(a).forEach(k => { if (k === 'stroke') e.style.stroke = COL[a[k]] || a[k]; else if (k === 'fill' && COL[a[k]]) e.style.fill = COL[a[k]]; else e.setAttribute(k, a[k]); }); if (t) e.textContent = t; spin.appendChild(e); return e; };
    [190, 150, 104].forEach((r, i) => el('circle', { cx: 200, cy: 200, r, fill: 'none', stroke: '#e6b94f', 'stroke-opacity': i === 0 ? .7 : .4, 'stroke-width': i === 0 ? 1.6 : 1 }));
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 - 90) * Math.PI / 180, m = ((i * 30 + 15) - 90) * Math.PI / 180;
      el('line', { x1: 200 + 104 * Math.cos(a), y1: 200 + 104 * Math.sin(a), x2: 200 + 190 * Math.cos(a), y2: 200 + 190 * Math.sin(a), stroke: '#e6b94f', 'stroke-opacity': .35 });
      el('text', { x: 200 + 170 * Math.cos(m), y: 200 + 170 * Math.sin(m), 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 20, fill: '#f1d28a' }, G[i]);
      el('circle', { cx: 200 + 127 * Math.cos(m), cy: 200 + 127 * Math.sin(m), r: i % 3 === 0 ? 3.2 : 2, fill: '#cfd8ff', 'fill-opacity': .75 });
    }
  }
  // ---------- tiles ----------
  const TILES = [
    ['🪐', 'Birth chart', 'Lagna, Moon sign, nakshatra and all planets in North, South or East Indian style.', 'tab:chart'],
    ['🔯', 'Divisional charts', 'The 16 classical vargas from D1 to D60, each as its own chart.', 'tab:vargas'],
    ['⏳', 'Life predictions', 'A lifetime outlook timeline from Dasha and transit together.', 'tab:predict'],
    ['🌙', 'Dasha periods', 'Vimshottari and Yogini Mahadasha, Antardasha and dates.', 'tab:dasha'],
    ['💪', 'Shadbala & Ashtakavarga', 'Planetary strength in percentages and bindu charts.', 'tab:shadbala'],
    ['🔭', 'Transits', 'Where the planets are now, with Navamsa and Sade Sati.', 'tab:gochar'],
    ['🧭', 'KP astrology', 'Placidus cusps, sub-lords, significators, ruling planets, horary 1–249.', 'kp:chart'],
    ['💍', 'Marriage matching', 'Ashtakoota Guna Milan, Manglik check and 7th-house reading.', 'sec:marriage'],
    ['💼', 'Career & finance', 'Work areas, wealth combinations and a ten-year momentum view.', 'sec:career'],
    ['🔢', 'Numerology', 'Pythagorean and Chaldean numbers, Lo Shu grid and lucky details.', 'sec:numerology'],
    ['📅', 'Yearly horoscope', 'Varsha chart, area ratings and month-by-month outlook.', 'sec:yearly'],
    ['📜', 'Panchang & yogas', 'Tithi, nakshatra, yoga, karana, plus yogas and doshas in your chart.', 'tab:panchang']
  ];
  const TAG = {'Birth chart':'Your sky at the moment of birth','Divisional charts':'Sixteen lenses on one life','Life predictions':'See the years ahead','Dasha periods':'The timing of your life','Shadbala & Ashtakavarga':'How strong is each planet','Transits':'The sky right now','KP astrology':'Precise, event-based answers','Marriage matching':'Check compatibility','Career & finance':'Work, wealth and growth','Numerology':'Your name, your numbers','Yearly horoscope':'Your year, month by month','Panchang & yogas':'The almanac of your birth'};
  const tl = $('tiles'); if (tl) tl.innerHTML = TILES.map((t, i) => { const U = (window.PAGE_URL || {})[t[3]]; return `${U ? '<a href="' + U + '"' : '<button type="button"'} class="tile" data-go="${t[3]}"><span class="art a${i % 4}" aria-hidden="true"><svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke="currentColor" stroke-opacity=".35"><circle cx="100" cy="60" r="26"/><circle cx="100" cy="60" r="44"/><circle cx="100" cy="60" r="64" stroke-dasharray="2 6"/><path d="M0 60H200M100 0V120" stroke-opacity=".12"/></g><g fill="currentColor"><circle cx="28" cy="26" r="1.6"/><circle cx="168" cy="30" r="2"/><circle cx="150" cy="96" r="1.4"/><circle cx="46" cy="92" r="2"/><circle cx="176" cy="70" r="1.2"/><circle cx="18" cy="66" r="1.2"/></g></svg><i>${t[0]}</i></span><b>${t[1]}</b><span class="tg">${TAG[t[1]] || ''}</span><span class="d">${t[2]}</span><span class="go">Explore free now <u>→</u></span>${U ? '</a>' : '</button>'}`; }).join('');
  // ---------- zodiac ----------
  const Z = [['Aries', 'Mesha', 'Fire', 'Cardinal', 'Mars', 'Head', '14 Apr – 14 May'], ['Taurus', 'Vrishabha', 'Earth', 'Fixed', 'Venus', 'Face and neck', '15 May – 14 Jun'], ['Gemini', 'Mithuna', 'Air', 'Mutable', 'Mercury', 'Shoulders and arms', '15 Jun – 15 Jul'], ['Cancer', 'Karka', 'Water', 'Cardinal', 'Moon', 'Chest', '16 Jul – 16 Aug'], ['Leo', 'Simha', 'Fire', 'Fixed', 'Sun', 'Heart and upper back', '17 Aug – 16 Sep'], ['Virgo', 'Kanya', 'Earth', 'Mutable', 'Mercury', 'Abdomen', '17 Sep – 16 Oct'], ['Libra', 'Tula', 'Air', 'Cardinal', 'Venus', 'Lower abdomen', '17 Oct – 15 Nov'], ['Scorpio', 'Vrishchika', 'Water', 'Fixed', 'Mars', 'Pelvis', '16 Nov – 15 Dec'], ['Sagittarius', 'Dhanu', 'Fire', 'Mutable', 'Jupiter', 'Thighs', '16 Dec – 13 Jan'], ['Capricorn', 'Makara', 'Earth', 'Cardinal', 'Saturn', 'Knees', '14 Jan – 12 Feb'], ['Aquarius', 'Kumbha', 'Air', 'Fixed', 'Saturn', 'Calves and ankles', '13 Feb – 13 Mar'], ['Pisces', 'Meena', 'Water', 'Mutable', 'Jupiter', 'Feet', '14 Mar – 13 Apr']];
  const zod = $('zod'), zi = $('zinfo');
  if (zod) {
    zod.innerHTML = Z.map((z, i) => `<button type="button" role="tab" data-z="${i}" aria-selected="false"><span class="g" aria-hidden="true">${G[i]}</span>${z[0]}</button>`).join('');
    const show = i => { const z = Z[i]; zod.querySelectorAll('button').forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', String(k === i)); }); zi.innerHTML = `<h3>${z[0]} · ${z[1]} (sign ${i + 1})</h3><dl><div><dt>Element</dt><dd>${z[2]}</dd></div><div><dt>Quality</dt><dd>${z[3]}</dd></div><div><dt>Ruler</dt><dd>${z[4]}</dd></div><div><dt>Body (Kalapurusha)</dt><dd>${z[5]}</dd></div><div><dt>Sun is here (Lahiri), about</dt><dd>${z[6]}</dd></div></dl><p class="hint" style="margin:0">The sign is the first house of the natural zodiac's order, and signs are counted from the Lagna in your chart.</p>`; };
    zod.addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (b) show(+b.dataset.z); }); show(0);
  }
  // ---------- navigation ----------
  let pending = null, toastT = null;
  const toast = m => { let t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = m; clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 4200); };
  const ready = () => !!(window.JK && $('result') && !$('result').hidden);
  const scrollTo = el => el && el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  function goTo(v) {
    if (window.PAGE_URL && window.PAGE_URL[v]) { location.href = window.PAGE_URL[v]; return; }
    if (v === 'form') { scrollTo($('formCard')); setTimeout(() => { const d = $('date'); if (d) d.focus({ preventScroll: true }); }, 450); return; }
    if (v === 'explore') { scrollTo($('explore')); return; }
    if (ready() && window.JKNav) { window.JKNav.open(v); scrollTo(document.querySelector('.sea1')); return; }
    pending = v; scrollTo($('formCard')); toast('Create your Kundli first. We will open that section right after.');
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (!b) return; e.preventDefault(); goTo(b.dataset.go); });
  document.addEventListener('kundli:ready', () => {
    body.classList.add('has-chart'); const tt = document.querySelector('.toast'); if (tt) tt.remove();
    if (pending) { const v = pending; pending = null; setTimeout(() => { if (window.JKNav) window.JKNav.open(v); scrollTo(document.querySelector('.sea1')); }, 60); }
  });
})();
