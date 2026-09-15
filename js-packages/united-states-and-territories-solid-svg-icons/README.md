# united-states-and-territories-solid-svg-icons

United States and Territories Icons — silhouettes of the 50 US states, DC, and five territories, packaged in
Font Awesome 7's icon format. Not affiliated with Font Awesome.

## Installation

```
npm i united-states-and-territories-solid-svg-icons
```

## Usage

```jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTexas } from 'united-states-and-territories-solid-svg-icons/faTexas';

<FontAwesomeIcon icon={faTexas} title="Texas" />
```

Postal-code aliases work too: `faTx`, or `findIconDefinition({ prefix: 'usat', iconName: 'tx' })`
after `library.add(usat)`.

**Not supported:** `<i class="usat fa-texas">` with Font Awesome's `js/all.js`. Its class parser only
recognizes Font Awesome's own style prefixes.

## License

MIT. Boundary data: U.S. Census Bureau (public domain).
