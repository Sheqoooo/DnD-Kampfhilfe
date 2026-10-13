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

## Battlefield view

The interface now uses one tabletop theme; the previous day/night switch and its runtime styles have been removed. Campaign data and storage keys remain unchanged.

`viewport.js` defines a separate camera with a 25–400% zoom range. The SVG's `viewBox` displays that camera; the existing `getScreenCTM().inverse()` converts input back to map coordinates for drawing, doors and enemy drops. Camera changes do not enter encounter snapshots or undo history.

Use the +/− controls and Reset above the field. The hand tool (P), middle mouse drag, or Space held over the focused map pans the view. Ctrl/Cmd + wheel zooms about the pointer; unmodified wheel input still scrolls the page. Mobile users can use the same zoom controls and hand tool.

Verification includes 51 unit tests, actual token dragging, wall drawing and door placement at 156% zoom, camera panning at 400%, reset, and overflow checks at 320px width.

The background and grid rectangles track the camera, so the grid fills the visible viewport at every zoom level and pan position. The grid remains anchored to world coordinates. `world.js` shares generous finite drawing bounds (x −10000…11000, y −7000…7700) across camera, input, editing, enemy placement, door masks and import validation. Additional visible space is fully editable; existing coordinates and saved data retain their meaning. Reset always returns to the original 100% view, including after panning at 100%.

Expanded-grid verification: 53 passing tests, actual room drawing and token movement outside the old map, Undo/Redo and reload persistence, panning at 25%, and a 390px mobile view without horizontal overflow.

## Neutral tokens and UI controls (local controls-1)

Read `dnd-ui-controls/TOKENS-Codex.md` before `README-Codex.md`; the token instructions supersede the portrait recommendation. Compact token-base.webp is used once per marker, without stacking the portrait frame. No portrait or upload feature existed, so portrait-frame.webp is available for future integration but is not shown over neutral medals.

`tokenMarkup` is shared by the character list (72px), initiative (48px), and SVG map via a foreignObject containing real HTML text. The map uses abbreviation-only medals and keeps their visual diameter at least 28 screen pixels when zoomed out; actual coordinates and hit interaction still belong to the original SVG group. Names remain visible outside tokens at larger zooms and are always present in accessible labels. Each player or enemy marker remains an editable button or draggable map control. All decorative images/SVGs ignore pointer events and are hidden from assistive technology.

`tokens.js` adds only optional `tokenCode` display metadata, retaining existing schema versions, IDs, values, and positions. Labels are reserved before assigning newcomers; linked character copies share their master character's label. Existing codes remain stable across renames, filtering, initiative sorting, encounter history, and reloads. Same initials and identical monsters get distinct codes. Numeric name suffixes such as Goblin 1/2 are preferred when available. Explicit creatureType/monsterType metadata chooses neutral symbols; names are never used to infer creature types. Team colors are a soft halo behind the original bronze asset, with gold for the active turn. Symbols distinguish neutral character/monster types; an active token also has a diamond and accessible “am Zug” text. The halo never paints over the bronze ring.

Supplied SVGs are embedded inline via `ui-icons.js` and in static markup so currentColor follows controls. Existing button labels and keyboard shortcuts remain. Icons map to existing actions; redo mirrors undo, and the unsupplied rectangle/ellipse icons remain simple SVG geometry. Tool and icon action buttons use at least 44px hit targets and retain focus states. Raw SVG files are also retained in `dist/icons` for later reuse.

Verified: 57 unit tests; neutral marker persistence/collision cases; actual enemy duplication, initiative reorder, dragging, room drawing and undo; zoom at 25%; 72px and 48px markers; 320px viewport with no horizontal overflow; 30-character / 36-template / 44-participant fixture with independent list scrolling. The user subsequently authorized publishing all updates directly to GitHub, overriding the package’s initial no-publication instruction.

The normal selection tool now pans on empty map space. Holding Shift or enabling Mehrfachauswahl retains marquee selection; tokens, shapes and resize handles retain their existing drag actions. Panning never writes encounter data or creates undo entries.

