// Icon records → every published format. Each template copies the shape of the matching
// Font Awesome 7 file (see the plan, Step 0). Reads work/manifest.json.
import fs from 'node:fs';
import {
  cfg,
  COPYRIGHT_YEAR,
  faExportName,
  FULL,
  HEIGHT,
  OWNER,
  PKG_DIR,
  PKG_NAME,
  PROJECT,
  REPO_URL,
  VERSION,
} from './config.mjs';

const manifest = JSON.parse(fs.readFileSync('work/manifest.json', 'utf8'));
const PREFIX = cfg.prefix;
const TERRITORIES = new Set(['PR', 'GU', 'VI', 'AS', 'MP']);

const readJsonIfExists = file => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {});
const write = (file, content) => {
  fs.mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  fs.writeFileSync(file, content);
};

// Read the previous metadata before wiping anything: it carries each icon's `changes` history.
const previousIcons = readJsonIfExists('metadata/icons.json');
const previousFamilies = readJsonIfExists('metadata/icon-families.json');

// Outputs always mirror the manifest exactly — stale icons must not survive a rebuild.
for (const dir of ['svgs/solid', 'svgs-full/solid', 'sprites', 'sprites-full', PKG_DIR]) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const icons = [...manifest].sort((a, b) => a.iconName.localeCompare(b.iconName));

// ---------------------------------------------------------------------------------------------
// Banners — FA keeps license headers in "bang" comments so minifiers preserve them
// ---------------------------------------------------------------------------------------------

const creditLine = `${PROJECT} ${VERSION} by ${OWNER} - ${REPO_URL}`;
const jsBanner = `/*!\n * ${creditLine}\n * License - MIT\n * Copyright ${COPYRIGHT_YEAR} ${OWNER}\n */`;
const svgBanner = `<!--! ${creditLine} License - MIT Copyright ${COPYRIGHT_YEAR} ${OWNER} -->`;

// ---------------------------------------------------------------------------------------------
// Bare SVGs and sprites (FA: svgs/, svgs-full/, sprites/, sprites-full/)
// ---------------------------------------------------------------------------------------------

const trimmedSvg = (m, banner = svgBanner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.width} ${HEIGHT}">${banner}<path fill="currentColor" d="${m.path}"/></svg>`;
const fullSvg = m =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FULL} ${FULL}">${svgBanner}<path fill="currentColor" d="${m.fullPath}"/></svg>`;

for (const m of icons) {
  write(`svgs/solid/${m.iconName}.svg`, trimmedSvg(m));
  write(`svgs-full/solid/${m.iconName}.svg`, fullSvg(m));
}

const sprite = symbol =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!--!',
    creditLine,
    'License - MIT',
    `Copyright ${COPYRIGHT_YEAR} ${OWNER}`,
    '-->',
    '<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">',
    ...icons.map(symbol),
    '</svg>',
    '',
  ].join('\n');

write('sprites/solid.svg', sprite(m => `<symbol id="${m.iconName}" viewBox="0 0 ${m.width} ${HEIGHT}">\n<path fill="currentColor" d="${m.path}"/>\n</symbol>`));
write('sprites-full/solid.svg', sprite(m => `<symbol id="${m.iconName}" viewBox="0 0 ${FULL} ${FULL}">\n<path fill="currentColor" d="${m.fullPath}"/>\n</symbol>`));

// ---------------------------------------------------------------------------------------------
// Metadata (FA: metadata/icons.json, metadata/icon-families.json)
// ---------------------------------------------------------------------------------------------

const searchTerms = m => {
  const kind = m.code === 'DC' ? 'district' : TERRITORIES.has(m.code) ? 'territory' : 'state';
  return [...new Set([m.code.toLowerCase(), m.label.toLowerCase(), kind, 'united states', 'usa'])];
};

const changesFor = m => {
  const previous = previousIcons[m.iconName];
  if (!previous) return [VERSION];
  if (previous.svg.solid.path === m.path || previous.changes.at(-1) === VERSION) return previous.changes;
  return [...previous.changes, VERSION];
};

