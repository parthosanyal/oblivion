/* Shadbala (six-fold planetary strength) and Ashtakavarga. Rule-based, Parashari method.
 * Simplifications are listed in NOTES (shown in the app). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.Bala = factory(root.VedicEngine);
})(typeof self !== 'undefined' ? self : this, function (E) {
  const D2R = Math.PI / 180, R2D = 180 / Math.PI, norm = a => ((a % 360) + 360) % 360, n180 = a => { a = norm(a); return a > 180 ? a - 360 : a; };
  const sin = d => Math.sin(d * D2R), cos = d => Math.cos(d * D2R);
  const SEVEN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const REQUIRED = { Sun: 6.5, Moon: 6, Mars: 5, Mercury: 7, Jupiter: 6.5, Venus: 5.5, Saturn: 5 }; // rupas (BPHS)
  const NAISARGIKA = { Sun: 60, Moon: 51.43, Venus: 42.86, Jupiter: 34.29, Mercury: 25.71, Mars: 17.14, Saturn: 8.57 };
  const DEEP_EXALT = { Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200 };
  const FRIENDS = { Sun: ['Moon','Mars','Jupiter'], Moon: ['Sun','Mercury'], Mars: ['Sun','Moon','Jupiter'], Mercury: ['Sun','Venus'], Jupiter: ['Sun','Moon','Mars'], Venus: ['Mercury','Saturn'], Saturn: ['Mercury','Venus'] };
  const ENEMIES = { Sun: ['Venus','Saturn'], Moon: [], Mars: ['Mercury'], Mercury: ['Moon'], Jupiter: ['Mercury','Venus'], Venus: ['Sun','Moon'], Saturn: ['Sun','Moon','Mars'] };
  const MOOLATRIKONA = { Sun: [4, 0, 20], Moon: [1, 3, 30], Mars: [0, 0, 12], Mercury: [5, 15, 20], Jupiter: [8, 0, 10], Venus: [6, 0, 15], Saturn: [10, 0, 20] };
  const VARGAS7 = [1, 2, 3, 7, 9, 12, 30];
  const WEEK_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const HORA_ORDER = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
  const BENEFIC = ['Moon', 'Mercury', 'Jupiter', 'Venus'];
  const NOTES = [
    'Uses whole-sign houses and the Lahiri ayanamsa; Rahu and Ketu are not part of Shadbala.',
    'Yuddha bala (planetary war) is not modelled and is taken as zero.',
    'Masa and Varsha lords are the weekday lords at the last Sun sign-ingress and the last Mesha Sankranti before birth.',
    'Drik bala treats Mars (4th, 8th), Jupiter (5th, 9th) and Saturn (3rd, 10th) special aspects as full strength within the aspected sign.',
    "The Moon's Paksha bala and the Sun's Ayana bala are doubled, as in Parashara. Sun's and Moon's Cheshta bala equal their Ayana and Paksha bala.",
    'Minimum required strengths: Sun 6.5, Moon 6, Mars 5, Mercury 7, Jupiter 6.5, Venus 5.5, Saturn 5 rupas. Percent = total ÷ minimum × 100.'
  ];

  // ---------- Shadbala ----------
  function shadbala(chart) {
    const P = {}; chart.planets.forEach(p => P[p.key] = p);
    const jd = chart.jd, eps = chart.eps, lat = chart.input.lat, ayan = chart.ayanamsa;
    const lag = chart.lagna.lon, mc = chart.mcLon;
    const sunTrop = norm(P.Sun.lon + ayan);
    // time-of-day geometry
    const ra = Math.atan2(cos(eps) * sin(sunTrop), cos(sunTrop)) * R2D, dec = Math.asin(sin(eps) * sin(sunTrop)) * R2D;
    const h = n180(chart.ramc - ra); // hour angle of Sun: 0 at local noon, ±180 at midnight
    const cosH0 = clamp((sin(-0.833) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec)), -1, 1), H0 = Math.acos(cosH0) * R2D;
    const isDay = Math.abs(h) <= H0;
    let frac;
    if (isDay) frac = (h + H0) / (2 * H0); else frac = ((h > H0 ? h - H0 : h + 360 - H0)) / (360 - 2 * H0);
    const part = Math.min(2, Math.floor(frac * 3));
    const tribhagaLord = isDay ? ['Mercury', 'Sun', 'Saturn'][part] : ['Moon', 'Venus', 'Mars'][part];
    // Vedic weekday (day starts at sunrise) and hora
    const localMs = chart.utcMs + chart.offsetMin * 60000, civilWd = (Math.floor(localMs / 86400000) + 4) % 7;
    const preSunrise = h < -H0;
    const wd = preSunrise ? (civilWd + 6) % 7 : civilWd, varaLord = WEEK_LORDS[wd];
    const hoursSinceSunrise = norm(h + H0) / 15;
    const horaLord = HORA_ORDER[(HORA_ORDER.indexOf(varaLord) + Math.floor(hoursSinceSunrise)) % 7];
    // masa & varsha lords
    const sunSid = ms => E.siderealLon('Sun', E.jdFromMs(ms));
    const lastCross = (ms, target) => {
      let t = ms - norm(sunSid(ms) - target) / 0.9856 * 86400000;
      for (let i = 0; i < 4; i++) t -= n180(sunSid(t) - target) / 0.9856 * 86400000;
      return t;
    };
    const wdAt = t => WEEK_LORDS[(Math.floor((t + chart.offsetMin * 60000) / 86400000) + 4) % 7];
    const masaLord = wdAt(lastCross(chart.utcMs, Math.floor(P.Sun.lon / 30) * 30)), abdaLord = wdAt(lastCross(chart.utcMs, 0));
    // paksha
    let elong = Math.abs(n180(P.Moon.lon - P.Sun.lon));
    const moonBenefic = norm(P.Moon.lon - P.Sun.lon) >= 84 && norm(P.Moon.lon - P.Sun.lon) <= 264;

    const rel = (a, b) => { // compound relation of planet a to planet b (lord of sign)
      const perm = FRIENDS[a].includes(b) ? 1 : ENEMIES[a].includes(b) ? -1 : 0;
      const dist = ((P[b].sign - P[a].sign + 12) % 12) + 1, temp = [2, 3, 4, 10, 11, 12].includes(dist) ? 1 : -1;
      const sum = perm + temp; return sum === 2 ? 'adhimitra' : sum === 1 ? 'mitra' : sum === 0 ? 'sama' : sum === -1 ? 'shatru' : 'adhishatru';
    };
    const PTS = { moolatrikona: 45, own: 30, adhimitra: 22.5, mitra: 15, sama: 10, shatru: 7.5, adhishatru: 3.75 };

    // aspects for drik bala
    const aspect = (from, to) => {
      const d = norm(to.lon - from.lon); let v;
      if (d < 30) v = 0; else if (d < 60) v = (d - 30) / 2; else if (d < 90) v = d - 45; else if (d < 120) v = 45 - (d - 90) / 2;
      else if (d < 150) v = 150 - d; else if (d < 180) v = (d - 150) * 2; else if (d < 300) v = (300 - d) / 2; else v = 0;
      const hs = ((to.sign - from.sign + 12) % 12) + 1;
      const special = { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10] }[from.key];
      if (special && special.includes(hs)) v = 60;
      return v;
    };
    const isBenefic = k => k === 'Moon' ? moonBenefic : BENEFIC.includes(k);

    const out = {};
    SEVEN.forEach(k => {
      const p = P[k], r = {};
      // Sthana
      r.uchcha = Math.abs(n180(p.lon - norm(DEEP_EXALT[k] + 180))) / 3; // distance from debilitation point
      r.uchcha = (180 - Math.abs(n180(p.lon - DEEP_EXALT[k]))) / 3;
      r.uchcha = Math.abs(n180(p.lon - DEEP_EXALT[k])) <= 180 ? (180 - Math.abs(n180(p.lon - DEEP_EXALT[k]))) / 3 : 0;
      let sapta = 0; const detail = [];
      VARGAS7.forEach(v => {
        const sg = E.vargaSign(p.lon, v), lord = E.SIGN_LORDS[sg]; let st;
        const mt = MOOLATRIKONA[k];
        if (v === 1 && sg === mt[0] && p.deg >= mt[1] && p.deg < mt[2]) st = 'moolatrikona';
        else if (lord === k) st = 'own'; else st = rel(k, lord);
        sapta += PTS[st]; detail.push(`D${v} ${E.SIGNS[sg].slice(0, 3)} (${st})`);
      });
      r.sapta = sapta; r.saptaDetail = detail;
      const odd = p.sign % 2 === 0, navOdd = E.vargaSign(p.lon, 9) % 2 === 0, wantOdd = !['Moon', 'Venus'].includes(k);
      r.ojha = (odd === wantOdd ? 15 : 0) + (navOdd === wantOdd ? 15 : 0);
      r.kendra = [1, 4, 7, 10].includes(p.house) ? 60 : [2, 5, 8, 11].includes(p.house) ? 30 : 15;
      const dk = Math.floor(p.deg / 10);
      r.drekkana = (['Sun', 'Mars', 'Jupiter'].includes(k) && dk === 0) || (['Mercury', 'Saturn'].includes(k) && dk === 1) || (['Moon', 'Venus'].includes(k) && dk === 2) ? 15 : 0;
      r.sthana = r.uchcha + r.sapta + r.ojha + r.kendra + r.drekkana;
      // Dig
      const strong = { Jupiter: lag, Mercury: lag, Sun: mc, Mars: mc, Saturn: norm(lag + 180), Moon: norm(mc + 180), Venus: norm(mc + 180) }[k];
      r.dig = (180 - Math.abs(n180(p.lon - strong))) / 3;
      // Kala
      const dayPow = 60 * (1 - Math.abs(h) / 180);
      r.nathonnata = k === 'Mercury' ? 60 : ['Moon', 'Mars', 'Saturn'].includes(k) ? 60 - dayPow : dayPow;
      r.paksha = (BENEFIC.includes(k) ? elong / 3 : 60 - elong / 3) * (k === 'Moon' ? 2 : 1);
      r.tribhaga = k === 'Jupiter' || k === tribhagaLord ? 60 : 0;
      r.abda = k === abdaLord ? 15 : 0; r.masa = k === masaLord ? 30 : 0; r.vara = k === varaLord ? 45 : 0; r.hora = k === horaLord ? 60 : 0;
      const lamT = norm(p.lon + ayan), decl = Math.asin(sin(23.45) * sin(lamT)) * R2D;
      r.ayana = ((['Moon', 'Saturn'].includes(k) ? 23.45 - decl : k === 'Mercury' ? 23.45 + Math.abs(decl) : 23.45 + decl) / 46.9) * 60;
      r.ayana = clamp(r.ayana, 0, 60) * (k === 'Sun' ? 2 : 1);
      r.yuddha = 0;
      r.kala = r.nathonnata + r.paksha + r.tribhaga + r.abda + r.masa + r.vara + r.hora + r.ayana + r.yuddha;
      // Cheshta
      if (k === 'Sun') r.cheshta = r.ayana; else if (k === 'Moon') r.cheshta = r.paksha;
      else {
        const sup = ['Mars', 'Jupiter', 'Saturn'].includes(k), Lp = norm(E.meanLon(k, jd) - E.AYAN_J2000), Ls = norm(E.meanLon('Earth', jd) + 180 - E.AYAN_J2000);
        const mean = sup ? Lp : Ls, seegh = sup ? Ls : Lp, avg = mean + n180(p.lon - mean) / 2;
        r.cheshta = Math.abs(n180(seegh - avg)) / 3;
      }
      r.naisargika = NAISARGIKA[k];
      // Drik
      let dr = 0; SEVEN.forEach(q => { if (q !== k) dr += (isBenefic(q) ? 1 : -1) * aspect(P[q], p); });
      r.drik = dr / 4;
      r.total = r.sthana + r.dig + r.kala + r.cheshta + r.naisargika + r.drik;
      r.rupas = r.total / 60; r.required = REQUIRED[k]; r.ratio = r.rupas / r.required; r.percent = Math.round(r.ratio * 100);
      r.ishta = Math.sqrt(Math.max(0, r.uchcha * r.cheshta)); r.kashta = Math.sqrt(Math.max(0, (60 - r.uchcha) * (60 - r.cheshta)));
      r.label = r.ratio >= 1.5 ? 'Very strong' : r.ratio >= 1 ? 'Strong' : r.ratio >= 0.75 ? 'Moderate' : 'Weak';
      r.key = k; out[k] = r;
    });
    const ranked = SEVEN.slice().sort((a, b) => out[b].ratio - out[a].ratio); ranked.forEach((k, i) => out[k].rank = i + 1);
    return { planets: out, order: SEVEN, ranked, meta: { isDay, varaLord, horaLord, masaLord, abdaLord, tribhagaLord, sunrise: H0 }, notes: NOTES };
  }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  // ---------- Ashtakavarga ----------
  // houses from each contributor (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna) that receive a bindu
  const T = {
    Sun:     [[1,2,4,7,8,9,10,11],[3,6,10,11],[1,2,4,7,8,9,10,11],[3,5,6,9,10,11,12],[5,6,9,11],[6,7,12],[1,2,4,7,8,9,10,11],[3,4,6,10,11,12]],
    Moon:    [[3,6,7,8,10,11],[1,3,6,7,9,10,11],[2,3,5,6,10,11],[1,3,4,5,7,8,10,11],[1,2,4,7,8,10,11],[3,4,5,7,9,10,11],[3,5,6,11],[3,6,10,11]],
    Mars:    [[3,5,6,10,11],[3,6,11],[1,2,4,7,8,10,11],[3,5,6,11],[6,10,11,12],[6,8,11,12],[1,4,7,8,9,10,11],[1,3,6,10,11]],
    Mercury: [[5,6,9,11,12],[2,4,6,8,10,11],[1,2,4,7,8,9,10,11],[1,3,5,6,9,10,11,12],[6,8,11,12],[1,2,3,4,5,8,9,11],[1,2,4,7,8,9,10,11],[1,2,4,6,8,10,11]],
    Jupiter: [[1,2,3,4,7,8,9,10,11],[2,5,7,9,11],[1,2,4,7,8,10,11],[1,2,4,5,6,9,10,11],[1,2,3,4,7,8,10,11],[2,5,6,9,10,11],[3,5,6,12],[1,2,4,5,6,7,9,10,11]],
    Venus:   [[8,11,12],[1,2,3,4,5,8,9,11,12],[3,4,6,9,11,12],[3,5,6,9,11],[5,8,9,10,11],[1,2,3,4,5,8,9,10,11],[3,4,5,8,9,10,11],[1,2,3,4,5,8,9,11]],
    Saturn:  [[1,2,4,7,8,10,11],[3,6,11],[3,5,6,10,11,12],[6,8,9,10,11,12],[5,6,11,12],[6,11,12],[3,5,6,11],[1,3,4,6,10,11]]
  };
  const CLASSIC_TOTAL = { Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39 };
  function ashtakavarga(chart) {
    const refs = SEVEN.map(k => chart.planets.find(p => p.key === k).sign).concat([chart.lagna.sign]);
    const bav = {}, sav = new Array(12).fill(0);
    SEVEN.forEach(tp => {
      const a = new Array(12).fill(0);
      T[tp].forEach((hs, i) => hs.forEach(hh => a[(refs[i] + hh - 1) % 12]++));
      bav[tp] = { signs: a, total: a.reduce((x, y) => x + y, 0), expected: CLASSIC_TOTAL[tp] };
      a.forEach((v, i) => sav[i] += v);
    });
    const lag = chart.lagna.sign;
    return { bav, sav, savTotal: sav.reduce((x, y) => x + y, 0), lagnaSign: lag,
      byHouse: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, sign: (lag + i) % 12, sav: sav[(lag + i) % 12], bav: Object.fromEntries(SEVEN.map(k => [k, bav[k].signs[(lag + i) % 12]])) })) };
  }
  return { shadbala, ashtakavarga, SEVEN, REQUIRED, NOTES, FRIENDS, ENEMIES };
});
