// Called from make-pages.js. Builds the Learn section: /learn (hub), one static article per zodiac sign, and /about.
// Article text lives in learn-signs-1.js, learn-signs-2.js and learn-about.js. Everything here is plain HTML, no scripts needed to read it.
const fs = require('fs'), path = require('path');
const SIGNS = [
  { key: 'aries', en: 'Aries', sa: 'Mesha', glyph: '♈︎', sym: 'the Ram', el: 'Fire', q: 'Movable', ruler: 'Mars', start: 'Apr 14', end: 'May 14', west: 'Taurus', westStart: 'Apr 20', body: 'head and face', ex: 'Sun is exalted here, strongest at 10°', deb: 'Saturn is debilitated here, weakest at 20°', mt: '',
    nak: [['Ashwini', 'Ketu', 'all 4 padas'], ['Bharani', 'Venus', 'all 4 padas'], ['Krittika', 'Sun', 'pada 1']] },
  { key: 'taurus', en: 'Taurus', sa: 'Vrishabha', glyph: '♉︎', sym: 'the Bull', el: 'Earth', q: 'Fixed', ruler: 'Venus', start: 'May 15', end: 'Jun 14', west: 'Gemini', westStart: 'May 21', body: 'face, throat and neck', ex: 'Moon is exalted here, strongest at 3°', deb: 'No classical planet is debilitated here', mt: 'Moon has its moolatrikona from 4° to 30°',
    nak: [['Krittika', 'Sun', 'padas 2 to 4'], ['Rohini', 'Moon', 'all 4 padas'], ['Mrigashira', 'Mars', 'padas 1 and 2']] },
  { key: 'gemini', en: 'Gemini', sa: 'Mithuna', glyph: '♊︎', sym: 'the Twins', el: 'Air', q: 'Dual', ruler: 'Mercury', start: 'Jun 15', end: 'Jul 15', west: 'Cancer', westStart: 'Jun 21', body: 'shoulders, arms, hands and lungs', ex: 'Some texts treat Rahu as exalted here, others do not', deb: 'Some texts treat Ketu as debilitated here', mt: '',
    nak: [['Mrigashira', 'Mars', 'padas 3 and 4'], ['Ardra', 'Rahu', 'all 4 padas'], ['Punarvasu', 'Jupiter', 'padas 1 to 3']] },
  { key: 'cancer', en: 'Cancer', sa: 'Karka', glyph: '♋︎', sym: 'the Crab', el: 'Water', q: 'Movable', ruler: 'Moon', start: 'Jul 16', end: 'Aug 16', west: 'Leo', westStart: 'Jul 23', body: 'chest and stomach', ex: 'Jupiter is exalted here, strongest at 5°', deb: 'Mars is debilitated here, weakest at 28°', mt: '',
    nak: [['Punarvasu', 'Jupiter', 'pada 4'], ['Pushya', 'Saturn', 'all 4 padas'], ['Ashlesha', 'Mercury', 'all 4 padas']] },
  { key: 'leo', en: 'Leo', sa: 'Simha', glyph: '♌︎', sym: 'the Lion', el: 'Fire', q: 'Fixed', ruler: 'Sun', start: 'Aug 17', end: 'Sep 16', west: 'Virgo', westStart: 'Aug 23', body: 'heart, spine and upper back', ex: 'No classical planet is exalted here', deb: 'No classical planet is debilitated here', mt: 'Sun has its moolatrikona from 0° to 20°',
    nak: [['Magha', 'Ketu', 'all 4 padas'], ['Purva Phalguni', 'Venus', 'all 4 padas'], ['Uttara Phalguni', 'Sun', 'pada 1']] },
  { key: 'virgo', en: 'Virgo', sa: 'Kanya', glyph: '♍︎', sym: 'the Maiden', el: 'Earth', q: 'Dual', ruler: 'Mercury', start: 'Sep 17', end: 'Oct 16', west: 'Libra', westStart: 'Sep 23', body: 'digestive system and intestines', ex: 'Mercury is exalted here, strongest at 15°', deb: 'Venus is debilitated here, weakest at 27°', mt: 'Mercury has its moolatrikona from 16° to 20°',
    nak: [['Uttara Phalguni', 'Sun', 'padas 2 to 4'], ['Hasta', 'Moon', 'all 4 padas'], ['Chitra', 'Mars', 'padas 1 and 2']] },
  { key: 'libra', en: 'Libra', sa: 'Tula', glyph: '♎︎', sym: 'the Scales', el: 'Air', q: 'Movable', ruler: 'Venus', start: 'Oct 17', end: 'Nov 15', west: 'Scorpio', westStart: 'Oct 23', body: 'kidneys and lower back', ex: 'Saturn is exalted here, strongest at 20°', deb: 'Sun is debilitated here, weakest at 10°', mt: 'Venus has its moolatrikona from 0° to 15°',
    nak: [['Chitra', 'Mars', 'padas 3 and 4'], ['Swati', 'Rahu', 'all 4 padas'], ['Vishakha', 'Jupiter', 'padas 1 to 3']] },
  { key: 'scorpio', en: 'Scorpio', sa: 'Vrishchika', glyph: '♏︎', sym: 'the Scorpion', el: 'Water', q: 'Fixed', ruler: 'Mars', start: 'Nov 16', end: 'Dec 15', west: 'Sagittarius', westStart: 'Nov 22', body: 'reproductive organs and excretory system', ex: 'No classical planet is exalted here', deb: 'Moon is debilitated here, weakest at 3°', mt: '',
    nak: [['Vishakha', 'Jupiter', 'pada 4'], ['Anuradha', 'Saturn', 'all 4 padas'], ['Jyeshtha', 'Mercury', 'all 4 padas']] },
  { key: 'sagittarius', en: 'Sagittarius', sa: 'Dhanu', glyph: '♐︎', sym: 'the Archer', el: 'Fire', q: 'Dual', ruler: 'Jupiter', start: 'Dec 16', end: 'Jan 13', west: 'Capricorn', westStart: 'Dec 22', body: 'hips and thighs', ex: 'No classical planet is exalted here', deb: 'No classical planet is debilitated here', mt: 'Jupiter has its moolatrikona from 0° to 10°',
    nak: [['Mula', 'Ketu', 'all 4 padas'], ['Purva Ashadha', 'Venus', 'all 4 padas'], ['Uttara Ashadha', 'Sun', 'pada 1']] },
  { key: 'capricorn', en: 'Capricorn', sa: 'Makara', glyph: '♑︎', sym: 'the Sea-goat', el: 'Earth', q: 'Movable', ruler: 'Saturn', start: 'Jan 14', end: 'Feb 12', west: 'Aquarius', westStart: 'Jan 20', body: 'knees, bones and joints', ex: 'Mars is exalted here, strongest at 28°', deb: 'Jupiter is debilitated here, weakest at 5°', mt: '',
    nak: [['Uttara Ashadha', 'Sun', 'padas 2 to 4'], ['Shravana', 'Moon', 'all 4 padas'], ['Dhanishta', 'Mars', 'padas 1 and 2']] },
  { key: 'aquarius', en: 'Aquarius', sa: 'Kumbha', glyph: '♒︎', sym: 'the Water-bearer', el: 'Air', q: 'Fixed', ruler: 'Saturn', start: 'Feb 13', end: 'Mar 13', west: 'Pisces', westStart: 'Feb 19', body: 'calves, ankles and circulation', ex: 'No classical planet is exalted here', deb: 'No classical planet is debilitated here', mt: 'Saturn has its moolatrikona from 0° to 20°',
    nak: [['Dhanishta', 'Mars', 'padas 3 and 4'], ['Shatabhisha', 'Rahu', 'all 4 padas'], ['Purva Bhadrapada', 'Jupiter', 'padas 1 to 3']] },
  { key: 'pisces', en: 'Pisces', sa: 'Meena', glyph: '♓︎', sym: 'the Two Fish', el: 'Water', q: 'Dual', ruler: 'Jupiter', start: 'Mar 14', end: 'Apr 13', west: 'Aries', westStart: 'Mar 21', body: 'feet and lymphatic system', ex: 'Venus is exalted here, strongest at 27°', deb: 'Mercury is debilitated here, weakest at 15°', mt: '',
    nak: [['Purva Bhadrapada', 'Jupiter', 'pada 4'], ['Uttara Bhadrapada', 'Saturn', 'all 4 padas'], ['Revati', 'Mercury', 'all 4 padas']] }
];

