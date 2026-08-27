export type GameTick = number & { readonly __brand: "GameTick" };

export type SimulationStatus = "ready" | "running" | "paused";

/** The colony begins inside one host and becomes an immortal lineage at takeover. */
export type ColonyPhase = "host" | "lineage";

export type AllocationId = "uptake" | "growth" | "evasion";

export type MetabolicAllocation = Readonly<Record<AllocationId, number>>;

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
  allocation: MetabolicAllocation;
  upgradeLevels: UpgradeLevels;
  cellMass: number;
  hostControl: number;
  lineageExpansion: number;
  cellHealth: number;
  immunePressure: number;
  bloodFlow: number;
  recentEvents: readonly string[];
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
  nutrientIncome: number;
  energyProduction: number;
  upkeep: number;
  biomassProduction: number;
  immuneDamage: number;
}>;
