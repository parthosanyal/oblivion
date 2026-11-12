/* Reusable place picker: instant built-in matches, then live worldwide search. Used by the partner form. */
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /** attach({ input, list, msg, onPick(city) }) */
  function attach(o) {
    const G = window.Geo; let items = [], sel = -1, timer = null, abort = null;
    const draw = () => {
      o.list.innerHTML = '';
      items.forEach((c, i) => { const li = document.createElement('li'); li.setAttribute('role', 'option'); li.setAttribute('aria-selected', i === sel ? 'true' : 'false'); li.innerHTML = `<span>${esc(c.label)}</span><small>${(+c.lat).toFixed(2)}, ${(+c.lon).toFixed(2)}</small>`; li.addEventListener('mousedown', e => { e.preventDefault(); pick(c); }); o.list.appendChild(li); });
      o.list.hidden = !items.length; o.input.setAttribute('aria-expanded', String(!o.list.hidden));
    };
    const pick = c => { o.input.value = c.label; items = []; draw(); o.msg.textContent = `Using ${c.label}: latitude ${c.lat}, longitude ${c.lon}, time zone ${c.tz}.`; o.onPick(c); };
    o.input.setAttribute('role', 'combobox'); o.input.setAttribute('aria-autocomplete', 'list'); o.input.setAttribute('aria-expanded', 'false');
    o.input.addEventListener('input', () => {
      const q = o.input.value; clearTimeout(timer); if (abort) abort.abort();
      const off = G ? G.searchOffline(q, 8) : []; items = off; sel = -1; draw();
      if (!G || G.norm(q).length < 2) { o.msg.textContent = ''; return; }
      o.msg.textContent = 'Searching worldwide…';
      timer = setTimeout(async () => {
        abort = new AbortController();
        try {
          const on = await G.searchOnline(q, abort.signal); if (o.input.value !== q) return;
          items = G.merge(on, off); sel = -1; draw();
          o.msg.textContent = on.length ? `${on.length} worldwide match${on.length > 1 ? 'es' : ''}. Choose one, or type the coordinates yourself.` : (off.length ? 'No worldwide match; showing the built-in list.' : 'No match found. Enter latitude, longitude and time zone yourself below.');
        } catch (e) { if (e.name === 'AbortError') return; o.msg.textContent = off.length ? 'Live worldwide search is unavailable here; showing the built-in list.' : 'Live search is unavailable. Enter latitude, longitude and time zone yourself below.'; }
      }, 350);
    });
    o.input.addEventListener('keydown', e => {
      if (!items.length) return;
      if (e.key === 'ArrowDown') { sel = (sel + 1) % items.length; draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = (sel - 1 + items.length) % items.length; draw(); e.preventDefault(); }
      else if (e.key === 'Enter' && sel >= 0) { pick(items[sel]); e.preventDefault(); }
      else if (e.key === 'Escape') { items = []; draw(); }
    });
    o.input.addEventListener('blur', () => setTimeout(() => { items = []; draw(); }, 120));
  }
  window.PlacePicker = { attach };
})();
