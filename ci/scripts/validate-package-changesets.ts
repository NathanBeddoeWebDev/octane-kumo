#!/usr/bin/env tsx

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getNewlyAddedFiles,
  hasChangesInPath,
  isPullRequestContext,
  logPullRequestContext,
} from "../utils/git-operations";

const CHANGESET_DIR = ".changeset";

export interface VersionedPackage {
  name: string;
  path: string;
}

export interface ChangesetFile {
  name: string;
  packages: string[];
}

export const VERSIONED_PACKAGES: VersionedPackage[] = [
  { name: "@cloudflare/kumo", path: "packages/kumo" },
  { name: "octane-kumo", path: "packages/octane-kumo" },
];

function main() {
  console.log(
    `🔍 Validating changesets for: ${VERSIONED_PACKAGES.map(({ name }) => name).join(", ")}`,
  );

  const shouldValidate = isPullRequestContext() || isLocalContext();

  if (isPullRequestContext()) {
    logPullRequestContext();
  } else if (isLocalContext()) {
    console.log("Detected context: Local pre-push hook");
  }

  if (!shouldValidate) {
    console.log("Not a validation context, skipping changeset validation");
    return;
  }

  if (process.env.NO_CHANGESET_REQUIRED === "true") {
    console.log(
      "Detected no-changeset-required label; skipping changeset validation.",
    );
    return;
  }

  const headRef = process.env.GITHUB_HEAD_REF ?? "";
  if (headRef.startsWith("changeset-release/")) {
    console.log(
      `Detected Changesets release PR (branch: ${headRef}); skipping validation.`,
    );
    return;
  }

  console.log("Validating changesets...");

  const repositoryRoot = getRepositoryRoot();
  const changedPackages = VERSIONED_PACKAGES.filter((pkg) =>
    checkForPackageChanges(pkg, repositoryRoot),
  );

  if (changedPackages.length === 0) {
    console.log(
      "No changes detected in publishable packages, skipping changeset validation",
    );
    return;
  }

  console.log(
    `Changes detected in: ${changedPackages.map(({ path }) => path).join(", ")}`,
  );

  const newChangesets = getNewlyAddedChangesets(repositoryRoot);
  const missingPackages = findPackagesMissingChangesets(
    changedPackages,
    newChangesets,
  );

  if (missingPackages.length > 0) {
    reportValidationFailure(missingPackages, newChangesets);
    process.exit(1);
  }

  for (const pkg of changedPackages) {
    const packageChangesets = newChangesets.filter((changeset) =>
      changeset.packages.includes(pkg.name),
    );
    console.log(
      `✅ Found ${packageChangesets.length} NEW changeset(s) for ${pkg.name}:`,
    );
    for (const changeset of packageChangesets) {
      console.log(`   - ${changeset.name}`);
    }
  }

  console.log("Changeset validation passed!");
}

function getRepositoryRoot(): string {
  const cwd = process.cwd();
  if (existsSync(join(cwd, CHANGESET_DIR))) {
    return cwd;
  }

  const workspaceRoot = join(cwd, "../..");
  return existsSync(join(workspaceRoot, CHANGESET_DIR)) ? workspaceRoot : cwd;
}

function checkForPackageChanges(
  pkg: VersionedPackage,
  repositoryRoot: string,
): boolean {
  const result = hasChangesInPath(pkg.path, { cwd: repositoryRoot });

  if (result === null) {
    console.warn(
      `⚠️  Warning: Could not determine if ${pkg.name} changes exist, assuming they do`,
    );
    return true;
  }

  return result;
}

export function findPackagesMissingChangesets(
  changedPackages: VersionedPackage[],
  changesets: ChangesetFile[],
): VersionedPackage[] {
  return changedPackages.filter(
    (pkg) =>
      !changesets.some((changeset) => changeset.packages.includes(pkg.name)),
  );
}

function reportValidationFailure(
  missingPackages: VersionedPackage[],
  changesets: ChangesetFile[],
): void {
  if (process.env.CI) {
    console.error(
      "\x1b[0Ksection_start:" +
        Date.now() +
        ":changeset_error\r\x1b[0K\x1b[31;1m❌ CHANGESET VALIDATION FAILED\x1b[0m",
    );
  } else {
    console.error("\x1b[31;1m❌ CHANGESET VALIDATION FAILED\x1b[0m");
  }
  console.error("");

  if (changesets.length === 0) {
    console.error(
      "\x1b[31;1m❌ ERROR: Publishable package changes detected but no NEW changeset files found\x1b[0m",
    );
  } else {
    console.error(
      `\x1b[31;1m❌ ERROR: NEW changesets do not target: ${missingPackages.map(({ name }) => name).join(", ")}\x1b[0m`,
    );
    console.error("");
    console.error("New changesets found:");
    for (const changeset of changesets) {
      console.error(
        `   - ${changeset.name} (targets: ${changeset.packages.join(", ")})`,
      );
    }
  }

  console.error("");
  console.error("\x1b[33;1m📋 To fix this issue:\x1b[0m");
  console.error("   1. Run: \x1b[36mpnpm changeset\x1b[0m");
  console.error(
    `   2. Select: \x1b[36m${missingPackages.map(({ name }) => name).join(", ")}\x1b[0m`,
  );
  console.error("   3. Choose the appropriate change type (patch/minor/major)");
  console.error("   4. Write a clear description of your changes");
  console.error("   5. Commit the generated changeset file");
  console.error("");
  console.error(
    "This ensures proper versioning and changelog generation for publishable packages.",
  );
  console.error("");

  if (process.env.CI) {
    console.error(
      "\x1b[0Ksection_end:" + Date.now() + ":changeset_error\r\x1b[0K",
    );
  }
}

function getNewlyAddedChangesets(repositoryRoot: string): ChangesetFile[] {
  const newFiles = getNewlyAddedFiles(CHANGESET_DIR, { cwd: repositoryRoot });
  const changesets: ChangesetFile[] = [];

  for (const { status, path: filePath } of newFiles) {
    if (status !== "A") {
      continue;
    }

    const fileName = filePath.split("/").pop();
    if (
      !fileName ||
      fileName === "config.json" ||
      fileName === "README.md" ||
      fileName === "USAGE.md" ||
      !fileName.endsWith(".md")
    ) {
      continue;
    }

    try {
      const content = readFileSync(join(repositoryRoot, filePath), "utf8");
      changesets.push({
        name: fileName,
        packages: parseChangesetPackages(content),
      });
    } catch (error) {
      console.warn(
        `Warning: Could not parse changeset file ${fileName}: ${error}`,
      );
    }
  }

  return changesets;
}

export function parseChangesetPackages(content: string): string[] {
  const packages: string[] = [];
  let inFrontmatter = false;

  for (const line of content.split("\n")) {
    if (line.trim() === "---") {
      inFrontmatter = !inFrontmatter;
      continue;
    }

    if (inFrontmatter) {
      const match = line.match(
        /^["']?([^"':]+)["']?\s*:\s*(patch|minor|major)/,
      );
      if (match) {
        packages.push(match[1]);
      }
    }
  }

  return packages;
}

function isLocalContext(): boolean {
  return !process.env.CI;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
