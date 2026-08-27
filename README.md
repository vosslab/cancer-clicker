# Cancer Clicker

Cancer Clicker is a stylized, visual endless clicker about feeding one transformed cell, evolving its surface, and building a sprawling colony in an organic tissue pocket.

[Play Cancer Clicker on GitHub Pages](https://vosslab.github.io/cancer-clicker/)

## The premise

Click the founding cell to harvest nutrients, energy, and biomass. Spend the specific resources named on each Mutation Shop recipe, then click faster as each mutation compounds the harvest. It is a deliberately inverted, non-clinical strategy toy: not medical guidance and not a model of real disease outcomes.

At 100% host control, there is no victory screen or reset. The game shifts to a HeLa-inspired endless lineage phase: the founding cell remains in place while daughter-cell layers accumulate into a messier tumor. This fictional visual reference respectfully honors Henrietta Lacks and does not use her story as a gameplay reward.

## Mutation shop

The Mutation Shop is permanently visible beside the playfield, so the immediate loop stays simple: click, afford a mutation, mutate, and click faster. Mutations have no level cap; their escalating costs keep the colony accumulating resources indefinitely.

- Transporter swarm raises nutrient capture and equips receptor-chevron surface signatures.
- Glycolysis burst raises energy from each harvest and equips metabolic-ring signatures.
- Angiogenesis signal enriches the nutrient supply and equips vessel-fork signatures.
- Immune cloak reduces host-response drag and equips a glycan-shield signature.

The mutations use distinct resources: Transporter swarm costs biomass, Glycolysis burst costs nutrients, Angiogenesis signal costs energy, and Immune cloak uses both energy and biomass. Every purchased mutation visibly equips or intensifies its matching antigen/signature artwork on the founding cell. Growth appears as additional daughter cells, rather than inflating that cell to fill the screen.

## Published production rates

Each resource card publishes its current live passive rate as `+amount/s`: nutrients, energy, and
biomass. The lineage HUD publishes the same rate once host control reaches 100%. These are the
actual stock deltas used by the simulation, not decorative estimates. Passive rates and resource
stocks never become negative; only an affordable Mutation Shop purchase spends resources. Rates
respond immediately to cell health and purchased mutations. The colony keeps accumulating while
the page is open, including when it is idle between clicks.

## Play now

Play the live game: [Cancer Clicker on GitHub Pages](https://vosslab.github.io/cancer-clicker/).

For local development, run the web server:

```bash
./run_web_server.sh
```

Build the GitHub Pages-ready `dist/` folder:

```bash
./build_github_pages.sh
```

[.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) publishes that folder. The
confirmed deployment is available at the live link above.

## Designed to be watched

The game is a visual clicker first: on desktop, the application window and playfield are both 16:10. On a narrow portrait screen, the tissue chamber remains an exact 16:10 field and the permanently open shop stacks below it, keeping targets and copy readable rather than squeezing the playfield. Enlarged telemetry, controls, shop copy, and progress labels make the resource rates and colony state legible at game scale. The pre-takeover lineage HUD stays hidden until the endless lineage phase begins.

Editable SVG source art includes [the tissue scene](src/art/tissue_scene.svg),
[the founding cell](src/art/tumor_cell.svg), the daughter colony, immune patrol, and four mutation
signatures.

Use the visible Awaken, Restart, cell, and mutation buttons. The live simulation has no pause
control, so its passive accumulation remains continuous. Native buttons are keyboard reachable and
retain visible focus.

## Checks

Run the code gate:

```bash
./check_codebase.sh
```

Run the production-shaped browser smoke tests, rebuilding first:

```bash
./run_playwright_tests.sh --build
```

Run the repository's Python quality suite:

```bash
source source_me.sh && python3 -m pytest tests/
```

Current validation evidence: `./check_codebase.sh` passed 5 checks, including 11 Node tests;
`./build_github_pages.sh` completed; `./run_playwright_tests.sh --build` passed 2 browser tests;
`source source_me.sh && python3 -m pytest tests/` passed 597 tests; and authored SVG files passed XML validation. The confirmed live deployment is linked above.

The deterministic economy tests live in [tests/test_simulation.mjs](tests/test_simulation.mjs); they
verify published rates match exact stock deltas and mutation recipes use strictly distinct
ingredients. Browser interaction checks live in [tests/playwright/smoke.spec.ts](tests/playwright/smoke.spec.ts),
where visible clicks buy all four mutations and confirm that each matching antigen SVG layer activates.

## License

Source code: [LICENSE.MIT](LICENSE.MIT).
