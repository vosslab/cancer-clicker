export type GameTick = number & { readonly __brand: "GameTick" };

export type SimulationStatus = "ready" | "running";

/** The colony begins inside one host and becomes an immortal lineage at takeover. */
export type ColonyPhase = "host" | "lineage";

export type ResourceStock = Readonly<{
  nutrients: number;
  energy: number;
  biomass: number;
}>;

export type SimulationState = Readonly<{
  tick: GameTick;
  elapsedSeconds: number;
  status: SimulationStatus;
  phase: ColonyPhase;
  resources: ResourceStock;
  upgradeLevels: UpgradeLevels;
  cellMass: number;
  hostControl: number;
  lineageExpansion: number;
  cellHealth: number;
  immunePressure: number;
  bloodFlow: number;
}>;

export type UpgradeId = "transporters" | "glycolysis" | "angiogenesis" | "immune_cloak";

export type UpgradeLevels = Readonly<Record<UpgradeId, number>>;

export type ResourceCost = Readonly<{
  nutrients: number;
  energy: number;
  biomass: number;
}>;

export type UpgradeCosts = Readonly<Record<UpgradeId, ResourceCost>>;

export type UpgradeDefinition = Readonly<{
  name: string;
  summary: string;
  biologicalRole: string;
  baseCost: ResourceCost;
}>;

export type EconomySnapshot = Readonly<{
  /** Actual nonnegative nutrient stock change per running simulation second. */
  nutrientStockRate: number;
  /** Actual nonnegative ATP reserve change per running simulation second. */
  energyStockRate: number;
  /** Actual nonnegative biomass stockpile change per running simulation second. */
  biomassStockRate: number;
  /** Endless colony-spread gain per second; zero until host control is complete. */
  lineageExpansionRate: number;
  nutrientIncome: number;
  energyProduction: number;
  upkeep: number;
  biomassProduction: number;
  immuneDamage: number;
}>;
