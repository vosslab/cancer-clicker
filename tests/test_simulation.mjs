import assert from "node:assert/strict";
import test from "node:test";

import { ECONOMY_CONFIG, SIMULATION_STEP_SECONDS } from "../src/constants.ts";
import { createInitialState } from "../src/game_state.ts";
import {
  advanceSimulation,
  calculateEconomySnapshot,
  calculateUpgradeCost,
  canPurchaseUpgrade,
  harvestNutrientBurst,
  purchaseUpgrade,
  setSimulationStatus,
} from "../src/simulation.ts";

function advanceMany(state, steps) {
  let nextState = state;
  for (let step = 0; step < steps; step += 1) {
    nextState = advanceSimulation(nextState, 1);
  }
  return nextState;
}

test("simulation is deterministic for identical endless colony transitions", () => {
  function simulateColony() {
    let state = setSimulationStatus(createInitialState(), "running");
    state = harvestNutrientBurst(state);
    state = purchaseUpgrade(state, "transporters");
    return advanceMany(state, 10);
  }

  assert.deepEqual(simulateColony(), simulateColony());
});

test("a running click gives a useful biomass harvest while ready clicks are inert", () => {
  const ready = createInitialState();
  const running = setSimulationStatus(ready, "running");
  const harvested = harvestNutrientBurst(running);
  const biomassGain = harvested.resources.biomass - running.resources.biomass;

  assert.equal(harvestNutrientBurst(ready), ready);
  assert.ok(biomassGain >= 0.8 && biomassGain <= 1.2);
});

test("each mutation improves its relevant click, passive, or survival economy", () => {
  const running = setSimulationStatus(createInitialState(), "running");
  const adapted = {
    ...running,
    upgradeLevels: {
      transporters: 1,
      glycolysis: 1,
      angiogenesis: 1,
      immune_cloak: 1,
    },
  };
  const baseHarvest = harvestNutrientBurst(running);
  const adaptedHarvest = harvestNutrientBurst(adapted);

  assert.ok(adaptedHarvest.resources.nutrients > baseHarvest.resources.nutrients);
  assert.ok(adaptedHarvest.resources.energy > baseHarvest.resources.energy);
  assert.ok(
    calculateEconomySnapshot({ ...adapted, immunePressure: 70 }).immuneDamage <
      calculateEconomySnapshot({ ...running, immunePressure: 70 }).immuneDamage,
  );

  const cloaklessLineage = {
    ...running,
    phase: "lineage",
    hostControl: 100,
    cellMass: 1_200,
  };
  const cloakedLineage = {
    ...cloaklessLineage,
    upgradeLevels: { ...cloaklessLineage.upgradeLevels, immune_cloak: 1 },
  };
  const cloaklessHarvest = harvestNutrientBurst(cloaklessLineage);
  const cloakedHarvest = harvestNutrientBurst(cloakedLineage);
  const cloaklessEconomy = calculateEconomySnapshot(cloaklessLineage);
  const cloakedEconomy = calculateEconomySnapshot(cloakedLineage);

  for (const resource of ["nutrients", "energy", "biomass"]) {
    assert.ok(cloakedHarvest.resources[resource] > cloaklessHarvest.resources[resource]);
  }
  for (const rate of ["nutrientStockRate", "energyStockRate", "biomassStockRate"]) {
    assert.ok(cloakedEconomy[rate] > cloaklessEconomy[rate]);
  }
  assert.ok(cloakedEconomy.lineageExpansionRate > cloaklessEconomy.lineageExpansionRate);
});

test("host takeover changes to the endless lineage phase once and keeps running", () => {
  const nearTakeover = {
    ...setSimulationStatus(createInitialState(), "running"),
    cellMass: 5_000,
    hostControl: 99.9,
  };
  const takeover = advanceSimulation(nearTakeover, 1);
  const continuing = advanceSimulation(takeover, 1);

  assert.equal(takeover.phase, "lineage");
  assert.equal(takeover.status, "running");
  assert.ok(continuing.lineageExpansion > takeover.lineageExpansion);
});

test("immune stress reaches a durable health floor instead of ending the clicker", () => {
  const stressed = {
    ...setSimulationStatus(createInitialState(), "running"),
    cellMass: 50_000,
    immunePressure: 100,
  };
  const enduring = advanceMany(stressed, 400);

  assert.equal(enduring.status, "running");
  assert.ok(enduring.cellHealth >= ECONOMY_CONFIG.minimumCellHealth);
});

