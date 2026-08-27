# Install

Cancer Clicker is a static TypeScript browser game. Installing the repository prepares its
development, build, formatting, and browser-test tools; the published game itself runs from static
files on GitHub Pages.

## Requirements

- Node.js and npm available on your `PATH`.
- Bash for the repository shell scripts.
- Python 3 for the local static server and the Python quality suite.
- A local checkout that includes [package.json](../package.json) and
  [package-lock.json](../package-lock.json).

## Install steps

From the repository root after cloning or obtaining the source:

```bash
./devel/setup_typescript.sh
```

The setup script runs `npm install` using the dependency manifest. It installs the compiler,
bundler, formatter, linter, TypeScript test loader, and Playwright test package declared in
[package.json](../package.json).

Install browser binaries before running the browser smoke suite:

```bash
./devel/setup_playwright.sh
```

## Verify install

Run the primary code gate:

```bash
./check_codebase.sh
```

This type-checks the source and tests, runs ESLint and Prettier checks, then executes the
deterministic Node simulation tests.

## Test the Python checks

Use the repository environment before running the Python quality suite:

```bash
source source_me.sh && pytest tests
```

## Known gaps

- TODO: Verify the supported Node.js version range on a fresh checkout.
- TODO: Verify local-server and Playwright setup on the supported developer platforms.
