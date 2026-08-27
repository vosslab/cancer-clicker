import { asGameTick } from "./brands";
import { DEFAULT_ALLOCATION, INITIAL_UPGRADE_LEVELS } from "./constants";
import type { SimulationState } from "./types/simulation";

export function createInitialState(): SimulationState {
  const initialState: SimulationState = {
    tick: asGameTick(0),
    elapsedSeconds: 0,
    status: "ready",
    phase: "host",
    resources: {
      nutrients: 42,
      energy: 48,
      biomass: 20,
    },
    allocation: { ...DEFAULT_ALLOCATION },
    upgradeLevels: { ...INITIAL_UPGRADE_LEVELS },
    cellMass: 10,
    hostControl: 1,
    lineageExpansion: 0,
    cellHealth: 100,
    immunePressure: 8,
    bloodFlow: 1,
    recentEvents: ["A transformed cell awakens in a nutrient-rich tissue pocket."],
  };

  return initialState;
}
