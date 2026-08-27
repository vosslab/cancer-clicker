import { asGameTick } from "./brands";
import { ALLOCATION_IDS, ECONOMY_CONFIG, MAX_EVENT_LOG_ENTRIES, UPGRADE_CONFIG } from "./constants";
import type {
  AllocationId,
  ColonyPhase,
  EconomySnapshot,
  ResourceCost,
  SimulationState,
  SimulationStatus,
  UpgradeCosts,
  UpgradeId,
} from "./types/simulation";

const MIN_ALLOCATION = 10;
const MAX_ALLOCATION = 80;
const ALLOCATION_STEP = 5;
const NUMBER_CAP = Number.MAX_SAFE_INTEGER;

//============================================

export function calculateEconomySnapshot(state: SimulationState): EconomySnapshot {
  const uptakeShare = state.allocation.uptake / 100;
  const growthShare = state.allocation.growth / 100;
  const evasionShare = state.allocation.evasion / 100;
  const transporters = upgradeEffect(state.upgradeLevels.transporters, 0.3);
  const glycolysis = upgradeEffect(state.upgradeLevels.glycolysis, 0.38);
  const angiogenesis = upgradeEffect(state.upgradeLevels.angiogenesis, 0.6);
  const immuneCloak = upgradeEffect(state.upgradeLevels.immune_cloak, 0.3);
  const healthProductionFactor = 0.55 + (state.cellHealth / 100) * 0.45;
  const captureMultiplier = safeProduct(transporters, angiogenesis);
  const nutrientIncome = safeProduct(
    ECONOMY_CONFIG.baseNutrientIncome,
    state.bloodFlow,
    0.45 + uptakeShare * 1.15,
    captureMultiplier,
  );
  const energyProduction = safeProduct(
    nutrientIncome,
    ECONOMY_CONFIG.baseEnergyYield,
    0.72 + growthShare * 0.28,
    glycolysis,
    healthProductionFactor,
  );
  const upkeep = safeAdd(
    ECONOMY_CONFIG.baseUpkeep,
    safeProduct(state.cellMass, ECONOMY_CONFIG.massUpkeep),
  );
  const biomassProduction = safeProduct(
    Math.max(0, energyProduction - upkeep),
    ECONOMY_CONFIG.baseGrowthEfficiency,
    0.35 + growthShare * 1.3,
    1 + Math.log1p(state.upgradeLevels.glycolysis) * 0.16,
    healthProductionFactor,
  );
  const nutrientUse = energyProduction / ECONOMY_CONFIG.baseEnergyYield;
  const nutrientStockRate = safeAdd(nutrientIncome, -nutrientUse);
  const energyStockRate = safeAdd(energyProduction, -upkeep);
  const intendedGrowthInvestmentRate = safeProduct(biomassProduction, 0.35 + growthShare);
  const biomassStockRate = safeAdd(biomassProduction, -intendedGrowthInvestmentRate);
  const lineageExpansionRate =
    state.phase === "lineage"
      ? safeProduct(
          state.cellMass,
          ECONOMY_CONFIG.lineageExpansionPerMass,
          0.65 + growthShare,
          upgradeEffect(state.upgradeLevels.transporters, 0.12),
          upgradeEffect(state.upgradeLevels.glycolysis, 0.16),
        )
      : 0;
  const effectiveImmunePressure = Math.max(
    0,
    state.immunePressure - evasionShare * 8 - Math.log1p(state.upgradeLevels.immune_cloak) * 5,
  );
  const immuneDamage = safeProduct(
    Math.max(0, effectiveImmunePressure - ECONOMY_CONFIG.immuneDamageThreshold),
    0.12,
    1 / immuneCloak,
  );
  return {
    nutrientStockRate,
    energyStockRate,
    biomassStockRate,
    lineageExpansionRate,
    nutrientIncome,
    energyProduction,
    upkeep,
    biomassProduction,
    immuneDamage,
  };
}

/**
 * Costs climb with every purchase level until JavaScript's largest exactly
 * representable game amount, where they saturate rather than becoming Infinity.
 */