Manual combat order: no dice actions or initiative fields are displayed. Legacy initiative values remain hidden for backup compatibility; `prepareManualOrder` preserves the displayed legacy order once and then uses only turnPosition. New entries append; drag-and-drop, ↑/↓ and Alt+Arrow reorder immediately, with visible place numbers. Reordering a not-yet-started fight selects the first position; ongoing fights retain their active combatant. 59 tests cover migration, appending, round progression, characters, history and saved data. Token keyboard focus is a brown dashed outline, separate from the team halo and active gold diamond.

## Small tabletop decoration addon

Read dnd-decor-addon/README-Codex.md before integrating. The user's explicit instruction authorizes publication, superseding the README's default no-publication text. All ten transparent compact WebPs are copied to dist/assets. Twelve deliberately positioned images reuse two coins and two subtle dust groups; no randomization or spiderwebs. Existing five large props and desk-clean.webp remain unchanged.

Coins and violet shards sit near the orb/books, amber shards below the lantern. The satchel is rotated along the upper right edge and deliberately clipped. Scroll, letter and compass occupy lower outer margins. Image dimensions preserve aspect ratios and reserve layout; widths account for the supplied transparent padding. Shadows are light, supplied glows are retained, and dust opacity is .35–.4. The existing overflow-hidden, aria-hidden, pointer-events:none layer sits below all UI. All addon motifs disappear at ≤1100px to preserve free working space, while existing v2 responsive rules continue to apply. No gameplay or storage code changes.

Addon verification: visual comparison at 1265px and 1440px; no horizontal overflow at 390px with extra props hidden; long lists of 30 characters, 36 templates and 44 combatants; actual room drawing, undo, and view panning via selection tool. Background verified as desk-clean.webp and all 12 addon images remain in the non-interactive decorative layer.

## Decoration spacing correction

Desktop widths above 1200px reserve 132–185px side lanes and a clear top margin. Large motifs and addon props are placed fully inside these lanes, with separate vertical slots for orb/shards/coins, lantern/amber/satchel, books/shard/coin, and lower scroll/letter/compass. Contact and cast shadows are strengthened without adding glow. At ≤1200px only the orb and lantern remain, entirely inside a reserved header band. The ink PNG was inspected at reduced size and has an internally cut-off base; its runtime image is removed until a complete replacement is supplied. The source asset is retained.

## Curated decorative groups

The evenly spaced edge-lane layout is superseded by three explicit aria-hidden subgroups in the decorative layer: upper-left magic (orb, books, candles, violet crystals and coins), upper-right travel (lantern, 190px satchel, amber crystals and coin), and lower-left notes (scroll, letter, compass). Desktop uses a reserved top band for the two wider still lifes while side insets keep lower props clear of panels. Existing shadows are retained. Transparent image bounds may come close within groups, but important visible silhouettes remain readable. At ≤1200px only the orb and lantern remain in the header band. All positions are deterministic; no interactions or stored data change.

Compact header correction: the desktop header occupies the clear central space between the corner groups at 32px from the top, with the full-width content following below their inner silhouettes. Coins/crystals at lower corners stay within the edge lanes. Map token foreignObject and HTML wrapper now have a 12px transparent margin on every side; the medal keeps its original 56px size and exact center, while the soft halo can fade without a square clip.

The combat-history details element uses the shared parchment 9-slice border, a 44px accessible summary hit area, and native keyboard/collapse behavior. The flat beige background is removed.

## Refinement package

Read both dnd-refinement instructions; the user's persistent direct-publication authorization supersedes their default staging instruction. Adopt two composite illustrations only: upper-right travel and lower-left writing. Keep the upper-left singles, and keep all original singles as the mobile alternatives. Never show a composite with its corresponding singles. No new decoration space is reserved; desk-clean.webp and the existing compact layout remain.

