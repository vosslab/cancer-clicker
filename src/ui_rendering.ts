import type {
  EconomySnapshot,
  ResourceCost,
  SimulationState,
  UpgradeCosts,
  UpgradeId,
} from "./types/simulation";

const IMMUNE_ALERT_THRESHOLD = 45;
const PARTICLE_COUNT = 14;
const UPGRADE_IDS = [
  "transporters",
  "glycolysis",
  "angiogenesis",
  "immune_cloak",
] as const satisfies readonly UpgradeId[];
const COMPACT_NUMBER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});

export function renderGame(
  state: SimulationState,
  economy: EconomySnapshot,
  upgradeCosts: UpgradeCosts,
): void {
  requiredElement<HTMLOutputElement>("#nutrients-value").value = formatCompactNumber(
    state.resources.nutrients,
  );
  requiredElement<HTMLOutputElement>("#energy-value").value = formatCompactNumber(
    state.resources.energy,
  );
  requiredElement<HTMLOutputElement>("#biomass-value").value = formatCompactNumber(
    state.resources.biomass,
  );
  renderResourceRate("#nutrients-rate", economy.nutrientStockRate);
  renderResourceRate("#energy-rate", economy.energyStockRate);
  renderResourceRate("#biomass-rate", economy.biomassStockRate);
  requiredElement<HTMLOutputElement>("#host-control-value").value =
    `${formatNumber(state.hostControl)}%`;
  requiredElement<HTMLOutputElement>("#cell-health-value").value =
    `${formatNumber(state.cellHealth)}%`;
  requiredElement<HTMLElement>("#immune-pressure-value").textContent =
    `Threat ${formatNumber(state.immunePressure)}`;

  renderProgress("#host-control-bar", state.hostControl);
  renderProgress("#cell-health-bar", state.cellHealth);
  renderUpgrade("transporters", state, upgradeCosts);
  renderUpgrade("glycolysis", state, upgradeCosts);
  renderUpgrade("angiogenesis", state, upgradeCosts);
  renderUpgrade("immune_cloak", state, upgradeCosts);
  renderShopReadyCount(state, upgradeCosts);
  renderLineage(state, economy);
  renderCellEvolution(state);

  const startOverlay = requiredElement<HTMLElement>("#start-overlay");
  const cellStage = requiredElement<HTMLElement>("#cell-stage");
  document.body.dataset["simulationStatus"] = state.status;
  document.body.dataset["colonyPhase"] = state.phase;
  startOverlay.hidden = state.status !== "ready";

  const immuneAlert = state.immunePressure >= IMMUNE_ALERT_THRESHOLD;
  cellStage.dataset["immuneAlert"] = String(immuneAlert);
  requiredElement<HTMLElement>("#game-message").textContent = describeGameState(state, immuneAlert);
  renderResourceTrend(".resource-nutrients", economy.nutrientStockRate);
  renderResourceTrend(".resource-energy", economy.energyStockRate);
  renderResourceTrend(".resource-biomass", economy.biomassStockRate);
  createNutrientParticles();
}

function renderShopReadyCount(state: SimulationState, costs: UpgradeCosts): void {
  const readyCount = UPGRADE_IDS.filter((id) => {
    const cost = costs[id];
    return (
      state.status !== "ready" &&
      state.resources.nutrients >= cost.nutrients &&
      state.resources.energy >= cost.energy &&
      state.resources.biomass >= cost.biomass
    );
  }).length;
  const badge = requiredElement<HTMLElement>("#mutation-shop-ready");
  badge.textContent = String(readyCount);
  badge.setAttribute("aria-label", `${readyCount} mutations ready to buy`);
}

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Cancer Clicker renderer requires ${selector}.`);
  }
  return element;
}

function renderProgress(selector: string, value: number): void {
  const bar = requiredElement<HTMLElement>(selector);
  const fill = bar.querySelector<HTMLElement>(".progress-fill");
  if (fill === null) {
    throw new Error(`Cancer Clicker renderer requires a .progress-fill in ${selector}.`);
  }
  const percentage = clampPercentage(value);
  bar.setAttribute("aria-valuenow", formatNumber(percentage));
  fill.style.setProperty("--progress", `${formatNumber(percentage)}%`);
}

function renderUpgrade(id: UpgradeId, state: SimulationState, costs: UpgradeCosts): void {
  const level = state.upgradeLevels[id];
  const cost = costs[id];
  const levelElement = requiredElement<HTMLElement>(`#upgrade-${id}-level`);
  const costElement = requiredElement<HTMLElement>(`#upgrade-${id}-cost`);
  const button = requiredElement<HTMLButtonElement>(`[data-upgrade-id='${id}']`);
  const affordable =
    state.resources.nutrients >= cost.nutrients &&
    state.resources.energy >= cost.energy &&
    state.resources.biomass >= cost.biomass;
  levelElement.textContent = String(level);
  costElement.textContent = formatResourceCost(cost);
  button.disabled = !affordable || state.status === "ready";
  button.setAttribute("aria-label", `Level ${level + 1}: ${costElement.textContent}`);
}

