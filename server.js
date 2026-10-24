// Zero-dependency static server.
//   node server.js                      -> http://localhost:3000  and  http://<your-LAN-IP>:3000
//   HOST=127.0.0.1 node server.js       -> this computer only
//   PORT=80 node server.js              -> use port 80 so no ":3000" is needed (may need admin/sudo)
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const PORT = +process.env.PORT || 3000, HOST = process.env.HOST || '0.0.0.0', ROOT = path.join(__dirname, 'public');
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, HOST, () => {
  const sfx = PORT === 80 ? '' : ':' + PORT;
  console.log(`Jyotish app running:\n  This computer : http://localhost${sfx}`);
  if (HOST === '0.0.0.0') {
    Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal).forEach(i => console.log(`  Same Wi-Fi/LAN: http://${i.address}${sfx}`));
    console.log(`  By host name  : http://${os.hostname()}${sfx}   (works on some networks)`);
  }
});
