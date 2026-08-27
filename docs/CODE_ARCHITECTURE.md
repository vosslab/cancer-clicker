# Code architecture

## Overview

Cancer Clicker is a static TypeScript browser game. The browser loads an HTML scene, the
TypeScript controller updates an immutable simulation state every quarter second, and the renderer
maps that state to the resource HUD, Mutation Shop, and SVG-backed tissue scene. The production
build emits a self-contained `dist/` directory for GitHub Pages.

## Major components

- [src/index.html](/src/index.html) defines the accessible application structure, named controls,
  telemetry outputs, Mutation Shop recipes, and SVG image layers.
- [src/main.ts](/src/main.ts) is the browser entry point. It installs click handlers, advances the
  running simulation on a 250 ms interval, and coordinates simulation calculations with rendering.
- [src/game_state.ts](/src/game_state.ts) creates the ready-state colony with its starting stocks,
  cell health, host-control phase, and mutation levels.
- [src/simulation.ts](/src/simulation.ts) owns deterministic economy rules: harvesting, passive
  accumulation, mutation purchases, host takeover, lineage expansion, health, and safe arithmetic.
- [src/constants.ts](/src/constants.ts) holds the fixed economy balance, metabolic profile, initial
  mutation levels, and distinct-resource upgrade recipes.
- [src/types/simulation.ts](/src/types/simulation.ts) defines immutable state and economy contracts;
  [src/brands.ts](/src/brands.ts) validates the branded non-negative tick value.
- [src/ui_rendering.ts](/src/ui_rendering.ts) converts state and calculated rates into text,
  progress bars, enabled purchases, lineage visibility, mutation intensity, and nutrient particles.
- [src/style.css](/src/style.css) provides the responsive 16:10 game-frame layout and organic visual
  treatment. `src/effects.css` owns purchase feedback, equipped-card states, and reduced-motion
  behavior.
- [src/art/](/src/art/) contains editable SVG scene art, cell art, daughter colonies, immune patrols,
  mutation signatures, and the mutation-milestone signal burst.

## Data flow

1. The page loads [src/index.html](/src/index.html), then its module entry [src/main.ts](/src/main.ts).
2. [src/game_state.ts](/src/game_state.ts) supplies the initial immutable `SimulationState`.
3. The Awaken button changes the status to `running`. Clicking the cell calls the harvest rule;
   clicking a Mutation Shop button requests an affordable upgrade purchase.
4. Each 250 ms clock event calls `advanceSimulation()` with the fixed step from
   [src/constants.ts](/src/constants.ts). The function calculates passive stock deltas, adds growth
   investment, updates immune response and host control, and continues with lineage expansion after
   takeover.
5. [src/main.ts](/src/main.ts) calculates an `EconomySnapshot` and upgrade costs for the new state.
6. [src/ui_rendering.ts](/src/ui_rendering.ts) writes the current stocks and actual `/s` rates to the
   DOM, then sets visual state for the tumor mass, mutation art, and permanently equipped cards.
7. A successful purchase triggers the named milestone overlay in [src/main.ts](/src/main.ts); its
   editable burst artwork and motion live in `src/art/mutation_burst.svg` and `src/effects.css`.

The simulation has no save service, server API, offline-progress calculation, failure state, or
pause state. Accumulation continues while the page remains open after awakening.

## Build and deployment

[build_github_pages.sh](/build_github_pages.sh) type-checks the browser source, bundles
[src/main.ts](/src/main.ts) with esbuild, copies the HTML, CSS, and SVG assets, and writes the
GitHub Pages-ready `dist/` artifact. [run_web_server.sh](/run_web_server.sh) builds that artifact
and serves it locally. [deploy-pages.yml](/deploy-pages.yml) runs the same build in GitHub Actions
and uploads `dist/` to GitHub Pages.

## Testing and verification

- [tests/test_simulation.mjs](/tests/test_simulation.mjs) imports the TypeScript simulation through
  `tsx` and checks deterministic economy behavior, non-negative rates, endless lineage, mutation
  effects, prices, and invalid input rejection.
- [tests/playwright/smoke.spec.ts](/tests/playwright/smoke.spec.ts) runs the production-built game
  in Chromium and checks visible harvesting, mutation artwork, responsive shop access, 16:10
  geometry, and browser errors.
- [check_codebase.sh](/check_codebase.sh) runs TypeScript checks, ESLint, Prettier, and Node tests.
- [run_playwright_tests.sh](/run_playwright_tests.sh) builds when needed and runs the Playwright
  suite against `dist/`.
- The repository Python quality tests enforce documentation links, ASCII, source-size, and general
  repository hygiene. Run `source source_me.sh && pytest tests` from the repository root.

## Extension points

- Add a new mutation by extending `UpgradeId`, `INITIAL_UPGRADE_LEVELS`, and `UPGRADE_CONFIG`, then
  provide its simulation effect, shop markup, rendering mapping, SVG art, and economy/browser tests.
- Adjust pacing through the named values in [src/constants.ts](/src/constants.ts), including the
  compounding mutation cost and bounded nutrient, upkeep, growth, and health allocations. Keep the
  published stock-rate contract in [src/types/simulation.ts](/src/types/simulation.ts) accurate.
- Add visual layers in [src/art/](/src/art/) and reference them from [src/index.html](/src/index.html)
  and [src/ui_rendering.ts](/src/ui_rendering.ts) so purchases have a visible result.
- Add durable interaction coverage in [tests/playwright/](/tests/playwright/) and deterministic
  economy cases in [tests/test_simulation.mjs](/tests/test_simulation.mjs).

## Known gaps

- Verify a future persistence or offline-earnings design before adding browser storage; no such
  contract exists in the current source.
- Verify an explicit prestige-loop design before introducing reset currencies or permanent bonuses.
