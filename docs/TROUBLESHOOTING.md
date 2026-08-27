# Troubleshooting

Use the repository shell scripts from the repository root. They build and test the same `dist/`
artifact that GitHub Pages receives.

## Restore local dependencies

### `node_modules/` is missing

`./run_playwright_tests.sh` requires local dependencies. The preview server can install them, but
the explicit setup command makes the first-run step clear.

```bash
./devel/setup_typescript.sh
```

The script runs `npm install` from the repository root. After it finishes, rerun the command that
reported the missing directory.

### `npm install` cannot write its cache

An earlier install on the maintainer machine found a root-owned shared `~/.npm` cache. Use a
user-writable cache for the install rather than changing ownership with `sudo`:

```bash
NPM_CONFIG_CACHE="$HOME/.cache/npm" npm install
```

Then run the normal repository gate:

```bash
./check_codebase.sh
```

## Repair browser checks

### Playwright reports a missing browser

Install the project browser binaries after Node dependencies are present:

```bash
./devel/setup_playwright.sh
```

The setup script installs Chromium and Firefox. Run the production-shaped browser suite again:

```bash
./run_playwright_tests.sh --build
```

### Browser tests show an old build

Force a fresh production build before Playwright starts its configured web server:

```bash
./run_playwright_tests.sh --build
```

The runner also rebuilds when `dist/index.html` or `dist/main.js` is absent. It does not reuse a
separate manually started preview server.

## Repair a local preview

### The preview needs a known port

`./run_web_server.sh` selects a random port for each session. Set `PORT` when another tool needs a
stable local URL:

```bash
PORT=8123 ./run_web_server.sh
```

The script rebuilds `dist/` before serving it. If the selected port is already occupied, choose a
different unused value and rerun the command.

### The production build fails

Run the build directly to see the first actionable failure:

```bash
./build_github_pages.sh
```

The build checks TypeScript, bundles `src/main.ts`, and requires `src/index.html`, `src/style.css`,
and the authored SVG art. Restore the named source file or resolve the reported type error, then
rerun the build.

## Verify the repository

Run each relevant tier after a repair:

```bash
./check_codebase.sh
source source_me.sh && pytest tests
./run_playwright_tests.sh --build
```

For browser-test conventions, see [PLAYWRIGHT_USAGE.md](PLAYWRIGHT_USAGE.md). For the normal
player and local-preview path, see [../README.md](../README.md).
