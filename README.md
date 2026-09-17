# United States and Territories Icons

Silhouettes of the 50 US states, the District of Columbia, and five territories (Puerto Rico,
Guam, US Virgin Islands, American Samoa, Northern Mariana Islands), packaged in
[Font Awesome 7](https://fontawesome.com)'s icon format.

If you already use Font Awesome, these work with `<FontAwesomeIcon>`, `library.add`, and FA-style
SVG sprites, and they're drawn on the same grid, so they sit at the same visual size as FA icons.

> This is an independent project. It is not affiliated with or endorsed by Fonticons, Inc.
> (Font Awesome) or the U.S. Census Bureau.
>
## DEMO
https://us-icons-poc.vercel.app/

## Contents

| Path | What |
|---|---|
| `js-packages/united-states-and-territories-solid-svg-icons` | JS icon package (npm), one module per icon |
| `svgs-full/solid/*.svg` | One SVG per icon, on FA 7's 640 × 640 canvas |
| `svgs/solid/*.svg` | One SVG per icon, trimmed: 512 tall, width a multiple of 64 |
| `sprites-full/solid.svg`, `sprites/solid.svg` | All icons as `<symbol>`s in one file |
| `metadata/icons.json`, `metadata/icon-families.json` | Names, aliases, labels, search terms, codepoints, paths |

## Install

```sh
npm i united-states-and-territories-solid-svg-icons
```

The package depends only on `@fortawesome/fontawesome-common-types`. Install whichever Font Awesome
renderer you already use (`@fortawesome/react-fontawesome`, `@fortawesome/vue-fontawesome`,
`@fortawesome/angular-fontawesome`, or `@fortawesome/fontawesome-svg-core`).

## Usage

### React

```jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTexas } from 'united-states-and-territories-solid-svg-icons/faTexas';

<FontAwesomeIcon icon={faTexas} title="Texas" />
```

Import each icon from its own module path, as above, so your bundle only includes the icons you use.

### Vue

```vue
<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faTexas } from 'united-states-and-territories-solid-svg-icons/faTexas';
</script>

<template>
  <FontAwesomeIcon :icon="faTexas" title="Texas" />
</template>
```

### Angular

```ts
import { faTexas } from 'united-states-and-territories-solid-svg-icons/faTexas';
// in the component class: faTexas = faTexas;
```

```html
<fa-icon [icon]="faTexas" title="Texas"></fa-icon>
```

### Library lookup

```js
import { library, findIconDefinition, icon } from '@fortawesome/fontawesome-svg-core';
import { usat } from 'united-states-and-territories-solid-svg-icons';

library.add(usat);
icon(findIconDefinition({ prefix: 'usat', iconName: 'texas' }));
icon(findIconDefinition({ prefix: 'usat', iconName: 'tx' })); // postal-code alias → texas
```

Registering the whole pack includes all 56 icons in your bundle.

**TypeScript:** importing an icon object like `faTexas` needs no cast. Looking icons up by string
(`{ prefix: 'usat', iconName: 'texas' }` or `['usat', 'texas']`) does, because Font Awesome's
`IconPrefix` and `IconName` types are closed lists that other packages can't extend:

```ts
import type { IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';

findIconDefinition({ prefix: 'usat' as IconPrefix, iconName: 'texas' as IconName });
```

### SVG sprite

Font Awesome recommends the **full** sprites in v7: every icon shares a square canvas, so none look
cropped.

```html
<svg width="20" height="20" role="img" aria-label="Texas">
  <use href="/sprites-full/solid.svg#texas"></use>
</svg>
```

### Bare SVG

Copy a file from `svgs-full/solid/` or `svgs/solid/`. Paths use `fill="currentColor"`, so the icon
takes the surrounding text color.

### Not supported

`<i class="usat fa-texas"></i>` with Font Awesome's `js/all.js` doesn't work. That script's class
parser only recognizes Font Awesome's own style prefixes. Use one of the options above.

## Names

| Thing | Rule | Example |
|---|---|---|
| Icon name | Kebab-case full name | `texas`, `new-mexico` |
| Alias | Lowercase postal code | `tx` |
| JS export | `fa` + PascalCase name or alias | `faTexas`, `faTx` |
| Prefix | `usat` | |

Names worth knowing:

| Code | Icon name |
|---|---|
| DC | `district-of-columbia` (not `washington-dc`; `washington` is the state) |
| PR | `puerto-rico` |
| GU | `guam` |
| VI | `us-virgin-islands` |
| AS | `american-samoa` |
| MP | `northern-mariana-islands` |

The full list, with labels and search terms, is in `metadata/icons.json`.

Each icon also has a fixed Private Use Area codepoint (U+E900–U+E937, alphabetical by postal code),
reserved for a future webfont. Codepoints never change or get reused.

### What `american-samoa` draws

`american-samoa` is **Tutuila alone** — the main island, 68% of the territory's land area. The
Manu'a Islands (Ta'u, Ofu, Olosega) lie 94 km further east, so a to-scale drawing of the whole
territory spent most of its width on open ocean and was unreadable at every size, including 48px.
Cropping to Tutuila trades that completeness for an icon that works at 16px.

