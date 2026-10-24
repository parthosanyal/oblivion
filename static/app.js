(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---- preset cities (offline) -------------------------------------------
  const CITIES = [
    ["Mumbai, India", 19.0760, 72.8777, "Asia/Kolkata"],
    ["Delhi, India", 28.6139, 77.2090, "Asia/Kolkata"],
    ["Bengaluru, India", 12.9716, 77.5946, "Asia/Kolkata"],
    ["Chennai, India", 13.0827, 80.2707, "Asia/Kolkata"],
    ["Kolkata, India", 22.5726, 88.3639, "Asia/Kolkata"],
    ["Hyderabad, India", 17.3850, 78.4867, "Asia/Kolkata"],
    ["Pune, India", 18.5204, 73.8567, "Asia/Kolkata"],
    ["Ahmedabad, India", 23.0225, 72.5714, "Asia/Kolkata"],
    ["Jaipur, India", 26.9124, 75.7873, "Asia/Kolkata"],
    ["Lucknow, India", 26.8467, 80.9462, "Asia/Kolkata"],
    ["Varanasi, India", 25.3176, 82.9739, "Asia/Kolkata"],
    ["Patna, India", 25.5941, 85.1376, "Asia/Kolkata"],
    ["Bhopal, India", 23.2599, 77.4126, "Asia/Kolkata"],
    ["Thiruvananthapuram, India", 8.5241, 76.9366, "Asia/Kolkata"],
    ["Kochi, India", 9.9312, 76.2673, "Asia/Kolkata"],
    ["Guwahati, India", 26.1445, 91.7362, "Asia/Kolkata"],
    ["Kathmandu, Nepal", 27.7172, 85.3240, "Asia/Kathmandu"],
    ["Colombo, Sri Lanka", 6.9271, 79.8612, "Asia/Colombo"],
    ["Dhaka, Bangladesh", 23.8103, 90.4125, "Asia/Dhaka"],
    ["Karachi, Pakistan", 24.8607, 67.0011, "Asia/Karachi"],
    ["Dubai, UAE", 25.2048, 55.2708, "Asia/Dubai"],
    ["Singapore", 1.3521, 103.8198, "Asia/Singapore"],
    ["London, UK", 51.5074, -0.1278, "Europe/London"],
    ["New York, USA", 40.7128, -74.0060, "America/New_York"],
    ["San Francisco, USA", 37.7749, -122.4194, "America/Los_Angeles"],
    ["Toronto, Canada", 43.6532, -79.3832, "America/Toronto"],
    ["Sydney, Australia", -33.8688, 151.2093, "Australia/Sydney"],
  ];
  const dl = $("cities");
  CITIES.forEach((c) => { const o = document.createElement("option"); o.value = c[0]; dl.appendChild(o); });

  function setPlace(name, lat, lon, tz) {
    $("lat").value = (+lat).toFixed(4);
    $("lon").value = (+lon).toFixed(4);
    if (tz) $("tz").value = tz;
    if (name) $("place").value = name;
  }
  $("place").addEventListener("change", () => {
    const hit = CITIES.find((c) => c[0].toLowerCase() === $("place").value.trim().toLowerCase());
    if (hit) { setPlace(null, hit[1], hit[2], hit[3]); $("findMsg").textContent = "Coordinates and timezone filled from preset."; }
  });

  // Online lookup (Open-Meteo geocoding: returns coordinates AND IANA timezone)
  $("findBtn").addEventListener("click", async () => {
    const q = $("place").value.trim();
    const msg = $("findMsg");
    if (!q) { msg.textContent = "Type a place name first."; return; }
    msg.textContent = "Searching…";
    try {
      const r = await fetch("https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&format=json&name=" + encodeURIComponent(q));
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const res = j.results || [];
      if (!res.length) { msg.textContent = "No match found. Enter latitude, longitude and timezone manually."; return; }
      const top = res[0];
      const label = [top.name, top.admin1, top.country].filter(Boolean).join(", ");
      setPlace(label, top.latitude, top.longitude, top.timezone);
      msg.textContent = "Using " + label + (res.length > 1 ? " (top of " + res.length + " matches — refine the name if wrong)." : ".");
    } catch (e) {
      msg.textContent = "Online lookup failed (" + e.message + "). Pick a preset city or enter coordinates manually.";
    }
  });

  // ---- chart drawing -------------------------------------------------------
  const NORTH_POLY = {
    1: [[100,100],[200,0],[300,100],[200,200]],
    2: [[0,0],[200,0],[100,100]],
    3: [[0,0],[100,100],[0,200]],
    4: [[0,200],[100,100],[200,200],[100,300]],
    5: [[0,200],[100,300],[0,400]],
    6: [[0,400],[100,300],[200,400]],
    7: [[100,300],[200,400],[300,300],[200,200]],
    8: [[200,400],[300,300],[400,400]],
    9: [[400,400],[300,300],[400,200]],
    10: [[400,200],[300,300],[200,200],[300,100]],
    11: [[400,200],[300,100],[400,0]],
    12: [[400,0],[300,100],[200,0]],
  };
  const NORTH_CENTER = {
    1: [200,92], 2: [100,28], 3: [28,100], 4: [100,192], 5: [28,300], 6: [100,372],
    7: [200,292], 8: [300,372], 9: [372,300], 10: [300,192], 11: [372,100], 12: [300,28],
  };
  const SOUTH_CELL = { // sign index -> [col,row]
    11: [0,0], 0: [1,0], 1: [2,0], 2: [3,0],
    10: [0,1], 3: [3,1],
    9: [0,2], 4: [3,2],
    8: [0,3], 7: [1,3], 6: [2,3], 5: [3,3],
  };

  function planetLines(list, perLine) {
    const items = list.map((p) => p.abbr + (p.retro && p.abbr !== "Ra" && p.abbr !== "Ke" ? "ᴿ" : ""));
    const lines = [];
    for (let i = 0; i < items.length; i += perLine) lines.push(items.slice(i, i + perLine).join(" "));
    return lines;
  }

  function drawNorth(chart) {
    let g = "";
    for (let h = 1; h <= 12; h++) {
      const pts = NORTH_POLY[h].map((p) => p.join(",")).join(" ");
      g += `<polygon points="${pts}" class="${h === 1 ? "lag" : ""}" fill="${h === 1 ? "" : "none"}"/>`;
      const [cx, cy] = NORTH_CENTER[h];
      const sign = (chart.lagna + h - 1) % 12;
      const pl = chart.signs[sign];
      const lines = planetLines(pl, h === 1 || h === 4 || h === 7 || h === 10 ? 3 : 2);
      g += `<text class="signno" x="${cx}" y="${cy - (lines.length ? 10 : 0) + (lines.length ? 0 : 4)}">${sign + 1}</text>`;
      lines.forEach((ln, i) => {
        g += `<text class="pl" x="${cx}" y="${cy + 8 + i * 15}">${esc(ln)}</text>`;
      });
    }
    return `<svg class="chart" viewBox="-4 -4 408 408" role="img" aria-label="North Indian chart">
      <g class="ln">${g}<rect x="0" y="0" width="400" height="400"/><line x1="0" y1="0" x2="400" y2="400"/><line x1="400" y1="0" x2="0" y2="400"/>
      <polygon points="200,0 400,200 200,400 0,200"/></g></svg>`
      .replace(/<g class="ln">([\s\S]*?)<rect/, (m, inner) => `<g class="ln">${inner.replace(/<text[\s\S]*?<\/text>/g, "")}<rect`)
      + ""; // (text is appended below)
  }

  // Simpler, explicit builder (keeps text out of the stroked group)
  function northSvg(chart, signNames) {
    let shapes = "", texts = "";
    for (let h = 1; h <= 12; h++) {
      const pts = NORTH_POLY[h].map((p) => p.join(",")).join(" ");
      shapes += `<polygon points="${pts}" ${h === 1 ? 'class="lag"' : 'fill="none"'}/>`;
      const [cx, cy] = NORTH_CENTER[h];
      const sign = (chart.lagna + h - 1) % 12;
      const lines = planetLines(chart.signs[sign], [1, 4, 7, 10].includes(h) ? 3 : 2);
      const top = cy - (lines.length ? 8 : -4);
      texts += `<text class="signno${h === 1 ? " asc" : ""}" x="${cx}" y="${top}">${sign + 1}</text>`;
      lines.forEach((ln, i) => { texts += `<text class="pl" x="${cx}" y="${cy + 10 + i * 15}">${esc(ln)}</text>`; });
    }
    return `<svg class="chart" viewBox="-4 -4 408 408" role="img" aria-label="North Indian style chart, ascendant ${esc(signNames[chart.lagna])}">
      <g class="ln">${shapes}<rect x="0" y="0" width="400" height="400"/></g>${texts}</svg>`;
  }

  function southSvg(chart, signNames) {
    let shapes = "", texts = "";
    const S = 100;
    for (let s = 0; s < 12; s++) {
      const [c, r] = SOUTH_CELL[s];
      const x = c * S, y = r * S;
      shapes += `<rect x="${x}" y="${y}" width="${S}" height="${S}" ${s === chart.lagna ? 'class="lag"' : 'fill="none"'}/>`;
      if (s === chart.lagna) shapes += `<line x1="${x}" y1="${y}" x2="${x + 18}" y2="${y + 18}"/>`;
      texts += `<text class="signname" x="${x + 6}" y="${y + 13}">${esc(signNames[s].slice(0, 3))}</text>`;
      const lines = planetLines(chart.signs[s], 3);
      lines.forEach((ln, i) => { texts += `<text class="pl" x="${x + S / 2}" y="${y + 40 + i * 16}">${esc(ln)}</text>`; });
    }
    texts += `<text class="signname asc" x="200" y="205" style="text-anchor:middle;font-size:12px">Asc: ${esc(signNames[chart.lagna])}</text>`;
    return `<svg class="chart" viewBox="-4 -4 408 408" role="img" aria-label="South Indian style chart, ascendant ${esc(signNames[chart.lagna])}">
      <g class="ln">${shapes}<rect x="0" y="0" width="400" height="400"/></g>${texts}</svg>`;
  }

  let current = null, style = "north";
  function renderCharts() {
    if (!current) return;
    const f = style === "north" ? northSvg : southSvg;
    $("chartD1").innerHTML = f(current.charts.d1, current.signs);
    $("chartD9").innerHTML = f(current.charts.d9, current.signs);
  }
  document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
    style = b.dataset.style;
    document.querySelectorAll(".seg button").forEach((x) => x.classList.toggle("on", x === b));
    renderCharts();
  }));

  // ---- tables --------------------------------------------------------------
  const tag = (t, c) => `<span class="tag ${c}">${esc(t)}</span>`;
  function dignityTag(d) {
    if (d === "Exalted") return tag("Exalted", "up");
    if (d === "Debilitated") return tag("Debilitated", "down");
    if (d === "Own sign") return tag("Own sign", "own");
    return "";
  }
  function planetRow(p, extra) {
    return `<tr><td>${esc(p.name)}</td><td>${esc(p.sign_name)} <small>(${esc(p.sign_skt)})</small></td>
      <td class="num">${esc(p.dms)}</td><td>${esc(p.nakshatra)} &middot; ${p.pada}</td><td>${esc(p.nak_lord)}</td>
      <td>${extra}</td><td>${p.retro ? tag("Retro", "r") : ""} ${dignityTag(p.dignity)}</td></tr>`;
  }
  function renderPlanets(d) {
    const a = d.ascendant;
    let h = `<thead><tr><th>Graha</th><th>Rashi</th><th>Degree</th><th>Nakshatra &middot; pada</th><th>Star lord</th><th>House</th><th>Status</th></tr></thead><tbody>`;
    h += `<tr class="asc-row"><td>Ascendant (Lagna)</td><td>${esc(a.sign_name)} <small>(${esc(a.sign_skt)})</small></td><td class="num">${esc(a.dms)}</td><td>${esc(a.nakshatra)} &middot; ${a.pada}</td><td>${esc(a.nak_lord)}</td><td>1</td><td></td></tr>`;
    d.planets.forEach((p) => { h += planetRow(p, p.house); });
    $("planetTable").innerHTML = h + "</tbody>";
  }
  function renderTransits(d) {
    const t = d.transits;
    $("transitDate").textContent = "as of " + t.as_of;
    const s = t.sade_sati;
    const el = $("sadeSati");
    el.className = "sade" + (s.active ? " on" : "");
    el.textContent = s.active ? "Sade Sati is active: " + s.phase + "." : "Sade Sati is not active (Saturn is in house " + s.saturn_from_moon + " from natal Moon).";
    let h = `<thead><tr><th>Graha</th><th>Rashi</th><th>Degree</th><th>From Moon</th><th></th></tr></thead><tbody>`;
    t.planets.forEach((p) => {
      h += `<tr><td>${esc(p.name)}</td><td>${esc(p.sign_name)}</td><td class="num">${esc(p.dms)}</td><td>${p.house_from_moon}</td><td>${p.retro ? tag("Retro", "r") : ""}</td></tr>`;
    });
    $("transitTable").innerHTML = h + "</tbody>";
  }
  function renderPanchang(d) {
    const p = d.panchang;
    const rows = [["Tithi", p.tithi], ["Vara (weekday)", p.vara + " — " + p.vara_lord], ["Nakshatra", d.planets[1].nakshatra + " (pada " + d.planets[1].pada + ")"],
      ["Yoga", p.yoga], ["Karana", p.karana], ["Sunrise", p.sunrise], ["Sunset", p.sunset]];
    let h = rows.map((r) => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join("");
    if (p.vara_note) h += `<dt></dt><dd><small>${esc(p.vara_note)}</small></dd>`;
    $("panchang").innerHTML = h;
  }
  function renderDasha(d) {
    const b = d.dasha.balance_at_birth;
    $("dashaBalance").textContent = `Balance of ${b.lord} dasha at birth: ${b.years} years. Click a mahadasha to see its antardashas.`;
    $("dasha").innerHTML = d.dasha.mahadashas.map((m) => {
      const ads = m.antardashas.map((a) => `<tr class="${a.current ? "now" : ""}"><td>${esc(m.lord)} / ${esc(a.lord)}</td><td class="num">${a.start}</td><td class="num">${a.end}</td><td>${a.current ? "◀ running" : ""}</td></tr>`).join("");
      return `<details class="md${m.current ? " current" : ""}" ${m.current ? "open" : ""}><summary><b>${esc(m.lord)}</b><span class="dates">${m.start} → ${m.end} &middot; ${m.years} yrs</span>${m.current ? tag("Running now", "own") : ""}</summary>
        <div class="ad"><table><thead><tr><th>Antardasha</th><th>From</th><th>To</th><th></th></tr></thead><tbody>${ads}</tbody></table></div></details>`;
    }).join("");
  }
  function renderSummary(d) {
    const moon = d.planets[1], sun = d.planets[0], asc = d.ascendant;
    const pill = (k, v, s) => `<div class="pill"><span>${k}</span><b>${esc(v)}</b><i>${esc(s)}</i></div>`;
    const cur = d.dasha.mahadashas.find((m) => m.current);
    const curAd = cur ? cur.antardashas.find((a) => a.current) : null;
    $("summary").innerHTML =
      pill("Lagna", asc.sign_name, asc.sign_skt + " · " + asc.dms) +
      pill("Moon sign (Rashi)", moon.sign_name, moon.sign_skt + " · " + moon.dms) +
      pill("Janma nakshatra", moon.nakshatra, "Pada " + moon.pada + " · lord " + moon.nak_lord) +
      pill("Sun sign", sun.sign_name, sun.sign_skt + " · " + sun.dms) +
      pill("Running dasha", cur ? cur.lord + (curAd ? " / " + curAd.lord : "") : "-", cur ? "until " + (curAd ? curAd.end : cur.end) : "") +
      pill("Ayanamsa", d.ayanamsa.dms, d.ayanamsa.name);
  }

  // ---- submit --------------------------------------------------------------
  $("chartForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const err = $("err"), btn = $("goBtn");
    err.textContent = "";
    btn.disabled = true; btn.textContent = "Calculating…";
    try {
      const body = {
        name: $("name").value, date: $("date").value, time: $("time").value,
        lat: $("lat").value, lon: $("lon").value, tz: $("tz").value,
      };
      const r = await fetch("/api/chart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Request failed");
      current = d;
      const wb = $("warnBox"), notes = d.warnings.slice();
      if (d.engine !== "swisseph") notes.push("Using the built-in approximate engine. Run `pip install pyswisseph` and restart for arc-second accuracy (recommended before relying on nakshatra pada or dasha dates).");
      wb.hidden = !notes.length; wb.textContent = notes.join(" ");
      renderSummary(d); renderCharts(); renderPlanets(d); renderPanchang(d); renderTransits(d); renderDasha(d);
      $("results").hidden = false;
      $("summary").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      err.textContent = e.message;
    } finally {
      btn.disabled = false; btn.textContent = "Cast chart";
    }
  });
})();
