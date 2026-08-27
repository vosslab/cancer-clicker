# Changelog

## 2026-08-26

### Additions and New Features

- Renamed the game and npm package to **Cancer Clicker** / `cancer-clicker`.
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
- Added runtime controls for awakening, pausing or resuming, restarting, clicking the cell, and
  purchasing mutations.
- Added GitHub Pages asset copying so the built `dist/` includes the authored SVG art.
- Added deterministic Node simulation tests and production-built Playwright browser smoke tests.

### Behavior or Interface Changes

- Host control is a phase transition, not a win condition: at 100% the colony begins endless
  HeLa-inspired lineage expansion.
- Immune pressure slows accumulation but no longer causes a terminal loss state.
- The founding cell stays fixed while colony layers form a messy tumor; it does not simply scale up.
- The game frame and tissue play area use a visible 16:10 aspect ratio, including a phone-viewport
  smoke check.

### Decisions and Failures

- Initial Playwright work exposed that CSS overrode the start overlay's `hidden` attribute; an
  explicit `#start-overlay[hidden]` selector now hides it correctly.
- The first `npm install` failed because the shared `~/.npm` cache was root-owned. Installation
  succeeded with the writable `/Users/vosslab/.cache/npm` cache; no `sudo` workaround is needed.

### Developer Tests and Notes

- Earlier baseline validation: `./check_codebase.sh` passed 5 checks, including 6 Node tests;
  `./build_github_pages.sh` completed successfully; and `./run_playwright_tests.sh --build` passed
  2 browser tests. Re-run those commands after the final clicker-interface integration.
