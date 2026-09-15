# Upgrading

This file covers breaking changes: what changed in each major version and what to update in
your code. Minor and patch releases never need changes on your side. See
[CHANGELOG.md](CHANGELOG.md) for everything else.

## What counts as breaking

Any of these gets a major version and a section here:

- An icon is renamed or removed
- An alias is removed
- A codepoint changes (codepoints are never reused)
- The `usat` prefix changes
- A published file or module path moves

Refined geometry and new Census data are **not** breaking. Icons keep their name, size class
and codepoint, but their shapes may shift slightly.

## 1.0.0

First stable release. Nothing to upgrade from.
