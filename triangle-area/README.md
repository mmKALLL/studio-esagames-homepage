# Triangle Matching Puzzle — source

Plain frontend, no build step, no dependencies. Open `index.html` in a browser.

    src/
      index.html   markup and element ids
      style.css    all styling
      app.js       all logic

## Where to edit what

**app.js → `CONFIG`** (top of file) holds every setting:

| key | meaning |
| --- | --- |
| `N` | grid is N × N lattice points (default 19) |
| `EXTEND_BY` | how many points Auto-solve adds on top of the placed ones (default 5) |
| `SEARCH_MS` | time budget for the randomized search |
| `MAX_SOLUTIONS` | how many distinct results to keep for ‹ › stepping |
| `LANG` | `'ja'` or `'en'` — starting language |
| `BOARD_STYLE` | `Graph paper` \| `Blueprint` \| `Minimal` \| `Dot grid` |
| `COLLISION_STYLE` | `Translucent fill` \| `Bold outline` \| `Glow` |
| `DISTINCT_GROUP_COLORS` | `false` makes every matching group red |
| `IGNORE_COLLINEAR` | start with straight-line triples ignored |
| `SHOW_SAFE` | start with the safe-cell overlay on |
| `CRITERIA` | which matching rules start enabled |

**app.js → `I18N`** holds all UI text for both languages. Add a language by
adding a third key and extending the `langBtn` cycle in section 8.

**app.js sections**, in order: 1 config · 2 text · 3 state · 4 geometry ·
5 analysis · 6 auto-solve · 7 rendering · 8 event wiring.

## How matching works

`sigsOf(A, B, C)` reduces a triple to three comparable strings:

- `area` — twice the signed area, an exact integer on a lattice
- `perim` — the sum of side lengths, rounded to 6 decimals
- `congru` — the three squared side lengths, sorted

Two triangles match when the strings are equal under any enabled rule.
`analyze()` buckets all triangles by signature and union-finds the matching
ones into groups, which is what the board fills in and what the "match
groups" counter reports.

## Notes

- Fonts load from Google Fonts; the page still works offline with fallbacks.
- Complexity is O(p³) in the number of placed points, fine for dozens of points.
- Empty lattice dots and their safe rings are hidden where they fall inside or
  on the edge of a highlighted triangle (`coveredByCollision`).
