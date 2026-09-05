import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { preview } from "astro";
import { chromium } from "playwright";
import { catalog } from "../src/catalog.ts";

// Test built static pages by default. COMPARE_URL can target the dev server.
const server = process.env.COMPARE_URL
  ? undefined
  : await preview({
      root: fileURLToPath(new URL("../", import.meta.url)),
      server: { host: "127.0.0.1", port: 0 },
    });
const base = process.env.COMPARE_URL ?? `http://127.0.0.1:${server.port}`;
const artifacts = await mkdtemp(join(tmpdir(), "kumo-compare-"));
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  page.setDefaultTimeout(15_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const frames = ["react", "octane"].map((runtime) =>
    page.frameLocator(`#${runtime}`),
  );
  async function ready() {
    for (const frame of frames) {
      await frame.locator("main[data-ready] output[data-result]").waitFor();
    }
  }
  async function open(scenario) {
    await page.goto(`${base}/compare/${scenario}/`);
    await ready();
  }
  async function capture(name) {
    await page.screenshot({
      path: join(artifacts, `${name}.png`),
      fullPage: true,
      animations: "disabled",
    });
  }

  await page.goto(base);
  await page.waitForURL("**/compare/selection/**");
  await ready();
  assert.equal(await page.locator("nav a").count(), catalog.length);
  for (const { id } of catalog) {
    await open(id);
    for (const mode of ["light", "dark"]) {
      await page.getByLabel("Theme", { exact: true }).selectOption(mode);
      for (const frame of frames) {
        assert.equal(
          await frame.locator("html").getAttribute("data-mode"),
          mode,
        );
        assert.equal(
          await frame.locator("astro-island").getAttribute("ssr"),
          null,
        );
        assert.ok(
          (await frame.locator("main").innerText()).length > 60,
          `${id} rendered`,
        );
      }
    }
    console.log(`✓ ${id}: both runtimes, light + dark`);
  }

  await open("forms");
  await frames[0]
    .getByLabel("Worker name", { exact: true })
    .fill("react-worker");
  await frames[0]
    .locator("output")
    .filter({ hasText: '"value":"react-worker"' })
    .waitFor();
  assert.equal(
    await frames[1].getByLabel("Worker name", { exact: true }).inputValue(),
    "",
  );
  await frames[1]
    .getByLabel("Worker name", { exact: true })
    .fill("octane-worker");
  await frames[1]
    .locator("output")
    .filter({ hasText: '"value":"octane-worker"' })
    .waitFor();
  assert.equal(
    await frames[0].getByLabel("Worker name", { exact: true }).inputValue(),
    "react-worker",
  );
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  assert.equal(
    await frames[1].getByLabel("Worker name", { exact: true }).inputValue(),
    "octane-worker",
  );
  await page.getByRole("button", { name: "Reset both previews" }).click();
  for (const frame of frames) {
    await frame.locator("output").filter({ hasText: '"value":""' }).waitFor();
    assert.equal(
      await frame.getByLabel("Worker name", { exact: true }).inputValue(),
      "",
    );
    assert.equal(await frame.locator("html").getAttribute("data-mode"), "dark");
  }
  await capture("forms-dark");
  for (const frame of frames) {
    await frame.locator("output").scrollIntoViewIfNeeded();
    assert.ok(await frame.locator("output").isVisible());
  }
  await capture("forms-dark-scrolled");

  await open("selection");
  for (const frame of frames) {
    await frame.getByRole("combobox", { name: "Environment" }).click();
    await frame.getByRole("option", { name: "Staging", exact: true }).click();
    await frame
      .locator("output")
      .filter({ hasText: '"selected":"staging"' })
      .waitFor();
  }
  await capture("selection-light");

  await open("overlays");
  for (const frame of frames) {
    await frame
      .getByRole("button", { name: "Open dialog", exact: true })
      .click();
    await frame.getByRole("dialog", { name: "Review deployment" }).waitFor();
  }
  await capture("dialogs-light");
  for (const frame of frames) {
    await frame
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await frame.getByRole("dialog").waitFor({ state: "hidden" });
  }

  await page.getByLabel("Preview width").selectOption("768");
  assert.equal((await page.locator("#octane").boundingBox()).width, 768);
  await page.getByLabel("Preview width").selectOption("390");
  assert.equal((await page.locator("#react").boundingBox()).width, 390);
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  await page
    .getByRole("link", { name: "Select & search", exact: true })
    .click();
  await ready();
  assert.equal(await page.getByLabel("Preview width").inputValue(), "390");
  assert.equal(
    await page.getByLabel("Theme", { exact: true }).inputValue(),
    "dark",
  );
  assert.match(
    await page.locator("[data-preview-link]").first().getAttribute("href"),
    /mode=dark/,
  );
  await page.reload();
  await ready();
  assert.equal(
    await page.getByLabel("Theme", { exact: true }).inputValue(),
    "dark",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("mobile-dark");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "No page-level horizontal overflow",
  );
  // Fixed-width previews scroll inside the panel; fluid previews fit the phone.
  await page.getByLabel("Preview width").selectOption("fluid");
  assert.ok((await page.locator("#react").boundingBox()).width < 390);
  await capture("mobile-fluid-dark");

  const standalone = await browser.newPage();
  await standalone.goto(`${base}/preview/octane/selection/?mode=dark`);
  await standalone.locator("main[data-ready]").waitFor();
  assert.equal(
    await standalone.locator("html").getAttribute("data-mode"),
    "dark",
  );
  await standalone.close();
  assert.deepEqual(errors, [], "No browser errors");
  console.log(
    `✓ isolation, reset, selection, dialogs, width, navigation, theme persistence, mobile, standalone\nScreenshots: ${artifacts}`,
  );
} finally {
  await browser?.close();
  await server?.stop();
}
