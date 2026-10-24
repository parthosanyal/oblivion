/* Vedic astrology engine — dependency-free, runs in Node and the browser.
 * Sidereal zodiac (Lahiri ayanamsa), whole-sign houses, mean lunar node.
 * Sun/Moon: Meeus (Astronomical Algorithms). Planets: JPL approximate Keplerian elements (1800-2050).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VedicEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const norm = a => ((a % 360) + 360) % 360;
  const sin = d => Math.sin(d * D2R), cos = d => Math.cos(d * D2R);

  // ---------- Names & tables ----------
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGNS_SA = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
  const SIGN_LORDS = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
  const NAKSHATRAS = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
  const DASHA_ORDER = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
  const DASHA_YEARS = { Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17 };
  const NAK_LEN = 360 / 27;
  const WEEKDAYS = ['Sunday (Ravivara)','Monday (Somavara)','Tuesday (Mangalavara)','Wednesday (Budhavara)','Thursday (Guruvara)','Friday (Shukravara)','Saturday (Shanivara)'];
  const TITHIS = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi'];
  const YOGAS = ['Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyana','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'];
  const KARANA_MOV = ['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti (Bhadra)'];
  const KARANA_FIX = ['Shakuni','Chatushpada','Naga'];
  const EXALT = { Sun:0, Moon:1, Mars:9, Mercury:5, Jupiter:3, Venus:11, Saturn:6 };
  const DEBIL = { Sun:6, Moon:7, Mars:3, Mercury:11, Jupiter:9, Venus:5, Saturn:0 };
  const OWN = { Sun:[4], Moon:[3], Mars:[0,7], Mercury:[2,5], Jupiter:[8,11], Venus:[1,6], Saturn:[9,10] };

  // ---------- Time ----------
  const jdFromMs = ms => ms / 86400000 + 2440587.5;
  const msFromJd = jd => (jd - 2440587.5) * 86400000;
  const tCent = jd => (jd - 2451545.0) / 36525;

  function tzOffsetAt(tz, ms) {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const p = {}; f.formatToParts(new Date(ms)).forEach(x => p[x.type] = x.value);
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
  }
  // Local civil time in IANA zone (or fixed offset in hours) -> UTC ms
  function localToUtcMs(y, mo, d, h, mi, tz) {
    const local = new Date(Date.UTC(2000, mo - 1, d, h, mi)).setUTCFullYear(y);
    if (typeof tz === 'number') return local - tz * 3600000;
    let off = tzOffsetAt(tz, local);
    let utc = local - off * 60000;
    off = tzOffsetAt(tz, utc);
    return { ms: local - off * 60000, offsetMin: off };
  }

  // ---------- Ayanamsa (Lahiri) ----------
  const precessionArcsec = T => 5028.796195 * T + 1.1054348 * T * T;
  const AYAN_J2000 = 22.460148 + (precessionArcsec(0) - precessionArcsec(-1)) / 3600; // ~23.8567
  function ayanamsa(jd) { const T = tCent(jd); return AYAN_J2000 + precessionArcsec(T) / 3600; }

  // ---------- Sun (Meeus ch.25) ----------
  function sunTropical(jd) {
    const T = tCent(jd);
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
    const om = 125.04 - 1934.136 * T;
    return norm(L0 + C - 0.00569 - 0.00478 * sin(om));
  }

  // ---------- Moon (Meeus ch.47, principal longitude terms) ----------
  const MOON_TERMS = [
    [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],[0,0,0,2,-114332],
    [2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],
    [0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],
    [4,0,-2,0,8548],[2,1,-1,0,-7888],[2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],
    [2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],
    [1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],
    [2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],[2,1,1,0,-810],[4,-1,-2,0,759],
    [0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],
    [4,-1,0,0,520],[1,0,-2,0,-487],[2,1,0,-2,-399],[0,0,2,-2,-381],[1,1,1,0,351],[3,0,-2,0,-340],
    [4,0,-3,0,330],[2,-1,2,0,327],[0,2,1,0,-323],[1,1,-1,0,299],[2,0,3,0,294]
  ];
  function moonTropical(jd) {
    const T = tCent(jd), T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
    const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
    const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
    const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;
    const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.290 * T;
    const E = 1 - 0.002516 * T - 0.0000074 * T2;
    let s = 0;
    for (const [d, m, mp, f, c] of MOON_TERMS) {
      const e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
      s += c * e * sin(d * D + m * M + mp * Mp + f * F);
    }
    s += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);
    const om = 125.04 - 1934.136 * T;
    return norm(Lp + s / 1e6 - 0.00478 * sin(om));
  }

  // ---------- Planets (JPL approximate elements, ecliptic J2000) ----------
  // a, da, e, de, I, dI, L, dL, long.peri, dperi, long.node, dnode (per Julian century)
  const KEP = {
    Mercury: [0.38709927,0.00000037,0.20563593,0.00001906,7.00497902,-0.00594749,252.25032350,149472.67411175,77.45779628,0.16047689,48.33076593,-0.12534081],
    Venus:   [0.72333566,0.00000390,0.00677672,-0.00004107,3.39467605,-0.00078890,181.97909950,58517.81538729,131.60246718,0.00268329,76.67984255,-0.27769418],
    Earth:   [1.00000261,0.00000562,0.01671123,-0.00004392,-0.00001531,-0.01294668,100.46457166,35999.37244981,102.93768193,0.32327364,0,0],
    Mars:    [1.52371034,0.00001847,0.09339410,0.00007882,1.84969142,-0.00813131,-4.55343205,19140.30268499,-23.94362959,0.44441088,49.55953891,-0.29257343],
    Jupiter: [5.20288700,-0.00011607,0.04838624,-0.00013253,1.30439695,-0.00183714,34.39644051,3034.74612775,14.72847983,0.21252668,100.47390909,0.20469106],
    Saturn:  [9.53667594,-0.00125060,0.05386179,-0.00050991,2.48599187,0.00193609,49.95424423,1222.49362201,92.59887831,-0.41897216,113.66242448,-0.28867794]
  };
  function helio(name, T) {
    const [a0,a1,e0,e1,i0,i1,L0,L1,w0,w1,n0,n1] = KEP[name];
    const a = a0 + a1 * T, e = e0 + e1 * T, I = (i0 + i1 * T) * D2R;
    const L = L0 + L1 * T, wp = w0 + w1 * T, Om = (n0 + n1 * T) * D2R;
    let M = norm(L - wp); if (M > 180) M -= 360; M *= D2R;
    let E = M + e * Math.sin(M);
    for (let k = 0; k < 12; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const w = (wp - (n0 + n1 * T)) * D2R;
    const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(Om), sO = Math.sin(Om), cI = Math.cos(I), sI = Math.sin(I);
    return {
      x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
      y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
      z: (sw * sI) * xp + (cw * sI) * yp
    };
  }
  function planetSidereal(name, jd) {
    const T = tCent(jd), p = helio(name, T), e = helio('Earth', T);
    const lonJ2000 = norm(Math.atan2(p.y - e.y, p.x - e.x) * R2D);
    return norm(lonJ2000 - AYAN_J2000); // J2000 ecliptic minus J2000 ayanamsa == sidereal of date
  }
  function meanNodeTropical(jd) {
    const T = tCent(jd);
    return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441);
  }

  const BODIES = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  function siderealLon(name, jd) {
    switch (name) {
      case 'Sun': return norm(sunTropical(jd) - ayanamsa(jd));
      case 'Moon': return norm(moonTropical(jd) - ayanamsa(jd));
      case 'Rahu': return norm(meanNodeTropical(jd) - ayanamsa(jd));
      case 'Ketu': return norm(meanNodeTropical(jd) + 180 - ayanamsa(jd));
      default: return planetSidereal(name, jd);
    }
  }
  function isRetro(name, jd) {
    if (name === 'Sun' || name === 'Moon') return false;
    if (name === 'Rahu' || name === 'Ketu') return true;
    let d = siderealLon(name, jd + 0.5) - siderealLon(name, jd - 0.5);
    if (d > 180) d -= 360; if (d < -180) d += 360;
    return d < 0;
  }

  // ---------- Ascendant ----------
  function ascendantSidereal(jd, latDeg, lonDeg) {
    const T = tCent(jd);
    const gmst = norm(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000);
    const theta = norm(gmst + lonDeg);
    const eps = 23.439291 - 0.0130042 * T;
    const y = cos(theta), x = -(sin(theta) * cos(eps) + Math.tan(latDeg * D2R) * sin(eps));
    const asc = norm(Math.atan2(y, x) * R2D);
    return { lon: norm(asc - ayanamsa(jd)), ramc: theta };
  }

  // ---------- Helpers ----------
  function describe(lon) {
    const sign = Math.floor(lon / 30), deg = lon - sign * 30;
    const nakIdx = Math.floor(lon / NAK_LEN), pada = Math.floor((lon - nakIdx * NAK_LEN) / (NAK_LEN / 4)) + 1;
    return { lon, sign, signName: SIGNS[sign], signSa: SIGNS_SA[sign], deg, nakshatra: NAKSHATRAS[nakIdx], nakIndex: nakIdx, pada, nakLord: DASHA_ORDER[nakIdx % 9] };
  }
  function dignity(name, sign) {
    if (EXALT[name] === sign) return 'Exalted';
    if (DEBIL[name] === sign) return 'Debilitated';
    if (OWN[name] && OWN[name].includes(sign)) return 'Own sign';
    return '';
  }
  function navamsaSign(lon) { return vargaSign(lon, 9); }

  // ---------- Divisional charts (Vargas) D1..D60 ----------
  const VARGA_NAMES = { 1:'Rashi', 2:'Hora', 3:'Drekkana', 4:'Chaturthamsa', 5:'Panchamsa', 6:'Shashthamsa', 7:'Saptamsa', 8:'Ashtamsa', 9:'Navamsa', 10:'Dashamsa', 11:'Rudramsa', 12:'Dwadashamsa', 16:'Shodashamsa', 20:'Vimshamsa', 24:'Chaturvimshamsa', 27:'Bhamsa (Nakshatramsa)', 30:'Trimshamsa', 40:'Khavedamsa', 45:'Akshavedamsa', 60:'Shashtiamsa' };
  const VARGA_USE = { 1:'Body, overall life', 2:'Wealth', 3:'Siblings, courage', 4:'Property, fortune', 5:'Fame, power', 6:'Health, debts', 7:'Children', 8:'Longevity, obstacles', 9:'Marriage, dharma', 10:'Career', 11:'Gains', 12:'Parents', 16:'Vehicles, comforts', 20:'Spiritual practice', 24:'Education', 27:'Strengths and weaknesses', 30:'Misfortunes', 40:'Maternal lineage', 45:'Paternal lineage', 60:'Past-life karma, overall' };
  const CLASSICAL_VARGAS = [1,2,3,4,7,9,10,12,16,20,24,27,30,40,45,60];
  function vargaSign(lon, n) {
    const sign = Math.floor(lon / 30), deg = lon - sign * 30, odd = sign % 2 === 0; // Aries(0) is an odd sign
    const mode = sign % 3; // 0 movable, 1 fixed, 2 dual
    const part = Math.min(n - 1, Math.floor(deg / (30 / n)));
    switch (n) {
      case 1: return sign;
      case 2: return odd ? (deg < 15 ? 4 : 3) : (deg < 15 ? 3 : 4);
      case 3: return (sign + part * 4) % 12;
      case 4: return (sign + part * 3) % 12;
      case 5: return (odd ? [0,10,8,2,6] : [1,5,11,9,7])[part];
      case 6: return ((odd ? 0 : 6) + part) % 12;
      case 7: return ((odd ? sign : sign + 6) + part) % 12;
      case 8: return ([0, 8, 4][mode] + part) % 12;
      case 9: return ([0, 9, 6, 3][sign % 4] + part) % 12;
      case 10: return ((odd ? sign : sign + 8) + part) % 12;
      case 11: return (11 - part + 12) % 12; // counted backwards from Pisces (conventions vary)
      case 12: return (sign + part) % 12;
      case 16: return ([0, 4, 8][mode] + part) % 12;
      case 20: return ([0, 8, 4][mode] + part) % 12;
      case 24: return ((odd ? 4 : 3) + part) % 12;
      case 27: return ([0, 3, 6, 9][sign % 4] + part) % 12;
      case 30: {
        const t = odd ? [[5,0],[10,10],[18,8],[25,2],[30,6]] : [[5,1],[12,5],[20,11],[25,9],[30,7]];
        return t.find(r => deg < r[0])[1];
      }
      case 40: return ((odd ? 0 : 6) + part) % 12;
      case 45: return ([0, 4, 8][mode] + part) % 12;
      case 60: return (sign + part) % 12;
      default: return (sign + part) % 12; // non-classical: equal division counted from the sign itself
    }
  }
  const houseOf = (sign, lagnaSign) => ((sign - lagnaSign + 12) % 12) + 1;

  // ---------- Vimshottari Dasha ----------
  function vimshottari(moonLon, birthMs) {
    const YEAR = 365.25 * 86400000;
    const nakIdx = Math.floor(moonLon / NAK_LEN);
    const frac = (moonLon - nakIdx * NAK_LEN) / NAK_LEN;
    const startIdx = nakIdx % 9;
    const balanceYears = DASHA_YEARS[DASHA_ORDER[startIdx]] * (1 - frac);
    const out = [];
    let t = birthMs - (DASHA_YEARS[DASHA_ORDER[startIdx]] - balanceYears) * YEAR; // virtual start
    for (let i = 0; i < 10; i++) {
      const lord = DASHA_ORDER[(startIdx + i) % 9], yrs = DASHA_YEARS[lord];
      const start = t, end = t + yrs * YEAR;
      const antars = [];
      let at = start;
      for (let j = 0; j < 9; j++) {
        const al = DASHA_ORDER[(startIdx + i + j) % 9];
        const len = yrs * DASHA_YEARS[al] / 120 * YEAR;
        antars.push({ lord: al, start: at, end: at + len });
        at += len;
      }
      out.push({ lord, years: yrs, start, end, antars });
      t = end;
    }
    return { balanceYears, maha: out.filter(m => m.end > birthMs) };
  }

  // ---------- Panchang ----------
  function panchang(sunLon, moonLon, localWeekday) {
    const d = norm(moonLon - sunLon);
    const tn = Math.floor(d / 12) + 1;
    const paksha = tn <= 15 ? 'Shukla (waxing)' : 'Krishna (waning)';
    const idx = (tn - 1) % 15;
    const tithi = tn === 15 ? 'Purnima' : tn === 30 ? 'Amavasya' : TITHIS[idx];
    const yogaIdx = Math.floor(norm(sunLon + moonLon) / NAK_LEN);
    const k = Math.floor(d / 6);
    const karana = k === 0 ? 'Kimstughna' : k >= 57 ? KARANA_FIX[k - 57] : KARANA_MOV[(k - 1) % 7];
    const nak = describe(moonLon);
    return { tithi, tithiNumber: tn, paksha, vara: WEEKDAYS[localWeekday], nakshatra: nak.nakshatra, pada: nak.pada, yoga: YOGAS[yogaIdx], karana };
  }

  // ---------- Yogas & doshas ----------
  function analyse(P, lagnaSign) {
    const by = n => P.find(p => p.key === n);
    const res = [];
    const sun = by('Sun'), moon = by('Moon'), mars = by('Mars'), merc = by('Mercury'), jup = by('Jupiter'), ven = by('Venus'), sat = by('Saturn'), rahu = by('Rahu'), ketu = by('Ketu');
    // Manglik
    const mh = mars.house, mhm = houseOf(mars.sign, moon.sign);
    const manglikL = [1,2,4,7,8,12].includes(mh), manglikM = [1,2,4,7,8,12].includes(mhm);
    res.push({ name: 'Mangal Dosha (Manglik)', present: manglikL || manglikM,
      detail: `Mars is in house ${mh} from Lagna${manglikL ? ' (affected)' : ' (not affected)'} and house ${mhm} from Moon${manglikM ? ' (affected)' : ' (not affected)'}.` });
    // Kaal Sarp
    const seven = [sun, moon, mars, merc, jup, ven, sat];
    const inArc = (start, l) => norm(l - start) < 180;
    const ks = seven.every(p => inArc(rahu.lon, p.lon)) || seven.every(p => inArc(ketu.lon, p.lon));
    res.push({ name: 'Kaal Sarp Yoga', present: ks, detail: ks ? 'All seven planets lie on one side of the Rahu–Ketu axis.' : 'Planets are spread on both sides of the Rahu–Ketu axis.' });
    // Gajakesari
    const gk = [1,4,7,10].includes(houseOf(jup.sign, moon.sign));
    res.push({ name: 'Gajakesari Yoga', present: gk, detail: gk ? 'Jupiter is in a kendra (1/4/7/10) from the Moon — associated with reputation, wisdom and resilience.' : 'Jupiter is not in a kendra from the Moon.' });
    // Budhaditya
    const bd = sun.sign === merc.sign;
    res.push({ name: 'Budhaditya Yoga', present: bd, detail: bd ? `Sun and Mercury together in ${SIGNS[sun.sign]} — sharp intellect and communication.` : 'Sun and Mercury are in different signs.' });
    // Chandra-Mangala
    const cm = moon.sign === mars.sign;
    res.push({ name: 'Chandra–Mangala Yoga', present: cm, detail: cm ? `Moon and Mars together in ${SIGNS[moon.sign]} — drive and earning ability.` : 'Moon and Mars are in different signs.' });
    // Pancha Mahapurusha
    const pm = [['Mars','Ruchaka'],['Mercury','Bhadra'],['Jupiter','Hamsa'],['Venus','Malavya'],['Saturn','Shasha']];
    for (const [pl, nm] of pm) {
      const p = by(pl), ok = ['Exalted','Own sign'].includes(p.dignity) && [1,4,7,10].includes(p.house);
      if (ok) res.push({ name: `${nm} Yoga (Pancha Mahapurusha)`, present: true, detail: `${pl} is ${p.dignity.toLowerCase()} in a kendra (house ${p.house}).` });
    }
    // Neecha / Vipareeta not included; keep concise.
    return res;
  }

  // ---------- Main chart ----------
  function computeChart(inp) {
    const { year, month, day, hour, minute, lat, lon } = inp;
    const tz = inp.tz != null ? inp.tz : 'Asia/Kolkata';
    const r = localToUtcMs(year, month, day, hour, minute, tz);
    const ms = typeof r === 'number' ? r : r.ms;
    const offsetMin = typeof r === 'number' ? Math.round(tz * 60) : r.offsetMin;
    const jd = jdFromMs(ms);
    const asc = ascendantSidereal(jd, lat, lon);
    const lagna = describe(asc.lon); lagna.navSign = navamsaSign(asc.lon);
    const planets = BODIES.map(key => {
      const l = siderealLon(key, jd);
      const d = describe(l);
      return Object.assign({ key, retro: isRetro(key, jd), dignity: dignity(key, d.sign), house: houseOf(d.sign, lagna.sign), navSign: navamsaSign(l), navHouse: houseOf(navamsaSign(l), lagna.navSign), signLord: SIGN_LORDS[d.sign] }, d);
    });
    const moon = planets.find(p => p.key === 'Moon'), sun = planets.find(p => p.key === 'Sun');
    const localWeekday = new Date(new Date(Date.UTC(2000, month - 1, day)).setUTCFullYear(year)).getUTCDay();
    return {
      input: inp, jd, utcMs: ms, offsetMin, ayanamsa: ayanamsa(jd),
      lagna: Object.assign({ signLord: SIGN_LORDS[lagna.sign] }, lagna),
      planets,
      houses: Array.from({ length: 12 }, (_, i) => ({ house: i + 1, sign: (lagna.sign + i) % 12, signName: SIGNS[(lagna.sign + i) % 12], lord: SIGN_LORDS[(lagna.sign + i) % 12] })),
      dasha: vimshottari(moon.lon, ms),
      panchang: panchang(sun.lon, moon.lon, localWeekday),
      yogas: analyse(planets, lagna.sign)
    };
  }

  // ---------- Transits (Gochar) & Sade Sati ----------
  function computeGochar(chart, whenMs) {
    const ms = whenMs != null ? whenMs : Date.now(), jd = jdFromMs(ms);
    const moonSign = chart.planets.find(p => p.key === 'Moon').sign;
    const planets = BODIES.map(key => {
      const d = describe(siderealLon(key, jd));
      return Object.assign({ key, retro: isRetro(key, jd), fromLagna: houseOf(d.sign, chart.lagna.sign), fromMoon: houseOf(d.sign, moonSign) }, d);
    });
    const sat = planets.find(p => p.key === 'Saturn');
    let sadeSati = 'Not running';
    if ([12, 1, 2].includes(sat.fromMoon)) sadeSati = `Sade Sati running — ${{12:'first phase (Saturn in 12th from Moon)',1:'peak phase (Saturn over natal Moon sign)',2:'last phase (Saturn in 2nd from Moon)'}[sat.fromMoon]}`;
    else if (sat.fromMoon === 4) sadeSati = 'Kantaka Shani (Saturn in 4th from Moon) running';
    else if (sat.fromMoon === 8) sadeSati = 'Ashtama Shani (Saturn in 8th from Moon) running';
    return { ms, planets, sadeSati };
  }

  return { vargaSign, VARGA_NAMES, VARGA_USE, CLASSICAL_VARGAS, computeChart, computeGochar, siderealLon, tropical: { sun: sunTropical, moon: moonTropical }, ayanamsa, jdFromMs, localToUtcMs, tzOffsetAt, SIGNS, SIGNS_SA, SIGN_LORDS, NAKSHATRAS, DASHA_YEARS, BODIES };
});
