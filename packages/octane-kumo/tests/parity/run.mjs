import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createServer } from "vite-plus";
import { octane } from "octane/compiler/vite";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const packageRoot = resolve(import.meta.dirname, "../..");
const repo = resolve(packageRoot, "../..");
// Reuse the pinned oracle's existing browser tooling; do not install another lane.
const oracleRequire = createRequire(
  resolve(repo, "packages/kumo/package.json"),
);
const { chromium } = oracleRequire("playwright");
const output =
  process.env.PARITY_OUTPUT ??
  (await mkdtemp(resolve(tmpdir(), "kumo-parity-")));
await mkdir(output, { recursive: true });
assert.equal(
  (await readdir(output)).length,
  0,
  "PARITY_OUTPUT must be empty to avoid mixing evidence from different runs",
);
console.log(`Parity artifacts: ${output}`);

const scenarios =
  process.argv.length > 2
    ? process.argv.slice(2)
    : [
        "display",
        "forms",
        "selection",
        "navigation",
        "overlays",
        "table",
        "delete",
        "command",
        "flow",
        "date",
        "legacy-date",
        "feedback",
        "code",
        "shell",
      ];
const profiles = [
  { name: "light", mode: "light", width: 1000, height: 900 },
  { name: "dark", mode: "dark", width: 1000, height: 900 },
  { name: "mobile", mode: "light", width: 390, height: 844 },
];

async function start(runtime) {
  const react = runtime === "react";
  const aliases = [
    {
      find: /^octane-kumo$/,
      replacement: resolve(
        repo,
        `packages/${react ? "kumo" : "octane-kumo"}/src/index.ts`,
      ),
    },
  ];
  aliases.push({
    find: /^octane-kumo\/code$/,
    replacement: resolve(
      repo,
      `packages/${react ? "kumo" : "octane-kumo"}/src/code/index.ts`,
    ),
  });
  if (react) {
    for (const name of [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "use-sync-external-store/shim",
      "use-sync-external-store/shim/with-selector",
    ]) {
      aliases.push({
        find: new RegExp(`^${name}$`),
        replacement: oracleRequire.resolve(name),
      });
    }
  }
  const server = await createServer({
    configFile: false,
    root: packageRoot,
    logLevel: "error",
    cacheDir: resolve(output, `vite-${runtime}`),
    resolve: { alias: aliases },
    optimizeDeps: react
      ? {
          entries: [],
          include: [
            "react",
            "react-dom/client",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "use-sync-external-store/shim",
            "use-sync-external-store/shim/with-selector",
          ],
        }
      : { entries: ["tests/parity/index.html"] },
    plugins: react
      ? [
          {
            name: "react-parity-fixture",
            enforce: "pre",
            transform(code, id) {
              if (!id.endsWith("/tests/parity/fixture.tsx")) return;
              return code
                .replace("@jsxImportSource octane", "@jsxImportSource react")
                .replace(
                  'import { createRoot, useState } from "octane";',
                  'import { useState } from "react";\nimport { createRoot } from "react-dom/client";',
                );
            },
          },
        ]
      : [octane({ requireDirective: true })],
    server: { host: "127.0.0.1", port: 0 },
  });
  await server.listen();
  return server;
}

