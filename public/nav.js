/* Two-row sea-blue navigation: main sections on top, their pages below.
 * Drives the existing tab buttons (#tabs) and the Reports switcher (#repSwitch), so app.js and sections.js are unchanged.
 */
(function () {
  const tabs = document.getElementById('tabs'); if (!tabs) return;
  const DESC = {'Birth Chart':'Rashi, Navamsa and all charts','Predictions':'Life events, Dasha and transits','Strength':'Shadbala, Ashtakavarga, readings','KP Astrology':'Cusps, significators, horary','Reports':'Marriage, career, numerology'};
  const GROUPS = [
    ['🪐', 'Birth Chart', [['Charts', 'tab:chart'], ['Planets', 'tab:planets'], ['D1–D60 Charts', 'tab:vargas'], ['Panchang & Yogas', 'tab:panchang']]],
    ['⏳', 'Predictions', [['Life Predictions', 'tab:predict'], ['Dasha', 'tab:dasha'], ['Transits', 'tab:gochar']]],
    ['💪', 'Strength', [['Shadbala', 'tab:shadbala'], ['Ashtakavarga', 'tab:av'], ['Readings', 'tab:read']]],
    ['🧭', 'KP Astrology', [['Planets & cusps', 'kp:chart'], ['Significators', 'kp:sig'], ['Cuspal sub-lords', 'kp:csl'], ['Dasha & timing', 'kp:dasha'], ['Ruling planets', 'kp:rp'], ['Horary 1–249', 'kp:horary']]],
    ['📋', 'Reports', [['Kundli analysis', 'sec:kundli'], ['Marriage', 'sec:marriage'], ['Career & finance', 'sec:career'], ['Numerology', 'sec:numerology'], ['Yearly horoscope', 'sec:yearly']]]
  ];
  const r1 = document.createElement('div'), r2 = document.createElement('div'); r1.className = 'sea1'; r2.className = 'sea2'; r1.setAttribute('role', 'tablist'); r1.setAttribute('aria-label', 'Sections'); r2.setAttribute('role', 'tablist'); r2.setAttribute('aria-label', 'Pages');
  tabs.before(r1); r1.after(r2);
  let g = 0, s = 0;
  const go = v => {
    const [k, id] = v.split(':');
    if (k === 'tab') { const b = tabs.querySelector('[data-tab=' + id + ']'); if (b) b.click(); }
    else if (k === 'kp') { const b = tabs.querySelector('[data-tab=kp]'); if (b) b.click(); const q = document.querySelector('#kpSwitch [data-sec=' + id + ']'); if (q) q.click(); }
    else { const b = tabs.querySelector('[data-tab=reports]'); if (b) b.click(); const q = document.querySelector('#repSwitch [data-sec=' + id + ']'); if (q) q.click(); }
  };
  const draw = () => {
    r1.innerHTML = GROUPS.map((x, i) => `<button type="button" role="tab" aria-selected="${i === g}" class="${i === g ? 'on' : ''}" data-g="${i}"><span class="ti" aria-hidden="true">${x[0]}</span><b>${x[1]}</b><small>${DESC[x[1]]}</small></button>`).join('');
    r2.innerHTML = GROUPS[g][2].map((x, i) => `<button type="button" role="tab" aria-selected="${i === s}" class="${i === s ? 'on' : ''}" data-s="${i}">${x[0]}</button>`).join('');
  };
  r1.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (!b) return; g = +b.dataset.g; s = 0; draw(); go(GROUPS[g][2][0][1]); });
  r2.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; s = +b.dataset.s; draw(); go(GROUPS[g][2][s][1]); });
  draw();
  window.JKNav = { open(v) { for (let i = 0; i < GROUPS.length; i++) { const j = GROUPS[i][2].findIndex(x => x[1] === v); if (j >= 0) { g = i; s = j; draw(); go(v); return true; } } return false; } };
})();
