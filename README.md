# Pocket Wild

A tiny living meadow, a pond, and several unreasonable frogs. A first playable **0.1.1** browser ecosystem sandbox, not a scientific ecology model.

**Play:** https://jinx.xanderxx.xyz/pocket-wild/

**Project hub:** https://jinx.xanderxx.xyz/ · [Original GitHub Pages address](https://jinxonpurpose-labs.github.io/pocket-wild/)

## Make a little mess

- Paint meadow, flowers, reeds and water. Drag on desktop or tap/drag on a touch screen.
- Add bugs (eat flowers), snails (graze grass/reeds) and frogs (eat bugs and need water). Inspect a creature or patch to see its condition.
- Pause to build without advancing time. Choose 1×, 2× or 4× speed and automatic, clear, cloudy or rainy weather.
- A game day takes three minutes at 1×. Plants grow/spread, creatures feed, reproduce and die. Caps: 60 bugs, 18 snails, 12 frogs. There is no win condition or guaranteed ecological balance.
- **Keyboard:** Tab to controls/canvas. Keys 1–9 select the listed tools; I selects Inspect; P pauses/resumes. With canvas focused, arrow keys move a tile cursor; Space/Enter applies the tool. Buttons also work with normal keyboard activation.
- New pond starts over with neighbours; Start empty clears the world. Both ask first.

## Saves and privacy

Worlds autosave roughly every ten seconds, on hiding/leaving the page, or with **Save world**. Saves stay in this browser's localStorage (`pocket-wild:world:v1`). There is no offline catch-up. Hidden tabs stop simulation and discard pending elapsed time when returning; a stalled visible frame contributes at most 0.25 seconds before speed scaling.

Malformed/oversized saves open a starter meadow **without overwriting the old save automatically**. Explicit Save asks to replace it. Blocked/full storage gives a warning and allows unsaved play. New-world actions replace the existing save after confirmation. Browser cleanup, private browsing, a different device/origin or storage eviction can lose a world. There is no export/import or cloud backup in v0.1.

No accounts, cookies set by the game, analytics, dependencies, external fonts, paid APIs or gameplay network requests. Initial HTML/CSS/JS/icon downloads still require the static host. Cloudflare serves the primary site; GitHub Pages remains an alternate address. Both providers have their own hosting policies. Canvas art is original procedural pixel art, drawn in `src/render.js`; all game logic runs locally. The external source link opens GitHub only when followed.

## Run and test

Node.js 22 or later, no package installation needed:

```sh
npm start # http://127.0.0.1:4177, loopback-only development server
npm test
npm audit --audit-level=high
```

There is no build step. Serve the repository root as a static site; relative asset paths support a GitHub Pages project subdirectory. `scripts/serve.js` is a development server, not a production service. Meadow checks CI runs dependency-free model tests and npm audit. The lockfile has no dependencies.

Optional real Chromium UI checks use an **already-installed external Playwright package**, not a game dependency:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROMIUM_PATH=/absolute/path/to/chrome \
EVIDENCE_DIR=/tmp/pocket-wild-check \
node scripts/browser-check.mjs
# DEMO_URL=https://jinxonpurpose-labs.github.io/pocket-wild/ to check public hosting
```

The browser checker launches isolated synthetic worlds, changes their local storage, and writes desktop/mobile screenshots plus results. It checks pointer/touch, keyboard, pause/speed/weather, save reload, corrupt/blocked storage, reset, layout, console errors and network requests. Its background regression drives the actual visibility handler with controlled `document.hidden` and a virtual clock; it is not a physical OS/device suspension test. Mobile checks are Chromium touch/viewport emulation, not physical-device testing. Canvas has keyboard controls and textual inspection/census, but is not a complete screen-reader rendering of the world.

## Primary hosting and dark theme

The interface is dark by default, including native form controls, keyboard focus, tools and inspection panels. The living meadow keeps its natural colours and day/night cycle; the simulation and save format are unchanged.

The separate [jinx-hub](https://github.com/JinxOnPurpose-Labs/jinx-hub) project pins a tested game commit and copies only its public HTML/CSS/JS/icon into `/pocket-wild/`. It does not serve this repository wholesale. Re-pinning that commit and verifying the public deployment are explicit release steps, not an automatic deploy on every game push.

**Saves do not move between web addresses.** An existing GitHub Pages world stays at that address, on that browser/device. The new hostname starts its own save. Neither host uploads or transfers worlds. Keep the original address bookmarked to return to an old world.

## Alternate GitHub Pages deployment/runbook

GitHub Pages is free static hosting for this public repository. Pages source is `gh-pages` at `/`; `.nojekyll` keeps the source modules intact. Publish only the tested feature commit, with a create/fast-forward of `gh-pages`, never force-push. Inspect existing Pages settings first. Wait for the Pages build, verify served HTML/assets match the exact commit and run the UI checker against the real URL before calling a revision live. Keep branches, issues and original test evidence. Reverting deployment requires a new forward commit restoring the intended files, not rewriting branch history.

Model tests cover deterministic simulation, feeding, reproduction/caps, starvation, painting, weather, validation and save round trips. This is an experimental toy with deliberately simple resource rules. No audio, monetization, offline progression, multiplayer or extra biomes.
