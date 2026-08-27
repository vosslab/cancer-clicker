# Usage

Cancer Clicker is an endless browser clicker: awaken the founding cell, harvest resources, buy
mutations, and build an increasingly messy daughter-cell colony inside a stylized tissue pocket.

## Quick start

Start a local preview of the production-shaped GitHub Pages build:

```bash
./run_web_server.sh
```

The script rebuilds `dist/`, selects a local port, and serves the generated game until you stop the
command. Open the printed `http://localhost:<port>/` address if a browser does not open for you.

In the game:

1. Select **Awaken cell** to begin passive accumulation.
2. Click the founding cell to harvest nutrients, energy, and biomass actively.
3. Buy an affordable Mutation Shop recipe to compound harvesting and passive production.
4. Continue after 100% host control as daughter-cell layers accumulate in the endless lineage phase.

The simulation has no pause control. Resources continue to accumulate while the page remains open;
**Restart** begins a new local colony.

## Build for GitHub Pages

Create the static deployment artifact:

```bash
./build_github_pages.sh
```

The build overwrites `dist/` with `index.html`, `style.css`, `main.js`, source maps, the authored
SVG art, and `.nojekyll`. Serve that folder locally with [run_web_server.sh](../run_web_server.sh)
or publish it through [deploy-pages.yml](../.github/workflows/deploy-pages.yml).

## Check the game

Run the code and deterministic-economy gate:

```bash
./check_codebase.sh
```

Run the production-shaped browser smoke tests, rebuilding first:

```bash
./run_playwright_tests.sh --build
```

Run the repository quality suite:

```bash
source source_me.sh && pytest tests
```

## Inputs and outputs

- The gameplay source is under [src/](../src/), with editable cell and tissue artwork in
  [src/art/](../src/art/).
- The game does not accept player files or require an account; play state exists only in the active
  browser session.
- [build_github_pages.sh](../build_github_pages.sh) recreates the disposable `dist/` deployment
  artifact from source files.

## Further reading

- [README.md](../README.md) gives the project premise, live demo, and mutation overview.
- [E2E_TESTS.md](E2E_TESTS.md) explains the production-shaped browser checks.
- [PLAYWRIGHT_USAGE.md](PLAYWRIGHT_USAGE.md) describes focused Playwright invocation.

## Known gaps

- TODO: Verify browser-version support beyond the configured Playwright browsers.
- TODO: Add an offline-progress design only after its storage and balance rules are defined.