function formatResourceCost(cost: ResourceCost): string {
  const components = [
    cost.nutrients > 0 ? `${formatCompactNumber(cost.nutrients)} nutrients` : "",
    cost.energy > 0 ? `${formatCompactNumber(cost.energy)} energy` : "",
    cost.biomass > 0 ? `${formatCompactNumber(cost.biomass)} biomass` : "",
  ].filter((component) => component.length > 0);
  return components.join(" + ");
}

function renderLineage(state: SimulationState, economy: EconomySnapshot): void {
  const lineageContainer = requiredElement<HTMLElement>("#lineage-expansion");
  lineageContainer.hidden = state.phase !== "lineage";
  requiredElement<HTMLOutputElement>("#lineage-expansion-value").value = formatCompactNumber(
    state.lineageExpansion,
  );
  renderResourceRate("#lineage-expansion-rate", economy.lineageExpansionRate);
}

function renderResourceRate(selector: string, rate: number): void {
  requiredElement<HTMLOutputElement>(selector).value = formatRate(rate);
}

function renderCellEvolution(state: SimulationState): void {
  const mutationArt: Readonly<Record<UpgradeId, string>> = {
    transporters: "#mutation-transporters-art",
    glycolysis: "#mutation-glycolysis-art",
    angiogenesis: "#mutation-angiogenesis-art",
    immune_cloak: "#mutation-immune-cloak-art",
  };
  for (const id of UPGRADE_IDS) {
    const level = state.upgradeLevels[id];
    const art = requiredElement<HTMLElement>(mutationArt[id]);
    art.dataset["level"] = String(level);
    art.style.setProperty("--mutation-intensity", formatDecimal(normalizeLevel(level)));
  }

  const expansion = state.phase === "lineage" ? state.lineageExpansion : state.hostControl;
  const tumorIntensity = Math.min(1, Math.log1p(expansion) / Math.log(401));
  requiredElement<HTMLElement>("#tumor-mass").style.setProperty(
    "--tumor-intensity",
    formatDecimal(tumorIntensity),
  );
  const immunePatrol = requiredElement<HTMLElement>("#immune-patrol-image");
  immunePatrol.style.setProperty(
    "--immune-visibility",
    formatDecimal(Math.min(0.9, Math.max(0, state.immunePressure - 10) / 70)),
  );
}

function renderResourceTrend(selector: string, change: number): void {
  requiredElement<HTMLElement>(selector).dataset["trend"] =
    change > 0 ? "up" : change < 0 ? "down" : "steady";
}

function createNutrientParticles(): void {
  const container = requiredElement<HTMLElement>("#nutrient-particles");
  if (container.querySelectorAll(":scope > .nutrient-particle").length === PARTICLE_COUNT) {
    return;
  }
  container.replaceChildren();
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const particle = document.createElement("span");
    particle.className = "nutrient-particle";
    particle.style.left = `${8 + ((index * 17) % 83)}%`;
    particle.style.top = `${12 + ((index * 29) % 76)}%`;
    particle.style.animationDelay = `${-(index * 0.37)}s`;
    container.append(particle);
  }
}

function describeGameState(state: SimulationState, immuneAlert: boolean): string {
  if (state.status === "ready") return "The transformed cell is ready to wake.";
  if (state.phase === "lineage")
    return "Host control is complete. The lineage keeps spreading: build a messy immortal colony.";
  if (immuneAlert)
    return "Immune threat is rising. An Immune Cloak mutation can keep the cell alive.";
  return "Click the cell to harvest, then spend its resources in the Mutation Shop.";
}

function normalizeLevel(level: number): number {
  return Math.min(1, Math.log1p(level) / Math.log(9));
}

function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, value));
}
function formatNumber(value: number): string {
  return value.toFixed(Number.isInteger(value) ? 0 : 1);
}
function formatCompactNumber(value: number): string {
  return COMPACT_NUMBER.format(value);
}
function formatRate(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "0/s";
  return `${value > 0 ? "+" : ""}${formatCompactNumber(value)}/s`;
}
function formatDecimal(value: number): string {
  return value.toFixed(2);
}
