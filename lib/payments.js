/* Razorpay payments + signed access tokens. Zero dependencies (Node crypto/http/https).
 * Env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (both needed to switch payments on),
 *      TOKEN_SECRET (optional, signs access tokens), PRICE_KUNDLI/MARRIAGE/CAREER/NUMEROLOGY/YEARLY (rupees),
 *      TOKEN_DAYS (default 365), BIND_TO_CHART=0 to let a purchase work for any birth details on that device.
 */
const crypto = require('crypto'), https = require('https'), http = require('http');
const REPORTS = ['kundli', 'marriage', 'career', 'numerology', 'yearly'];
const DEFAULT_PRICES = { kundli: 99, marriage: 199, career: 149, numerology: 49, yearly: 99 };
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function config(env) {
  env = env || process.env;
  const keyId = (env.RAZORPAY_KEY_ID || '').trim(), secret = (env.RAZORPAY_KEY_SECRET || '').trim(), prices = {};
  REPORTS.forEach(r => { const v = Math.round(Number(env['PRICE_' + r.toUpperCase()])); prices[r] = v >= 1 ? v : DEFAULT_PRICES[r]; });
  return { enabled: !!(keyId && secret), keyId, secret, prices, days: Math.max(1, Number(env.TOKEN_DAYS) || 365), api: (env.RAZORPAY_API || 'https://api.razorpay.com').replace(/\/$/, ''), bind: env.BIND_TO_CHART !== '0',
    tokenSecret: env.TOKEN_SECRET || crypto.createHash('sha256').update('jk-token:' + secret).digest('hex') };
}
const birthHash = b => crypto.createHash('sha256').update([b.year, b.month, b.day, b.hour, b.minute, (+b.lat).toFixed(2), (+b.lon).toFixed(2)].join('|')).digest('hex').slice(0, 16);

function signToken(cfg, data) { const p = b64u(JSON.stringify(data)); return p + '.' + b64u(crypto.createHmac('sha256', cfg.tokenSecret).update(p).digest()); }
/** true when token is genuine, unexpired, for this report (and this birth chart when binding is on) */
function tokenOk(cfg, token, report, bh) {
  try {
    if (typeof token !== 'string' || token.length > 700) return false;
    const [p, sig] = token.split('.'); if (!p || !sig) return false;
    if (!safeEq(b64u(crypto.createHmac('sha256', cfg.tokenSecret).update(p).digest()), sig)) return false;
    const d = JSON.parse(unb64u(p).toString('utf8'));
    return d.r === report && d.exp > Date.now() && (!cfg.bind || d.bh === bh);
  } catch (e) { return false; }
}
const issue = (cfg, report, bh, orderId) => signToken(cfg, { r: report, bh, o: orderId, exp: Date.now() + cfg.days * 864e5 });

function rzp(cfg, method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(cfg.api + path), mod = u.protocol === 'http:' ? http : https, data = body ? JSON.stringify(body) : null;
    const req = mod.request({ method, hostname: u.hostname, port: u.port || undefined, path: u.pathname + u.search, timeout: 12000,
      headers: Object.assign({ Authorization: 'Basic ' + Buffer.from(cfg.keyId + ':' + cfg.secret).toString('base64'), Accept: 'application/json' }, data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}) }, res => {
      let s = ''; res.on('data', c => { s += c; if (s.length > 200000) req.destroy(); });
      res.on('end', () => { let j = null; try { j = JSON.parse(s); } catch (e) {} if (res.statusCode >= 200 && res.statusCode < 300 && j) resolve(j); else { const err = new Error('Payment provider error (' + res.statusCode + ')'); err.status = res.statusCode; reject(err); } });
    });
    req.on('timeout', () => req.destroy(new Error('Payment provider timed out')));
    req.on('error', reject);
    if (data) req.write(data); req.end();
  });
}

async function createOrder(cfg, report, birth) {
  if (!REPORTS.includes(report)) throw new Error('Unknown report.');
  const o = await rzp(cfg, 'POST', '/v1/orders', { amount: cfg.prices[report] * 100, currency: 'INR', receipt: ('jk_' + report + '_' + Date.now().toString(36)).slice(0, 40), notes: { report, bh: birthHash(birth) } });
  return { orderId: o.id, amount: o.amount, currency: o.currency, keyId: cfg.keyId };
}
const orderRe = /^order_[A-Za-z0-9]{6,40}$/, payRe = /^pay_[A-Za-z0-9]{6,40}$/;
async function tokenForOrder(cfg, orderId) {
  const o = await rzp(cfg, 'GET', '/v1/orders/' + orderId), n = o.notes || {};
  if (!REPORTS.includes(n.report) || typeof n.bh !== 'string') throw new Error('This payment is not for a report.');
  return { token: issue(cfg, n.report, n.bh, orderId), report: n.report };
}
/** after Razorpay Checkout success: verify its signature, then issue a token */
async function verifyPayment(cfg, orderId, paymentId, signature) {
  if (!orderRe.test(orderId || '') || !payRe.test(paymentId || '') || typeof signature !== 'string') throw new Error('Invalid payment details.');
  const expect = crypto.createHmac('sha256', cfg.secret).update(orderId + '|' + paymentId).digest('hex');
  if (!safeEq(expect, signature)) throw new Error('Payment could not be verified.');
  return tokenForOrder(cfg, orderId);
}
/** restore access on a new device from a payment id (receipt) */
async function restore(cfg, paymentId) {
  if (!payRe.test(paymentId || '')) throw new Error('That does not look like a payment ID (it starts with pay_).');
  const p = await rzp(cfg, 'GET', '/v1/payments/' + paymentId);
  if (!['captured', 'authorized'].includes(p.status) || !orderRe.test(p.order_id || '')) throw new Error('That payment was not completed.');
  return tokenForOrder(cfg, p.order_id);
}
module.exports = { config, birthHash, signToken, tokenOk, issue, createOrder, verifyPayment, restore, REPORTS };
