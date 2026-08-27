import { asGameTick } from "./brands";
import { ECONOMY_CONFIG, METABOLIC_PROFILE, UPGRADE_CONFIG } from "./constants";
import type {
  ColonyPhase,
  EconomySnapshot,
  ResourceCost,
  SimulationState,
  SimulationStatus,
  UpgradeCosts,
  UpgradeId,
} from "./types/simulation";

const NUMBER_CAP = Number.MAX_SAFE_INTEGER;

//============================================

export function calculateEconomySnapshot(state: SimulationState): EconomySnapshot {
  const { nutrientUptakeShare, biomassGrowthShare, immuneEvasionShare } = METABOLIC_PROFILE;
  const transporters = upgradeEffect(state.upgradeLevels.transporters, 0.3);
  const glycolysis = upgradeEffect(state.upgradeLevels.glycolysis, 0.38);
  const angiogenesis = upgradeEffect(state.upgradeLevels.angiogenesis, 0.6);
  const immuneCloak = upgradeEffect(state.upgradeLevels.immune_cloak, 0.3);
  // A cloak does more than prevent damage: a less-interrupted colony can spend
  // more time capturing and converting resources. This intentionally levels
  // off so an uncapped mutation shop cannot make the economy numerically wild.
  const immuneResilience = immuneResilienceMultiplier(state.upgradeLevels.immune_cloak);
  const healthRange = 1 - ECONOMY_CONFIG.minimumHealthProductionFactor;
  const healthProductionFactor = safeAdd(
    ECONOMY_CONFIG.minimumHealthProductionFactor,
    safeProduct(state.cellHealth / 100, healthRange),
  );
  const captureMultiplier = safeProduct(transporters, angiogenesis);
  const nutrientIncome = safeProduct(
    ECONOMY_CONFIG.baseNutrientIncome,
    state.bloodFlow,
    0.45 + nutrientUptakeShare * 1.15,
    captureMultiplier,
    immuneResilience,
  );
  // Metabolism consumes a bounded allocation of captured nutrients. Glycolysis
  // improves the energy yield from that allocation instead of consuming an
  // ever-larger share, so every capture upgrade retains visible nutrient income.
  const nutrientConversionShare = Math.min(
    ECONOMY_CONFIG.maxNutrientConversionShare,
    0.72 + biomassGrowthShare * 0.28,
  );
  const nutrientUse = safeProduct(nutrientIncome, nutrientConversionShare);
  const energyProduction = safeProduct(
    nutrientUse,
    ECONOMY_CONFIG.baseEnergyYield,
    glycolysis,
    healthProductionFactor,
  );
  const upkeepDemand = safeAdd(
    ECONOMY_CONFIG.baseUpkeep,
    safeProduct(state.cellMass, ECONOMY_CONFIG.massUpkeep),
  );
  // The endless clicker economy treats maintenance as a production allocation,
  // never an unpayable debt. A mature lineage therefore keeps an energy surplus
  // instead of silently draining its visible energy stock.
  const upkeep = Math.min(
    upkeepDemand,
    safeProduct(energyProduction, ECONOMY_CONFIG.maxUpkeepShare),
  );
  const biomassProduction = safeProduct(
    Math.max(0, energyProduction - upkeep),
    ECONOMY_CONFIG.baseGrowthEfficiency,
    0.35 + biomassGrowthShare * 1.3,
    1 + Math.log1p(state.upgradeLevels.glycolysis) * 0.16,
    healthProductionFactor,
  );
  const nutrientStockRate = Math.max(0, safeAdd(nutrientIncome, -nutrientUse));
  const energyStockRate = Math.max(0, safeAdd(energyProduction, -upkeep));
  const growthInvestmentShare = Math.min(
    ECONOMY_CONFIG.maxGrowthInvestmentShare,
    0.35 + biomassGrowthShare,
  );
  const intendedGrowthInvestmentRate = safeProduct(biomassProduction, growthInvestmentShare);
  const biomassStockRate = Math.max(0, safeAdd(biomassProduction, -intendedGrowthInvestmentRate));
  const lineageExpansionRate =
    state.phase === "lineage"
      ? safeProduct(
          state.cellMass,
          ECONOMY_CONFIG.lineageExpansionPerMass,
          0.65 + biomassGrowthShare,
          upgradeEffect(state.upgradeLevels.transporters, 0.12),
          upgradeEffect(state.upgradeLevels.glycolysis, 0.16),
          immuneResilience,
        )
      : 0;
  const effectiveImmunePressure = Math.max(
    0,
    state.immunePressure -
      immuneEvasionShare * 8 -
      Math.log1p(state.upgradeLevels.immune_cloak) * 5,
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
  const multiplier = safeProduct(ECONOMY_CONFIG.upgradeCostGrowth ** level);
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
  };
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
  const { nutrientUptakeShare, biomassGrowthShare } = METABOLIC_PROFILE;
  const immuneResilience = immuneResilienceMultiplier(state.upgradeLevels.immune_cloak);
  const nutrientAccess = safeProduct(
    0.55 + nutrientUptakeShare * 1.125,
    upgradeEffect(state.upgradeLevels.transporters, 0.36),
    1 + Math.log1p(state.upgradeLevels.angiogenesis) * 0.2,
    immuneResilience,
  );
  const nutrientGain = safeProduct(8, nutrientAccess);
  const energyGain = safeProduct(
    nutrientGain,
    0.55,
    upgradeEffect(state.upgradeLevels.glycolysis, 0.3),
    immuneResilience,
  );
  // The default is 0.995 biomass per click, preserving the intended clicker cadence.
  const biomassGain = safeProduct(
    0.75 + biomassGrowthShare * 0.7,
    1 + Math.log1p(state.upgradeLevels.glycolysis) * 0.18,
    immuneResilience,
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

  // Resource deltas use the snapshot visible to the player before this tick.
  // This makes the published per-second rates the exact passive stock deltas.
  const economy = calculateEconomySnapshot(state);
  const elapsedSeconds = safeAdd(state.elapsedSeconds, deltaSeconds);
  const bloodFlow = safeAdd(
    1,
    Math.sin(elapsedSeconds * 0.65) * 0.16,
    Math.log1p(state.upgradeLevels.angiogenesis) * 0.22,
  );
  const flowingState: SimulationState = { ...state, elapsedSeconds, bloodFlow };
  const growthInvestment = safeProduct(
    economy.biomassProduction - economy.biomassStockRate,
    deltaSeconds,
  );
  const investedBiomass = Math.max(0, growthInvestment);
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
    biomass: finiteNonNegative(
      safeAdd(state.resources.biomass, safeProduct(economy.biomassStockRate, deltaSeconds)),
      "biomass",
    ),
  };
  return {
    ...threatenedState,
    tick: asGameTick(Math.min(NUMBER_CAP, state.tick + 1)),
    resources,
    hostControl,
    lineageExpansion: safeAdd(state.lineageExpansion, lineageGain),
    phase,
    cellHealth,
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
      -METABOLIC_PROFILE.immuneEvasionShare * 13,
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
    METABOLIC_PROFILE.immuneEvasionShare * 0.55,
    Math.log1p(state.upgradeLevels.immune_cloak) * 0.2,
  );
  return clamp(
    safeAdd(state.cellHealth, safeProduct(recovery - immuneDamage, deltaSeconds)),
    ECONOMY_CONFIG.minimumCellHealth,
    100,
  );
}

function upgradeEffect(level: number, perLogLevel: number): number {
  validateUpgradeLevel(level);
  return safeAdd(1, Math.log1p(level) * perLogLevel);
}

/**
 * Diminishing resource-capture benefit from immune evasion. It is exactly one
 * at level zero and asymptotically approaches a modest 1.18 multiplier.
 */
function immuneResilienceMultiplier(level: number): number {
  validateUpgradeLevel(level);
  const logarithmicProgress = Math.log1p(level);
  return safeAdd(1, safeProduct(0.18, logarithmicProgress / (1 + logarithmicProgress)));
}

function validateUpgradeLevel(level: number): void {
  if (!Number.isSafeInteger(level) || level < 0) {
    throw new Error("Upgrade levels must be non-negative safe integers.");
  }
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
