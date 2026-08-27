/**
 * Capture the Cancer Clicker README proof state from the production-shaped
 * static build. Run after `./build_github_pages.sh` while `dist/` is served:
 *
 * node tests/playwright/capture_readme.mjs http://localhost:8765/ /tmp/cancer_clicker_colony.png
 */
import { chromium } from "playwright";

const [targetUrl = "http://localhost:8765/", outputPath = "/tmp/cancer_clicker_colony.png"] =
  process.argv.slice(2);
const viewport = { width: 1280, height: 800 };
const mutationIds = ["transporters", "glycolysis", "angiogenesis", "immune_cloak"];

async function awakenAndEvolve(page) {
  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Awaken cell" }).click();
  await page.locator("#start-overlay").waitFor({ state: "hidden" });
  const harvestCell = page.getByRole("button", { name: "Harvest nutrients with the tumor cell" });

  // Visible UI clicks build an intentionally rich, reproducible colony state.
  await harvestCell.click({ clickCount: 360 });
  for (const id of mutationIds) {
    await page.locator(`[data-upgrade-id="${id}"]`).click();
  }
  await harvestCell.click({ clickCount: 360 });
  for (const id of mutationIds) {
    const button = page.locator(`[data-upgrade-id="${id}"]`);
    await button.scrollIntoViewIfNeeded();
    await button.click();
  }

  for (const id of mutationIds) {
    await page.locator(`#upgrade-${id}-level`).waitFor({ state: "visible" });
  }
  await page.waitForTimeout(350);
}

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    colorScheme: "dark",
    reducedMotion: "no-preference",
    viewport,
  });
  const page = await context.newPage();
  await awakenAndEvolve(page);

  for (const id of mutationIds) {
    const level = await page.locator(`#upgrade-${id}-level`).textContent();
    if (level !== "2") throw new Error(`${id} should be at level 2 for the documentation capture.`);
  }
  for (const selector of [
    "#cell-stage",
    "#management-console",
    "#nutrients-rate",
    "#energy-rate",
    "#biomass-rate",
  ]) {
    if (!(await page.locator(selector).isVisible())) {
      throw new Error(`${selector} should be visible in the documentation capture.`);
    }
  }
  await page.screenshot({ path: outputPath });
  await context.close();

  const reducedMotionContext = await browser.newContext({
    colorScheme: "dark",
    reducedMotion: "reduce",
    viewport,
  });
  const reducedMotionPage = await reducedMotionContext.newPage();
  await awakenAndEvolve(reducedMotionPage);
  for (const selector of ["#cell-stage", "#management-console", "#mutation-immune-cloak-art"]) {
    if (!(await reducedMotionPage.locator(selector).isVisible())) {
      throw new Error(`${selector} should remain visible with reduced motion.`);
    }
  }
  await reducedMotionContext.close();
} finally {
  await browser.close();
}
