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

Visible shadow refinement: the supplied source filter was too fine after scaling to about 26% (contact blur under 1 display pixel). Shadow-only SVG variants now spread contact alpha by 7 source pixels, blur 4, opacity .9; cast spreads 4, blur 11, offset 8/10, opacity .65. CSS shadow-layer opacity is 1. Object pixels, paired canvases, registration, dimensions and positions remain unchanged. Source package is untouched. New image query version prevents old cached shadows.

Stable tool switching: reproduced a 16.5px canvas/toolbar vertical jump when the description changed from two lines to one. Header and footer help now reserve the longest text with an aria-hidden sizing span sharing a grid cell; readable text stays adaptive and unclipped. Pointer pans and token moves require 5 screen pixels before applying motion/snap, preventing minor click wobble from moving an off-grid figure or camera. Coordinates, tool semantics and persistence remain unchanged.

Clean combat cards: remove the large up/down reorder row and redundant ellipsis edit button. A 44px focusable drag grip occupies the top-right position; portrait still opens editing. Pointer/touch grip reordering remains, Alt+Arrow works on grip or card. HP controls stay visible. Names are 18px bold, type 12px, HP 13px and action label 11px semibold. Prevent native card drag from starting on HP/edit controls. No saved data schema changes.

Live order preview: grip drag creates an inert visual clone and an insertion slot. Other cards move into their preview positions with brief animations; layout offsets, not animated bounds, decide insertion. Native whole-card dragging also previews. Pointer dragging scrolls the list near its edges. Only drop commits one undoable change; Escape, blur, pointer cancellation or drop outside restore the prior order. Reduced-motion disables the animations.

Enemy names now show stable encounter-local enemyNumber metadata in both list and map, seeded from explicit name suffixes or existing token codes (e.g. K6 -> Kultist 6). Raw names, IDs, coordinates, HP and existing token codes remain unchanged. Numbers survive sorting/removal/reload and are distinct within each name group. Compact medals use 13px symbols above 11px codes, shrinking long codes as needed, so icon and label no longer overlap.

Gold selection: the last pointer-interacted or keyboard-focused combat card receives a warm gold surface, inset outline and small name diamond, plus accessible description. This transient UI choice survives render/reorder/undo and is cleared if that participant is removed. Turn state and its red active banner remain independent. No campaign data is changed just by selecting, and choosing a card does not rebuild its input fields.

Top-left grounded artwork v2: there was no prior grounded WebP in the running project, so replace the upper-left registered SVG object/shadow pair with the supplied single WebP. Preserve the same responsive width clamp, top/left position, and outer decor layer; use the new 1000/821 aspect ratio, opacity 1 and no filter. Other groups and stored data are unchanged. The existing table vignette remains. Source package is preserved; user’s continuing direct-publication authorization applies.

Large corner arrangement: desktop upper-left grows to 540–660px with left/top -180/-100; upper-right grows to 560–700px with more exterior cropping; writing grows to 700–880px at -260/-58. Original aspect ratios, registered paired layers, integrated grounded-art shadows, app layout and table clipping remain. Mobile alternatives are unchanged. No extra decoration area is reserved.

Corner balance adjustment: reduce all three desktop groups by 15% and proportionally reduce exterior offsets. Edge cropping, aspect ratios, shadow registration, mobile alternatives and UI layout remain unchanged.

Header spacing: desktop main top padding reduced from 72px to 8px, removing 64px of unused separation below the title plaque. Existing header margin, mobile spacing, decoration and controls are preserved.

Small-screen/trackpad view: unified turn summary with an optional order-panel toggle and next-turn control when hidden; views at or below 900px start collapsed. Short laptop views or widths at or below 1440px use a 200px rail, viewport-relative 280–440px canvas and 34px tools for fine pointers; coarse-pointer tool targets remain 44px. Native two-finger wheel deltas pan the camera, pinch/ctrl-wheel zoom around the pointer, Option-wheel leaves page scrolling available. Wheel rendering is batched per animation frame; Safari gesture events have a separate cumulative-scale path. Walls, rectangles and ellipses accept two clicks with a live preview, while drag drawing remains supported; Escape cancels the pending start. Data/coordinates/history are unchanged.

