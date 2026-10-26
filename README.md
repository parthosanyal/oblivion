# Jyotish Kundli — Vedic astrology web app

Zero dependencies. Needs only Node.js 18+ (https://nodejs.org).

    cd vedic-astro
    node server.js          # then open http://localhost:3000
    node test.js            # optional accuracy checks

(You can also just open public/index.html in a browser — everything runs client-side.)

## What it does
- Birth chart (Lagna) in North & South Indian styles; all 60 divisional charts (D1–D60) as independent charts in a gallery (click to enlarge), plus two dropdown-selectable charts on the Charts tab
- Planet table: sign, degree, nakshatra/pada, house, retrograde, exaltation/own/debilitation
- Vimshottari Dasha with Antardasha and the currently running period
- Panchang at birth (tithi, vara, nakshatra, yoga, karana)
- Yogas/doshas: Manglik, Kaal Sarp, Gajakesari, Budhaditya, Chandra-Mangala, Pancha Mahapurusha
- Current transits (Gochar) with Sade Sati / Shani Dhaiya status
- Shadbala (six-fold planetary strength) with stacked rupa bars, percent-of-requirement bars, full component table, Ishta/Kashta phala
- Ashtakavarga: Sarvashtakavarga + Bhinnashtakavarga for 7 planets as charts (North/South), bar charts with percentages, heat table (verified totals 48/49/39/54/56/52/39 = 337)
- Transit charts: pick any date; transit chart over your natal Lagna plus Ashtakavarga-based percentage bars
- Life Predictions: lifetime outlook timeline combining Vimshottari + Yogini Dasha with Jupiter and Saturn transits, period-by-period explanations, year-by-year table, Sade Sati bands

## Method
Sidereal zodiac, Lahiri ayanamsa, whole-sign houses, mean Rahu/Ketu.
Sun & Moon: Meeus algorithms (~0.01°). Planets: JPL approximate Keplerian elements (valid 1800–2050, typically within ~0.1°).
Verified against Meeus worked examples and the widely published 15 Aug 1947 chart.

## Files
public/engine.js (all calculations) · public/app.js (UI/SVG charts) · public/cities.js (city list) · server.js (static server)

## Ideas to extend
Ashtakoota Gun Milan (marriage matching), Ashtakavarga, Shadbala, divisional charts D2–D60, sunrise-based Vara, true node, more cities / geocoding API.

## Using a different hostname / sharing
- `node server.js` listens on this computer only (safe default). `npm run lan` (or `HOST=0.0.0.0 node server.js`) shares it on your Wi-Fi and prints the addresses, e.g. `http://192.168.1.20:3000` (phones/laptops on the same Wi-Fi) and `http://<computer-name>:3000`.
- Custom name such as `http://jyotish.local`: add `127.0.0.1  jyotish.local` to your hosts file
  (Windows: C:\Windows\System32\drivers\etc\hosts, edit as Administrator; Mac/Linux: /etc/hosts, use sudo), then run with `PORT=80 node server.js` (Windows PowerShell: `$env:PORT=80; node server.js`) and open http://jyotish.local
- Only this computer: `HOST=127.0.0.1 node server.js`
- Public website: run `node build-single.js`, then upload `dist/jyotish-kundli.html` (rename to index.html) to any static host (Netlify Drop, GitHub Pages, Cloudflare Pages, Vercel). No server needed; everything runs in the browser.

## Security
See SECURITY.md. The server is read-only, sends strict security headers and listens on localhost by default.

## City data and licence
`public/data/cities/` holds about 152,000 places (223 countries, with states and time zones) so any city works offline, in addition to the live worldwide search.
Source: dr5hn/countries-states-cities-database (https://github.com/dr5hn/countries-states-cities-database), licensed under the Open Database Licence (ODbL 1.0).
Keep this attribution if you share the data files; the ODbL requires derived databases to be shared under the same licence.
Rare small villages may be missing: enter latitude, longitude and time zone by hand for those.

## Reports tab (added)
Kundli analysis, Marriage compatibility (Ashtakoota 36 points + Manglik + timing), Career and finance, Numerology, Yearly horoscope (Varsha chart, Muntha, monthly outlook). Files: `public/koota.js`, `numerology.js`, `reports.js`, `texts.js`, `sections.js`. Navigation is two rows of sea-blue tabs (`public/nav.js`): Birth Chart, Predictions, Strength, Reports.

## Icon
`public/icon-*.png`, `apple-touch-icon.png` and `manifest.webmanifest` come from your supplied icon (favicon, phone home-screen icon, header logo, share image). The single-file build embeds the header logo.
