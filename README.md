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
- `node server.js` now listens on all network interfaces and prints the addresses, e.g. `http://192.168.1.20:3000` (phones/laptops on the same Wi-Fi) and `http://<computer-name>:3000`.
- Custom name such as `http://jyotish.local`: add `127.0.0.1  jyotish.local` to your hosts file
  (Windows: C:\Windows\System32\drivers\etc\hosts, edit as Administrator; Mac/Linux: /etc/hosts, use sudo), then run with `PORT=80 node server.js` (Windows PowerShell: `$env:PORT=80; node server.js`) and open http://jyotish.local
- Only this computer: `HOST=127.0.0.1 node server.js`
- Public website: run `node build-single.js`, then upload `dist/jyotish-kundli.html` (rename to index.html) to any static host (Netlify Drop, GitHub Pages, Cloudflare Pages, Vercel). No server needed; everything runs in the browser.