Compact-camera verification: marker minimum size now uses the SVG screen transform scale rather than width/viewWidth, so the existing 28px minimum also holds in wide, short viewports and after hiding the order rail.


## Compact map correction — 2026-10-14

The map title now shares the combat-order toggle row. Zoom, multiselect, selection deletion, grid snapping and optional help use a single 34px controls row on desktop. Tool-specific instructions and trackpad guidance remain in a closed-by-default help popover; neither tool changes nor opening help alters canvas position. Drawing mode, automatic connection and clear remain in the short footer. No encounter or character schema changed.

At 1280×720, the area above the frame decreased from 261px to 125px and canvas height increased from 374px to 550px. The frame now uses viewport height instead of the former 52vh cap. At 1366×768 it is 598px tall. At 390×844 the order rail starts collapsed, controls wrap without horizontal overflow and all eight drawing tools stay in one row. Browser checks covered help layout stability, tool changes, two-click room placement and undo, multiselect, zoom/reset and order collapse. Existing 65 tests pass.

## Houses and contextual annexes — 2026-10-17

A compact “Haus ＋” control starts a footprint drawn by drag or two clicks. The modal previews 1–12 connected rooms, permits alternate partitions and an entrance on any of four sides, then commits ordinary editable shapes in one history step. Grid partitions have minimum 2×2-field rooms; connecting doors are chosen after all partitions to avoid T junctions. Invalid sizes, occupied footprints and shape limits fail without changing saved data. Preview uses its own door mask.

Selecting one straight-sided exterior footprint shows screen-sized plus grips. Click adds a 4×4-field annex (narrow walls reduce its width); drag varies depth and width with live preview. Shift-click starts the two-click trackpad alternative. Existing boundary becomes an interior wall with a connecting door; an existing door is reused. Exterior footprint keeps its ID; other walls and doors are retained. Collisions and world overflow are rejected. No new stored shape types or campaign schema are introduced. Curved/short edges have no annex grip.

Browser QA: house creation by drag and two clicks, changed room count and entrance, invalid room count, confirmation, group selection, one-step undo/redo, click/drag/two-click annexes, removal of previews, and restoration of the original local test campaign. At 1280×720 the desktop controls remain one 34px row. At 390×844 the dialog stays inside the viewport, controls take two rows, all eight drawing tools stay in one row, and map height remains 549px. 71 tests pass, including 480 generated-house connectivity/partition cases, four annex directions, collisions, repeated annexes, existing doors and campaign validation.


## Encounter-local enemy markers — 2026-10-17

Enemy token codes no longer reserve numbers across the whole campaign history. Hero identities still persist globally. Within each battle, explicit enemyNumber controls the token suffix; existing mismatches such as Knecht 1 / K9 are repaired to K1. Colliding initials extend the name prefix instead of increasing the displayed enemy number. IDs, HP, turn order, coordinates and history snapshots' combat data are unchanged. Regression tests cover previous-battle reservations, saved mismatches, local duplicate insertion, hero/name-prefix collisions and reload stability. 74 tests pass.

## Terrain generators — 2026-10-19

“Generator ＋” opens one six-choice dialog: existing house plus cave, ruins, forest/clearing, river/crossing and rock field. Each uses the same drag-or-two-click footprint, configurable preview, alternate variant and atomic placement/undo flow. No permanent toolbar row was added. Terrain footprints accept 6×6 through 40×40 fields; impossible counts, complexity or occupied packing return visible errors without writing data.

Caves use connected 25-unit cells, irregular chambers, configurable passage width and 1–3 explicit entrances. Boundary rings produce a separate smooth floor and editable wall paths. Ruins use house partitions with open breaks and small rubble marks. Forests keep an obstacle-free clearing and optional through path. Rivers run in either direction and offer a bridge, ford or no crossing. Rock fields scatter separate irregular rocks with an optional clear passage. All geometry is generated locally from bounded, injectable randomness.

New drawings use native SVG in the current palette, not raster map images. They retain the existing rect/ellipse/room/wall/path geometry and add allowlisted optional terrain styling metadata. Import/save validation checks metadata/type combinations. Move/scale/delete, per-shape selection, undo/redo and full campaign save continue to work. Terrain is isolated from building auto-union, wall closing and annex grips; only ruin/cave walls accept manually placed doors. Terrain does not automate movement rules or combat effects.

