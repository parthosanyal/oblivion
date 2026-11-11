/* /api routes: report generation (gated by payment), order creation, payment verification, restore. */
const Pay = require('./payments.js'), Service = require('./service.js');
const MAX_BODY = 16 * 1024;

function create(env) {
  const cfg = Pay.config(env), hits = new Map();
  const limit = (ip, key, max) => { const k = key + '|' + ip, now = Date.now(); let h = hits.get(k); if (!h || h.reset < now) { h = { n: 0, reset: now + 60000 }; hits.set(k, h); } h.n++; if (hits.size > 5000) for (const [kk, v] of hits) if (v.reset < now) hits.delete(kk); return h.n <= max; };
  const clientIp = req => { const x = String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean); return x.length ? x[x.length - 1] : (req.socket.remoteAddress || '?'); };
  const readJson = req => new Promise((resolve, reject) => {
    let s = '', over = false;
    req.on('data', c => { if (over) return; s += c; if (s.length > MAX_BODY) { over = true; reject(Object.assign(new Error('Request too large.'), { status: 413 })); } });
    req.on('end', () => { if (over) return; try { resolve(JSON.parse(s || '{}')); } catch (e) { reject(Object.assign(new Error('Invalid JSON.'), { status: 400 })); } });
    req.on('error', reject);
  });
  const publicCfg = () => ({ enabled: cfg.enabled, keyId: cfg.enabled ? cfg.keyId : '', currency: 'INR', prices: cfg.prices, days: cfg.days, bind: cfg.bind });

  /** returns true if the request was an /api request and has been answered */
  async function handle(req, res, pathname, json) {
    if (!pathname.startsWith('/api/')) return false;
    const ok = (code, obj) => json(res, code, obj, req);
    try {
      if (pathname === '/api/config' && (req.method === 'GET' || req.method === 'HEAD')) { ok(200, publicCfg()); return true; }
      if (req.method !== 'POST') { ok(405, { error: 'Method not allowed' }); return true; }
      if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) { ok(415, { error: 'Send JSON.' }); return true; }
      const origin = req.headers.origin; if (origin) { let h; try { h = new URL(origin).host; } catch (e) { h = ''; } if (h !== req.headers.host) { ok(403, { error: 'Cross-origin request blocked.' }); return true; } }
      const ip = clientIp(req), lim = { '/api/report': 30, '/api/order': 10, '/api/verify': 12, '/api/restore': 6 }[pathname];
      if (!lim) { ok(404, { error: 'Not found' }); return true; }
      if (!limit(ip, pathname, lim)) { ok(429, { error: 'Too many requests. Please wait a minute and try again.' }); return true; }
      const body = await readJson(req);

      if (pathname === '/api/report') {
        const type = body.type; if (!Service.TYPES.includes(type)) { ok(400, { error: 'Unknown report.' }); return true; }
        let birth; try { birth = Service.cleanBirth(body.birth); } catch (e) { ok(400, { error: e.message }); return true; }
        let paid = !cfg.enabled;
        if (!paid) { const bh = Pay.birthHash(birth), toks = Array.isArray(body.tokens) ? body.tokens.slice(0, 10) : []; paid = toks.some(t => Pay.tokenOk(cfg, t, type, bh)); }
        const request = paid ? body : { type, birth: body.birth };           // unpaid: never compute partner match or other years
        let out; try { out = Service.build(request); } catch (e) { ok(400, { error: e.message }); return true; }
        if (!paid) { out.points = out.points.map((p, i) => i === 0 ? p : { id: p.id, title: p.title, locked: true }); delete out.varsha; if (type === 'marriage') out.meta = { matched: false }; }
        out.paid = paid; out.price = cfg.prices[type]; out.enabled = cfg.enabled; out.days = cfg.days;
        ok(200, out); return true;
      }
      if (!cfg.enabled) { ok(503, { error: 'Payments are not switched on for this site yet.' }); return true; }
      if (pathname === '/api/order') {
        if (!Pay.REPORTS.includes(body.type)) { ok(400, { error: 'Unknown report.' }); return true; }
        let birth; try { birth = Service.cleanBirth(body.birth); } catch (e) { ok(400, { error: e.message }); return true; }
        ok(200, await Pay.createOrder(cfg, body.type, birth)); return true;
      }
      if (pathname === '/api/verify') { ok(200, await Pay.verifyPayment(cfg, body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)); return true; }
      if (pathname === '/api/restore') { ok(200, await Pay.restore(cfg, String(body.paymentId || '').trim())); return true; }
    } catch (e) {
      const code = e.status && e.status >= 400 && e.status < 600 && !/provider/.test(e.message) ? e.status : 400;
      ok(/provider|timed out/i.test(e.message) ? 502 : code, { error: /provider|timed out/i.test(e.message) ? 'The payment service did not respond. Please try again.' : (e.message || 'Request failed.') }); return true;
    }
    return true;
  }
  return { handle, cfg };
}
module.exports = { create };
