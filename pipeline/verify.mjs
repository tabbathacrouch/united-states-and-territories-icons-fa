// Automated checks on everything emit.mjs produced. Exits 1 on any problem.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { findIconDefinition, library } from '@fortawesome/fontawesome-svg-core';
import { cfg, codepoints, codes, faExportName, FULL, HEIGHT, KEYSHAPES, PKG_DIR, STEP } from './config.mjs';

const require = createRequire(import.meta.url);
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = readJson('work/manifest.json');
const metadata = readJson('metadata/icons.json');
const PKG = path.resolve(PKG_DIR); // absolute: require() resolves relative paths from this file's folder

let fail = 0;
const err = (who, message) => {
  console.error(`❌ ${who}: ${message}`);
  fail++;
};

// 1. Exactly the expected set — an earlier revision could silently ship 55
const built = new Set(manifest.map(m => m.code));
for (const code of codes) if (!built.has(code)) err(code, 'not built');
if (manifest.length !== codes.length) err('set', `expected ${codes.length}, got ${manifest.length}`);

const names = new Set(manifest.map(m => m.iconName));
const seenUnicode = new Map();

for (const m of manifest) {
  const who = m.code;
  const { definition: def } = require(`${PKG}/${m.exportName}.js`);
  const [width, height, aliases, unicode, d] = def.icon;

  // 2. FA's shape rules
  if (def.prefix !== cfg.prefix) err(who, `prefix ${def.prefix}`);
  if (def.iconName !== m.iconName) err(who, `iconName ${def.iconName}`);
  if (height !== HEIGHT) err(who, `height ${height}; FA trimmed icons are ${HEIGHT}`);
  if (width % STEP || width < STEP || width > FULL) err(who, `width ${width} is not a multiple of ${STEP} in ${STEP}–${FULL}`);
  if (typeof d !== 'string' || !/^M/i.test(d)) err(who, 'path must be a single string starting with M');
  else if (d.length > 3000) err(who, `path is ${d.length} bytes (budget 3000)`);
  else if (d.length < 80) err(who, `path is only ${d.length} bytes — over-simplified`);

  // 3. Codepoints: frozen, in our block, unique
  if (unicode !== codepoints[m.code]) err(who, `unicode ${unicode} ≠ codepoints.json ${codepoints[m.code]}`);
  if (!/^e9[0-3][0-9a-f]$/.test(unicode)) err(who, `unicode ${unicode} outside U+E900–U+E93F`);
  if (seenUnicode.has(unicode)) err(who, `unicode shared with ${seenUnicode.get(unicode)}`);
  seenUnicode.set(unicode, who);

  // 4. Aliases: no collisions, and each alias module points back at this icon
  for (const alias of aliases) {
    if (names.has(alias)) err(who, `alias "${alias}" collides with an icon name`);
    const aliasExport = faExportName(alias);
    const aliasFile = `${PKG}/${aliasExport}.js`;
    if (!fs.existsSync(aliasFile)) err(who, `alias module ${aliasExport}.js missing`);
    else if (require(aliasFile)[aliasExport]?.iconName !== m.iconName) err(who, `${aliasExport}.js does not resolve to ${m.iconName}`);
  }

  // 5. Ink fills its keyshape — catches specks and blowouts that still sit "inside the box"
  const [[x0, y0], [x1, y1]] = m.inkBounds;
  if (x0 < -0.5 || y0 < -0.5 || x1 > width + 0.5 || y1 > HEIGHT + 0.5) err(who, 'ink escapes the viewBox');
  const [kw, kh] = KEYSHAPES[m.keyshape];
  const fill = Math.max((x1 - x0) / kw, (y1 - y0) / kh);
  if (fill < 0.99 || fill > 1.01) err(who, `ink fills ${(fill * 100).toFixed(0)}% of its keyshape`);

  // 6. Every format carries the same geometry
  const meta = metadata[m.iconName];
  if (!meta) err(who, 'missing from metadata/icons.json');
  else if (meta.svg.solid.path !== d || meta.unicode !== unicode) err(who, 'metadata disagrees with the JS package');
  if (!fs.readFileSync(`svgs/solid/${m.iconName}.svg`, 'utf8').includes(`d="${d}"`)) err(who, 'svgs/ path differs from the JS package');
  if (!fs.readFileSync(`svgs-full/solid/${m.iconName}.svg`, 'utf8').includes(`viewBox="0 0 ${FULL} ${FULL}"`)) err(who, 'svgs-full/ is not 640×640');
}

// 7. Smoke test through Font Awesome's own core — by name and by alias
library.add(require(`${PKG}/index.js`)[cfg.prefix]);
for (const m of manifest) {
  if (findIconDefinition({ prefix: cfg.prefix, iconName: m.iconName })?.iconName !== m.iconName) err(m.code, 'FA core: not found by name');
  if (findIconDefinition({ prefix: cfg.prefix, iconName: m.aliases[0] })?.iconName !== m.iconName) err(m.code, 'FA core: not found by alias');
}

const scope = codes.length === cfg.expected.length ? '' : ` (partial run: ONLY=${codes.join(',')})`;
console.log(fail ? `\n${fail} problems${scope}` : `✅ ${manifest.length} icons OK${scope}`);
process.exit(fail ? 1 : 0);
