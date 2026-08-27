import type { UpgradeDefinition, UpgradeId, UpgradeLevels } from "./types/simulation";

export const SIMULATION_STEP_SECONDS = 0.25;

/**
 * The colony's fixed metabolic profile keeps the simplified clicker economy
 * balanced without exposing an unused player allocation control.
 */
export const METABOLIC_PROFILE = {
  nutrientUptakeShare: 0.4,
  biomassGrowthShare: 0.35,
  immuneEvasionShare: 0.25,
} as const;

export const INITIAL_UPGRADE_LEVELS = {
  transporters: 0,
  glycolysis: 0,
  angiogenesis: 0,
  immune_cloak: 0,
} as const satisfies UpgradeLevels;

export const UPGRADE_CONFIG = {
  transporters: {
    name: "Membrane transporters",
    summary: "Pull more nutrients from the surrounding tissue.",
    biologicalRole: "More surface transport increases nutrient capture.",
    baseCost: { nutrients: 0, energy: 0, biomass: 14 },
  },
  glycolysis: {
    name: "Aerobic glycolysis",
    summary: "Turn each captured nutrient into energy faster.",
    biologicalRole: "Fast glycolysis favors rapid growth over efficiency.",
    baseCost: { nutrients: 55, energy: 0, biomass: 0 },
  },
  angiogenesis: {
    name: "Angiogenic signal",
    summary: "Recruit nearby vessels for a much richer nutrient supply.",
    biologicalRole: "New blood supply feeds growth but raises visibility.",
    baseCost: { nutrients: 0, energy: 80, biomass: 0 },
  },
  immune_cloak: {
    name: "Immune evasion",
    summary: "Reduce damage from the host immune response.",
    biologicalRole: "Evasion lowers effective immune pressure.",
    baseCost: { nutrients: 0, energy: 65, biomass: 35 },
  },
} as const satisfies Record<UpgradeId, UpgradeDefinition>;

export const ECONOMY_CONFIG = {
  baseNutrientIncome: 5.5,
  baseEnergyYield: 1.7,
  baseUpkeep: 0.8,
  massUpkeep: 0.018,
  baseGrowthEfficiency: 0.075,
  hostControlPerMass: 0.0055,
  immuneActivationMass: 18,
  immuneDamageThreshold: 46,
  takeoverHostControl: 100,
  minimumCellHealth: 12,
  lineageExpansionPerMass: 0.018,
} as const;
