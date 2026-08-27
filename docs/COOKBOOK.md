# Cookbook

These maintenance scenarios build on the player workflow in [USAGE.md](USAGE.md). They keep
Cancer Clicker's economy, visible mutation language, and automated proof aligned while the game
grows.

## Tune a mutation

Use this workflow when an existing mutation needs a different price or a stronger effect.

1. Update the named mutation's `baseCost` in [src/constants.ts](../src/constants.ts). Costs scale
   from that value without a level cap.
2. Update its demonstrated effect in [src/simulation.ts](../src/simulation.ts). Keep the effect
   consistent with the mutation's stated role: capture, harvest conversion, blood supply, or
   immune resilience.
3. Keep the player-facing recipe and explanation in [src/index.html](../src/index.html) aligned
   with the configuration. Each recipe intentionally consumes its declared resource ingredients.
4. Adjust the deterministic assertions in
   [tests/test_simulation.mjs](../tests/test_simulation.mjs) when the supported economic contract
   changes.

Run the fast simulation gate after each economy change:

```bash
./check_codebase.sh
```

The Node tests prove that a mutation improves its relevant economy, prices increase with level,
and purchases spend only their declared resources.

## Evolve surface artwork

Use this workflow when a mutation needs a more distinctive visible signature.

1. Edit the matching asset in [src/art](../src/art). The current layers use
   `mutation_transporters.svg`, `mutation_glycolysis.svg`, `mutation_angiogenesis.svg`, and
   `mutation_immune_cloak.svg`.
2. Preserve the matching image ID in [src/index.html](../src/index.html) and the ID-to-mutation
   mapping in [src/ui_rendering.ts](../src/ui_rendering.ts). The renderer converts each purchased
   level into the layer's `data-level` and `--mutation-intensity` values.
3. Keep the shop's surface-signature label truthful to the artwork.
4. Confirm the layer starts hidden at level zero and becomes visible after a real shop purchase in
   [tests/playwright/smoke.spec.ts](../tests/playwright/smoke.spec.ts).

Run the production-shaped browser check to verify assets load and purchases reveal the intended
layers:

```bash
./run_playwright_tests.sh --build
```

## Verify a release candidate

Run these checks before publishing a build or changing the GitHub Pages artifact:

```bash
./check_codebase.sh
./build_github_pages.sh
./run_playwright_tests.sh --build
source source_me.sh && pytest tests
```

The first command checks TypeScript, linting, formatting, and deterministic simulation tests. The
build creates the Pages-ready `dist/` folder. Playwright exercises the real interface, including
visible harvesting and mutation purchases. Pytest checks repository documentation and hygiene
rules. Deployment details are in [README.md](../README.md).
