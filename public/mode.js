/* Light (ivory and gold, default) and dark (pure black and copper) mode. The choice is remembered on this device.
 * One button sits in the desktop menu; on phones a second one sits beside the menu button. */
(function () {
  var KEY = 'jk_mode', root = document.documentElement;
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(m) {
    if (m === 'dark') root.setAttribute('data-mode', 'dark'); else root.removeAttribute('data-mode');
    var label = m === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    document.querySelectorAll('.modebtn').forEach(function (b) { b.setAttribute('aria-pressed', m === 'dark' ? 'true' : 'false'); b.setAttribute('aria-label', label); b.title = label; b.firstChild.textContent = m === 'dark' ? '☀' : '☾'; });
    var mt = document.querySelector('meta[name="theme-color"]'); if (mt) mt.setAttribute('content', m === 'dark' ? '#000000' : '#fbf7ee');
  }
  function make(id, extra) { var b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'modebtn' + (extra || ''); b.innerHTML = '<span aria-hidden="true"></span>'; b.addEventListener('click', function () { var n = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark'; try { localStorage.setItem(KEY, n); } catch (e) {} apply(n); }); return b; }
  apply(get() === 'dark' ? 'dark' : 'light');
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('modeBtn')) return;
    var nav = document.querySelector('.top .topnav'), brand = document.querySelector('.top .brand');
    if (nav) nav.appendChild(make('modeBtn'));
    if (brand) brand.appendChild(make('modeBtnM', ' modebtn-m'));
    apply(get() === 'dark' ? 'dark' : 'light');
  });
})();
