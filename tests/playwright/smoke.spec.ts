import { expect, test, type Page } from "@playwright/test";

// Selector contract:
// - src/index.html: #start-overlay, #start-button, #cell-click-target,
//   #management-console, mutation art IDs, compact meter IDs, and
//   data-upgrade-id controls are the visible Cancer Clicker contract.
// - src/style.css: #app and #cell-stage retain the 16:10 visual frame contract.

function captureDiagnostics(page: Page): string[] {
  const diagnostics: string[] = [];
  page.on("pageerror", (error) => {
    diagnostics.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      diagnostics.push(`console: ${message.text()}`);
    }
  });
  return diagnostics;
}

async function outputValue(page: Page, selector: string): Promise<number> {
  return page.locator(selector).evaluate((element) => {
    if (!(element instanceof HTMLOutputElement)) {
      throw new Error(`${element.id} must be an output element.`);
    }
    return Number(element.value);
  });
}

async function startSimulation(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Awaken cell" }).click();
  await expect(page.locator("#start-overlay")).toBeHidden();
}

async function assetLoads(page: Page, selector: string): Promise<void> {
  await expect(page.locator(selector)).toBeVisible();
  await expect
    .poll(() =>
      page.locator(selector).evaluate((element) => {
        return element instanceof HTMLImageElement && element.naturalWidth > 0;
      }),
    )
    .toBe(true);
}

async function computedOpacity(page: Page, selector: string): Promise<number> {
  return page.locator(selector).evaluate((element) => Number(getComputedStyle(element).opacity));
}

test("smoke: Cancer Clicker keeps its mutation shop and cell evolution visible", async ({
  page,
}) => {
  const diagnostics = captureDiagnostics(page);
  await page.goto("/");

  await expect(page).toHaveTitle("Cancer Clicker");
  await expect(page.getByRole("heading", { name: "Cancer Clicker" }).first()).toBeVisible();
  await expect(page.locator("#management-console")).toBeVisible();
  await expect(page.locator("#management-toggle")).toHaveCount(0);
  await expect(page.locator("#management-close")).toHaveCount(0);
  await expect(page.locator("#host-control-value")).toBeVisible();
  await expect(page.locator("#cell-health-value")).toBeVisible();
  await expect(page.locator("#lineage-expansion")).toBeHidden();

  await startSimulation(page);
  await expect(page.locator("#pause-button")).toHaveCount(0);

  for (const selector of ["#nutrients-rate", "#energy-rate", "#biomass-rate"]) {
    await expect(page.locator(selector)).toBeVisible();
    await expect.poll(() => page.locator(selector).textContent()).toMatch(/^\+?(?!-).+\/s$/);
  }

  const nutrientsBeforePassiveGrowth = await outputValue(page, "#nutrients-value");
  await expect
    .poll(() => outputValue(page, "#nutrients-value"))
    .toBeGreaterThan(nutrientsBeforePassiveGrowth);

  const harvestCell = page.getByRole("button", { name: "Harvest nutrients with the tumor cell" });
  await expect(harvestCell).toBeVisible();
  const valuesBefore = await Promise.all(
    ["#nutrients-value", "#energy-value", "#biomass-value"].map((selector) =>
      outputValue(page, selector),
    ),
  );
  await harvestCell.click();
  const valuesAfter = await Promise.all(
    ["#nutrients-value", "#energy-value", "#biomass-value"].map((selector) =>
      outputValue(page, selector),
    ),
  );
  valuesAfter.forEach((value, index) => {
    expect(value).toBeGreaterThan(valuesBefore[index] ?? 0);
  });

  const mutationLayers = [
    { id: "transporters", art: "#mutation-transporters-art" },
    { id: "glycolysis", art: "#mutation-glycolysis-art" },
    { id: "angiogenesis", art: "#mutation-angiogenesis-art" },
    { id: "immune_cloak", art: "#mutation-immune-cloak-art" },
  ] as const;
  for (const mutation of mutationLayers) {
    await expect(page.locator(mutation.art)).toHaveAttribute("data-level", "0");
    expect(await computedOpacity(page, mutation.art)).toBe(0);
  }

  const transporterButton = page.locator("[data-upgrade-id='transporters']");
  await expect(transporterButton).toBeEnabled();
  await expect(transporterButton).toContainText("biomass");
  await expect(transporterButton).not.toContainText("energy");
  await expect(transporterButton).not.toContainText("nutrients");

  // Thirty real clicks earn each distinct resource needed for the four initial
  // recipes; no test-side state mutation bypasses the visible game loop.
  await harvestCell.click({ clickCount: 30 });

  for (const mutation of mutationLayers) {
    const button = page.locator(`[data-upgrade-id='${mutation.id}']`);
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.locator(`#upgrade-${mutation.id}-level`)).toHaveText("1");
    await expect(page.locator(mutation.art)).toHaveAttribute("data-level", "1");
    await expect.poll(() => computedOpacity(page, mutation.art)).toBeGreaterThan(0);
    await expect(button.locator("xpath=ancestor::article")).toHaveAttribute("data-owned", "true");
    await expect(page.locator("#mutation-feedback")).toBeVisible();
    await expect(page.locator("#mutation-feedback-title")).not.toHaveText("Surface evolved");
  }

  for (const selector of [
    "#mutation-glycolysis-art",
    "#mutation-angiogenesis-art",
    "#mutation-immune-cloak-art",
    ".colony-one",
    ".colony-two",
    ".colony-three",
    ".colony-four",
    "#immune-patrol-image",
    "#mutation-feedback img",
  ]) {
    await assetLoads(page, selector);
  }

  const cardBoxes = await Promise.all(
    ["nutrients", "energy", "biomass"].map(async (resource) => {
      const box = await page.locator(`.resource-${resource}`).boundingBox();
      if (box === null) {
        throw new Error(`${resource} resource card must have a visible bounding box.`);
      }
      return [resource, box] as const;
    }),
  );
  const cards = Object.fromEntries(cardBoxes);
  const nutrientsCard = cards["nutrients"];
  const energyCard = cards["energy"];
  const biomassCard = cards["biomass"];
  if (nutrientsCard === undefined || energyCard === undefined || biomassCard === undefined) {
    throw new Error("Each resource card must be visible.");
  }
  expect(nutrientsCard.x).toBeLessThan(energyCard.x);
  expect(energyCard.x).toBeLessThan(biomassCard.x);

  for (const selector of ["#app", "#cell-stage"]) {
    const geometry = await page.locator(selector).evaluate((element) => {
      const { height, width } = element.getBoundingClientRect();
      return { height, width };
    });
    expect(geometry.width / geometry.height).toBeCloseTo(1.6, 2);
  }
  await expect
    .poll(() =>
      page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth),
    )
    .toBe(false);
  expect(diagnostics).toEqual([]);
});