const svgRecord = m => ({
  raw: trimmedSvg(m, ''),
  viewBox: [0, 0, m.width, HEIGHT],
  width: m.width,
  height: HEIGHT,
  path: m.path,
});

const iconsJson = {};
const familiesJson = {};

for (const m of icons) {
  const shared = {
    aliases: { names: m.aliases },
    changes: changesFor(m),
    ligatures: [],
    search: { terms: searchTerms(m) },
  };

  iconsJson[m.iconName] = {
    ...shared,
    styles: ['solid'],
    unicode: m.unicode,
    label: m.label,
    voted: false,
    svg: { solid: svgRecord(m) },
    free: ['solid'],
  };

  const previousSolid = previousFamilies[m.iconName]?.svgs?.classic?.solid;
  const lastModified = previousSolid?.path === m.path ? previousSolid.lastModified : Math.floor(Date.now() / 1000);

  familiesJson[m.iconName] = {
    ...shared,
    unicode: m.unicode,
    label: m.label,
    voted: false,
    svgs: { classic: { solid: { lastModified, ...svgRecord(m) } } },
    familyStylesByLicense: { free: [{ family: 'classic', style: 'solid' }], pro: [] },
  };
}

write('metadata/icons.json', JSON.stringify(iconsJson, null, 2) + '\n');
write('metadata/icon-families.json', JSON.stringify(familiesJson, null, 2) + '\n');

// ---------------------------------------------------------------------------------------------
// JS package (FA: js-packages/@fortawesome/free-solid-svg-icons)
// ---------------------------------------------------------------------------------------------

const pkg = file => `${PKG_DIR}/${file}`;

// Per-icon type declarations are identical for canonical icons and aliases
const iconDts = exportName => `import { IconDefinition, IconPrefix, IconName } from "@fortawesome/fontawesome-common-types";
export const definition: IconDefinition;
export const ${exportName}: IconDefinition;
export const prefix: IconPrefix;
export const iconName: IconName;
export const width: number;
export const height: number;
export const ligatures: (string | number)[];
export const unicode: string;
export const svgPathData: string;
export const aliases: (string | number)[];`;

const iconCjs = m => `'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var prefix = '${PREFIX}';
var iconName = '${m.iconName}';
var width = ${m.width};
var height = ${HEIGHT};
var aliases = ${JSON.stringify(m.aliases)};
var unicode = '${m.unicode}';
var svgPathData = '${m.path}';

exports.definition = {
  prefix: prefix,
  iconName: iconName,
  icon: [
    width,
    height,
    aliases,
    unicode,
    svgPathData
  ]};

exports.${m.exportName} = exports.definition;
exports.prefix = prefix;
exports.iconName = iconName;
exports.width = width;
exports.height = height;
exports.ligatures = aliases;
exports.unicode = unicode;
exports.svgPathData = svgPathData;
exports.aliases = aliases;`;

const aliasCjs = (m, aliasExport) => `'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var source = require('./${m.exportName}');
exports.definition = {
  prefix: source.prefix,
  iconName: source.iconName,
  icon: [
    source.width,
    source.height,
    source.aliases,
    source.unicode,
    source.svgPathData
  ]};

exports.${aliasExport} = exports.definition;
exports.prefix = source.prefix;
exports.iconName = source.iconName;
exports.width = source.width;
exports.height = source.height;
exports.ligatures = source.aliases;
exports.unicode = source.unicode;
exports.svgPathData = source.svgPathData;
exports.aliases = source.aliases;`;

const exportNames = [];
const iconVars = [];

for (const m of icons) {
  write(pkg(`${m.exportName}.js`), iconCjs(m));
  write(pkg(`${m.exportName}.d.ts`), iconDts(m.exportName));
  exportNames.push(m.exportName);
  iconVars.push(
    `var ${m.exportName} = {\n  prefix: '${PREFIX}',\n  iconName: '${m.iconName}',\n  icon: [${m.width}, ${HEIGHT}, ${JSON.stringify(m.aliases)}, "${m.unicode}", "${m.path}"]\n};`,
  );

  for (const alias of m.aliases) {
    const aliasExport = faExportName(alias);
    write(pkg(`${aliasExport}.js`), aliasCjs(m, aliasExport));
    write(pkg(`${aliasExport}.d.ts`), iconDts(aliasExport));
    exportNames.push(aliasExport);
    iconVars.push(`var ${aliasExport} = ${m.exportName};`);
  }
}

