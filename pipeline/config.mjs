// Shared settings for every pipeline script.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// All paths below are relative to the project root, however the script was launched.
process.chdir(fileURLToPath(new URL('..', import.meta.url)));

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

export const cfg = readJson('pipeline/config/states.json');
export const codepoints = readJson('pipeline/config/codepoints.json');
export const VERSION = readJson('package.json').version;

// ONLY=LA,HI,VI narrows a run to a few states (used by the spike). Unset means all of them.
const only = process.env.ONLY?.split(',').map(code => code.trim().toUpperCase()).filter(Boolean);
if (only) {
  const unknown = only.filter(code => !cfg.expected.includes(code));
  if (unknown.length) throw new Error(`ONLY has unknown codes: ${unknown.join(', ')}`);
}
export const codes = only ?? cfg.expected;

export const FULL = 640; // FA 7 full canvas: 20 design px × 32 units
export const HEIGHT = 512; // FA trimmed icons are always 512 tall
export const STEP = 64; // FA trimmed widths are multiples of 64
export const KEYSHAPES = { wide: [512, 384], tall: [384, 512], square: [448, 448] };

// FA's export naming: "texas" → faTexas, alias "tx" → faTx
export const faExportName = name => 'fa' + name.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('');

export const PROJECT = 'United States and Territories Icons';
export const OWNER = 'Tabbatha Crouch';
export const COPYRIGHT_YEAR = 2026;
export const REPO_URL = 'https://github.com/tabbathacrouch/united-states-and-territories-icons-fa';
export const PKG_NAME = 'united-states-and-territories-solid-svg-icons';
export const PKG_DIR = `js-packages/${PKG_NAME}`;