test("smoke: the always-open shop remains reachable on a phone", async ({ page }) => {
  const diagnostics = captureDiagnostics(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await startSimulation(page);
  const harvestCell = page.getByRole("button", { name: "Harvest nutrients with the tumor cell" });
  await expect(harvestCell).toBeVisible();
  const nutrientsBefore = await outputValue(page, "#nutrients-value");
  await harvestCell.click();
  expect(await outputValue(page, "#nutrients-value")).toBeGreaterThan(nutrientsBefore);

  const shop = page.locator("#management-console");
  await expect(shop).toBeVisible();
  const stageBox = await page.locator("#cell-stage").boundingBox();
  const shopBox = await shop.boundingBox();
  if (stageBox === null || shopBox === null) {
    throw new Error("The mobile stage and permanent shop must both be visible.");
  }
  expect(stageBox.width / stageBox.height).toBeCloseTo(1.6, 2);
  expect(shopBox.y).toBeGreaterThanOrEqual(stageBox.y + stageBox.height);
  const transporterButton = page.locator("[data-upgrade-id='transporters']");
  await transporterButton.scrollIntoViewIfNeeded();
  await expect(transporterButton).toBeEnabled();
  const buttonBox = await transporterButton.boundingBox();
  if (buttonBox === null) {
    throw new Error("The mobile transporter purchase target must have a bounding box.");
  }
  await transporterButton.click();
  await expect(page.locator("#upgrade-transporters-level")).toHaveText("1");
  await expect(page.locator("#mutation-feedback")).toBeVisible();
  await expect(page.locator("#mutation-feedback-title")).toHaveText("Transporter swarm");

  await expect
    .poll(() =>
      page.locator("html").evaluate((element) => element.scrollWidth > element.clientWidth),
    )
    .toBe(false);
  expect(diagnostics).toEqual([]);
});