async function exercise(page, scenario, capture) {
  const observations = {};
  const steps = [];
  const result = async () =>
    JSON.parse(await page.locator("[data-result]").textContent());
  const step = async (name, action) => {
    try {
      observations[name] = await action();
      steps.push({ name, passed: true });
    } catch (error) {
      await capture(`failed-${name}`);
      steps.push({
        name,
        passed: false,
        error: error.message,
        accessibility: await page.locator("body").ariaSnapshot(),
        focused: await page.evaluate(() => document.activeElement?.outerHTML),
      });
    }
  };
  if (scenario === "display")
    await step("button-click", async () => {
      await page.getByRole("button", { name: "Deploy", exact: true }).click();
      const value = (await result()).selected;
      assert.equal(value, "clicked");
      return value;
    });
  if (scenario === "forms") {
    await step("input-edit", async () => {
      await page.getByLabel("Worker name", { exact: true }).fill("api-worker");
      const value = (await result()).value;
      assert.equal(value, "api-worker");
      return value;
    });
    await step("checkbox-space", async () => {
      const box = page.getByRole("checkbox", { name: "Notify" });
      await box.focus();
      await box.press("Space");
      const checked = (await result()).checked;
      assert.equal(checked, true);
      return checked;
    });
    await step("switch-space", async () => {
      const control = page.getByRole("switch", { name: "Enabled" });
      await control.focus();
      await control.press("Space");
      const checked = await control.getAttribute("aria-checked");
      assert.equal(checked, "true");
      await capture("switch-checked");
      return checked;
    });
    await step("radio-arrow", async () => {
      await page.getByRole("radio", { name: "Automatic" }).focus();
      await page.keyboard.press("ArrowDown");
      const checked = await page
        .getByRole("radio", { name: "Manual" })
        .getAttribute("aria-checked");
      assert.equal(checked, "true");
      return checked;
    });
  }
  if (scenario === "selection") {
    await step("select-keyboard", async () => {
      await page.getByRole("combobox", { name: "Environment" }).click();
      await page
        .getByRole("option", { name: "Staging", exact: true })
        .waitFor();
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(150);
      const value = (await result()).selected;
      assert.equal(value, "staging");
      return value;
    });
    await step("select-repeated-keyboard", async () => {
      const trigger = page.getByRole("combobox", {
        name: "Environment",
        exact: true,
      });
      for (let index = 0; index < 20; index++) {
        const expected = index % 2 === 0 ? "production" : "staging";
        await trigger.click();
        await page
          .getByRole("option", { name: "Staging", exact: true })
          .waitFor();
        await page.keyboard.press(
          ["Home", "End", "ArrowUp", "ArrowDown"][index % 4],
        );
        await page.keyboard.press("Enter");
        await page.waitForTimeout(150);
        assert.equal(
          (await result()).selected,
          expected,
          `Select cycle ${index + 1}`,
        );
        await page.getByRole("listbox").waitFor({ state: "hidden" });
      }
      await trigger.click();
      await page
        .getByRole("option", { name: "Staging", exact: true })
        .waitFor();
      await capture("select-open");
      await page.keyboard.press("Escape");
      await page.getByRole("listbox").waitFor({ state: "hidden" });
      return 20;
    });
    await step("autocomplete-filter-commit", async () => {
      const input = page.getByPlaceholder("Search countries");
      await input.fill("Can");
      await page.getByRole("option", { name: "Canada", exact: true }).click();
      await page.waitForTimeout(150);
      const value = await input.inputValue();
      assert.equal(value, "Canada");
      return value;
    });
    await step("combobox-filter-commit", async () => {
      await page.getByPlaceholder("Search languages").fill("Fre");
      await page.getByRole("option", { name: "French", exact: true }).click();
      const value = (await result()).selected;
      assert.equal(value, "French");
      return value;
    });
  }
  if (scenario === "navigation") {
    await step("tabs-click", async () => {
      await page.getByRole("tab", { name: "Analytics" }).click();
      const value = (await result()).selected;
      assert.equal(value, "analytics");
      return value;
    });
    await step("toolbar-disabled-focus", async () => {
      await page.getByRole("button", { name: "First tool" }).focus();
      await page.keyboard.press("ArrowRight");
      const disabled = await page.evaluate(
        () => document.activeElement.textContent,
      );
      assert.equal(disabled, "Disabled tool");
      await page.keyboard.press("ArrowRight");
      const text = await page.evaluate(
        () => document.activeElement.textContent,
      );
      assert.equal(text, "Last tool");
      return [disabled, text];
    });
    await step("disclosure", async () => {
      await page.getByRole("button", { name: "Details", exact: true }).click();
      const visible = await page
        .getByText("Deployment details", { exact: true })
        .isVisible();
      assert.equal(visible, true);
      return visible;
    });
  }
  if (scenario === "overlays") {
    await step("dialog-focus-escape", async () => {
      const trigger = page.getByRole("button", { name: "Open dialog" });
      await trigger.click();
      await page.getByRole("dialog").waitFor();
      await capture("dialog");
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      const focused = await trigger.evaluate(
        (el) => el === document.activeElement,
      );
      assert.equal(focused, true);
      return focused;
    });
    await step("popover-escape", async () => {
      await page.getByRole("button", { name: "Open popover" }).click();
      await page.getByText("Healthy", { exact: true }).waitFor();
      await capture("popover");
      await page.keyboard.press("Escape");
      await page
        .getByText("Healthy", { exact: true })
        .waitFor({ state: "hidden" });
      return true;
    });
    await step("menu-action", async () => {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("menuitem", { name: "Menu action" }).click();
      const value = (await result()).selected;
      assert.equal(value, "menu");
      await page.getByRole("menu").waitFor({ state: "hidden" });
      await page.waitForFunction(
        () => document.activeElement?.textContent === "Open menu",
      );
      return value;
    });
    await step("tooltip-role-and-description", async () => {
      await page.keyboard.press("Tab");
      const trigger = page.getByRole("button", { name: "Tooltip trigger" });
      await trigger.focus();
      await page.getByText("Tooltip content", { exact: true }).waitFor();
      assert.equal(
        await page.getByRole("tooltip").count(),
        1,
        "The visible tooltip must expose its role",
      );
      const description = await trigger.getAttribute("aria-describedby");
      assert.ok(
        description,
        "The trigger must reference its tooltip description",
      );
      const text = await page.getByRole("tooltip").textContent();
      assert.equal(text, "Tooltip content");
      await page.keyboard.press("Escape");
      return text;
    });
  }
  if (scenario === "table")
    await step("pagination-next", async () => {
      await page.getByRole("button", { name: /next page/i }).click();
      const value = (await result()).page;
      assert.equal(value, 2);
      return value;
    });
  if (scenario === "delete")
    await step("confirmation", async () => {
      await page.getByRole("button", { name: "Open delete" }).click();
      const button = page.getByRole("button", {
        name: "Delete Worker",
        exact: true,
      });
      assert.equal(await button.isDisabled(), true);
      const input = page.getByRole("textbox");
      await input.fill("wrong");
      assert.equal(await button.isDisabled(), true);
      await input.fill("edge-api");
      assert.equal(await button.isEnabled(), true);
      await capture("confirmed");
      await button.click();
      const value = (await result()).selected;
      assert.equal(value, "deleted");
      return value;
    });
  if (scenario === "command") {
    await step("command-navigation-enter", async () => {
      await page.getByRole("button", { name: "Open commands" }).click();
      const input = page.getByPlaceholder("Search commands");
      await input.waitFor();
      await page.waitForTimeout(250);
      await input.press("ArrowDown");
      await input.press("Enter");
      const value = (await result()).selected;
      await capture("selected");
      assert.equal(value, "Deploy");
      return value;
    });
    await step("command-modifier-enter", async () => {
      await page.getByPlaceholder("Search commands").press("Control+Enter");
      const value = (await result()).selected;
      assert.equal(value, "Deploy:new-tab");
      return value;
    });
    await step("command-filter-empty-escape", async () => {
      await page.getByPlaceholder("Search commands").fill("missing");
      await page.getByText("No results found", { exact: true }).waitFor();
      await capture("empty");
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      return true;
    });
  }
  if (scenario === "flow")
    await step("flow-layout", async () => {
      const geometry = async () =>
        page.locator("[data-node-id]").evaluateAll((nodes) =>
          nodes.map((node) => ({
            id: node.dataset.nodeId,
            x: Math.round(parseFloat(node.style.left)),
            y: Math.round(parseFloat(node.style.top)),
            width: Math.round(node.getBoundingClientRect().width),
            height: Math.round(node.getBoundingClientRect().height),
          })),
        );
      const horizontal = await geometry();
      assert.equal(horizontal.length, 5);
      await page.getByRole("button", { name: "Toggle orientation" }).click();
      await page.waitForTimeout(500);
      const vertical = await geometry();
      assert.ok(vertical.find((n) => n.id === "end").y > 0);
      await capture("vertical");
      return { horizontal, vertical };
    });
  if (scenario === "date")
    await step("date-selection", async () => {
      await page.getByRole("button", { name: /September 12th, 2024/ }).click();
      const value = (await result()).date;
      assert.equal(value, 12);
      return value;
    });
  if (scenario === "feedback") {
    await step("clipboard", async () => {
      await page.locator('[data-probe="ClipboardText"] button').first().click();
      const value = await page.evaluate(() => navigator.clipboard.readText());
      assert.equal(value, "copy-me");
      return value;
    });
    await step("toast", async () => {
      await page.getByRole("button", { name: "Show toast" }).click();
      await page.getByText("Deployment saved", { exact: true }).waitFor();
      await capture("toast");
      return true;
    });
  }
  if (scenario === "code")
    await step("highlight-copy", async () => {
      const block = page.locator('[data-probe="CodeHighlighted"]');
      await block.locator(".shiki").first().waitFor({ timeout: 10000 });
      await block.getByRole("button", { name: /copy/i }).click();
      const value = await page.evaluate(() => navigator.clipboard.readText());
      assert.equal(value, 'const value = "<safe>";');
      return value;
    });
  if (scenario === "shell")
    await step("sidebar-action", async () => {
      if (
        !(await page
          .getByRole("button", { name: "Workers", exact: true })
          .isVisible())
      )
        await page
          .getByRole("button", { name: "Toggle navigation", exact: true })
          .click();
      await page.getByRole("button", { name: "Workers", exact: true }).click();
      const value = (await result()).selected;
      assert.equal(value, "workers");
      return value;
    });
  return { observations, steps };
}

