/* Placement-based readings: planets by sign/house/dignity/aspects, houses by lord and occupants, transits by house.
 * Rule-based text built from classical significations. For reflection, not a professional consultation. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('./predict.js'), require('./bala.js'));
  else root.Reading = factory(root.VedicEngine, root.Predict, root.Bala);
})(typeof self !== 'undefined' ? self : this, function (E, P, B) {
  const ord = P.ord, HT = P.HOUSE_THEME;
  const PH = {
    Sun: ['strong sense of self, vitality and leadership; can be proud','family wealth and speech in focus; authority in money matters, sharp tone','courage, initiative and a strong will; self-effort pays off','pride in home and roots; comfort or the bond with the mother needs care','intelligence, creativity and leadership in learning; children need attention','victory over rivals, disciplined service and good stamina','a dominant partner or partnership ego; marriage needs shared authority','intense, researching nature; sudden changes in status and vitality swings','faith, mentors and fortune linked to father figures; principled, may question tradition','strong career drive, status and leadership; a classically favourable placement','gains through influential networks; ambitious and goal-achieving','a quiet, inward or foreign-linked life; expenses and a need for solitude'],
    Moon: ['sensitive, adaptable and expressive; moods show on the face','family attachment, fluctuating finances, soothing speech and love of food','imaginative communicator, short travel and a close bond with siblings','deep attachment to home and mother; peace through a settled home','creative, emotionally intelligent and affectionate with children; romantic','emotional stress around work or health; suited to caring work; needs routine','caring and emotionally tied to partners; marriage shapes the mind','intuitive and emotionally intense; mental ups and downs and hidden worries','devotional and philosophical; loves travel and teachers; luck through the mother','public life, popularity and careers that deal with people or care','gains through friends, women and the public; wishes get fulfilled','vivid inner life, dreams, foreign settlement and spending on comfort'],
    Mars: ['bold, energetic and competitive; short-tempered; injuries possible','blunt speech, family friction and earning through effort','excellent courage, stamina and initiative; sporty or technical skills','restless home life; pushes for property and vehicles; heat in the heart','sharp, competitive mind and passionate romance; caution with speculation','defeats enemies; high stamina and success in competition and service','passionate, argumentative partnerships; the classical Manglik placement','daring research and surgical energy; care needed with accidents; Manglik','bold pursuit of dharma and goals; may clash with teachers or father','ambitious, action-oriented career in technical, defence or sports fields','strong gains through drive and courage in competitive circles','hidden anger, foreign or secluded settings and spending on conflict'],
    Mercury: ['quick, curious and youthful; talkative with a gift for learning','excellent speech and business sense; family wealth through intellect','skilful writer, communicator and trader; many short journeys','learning at home and a comfortable education; analytical about property','sharp intellect, good for study, advice and creative problem solving','analytical; good at service, accounts and health analysis','communicative partnerships and business partners; a youthful spouse','research mind with interest in finance or the occult; secretive thinking','broad learning, teaching and publishing; interest in philosophy and travel','success in business, communication, media or analysis','gains through trade, networks and clever ideas','imaginative mind; foreign work or background research; overthinking at night'],
    Jupiter: ['wise, optimistic and respected; a protective influence on health and character','rich speech, family blessings and accumulated wealth','supportive siblings; learning through effort and writing','inner contentment, home comfort, education and a good bond with the mother','excellent for children, wisdom, teaching and good judgement','success over obstacles through ethics; watch weight, liver and debts','wise, supportive partners and good partnerships','longevity, research and inheritance; spiritual depth after setbacks','luck, dharma, teachers and fortune; a very strong placement','respected status, an ethical career, advisory or teaching roles','abundant gains, fulfilled desires and supportive networks','spiritual inclination, foreign settlement and charity; gains through retreat'],
    Venus: ['charming, attractive and artistic; loves comfort and harmony','wealth, sweet speech, love of food, art and family harmony','creative talent and artistic hobbies; pleasant with siblings','a beautiful home, vehicles, comforts and a happy domestic life','romantic and creative; joy through children','service in beauty or the arts; relationship or health friction; watch indulgence','loving, attractive partners; harmonious marriage and business','intense relationships, sudden gains or inheritance; secrets in love','cultured, devotional and fortunate in love and travel','success in the arts, luxury, beauty or finance; a charming professional image','financial gains, fulfilled pleasures and many friends','bed pleasures, foreign comforts and spending on luxury; spiritual romance'],
    Saturn: ['serious, disciplined and mature early; health and energy need pacing','frugal, measured speech; slow but steady wealth; family responsibilities','persevering and hardworking; courage through effort','restricted comfort early and responsibility at home; late-life stability','careful or delayed matters with children; serious about studies','overcomes enemies through patience; excellent for service and routine','delayed or mature partnerships; a responsible, loyal spouse','long life, endurance and research; chronic worries and hidden obstacles','a disciplined belief system and delayed fortune; strict teachers or father themes','a slow, steady rise; authority through persistent work','steady, long-term gains; older or serious friends','isolation, expenses, foreign work or spiritual discipline; protect sleep'],
    Rahu: ['unconventional, ambitious personality; shifting identity and a magnetic presence','unusual speech or family background; sudden finances; watch diet','bold, tech-savvy and strong in media and communication','restless home life; foreign or unusual residence; mental unrest','unconventional intellect and speculation; an unusual approach to children','wins against rivals; success in competitive or foreign service','unconventional or foreign-linked partnerships; intense attraction','sudden transformations and interest in research or the occult; hidden fears','unorthodox beliefs, foreign travel and teachers','an ambitious public career in technology, politics or foreign links','big material gains and influential networks','foreign settlement, vivid dreams and spiritual seeking; hidden expenses'],
    Ketu: ['detached, intuitive and introspective; a unique self-image','reserved speech and detachment from wealth; family patterns to unlearn','quietly courageous with a spiritual practice and strong will','detachment from home or mother; peace through spiritual practice','intuitive, spiritual intelligence; an unusual path with children or studies','victory over enemies and illness through detachment','karmic or detached partnerships; needs clarity in relationships','deep research, mystic insight and interest in the occult','a spiritual seeker detached from ritual; past-life wisdom','unconventional work and detachment from status; research or healing','quiet gains and spiritual friends','liberation, meditation and a secluded or foreign life']
  };
  const HTYPE = h => [1, 4, 7, 10].includes(h) ? 'kendra (angular, strong)' : [5, 9].includes(h) ? 'trikona (fortunate)' : [6, 8, 12].includes(h) ? 'dusthana (challenging)' : [3, 11].includes(h) ? 'upachaya (improves with time)' : 'neutral house';
  const COMBUST = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };
  const SPECIAL = { Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10] };
  const join = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

  function aspectsOn(chart, sign) { // planets whose sign-aspect falls on this sign
    return chart.planets.filter(p => {
      if (['Rahu', 'Ketu'].includes(p.key)) return false;
      const hs = ((sign - p.sign + 12) % 12) + 1;
      return hs !== 1 && (SPECIAL[p.key] || [7]).includes(hs);
    }).map(p => p.key);
  }
  function signRelation(key, sign) {
    const lord = E.SIGN_LORDS[sign];
    if (lord === key) return 'its own sign';
    if (['Rahu', 'Ketu'].includes(key)) return `the sign of ${lord}`;
    return B.FRIENDS[key].includes(lord) ? `a friend's sign (${lord})` : B.ENEMIES[key].includes(lord) ? `an enemy's sign (${lord})` : `a neutral sign (${lord})`;
  }

  function planets(chart) {
    const S = P.planetStrength(chart), AV = B.ashtakavarga(chart), sun = chart.planets.find(p => p.key === 'Sun');
    return chart.planets.map(p => {
      const st = S[p.key], parts = [];
      const lord = chart.houses[p.house - 1].lord;
      parts.push({ h: 'Placement', t: `${p.key} is in ${p.signName} (${signRelation(p.key, p.sign)}) in the ${ord(p.house)} house, a ${HTYPE(p.house)}. The house stands for ${HT[p.house]}.` });
      parts.push({ h: 'Meaning', t: `In this house: ${PH[p.key][p.house - 1]}.` });
      const cond = [];
      if (p.dignity) cond.push(p.dignity === 'Exalted' ? 'exalted, which strengthens these results strongly' : p.dignity === 'Own sign' ? 'in its own sign, which gives stability and confidence' : 'debilitated, so results come with extra effort and may be delayed');
      if (p.retro && !['Rahu', 'Ketu'].includes(p.key)) cond.push('retrograde, so its energy turns inward, results tend to be slower and revisited');
      const cd = COMBUST[p.key]; if (cd && Math.abs(((p.lon - sun.lon + 540) % 360) - 180) < cd) cond.push(`close to the Sun (within ${cd}°), which can dim its independent expression (combust)`);
      if (cond.length) parts.push({ h: 'Condition', t: `${p.key} is ${join(cond)}.` });
      const mates = chart.planets.filter(q => q.key !== p.key && q.sign === p.sign).map(q => q.key);
      const asp = aspectsOn(chart, p.sign).filter(k => k !== p.key);
      if (mates.length || asp.length) parts.push({ h: 'Influences', t: `${mates.length ? 'Shares the sign with ' + join(mates) + '. ' : ''}${asp.length ? 'Receives the aspect of ' + join(asp) + '.' : ''}` });
      if (st.owned.length) parts.push({ h: 'Rulership', t: `Rules the ${join(st.owned.map(ord))} house (${join(st.owned.map(o => HT[o]))}), so those matters are tied to the ${ord(p.house)} house themes.` });
      else parts.push({ h: 'Rulership', t: `Has no sign of its own, so it acts through its sign lord ${E.SIGN_LORDS[p.sign]}, placed in the ${ord(chart.planets.find(q => q.key === E.SIGN_LORDS[p.sign]).house)} house.` });
      parts.push({ h: 'Nakshatra', t: `${p.nakshatra}, pada ${p.pada}, ruled by ${p.nakLord}.` });
      if (AV.bav[p.key]) { const b = AV.bav[p.key].signs[p.sign]; parts.push({ h: 'Ashtakavarga', t: `Holds ${b} of 8 bindus in ${p.signName} (${b >= 5 ? 'a supportive placement' : b === 4 ? 'average support' : 'low support, so effort is needed'}); the sign has ${AV.sav[p.sign]} Sarva bindus.` }); }
      return { key: p.key, sign: p.signName, house: p.house, strength: st.label, score: st.score, parts, headline: `${p.key} in ${p.signName}, ${ord(p.house)} house` };
    });
  }

  function houses(chart) {
    const S = P.planetStrength(chart), AV = B.ashtakavarga(chart);
    return chart.houses.map(h => {
      const lord = chart.planets.find(p => p.key === h.lord), occ = chart.planets.filter(p => p.house === h.house).map(p => p.key);
      const asp = aspectsOn(chart, h.sign);
      const sav = AV.sav[h.sign];
      const lh = lord.house;
      const t = [`${ord(h.house)} house (${HT[h.house]}) falls in ${h.signName}, ruled by ${h.lord}.`,
        `${h.lord} sits in the ${ord(lh)} house${lord.dignity ? ' (' + lord.dignity.toLowerCase() + ')' : ''}${lh === h.house ? '' : ', linking ' + HT[h.house].split(',')[0] + ' with ' + HT[lh].split(',')[0]}.${lh === h.house ? ' The lord is in its own house, which protects this area.' : [6, 8, 12].includes(lh) ? ' A lord in a difficult house asks for patience in this area.' : [1, 4, 5, 7, 9, 10].includes(lh) ? ' A lord in a kendra or trikona supports this area.' : ''}`,
        occ.length ? `Occupied by ${join(occ)}.` : 'No planet sits here, so the lord\'s placement decides the results.',
        asp.length ? `Aspected by ${join(asp)}.` : '',
        `Sarvashtakavarga: ${sav} bindus (${sav >= 30 ? 'strong' : sav >= 28 ? 'supportive' : sav >= 25 ? 'average' : 'needs effort'}).`];
      return { house: h.house, sign: h.signName, lord: h.lord, sav, text: t.filter(Boolean).join(' '), tone: sav >= 28 ? 'good' : sav >= 25 ? 'mid' : 'bad' };
    });
  }

  function transits(chart, g) {
    const AV = B.ashtakavarga(chart);
    return g.planets.map(p => {
      const bind = AV.bav[p.key] ? AV.bav[p.key].signs[p.sign] : null;
      let moonNote = '';
      if (p.key === 'Jupiter') moonNote = P.JUP[p.fromMoon] >= 1 ? ' From your Moon this is a favourable Jupiter transit.' : P.JUP[p.fromMoon] < 0 ? ' From your Moon this is a testing Jupiter transit.' : ' From your Moon this is a neutral Jupiter transit.';
      if (p.key === 'Saturn') moonNote = P.SAT[p.fromMoon] >= 1 ? ' From your Moon this is a favourable Saturn transit.' : P.SAT[p.fromMoon] <= -0.8 ? ' From your Moon this is a demanding Saturn transit.' : ' From your Moon this is a moderate Saturn transit.';
      const nm = E.vargaSign(p.lon, 9);
      return { key: p.key, headline: `${p.key} in ${p.signName} ${Math.floor(p.deg)}°, Navamsa ${E.SIGNS[nm]}`,
        text: `Transiting your ${ord(p.fromLagna)} house (${HT[p.fromLagna]}) and the ${ord(p.fromMoon)} house from your Moon. Activates: ${PH[p.key][p.fromLagna - 1]}.${moonNote}${bind != null ? ` Ashtakavarga support in this sign: ${bind}/8 (${bind >= 5 ? 'favourable' : bind === 4 ? 'neutral' : 'testing'}).` : ''}${p.retro && !['Rahu', 'Ketu'].includes(p.key) ? ' Currently retrograde, so themes are revisited.' : ''}`,
        tone: bind == null ? 'mid' : bind >= 5 ? 'good' : bind === 4 ? 'mid' : 'bad' };
    });
  }
  return { planets, houses, transits, PH, aspectsOn, HTYPE, signRelation, join };
});
