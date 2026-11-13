// One entry per section page. Add entries here, then run: node make-pages.js
const first = [
{slug:'birth-chart',go:'tab:chart',nav:'Birth Chart',group:'Birth Chart',
 title:'Free Birth Chart (Janam Kundli) – North, South & East Indian | AstroSarangi',
 desc:'Make your free Vedic birth chart online: Lagna, Moon sign, nakshatra and all nine planets in North, South or East Indian style. Lahiri ayanamsa, calculated in your browser.',
 h1:'Free Birth Chart (Janam Kundli)', lead:'Your sky at the moment of birth: Lagna, Moon sign, nakshatra and every planet, drawn in the North, South or East Indian style.',
 intro:['A birth chart, or Janam Kundli, is a map of the sky for the exact time and place you were born. In Parashara Jyotish Shastra it shows your Lagna (rising sign), your Moon sign and nakshatra, and where each of the nine planets stood among the twelve signs and houses.','AstroSarangi uses the Lahiri (Chitrapaksha) ayanamsa and whole-sign houses. Enter your date, time and place above and your chart appears instantly. Nothing is sent to our server except the place name you type for the city search.'],
 get:['Lagna, Rashi (Moon sign) and nakshatra with pada','Rashi chart (D1) and Navamsa (D9) side by side','North, South and East Indian chart styles','Print or save your chart as a PDF'],
 how:'Start with the Lagna: it fixes the first house, and every other house follows in order. Then look at where the Moon sits, because it shows your mind and your Dasha start. Planets close together in one house work as a team, and a planet in its own or exalted sign is generally comfortable and strong.',
 faq:[['What do I need to make a birth chart?','Your date, exact time and place of birth. The Lagna changes about every two hours, so an accurate time matters.'],['Which ayanamsa is used?','Lahiri (Chitrapaksha), the standard in India, with sidereal planetary positions and whole-sign houses.'],['What is the difference between North and South Indian charts?','The same chart is drawn differently. In the North Indian style the houses are fixed and the signs move; in the South Indian style the signs are fixed.']],
 rel:['divisional-charts','planet-positions','panchang-and-yogas']},
{slug:'divisional-charts',go:'tab:vargas',nav:'Divisional Charts',group:'Birth Chart',
 title:'Divisional Charts (Varga) D1–D60 Online – Navamsa D9, D10 & More | AstroSarangi',
 desc:'See all 16 classical divisional charts D1 to D60 free: Navamsa D9, Dashamsha D10, Saptamsha D7 and more, in North, South or East Indian style.',
 h1:'Divisional Charts (D1–D60)', lead:'Sixteen lenses on one life: each varga chart looks at a single area, from marriage to career to children.',
 intro:['Divisional charts, called vargas, split every sign into smaller parts to study one area of life in detail. The Navamsa (D9) is the best known and is read for marriage and the inner strength of planets. The Dashamsha (D10) is read for career, and the Saptamsha (D7) for children.','AstroSarangi draws all sixteen classical charts from D1 to D60 for your birth details, each as its own chart you can open and compare with the main Rashi chart.'],
 get:['All 16 classical vargas: D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60','Each chart in North, South or East Indian style','A note on what each varga is read for','Tap any chart to enlarge it'],
 how:'Read the main chart first, then use a varga to look closer at one area. A planet that is strong in both the Rashi chart and the Navamsa is said to be in vargottama or well supported, and its results tend to be more reliable.',
 faq:[['What is a divisional chart?','A chart made by dividing each sign into equal parts, which gives a more detailed view of one area of life.'],['Which divisional chart is the most important?','The Navamsa (D9), used for marriage and to judge planetary strength, along with the Rashi chart (D1).'],['Does the birth time matter for vargas?','Yes. Higher vargas such as D60 change within minutes, so use them only if your birth time is exact.']],
 rel:['birth-chart','planet-positions','shadbala']},
{slug:'predictions',go:'tab:predict',nav:'Predictions',group:'Predictions',
 title:'Life Predictions Online – Dasha & Transit Timeline | AstroSarangi',
 desc:'Free life predictions from your Vedic chart: Vimshottari and Yogini Dasha periods, year-by-year outlook and what is running now.',
 h1:'Life Predictions', lead:'See the years ahead: a lifetime outlook built from your Dasha periods and the transits running over them.',
 intro:['In Vedic astrology, prediction rests on timing. The Dasha system tells you which planet is in charge of a period of your life, and the transits show how the sky is reacting over your birth chart right now.','AstroSarangi joins the two into a readable outlook: what is running now, a timeline of your Dasha periods (Vimshottari and Yogini) and a year-by-year view, with the reasoning shown so you can learn how the result was reached.'],
 get:['The Dasha and Antardasha running now','A lifetime outlook chart','Vimshottari and Yogini periods with dates','A year-by-year view','The reasons behind each reading'],
 how:'Read the period lord first: its sign, house and the houses it owns set the theme of the years. Then check the Antardasha for the focus within it. Predictions here are tendencies drawn from rules, to be used for reflection and planning rather than as certainties.',
 faq:[['How are the predictions made?','From fixed rules of Parashara Jyotish Shastra applied to your chart, Dasha and transits. They are not written by chance or by a person.'],['How far ahead can I see?','The full Dasha timeline covers your whole life, and the outlook view shows each year ahead.'],['Are these predictions certain?','No. They show tendencies and are meant for reflection, not for medical, legal or financial decisions.']],
 rel:['dasha-periods','transits-and-sade-sati','yearly-horoscope']}
];
const more = require('./pages-data2.js');
module.exports = first.concat(more);