QA: 83 tests, including 225 multi-layout checks across all five types, cave reachability and entrances, exact forest/rock counts, clearing/passage clearance, river crossings, ruin breaks, campaign reload and editing. An additional 30 maximum-size cave generations remained valid. Browser checks placed all five kinds, exercised undo/redo and group movement, invalid input followed by house creation, and saved/reloaded a horizontal river with ford. Test objects were removed and the original seven-shape local scene restored. At 390×844 the selection dialog and cave preview fit, no horizontal overflow occurred, map height remained 549px and drawing tools stayed in one row. Desktop map controls remain one 34px row.

## Forest cleanup and full-board clearing — 2026-10-19

Forests now generate only editable trees. The clearing is irregular empty ground; an optional gently winding passage is reserved through tree placement. No colored ellipse or rectangular trail is generated. Saved legacy clearing/trail helper shapes are kept in data but excluded from map rendering, selection and empty-state decisions. Tree appearance and the existing house/cave algorithms at normal sizes are preserved.

Removed the shared 6×6–40×40-footprint gate. Raster-sized forests can be small, large or narrow anywhere inside the existing map world. Large caves adapt sampling resolution to keep computation bounded rather than rejecting sizes above 40 fields. Other terrain validates its actual geometry, and narrow rivers scale crossings to fit. Geometry/object limits still protect saved campaigns.

“Alles leeren” is a visible board action next to the generator. Its dialog defaults to clearing all shapes and taking figures off the board; an optional checkbox keeps figures visible. Participants, HP, order, round, character library and history remain intact. A typed optional mapHidden flag persists board visibility. “Figuren anzeigen” restores tokens independently. A clear operation is one undo step; Shift+Backspace while the map is focused opens the same dialog. Compact count badges prevent multi-selection from growing the desktop header.

QA: 89 tests, including empty-ground forest placement, small/large/narrow footprints, adaptive large caves, full/terrain-only board clears, undo/redo, visibility save validation and legacy helpers. Browser tests verified a 2×3-field forest, no helper overlays, complete clearing (zero shapes and tokens), restoring figures, undo to the original seven shapes/four tokens, terrain-only clear, Shift+Backspace, and cancellation. At 390×844 controls stay two rows and canvas 549px; the clear dialog fits without horizontal overflow. Desktop controls remain 34px with multiple shapes selected. Test data restored.

## Prepared places and battles — 2026-10-21

“Orte & Kämpfe” opens a searchable preparation library. Create a blank place/battle with selected heroes or capture the current scene, including map, doors, enemy copies, order and positions. Preparations can be reopened, duplicated and removed with undo. Editing uses the existing interactive map; a distinct banner offers return to the previous battle and start as a new battle. No extra map toolbar controls were added.

Preparations live in the optional campaign.preparations collection, separate from encounter history. The editing context survives reload and full JSON backups. Normal existing version-2 campaigns remain valid without migration. Scene copies receive new IDs; changing prepared HP does not sync to master heroes or the active battle. Token edits on prepared heroes explicitly edit the local snapshot, while the character library remains the master group. Starting preserves the template, creates a separate round-1 encounter, restores enemy HP and lets the GM select heroes and choose current master values (default) or prepared values. Notes are retained with the started encounter. All preparations are still local to the browser and included by “Sichern”.

QA: 96 tests pass, including old-campaign compatibility, independent map/HP copies, reusable starts, hero snapshots/current values and deleted characters, full save/reload validation, malformed imports, capacity atomicity and undo/redo of editing context. Browser checks captured the seven-shape/four-participant scene, changed prepared hero HP without affecting master HP or the old fight, reopened after reload, duplicated, started with current hero HP and full enemies, undid the start and deletion, and created a blank place with a reusable enemy and a newly drawn room. At 390×844 the library stays within the viewport without horizontal overflow. Test preparations were removed and the original local scene/HP restored.

## Remove participants directly from the lineup — 2026-10-21

Each lineup card now has a compact × beside its drag grip, with a named accessible button and mode-specific tooltip. It removes only the current encounter/preparation copy and its map token; character and enemy libraries, other encounters and map shapes stay intact. The existing remove actions in participant/character dialogs use the same helper. Removing the active person selects the next displayed participant (wrapping at the end) without advancing the round. Removing the final person leaves an empty valid encounter. Keyboard focus moves to the neighboring remove action or the add button. Undo/redo restores the participant, HP, map position and active turn together.

