# Changelog

## 2026-08-26

### Additions and New Features

- Renamed the game and npm package to **Cancer Clicker** / `cancer-clicker`.
- Added the confirmed live GitHub Pages game link to the README landing page.
- Refreshed the README newcomer journey with a live demo, a managed gameplay screenshot, a
  verified quick start, and routes into the maintainer documentation.
- Added architecture, file-structure, installation, usage, related-projects, roadmap,
  troubleshooting, cookbook, development, and FAQ guides grounded in the current game.
- Added a compact `AGENTS.md` pointer file for repository rules and the required test command.
- Added the reproducible Playwright capture harness and a 1280x800 Cancer Clicker colony
  screenshot for the README.
- Added an endless visual clicker loop: click the founding cell for nutrients, energy, and about one
  biomass, then spend resources to make later clicks accumulate faster.
- Added an always-open Mutation Shop with uncapped, escalating mutations: Transporter swarm,
  Glycolysis burst, Angiogenesis signal, and Immune cloak.
- Assigned distinct mutation currencies: Transporter swarm spends biomass, Glycolysis burst spends
  nutrients, Angiogenesis signal spends energy, and Immune cloak spends energy plus biomass.
- Added mutation signature SVG layers so every purchased mutation visibly equips or intensifies a
  matching antigen/surface treatment on the founding cell.
- Added daughter-cell colony artwork and a post-takeover lineage phase. At 100% host control, the
  game continues indefinitely as a growing, messy tumor rather than ending.
- Added a respectful HeLa-inspired lineage note that credits Henrietta Lacks without presenting her
  story as a gameplay reward.
- Added a responsive 16:10 clicker interface with an organic, inside-the-body visual treatment.
- Added editable SVG source art for the tissue, founding cell, daughter colony, immune patrol, and
  mutation signatures.
- Added runtime controls for awakening, restarting, clicking the cell, and purchasing mutations.
- Added GitHub Pages asset copying so the built `dist/` includes the authored SVG art.
- Added deterministic Node simulation tests and production-built Playwright browser smoke tests.

### Behavior or Interface Changes

- Host control is a phase transition, not a win condition: at 100% the colony begins endless
  HeLa-inspired lineage expansion.
- Immune pressure slows accumulation but no longer causes a terminal loss state.
- The founding cell stays fixed while colony layers form a messy tumor; it does not simply scale up.
- The game frame and tissue play area use a visible 16:10 aspect ratio, including a phone-viewport
  smoke check.
- Resource cards now publish their live nutrient, energy, and biomass stock rates in `/s`; lineage
  expansion publishes its own rate after host takeover.
- Passive resource rates and visible stocks are clamped non-negative. Mutation purchases are the
  only way the player spends an affordable resource.
- Passive resource and lineage accumulation continues while the page is open; the simplified
  clicker has no pause control or frozen simulation state.
- Enlarged telemetry, controls, progress labels, and mutation-card text make the always-open shop
  and compact colony HUD readable relative to the tissue field.
- On narrow portrait screens, the exact 16:10 tissue chamber stays intact and the permanent shop
  stacks below it. The lineage HUD remains hidden until the lineage phase begins.
- Removed the unused metabolic-allocation controls and event-log pipeline so the visible clicker
  loop is the simulation's only player-facing economy model.

### Decisions and Failures

- Initial Playwright work exposed that CSS overrode the start overlay's `hidden` attribute; an
  explicit `#start-overlay[hidden]` selector now hides it correctly.
- Playwright exposed a mobile click interception where a scene element covered a shop purchase
  target; the responsive stacking and interaction layers were corrected so the permanent shop is
  reachable by real clicks.
- Playwright also exposed a CSS `hidden` override that could reveal the pre-takeover lineage HUD;
  the HUD now remains hidden until the lineage phase starts.
- Audit cleanup replaced brittle font-size, pixel-alignment, and redundant CSS assertions with
  behavioral browser checks while retaining the real interaction and aspect-ratio coverage.
- The first `npm install` failed because the shared `~/.npm` cache was root-owned. Installation
  succeeded with the writable `/Users/vosslab/.cache/npm` cache; no `sudo` workaround is needed.
- `news-release-docs` could not generate `docs/NEWS.md` or `docs/RELEASE_HISTORY.md` because
  root `VERSION` is `26.08` while `package.json` is `2026.08.0`. Release documentation waits for
  version metadata to agree.
- `docs/TODO.md` and file-format documentation were intentionally not created because the current
  static game exposes no supported backlog or file-format interface.
- The first complete code gate found unformatted screenshot-capture JavaScript; Prettier corrected
  the harness before the final verification run.
- The first final Playwright launch was blocked by macOS sandbox Mach-port permissions; the same
  production-built suite passed when Chromium was allowed to launch with browser permission.

### Developer Tests and Notes

- `./check_codebase.sh` passed 5 checks, including 11 Node tests.
- `./build_github_pages.sh` completed successfully, including copying the authored SVG assets into
  the Pages-ready `dist/` folder; authored SVG files also passed XML validation.
- `./run_playwright_tests.sh --build` passed 2 production-built browser tests.
- Playwright uses visible clicks to buy all four mutations and verifies each matching antigen SVG
  layer activates; Node verifies exact published-rate-to-delta equality and strictly distinct
  mutation recipe ingredients.
- README now links directly to the Pages workflow, editable SVG source, and deterministic economy
  test source for faster maintenance navigation.
- `source source_me.sh && pytest tests` passed 661 tests.
- These checks establish a Pages-ready build; the live GitHub Pages deployment is confirmed at the
  README link.
