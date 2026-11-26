/* Light (ivory and gold, default) and dark (pure black and copper) mode. The choice is remembered on this device. */
(function () {
  var KEY = 'jk_mode', root = document.documentElement;
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(m) {
    if (m === 'dark') root.setAttribute('data-mode', 'dark'); else root.removeAttribute('data-mode');
    var b = document.getElementById('modeBtn');
    if (b) { b.setAttribute('aria-pressed', m === 'dark' ? 'true' : 'false'); b.setAttribute('aria-label', m === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); b.title = b.getAttribute('aria-label'); b.firstChild.textContent = m === 'dark' ? '☀' : '☾'; }
    var mt = document.querySelector('meta[name="theme-color"]'); if (mt) mt.setAttribute('content', m === 'dark' ? '#000000' : '#fbf7ee');
  }
  apply(get() === 'dark' ? 'dark' : 'light');
  document.addEventListener('DOMContentLoaded', function () {
    var host = document.querySelector('.top .topnav') || document.querySelector('.top');
    if (!host || document.getElementById('modeBtn')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'modeBtn'; b.className = 'modebtn'; b.innerHTML = '<span aria-hidden="true"></span>';
    host.appendChild(b); apply(get() === 'dark' ? 'dark' : 'light');
    b.addEventListener('click', function () { var n = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark'; try { localStorage.setItem(KEY, n); } catch (e) {} apply(n); });
  });
})();
