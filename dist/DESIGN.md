# Tabletop theme, asset pack v2

Design using the supplied starter and v2 asset packs. GitHub Pages publication was subsequently authorized by the user.

## Assets and layout

- `assets/desk-clean.webp` is the active, undecorated wooden table. The older decorated table is not referenced by the running app. The five separate `decor-*.png` assets appear once each in `.desk-decor`, clipped to the table container, with empty alt text, `aria-hidden="true"` and no pointer events. The app shell sits above this layer. Wood and decoration both use document coordinates and scroll together; the background is not viewport-fixed. Below 900px only the reduced orb and lantern remain visible.
- `assets/parchment-panel.png` is used through `border-image` with a 110px source slice and 15–22px visible borders. Character, enemy, initiative, map and dialog panels retain their corners at different heights.
- `assets/button-default.png` skins genuine HTML buttons through a 120px source slice. Small utility controls use temporary CSS frames.
- All paths are relative to `style.css`, including when the app is served below a GitHub Pages repository path.
- `--desk-image`, `--paper-image`, and `--button-image` in `:root` are the swap points for future assets.
- Soft CSS `drop-shadow` filters follow each PNG's alpha silhouette, with reduced shadows below 900px. The asset pixels are unchanged.
- `.desk-decor` is the dedicated non-layout decoration layer. No control positions depend on decoration. Images retain their natural aspect ratios via `height: auto`; their sizes and positions respond to available width.
- `assets/map-frame.png` uses a 190px source slice on the existing map wrapper, without `fill`. The SVG remains interactive inside it and calculates its screen transform itself.
- `assets/toolbar-frame.png` uses a 120px slice with `fill` around the real tool buttons. On very narrow screens the toolbar wraps within the map.
- Long lists scroll inside bounded panels. Below 900px the main panels stack; at narrow phone widths the header controls and tool rows wrap.

## Functional baseline

The local project originally contained the early app. The latest source and existing tests were retrieved from the project's GitHub repository before styling, retaining campaign storage, encounter history, enemy templates, doors, interior rooms, multi-selection and undo/redo. Storage keys and models remain unchanged. `app.js`, `core.js`, `campaign.js`, `drawing.js` and `history.js` have no redesign-specific logic changes.

The previous local files are retained under `outputs/before-tabletop-redesign/`.

## Review

Run `npm test` for all existing functional tests and `npm start` for the local app. The current review server uses port 4175; the normal script uses 4173.

Screenshots and disposable fixture backups are in `outputs/design-review/`. The long-list fixture contains 30 characters, 36 enemy templates and 44 combatants, and was reviewed at 1440px, 390px and 320px widths. It is test data, not user campaign data.
