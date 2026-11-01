# WooBi — Colour Coordination Assistant

A self-contained WooBi storefront built around an interactive **Colour Coordination Assistant**. Users can choose from 16 curated shades or mix their own, see a coordinated palette update instantly, and explore three outfit formulas styled in the selected colours.

**Live demo:** https://adityajai9330.github.io/woobi/

No build step, backend, database, external API, font CDN, or package dependency is involved. Open `index.html` directly or serve the folder with any static file server.

## Run

```powershell
# Option 1 — open directly
start index.html

# Option 2 — local server
python -m http.server 8765
# then visit http://127.0.0.1:8765
```

## What's included

- **16 curated colours**, each selectable from the studio swatch grid or the interactive hero colour wheel.
- **Custom colour picker** for any shade in the spectrum.
- **Coordinating palette** generated from the selected shade: complementary, analogous, tonal, and neutral tones.
- **Live outfit gallery** — three named looks recolour instantly with the palette. Every piece is an inline SVG garment illustration, so there are no image dependencies.
- **Copy palette** and **copy hex** actions with a clipboard fallback.
- **Save this look** moodboard toggles.
- Supporting WooBi storefront: search overlay, wishlist, bag drawer with quantity controls and free-shipping progress, newsletter validation, mobile menu, and responsive navigation.
- Keyboard-accessible controls, visible focus states, `aria-pressed` states, live regions, focus trapping in overlays, and reduced-motion support.

## Acceptance criteria

- [x] Users can select different colours — 16 swatches, wheel dots, palette chips, and a custom picker.
- [x] Matching and complementary colours are displayed — a five-tone coordinated palette with roles.
- [x] Relevant sample outfit combinations are shown — three outfit formulas update in real time.
- [x] Users can change their selected colour — every selection method updates the palette and outfits.
- [x] The interface works on desktop and mobile — verified from 320 px to 1440 px with no horizontal overflow.
- [x] Existing functionality remains unaffected — search, wishlist, bag, newsletter, navigation, and mobile menu all remain functional.
- [x] No backend, database, external API, or new dependency — static HTML, CSS, and vanilla JavaScript only.

## Structure

```
woobi/
├── index.html   — page structure, inline SVG icon/garment library
├── styles.css   — design system, responsive layouts, overlays
├── app.js       — colour maths, palette/outfit rendering, shop interactions
├── preview/     — desktop and mobile screenshots of the finished build
└── README.md
```

Open `preview/desktop-full.png` for a full-page desktop overview, or `preview/mobile-hero.png` and `preview/mobile-studio.png` for the mobile layout.

## Colour logic

The palette is generated in HSL from the selected hue:

- **Complementary** — opposite hue for contrast.
- **Analogous** — neighbouring hue for easy harmony.
- **Tonal** — the same hue at a different depth.
- **Neutral** — a low-saturation grounding tone.

Outfit colours are pulled directly from that palette, so every look stays coordinated as the user explores.