export function calculateUpgradeCost(upgradeId: UpgradeId, level: number): ResourceCost {
  validateUpgradeLevel(level);
  const baseCost = UPGRADE_CONFIG[upgradeId].baseCost;
  const multiplier = safeAdd(1, Math.sqrt(level) * 0.95, Math.log1p(level) * 0.65);
  return {
    nutrients: safeCeilCost(safeProduct(baseCost.nutrients, multiplier)),
    energy: safeCeilCost(safeProduct(baseCost.energy, multiplier)),
    biomass: safeCeilCost(safeProduct(baseCost.biomass, multiplier)),
  };
}

export function calculateUpgradeCosts(state: SimulationState): UpgradeCosts {
  return {
    transporters: calculateUpgradeCost("transporters", state.upgradeLevels.transporters),
    glycolysis: calculateUpgradeCost("glycolysis", state.upgradeLevels.glycolysis),
    angiogenesis: calculateUpgradeCost("angiogenesis", state.upgradeLevels.angiogenesis),
    immune_cloak: calculateUpgradeCost("immune_cloak", state.upgradeLevels.immune_cloak),
  };
}

export function canPurchaseUpgrade(state: SimulationState, upgradeId: UpgradeId): boolean {
  const level = state.upgradeLevels[upgradeId];
  if (!Number.isSafeInteger(level) || level < 0 || level >= NUMBER_CAP) {
    return false;
  }
  const cost = calculateUpgradeCost(upgradeId, level);
  return (
    state.resources.nutrients >= cost.nutrients &&
    state.resources.energy >= cost.energy &&
    state.resources.biomass >= cost.biomass
  );
}

export function purchaseUpgrade(state: SimulationState, upgradeId: UpgradeId): SimulationState {
  if (!canPurchaseUpgrade(state, upgradeId)) {
    return state;
  }
  const level = state.upgradeLevels[upgradeId];
  const cost = calculateUpgradeCost(upgradeId, level);
  return {
    ...state,
    resources: {
      ...state.resources,
      nutrients: finiteNonNegative(state.resources.nutrients - cost.nutrients, "nutrients"),
      energy: finiteNonNegative(state.resources.energy - cost.energy, "energy"),
      biomass: finiteNonNegative(state.resources.biomass - cost.biomass, "biomass"),
    },
    upgradeLevels: { ...state.upgradeLevels, [upgradeId]: level + 1 },
    recentEvents: prependEvents(state.recentEvents, [
      `${UPGRADE_CONFIG[upgradeId].name} upgraded to level ${level + 1}.`,
    ]),
  };
}

export function adjustAllocation(
  state: SimulationState,
  allocationId: AllocationId,
  delta: number,
): SimulationState {
  if (delta !== ALLOCATION_STEP && delta !== -ALLOCATION_STEP) {
    throw new Error("Allocation changes must use a five-point shift.");
  }
  const targetValue = state.allocation[allocationId] + delta;
  if (targetValue < MIN_ALLOCATION || targetValue > MAX_ALLOCATION) {
    return state;
  }
  const nextAllocation = { ...state.allocation };
  let remainingTransfer = Math.abs(delta);
  for (const otherId of ALLOCATION_IDS.filter((id) => id !== allocationId)) {
    const capacity =
      delta > 0
        ? nextAllocation[otherId] - MIN_ALLOCATION
        : MAX_ALLOCATION - nextAllocation[otherId];
    const transfer = Math.min(remainingTransfer, capacity);
    nextAllocation[otherId] += delta > 0 ? -transfer : transfer;
    remainingTransfer -= transfer;
  }
  if (remainingTransfer > 0) {
    return state;
  }
  nextAllocation[allocationId] = targetValue;
  return { ...state, allocation: nextAllocation };
}

export function setSimulationStatus(
  state: SimulationState,
  status: SimulationStatus,
): SimulationState {
  return state.status === status ? state : { ...state, status };
}