Refined WebP skins are self-contained SVG wrappers containing the supplied pixels. Header transparent margins are excluded with its SVG viewBox; mid-edge diamonds are replaced with neighboring straight edge pixels via clipped image reuse, then rendered as fixed 14px SVG overlays in CSS. Panel 9-slice source cuts are 150px; cropped header cuts are 72px vertically and 102px horizontally. All supplied originals are preserved. The texture centre still scales, and this is an app-specific skin rather than a general arbitrary-size frame library.

The reported large wooden rectangle was not reproducible at 1440px while scrolling the current application. DOM hit testing returned map geometry, and the only wooden rectangle was the intended toolbar. Map-stage stacking is isolated and the toolbar border/overflow explicitly bounded; coordinates and transformations are unchanged.

Verified 1440px, 1024px and 390px, scroll-to-map/end, 30 heroes/36 templates/44 participants with unique codes, popup fields and no horizontal dialog overflow, drawing, selection mode, figure movement, camera pan, zoom, undo and redo. Asset paths are relative to dist/assets and work under /DnD-Kampfhilfe/dist/. Remaining visual difference: the upper-left cluster intentionally keeps older separate art, the unused two corner composites are alternatives, and scarce edge space makes the lower writing illustration smaller than the full concept sheet.

Cozy table adjustment: larger decorative props intentionally extend beyond the outer desk edges, clipped only by the existing noninteractive decorative layer. Lower-left writing illustration grows from 180px to 320–390px; the upper-right grows to 340–420px. The retained upper-left arrangement scales by 1.12 toward the outer edge. No extra layout space is reserved. A warm body pseudo-element darkens wood and decorations toward the outside; app-shell remains above it, so text, fields, map and dialogs retain contrast. The vignette is weaker on small screens and never receives pointer input.

Corner and frame corrections: the lower writing group is anchored at the physical desk bottom, with transparent source padding compensated. The upper-left composite replaces the singles on desktop because the old candle source is already cut off internally; its complete candles now remain intact. Mobile keeps the original orb-only alternative. Paper edge strips use round repetition in both directions, retaining border-scale grain instead of stretching it along tall panels. Corner slices and separate fixed ornaments remain unchanged.

Lower-left writing group enlarged to 450–560px source width with a -120px outer offset, extending farther upward and inward from the physical bottom corner. Desktop footer text moves inward to avoid the larger compass. Narrow-screen hiding is unchanged.

Composite decorations combine a tight contact shadow with two diffuse offset cast shadows and a soft elliptical table shadow below each cluster. Shadows share the clipped inert decoration layer and are disabled with their desktop clusters on narrow screens.

Shadow correction: remove the elliptical cluster shadows and large cast offsets that made props appear suspended. Three silhouette-following layers now use 0–4px offsets: tight contact, soft near-contact, and a centred 13px ambient shadow. Decoration sizes and positions stay unchanged.

Scrollbars: four supplied WebPs skin native scrollbars only in combatant, character, enemy-template and history lists. Bronze/dark CSS fallback, forced-colors reset, no custom scrolling handlers. Combatant grid now has a zero-minimum track; HP label wraps onto its own row and HP controls fit instead of forcing horizontal overflow. Thumb end caps use border-image; track grain repeats. Persistent publication authorization applies.

Registered group shadows (local only): read dnd-group-shadows instructions and registration.json. Replace the three currently displayed composite sources with their matching object/shadow SVG pairs; the unused bottom-right group is not added. Original anchor positions, width clamps and transforms stay intact. Shared inner canvas is widened by (original width + 96) / original width and shifted by -48 / original width times the displayed width in both axes. Both layers use that same canvas and no extra CSS shadow filter; shadow opacity .9. Original image height rounding differences are below a pixel. Mobile singles stay unchanged. Nothing is published for this change.

Map dock: combat order and battlefield share one parchment workspace. Desktop order rail is 230px instead of 310px, with a subtle divider, compact spacing and 40px medals on 44px buttons. All HP, sorting and turn controls remain. Below 900px the same components stack inside the shared surface. Cards wrap, preserve 44px action targets and native scrolling. No coordinate or storage logic changes. User has reauthorized publication of all current changes, including registered SVG shadow pairs.
