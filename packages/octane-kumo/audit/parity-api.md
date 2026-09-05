# Static public API parity audit

Audited against pinned React Kumo `2.13.1` / `2c1cbed3dba66208e43ee7c43ac624fb98c6f0f6` on 2026-09-05.

## Compatibility follow-up

The three omissions below are now repaired. The native root exports `cn` and
`safeRandomId`; `components/input` restores InputGroup, its variant constants,
and the deprecated aliases. `Input` and `InputGroup.Input` accept native element
and callback render composition through the existing BaseInput implementation.
Runtime tests exercise refs, handlers and state; the packed-consumer test compiles
root/subpath imports and both render forms. The counts, paths and findings below
describe the original audit baseline, not outstanding API gaps.

## Coverage and method

- Compared the TypeScript-checker exports of both root `src/index.ts` barrels (React: 270 symbols; Octane: 560), all 52 non-chart component entries in `audit/export-crosswalk.json`, and the three providers.
- Inspected all 44 component directories on each side, component subpath barrels, compound `Object.assign`/static-member declarations, and 41 matched public `KUMO_*_VARIANTS` / `KUMO_*_DEFAULT_VARIANTS` pairs (82 constants). Compared property sets for 76 common exported `*Props` types (79 upstream root prop types total), then read the reported differences directly to reject framework-noise and documented divergences.
- Excluded `Chart`, `SankeyChart`, `TimeseriesChart`, `ChartLegend`, maps, palettes and chart types; primitive subpaths; CLI/catalog surfaces; and blocks other than the intentionally root-exported `DeleteResource`. This is static source/API evidence, not runtime or browser evidence.

## Findings

### High — root utility exports were dropped

React's root exports `cn` and `safeRandomId` (`packages/kumo/src/index.ts:341-342`). Octane's root barrel ends with only link and portal utilities (`packages/octane-kumo/src/index.ts:45-46`), although Octane components still import `cn` internally. TypeScript export enumeration confirms both names are absent from `octane-kumo`.

This is a source-compatible import regression for consumers using `import { cn, safeRandomId } from "@cloudflare/kumo"`. Neither omission is listed as an accepted adaptation in `PORTING.md` or `status.json`.

### Medium — `components/input` compatibility surface is incomplete

The upstream input subpath deliberately re-exports `InputGroup`, `KUMO_INPUT_GROUP_VARIANTS`, and `KUMO_INPUT_GROUP_DEFAULT_VARIANTS`, plus deprecated `KumoInputGroupFocusMode` and `KumoInputGroupVariantsProps` (`packages/kumo/src/components/input/index.ts:4-30`). Octane's equivalent barrel exports only `input-area` and `input` (`packages/octane-kumo/src/components/input/index.ts:1-2`). Checker enumeration reproduces all five omissions.

`InputGroup` does exist at the Octane root and its dedicated component subpath, so this is specifically a backwards-compatible subpath regression—not a missing component—and has no documented adaptation.

### Medium — `Input` and `InputGroup.Input` no longer accept render composition

Upstream `InputProps` includes Base UI's `render` through `BaseInputProps` (`packages/kumo/src/components/input/input.tsx:258-269`). Octane instead intersects plain intrinsic input attributes (`packages/octane-kumo/src/components/input/input.tsx:121-131`), and checker comparison reports `render` as the only missing principal property on both `InputProps` and `InputGroupInputProps` after discounting native spelling/events/refs.

This is not one of the documented native event/ref/element adaptations. It prevents the established Kumo render-composition contract on these two input surfaces.

## Checked and accepted differences

- All 52 non-chart high-level component entries and all three providers are present. No missing compound member was found after direct inspection (including the nested `descriptorChildren(Object.assign(...))` construction used by Octane `InputGroup`).
- Root registry JSON typing exports (`ComponentRegistry`, `ComponentSchema`, etc.) are absent, but are a registry/AI-support surface rather than high-level component API and were not classified as a port regression here.
- DatePicker's v9/v10 prop removals, native events/refs/icons, collection adapter constraints, overlay hydration shells, Sidebar scroll-area fallback, and pagination corrections match the adaptations recorded in `status.json`.
- Variant/default value sets matched across the 41 public pairs. Differences found by initializer comparison were metadata or documented implementation styling: ClipboardText omits descriptions on non-exported constants; Switch says “brand color” rather than “brand blue”; Toast's native icon names and 14px/ring styling agree with `status.json`. None changes an accepted variant key or default.
- Octane intentionally exposes many additional types/constants through wildcard barrels; extras were not treated as parity failures.

## Reproduction commands

Run from repository root:

```sh
cat AGENTS.md packages/kumo/AGENTS.md packages/octane-kumo/PORTING.md \
  packages/octane-kumo/status.json packages/octane-kumo/audit/export-crosswalk.json
cat packages/kumo/src/index.ts packages/octane-kumo/src/index.ts
find packages/kumo/src/components packages/octane-kumo/src/components \
  -mindepth 2 -maxdepth 2 \( -name index.ts -o -name index.tsx \) -print
rg -n 'KUMO_.*(VARIANTS|DEFAULT_VARIANTS)|Object.assign|\.([A-Z][A-Za-z]+)\s*=' \
  packages/kumo/src/components packages/octane-kumo/src/components -g '*.ts' -g '*.tsx'
pnpm --filter octane-kumo typecheck
```

The symbol/property counts above were produced with the workspace `typescript` API (`createProgram`, `checker.getExportsOfModule`, and `checker.getPropertiesOfType`) against the two root barrels and each component barrel.
