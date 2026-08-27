# File structure

## Top-level layout

```text
.
+- src/                   Browser source, simulation modules, CSS, and SVG art
+- tests/                 Node economy tests, Playwright checks, and Python repo checks
+- docs/                  Project guidance and maintenance documentation
+- devel/                 Setup, cleanup, version, and changelog helper scripts
+- tools/                 Small repository utilities
+- dist/                  Generated GitHub Pages artifact; ignored by Git
+- build_github_pages.sh  Production build front door
+- run_web_server.sh      Local preview front door for the built artifact
+- run_playwright_tests.sh Production-shaped browser test front door
+- check_codebase.sh      TypeScript, lint, format, and Node test gate
+- package.json           Node package metadata and command aliases
+- deploy-pages.yml       GitHub Pages workflow definition
+- README.md              Newcomer landing page
+- AGENTS.md              Short operational guidance for coding agents
`- source_me.sh           Shell environment setup for Python commands
```

## Browser source

- [src/index.html](/src/index.html) is the semantic application shell and names the DOM contract used
  by the controller, renderer, and browser tests.
- [src/main.ts](/src/main.ts) starts the game loop and routes visible button actions.
- [src/simulation.ts](/src/simulation.ts), [src/game_state.ts](/src/game_state.ts),
  [src/constants.ts](/src/constants.ts), [src/brands.ts](/src/brands.ts), and
  [src/types/simulation.ts](/src/types/simulation.ts) form the deterministic economy model.
- [src/ui_rendering.ts](/src/ui_rendering.ts) owns DOM updates derived from simulation state.
- [src/style.css](/src/style.css) owns the visual layout and responsive behavior.
- [src/art/](/src/art/) holds authored SVG assets copied unchanged to `dist/art/` during builds.

## Test layout

- [tests/test_simulation.mjs](/tests/test_simulation.mjs) is the Node test suite for game rules.
- [tests/playwright/smoke.spec.ts](/tests/playwright/smoke.spec.ts) verifies the real built page in a
  browser; [playwright.config.ts](/playwright.config.ts) supplies its temporary static web server.
- The remaining [tests/](/tests/) Python modules enforce shared repository standards, including
  Markdown links, ASCII, formatting hygiene, imports, and source-file length.
- [tests/TESTS_README.md](/tests/TESTS_README.md) and
  [tests/TESTS_TYPESCRIPT_README.md](/tests/TESTS_TYPESCRIPT_README.md) explain those checks.

## Documentation map

- [README.md](../README.md) introduces the game, live demo, play loop, and verification commands.
- [CHANGELOG.md](CHANGELOG.md) records project changes in reverse chronological order.
- [CODE_ARCHITECTURE.md](CODE_ARCHITECTURE.md) describes runtime responsibilities and data flow.
- [E2E_TESTS.md](E2E_TESTS.md), [PLAYWRIGHT_TEST_STYLE.md](PLAYWRIGHT_TEST_STYLE.md), and
  [PLAYWRIGHT_USAGE.md](PLAYWRIGHT_USAGE.md) cover browser-testing expectations and use.
- [TYPESCRIPT_STYLE.md](TYPESCRIPT_STYLE.md), [PYTHON_STYLE.md](PYTHON_STYLE.md),
  [PYTEST_STYLE.md](PYTEST_STYLE.md), [MARKDOWN_STYLE.md](MARKDOWN_STYLE.md), and
  [REPO_STYLE.md](REPO_STYLE.md) define repository conventions.
- [FUN_VIBES_DESIGN_STYLE.md](FUN_VIBES_DESIGN_STYLE.md) and
  [PLAYFUL_TRAINING_GAME_STYLE.md](PLAYFUL_TRAINING_GAME_STYLE.md) capture the intended game tone.

## Generated artifacts

- `dist/` is the disposable production artifact. [build_github_pages.sh](/build_github_pages.sh)
  removes and recreates it, including `dist/main.js`, `dist/index.html`, `dist/style.css`, and
  `dist/art/`.
- `node_modules/`, Playwright reports, test results, coverage, and TypeScript build metadata are
  ignored by [.gitignore](../.gitignore).
- Do not edit files under `dist/` to change the game. Edit the matching source in [src/](/src/) and
  rebuild instead.

## Where to add work

- Put gameplay behavior in [src/simulation.ts](/src/simulation.ts), shared immutable contracts in
  [src/types/simulation.ts](/src/types/simulation.ts), and balance constants in
  [src/constants.ts](/src/constants.ts).
- Put semantic controls and art references in [src/index.html](/src/index.html), and state-to-DOM
  updates in [src/ui_rendering.ts](/src/ui_rendering.ts).
- Put game artwork in [src/art/](/src/art/) as editable SVG and visual styling in
  [src/style.css](/src/style.css).
- Put deterministic game assertions in [tests/test_simulation.mjs](/tests/test_simulation.mjs) and
  visible interaction checks in [tests/playwright/](/tests/playwright/).
- Put durable reference documentation under [docs/](/docs/) using SCREAMING_SNAKE_CASE names; the
  README owns the newcomer landing-page narrative.