const SGN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const LORDS=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
// key, name, deity, symbol, gana, yoni, nadi, type
const NAKS=[
['ashwini','Ashwini','Ashwini Kumaras','Horse\'s head','Deva','Horse','Adi (Vata)','Light (Kshipra)'],
['bharani','Bharani','Yama','Yoni, the womb','Manushya','Elephant','Madhya (Pitta)','Fierce (Ugra)'],
['krittika','Krittika','Agni','Razor or flame','Rakshasa','Sheep','Antya (Kapha)','Mixed (Mishra)'],
['rohini','Rohini','Brahma (Prajapati)','Cart or chariot','Manushya','Serpent','Antya (Kapha)','Fixed (Dhruva)'],
['mrigashira','Mrigashira','Soma','Deer\'s head','Deva','Serpent','Madhya (Pitta)','Soft (Mridu)'],
['ardra','Ardra','Rudra','Teardrop or diamond','Manushya','Dog','Adi (Vata)','Sharp (Tikshna)'],
['punarvasu','Punarvasu','Aditi','Quiver of arrows','Deva','Cat','Adi (Vata)','Movable (Chara)'],
['pushya','Pushya','Brihaspati','Flower or cow\'s udder','Deva','Sheep','Madhya (Pitta)','Light (Kshipra)'],
['ashlesha','Ashlesha','The Nagas','Coiled serpent','Rakshasa','Cat','Antya (Kapha)','Sharp (Tikshna)'],
['magha','Magha','The Pitris (ancestors)','Royal throne','Rakshasa','Rat','Antya (Kapha)','Fierce (Ugra)'],
['purva-phalguni','Purva Phalguni','Bhaga','Front legs of a bed','Manushya','Rat','Madhya (Pitta)','Fierce (Ugra)'],
['uttara-phalguni','Uttara Phalguni','Aryaman','Back legs of a bed','Manushya','Cow','Adi (Vata)','Fixed (Dhruva)'],
['hasta','Hasta','Savitar','Open hand','Deva','Buffalo','Adi (Vata)','Light (Kshipra)'],
['chitra','Chitra','Tvashtar (Vishvakarma)','Bright jewel','Rakshasa','Tiger','Madhya (Pitta)','Soft (Mridu)'],
['swati','Swati','Vayu','Young shoot in the wind','Deva','Buffalo','Antya (Kapha)','Movable (Chara)'],
['vishakha','Vishakha','Indra and Agni','Triumphal arch or potter\'s wheel','Rakshasa','Tiger','Antya (Kapha)','Mixed (Mishra)'],
['anuradha','Anuradha','Mitra','Lotus','Deva','Deer','Madhya (Pitta)','Soft (Mridu)'],
['jyeshtha','Jyeshtha','Indra','Round amulet or umbrella','Rakshasa','Deer','Adi (Vata)','Sharp (Tikshna)'],
['mula','Mula','Nirriti','Bunch of tied roots','Rakshasa','Dog','Adi (Vata)','Sharp (Tikshna)'],
['purva-ashadha','Purva Ashadha','Apas (the waters)','Winnowing fan','Manushya','Monkey','Madhya (Pitta)','Fierce (Ugra)'],
['uttara-ashadha','Uttara Ashadha','The Vishvedevas','Elephant\'s tusk or bed planks','Manushya','Mongoose','Antya (Kapha)','Fixed (Dhruva)'],
['shravana','Shravana','Vishnu','Ear or three footprints','Deva','Monkey','Antya (Kapha)','Movable (Chara)'],
['dhanishta','Dhanishta','The eight Vasus','Drum','Rakshasa','Lion','Madhya (Pitta)','Movable (Chara)'],
['shatabhisha','Shatabhisha','Varuna','Empty circle','Rakshasa','Horse','Adi (Vata)','Movable (Chara)'],
['purva-bhadrapada','Purva Bhadrapada','Aja Ekapada','Sword or front of a funeral cot','Manushya','Lion','Adi (Vata)','Fierce (Ugra)'],
['uttara-bhadrapada','Uttara Bhadrapada','Ahir Budhnya','Back of a funeral cot','Manushya','Cow','Madhya (Pitta)','Fixed (Dhruva)'],
['revati','Revati','Pushan','Fish or drum','Deva','Elephant','Antya (Kapha)','Soft (Mridu)']
];
const dm=d=>{const a=Math.floor(d),m=Math.round((d-a)*60);return a+'° '+(m<10?'0':'')+m+'\u2032'};
const nslug=k=>k+'-nakshatra';

