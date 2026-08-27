# Development workflow

This guide is for maintainers changing Cancer Clicker. The source of truth is `src/`; the
generated `dist/` directory is the GitHub Pages artifact and is rebuilt for every release.

## First setup

Install the Node dependencies after cloning or whenever `node_modules/` is absent:

```bash
./devel/setup_typescript.sh
```

Install Playwright browsers before running the browser suite on a new machine:

```bash
./devel/setup_playwright.sh
```

The deployment workflow uses Node 24. Keep the committed `package-lock.json` with dependency
changes so local installs and GitHub Pages use the declared dependency graph.

## Daily development

- Edit TypeScript, HTML, CSS, and SVG sources under `src/`.
- Run the fast code gate after a focused change.
- Preview the Pages-shaped build in a browser before considering a visual change complete.
- Run the browser suite when an interaction, responsive layout, or rendered asset changes.

```bash
./check_codebase.sh
./run_web_server.sh
./run_playwright_tests.sh --build
```

`run_web_server.sh` rebuilds `dist/`, serves only that directory, and chooses a random local
port unless `PORT` is set. Stop the foreground server with `Ctrl-C` when the visual review ends.

## Verification lanes

| Command | Evidence produced |
| --- | --- |
| `./check_codebase.sh` | TypeScript checks, ESLint, Prettier, and pure Node simulation tests. |
| `source source_me.sh && pytest tests` | Fast repository hygiene checks, including Markdown links and source limits. |
| `./build_github_pages.sh` | A fresh Pages-ready `dist/` bundle with copied SVG game art. |
| `./run_playwright_tests.sh --build` | Production-built browser interactions and responsive layout checks. |

Use the exact pytest command above. `source_me.sh` establishes the repository's Python runtime
environment before pytest runs.

## Publishing flow

Build the deployable artifact locally:

```bash
./build_github_pages.sh
```

[.github/workflows/deploy-pages.yml](../.github/workflows/deploy-pages.yml) runs on pushes to
`main` and manual dispatches. It installs dependencies, rebuilds `dist/`, uploads that directory
as the Pages artifact, then deploys it. The public game is
[Cancer Clicker on GitHub Pages](https://vosslab.github.io/cancer-clicker/).

## Clean builds

Use the light cleaner to remove generated output, tool caches, and browser-test artifacts while
keeping installed dependencies:

```bash
./devel/clean_build.sh
```

Use `./devel/dist_clean.sh` only when a distribution-clean checkout is needed. It also removes
`node_modules/`, so rerun `./devel/setup_typescript.sh` before the normal checks.

## Related references

- [README.md](../README.md) gives players the live link and shortest local path.
- [TESTS_TYPESCRIPT_README.md](../tests/TESTS_TYPESCRIPT_README.md) explains the TypeScript test
  lanes and front-door scripts.
- [PLAYWRIGHT_USAGE.md](PLAYWRIGHT_USAGE.md) covers browser-test and screenshot conventions.
- [TYPESCRIPT_STYLE.md](TYPESCRIPT_STYLE.md) defines the project-wide TypeScript build rules.
