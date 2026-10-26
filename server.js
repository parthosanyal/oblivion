// Zero-dependency, hardened static server.
//   node server.js                 -> http://localhost:3000 (this computer only; safest default)
//   HOST=0.0.0.0 node server.js    -> also reachable from your Wi-Fi/LAN (npm run lan)
//   PORT=8080 node server.js       -> another port
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), zlib = require('zlib');
const GZ = new Map(); // path+mtime -> gzipped buffer
const PORT = +process.env.PORT || 3000, HOST = process.env.HOST || ((process.env.RENDER || process.env.PORT) ? '0.0.0.0' : '127.0.0.1'), ROOT = path.join(__dirname, 'public');
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml; charset=utf-8', '.png':'image/png', '.webmanifest':'application/manifest+json' };
const SECURITY = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://geocoding-api.open-meteo.com; font-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cache-Control': 'no-cache'
};
function send(res, code, body, type, req, extra) { const h = Object.assign({ 'Content-Type': type || 'text/plain; charset=utf-8' }, SECURITY, extra || {}); if (req && req.headers['x-forwarded-proto'] === 'https') h['Strict-Transport-Security'] = 'max-age=31536000'; res.writeHead(code, h); res.end(body); }
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  if ((req.url || '').length > 2000) return send(res, 414, 'URI too long');
  let p;
  try { p = decodeURIComponent((req.url || '/').split('?')[0]); } catch (e) { return send(res, 400, 'Bad request'); }
  if (p.includes('\0')) return send(res, 400, 'Bad request');
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, 'Forbidden');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found');
    fs.readFile(file, (e2, data) => {
      if (e2) return send(res, 500, 'Server error');
      const type = TYPES[path.extname(file)] || 'application/octet-stream';
      const gz = /\bgzip\b/.test(req.headers['accept-encoding'] || '') && /^(text\/|application\/(json|xml|javascript)|image\/svg)/.test(type) && data.length > 1024;
      if (gz) { const k = file + st.mtimeMs; if (!GZ.has(k)) GZ.set(k, zlib.gzipSync(data, { level: 9 })); data = GZ.get(k); }
      send(res, 200, req.method === 'HEAD' ? '' : data, type, req, gz ? { 'Content-Encoding': 'gzip', 'Vary': 'Accept-Encoding' } : { 'Vary': 'Accept-Encoding' });
    });
  });
});
server.headersTimeout = 10000; server.requestTimeout = 10000; server.maxHeadersCount = 50;
server.listen(PORT, HOST, () => {
  const sfx = PORT === 80 ? '' : ':' + PORT;
  console.log(`Jyotish app running:\n  This computer : http://localhost${sfx}`);
  if (HOST === '0.0.0.0') {
    Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal).forEach(i => console.log(`  Same Wi-Fi/LAN: http://${i.address}${sfx}`));
    console.log('  (LAN mode: anyone on your network can open this. Use only on networks you trust.)');
  } else console.log('  Private mode: only this computer can open it. Use HOST=0.0.0.0 (npm run lan) to share on your network.');
  if (process.env.RENDER) console.log('  Running on Render (listening on all interfaces).');
});
