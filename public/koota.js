/* Ashtakoota (Guna Milan) — 36-point Vedic marriage matching, plus Manglik comparison.
 * Moon-sign / nakshatra based. Tables follow the commonly published rules; sources differ in small details
 * (Vashya, Gana direction, Yoni), and the UI says so. Pure functions, no DOM.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.Koota = factory(root.VedicEngine);
})(typeof self !== 'undefined' ? self : this, function (E) {
  const SIGNS = E.SIGNS, LORD = E.SIGN_LORDS;

  // ---- nakshatra tables (index 0 = Ashwini) ----
  const YONI = [['Horse','M'],['Elephant','M'],['Sheep','F'],['Serpent','M'],['Serpent','F'],['Dog','F'],['Cat','F'],['Sheep','M'],['Cat','M'],['Rat','M'],['Rat','F'],['Cow','M'],['Buffalo','F'],['Tiger','F'],['Buffalo','M'],['Tiger','M'],['Deer','F'],['Deer','M'],['Dog','M'],['Monkey','M'],['Mongoose','M'],['Monkey','F'],['Lion','F'],['Horse','F'],['Lion','M'],['Cow','F'],['Elephant','F']];
  const GANA = ['Deva','Manushya','Rakshasa','Manushya','Deva','Manushya','Deva','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva','Rakshasa','Deva','Rakshasa','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva'];
  const NADI = ['Aadi','Madhya','Antya','Antya','Madhya','Aadi','Aadi','Madhya','Antya','Antya','Madhya','Aadi','Aadi','Madhya','Antya','Antya','Madhya','Aadi','Aadi','Madhya','Antya','Antya','Madhya','Aadi','Aadi','Madhya','Antya'];
  const ENEMY = [['Horse','Buffalo'],['Elephant','Lion'],['Sheep','Monkey'],['Serpent','Mongoose'],['Dog','Deer'],['Cat','Rat'],['Cow','Tiger']];
  const VARNA_OF = [3,2,1,4,3,2,1,4,3,2,1,4]; // Aries..Pisces: 4 Brahmin, 3 Kshatriya, 2 Vaishya, 1 Shudra
  const VARNA_NAME = { 4: 'Brahmin', 3: 'Kshatriya', 2: 'Vaishya', 1: 'Shudra' };
  const VASHYA_CLASSES = ['Chatushpad', 'Dwipad', 'Jalachar', 'Vanchar', 'Keet'];
  const VASHYA_M = [[2,1,1,0.5,1],[1,2,0.5,0,1],[1,0.5,2,1,1],[0,0,0,2,0],[1,1,1,0,2]]; // [bride][groom]
  const GANA_IDX = { Deva: 0, Manushya: 1, Rakshasa: 2 };
  const GANA_M = [[6,5,1],[6,6,0],[0,0,6]]; // [bride][groom]
  // natural planetary friendship (Parashari)
  const FR = { Sun:'Moon Mars Jupiter', Moon:'Sun Mercury', Mars:'Sun Moon Jupiter', Mercury:'Sun Venus', Jupiter:'Sun Moon Mars', Venus:'Mercury Saturn', Saturn:'Mercury Venus' };
  const EN = { Sun:'Venus Saturn', Moon:'', Mars:'Mercury', Mercury:'Moon', Jupiter:'Mercury Venus', Venus:'Sun Moon', Saturn:'Sun Moon Mars' };
  const rel = (a, b) => a === b ? 'same' : FR[a].split(' ').includes(b) ? 'friend' : EN[a].split(' ').includes(b) ? 'enemy' : 'neutral';

  function vashyaClass(sign, deg) {
    if (sign === 8) return deg < 15 ? 'Dwipad' : 'Chatushpad';
    if (sign === 9) return deg < 15 ? 'Chatushpad' : 'Jalachar';
    return ['Chatushpad','Chatushpad','Dwipad','Jalachar','Vanchar','Dwipad','Dwipad','Keet','','','Dwipad','Jalachar'][sign];
  }
  function moonInfo(chart) {
    const m = chart.planets.find(p => p.key === 'Moon');
    return { sign: m.sign, signName: m.signName, deg: m.deg, nak: m.nakIndex, nakName: m.nakshatra, pada: m.pada, lord: LORD[m.sign],
      yoni: YONI[m.nakIndex][0], yoniSex: YONI[m.nakIndex][1], gana: GANA[m.nakIndex], nadi: NADI[m.nakIndex], varna: VARNA_OF[m.sign], vashya: vashyaClass(m.sign, m.deg) };
  }
  const isEnemyPair = (a, b) => ENEMY.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const manglik = chart => { const y = chart.yogas.find(x => /Manglik/.test(x.name)); return { present: !!(y && y.present), detail: y ? y.detail : '' }; };

  /** bride, groom: charts. Returns the 8 kootas, total and verdict. */
  function match(brideChart, groomChart) {
    const B = moonInfo(brideChart), G = moonInfo(groomChart), K = [];
    // 1 Varna (max 1): groom's varna should be equal or higher
    K.push({ key: 'Varna', max: 1, got: G.varna >= B.varna ? 1 : 0, bride: VARNA_NAME[B.varna], groom: VARNA_NAME[G.varna], means: 'Work temperament and ego compatibility' });
    // 2 Vashya (max 2)
    K.push({ key: 'Vashya', max: 2, got: VASHYA_M[VASHYA_CLASSES.indexOf(B.vashya)][VASHYA_CLASSES.indexOf(G.vashya)], bride: B.vashya, groom: G.vashya, means: 'Mutual attraction and who leads' });
    // 3 Tara (max 3)
    const tcount = (a, b) => ((b - a + 27) % 27) + 1, bad = n => [3, 5, 7].includes(n % 9);
    const t1 = tcount(B.nak, G.nak), t2 = tcount(G.nak, B.nak), tb1 = bad(t1), tb2 = bad(t2);
    K.push({ key: 'Tara', max: 3, got: (!tb1 ? 1.5 : 0) + (!tb2 ? 1.5 : 0), bride: `count ${t1}${tb1 ? ' (inauspicious)' : ''}`, groom: `count ${t2}${tb2 ? ' (inauspicious)' : ''}`, means: 'Health and well-being of the couple (birth-star harmony)' });
    // 4 Yoni (max 4) — simplified
    const same = B.yoni === G.yoni, enemy = isEnemyPair(B.yoni, G.yoni);
    K.push({ key: 'Yoni', max: 4, got: same ? 4 : enemy ? 0 : 2, bride: `${B.yoni} (${B.yoniSex === 'F' ? 'female' : 'male'})`, groom: `${G.yoni} (${G.yoniSex === 'F' ? 'female' : 'male'})`, means: 'Physical and instinctive compatibility', note: 'Simplified: same animal 4, sworn enemies 0, others 2.' });
    // 5 Graha Maitri (max 5)
    const r1 = rel(B.lord, G.lord), r2 = rel(G.lord, B.lord); let gm;
    if (r1 === 'same' || (r1 === 'friend' && r2 === 'friend')) gm = 5;
    else if ((r1 === 'friend' && r2 === 'neutral') || (r1 === 'neutral' && r2 === 'friend')) gm = 4;
    else if (r1 === 'neutral' && r2 === 'neutral') gm = 3;
    else if ((r1 === 'friend' && r2 === 'enemy') || (r1 === 'enemy' && r2 === 'friend')) gm = 1;
    else if ((r1 === 'neutral' && r2 === 'enemy') || (r1 === 'enemy' && r2 === 'neutral')) gm = 0.5;
    else gm = 0;
    K.push({ key: 'Graha Maitri', max: 5, got: gm, bride: `${B.signName} (lord ${B.lord})`, groom: `${G.signName} (lord ${G.lord})`, means: 'Mental wavelength and friendship' });
    // 6 Gana (max 6)
    K.push({ key: 'Gana', max: 6, got: GANA_M[GANA_IDX[B.gana]][GANA_IDX[G.gana]], bride: B.gana, groom: G.gana, means: 'Temperament and nature', note: 'Published tables differ on which partner\'s class is read first.' });
    // 7 Bhakoot (max 7)
    const d = ((G.sign - B.sign + 12) % 12) + 1, bdName = { 2: 'Dwirdwadash (2/12)', 12: 'Dwirdwadash (2/12)', 5: 'Navapancham (5/9)', 9: 'Navapancham (5/9)', 6: 'Shadashtak (6/8)', 8: 'Shadashtak (6/8)' }[d];
    K.push({ key: 'Bhakoot', max: 7, got: bdName ? 0 : 7, bride: B.signName, groom: G.signName, means: 'Emotional bond, family welfare and prosperity', dosha: bdName || null });
    // 8 Nadi (max 8)
    K.push({ key: 'Nadi', max: 8, got: B.nadi === G.nadi ? 0 : 8, bride: B.nadi, groom: G.nadi, means: 'Health, genes and progeny', dosha: B.nadi === G.nadi ? 'Same Nadi' : null });

    const total = K.reduce((a, k) => a + k.got, 0);
    const verdict = total >= 33 ? 'Excellent' : total >= 25 ? 'Very good' : total >= 18 ? 'Acceptable' : 'Below the usual minimum';

    // cancellations (commonly cited)
    const notes = [], lordsOk = B.lord === G.lord || (r1 === 'friend' && r2 === 'friend');
    const bk = K[6], nd = K[7];
    if (bk.dosha) notes.push({ kind: lordsOk ? 'ok' : 'warn', text: `Bhakoot dosha (${bk.dosha}). ` + (lordsOk ? 'It is commonly considered cancelled because the two Moon-sign lords are the same or mutual friends.' : 'The two Moon-sign lords are not mutual friends, so no cancellation applies.') });
    if (nd.dosha) {
      const canc = B.sign === G.sign && B.nak !== G.nak ? 'the Moon signs are the same but the nakshatras differ' : B.nak === G.nak && B.pada !== G.pada ? 'the nakshatra is the same but the padas differ' : B.nak !== G.nak && LORD[B.sign] === LORD[G.sign] ? 'the Moon signs share the same lord with different nakshatras' : null;
      notes.push({ kind: canc ? 'ok' : 'warn', text: 'Nadi dosha (both on the ' + B.nadi + ' Nadi). ' + (canc ? `It is often considered reduced because ${canc}.` : 'No common cancellation rule applies; many traditions give this the greatest weight.') });
    }
    if (K[5].got === 0) notes.push({ kind: 'warn', text: 'Gana scores 0 (' + B.gana + ' with ' + G.gana + '): the two temperaments may clash unless other factors are strong.' });
    if (K[3].got === 0) notes.push({ kind: 'warn', text: `Yoni scores 0: ${B.yoni} and ${G.yoni} are traditional enemies, which is read as a physical or instinctive mismatch.` });
    if (!notes.length) notes.push({ kind: 'ok', text: 'No Bhakoot or Nadi dosha, and no zero in Gana or Yoni.' });

    // Manglik
    const mb = manglik(brideChart), mg = manglik(groomChart);
    const mm = mb.present === mg.present ? (mb.present ? { kind: 'ok', text: 'Both charts carry Mangal dosha. The traditional view is that the two cancel each other.' } : { kind: 'ok', text: 'Neither chart has Mangal dosha.' })
      : { kind: 'warn', text: `Only the ${mb.present ? 'bride' : 'groom'}'s chart has Mangal dosha. Traditionally this calls for closer reading of Mars placement, strength and the 7th house in both charts.` };
    return { kootas: K, total, max: 36, verdict, notes, manglik: { bride: mb, groom: mg, result: mm }, bride: B, groom: G };
  }

  return { match, moonInfo, YONI, GANA, NADI, VASHYA_M, VASHYA_CLASSES, GANA_M, ENEMY, rel };
});