const servers = [];
let browser;
const runs = [];
try {
  for (const runtime of ["react", "octane"]) servers.push(await start(runtime));
  browser = await chromium.launch();
  for (const profile of profiles) {
    for (const scenario of scenarios) {
      for (const [index, runtime] of ["react", "octane"].entries()) {
        const context = await browser.newContext({
          viewport: { width: profile.width, height: profile.height },
          locale: "en-US",
          timezoneId: "UTC",
          colorScheme: profile.mode,
          permissions: ["clipboard-read", "clipboard-write"],
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        page.setDefaultTimeout(4000);
        const errors = [];
        page.on("pageerror", (error) => {
          errors.push(error.stack ?? error.message);
          console.error(
            `${runtime}/${scenario}: ${error.stack ?? error.message}`,
          );
        });
        const name = `${scenario}-${profile.name}-${runtime}`;
        const capture = async (state) => {
          await page.waitForTimeout(350);
          await page.screenshot({
            path: resolve(output, `${name}-${state}.png`),
            fullPage: true,
            animations: "disabled",
          });
        };
        const run = { scenario, profile: profile.name, runtime, errors };
        try {
          await page.goto(
            `${servers[index].resolvedUrls.local[0]}tests/parity/index.html?scenario=${scenario}&mode=${profile.mode}`,
            { timeout: 60000 },
          );
          if (errors.length) throw new Error(errors.join("\n"));
          await page.locator("[data-ready]").waitFor({ timeout: 10000 });
          await page.waitForTimeout(600);
          run.probes = await page
            .locator("[data-probe]")
            .evaluateAll((probes) =>
              Object.fromEntries(
                probes.map((probe) => {
                  // Compare visible content/extent, not renderer-specific wrappers or hidden form controls.
                  const visible = (element) =>
                    element.getBoundingClientRect().width > 1 &&
                    element.getBoundingClientRect().height > 1 &&
                    getComputedStyle(element).visibility !== "hidden" &&
                    getComputedStyle(element).opacity !== "0";
                  const controls = probe.querySelectorAll(
                    'input:not([type="hidden"]),textarea,[role="combobox"],[role="checkbox"],[role="radio"],[role="switch"],button,[role="meter"]',
                  );
                  const element =
                    Array.from(controls).find(visible) ??
                    Array.from(probe.children).find(visible) ??
                    probe;
                  const style = getComputedStyle(element),
                    rect = probe.getBoundingClientRect();
                  return [
                    probe.dataset.probe,
                    {
                      text: probe.innerText.replace(/\s+/g, " ").trim(),
                      fontSize: style.fontSize,
                      lineHeight: style.lineHeight,
                      color: style.color,
                      background: style.backgroundColor,
                      borderRadius: style.borderRadius,
                      width: Math.round(rect.width),
                      height: Math.round(rect.height),
                    },
                  ];
                }),
              ),
            );
          run.accessibility = await page.locator("main").ariaSnapshot();
          run.pageOverflow = await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          );
          await capture("initial");
          Object.assign(run, await exercise(page, scenario, capture));
        } catch (error) {
          run.failure = error.message;
        }
        console.log(
          `${name}: ${run.failure ? "FAILED" : `${run.steps?.filter((s) => s.passed).length}/${run.steps?.length} interaction checks`}`,
        );
        runs.push(run);
        await context.close();
      }
    }
  }
} finally {
  await browser?.close();
  await Promise.all(servers.map((server) => server.close()));
}

const comparisons = [];
for (const profile of profiles)
  for (const scenario of scenarios) {
    const react = runs.find(
      (r) =>
        r.runtime === "react" &&
        r.profile === profile.name &&
        r.scenario === scenario,
    );
    const native = runs.find(
      (r) =>
        r.runtime === "octane" &&
        r.profile === profile.name &&
        r.scenario === scenario,
    );
    if (!react || !native) continue;
    const differences = [];
    for (const name of new Set([
      ...Object.keys(react.probes ?? {}),
      ...Object.keys(native.probes ?? {}),
    ])) {
      for (const key of new Set([
        ...Object.keys(react.probes?.[name] ?? {}),
        ...Object.keys(native.probes?.[name] ?? {}),
      ])) {
        const a = react.probes?.[name]?.[key],
          b = native.probes?.[name]?.[key];
        if (a !== b)
          differences.push({ probe: name, property: key, react: a, octane: b });
      }
    }
    comparisons.push({
      scenario,
      profile: profile.name,
      renderDifferences: differences,
      accessibilityEqual: react.accessibility === native.accessibility,
      observationsEqual:
        JSON.stringify(react.observations) ===
        JSON.stringify(native.observations),
    });
  }
const failedRuns = runs.filter(
  (r) => r.failure || r.errors.length || r.steps?.some((s) => !s.passed),
);
const files = await readdir(output);
const screenshots = [];
for (const name of files.filter(
  (name) => name.includes("-react-") && name.endsWith(".png"),
)) {
  const nativeName = name.replace("-react-", "-octane-");
  if (!files.includes(nativeName)) {
    screenshots.push({ name, missing: nativeName });
    continue;
  }
  const a = PNG.sync.read(await readFile(resolve(output, name))),
    b = PNG.sync.read(await readFile(resolve(output, nativeName)));
  if (a.width !== b.width || a.height !== b.height) {
    screenshots.push({
      name,
      dimensions: { react: [a.width, a.height], octane: [b.width, b.height] },
    });
    continue;
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const pixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: 0.1,
  });
  const diffName = name.replace("-react-", "-diff-");
  if (pixels) await writeFile(resolve(output, diffName), PNG.sync.write(diff));
  screenshots.push({
    name,
    pixels,
    ratio: pixels / (a.width * a.height),
    ...(pixels ? { diff: diffName } : {}),
  });
}
const summary = {
  runCount: runs.length,
  interactionChecks: runs.flatMap((r) => r.steps ?? []).length,
  failedRuns: failedRuns.length,
  renderDifferences: comparisons.reduce(
    (n, c) => n + c.renderDifferences.length,
    0,
  ),
  differentObservations: comparisons.filter((c) => !c.observationsEqual).length,
  screenshotPairs: screenshots.length,
  differentScreenshots: screenshots.filter((s) => s.pixels !== 0).length,
};
await writeFile(
  resolve(output, "results.json"),
  JSON.stringify({ summary, comparisons, screenshots, runs }, null, 2) + "\n",
);
console.log(JSON.stringify(summary, null, 2));
console.log(`Evidence: ${output}/results.json`);
// Differences are findings, not blanket-accepted adaptations. This is a strict
// diagnostic lane; the report must triage them before claiming parity.
if (
  failedRuns.length ||
  summary.renderDifferences ||
  summary.differentObservations ||
  summary.differentScreenshots ||
  comparisons.some((c) => !c.accessibilityEqual)
)
  process.exitCode = 1;
