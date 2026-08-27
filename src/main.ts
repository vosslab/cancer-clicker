import { SIMULATION_STEP_SECONDS } from "./constants";
import { createInitialState } from "./game_state";
import {
  advanceSimulation,
  calculateEconomySnapshot,
  calculateUpgradeCosts,
  harvestNutrientBurst,
  purchaseUpgrade,
  setSimulationStatus,
} from "./simulation";
import type { SimulationState, UpgradeId } from "./types/simulation";
import { renderGame } from "./ui_rendering";

const TICK_INTERVAL_MILLISECONDS = 250;

let state: SimulationState = createInitialState();

function main(): void {
  const startButton = requiredElement<HTMLButtonElement>("#start-button");
  const restartButton = requiredElement<HTMLButtonElement>("#restart-button");
  const cellClickTarget = requiredElement<HTMLButtonElement>("#cell-click-target");

  startButton.addEventListener("click", startSimulation);
  restartButton.addEventListener("click", restartSimulation);
  cellClickTarget.addEventListener("click", harvestNutrients);
  cellClickTarget.addEventListener("animationend", removeClickFeedback);
  document.addEventListener("click", handleManagementClick);
  window.setInterval(advanceClock, TICK_INTERVAL_MILLISECONDS);
  render();
}

function render(): void {
  const economy = calculateEconomySnapshot(state);
  const upgradeCosts = calculateUpgradeCosts(state);
  renderGame(state, economy, upgradeCosts);
}

function startSimulation(): void {
  if (state.status !== "ready") {
    return;
  }

  state = setSimulationStatus(state, "running");
  render();
}

function restartSimulation(): void {
  state = createInitialState();
  render();
}

function harvestNutrients(): void {
  state = harvestNutrientBurst(state);
  render();
  triggerClickFeedback();
}

function advanceClock(): void {
  state = advanceSimulation(state, SIMULATION_STEP_SECONDS);
  render();
}

function triggerClickFeedback(): void {
  const cellClickTarget = requiredElement<HTMLButtonElement>("#cell-click-target");
  cellClickTarget.classList.remove("is-clicked");
  window.requestAnimationFrame(addClickFeedback);
}

function addClickFeedback(): void {
  const cellClickTarget = requiredElement<HTMLButtonElement>("#cell-click-target");
  cellClickTarget.classList.add("is-clicked");
}

function removeClickFeedback(event: AnimationEvent): void {
  const cellClickTarget = requiredElement<HTMLButtonElement>("#cell-click-target");
  if (event.target !== cellClickTarget) {
    return;
  }
  cellClickTarget.classList.remove("is-clicked");
}

function handleManagementClick(event: MouseEvent): void {
  const button = managementButton(event.target);
  if (button === null) {
    return;
  }

  if (button.dataset["action"] === "buy-upgrade") {
    const upgradeId = readUpgradeId(button);
    state = purchaseUpgrade(state, upgradeId);
    render();
  }
}

function managementButton(target: EventTarget | null): HTMLButtonElement | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const button = target.closest<HTMLButtonElement>("button[data-action]");
  return button;
}

function readUpgradeId(button: HTMLButtonElement): UpgradeId {
  const upgradeId = button.dataset["upgradeId"];
  if (isUpgradeId(upgradeId)) {
    return upgradeId;
  }
  throw new Error("Upgrade control requires a valid data-upgrade-id value.");
}

function isUpgradeId(value: string | undefined): value is UpgradeId {
  return (
    value === "transporters" ||
    value === "glycolysis" ||
    value === "angiogenesis" ||
    value === "immune_cloak"
  );
}

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Cancer Clicker controller requires ${selector}.`);
  }
  return element;
}

main();
