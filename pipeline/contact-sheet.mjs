// Visual check: every icon at real sizes, beside real Font Awesome icons. Writes work/sheet.html.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { FULL, HEIGHT, KEYSHAPES } from './config.mjs';

const require = createRequire(import.meta.url);
const manifest = JSON.parse(fs.readFileSync('work/manifest.json', 'utf8'));
const SIZES = [14, 16, 20, 24, 48];

// FA renders trimmed icons 1em tall with proportional width — do the same
const glyph = (width, d, px) =>
  `<svg viewBox="0 0 ${width} ${HEIGHT}" height="${px}" width="${(width / HEIGHT) * px}" fill="currentColor"><path d="${d}"/></svg>`;

// Full canvas with the keyshape drawn as a guide, to judge placement
const fullWithGuide = (m, px) => {
  const [kw, kh] = KEYSHAPES[m.keyshape];
  return `<svg viewBox="0 0 ${FULL} ${FULL}" width="${px}" height="${px}" class="guide">
    <rect x="0.5" y="0.5" width="${FULL - 1}" height="${FULL - 1}" fill="none" stroke="#ccc" stroke-width="4"/>
    <rect x="${(FULL - kw) / 2}" y="${(FULL - kh) / 2}" width="${kw}" height="${kh}" fill="none" stroke="#e66" stroke-width="4" stroke-dasharray="16 12"/>
    <path fill="currentColor" d="${m.fullPath}"/></svg>`;
};

const references = ['faHouse', 'faFlagUsa', 'faLocationDot'].map(name => require(`@fortawesome/free-solid-svg-icons/${name}`)[name]);
const referenceGlyphs = px => references.map(icon => glyph(icon.icon[0], icon.icon[4], px)).join(' ');

const rows = manifest.map(
  m => `<tr>
  <td><code>${m.iconName}</code><br><small>${m.code} · ${m.keyshape} (${m.ratio}) · w${m.width} · ${m.path.length} B</small></td>
  ${SIZES.map(px => `<td>${glyph(m.width, m.path, px)}</td>`).join('')}
  <td class="compare">${glyph(m.width, m.path, 20)} ${referenceGlyphs(20)}</td>
  <td class="dark">${glyph(m.width, m.path, 24)}</td>
  <td>${fullWithGuide(m, 96)}</td>
</tr>`,
);

fs.writeFileSync(
  'work/sheet.html',
  `<!doctype html><meta charset="utf-8"><title>Contact sheet</title><style>
  body{font:13px system-ui;color:#111;margin:24px}
  table{border-collapse:collapse} td,th{padding:6px 10px;text-align:left;vertical-align:middle}
  tr:nth-child(even){background:#f4f4f4} small{color:#666}
  .dark{background:#1b1b1b;color:#eee} .compare svg{margin-right:6px}
</style>
<table><tr><th>icon</th>${SIZES.map(px => `<th>${px}px</th>`).join('')}<th>vs FA at 20px</th><th>dark</th><th>full + keyshape</th></tr>
${rows.join('\n')}</table>`,
);

console.log(`wrote work/sheet.html (${manifest.length} icons)`);