export function harvestNutrientBurst(state: SimulationState): SimulationState {
  if (state.status !== "running") {
    return state;
  }
  const uptakeShare = state.allocation.uptake / 100;
  const growthShare = state.allocation.growth / 100;
  const nutrientAccess = safeProduct(
    0.55 + uptakeShare * 1.125,
    upgradeEffect(state.upgradeLevels.transporters, 0.36),
    1 + Math.log1p(state.upgradeLevels.angiogenesis) * 0.2,
  );
  const nutrientGain = safeProduct(8, nutrientAccess);
  const energyGain = safeProduct(
    nutrientGain,
    0.55,
    upgradeEffect(state.upgradeLevels.glycolysis, 0.3),
  );
  // The default is 0.995 biomass per click, preserving the intended clicker cadence.
  const biomassGain = safeProduct(
    0.75 + growthShare * 0.7,
    1 + Math.log1p(state.upgradeLevels.glycolysis) * 0.18,
  );
  return {
    ...state,
    resources: {
      nutrients: safeAdd(state.resources.nutrients, nutrientGain),
      energy: safeAdd(state.resources.energy, energyGain),
      biomass: safeAdd(state.resources.biomass, biomassGain),
    },
  };
}

export function advanceSimulation(state: SimulationState, deltaSeconds: number): SimulationState {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    throw new Error("Simulation delta seconds must be finite and non-negative.");
  }
  if (deltaSeconds === 0 || state.status !== "running") {
    return state;
  }

  const elapsedSeconds = safeAdd(state.elapsedSeconds, deltaSeconds);
  const bloodFlow = safeAdd(
    1,
    Math.sin(elapsedSeconds * 0.65) * 0.16,
    Math.log1p(state.upgradeLevels.angiogenesis) * 0.22,
  );
  const flowingState: SimulationState = { ...state, elapsedSeconds, bloodFlow };
  const economy = calculateEconomySnapshot(flowingState);
  const availableBiomass = safeAdd(
    state.resources.biomass,
    safeProduct(economy.biomassProduction, deltaSeconds),
  );
  const growthInvestment = safeProduct(
    economy.biomassProduction - economy.biomassStockRate,
    deltaSeconds,
  );
  const investedBiomass = Math.min(availableBiomass, growthInvestment);
  const cellMass = safeAdd(state.cellMass, investedBiomass);
  const targetPressure = calculateTargetPressure(flowingState, cellMass);
  const immunePressure = safeAdd(
    state.immunePressure,
    safeProduct(targetPressure - state.immunePressure, Math.min(1, deltaSeconds * 0.12)),
  );
  const threatenedState: SimulationState = { ...flowingState, cellMass, immunePressure };
  const immuneDamage = calculateEconomySnapshot(threatenedState).immuneDamage;
  const cellHealth = calculateCellHealth(state, immuneDamage, deltaSeconds);
  const hostControl =
    state.phase === "host"
      ? clamp(
          safeAdd(
            state.hostControl,
            safeProduct(cellMass, ECONOMY_CONFIG.hostControlPerMass, deltaSeconds),
          ),
          0,
          ECONOMY_CONFIG.takeoverHostControl,
        )
      : ECONOMY_CONFIG.takeoverHostControl;
  const phase: ColonyPhase =
    state.phase === "host" && hostControl >= ECONOMY_CONFIG.takeoverHostControl
      ? "lineage"
      : state.phase;
  const lineageEconomy = calculateEconomySnapshot({ ...flowingState, cellMass, phase });
  const lineageGain = safeProduct(lineageEconomy.lineageExpansionRate, deltaSeconds);
  const resources = {
    nutrients: finiteNonNegative(
      safeAdd(state.resources.nutrients, safeProduct(economy.nutrientStockRate, deltaSeconds)),
      "nutrients",
    ),
    energy: finiteNonNegative(
      safeAdd(state.resources.energy, safeProduct(economy.energyStockRate, deltaSeconds)),
      "energy",
    ),
    biomass: finiteNonNegative(availableBiomass - investedBiomass, "biomass"),
  };
  const events = thresholdEvents(state, hostControl, cellHealth, immunePressure, phase);
  return {
    ...threatenedState,
    tick: asGameTick(Math.min(NUMBER_CAP, state.tick + 1)),
    resources,
    hostControl,
    lineageExpansion: safeAdd(state.lineageExpansion, lineageGain),
    phase,
    cellHealth,
    recentEvents: prependEvents(state.recentEvents, events),
  };
}