const iconsObject = `var icons = {\n${exportNames.map(name => `  ${name}: ${name}`).join(',\n')}\n};`;
const indent = text => text.replace(/^(?=.)/gm, '  ');

write(
  pkg('index.mjs'),
  `${jsBanner}
var prefix = "${PREFIX}";
${iconVars.join('\n')}
${iconsObject}

export { icons as ${PREFIX}, prefix, ${exportNames.join(', ')} };
`,
);

write(
  pkg('index.js'),
  `${jsBanner}
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global['${PKG_NAME}'] = {})));
}(this, (function (exports) { 'use strict';

  var prefix = "${PREFIX}";
${indent(iconVars.join('\n'))}
${indent(iconsObject)}

  exports.${PREFIX} = icons;
  exports.prefix = prefix;
${exportNames.map(name => `  exports.${name} = ${name};`).join('\n')}

  Object.defineProperty(exports, '__esModule', { value: true });

})));
`,
);

write(
  pkg('index.d.ts'),
  `${exportNames.map(name => `export const ${name}: IconDefinition;`).join('\n')}
import { IconDefinition, IconLookup, IconName, IconPrefix, IconPack } from '@fortawesome/fontawesome-common-types';
export { IconDefinition, IconLookup, IconName, IconPrefix, IconPack } from '@fortawesome/fontawesome-common-types';
export const prefix: IconPrefix;
export const ${PREFIX}: IconPack;`,
);

const entry = { types: './index.d.ts', import: './index.mjs', require: './index.js', default: './index.js' };

write(
  pkg('package.json'),
  JSON.stringify(
    {
      name: PKG_NAME,
      version: VERSION,
      description: `${PROJECT}: US state and territory silhouettes in Font Awesome's icon format`,
      keywords: ['fontawesome', 'icon', 'svg', 'us-states', 'territories', 'map'],
      homepage: REPO_URL,
      bugs: { url: `${REPO_URL}/issues` },
      author: OWNER,
      repository: { type: 'git', url: REPO_URL },
      license: 'MIT',
      main: 'index.js',
      module: 'index.mjs',
      'jsnext:main': 'index.mjs',
      types: './index.d.ts',
      sideEffects: false,
      engines: { node: '>=6' },
      dependencies: { '@fortawesome/fontawesome-common-types': '^7.0.0' },
      exports: { '.': entry, './index': entry, './index.js': entry, './package.json': './package.json', './*': './*.js' },
    },
    null,
    2,
  ) + '\n',
);

write(
  pkg('LICENSE.txt'),
  `MIT License

Copyright (c) ${COPYRIGHT_YEAR} ${OWNER}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Boundary data: U.S. Census Bureau, Cartographic Boundary Files (public domain).
This project is not affiliated with or endorsed by Fonticons, Inc. or the U.S. Census Bureau.
`,
);

write(
  pkg('README.md'),
  `# ${PKG_NAME}

${PROJECT} — silhouettes of the 50 US states, DC, and five territories, packaged in
Font Awesome 7's icon format. Not affiliated with Font Awesome.

## Installation

\`\`\`
npm i ${PKG_NAME}
\`\`\`

## Usage

\`\`\`jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTexas } from '${PKG_NAME}/faTexas';

<FontAwesomeIcon icon={faTexas} title="Texas" />
\`\`\`

Postal-code aliases work too: \`faTx\`, or \`findIconDefinition({ prefix: '${PREFIX}', iconName: 'tx' })\`
after \`library.add(${PREFIX})\`.

**Not supported:** \`<i class="${PREFIX} fa-texas">\` with Font Awesome's \`js/all.js\`. Its class parser only
recognizes Font Awesome's own style prefixes.

## License

MIT. Boundary data: U.S. Census Bureau (public domain).
`,
);

console.log(`emitted ${icons.length} icons (${exportNames.length} JS exports incl. aliases) → svgs/, svgs-full/, sprites/, sprites-full/, metadata/, ${PKG_DIR}/`);