QA: 100 tests pass. New cases cover manual order versus array order, active/non-active/final removal, unchanged master characters/enemy templates/other battles, preparation isolation, save validation and undo/redo. Browser checks removed and restored both a hero and enemy, used Enter to remove the active hero, verified the next turn, unchanged round and saved libraries, and restored the original four-person scene. At desktop panel width 200px and viewport 390px the cards do not overflow.

## Local Strata map chat — 2026-10-24

Generator ＋ now offers “Kartenchat”, a general natural-language scene planner rather than a fixed scenario preset. Each model request automatically includes SCENE_SYSTEM_PROMPT: available semantic building blocks, normalized 1000×700 coordinates, relative scale/accessibility rules, strict JSON output and complete-scene revision instructions. Free descriptions and follow-up changes use the same prompt. The local-model client discovers the loaded model through /v1/models and sends ordinary /v1/chat/completions requests with no tools, reasoning disabled and JSON response format. Connection settings are editable and only the local base URL/model ID are remembered; the optional API key stays in the current form/session. No requests happen merely from loading the page.

Strata was verified at the user's provided loopback endpoint. Browser requests go directly to that API; no additional service or dependencies were introduced. Only localhost/127.0.0.1/::1 addresses are accepted, redirects and credentials are disabled, response size/time are bounded, and cancellation aborts the fetch. Model text is never evaluated as code. JSON is allowlisted and converted locally into ordinary editable map shapes. The compiler supports water, sand, paths, piers, mountains, trees, rocks, walls, rooms and doors plus existing house/cave/ruins/forest/river/rock generators. Internal generator layouts scale into the model's chosen footprints instead of inheriting manual footprint size gates.

The chat shows a native SVG preview, then applies one atomic undoable change into the captured visible camera area. Existing shapes, participants, HP, order and rounds are preserved. A follow-up can replace only the previous AI scene; unrelated drawings remain. Stale previews cannot apply after map changes. If a placed AI scene is manually modified or the encounter changes, the next chat begins fresh rather than silently regenerating those edits. The conversational context is in-session; applied map shapes use existing persistent saves/preparations/backups.

QA: 109 tests pass. Added tests cover every semantic type, geometry scaling/editing/save validation, deterministic revisions, compact generator footprints, malformed/oversized or code-like model output, duplicate ids, atomic application/replacement/undo, loopback-only networking, redirects, model discovery, HTTP errors, automatic prompt/context and cancellation. Actual Qwen3.8-Flash-Next Q2_0 produced a chapel/woodland/courtyard/pond/access-path scene with 41 editable elements. A follow-up enlarged only the pond; DOM comparison confirmed all other preview geometry unchanged. Applying added 41 shapes to the existing seven; replacing retained 48 total. Two undo steps restored the original geometry, HP and round. At 390×844 the dialog fits without horizontal overflow; the desktop map toolbar remains one 34px row.

## Resilient scene responses and public documentation — 2026-10-24

Reproduced the reported water-accessible cave entrance prompt against the local Qwen API. The response contained three distinct rocks all using id `rock`; geometry was valid. The model-response boundary now assigns deterministic unique ids to repeated, absent or malformed identifiers, reserving later valid ids so unaffected objects retain their identities. Strict validateScene still rejects duplicate ids in internal plans and retains all type/geometry/complexity checks.

Requests validate compilation before returning a scene. Invalid JSON, unsupported types, invalid geometry and truncated plans trigger at most one correction request with the exact validation error and the original context. Network/auth errors are not retried as scene errors. Aborting during correction prevents another inference. The UI reports the correction in progress. Actual browser generation with the reported prompt produced an eleven-element preview; existing map data was not changed.

113 tests pass, including the real duplicate-rock response fixture, reserved-id collisions, preservation of repeated geometry, bounded contextual repair and cancellation between attempts. README now describes the current app, manual turn ordering, preparations, local model setup, assets, data storage and development. CHANGELOG records this fix and a retrospective of prior functionality. Future releases must update the changelog and relevant README sections.