//============================================

function calculateTargetPressure(state: SimulationState, cellMass: number): number {
  const excessMass = Math.max(0, cellMass - ECONOMY_CONFIG.immuneActivationMass);
  return Math.max(
    0,
    safeAdd(
      8,
      safeProduct(excessMass, 0.7),
      Math.log1p(state.upgradeLevels.angiogenesis) * 11,
      (-state.allocation.evasion / 100) * 13,
      -Math.log1p(state.upgradeLevels.immune_cloak) * 5.5,
    ),
  );
}

function calculateCellHealth(
  state: SimulationState,
  immuneDamage: number,
  deltaSeconds: number,
): number {
  const recovery = safeAdd(
    0.34,
    (state.allocation.evasion / 100) * 0.55,
    Math.log1p(state.upgradeLevels.immune_cloak) * 0.2,
  );
  return clamp(
    safeAdd(state.cellHealth, safeProduct(recovery - immuneDamage, deltaSeconds)),
    ECONOMY_CONFIG.minimumCellHealth,
    100,
  );
}

function thresholdEvents(
  previous: SimulationState,
  hostControl: number,
  cellHealth: number,
  immunePressure: number,
  phase: ColonyPhase,
): readonly string[] {
  const events: string[] = [];
  if (previous.phase !== phase && phase === "lineage") {
    events.push("Host control reached 100. The colony now expands as an immortal lineage.");
  }
  if (
    previous.immunePressure < ECONOMY_CONFIG.immuneDamageThreshold &&
    immunePressure >= ECONOMY_CONFIG.immuneDamageThreshold
  ) {
    events.push("Immune pressure is slowing growth. Evasion can improve the production rate.");
  }
  if (
    previous.cellHealth > ECONOMY_CONFIG.minimumCellHealth &&
    cellHealth === ECONOMY_CONFIG.minimumCellHealth
  ) {
    events.push("Immune pressure has reached its drag floor; the lineage continues adapting.");
  }
  for (const threshold of [25, 50, 75]) {
    if (previous.hostControl < threshold && hostControl >= threshold) {
      events.push(`Host control passed ${threshold} percent.`);
    }
  }
  return events;
}

function upgradeEffect(level: number, perLogLevel: number): number {
  validateUpgradeLevel(level);
  return safeAdd(1, Math.log1p(level) * perLogLevel);
}

function validateUpgradeLevel(level: number): void {
  if (!Number.isSafeInteger(level) || level < 0) {
    throw new Error("Upgrade levels must be non-negative safe integers.");
  }
}

function prependEvents(
  existingEvents: readonly string[],
  newEvents: readonly string[],
): readonly string[] {
  return [...newEvents, ...existingEvents].slice(0, MAX_EVENT_LOG_ENTRIES);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function safeAdd(...values: readonly number[]): number {
  let total = 0;
  for (const value of values) {
    if (Number.isNaN(value)) {
      throw new Error("Simulation arithmetic received NaN.");
    }
    total = Math.max(-NUMBER_CAP, Math.min(NUMBER_CAP, total + value));
  }
  return total;
}

function safeProduct(...values: readonly number[]): number {
  let product = 1;
  for (const value of values) {
    if (Number.isNaN(value)) {
      throw new Error("Simulation arithmetic received NaN.");
    }
    product = Math.max(-NUMBER_CAP, Math.min(NUMBER_CAP, product * value));
  }
  return product;
}

function safeCeilCost(value: number): number {
  if (value === 0) {
    return 0;
  }
  return Math.min(NUMBER_CAP, Math.max(1, Math.ceil(value)));
}

function finiteNonNegative(value: number, name: string): number {
  if (Number.isNaN(value)) {
    throw new Error(`Simulation ${name} must remain numeric.`);
  }
  return Math.min(NUMBER_CAP, Math.max(0, value));
}
