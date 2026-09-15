// Geometry → icon records. Reads work/geo/*.json, writes work/manifest.json.
import fs from 'node:fs';
import * as d3 from 'd3-geo';
import { optimize } from 'svgo';
import { cfg, codepoints, codes, faExportName, FULL, HEIGHT, KEYSHAPES, STEP } from './config.mjs';

const kebab = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Conic equal-area projection centered on this one state, so its own distortion is negligible.
function projectionFor(feature) {
  const [lon, lat] = d3.geoCentroid(feature);
  const [[, south], [, north]] = d3.geoBounds(feature); // latitudes only; longitudes can wrap at ±180°
  const span = north - south;
  // Standard parallels at 1/6 and 5/6 of the state's own latitude span
  const parallels = span > 0.5 ? [south + span / 6, north - span / 6] : [lat - 0.5, lat + 0.5];
  return d3.geoConicEqualArea().rotate([-lon, 0]).center([0, lat]).parallels(parallels);
}

// Re-encode a path the way FA ships them: relative commands, one decimal.
function encode(d, width, height) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><path d="${d}"/></svg>`;
  const { data } = optimize(svg, { multipass: true, floatPrecision: 1 });
  const match = data.match(/\sd="([^"]+)"/);
  if (!match) throw new Error(`svgo dropped the path:\n${data}`);
  return match[1];
}

const manifest = [];

for (const code of codes) {
  const gj = JSON.parse(fs.readFileSync(`work/geo/${code}.json`, 'utf8'));
  const feature = gj.type === 'FeatureCollection' ? gj.features[0] : gj;
  if (!feature) throw new Error(`${code}: no feature — check the -filter expression`);

  // A real state covers far less than a hemisphere (2π steradians). More means the rings are wound
  // counter-clockwise and d3 is drawing "the whole globe except this state".
  if (d3.geoArea(feature) > 2 * Math.PI) throw new Error(`${code}: winding is inverted (missing gj2008?)`);
  if (!codepoints[code]) throw new Error(`${code}: add a codepoint to codepoints.json (append; never reuse)`);

  const projection = projectionFor(feature);
  const path = d3.geoPath(projection);

  // Measure the aspect ratio, then pick the FA keyshape that suits it
  projection.fitSize([1000, 1000], feature);
  const [[mx0, my0], [mx1, my1]] = path.bounds(feature);
  const ratio = (mx1 - mx0) / (my1 - my0);
  const keyshape = ratio >= 1.2 ? 'wide' : ratio <= 1 / 1.2 ? 'tall' : 'square';
  const [kw, kh] = KEYSHAPES[keyshape];

  // Full variant: keyshape centered on the 640 × 640 canvas
  const kx = (FULL - kw) / 2;
  const ky = (FULL - kh) / 2;
  projection.fitExtent([[kx, ky], [kx + kw, ky + kh]], feature);
  const fullD = path(feature);
  const [[x0], [x1]] = path.bounds(feature);

  // Trimmed variant: 512 tall, width rounded up to a multiple of 64, shifted by FA's offset.
  // The epsilon stops float noise (512.0000001) from rounding up to 576.
  const width = Math.min(FULL, Math.max(STEP, Math.ceil((x1 - x0) / STEP - 1e-6) * STEP));
  const [tx, ty] = projection.translate();
  projection.translate([tx - (FULL - width) / 2, ty - (FULL - HEIGHT) / 2]);
  const trimD = path(feature);

  const iconName = cfg.names[code] ?? kebab(feature.properties.NAME);

  manifest.push({
    code,
    iconName,
    exportName: faExportName(iconName),
    label: feature.properties.NAME,
    aliases: [code.toLowerCase()],
    unicode: codepoints[code],
    keyshape,
    ratio: +ratio.toFixed(3),
    width,
    inkBounds: path.bounds(feature), // trimmed coordinates, before rounding
    path: encode(trimD, width, HEIGHT),
    fullPath: encode(fullD, FULL, FULL),
  });
}

fs.writeFileSync('work/manifest.json', JSON.stringify(manifest, null, 2));

console.table(
  manifest
    .map(m => ({ code: m.code, iconName: m.iconName, keyshape: m.keyshape, ratio: m.ratio, width: m.width, bytes: m.path.length }))
    .sort((a, b) => b.bytes - a.bytes),
);
console.log(`built ${manifest.length} → work/manifest.json (${manifest.reduce((sum, m) => sum + m.path.length, 0)} bytes of path data)`);
