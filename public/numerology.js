/* Numerology: Pythagorean core numbers + Indian (Mulank / Bhagyank) + Chaldean name number + Lo Shu grid.
 * Pure functions, no DOM. Numerology is a symbolic tradition, not a measurement; the UI says so.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Numerology = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const PY = {}; 'AJS'.split('').forEach(c => PY[c] = 1); 'BKT'.split('').forEach(c => PY[c] = 2); 'CLU'.split('').forEach(c => PY[c] = 3); 'DMV'.split('').forEach(c => PY[c] = 4);
  'ENW'.split('').forEach(c => PY[c] = 5); 'FOX'.split('').forEach(c => PY[c] = 6); 'GPY'.split('').forEach(c => PY[c] = 7); 'HQZ'.split('').forEach(c => PY[c] = 8); 'IR'.split('').forEach(c => PY[c] = 9);
  const CH = {}; 'AIJQY'.split('').forEach(c => CH[c] = 1); 'BKR'.split('').forEach(c => CH[c] = 2); 'CGLS'.split('').forEach(c => CH[c] = 3); 'DMT'.split('').forEach(c => CH[c] = 4);
  'EHNX'.split('').forEach(c => CH[c] = 5); 'UVW'.split('').forEach(c => CH[c] = 6); 'OZ'.split('').forEach(c => CH[c] = 7); 'FP'.split('').forEach(c => CH[c] = 8);
  const digitSum = n => String(Math.abs(n)).split('').reduce((a, d) => a + +d, 0);
  const reduce = (n, keepMaster) => { while (n > 9 && !(keepMaster && (n === 11 || n === 22 || n === 33))) n = digitSum(n); return n; };
  const clean = s => (s || '').toUpperCase().replace(/[^A-Z]/g, '');
  const sumLetters = (s, map, only) => clean(s).split('').filter(c => !only || only(c)).reduce((a, c) => a + (map[c] || 0), 0);
  const isVowel = c => 'AEIOU'.includes(c);

  const PLANET = { 1: 'Sun', 2: 'Moon', 3: 'Jupiter', 4: 'Rahu', 5: 'Mercury', 6: 'Venus', 7: 'Ketu', 8: 'Saturn', 9: 'Mars' };
  const LUCKY = {
    1: { day: 'Sunday', colour: 'gold, orange, warm yellow', gem: 'Ruby (traditional)', friends: [1, 2, 3, 9], metal: 'Gold' },
    2: { day: 'Monday', colour: 'white, cream, silver', gem: 'Pearl (traditional)', friends: [1, 2, 5], metal: 'Silver' },
    3: { day: 'Thursday', colour: 'yellow, saffron', gem: 'Yellow sapphire (traditional)', friends: [1, 2, 3, 9], metal: 'Gold' },
    4: { day: 'Saturday / Sunday', colour: 'blue, grey, earthy shades', gem: 'Hessonite (traditional)', friends: [1, 5, 6, 7, 8], metal: 'Iron' },
    5: { day: 'Wednesday', colour: 'green, light grey', gem: 'Emerald (traditional)', friends: [1, 4, 5, 6], metal: 'Bronze' },
    6: { day: 'Friday', colour: 'white, pink, pastels', gem: 'Diamond / white sapphire (traditional)', friends: [3, 5, 6, 8, 9], metal: 'Silver' },
    7: { day: 'Monday / Sunday', colour: 'light green, white, smoky shades', gem: 'Cat\'s eye (traditional)', friends: [1, 2, 4, 5, 6], metal: 'Silver' },
    8: { day: 'Saturday', colour: 'dark blue, black, charcoal', gem: 'Blue sapphire (traditional)', friends: [3, 4, 5, 6, 8], metal: 'Iron' },
    9: { day: 'Tuesday', colour: 'red, crimson, maroon', gem: 'Red coral (traditional)', friends: [1, 2, 3, 6, 9], metal: 'Copper' }
  };
  const MEAN = {
    1: ['Leader', 'Independent, original, ambitious. Likes to start things and be in charge.', 'Can turn stubborn, domineering or lonely at the top.'],
    2: ['Peacemaker', 'Sensitive, cooperative, diplomatic. Works well with others and notices feelings.', 'Can be over-dependent, indecisive or easily hurt.'],
    3: ['Communicator', 'Expressive, creative, sociable and optimistic. Good with words and ideas.', 'Can scatter energy or avoid depth.'],
    4: ['Builder', 'Practical, disciplined, reliable. Builds systems and finishes what is started.', 'Can be rigid, overly cautious or workaholic.'],
    5: ['Explorer', 'Adaptable, curious, energetic. Thrives on variety, travel and change.', 'Can be restless, impulsive or inconsistent.'],
    6: ['Nurturer', 'Caring, responsible, family-minded. Brings harmony, beauty and service.', 'Can over-give, control through care or take on others\' burdens.'],
    7: ['Seeker', 'Analytical, reflective, spiritual. Needs solitude and depth, and is drawn to research.', 'Can be withdrawn, sceptical or hard to read.'],
    8: ['Achiever', 'Driven, organised, strong in business, money and authority.', 'Can overwork, chase status or be rigid about control.'],
    9: ['Humanitarian', 'Compassionate, idealistic, generous. Thinks of the bigger picture.', 'Can be emotionally scattered or struggle to let go.'],
    11: ['Master Intuitive (11)', 'Highly intuitive and inspiring, a 2 with a stronger current of insight.', 'Nervous tension and self-doubt are the usual cost.'],
    22: ['Master Builder (22)', 'Turns big visions into concrete results; a 4 with larger scale.', 'Pressure to achieve can feel heavy.'],
    33: ['Master Teacher (33)', 'Selfless, healing, guiding; a 6 with a wider reach.', 'Risk of carrying too much for others.']
  };
  const LOSHU_MEAN = { 1: 'communication and self-expression', 2: 'intuition and sensitivity', 3: 'imagination and creativity', 4: 'discipline and practicality', 5: 'balance, adaptability and the will to act', 6: 'responsibility, harmony and family', 7: 'inner life and analysis', 8: 'ambition, endurance and management of resources', 9: 'idealism and drive to complete things' };
  const LOSHU_ROWS = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
  const KARMIC = { 13: 'Karmic debt 13: learn through steady effort; avoid shortcuts.', 14: 'Karmic debt 14: learn moderation and freedom without excess.', 16: 'Karmic debt 16: ego is tested; humility and rebuilding after setbacks.', 19: 'Karmic debt 19: learn to give and receive help; self-reliance without isolation.' };

  /** input: {name, day, month, year}; opts: {now: Date} */
  function report(input, opts) {
    const now = (opts && opts.now) || new Date(), { day, month, year } = input, name = input.name || '';
    const lpRaw = reduce(day, true) + reduce(month, true) + reduce(year, true);
    const lifePath = reduce(lpRaw, true);
    const total = sumLetters(name, PY), vow = sumLetters(name, PY, isVowel), con = sumLetters(name, PY, c => !isVowel(c));
    const hasName = clean(name).length > 0;
    const expression = hasName ? reduce(total, true) : null, soul = hasName ? reduce(vow, true) : null, pers = hasName ? reduce(con, true) : null;
    const maturity = hasName ? reduce(lifePath + expression, true) : null;
    const birthday = reduce(day, true);
    const mulank = reduce(day, false), bhagyank = reduce(digitSum(day) + digitSum(month) + digitSum(year), false);
    const chRaw = sumLetters(name, CH), chaldean = hasName ? reduce(chRaw, false) : null;
    const py = reduce(reduce(day, false) + reduce(month, false) + reduce(now.getFullYear(), false), false);
    const pm = reduce(py + reduce(now.getMonth() + 1, false), false);
    const pyNext = reduce(reduce(day, false) + reduce(month, false) + reduce(now.getFullYear() + 1, false), false);
    const digits = (String(day) + String(month) + String(year)).split('').map(Number).filter(d => d > 0);
    const counts = {}; for (let i = 1; i <= 9; i++) counts[i] = digits.filter(d => d === i).length;
    const missing = Object.keys(counts).map(Number).filter(i => !counts[i]);
    const compounds = [lpRaw, total, chRaw].filter(n => KARMIC[n]);
    return { lifePath, lifePathRaw: lpRaw, expression, soul, personality: pers, maturity, birthday, mulank, bhagyank, chaldean, chaldeanRaw: chRaw, personalYear: py, personalYearNext: pyNext, personalMonth: pm,
      year: now.getFullYear(), counts, missing, hasName, karmic: [...new Set(compounds)].map(n => KARMIC[n]), digits };
  }
  const PYEAR = { 1: 'A year to begin: new projects, decisions and independence.', 2: 'A year to cooperate: patience, partnerships and detail.', 3: 'A year to express: creativity, social life and visibility.', 4: 'A year to build: structure, work and health routines.', 5: 'A year of change: movement, variety and unexpected openings.', 6: 'A year of responsibility: family, home and commitments.', 7: 'A year to turn inward: study, rest and reflection.', 8: 'A year of results: career, money and authority.', 9: 'A year to complete: closing cycles, releasing what has run its course.' };

  return { report, reduce, MEAN, PLANET, LUCKY, LOSHU_MEAN, LOSHU_ROWS, PYEAR, PY, CH };
});