const slugOf = s => s.key + '-zodiac-sign';

module.exports = function (home, H) {
  const { SITE, PUB, esc, SVG } = H;
  const CONTENT = Object.assign({}, require('./learn-signs-1.js'), require('./learn-signs-2.js'));
  const ABOUT = require('./learn-about.js');
  const urls = [];
  const wc = t => t.split(/\s+/).filter(Boolean).length;

  function shell(opts) {
    let h = home;
    const url = SITE + opts.path;
    const ld = opts.ld || [];
    h = h.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(opts.title) + '</title>')
      .replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + esc(opts.desc) + '">')
      .replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + url + '">')
      .replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + url + '">')
      .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + esc(opts.h1) + ' – AstroSarangi">')
      .replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + esc(opts.desc) + '">')
      .replace(/<meta name="keywords"[^>]*>\n?/, '')
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, ld.map(o => '<script type="application/ld+json">' + JSON.stringify(o) + '</script>').join('\n'))
      .replace('<body>', '<body class="subpage learnpage">')
      .replace(/<link rel="stylesheet" href="theme.css">/, '<link rel="stylesheet" href="theme.css">\n<link rel="stylesheet" href="pages.css">')
      .replace(/<section class="hero"[\s\S]*?<\/section>/, `<section class="pagehero"><p class="crumb">${opts.crumb}</p><h2>${esc(opts.h1)}</h2><p class="lead">${esc(opts.lead)}</p></section>`)
      .replace('<section class="card form-card" id="formCard">', '<section class="card form-card" id="formCard" hidden>');
    const i = h.indexOf('<section class="sect" id="explore">'), j = h.indexOf('</main>');
    return h.slice(0, i) + opts.body + '\n' + h.slice(j);
  }
  const write = (file, html) => fs.writeFileSync(path.join(PUB, file), html);
  const para = a => a.map(t => '<p>' + esc(t) + '</p>').join('');

  // ---- one article per sign
  const order = SIGNS.map(s => s.key);
  SIGNS.forEach((s, idx) => {
    const c = CONTENT[s.key];
    if (!c) throw new Error('Missing content for ' + s.key);
    const prev = SIGNS[(idx + 11) % 12], next = SIGNS[(idx + 1) % 12];
    const westLead = `Because the Vedic zodiac is sidereal and about 24 degrees behind the Western one, the Sun is in ${s.en} (${s.sa}) from about ${s.start} to ${s.end}. Most people born in those weeks have a Western Sun sign of ${s.west}, and only those born in the first days, up to about ${s.westStart}, would call themselves ${s.en} in the Western system. Your Vedic Sun sign, Moon sign and rising sign are best taken from a calculated chart, not from a date table.`;
    const glance = [
      ['Sanskrit name', `${s.sa} (${s.sym})`], ['Element', s.el], ['Quality', s.q], ['Ruling planet', s.ruler],
      ['Sun is in this sign', `about ${s.start} to ${s.end}`], ['Body area', s.body], ['Exaltation', s.ex], ['Debilitation', s.deb]
    ].concat(s.mt ? [['Moolatrikona', s.mt]] : []);
    const sections = [
      ['What ' + s.en + ' stands for', c.overview], ['Sun, Moon and rising sign in ' + s.en, [].concat(c.sun, c.moon, c.lagna)],
      ['Career and money', c.career], ['Love and marriage', c.love], ['Health tendencies', c.health.concat(['This is traditional symbolism for reflection only. It is not medical advice, so see a qualified doctor for any health concern.'])],
      [s.en + ' and the planets', c.planets], ['The Sun-sign dates and the Western zodiac', [westLead]]
    ];
    const text = [].concat(...sections.map(x => x[1]), c.strengths, c.cautions, c.faq.map(f => f[0] + ' ' + f[1])).join(' ');
    c._words = wc(text);
    const body = `<article class="card article">
<div class="glance"><h2>${esc(s.en)} at a glance</h2><dl>${glance.map(g => `<div><dt>${esc(g[0])}</dt><dd>${esc(g[1])}</dd></div>`).join('')}</dl></div>
${sections.slice(0, 1).map(x => `<h2>${esc(x[0])}</h2>${para(x[1])}`).join('')}
<div class="two"><div><h3>Strengths</h3><ul>${c.strengths.map(t => '<li>' + esc(t) + '</li>').join('')}</ul></div><div><h3>Cautions</h3><ul>${c.cautions.map(t => '<li>' + esc(t) + '</li>').join('')}</ul></div></div>
${sections.slice(1).map(x => `<h2>${esc(x[0])}</h2>${para(x[1])}`).join('')}
<h2>Nakshatras in ${esc(s.en)}</h2><p>Every sign holds nine pada quarters, which fall across parts of three nakshatras. The nakshatra the Moon occupies at birth also sets your Vimshottari Dasha, so it matters as much as the sign.</p>
<div class="scroll"><table><thead><tr><th>Nakshatra</th><th>Ruling planet</th><th>Part inside ${esc(s.en)}</th></tr></thead><tbody>${s.nak.map(n => `<tr><td>${esc(n[0])}</td><td>${esc(n[1])}</td><td>${esc(n[2])}</td></tr>`).join('')}</tbody></table></div>
<h2>Questions people ask about ${esc(s.en)}</h2>${c.faq.map(f => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('')}
<p class="cta-row"><a class="btn gold" href="/birth-chart">Find your own rising, Sun and Moon sign</a> <a class="btn line" href="/dasha-periods">See your Dasha periods</a></p>
<p class="small">Written for education and reflection. Astrology describes tendencies, not fixed outcomes, and it is not a substitute for medical, legal or financial advice.</p>
<nav class="pn" aria-label="More signs"><a href="/${slugOf(prev)}">← ${esc(prev.en)}</a><a href="/learn">All signs</a><a href="/${slugOf(next)}">${esc(next.en)} →</a></nav>
</article>`;
    const title = `${s.en} (${s.sa}) in Vedic Astrology: Traits, Career, Love, Health | AstroSarangi`;
    const desc = `${s.en} (${s.sa}) in Vedic astrology: ${s.el.toLowerCase()} sign ruled by ${s.ruler}. Personality, career, love, health tendencies, nakshatras and how Sun, Moon and rising sign in ${s.en} differ.`;
    const html = shell({
      path: '/' + slugOf(s), title, desc, h1: `${s.en} (${s.sa}) in Vedic Astrology`, lead: c.lead,
      crumb: `<a href="/">AstroSarangi</a> › <a href="/learn">Learn</a> › ${esc(s.en)}`, body,
      ld: [{ '@context': 'https://schema.org', '@graph': [
        { '@type': 'Article', headline: `${s.en} (${s.sa}) in Vedic Astrology`, description: desc, url: SITE + '/' + slugOf(s), inLanguage: 'en', publisher: { '@type': 'Organization', name: 'AstroSarangi', url: SITE } },
        { '@type': 'FAQPage', mainEntity: c.faq.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) },
        { '@type': 'BreadcrumbList', itemListElement: [['AstroSarangi', SITE + '/'], ['Learn', SITE + '/learn'], [s.en, SITE + '/' + slugOf(s)]].map((x, k) => ({ '@type': 'ListItem', position: k + 1, name: x[0], item: x[1] })) }] }]
    });
    write(slugOf(s) + '.html', html);
    urls.push(['/' + slugOf(s), '0.7']);
  });


  // ---- nakshatra pages
  const NC=Object.assign({},require('./learn-nak-1.js'),require('./learn-nak-2.js'),require('./learn-nak-3.js'));
  const nwords=[];
  NAKS.forEach((n,i)=>{
    const [key,name,deity,symbol,gana,yoni,nadi,type]=n,c=NC[key];
    if(!c)throw new Error('Missing nakshatra '+key);
    const s0=i*40/3,s1=(i+1)*40/3,lord=LORDS[i%9];
    const si=Math.floor(s0/30),ei=Math.floor((s1-1e-6)/30);
    const span=si===ei?SGN[si]:SGN[si]+' and '+SGN[ei];
    const prev=NAKS[(i+26)%27],next=NAKS[(i+1)%27];
    const glance=[['Ruling planet (Dasha lord)',lord],['Sidereal span',dm(s0%30)+' '+SGN[si]+' to '+(s1%30===0?'30° 00\u2032 '+SGN[ei]:dm(s1%30)+' '+SGN[ei])],['Deity',deity],['Symbol',symbol],['Gana',gana],['Yoni (animal)',yoni],['Nadi',nadi],['Nature',type]];
    const rows=[0,1,2,3].map(p=>{const d=s0+p*10/3,sg=Math.floor(d/30);return `<tr><td>${p+1}</td><td>${dm(d%30)} ${SGN[sg]}</td><td>${SGN[(i*4+p)%12]}</td></tr>`}).join('');
    const faq=c.faq.concat([['What does the Moon in '+name+' mean for the Dasha?','Your first Vimshottari Dasha is that of '+lord+', the lord of '+name+'. How much of it remains at birth depends on how far the Moon has travelled through the nakshatra.']]);
    const text=[].concat(c.about,c.traits,c.career,c.love,faq.map(f=>f[0]+' '+f[1])).join(' ');
    nwords.push(name+':'+wc(text));
    const body=`<article class="card article">
<div class="glance"><h2>${esc(name)} at a glance</h2><dl>${glance.map(g=>`<div><dt>${esc(g[0])}</dt><dd>${esc(g[1])}</dd></div>`).join('')}</dl></div>
<h2>About ${esc(name)}</h2>${para([`${name} is nakshatra number ${i+1} of 27 and lies in ${span}. Each nakshatra covers 13 degrees 20 minutes of the zodiac and is divided into four padas of 3 degrees 20 minutes.`].concat(c.about))}
<h2>The Moon in ${esc(name)}</h2>${para(c.traits)}
<h2>Career</h2>${para(c.career)}
<h2>Love and marriage</h2>${para(c.love)}
<h2>The four padas</h2><p>Each pada falls in a navamsa sign, which refines the nakshatra\'s character. Your pada is found from the exact degree of your Moon.</p>
<div class="scroll"><table><thead><tr><th>Pada</th><th>Starts at</th><th>Navamsa sign</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>Questions about ${esc(name)}</h2>${faq.map(f=>`<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('')}
<p class="cta-row"><a class="btn gold" href="/birth-chart">Find your Moon nakshatra</a> <a class="btn line" href="/dasha-periods">See your Dasha periods</a></p>
<p class="small">Written for education and reflection. Astrology describes tendencies, not fixed outcomes, and it is not a substitute for medical, legal or financial advice.</p>
<nav class="pn" aria-label="More nakshatras"><a href="/${nslug(prev[0])}">← ${esc(prev[1])}</a><a href="/learn">All guides</a><a href="/${nslug(next[0])}">${esc(next[1])} →</a></nav>
</article>`;
    const title=`${name} Nakshatra in Vedic Astrology: Traits, Career, Love, Padas | AstroSarangi`;
    const desc=`${name} nakshatra: ruled by ${lord}, deity ${deity}, in ${span}. Personality, career, love, padas, gana, yoni and nadi explained in plain language.`;
    write(nslug(key)+'.html',shell({path:'/'+nslug(key),title,desc,h1:`${name} Nakshatra in Vedic Astrology`,lead:c.lead,crumb:`<a href="/">AstroSarangi</a> › <a href="/learn">Learn</a> › ${esc(name)}`,body,
      ld:[{'@context':'https://schema.org','@graph':[{'@type':'Article',headline:`${name} Nakshatra in Vedic Astrology`,description:desc,url:SITE+'/'+nslug(key),inLanguage:'en',publisher:{'@type':'Organization',name:'AstroSarangi',url:SITE}},{'@type':'FAQPage',mainEntity:faq.map(f=>({'@type':'Question',name:f[0],acceptedAnswer:{'@type':'Answer',text:f[1]}}))}]}]}));
    urls.push(['/'+nslug(key),'0.7']);
  });

  // ---- hub
  {
    const cards = SIGNS.map(s => `<a class="signcard" href="/${slugOf(s)}"><span class="gl" aria-hidden="true">${s.glyph}</span><b>${esc(s.en)} <small>${esc(s.sa)}</small></b><span>${esc(s.el)} · ${esc(s.q)} · ruled by ${esc(s.ruler)}</span><span class="dt">Sun here about ${esc(s.start)} to ${esc(s.end)}</span></a>`).join('');
    const body = `<section class="card article"><h2>Start with the twelve signs</h2>
<p>These guides explain each zodiac sign the way Vedic (Jyotish) astrology reads it: by element, quality and ruling planet, and by what it means when the Sun, the Moon or the rising sign falls in it. They use the sidereal zodiac with the Lahiri ayanamsa, the same method the calculators on this site use, so a sign in these pages matches the sign in your chart.</p>
<p>A sign is only one layer of a chart. Read the sign pages for the character of each sign, then use the free tools to see which signs hold your own Lagna, Moon and planets, and how the Dasha periods time them.</p></section>
<section class="sect"><h2>The 12 zodiac signs</h2><div class="signgrid">${cards}</div></section>
<section class="sect"><h2>The 27 nakshatras</h2><div class="signgrid">${NAKS.map((n,i)=>`<a class="signcard" href="/${nslug(n[0])}"><b>${esc(n[1])}</b><span>Ruled by ${LORDS[i%9]} · ${esc(n[2])}</span></a>`).join('')}</div></section>
<section class="card article"><h2>How these guides are written</h2><p>Each guide is written for AstroSarangi in plain language, based on classical Parashari principles: sign lordship, exaltation and debilitation, moolatrikona, and the nakshatras inside each sign. Astrology describes tendencies and is offered for education and reflection. It does not predict fixed outcomes or replace professional advice. Read more about the site on the <a href="/about">About page</a>.</p><p class="cta-row"><a class="btn gold" href="/birth-chart">Create your free Kundli</a> <a class="btn line" href="/free-tools">All free tools</a></p></section>`;
    write('learn.html', shell({
      path: '/learn', title: 'Learn Vedic Astrology: Zodiac Signs and Nakshatras Explained | AstroSarangi', desc: 'Plain-language guides to the twelve zodiac signs and 27 nakshatras in Vedic astrology: element, ruling planet, nakshatras, career, love and health tendencies, with free Kundli tools.',
      h1: 'Learn Vedic Astrology', lead: 'Clear guides to the twelve signs and the 27 nakshatras, written for beginners and using the same method as the calculators.',
      crumb: '<a href="/">AstroSarangi</a> › Learn', body,
      ld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Learn Vedic Astrology', url: SITE + '/learn', inLanguage: 'en' }]
    }));
    urls.push(['/learn', '0.8']);
  }

  // ---- about
  {
    const body = `<article class="card article">${ABOUT.sections.map(x => `<h2>${esc(x[0])}</h2>${para(x[1])}`).join('')}
${ABOUT.lists.map(l => `<h2>${esc(l[0])}</h2><ul>${l[1].map(t => '<li>' + esc(t) + '</li>').join('')}</ul>`).join('')}
<p class="cta-row"><a class="btn gold" href="/birth-chart">Create your free Kundli</a> <a class="btn line" href="/contact.html">Contact us</a> <a class="btn line" href="/privacy.html">Privacy policy</a></p></article>`;
    write('about.html', shell({
      path: '/about', title: 'About AstroSarangi: Free Vedic Astrology, How It Works | AstroSarangi', desc: 'About AstroSarangi: a free Vedic astrology site. How charts are calculated (Lahiri ayanamsa, whole-sign houses, KP), what it can and cannot tell you, and how your data is handled.',
      h1: 'About AstroSarangi', lead: ABOUT.lead, crumb: '<a href="/">AstroSarangi</a> › About',
      body, ld: [{ '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About AstroSarangi', url: SITE + '/about', inLanguage: 'en' }]
    }));
    urls.push(['/about', '0.6']);
  }
  const report = SIGNS.map(s => s.key + ':' + CONTENT[s.key]._words).join(' ');
  console.log('nak words '+nwords.join(' '));console.log('learn pages: ' + (SIGNS.length + 2 + 27) + ' | words ' + report);
  return urls;
};
module.exports.SIGNS = SIGNS;
