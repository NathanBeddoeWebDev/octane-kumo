# Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelog entries.

## When is a changeset required?

| Package                     | Changeset Required?                        | Why                                                   |
| --------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| `packages/kumo/`            | **Yes** (enforced by pre-push)             | Published to npm as `@cloudflare/kumo`                |
| `packages/octane-kumo/`     | **Yes** (enforced by pre-push)             | Published to npm as `octane-kumo`                     |
| `packages/kumo-docs-astro/` | Optional (version used for `/api/version`) | Not published, but version exposed in docs site build |

The pre-push hook enforces changesets for both publishable packages.

### How `pnpm changeset version` works

When you run `pnpm changeset version`, it processes **all packages** in the monorepo (not just kumo), so:

- It will bump `kumo-docs-astro` version if included in a changeset
- The docs version appears at `/api/version` as `docsVersion` (for debugging deployed builds)
- No automated tooling depends on the docs version number being "correct"

## Creating a changeset

```bash
pnpm changeset
```

Then:

- Select the package(s) you changed
- Choose the appropriate bump type (patch/minor/major)
- Write a short description of why the change matters

Commit the generated `.md` file in this folder.

## Why this file exists

If `.changeset/config.json` is missing, `pnpm changeset` fails with an `ENOENT` error. Keeping the config committed prevents that.
