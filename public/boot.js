/* Runs first, in <head>. If saved birth details exist, hide the half-built page behind a loader until the chart is ready (page.js removes it). */
(function () {
  try {
    var s = JSON.parse(localStorage.getItem('jyotish-last') || 'null');
    if (s && s.date && s.time && s.lat !== '' && s.lon !== '' && s.tz && location.pathname !== '/') {
      document.documentElement.classList.add('pending');
      setTimeout(function () { document.documentElement.classList.remove('pending'); }, 9000);
    }
  } catch (e) {}
})();
