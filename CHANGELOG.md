# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-09-16

### Changed

- `american-samoa` now draws **Tutuila alone** instead of the whole territory to scale. The previous
  shape placed Tutuila and the Manu'a Islands 94 km apart on one canvas, which left the icon roughly
  60% empty ocean and illegible at every size, 48px included. It now reads at 16px, like the other
  icons. Same icon name, same `usat` prefix, same codepoint (U+E903) — no import changes.
  See "What `american-samoa` draws" in the README for what this leaves out.

No other icon's geometry changed.

## [1.0.0] - 2026-09-16

First release.

### Added

- 56 solid icons: the 50 states, the District of Columbia, Puerto Rico, Guam, US Virgin Islands,
  American Samoa, and Northern Mariana Islands
- JS package `united-states-and-territories-solid-svg-icons` with prefix `usat`, one module per icon,
  and lowercase postal-code aliases (`faTexas` / `faTx`)
- Bare SVGs (`svgs/solid`, `svgs-full/solid`), SVG sprites (`sprites/solid.svg`, `sprites-full/solid.svg`),
  and metadata (`metadata/icons.json`, `metadata/icon-families.json`)
- Private Use Area codepoints U+E900–U+E937, fixed permanently
- Geometry from the U.S. Census Bureau 2025 cartographic boundary file (`cb_2025_us_state_500k`)