test("the mutation shop has uncapped, increasing upgrades", () => {
  let colony = {
    ...createInitialState(),
    resources: {
      nutrients: Number.MAX_SAFE_INTEGER,
      energy: Number.MAX_SAFE_INTEGER,
      biomass: Number.MAX_SAFE_INTEGER,
    },
  };
  const costs = [];
  for (let purchase = 0; purchase < 12; purchase += 1) {
    costs.push(calculateUpgradeCost("transporters", colony.upgradeLevels.transporters));
    assert.equal(canPurchaseUpgrade(colony, "transporters"), true);
    colony = purchaseUpgrade(colony, "transporters");
  }

  assert.ok(colony.upgradeLevels.transporters > 3);
  assert.ok(costs.every((cost, index) => index === 0 || cost.biomass > costs[index - 1].biomass));
});

test("mutation recipes debit only their declared resource ingredients", () => {
  const abundant = {
    ...createInitialState(),
    resources: { nutrients: 1_000, energy: 1_000, biomass: 1_000 },
  };
  const recipes = {
    transporters: ["biomass"],
    glycolysis: ["nutrients"],
    angiogenesis: ["energy"],
    immune_cloak: ["energy", "biomass"],
  };

  for (const [upgradeId, ingredients] of Object.entries(recipes)) {
    const cost = calculateUpgradeCost(upgradeId, 0);
    const purchased = purchaseUpgrade(abundant, upgradeId);
    for (const resource of ["nutrients", "energy", "biomass"]) {
      const spent = abundant.resources[resource] - purchased.resources[resource];
      if (ingredients.includes(resource)) {
        assert.ok(cost[resource] > 0);
        assert.equal(spent, cost[resource]);
      } else {
        assert.equal(cost[resource], 0);
        assert.equal(spent, 0);
      }
    }
  }
});

test("published passive rates exactly predict a fixed normal running tick", () => {
  const running = setSimulationStatus(createInitialState(), "running");
  const economy = calculateEconomySnapshot(running);
  const advanced = advanceSimulation(running, SIMULATION_STEP_SECONDS);
  const rateByResource = {
    nutrients: economy.nutrientStockRate,
    energy: economy.energyStockRate,
    biomass: economy.biomassStockRate,
  };

  for (const resource of ["nutrients", "energy", "biomass"]) {
    const expectedDelta = rateByResource[resource] * SIMULATION_STEP_SECONDS;
    const actualDelta = advanced.resources[resource] - running.resources[resource];
    const floatingPointTolerance =
      Number.EPSILON *
      Math.max(
        1,
        Math.abs(running.resources[resource]),
        Math.abs(advanced.resources[resource]),
        Math.abs(expectedDelta),
      );
    assert.ok(
      Math.abs(actualDelta - expectedDelta) <= floatingPointTolerance,
      `${resource} stock delta must match its published passive rate before the tick`,
    );
  }
});

test("published passive resource rates remain finite and never create a visible debt", () => {
  const initialEconomy = calculateEconomySnapshot(createInitialState());
  const stressed = {
    ...setSimulationStatus(createInitialState(), "running"),
    cellMass: 5_000_000,
  };
  const stressedEconomy = calculateEconomySnapshot(stressed);

  for (const economy of [initialEconomy, stressedEconomy]) {
    for (const rate of [
      economy.nutrientStockRate,
      economy.energyStockRate,
      economy.biomassStockRate,
    ]) {
      assert.ok(Number.isFinite(rate));
      assert.ok(rate >= 0);
    }
  }

  const advanced = advanceSimulation(stressed, 1);
  for (const resource of ["nutrients", "energy", "biomass"]) {
    assert.ok(advanced.resources[resource] >= stressed.resources[resource]);
  }
});

test("lineage expansion is dormant before takeover and accelerates after it", () => {
  const host = setSimulationStatus(createInitialState(), "running");
  const lineage = {
    ...host,
    phase: "lineage",
    hostControl: 100,
    cellMass: 1_200,
  };

  assert.equal(calculateEconomySnapshot(host).lineageExpansionRate, 0);
  assert.ok(calculateEconomySnapshot(lineage).lineageExpansionRate > 0);
});

test("simulation and upgrade calculations reject invalid inputs", () => {
  const initial = createInitialState();

  assert.throws(() => advanceSimulation(initial, -1), /finite and non-negative/);
  assert.throws(() => advanceSimulation(initial, Number.NaN), /finite and non-negative/);
  assert.throws(() => calculateUpgradeCost("transporters", -1), /non-negative safe integers/);
});
