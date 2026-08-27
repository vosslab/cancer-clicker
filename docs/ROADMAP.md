# Roadmap

Cancer Clicker is an endless visual incremental game. This roadmap records the next directions
already supported by the game's current loop and design decisions; it has no release schedule.

## Current foundation

- The player clicks a founding cell, spends distinct resources on uncapped mutations, and gains
  faster active and passive accumulation.
- Host control is a transition into endless lineage growth, not a victory screen, failure state,
  or forced reset.
- Each mutation has a visible antigen or surface signature, while daughter cells make the tumor
  messier instead of merely enlarging the founding cell.
- The 16:10 tissue field and always-open Mutation Shop remain the primary visual interaction.

## Next priorities

### Deepen the mutation ladder

- Add higher-tier mutations only when each one has a distinct resource recipe, economic effect,
  and visible change to the cell or colony.
- Keep the first mutation affordable through active clicking, then let escalating costs create
  longer-term choices between the four resource types.
- Preserve non-negative passive stocks and the no-failure-state loop while tuning new effects.

### Make progression legible

- Add calm milestone feedback for meaningful events such as a new mutation tier or a larger
  lineage stage; avoid treating every click as a milestone.
- Keep large colony totals readable with compact number formatting, and verify the display as
  uncapped costs and resources rise.
- Add player-facing goals or achievements only when they clarify the next useful decision in the
  Mutation Shop.

### Support return visits

- Evaluate local-only save state and offline accumulation after defining a versioned save schema,
  migration behavior, reset confirmation, and browser coverage.
- Consider prestige only as an optional later loop: it must grant a durable benefit, preserve the
  endless no-loss tone, and clearly explain what resets before implementation.

## Guardrails

- Do not restore a pause control. Once awakened, the simulation continues accumulating while the
  page is open.
- Do not turn 100% host control into an ending; the lineage phase remains the endless expansion
  loop.
- Keep biology framing fictional and non-clinical, as described in [README.md](../README.md).
- Preserve visible mutation artwork, keyboard-reachable controls, mobile shop access, and the
  documented 16:10 playfield contract.

## Evidence and review

- Use the published-rate and mutation-recipe checks in
  [tests/test_simulation.mjs](../tests/test_simulation.mjs) when changing economy rules.
- Use the production-built interaction coverage in
  [tests/playwright/smoke.spec.ts](../tests/playwright/smoke.spec.ts) when changing the interface.
- Record implemented changes and validation evidence in [CHANGELOG.md](CHANGELOG.md).
