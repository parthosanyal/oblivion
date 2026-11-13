/* Phone menu (button + full-screen list). The button is hidden by CSS on screens wider than 700px. */
(function () {
  const brand = document.querySelector('.top .brand'); if (!brand || !document.querySelector('.topnav')) return;
  const hdr = document.querySelector('header.top');
  const btn = document.createElement('button'); btn.id = 'mb'; btn.type = 'button'; btn.setAttribute('aria-label', 'Menu'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'mpanel'); btn.textContent = '☰';
  const p = document.createElement('nav'); p.id = 'mpanel'; p.className = 'mpanel'; p.setAttribute('aria-label', 'Menu'); p.hidden = true;
  const L = window.PAGE_LIST || [], groups = []; L.forEach(x => { let g = groups.find(y => y[0] === x.g); if (!g) groups.push(g = [x.g, []]); g[1].push(x); });
  const home = location.pathname === '/' || /index\.html$/.test(location.pathname);
  p.innerHTML = '<a class="mcta" href="' + (home ? '#formCard' : '#formCard') + '" data-go="form">Create Kundli</a><a href="/">Home</a>' +
    groups.map(g => '<h3>' + g[0] + '</h3>' + g[1].map(x => '<a href="' + x.u + '">' + x.n + '</a>').join('')).join('') +
    '<h3>More</h3><a href="/free-tools">All free tools</a><a href="/contact.html">Contact us</a><label for="mlang">Language</label><select id="mlang"></select>';
  brand.appendChild(btn); document.body.appendChild(p);
  const sel = p.querySelector('#mlang');
  if (window.I18N) { sel.innerHTML = window.I18N.langs.map(x => '<option value="' + x[0] + '">' + x[1] + '</option>').join(''); sel.value = window.I18N.lang(); sel.addEventListener('change', () => { window.I18N.set(sel.value); }); }
  else sel.parentNode.removeChild(sel.previousElementSibling), sel.remove();
  const open = o => {
    if (o) { p.style.top = (hdr ? hdr.getBoundingClientRect().bottom : 70) + 'px'; if (sel && window.I18N) sel.value = window.I18N.lang(); }
    p.hidden = !o; p.classList.toggle('open', o); btn.textContent = o ? '✕' : '☰'; btn.setAttribute('aria-expanded', String(o)); document.body.classList.toggle('mopen', o);
  };
  btn.addEventListener('click', () => open(p.hidden));
  p.addEventListener('click', e => { if (e.target.closest('a')) open(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !p.hidden) { open(false); btn.focus(); } });
  window.addEventListener('resize', () => { if (innerWidth > 700 && !p.hidden) open(false); });
})();
