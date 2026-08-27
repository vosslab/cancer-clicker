# Cancer Clicker

Cancer Clicker is a stylized, visual endless clicker about feeding one transformed cell, evolving its surface, and building a sprawling colony in an organic tissue pocket.

## The premise

Click the founding cell to harvest nutrients, energy, and roughly one biomass at a time. Spend energy and biomass in the always-open Mutation Shop, then click faster as each mutation compounds the harvest. It is a deliberately inverted, non-clinical strategy toy: not medical guidance and not a model of real disease outcomes.

At 100% host control, there is no victory screen or reset. The game shifts to a HeLa-inspired endless lineage phase: the founding cell remains in place while daughter-cell layers accumulate into a messier tumor. This fictional visual reference respectfully honors Henrietta Lacks and does not use her story as a gameplay reward.

## Mutation shop

The Mutation Shop is permanently visible beside the playfield, so the immediate loop stays simple: click, afford a mutation, mutate, and click faster. Mutations have no level cap; their escalating costs keep the colony accumulating resources indefinitely.

- Transporter swarm raises nutrient capture and equips receptor-chevron surface signatures.
- Glycolysis burst raises energy from each harvest and equips metabolic-ring signatures.
- Angiogenesis signal enriches the nutrient supply and equips vessel-fork signatures.
- Immune cloak reduces host-response drag and equips a glycan-shield signature.

The mutations use distinct resources: Transporter swarm costs biomass, Glycolysis burst costs nutrients, Angiogenesis signal costs energy, and Immune cloak uses both energy and biomass. Every purchased mutation visibly equips or intensifies its matching antigen/signature artwork on the founding cell. Growth appears as additional daughter cells, rather than inflating that cell to fill the screen.

## Play now

Run the local web server:

```bash
./run_web_server.sh
```

Build the GitHub Pages-ready `dist/` folder:

```bash
./build_github_pages.sh
```

`deploy-pages.yml` is the root workflow seed for publishing that folder. No live GitHub Pages URL is documented here because one is not confirmed.

## Designed to be watched

The game is a visual clicker first: a 16:10 application window contains a matching 16:10 tissue play area, an oversized interactive cell, drifting nutrient particles, mutation signatures, and an always-visible shop. The editable SVG source art includes `src/art/tissue_scene.svg`, `src/art/tumor_cell.svg`, the daughter colony, immune patrol, and four mutation signatures.

Use the visible Awaken, Pause/Resume, Restart, cell, and mutation buttons. Native buttons are keyboard reachable and retain visible focus.

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
source source_me.sh && python3 -m pytest
```

The deterministic economy tests live in `tests/test_simulation.mjs`, and browser interaction checks live in [tests/playwright/smoke.spec.ts](tests/playwright/smoke.spec.ts).

## License

Source code: [LICENSE.MIT](LICENSE.MIT).
