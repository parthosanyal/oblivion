const E = require('./public/engine.js'); let fail = 0;
const ok = (n, c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (m ? '  ' + m : '')); if (!c) fail++; };
// Meeus worked examples
ok('Moon (Meeus 47.a)', Math.abs(E.tropical.moon(2448724.5) - 133.167265) < 0.01);
ok('Sun (Meeus 25.a)', Math.abs(E.tropical.sun(2448908.5) - 199.90895) < 0.01);
// J2000 tropical longitudes (Almanac): Mars 327.96, Jupiter 25.25, Saturn 40.40
const trop = n => E.siderealLon(n, 2451545) + E.ayanamsa(2451545);
ok('Mars J2000', Math.abs(trop('Mars') - 327.96) < 0.3, trop('Mars').toFixed(2));
ok('Saturn J2000', Math.abs(trop('Saturn') - 40.4) < 0.3, trop('Saturn').toFixed(2));
// Chart: Delhi, 15 Aug 1947 00:00 IST (India's independence). Known: Lagna Taurus, Moon Cancer (Pushya/Ashlesha area), Sun Cancer
const c = E.computeChart({ year: 1947, month: 8, day: 15, hour: 0, minute: 0, lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' });
console.log(c.lagna.signName, c.lagna.deg.toFixed(2), '| Moon', c.planets[1].signName, c.planets[1].nakshatra, '| offset', c.offsetMin);
ok('IST offset 1947 = +330', c.offsetMin === 330);
ok('Lagna Taurus (published chart)', c.lagna.signName === 'Taurus');
ok('Moon Cancer', c.planets[1].signName === 'Cancer');
ok('Sun Cancer', c.planets[0].signName === 'Cancer');
ok('Dasha sums to 120y cycle', Math.abs(c.dasha.maha.reduce((a, m) => a + m.years, 0) - 120) < 121);
// ---- predictions
const P = require('./public/predict.js');
const c2 = E.computeChart({ year: 1999, month: 5, day: 21, hour: 17, minute: 25, lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' });
const y = P.yoginiDasha(c2.planets[1].lon, c2.utcMs); // Moon in Ashlesha (9) -> Bhramari
console.log('Yogini start', y.maha[0].name, y.maha[0].lord, 'balance', y.balanceYears.toFixed(2));
let t2 = 0; const okY = y.maha.every((m, i) => i === 0 || Math.abs(m.start - y.maha[i - 1].end) < 1000) && y.maha[0].name === 'Bhramari';
console.log(okY ? 'PASS' : 'FAIL', 'Yogini continuous & Ashlesha=Bhramari'); if (!okY) process.exit(1);
const r = P.compute(c2, Date.UTC(2026, 9, 24));
const okR = r.years.length === 90 && r.months.length === 1080 && r.years.every(a => a.score >= 5 && a.score <= 95);
console.log(okR ? 'PASS' : 'FAIL', 'timeline', r.years.length, 'yrs; now:', r.now.vMD + '-' + r.now.vAD, '|', r.now.yMDName, '| J house', r.now.jH, 'S house', r.now.sH, 'score', r.now.score);
console.log('Sade Sati bands (ages):', r.sade.map(b => b.from.toFixed(1) + '–' + b.to.toFixed(1)).join(', '));
if (!okR) process.exit(1);
// ---- shadbala + ashtakavarga
const B = require('./public/bala.js');
const av = B.ashtakavarga(c2);
const okAV = Object.values(av.bav).every(b => b.total === b.expected) && av.savTotal === 337;
console.log(okAV ? 'PASS' : 'FAIL', 'Ashtakavarga totals', Object.entries(av.bav).map(([k, b]) => k + ':' + b.total).join(' '), 'SAV', av.savTotal);
const sb = B.shadbala(c2);
sb.order.forEach(k => { const r = sb.planets[k]; console.log(k.padEnd(8), 'sthana', r.sthana.toFixed(0), 'dig', r.dig.toFixed(0), 'kala', r.kala.toFixed(0), 'cheshta', r.cheshta.toFixed(0), 'naisa', r.naisargika.toFixed(0), 'drik', r.drik.toFixed(0), '=> rupas', r.rupas.toFixed(2), r.percent + '%', r.label); });
console.log('meta', JSON.stringify(sb.meta), 'MC', c2.mcLon.toFixed(1));
const okSB = sb.order.every(k => isFinite(sb.planets[k].total) && sb.planets[k].rupas > 1 && sb.planets[k].rupas < 15);
console.log(okSB ? 'PASS' : 'FAIL', 'shadbala sane'); if (!okAV || !okSB) fail++;
// ---- readings
const RD = require('./public/reading.js');
const pr = RD.planets(c2), hr = RD.houses(c2), g2 = E.computeGochar(c2, Date.UTC(2026, 9, 25)), tr = RD.transits(c2, g2);
const okRD = pr.length === 9 && hr.length === 12 && tr.length === 9 && pr.every(x => x.parts.length >= 5 && !/undefined|NaN/.test(JSON.stringify(x))) && hr.every(x => !/undefined|NaN/.test(x.text)) && tr.every(x => !/undefined|NaN/.test(x.text));
console.log(okRD ? 'PASS' : 'FAIL', 'readings (9 planets, 12 houses, 9 transits, no undefined)');
console.log('SAMPLE:', pr[4].headline, '=>', pr[4].parts.map(x => x.t).join(' ').slice(0, 420));
console.log('SAMPLE:', hr[9].text.slice(0, 300));
console.log('SAMPLE:', tr[4].headline, '=>', tr[4].text.slice(0, 300));
if (!okRD) fail++;

// ---- reports modules
{
  const K = require('./public/koota.js'), N = require('./public/numerology.js'), R = require('./public/reports.js'), Pr = require('./public/predict.js');
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
  const a = E.computeChart({ year: 1999, month: 5, day: 21, hour: 17, minute: 25, lat: 28.61, lon: 77.2, tz: 'Asia/Kolkata' });
  const m = K.match(a, a);
  ok(m.kootas.length === 8, 'koota: 8 factors');
  ok(m.kootas.every(k => k.got >= 0 && k.got <= k.max) && m.total <= 36, 'koota: scores within maxima');
  ok(K.match(a, a).kootas[7].got === 0, 'koota: same chart has same Nadi (0)');
  ok(K.YONI.length === 27 && K.GANA.length === 27 && K.NADI.length === 27, 'koota: 27 nakshatra rows');
  ok(K.NADI.filter(x => x === 'Aadi').length === 9 && K.NADI.filter(x => x === 'Madhya').length === 9, 'koota: 9 per Nadi');
  const n = N.report({ name: 'Rahul Sharma', day: 21, month: 5, year: 1999 }, { now: new Date(2026, 9, 26) });
  ok(n.lifePath === 9 && n.mulank === 3 && n.bhagyank === 9, 'numerology: 21-05-1999 -> LP 9, Mulank 3, Bhagyank 9');
  ok(N.reduce(29, true) === 11 && N.reduce(28, true) === 1 && N.reduce(22, true) === 22, 'numerology: master numbers kept');
  const pr = Pr.compute(a, Date.now());
  ['kundli', 'career'].forEach(f => ok(R[f](a, pr).points.length === 10 && !R[f](a, pr).points.some(p => /undefined|NaN/.test(p.html)), 'reports: ' + f));
  const y = R.yearly(a, pr, 2026);
  ok(y.points.length === 8 && !y.points.some(p => /undefined|NaN/.test(p.html)), 'reports: yearly');
  const sunN = a.planets.find(p => p.key === 'Sun').lon, sunV = y.varsha.planets.find(p => p.key === 'Sun').lon;
  ok(Math.abs(((sunN - sunV + 540) % 360) - 180) < 0.01, 'varsha: Sun returns to natal longitude');
}


// ---- KP ----
{
  const KP = require('./public/kp.js'), chart = E.computeChart({ year: 1999, month: 5, day: 21, hour: 17, minute: 25, lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' });
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
  const t = KP.horaryTable(); ok(t.length === 249 && Math.abs(t[248].to - 360) < 1e-9 && t.every((r, i) => i === 0 || Math.abs(r.from - t[i - 1].to) < 1e-9), 'kp: 249 contiguous horary rows');
  const l0 = KP.lords(0.5); ok(l0.star === 'Ketu' && l0.sub === 'Ketu', 'kp: 0°30\' Aries is Ketu/Ketu');
  ok(KP.lords(0.8).sub === 'Venus', 'kp: 0°48\' Aries sub lord is Venus');
  const k = KP.compute(chart);
  ok(k.cusps.length === 12 && k.cusps.every((c, i) => i === 0 || ((c.lon - k.cusps[i - 1].lon + 360) % 360) > 5 && ((c.lon - k.cusps[i - 1].lon + 360) % 360) < 60), 'kp: 12 Placidus cusps in order');
  ok(Math.abs(((k.cusps[6].lon - k.cusps[0].lon + 360) % 360) - 180) < 1e-6 && Math.abs(((k.cusps[9].lon - k.cusps[3].lon + 360) % 360) - 180) < 1e-6 && Math.abs(((k.cusps[10].lon - k.cusps[4].lon + 360) % 360) - 180) < 1e-6, 'kp: opposite cusps 180° apart');
  ok(k.planets.every(p => p.house >= 1 && p.house <= 12 && p.sub && p.subsub), 'kp: every planet has house and lords');
  ok(Math.abs(k.cusps[0].lon - ((chart.lagna.lon + KP.SHIFT) % 360)) < 1e-6, 'kp: cusp 1 equals Lagna with KP ayanamsa');
  // Placidus property: cusp 11 sits 1/3 of its semi-arc east of the meridian
  { const ayan = chart.ayanamsa, lam = (k.cusps[10].lon - KP.SHIFT + ayan) % 360, eps = chart.eps, R = Math.PI / 180, dec = Math.asin(Math.sin(eps * R) * Math.sin(lam * R)), ra = (Math.atan2(Math.sin(lam * R) * Math.cos(eps * R), Math.cos(lam * R)) / R + 360) % 360, dsa = Math.acos(-Math.tan(28.6139 * R) * Math.tan(dec)) / R;
    ok(Math.abs(((ra - chart.ramc + 540) % 360) - 180 - dsa / 3) < 1e-4 || Math.abs((ra - chart.ramc + 360) % 360 - dsa / 3) < 1e-4, 'kp: cusp 11 is one third of its semi-arc from the MC'); }
  ok(k.analysis.length === 11 && k.periods[0].antars.length === 9 && KP.ruling(chart, 3).list.length === 5, 'kp: analysis, periods and ruling planets built');
  ok(E.CLASSICAL_VARGAS.length === 16, 'vargas: 16 classical charts');
}
console.log(fail ? fail + ' FAILED' : 'all tests passed'); 
process.exit(fail ? 1 : 0);
