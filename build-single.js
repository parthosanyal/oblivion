// node build-single.js  -> dist/jyotish-kundli.html (one self-contained file for any static host)
const fs = require('fs'), path = require('path'), R = f => fs.readFileSync(path.join(__dirname, 'public', f), 'utf8');
let html = R('index.html');
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'public', f)).toString('base64');
html = html.replace('src="icon-logo.png"', () => 'src="' + b64('icon-logo.png') + '"');
html = html.replace(/<link rel="stylesheet" href="style.css">/, () => '<style>' + R('style.css') + '</style>');
const L = f => fs.readFileSync(path.join(__dirname, 'lib', f), 'utf8');
for (const f of ['engine.js', 'predict.js', 'bala.js', 'reading.js', 'cities.js', 'geo.js', 'place.js', 'app.js', 'nav.js']) html = html.replace(`<script src="${f}"></script>`, () => '<script>' + R(f) + '</script>');
// report engines live in lib/ (server side); the offline demo inlines them so reports work without a server (free, no payments)
html = html.replace('<script src="sections.js"></script>', () => ['texts.js', 'koota.js', 'numerology.js', 'reports.js', 'service.js'].map(f => '<script>' + L(f) + '</script>').join('\n') + '\n<script>' + R('sections.js') + '</script>');
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'jyotish-kundli.html'), html);
// Artifact variant: no doctype/head/body wrapper, no print button (window.print is blocked in the viewer)
let body = html.replace(/[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*/, '');
body = body.replace(/\s*<button id="print"[^>]*>.*?<\/button>/, '');
const style = (html.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
body = body.replace(style, '');
const art = '<title>Jyotish Kundli</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' + style + '\n' + body;
fs.writeFileSync(path.join(__dirname, 'dist', 'artifact.html'), art);
console.log('built dist/jyotish-kundli.html and dist/artifact.html');
