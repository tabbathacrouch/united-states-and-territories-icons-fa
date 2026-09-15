// Per state, straight from the shapefile: filter → clip → drop small islands → simplify once.
// Writes work/geo/{CODE}.json.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { cfg, codes } from './config.mjs';

const SHP = `pipeline/data/${cfg.source}.shp`;
const MAPSHAPER = 'node_modules/.bin/mapshaper';

if (!fs.existsSync(SHP)) throw new Error(`${SHP} not found — run npm run fetch`);
fs.mkdirSync('work/raw', { recursive: true });
fs.mkdirSync('work/geo', { recursive: true });

// d3-geo needs clockwise outer rings; mapshaper 0.7.x writes RFC 7946 (counter-clockwise) unless
// told gj2008. NO_GJ2008=1 exists only to prove build-icons.mjs catches the inverted result.
const winding = process.env.NO_GJ2008 ? [] : ['gj2008'];

for (const code of codes) {
  const o = { ...cfg.defaults, ...cfg.overrides[code] };
  const raw = `work/raw/${code}.json`;

  // Pass 1 — isolate the state. Simplifying in this same run is wrong: the filtered layer still
  // carries every state's outlines, and the spike measured VI dropping to 4 points (23 when isolated).
  const isolate = ['-quiet', '-i', SHP, '-filter', `STUSPS == '${code}'`];
  if (o.clip) isolate.push('-clip', `bbox=${o.clip.join(',')}`);
  isolate.push('-filter-islands', `min-area=${o.minArea}`, 'remove-empty');
  isolate.push('-o', raw, 'format=geojson', 'gj2008', 'force');
  execFileSync(MAPSHAPER, isolate, { stdio: 'inherit' });

  // Pass 2 — simplify exactly once, relative to this state alone
  const simplify = ['-quiet', '-i', raw, '-simplify', o.simplify, 'keep-shapes'];
  simplify.push('-o', `work/geo/${code}.json`, 'format=geojson', ...winding, 'force');
  execFileSync(MAPSHAPER, simplify, { stdio: 'inherit' });
}

console.log(`extracted ${codes.length} → work/geo/`);
