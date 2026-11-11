// Tests the paywall API against a local mock of Razorpay (no network, no real keys).
const http = require('http'), crypto = require('crypto');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const orders = {}, pays = {}; let n = 0;
const mock = http.createServer((req, res) => {
  let b = ''; req.on('data', c => b += c); req.on('end', () => {
    const send = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (!/^Basic /.test(req.headers.authorization || '')) return send(401, {});
    if (req.method === 'POST' && req.url === '/v1/orders') { const j = JSON.parse(b), id = 'order_T' + (++n) + 'abcdefgh'; orders[id] = { id, amount: j.amount, currency: j.currency, notes: j.notes }; return send(200, orders[id]); }
    let m; if ((m = req.url.match(/^\/v1\/orders\/(.+)$/))) return orders[m[1]] ? send(200, orders[m[1]]) : send(400, {});
    if ((m = req.url.match(/^\/v1\/payments\/(.+)$/))) return pays[m[1]] ? send(200, pays[m[1]]) : send(400, {});
    send(404, {});
  });
});
mock.listen(0, '127.0.0.1', async () => {
  const SECRET = 'testsecret123';
  process.env.RAZORPAY_KEY_ID = 'rzp_test_x'; process.env.RAZORPAY_KEY_SECRET = SECRET; process.env.RAZORPAY_API = 'http://127.0.0.1:' + mock.address().port;
  const { server } = require('./server.js');
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const call = async (path, body, hdr) => { const r = await fetch(base + path, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, hdr || {}), body: JSON.stringify(body) }); return { s: r.status, j: await r.json() }; };
  const birth = { year: 1999, month: 5, day: 21, hour: 17, minute: 25, lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata', name: 'T' };
  const cfg = await (await fetch(base + '/api/config')).json();
  ok(cfg.enabled && cfg.keyId === 'rzp_test_x' && !('secret' in cfg) && cfg.prices.kundli > 0, 'config: enabled, key id only, prices');
  let r = await call('/api/report', { type: 'kundli', birth });
  ok(r.s === 200 && r.j.paid === false && r.j.points[0].html && r.j.points.slice(1).every(p => p.locked && !p.html && !p.tag), 'unpaid: point 1 only, others locked and blank');
  ok(!JSON.stringify(r.j).includes('"html":"<p>') || r.j.points.filter(p => p.html).length === 1, 'unpaid: only one point carries content');
  r = await call('/api/report', { type: 'marriage', birth, partner: Object.assign({ role: 'groom' }, birth, { day: 3, month: 2 }) });
  ok(r.j.paid === false && r.j.meta.matched === false, 'unpaid marriage: partner not matched');
  r = await call('/api/report', { type: 'kundli', birth, tokens: ['x.y', 'bad'] });
  ok(r.j.paid === false, 'fake token rejected');
  const o = await call('/api/order', { type: 'kundli', birth });
  ok(o.s === 200 && o.j.orderId.startsWith('order_') && o.j.amount === cfg.prices.kundli * 100, 'order created with server price');
  let v = await call('/api/verify', { razorpay_order_id: o.j.orderId, razorpay_payment_id: 'pay_TESTPAY0001', razorpay_signature: 'deadbeef' });
  ok(v.s >= 400, 'bad signature rejected');
  const sig = crypto.createHmac('sha256', SECRET).update(o.j.orderId + '|pay_TESTPAY0001').digest('hex');
  v = await call('/api/verify', { razorpay_order_id: o.j.orderId, razorpay_payment_id: 'pay_TESTPAY0001', razorpay_signature: sig });
  ok(v.s === 200 && v.j.token && v.j.report === 'kundli', 'valid signature issues token');
  r = await call('/api/report', { type: 'kundli', birth, tokens: [v.j.token] });
  ok(r.j.paid === true && r.j.points.length === 10 && r.j.points.every(p => p.html), 'paid: full report');
  r = await call('/api/report', { type: 'career', birth, tokens: [v.j.token] });
  ok(r.j.paid === false, 'token is for one report type only');
  r = await call('/api/report', { type: 'kundli', birth: Object.assign({}, birth, { day: 22 }), tokens: [v.j.token] });
  ok(r.j.paid === false, 'token is tied to the birth chart');
  pays.pay_RESTORE00001 = { id: 'pay_RESTORE00001', status: 'captured', order_id: o.j.orderId };
  const rs = await call('/api/restore', { paymentId: 'pay_RESTORE00001' });
  ok(rs.s === 200 && rs.j.token, 'restore from payment id');
  pays.pay_FAILED000001 = { id: 'pay_FAILED000001', status: 'failed', order_id: o.j.orderId };
  ok((await call('/api/restore', { paymentId: 'pay_FAILED000001' })).s >= 400, 'restore refuses uncaptured payment');
  const tampered = v.j.token.slice(0, -2) + (v.j.token.slice(-2) === 'AA' ? 'BB' : 'AA');
  r = await call('/api/report', { type: 'kundli', birth, tokens: [tampered] });
  ok(r.j.paid === false, 'tampered token rejected');
  ok((await call('/api/report', { type: 'kundli', birth: { year: 'x' } })).s === 400, 'validation error is 400');
  ok((await call('/api/report', { type: 'kundli', birth }, { Origin: 'https://evil.example' })).s === 403, 'cross-origin blocked');
  ok((await fetch(base + '/api/report')).status === 405, 'GET on report is 405');
  let last; for (let i = 0; i < 8; i++) last = await call('/api/restore', { paymentId: 'pay_NOPE00000001' }); ok(last.s === 429, 'rate limit kicks in');
  server.close(); mock.close(); console.log(fail ? fail + ' FAILED' : 'all api tests passed'); process.exit(fail ? 1 : 0);
});
