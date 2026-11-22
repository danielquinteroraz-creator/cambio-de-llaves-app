// Copia el sitio web de ../cambio-de-llaves a www/ y lo deja listo para funcionar
// sin conexión dentro de la app: fuentes y three.js locales en lugar de CDN.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const site = path.resolve(root, '..', 'cambio-de-llaves');
const www = path.join(root, 'www');
const nm = path.join(root, 'node_modules');

const SKIP = new Set(['.git', '.netlify', '.claude', '.gitignore', 'model-source.mjs']);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

if (!fs.existsSync(site)) throw new Error('No se encuentra el sitio en ' + site);
fs.rmSync(www, { recursive: true, force: true });
copyDir(site, www);

// three.js local (misma versión que usa el sitio)
const three = path.join(nm, 'three');
const vendor = path.join(www, 'vendor', 'three');
for (const f of ['build/three.module.js', 'build/three.core.js',
  'examples/jsm/controls/OrbitControls.js', 'examples/jsm/loaders/GLTFLoader.js',
  'examples/jsm/environments/RoomEnvironment.js', 'examples/jsm/utils/BufferGeometryUtils.js',
  'examples/jsm/utils/SkeletonUtils.js']) {
  copy(path.join(three, f), path.join(vendor, f));
}
copy(path.join(three, 'LICENSE'), path.join(vendor, 'LICENSE'));

// Fuentes locales (SIL Open Font License)
const fonts = path.join(www, 'fonts');
copy(path.join(nm, '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2'), path.join(fonts, 'archivo-latin-wdth-normal.woff2'));
for (const w of [400, 500, 600]) {
  copy(path.join(nm, `@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${w}-normal.woff2`), path.join(fonts, `ibm-plex-mono-latin-${w}-normal.woff2`));
}
fs.writeFileSync(path.join(fonts, 'fonts.css'), `/* Archivo e IBM Plex Mono — SIL Open Font License 1.1 (vía Fontsource) */
@font-face { font-family: "Archivo"; font-style: normal; font-display: swap; font-weight: 100 900; font-stretch: 62% 125%; src: url("archivo-latin-wdth-normal.woff2") format("woff2-variations"); }
${[400, 500, 600].map(w => `@font-face { font-family: "IBM Plex Mono"; font-style: normal; font-display: swap; font-weight: ${w}; src: url("ibm-plex-mono-latin-${w}-normal.woff2") format("woff2"); }`).join('\n')}
`);

// Reescribe referencias externas
const googleFonts = /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/g;
let pages = 0;
for (const file of fs.readdirSync(www).filter(f => f.endsWith('.html'))) {
  const p = path.join(www, file);
  const html = fs.readFileSync(p, 'utf8');
  const out = html.replace(googleFonts, '<link rel="stylesheet" href="fonts/fonts.css">')
    .replace(/<link rel="preconnect"[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\s*/g, '');
  fs.writeFileSync(p, out);
  pages++;
}
const ui = path.join(www, 'js', 'viewer-ui.js');
const uiSrc = fs.readFileSync(ui, 'utf8');
const cdn = "'https://cdn.jsdelivr.net/npm/three@0.187.0/'";
if (!uiSrc.includes(cdn)) throw new Error('No se encontró la URL de three.js en viewer-ui.js');
fs.writeFileSync(ui, uiSrc.replace(cdn, "new URL('vendor/three/', document.baseURI).href"));

// Comprobación: no quedan recursos externos (salvo enlaces de WhatsApp/teléfono/correo)
const leftovers = [];
(function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'vendor') scan(p); continue; }
    if (!/\.(html|js|css)$/.test(e.name)) continue;
    const m = fs.readFileSync(p, 'utf8').match(/https?:\/\/(?!wa\.me|www\.w3\.org|api\.whatsapp)[^\s"'<>)]+/g);
    if (m) leftovers.push(path.relative(www, p) + ': ' + [...new Set(m)].join(', '));
  }
})(www);
console.log(`Sitio copiado a www/ (${pages} páginas). three.js y fuentes locales.`);
if (leftovers.length) console.log('Aviso, URLs externas restantes:\n' + leftovers.join('\n'));
