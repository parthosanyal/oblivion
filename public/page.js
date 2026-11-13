/* Section pages: open this page's section after the chart is calculated, and auto-calculate from the saved birth details.
 * With saved details the long form is replaced by a one-line summary with a "Change details" button; the page stays at the top. */
(function () {
  const v = document.body.dataset.page; if (!v) return;
  const $ = id => document.getElementById(id);
  let saved = null;
  try { const s = JSON.parse(localStorage.getItem('jyotish-last') || 'null'); if (s && s.date && s.time && s.lat !== '' && s.lon !== '' && s.tz) saved = s; } catch (e) {}
  const card = $('formCard');
  if (saved && card) {
    const bar = document.createElement('div'); bar.className = 'savedbar';
    const d = new Date(saved.date + 'T00:00:00'), ds = isNaN(d) ? saved.date : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const t = document.createElement('span'); t.textContent = (saved.name ? saved.name + ' · ' : '') + ds + ', ' + saved.time + ' · ' + (saved.place || saved.lat + ', ' + saved.lon);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ghost'; b.textContent = 'Change details';
    b.addEventListener('click', () => { card.hidden = false; bar.hidden = true; card.scrollIntoView({ block: 'start' }); });
    bar.append(t, b); card.before(bar); card.hidden = true;
  }
  document.addEventListener('click', e => { const g = e.target.closest('[data-go=form]'); if (g && card && card.hidden) { card.hidden = false; const bar = document.querySelector('.savedbar'); if (bar) bar.hidden = true; } }, true);
  document.addEventListener('kundli:ready', () => { setTimeout(() => { if (window.JKNav) window.JKNav.open(v); }, 30); });
  if (saved) setTimeout(() => {
    const orig = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function () {};
    const btn = card && card.querySelector('button[type=submit]');
    card.hidden = false; if (btn) btn.click(); card.hidden = true;
    setTimeout(() => { Element.prototype.scrollIntoView = orig; window.scrollTo(0, 0); }, 600);
  }, 150);
})();
