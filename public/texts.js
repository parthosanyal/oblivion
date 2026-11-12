/* Descriptive text tables used by the Reports tab. Traditional, general descriptions: symbolic, not predictive facts. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Texts = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // [element, modality, strengths, challenges, tip] per sign, Aries..Pisces
  const SIGN = [
    ['Fire', 'Movable', 'courage, initiative, directness and physical energy', 'impatience, a short temper and starting more than finishing', 'channel the energy into exercise or a clear goal, and pause before reacting'],
    ['Earth', 'Fixed', 'patience, reliability, a sense of beauty and a good head for money', 'stubbornness, possessiveness and resistance to change', 'keep your routines but practise flexibility when plans shift'],
    ['Air', 'Dual', 'curiosity, wit, adaptability and quick learning', 'scattered attention, nervous energy and inconsistency', 'choose one or two priorities and give them sustained time'],
    ['Water', 'Movable', 'empathy, memory, protectiveness and care for family', 'moodiness, over-attachment and taking things personally', 'set emotional boundaries and keep a calm daily rhythm'],
    ['Fire', 'Fixed', 'confidence, warmth, generosity and natural leadership', 'pride, a need for applause and difficulty taking criticism', 'lead by serving others and share the credit'],
    ['Earth', 'Dual', 'precision, a service attitude, analysis and practical skill', 'worry, perfectionism and over-criticism of self and others', 'accept "good enough" and rest the analytical mind'],
    ['Air', 'Movable', 'fairness, diplomacy, taste and an easy social manner', 'indecision, people-pleasing and avoiding conflict', 'decide by principle rather than by what keeps everyone comfortable'],
    ['Water', 'Fixed', 'depth, resilience, focus and investigative ability', 'secrecy, jealousy and holding on to grudges', 'forgive deliberately and let trusted people in'],
    ['Fire', 'Dual', 'optimism, honesty, vision and love of learning', 'bluntness, overpromising and restlessness', 'follow through on commitments before taking on new ones'],
    ['Earth', 'Movable', 'discipline, patience, ambition and a sense of duty', 'pessimism, emotional reserve and overwork', 'schedule rest and warmth as seriously as work'],
    ['Air', 'Fixed', 'originality, humanitarian ideals and independent thinking', 'aloofness, stubborn opinions and contrarianism', 'stay emotionally present with the people close to you'],
    ['Water', 'Dual', 'compassion, imagination, intuition and artistic feeling', 'escapism, vagueness and absorbing other people\'s moods', 'anchor your dreams in daily routines and clear boundaries']
  ];
  const NAK = ['quick, initiating and drawn to healing and new starts', 'intense, able to carry heavy responsibility, with strong creative power and drive', 'sharp, discerning and protective; can be blunt or critical', 'charming, sensual, creative and growth-oriented', 'curious, gentle and always searching; restless', 'intense, intellectual and transformative; stormy emotions that clear', 'optimistic and renewing; recovers well after setbacks', 'nourishing, dutiful and protective; traditionally the most auspicious star', 'perceptive, magnetic and private; reads people well', 'dignified, proud of lineage and drawn to authority', 'pleasure-loving, creative and warm-hearted', 'dependable, generous and supportive of others', 'skilful with the hands, resourceful and witty', 'creative, striking and detail-minded', 'independent, flexible and good at trade and negotiation', 'determined, goal-driven and ambitious', 'devoted, friendly and good at working with groups', 'protective, senior in manner and proud', 'investigative, goes to the root of things and clears away what is false', 'persuasive, confident and hard to defeat', 'principled, with lasting, hard-earned success', 'a good listener and learner; connects people and ideas', 'rhythmic, ambitious and attracted to wealth and status', 'secretive, solitary and drawn to healing and research', 'intense, idealistic and visionary', 'deep, calm and wise; patient endurance', 'caring, guiding and gentle; good at seeing things through to completion'];
  const LORD_IN = [
    'a strong focus on self-reliance, identity, health and personal initiative',
    'a life centred on family, speech, savings and earning through your own skills',
    'results through effort, courage, writing, communication and sibling support',
    'peace of mind through home, mother, property, vehicles and education',
    'intelligence, creativity, children, romance and purposeful learning',
    'success through service, competition and routines, and a need to manage health and debts',
    'a life shaped by partnerships, marriage and dealing with the public',
    'depth, research, transformation and sudden turns that rebuild the person',
    'fortune through teachers, higher learning, travel and faith',
    'a career-centred life, with public recognition and responsibility',
    'gains through networks, friends and the fulfilment of long-held desires',
    'time spent in foreign lands, retreat or service, along with expenses and spiritual interests'
  ];
  const TENTH = ['leadership, independent or pioneering roles, defence, sports and engineering', 'finance, banking, luxury goods, food, the arts and steady long-term roles', 'communication, media, trade, teaching, writing and IT', 'care professions, public service, hospitality, real estate and education', 'management, government, politics, entertainment and positions of authority', 'analysis, health, accounts, quality control, editing and service roles', 'law, diplomacy, design, HR, consulting and partnership-based work', 'research, investigation, surgery, insurance, finance and work in crisis or hidden fields', 'teaching, law, publishing, travel, advisory work and higher education', 'administration, industry, construction, large institutions and long-term management', 'technology, science, social causes, networks and innovation', 'healing, the arts, spirituality, charity, film and foreign or institutional settings'];
  const SPOUSE = ['energetic, independent and direct', 'steady, affectionate and comfort-loving', 'witty, youthful and communicative', 'caring, family-oriented and emotionally sensitive', 'warm, proud and fond of appreciation', 'practical, helpful and detail-minded (sometimes critical)', 'charming, fair-minded and partnership-loving', 'intense, loyal and private', 'optimistic, freedom-loving and philosophical', 'mature, responsible and ambitious', 'unconventional, friendly and independent-minded', 'gentle, romantic and artistic or spiritual'];
  const MUNTHA = {
    1: 'a year of new beginnings, with attention on yourself, your health and your direction.', 2: 'a year that centres on money, savings and family matters.', 3: 'a year of effort and initiative: short trips, writing, courses and dealings with siblings.',
    4: 'a year with focus on home, property, vehicles and the mother, and on inner steadiness.', 5: 'a year for creativity, studies, romance and children.', 6: 'a year that tests you through work pressure, health routines and competition; careful management pays off.',
    7: 'a year when partnerships, marriage and public dealings come to the fore.', 8: 'a year of sudden changes and deeper matters; extra care with health, finances and promises.', 9: 'a year of good fortune, travel, learning and advice from teachers.',
    10: 'a year of career progress, responsibility and recognition.', 11: 'a year of gains, useful friendships and fulfilment of plans.', 12: 'a year of expenses, foreign links and withdrawal; good for rest, retreat and spiritual work.'
  };
  const HOUSE_JUP = { 1: 'self-confidence and good health improve', 2: 'income, savings and family harmony improve', 3: 'effort is needed but short journeys and learning prove useful', 4: 'comfort at home, property and peace of mind', 5: 'excellent for children, studies, creativity and good judgement', 6: 'expect work pressure, health care and debts needing attention', 7: 'strong for marriage, partnerships and public dealings', 8: 'a testing phase; guard health and finances', 9: 'luck, teachers, travel and higher learning', 10: 'responsibility at work; progress comes only through effort', 11: 'the best house for gains, friends and wishes coming true', 12: 'expenses rise; retreat, travel abroad or charity suit best' };
  const HOUSE_SAT = { 1: 'a heavy phase where energy and health need pacing', 2: 'financial discipline and careful speech are needed', 3: 'courage and effort bring steady progress', 4: 'domestic pressure or property matters need patience', 5: 'slower progress with studies, children or romance', 6: 'a good time to overcome competition and clear debts through hard work', 7: 'relationships and partnerships ask for patience and commitment', 8: 'a demanding phase; avoid risks and rushed decisions', 9: 'delays in luck or travel; mature teachers help', 10: 'heavy responsibility at work, with lasting results if you stay steady', 11: 'gains come steadily through persistence and older or senior contacts', 12: 'expenses, fatigue or isolation; rest, routine and service help' };
  const NUM = {
    1: { work: 'leadership, entrepreneurship and roles with autonomy', love: 'loyal and protective, but can dominate; partners value being heard', grow: 'listen first, share credit and ask for help' },
    2: { work: 'counselling, mediation, design, teamwork and caring roles', love: 'devoted and tender; needs reassurance and can absorb a partner\'s moods', grow: 'build self-trust and practise saying no' },
    3: { work: 'writing, teaching, performing, marketing and anything expressive', love: 'playful, affectionate and sociable; may avoid hard conversations', grow: 'finish what you start and go deeper than the surface' },
    4: { work: 'engineering, accounts, operations, project management and building', love: 'dependable and loyal, though not always demonstrative', grow: 'allow spontaneity and rest; avoid rigid rules for others' },
    5: { work: 'sales, travel, media, consulting and work with variety', love: 'exciting and adventurous; commitment and routine are the lesson', grow: 'commit to one path long enough to see results' },
    6: { work: 'teaching, healthcare, design, hospitality and family business', love: 'devoted and generous; may over-give or try to fix a partner', grow: 'set boundaries and accept help' },
    7: { work: 'research, analysis, technology, writing and spiritual teaching', love: 'needs space and depth; can seem distant', grow: 'share your inner world and trust people more' },
    8: { work: 'management, business, finance, law and large organisations', love: 'a committed provider; work can crowd out intimacy', grow: 'balance ambition with generosity and rest' },
    9: { work: 'humanitarian work, the arts, healing and public causes', love: 'idealistic and giving; can be hurt by unmet ideals', grow: 'let go of the past and keep practical boundaries' },
    11: { work: 'inspirational, creative or advisory roles that draw on intuition', love: 'sensitive and intense; needs a calm partner', grow: 'manage nervous tension and turn insight into steady action' },
    22: { work: 'large-scale building, organisation and projects that serve many people', love: 'serious about commitment; pressure to achieve can strain closeness', grow: 'let go of perfection and share the load' },
    33: { work: 'teaching, healing and guiding work that gives to others', love: 'selfless and nurturing; may neglect their own needs', grow: 'give from fullness, not exhaustion' }
  };
  const LOSHU_PLANES = [
    ['Thought plane (4-9-2)', [4, 9, 2], 'planning, memory and ideas'], ['Emotional plane (3-5-7)', [3, 5, 7], 'feeling, imagination and intuition'], ['Practical plane (8-1-6)', [8, 1, 6], 'action, money and daily practicalities'],
    ['Mental column (4-3-8)', [4, 3, 8], 'orderly thinking and structure'], ['Willpower column (9-5-1)', [9, 5, 1], 'drive, will and communication'], ['Action column (2-7-6)', [2, 7, 6], 'carrying things through in the world']
  ];
  const YOGA = {
    'Mangal Dosha (Manglik)': ['Mars influences the houses of marriage and home. Traditionally this asks for a partner of similar strength, or careful matching, and for patience with anger and impatience in close relationships.', 'Mars does not occupy the sensitive houses from Lagna or Moon, so this traditional concern does not apply.'],
    'Kaal Sarp Yoga': ['All seven planets are hemmed between Rahu and Ketu. Traditionally this suggests a life of intense, karmic themes and delayed but eventually significant results; its effect is debated and varies with the dasha.', 'Planets fall on both sides of the Rahu–Ketu axis, so this pattern is absent.'],
    'Gajakesari Yoga': ['Jupiter is angular from the Moon. Classical texts link this with good reputation, intelligence, resilience and the ability to recover from difficulty.', 'Jupiter is not angular from the Moon. This particular reputation yoga is absent; Jupiter\'s own condition still matters.'],
    'Budhaditya Yoga': ['Sun and Mercury together sharpen the intellect, speech and analytical ability. It helps in study, writing, trade and advisory work, especially when Mercury is not too close to the Sun.', 'Sun and Mercury are in different signs, so this combination is absent.'],
    'Chandra–Mangala Yoga': ['Moon and Mars together link feeling with drive. Traditionally it supports earning ability and enterprise, with some emotional intensity.', 'Moon and Mars are in different signs, so this is absent.']
  };
  const PMP = 'A Pancha Mahapurusha yoga: a planet strong in its own or exalted sign in a kendra. Traditionally it marks a person of standing, with the qualities of that planet expressed strongly.';
  return { SIGN, NAK, LORD_IN, TENTH, SPOUSE, MUNTHA, HOUSE_JUP, HOUSE_SAT, NUM, LOSHU_PLANES, YOGA, PMP };
});
