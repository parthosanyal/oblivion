# Securing the Jyotish Kundli site

## What this app already does
- All chart maths runs in the browser. No birth data is sent to any server, stored in a database or logged.
- The local server is read-only (GET/HEAD only), blocks path traversal, and sends security headers
  (Content-Security-Policy, nosniff, frame denial, no-referrer, restrictive Permissions-Policy).
- It listens on 127.0.0.1 by default, so only your own computer can open it.
- User-typed text (the name field) is HTML-escaped before display.
- Birth details are remembered only in your own browser (localStorage). Clear site data to remove them.

## If you put it on the internet
1. Use a static host that gives you HTTPS automatically (Netlify, Cloudflare Pages, GitHub Pages, Vercel). Do not expose `node server.js` directly.
2. Turn on HTTPS-only and HSTS in the host settings. Redirect http to https.
3. Add the same headers as server.js. Static hosts: a `_headers` file (Netlify/Cloudflare) is included in dist/ after `node build-single.js`.
   For the single-file build, scripts are inline, so use a CSP that allows them via a hash or `'unsafe-inline'` for scripts, or deploy the multi-file `public/` folder, which needs no inline scripts.
4. Put Cloudflare (free) or your host's CDN in front for DDoS and bot protection.
5. Use a strong, unique password plus two-factor authentication on the hosting, domain registrar and GitHub accounts. Most real compromises start there.
6. Keep Node.js updated if you run the server yourself, run it as a non-admin user, and never run it with sudo except for port 80 on a trusted machine.
7. If you later add logins, saved charts or a database, that changes the risk: use a proven auth provider, hash passwords (bcrypt/argon2), validate input on the server, keep secrets in environment variables, and tell users what you store (birth data is personal data; privacy laws such as India's DPDP Act and GDPR apply).
8. Do not put API keys in the front-end code. Anything in public/ is visible to everyone.

## Quick check
- Visit https://securityheaders.com and https://www.ssllabs.com/ssltest/ with your public URL.