## Outline-first map chat — 2026-10-24

The chat now plans sparse overhead sketches with explicit open contours, traversable gaps, relative scale and focus-area framing. The prompt uses a compact set of sketch primitives rather than encouraging illustrated terrain or procedural chamber systems for a single entrance. New `line` and `stairs` semantic objects compile to existing editable path shapes. Stairs generate 2–8 parallel tread lines across the stated travel direction. Existing semantic types remain accepted for compatibility.

Compiled AI shapes carry an optional validated boolean `sketch` flag. Terrain rendering uses one unfilled contour per shape with no highlights, texture, lobes or decorative marks; water alone gets a translucent blue fill. Plain AI rooms also suppress their floor fill. Cave floors, ruin floors and decorative rubble are omitted from newly compiled scenes. Existing saved shapes and manual generators without the flag keep their original rendering. Shape geometry, doors, editing, backups and preparations remain native. Placement now uniformly scales and centers the scene in the captured viewport instead of stretching its proportions.

116 tests pass, including all semantic types, open contour preservation, staircase direction/spacing, aspect-ratio fitting, saved sketch metadata validation, retained manual terrain styling and water-only fills. Actual Qwen generation of the user's cave-entrance prompt produced an eight-element sketch with side contours, broad tread lines and water at the approach. Applying added eight shapes to the original seven; one undo restored identical original geometry and participant/HP text. Proof: outputs/design-review/map-chat-outline.png.

## Free geometry and tolerant scene import — 2026-10-24

Removed the redundant model rectangle/contour constraint at the response boundary. Point-defined water/terrain derives its bounds from its actual points, with repeated consecutive points cleaned and object-form coordinates accepted. If the whole scene extends beyond the nominal 1000×700 reference, all geometry is transformed together with uniform scale and translation, preserving connections and relative distances instead of clipping individual shapes. Internal geometry validation remains strict after normalization.

The model can now compose arbitrary subjects with free closed polygons, closed lines, ellipses and rectangles, alongside existing open lines and tools. Unknown subject names with valid point geometry become free contours rather than requiring another terrain preset. New primitives compile into existing native editable paths/rectangles/ellipses; no script or model-generated markup is executed. Complexity allowances increased to 200 semantic objects, 256 points per contour and the existing 1000 native-shape storage limit; the response budget is 8192 tokens. The prompt encourages creative layouts while retaining the requested sparse overhead outline style. Finite values, response size and valid native shapes are still checked.

119 tests pass, including missing/mismatched terrain rectangles, proportional fitting outside the reference frame, connected endpoints, invented subjects, 90-point contours and 80-element plans. Actual Qwen browser generation of a broken ring temple on three irregular islands produced a twelve-element editable preview without browser errors. Proof: outputs/design-review/map-chat-free-drawing.png. Existing map data was not changed during this preview check.

## Independent map library — 2026-10-25

A separate “Spielfelder” library beside the existing preparation and backup controls saves named drawing-only snapshots. Records contain id, title, shapes, timestamps and optional camera view; no people, HP, round or active participant. Loading clones only shapes into the current encounter/preparation, generates fresh shape ids, restores the saved camera and leaves the title, combatants, their positions/visibility, HP, round and ordering intact. Drawings remain independent of the stored snapshot; an explicit update action replaces the template. Rename, duplicate, remove and search are included. Existing campaign undo/redo covers loading and library mutations.

Optional campaign.maps is validated on full import, included in existing JSON export/local persistence and absent from old backups without requiring migration. Native shape and camera validation runs before writes, so malformed operations fail atomically. The library is limited to 200 named fields, matching preparation capacity. The paused spatial-generator experiment was saved under outputs/paused-spatial-plan-1; it is not part of this release.

124 tests pass. New cases cover geometry-only capture, deep-copy independence, camera/door/terrain preservation, unchanged current combat and master characters, explicit updates, duplication/renaming/removal, undo/redo, legacy backups and malformed imports. Browser QA saved a seven-shape field and an empty field, loaded the saved geometry while all four participants/HP/title remained unchanged, undid/redid the load (0→7 shapes), reloaded persisted fields, and exercised duplication, renaming, removal and search. At 390×844 the dialog stays within the viewport without horizontal overflow. Proof: outputs/design-review/map-library.png.