`hawaii` keeps its full main chain, because there the islands are large and close enough to still
read as one shape — though it is listed below as a 20px-and-up icon for the same underlying reason.
If you need the Manu'a Islands shown, treat this icon as unsuitable and use a map.

## Accessibility and legibility

- A silhouette carries no text meaning on its own. Give every icon a `title` or `aria-label`, or hide it
  with `aria-hidden="true"` when a visible label sits next to it.
- Island shapes are mostly empty space, so they thin out badly as the icon shrinks. Pair these with the
  name or postal code rather than relying on the silhouette alone:

  | Icon | Reads reliably at |
  |---|---|
  | `northern-mariana-islands`, `us-virgin-islands` | 48px and up |
  | `puerto-rico` | 24px and up |
  | `hawaii` | 20px and up |

  Every other icon, including narrow ones like `tennessee` and `delaware` and the single-island
  `american-samoa`, is recognizable at 16px.

## How the icons are made

Every shape comes from the U.S. Census Bureau's 2025 cartographic boundary file
(`cb_2025_us_state_500k`), through a script pipeline in `pipeline/`:

1. **Extract** each state or territory on its own, clip far-flung islands, drop islands below a per-state area threshold, and simplify for icon-size display ([mapshaper](https://github.com/mbloch/mapshaper))
2. **Project** with an equal-area conic projection centered on that state, then fit it to one of Font Awesome 7's keyshapes: wide, tall, or square ([d3-geo](https://d3js.org/d3-geo))
3. **Encode** paths like Font Awesome's: relative commands, one decimal place ([svgo](https://svgo.dev))
4. **Emit** every format above, then **verify** them all, including a lookup through Font Awesome's own core

To rebuild (Node 20.11+):

```sh
npm ci
npm run fetch   # download the Census file
npm run all     # extract → build → emit → verify → contact sheet
```

Per-state tuning lives in `pipeline/config/states.json`. `npm run sheet` writes
`work/sheet.html`, which shows every icon at 14–48px next to Font Awesome icons.
CI rebuilds everything from source and fails if the committed files differ.

## Versioning

[Semantic versioning](https://semver.org):

| Change | Version bump |
|---|---|
| Refined geometry, new Census vintage | Patch |
| New icon, alias, or style | Minor |
| Renamed or removed icon, changed codepoint or prefix | Major |

See [CHANGELOG.md](CHANGELOG.md) and [UPGRADING.md](UPGRADING.md).

## Prior art

[ProPublica StateFace](https://propublica.github.io/stateface/) (an icon font of the 50 states and
DC) and the projects built on it. This project adds the territories, Font Awesome's format and grid,
and a rerunnable pipeline from current Census data.

## License

MIT for everything: icons, code, and any future fonts. See [LICENSE.txt](LICENSE.txt).

Boundaries: U.S. Census Bureau, Cartographic Boundary Files, 2025 (public domain). The Census Bureau
doesn't endorse this project.
