/* Home page: today's Panchang, calculated live in the browser for your saved place (or New Delhi). */
(function () {
  const box = document.getElementById('todayP'); if (!box || !window.VedicEngine) return;
  const E = window.VedicEngine;
  let place = { name: 'New Delhi', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' };
  try { const s = JSON.parse(localStorage.getItem('jyotish-last') || 'null'); if (s && s.lat !== '' && s.lon !== '' && s.tz) place = { name: (s.place || '').split(',')[0] || 'your place', lat: +s.lat, lon: +s.lon, tz: s.tz }; } catch (e) {}
  const parts = tz => { const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false, weekday: 'long', month_: 'long' }); const o = {}; f.formatToParts(new Date()).forEach(p => o[p.type] = p.value); return o; };
  const cell = (k, v) => `<div><span>${k}</span><b>${v}</b></div>`;
  function draw() {
    let p; try { p = parts(place.tz); } catch (e) { place.tz = 'Asia/Kolkata'; p = parts(place.tz); }
    const hr = +p.hour % 24, mi = +p.minute;
    let c; try { c = E.computeChart({ year: +p.year, month: +p.month, day: +p.day, hour: hr, minute: mi, lat: place.lat, lon: place.lon, tz: place.tz }); } catch (e) { return; }
    const pc = c.panchang, moon = c.planets.find(x => x.key === 'Moon'), sun = c.planets.find(x => x.key === 'Sun');
    const date = new Intl.DateTimeFormat('en-GB', { timeZone: place.tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const time = String(hr).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
    box.innerHTML = `<div class="th"><h2>Today’s Panchang</h2><p>${date} · ${time} · ${place.name.replace(/</g, '')}</p></div><div class="tg">${cell('Vara', pc.vara)}${cell('Tithi', pc.tithi + ' · ' + pc.paksha.split(' ')[0])}${cell('Nakshatra', pc.nakshatra + ' · pada ' + pc.pada)}${cell('Yoga', pc.yoga)}${cell('Karana', pc.karana)}${cell('Moon sign', moon.signName || moon.sign)}${cell('Sun sign', sun.signName || sun.sign)}</div><p class="hint">Live positions, Lahiri ayanamsa. Weekday is the civil day. Uses the place from your last Kundli, otherwise New Delhi.</p>`;
  }
  draw(); setInterval(draw, 60000);
})();
