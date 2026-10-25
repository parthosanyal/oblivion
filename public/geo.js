/* Place search: instant offline matches (built-in list + full offline city dataset) + live worldwide lookup (Open-Meteo geocoding; only the typed place name is sent). */
(function () {
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const offline = () => (window.CITIES || []).map(c => ({ label: c[0], lat: c[1], lon: c[2], tz: c[3], src: 'built-in', key: norm(c[0]) }));
  let cache = null;

  // ---- full offline dataset: data/cities/index.json + per-country files, loaded lazily in the background (India first)
  const DATA = {};      // iso -> { name, tz[], s[], c[], keys[] }
  let loadStarted = false, loadedCount = 0, totalCount = 0, listeners = [];
  const fetchJson = u => fetch(u).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  async function preload() {
    if (loadStarted) return; loadStarted = true;
    try {
      const index = await fetchJson('data/cities/index.json'); totalCount = index.length;
      const files = [...new Set(index.map(r => r[3]))].sort((a, b) => (a === 'IN' ? -1 : b === 'IN' ? 1 : 0));
      const nameOf = {}; index.forEach(r => nameOf[r[0]] = r[1]);
      for (const f of files) {
        let obj; try { obj = await fetchJson('data/cities/' + f + '.json'); } catch (e) { continue; }
        Object.keys(obj).forEach(iso => { const d = obj[iso]; d.name = nameOf[iso] || iso; d.keys = d.c.map(x => norm(x[0])); DATA[iso] = d; loadedCount++; });
        listeners.forEach(fn => { try { fn(loadedCount, totalCount); } catch (e) {} });
        await new Promise(r => setTimeout(r, 30));
      }
    } catch (e) { /* offline dataset unavailable (for example opened from a file): the built-in list and live search still work */ }
  }
  function searchData(n, limit) {
    const hits = [];
    for (const iso in DATA) {
      const d = DATA[iso], pri = iso === 'IN' ? 0 : 0.5;
      for (let i = 0; i < d.keys.length; i++) {
        const k = d.keys[i], p = k.indexOf(n); if (p < 0) continue;
        hits.push({ iso, i, score: (p === 0 ? (k === n ? -1 : 0) : k.includes(' ' + n) ? 1 : 2) + k.length / 1000 + pri });
      }
    }
    hits.sort((a, b) => a.score - b.score);
    return hits.slice(0, limit).map(h => { const d = DATA[h.iso], x = d.c[h.i]; return { label: [x[0], d.s[x[1]], d.name].filter(Boolean).join(', '), lat: x[2], lon: x[3], tz: d.tz[x[4]], src: 'dataset', key: norm(x[0]) }; });
  }
  function searchOffline(q, limit) {
    const n = norm(q); if (n.length < 2) return [];
    preload();
    cache = cache || offline();
    const hits = [];
    for (const c of cache) {
      const i = c.key.indexOf(n); if (i < 0) continue;
      hits.push({ c, score: (i === 0 ? 0 : c.key.includes(' ' + n) ? 1 : 2) + c.key.length / 1000 });
    }
    const built = hits.sort((a, b) => a.score - b.score).slice(0, limit || 8).map(h => h.c);
    return merge([], built.concat(searchData(n, (limit || 8) + 6)));
  }
  async function searchOnline(q, signal) {
    const n = norm(q); if (n.length < 2) return [];
    const url = 'https://geocoding-api.open-meteo.com/v1/search?count=10&language=en&format=json&name=' + encodeURIComponent(q.trim());
    const r = await fetch(url, { signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    return (j.results || []).filter(x => x.timezone && isFinite(x.latitude) && isFinite(x.longitude)).map(x => ({
      label: [x.name, x.admin1, x.country].filter(Boolean).join(', '), lat: +x.latitude.toFixed(4), lon: +x.longitude.toFixed(4), tz: x.timezone, src: 'worldwide', pop: x.population || 0 }));
  }
  function merge(online, off) {
    const out = [], cityKey = c => norm(String(c.label).split(',')[0].replace(/\(.*?\)/g, ''));
    [...online, ...off].forEach(c => {
      const ck = cityKey(c);
      if (!out.some(o => cityKey(o) === ck && Math.abs(o.lat - c.lat) < 0.3 && Math.abs(o.lon - c.lon) < 0.3)) out.push(c);
    });
    return out.slice(0, 14);
  }
  window.Geo = { searchOffline, searchOnline, merge, norm, preload, onProgress: fn => listeners.push(fn), stats: () => ({ loadedCount, totalCount }) };
  setTimeout(preload, 800);
})();
