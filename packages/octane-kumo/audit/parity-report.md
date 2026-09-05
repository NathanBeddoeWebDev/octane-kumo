# React-to-Octane parity report

Date: 2026-09-05. Oracle: pinned `@cloudflare/kumo@2.13.1`.

**Verdict: non-chart coverage is broad, but parity is not clean.** No component
is promoted to `verified` by this audit. Charts are deferred until needed, not
counted as passing or missing from the current acceptance scope. The original
audit below records the pre-repair baseline; this follow-up repairs its confirmed
Octane compatibility gaps without copying shared oracle defects.

## Compatibility follow-up — 2026-09-05

- Restored root `cn`/`safeRandomId`, all five legacy input subpath exports, and
  element/callback `render` composition on Input and InputGroup.Input. Native
  runtime and packed-consumer tests cover the restored API.
- Select now has a stable field-label relationship rather than naming itself
  from its selected value. Explicit ARIA names are honored, including external
  labels, and the spacing grid lives on the actual field container.
- Reproduced the previously intermittent Select failure with alternating rapid
  keyboard cycles. Aria updated its focused key before its passive DOM-focus
  effect; Enter could reach the old option. A native bubbling wrapper now flushes
  the navigation commit and synchronously focuses Aria's roving option. It does
  not reimplement selection, disable initial autofocus, or add a sleep.
- Removed Flow's extra line-height class: node heights, positions and connector
  geometry now match. Switch uses the semantic fill/interact tokens for its off
  track and a block flex wrapper, restoring the light off-state fill and 21px
  field extent. Dark/checked Switch palette differences remain a deliberate
  semantic-token adaptation, not a claim of literal palette parity.

The full follow-up run (`kumo-parity-V0ecqe`) executed **84 browser runs and 162
interaction checks: 150 passed, 12 failed**. The failures are exclusively the
six shared Tooltip semantic checks and six React-only command expectations.
All native-only interaction failures are closed in this matrix, including 20
rapid Home/End/arrow-and-Enter cycles per renderer/profile (120 total).

All 12 Select/Flow screenshot pairs (closed/open Select, horizontal/vertical Flow,
light/dark/mobile) have zero pixelmatch differences at threshold 0.1. Nine are
also byte-identical after PNG decoding; the three open Select captures have
minor sub-threshold rasterization differences. Representative mobile forms,
checked Switch, dark open Select and dark vertical Flow captures were inspected. The
follow-up sets browser color-scheme preference as well as the theme attribute;
the original audit set only the attribute. Seven raw probe differences remain:
three Select hidden-control text artifacts, three Switch line-height property
differences without an extent difference, and the dark Switch semantic fill.
The remaining three callback/geometry differences are the command scenario.
Raw accessibility trees still differ in Radio/Switch ordering/naming and Combobox
button naming; Select's own accessible name now matches exactly.

The full native suite passes **257/257 tests in 43 files** with
`pnpm --filter octane-kumo exec vp test run --maxWorkers=2`, including hydration,
packed-consumer typing, React-free bundle checks, and unchanged stylesheet hashes.
The default-concurrency run hit the existing 5-second Button SSR timeout (256/257);
the lower-concurrency rerun kept that timeout unchanged. Native typecheck and
standard repository lint pass. An expanded lint run over the entire selection
test file still reports two pre-existing unbound-method diagnostics in filter
tests; the compatibility changes do not alter those lines.

The strict diagnostic still exits 1 for shared failures, adaptations and other
pixel differences. Nothing is allowlisted to manufacture a passing parity gate.
Shared Tooltip semantics and bare legacy-calendar overflow remain outside this
compatibility repair, and safer native command disabled-item handling is retained.

## Evidence and reproduction

```sh
pnpm --filter octane-kumo test:parity
pnpm --filter octane-kumo test:parity selection # focused repeat
pnpm --filter octane-kumo typecheck
pnpm --filter octane-kumo test
```

The runner compiles the same JSX fixture separately for React and Octane. Only
renderer imports and package resolution change between lanes. Both load the
native standalone stylesheet, whose upstream CSS copies have byte-for-byte
provenance checks. The React oracle and component implementations were not edited.

There are 14 scenarios: display, forms, selection, navigation, overlays, table,
delete, command, flow, date, legacy-date, feedback, code, and shell. Each runs in
Chromium at desktop 1000×900 light/dark and mobile 390×844 light, in separate
browser contexts with the same locale, timezone, and reduced-motion preference.

The full evidence run produced:

| Measurement                               | Result                                                                            |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| Browser scenario runs                     | 84 (42 per renderer)                                                              |
| Interaction assertions                    | 156: 143 passed, 13 failed                                                        |
| Runs containing failed assertions         | 10                                                                                |
| Computed probe property differences       | 18 across 9 scenario/profile pairs                                                |
| Different callback/geometry observations  | 7 scenario/profile pairs                                                          |
| Different initial accessibility snapshots | 6 scenario/profile pairs                                                          |
| Actual screenshot pairs                   | 66: 40 comparator matches, 25 with pixel differences, 1 with different dimensions |
| React-only failure screenshots            | 6 (command checks passed in Octane)                                               |
| Initial page overflow                     | Legacy DateRangePicker on mobile, in both renderers                               |

The raw runner summary calls all 72 React screenshot comparison records
`screenshotPairs`, and counts the six missing counterparts among its 32
`differentScreenshots`. Those six are failure evidence, not six additional visual
regressions. Pixel comparisons use pixelmatch threshold 0.1; even tiny differences
remain reported. Initial accessibility snapshots are raw, not normalized trees.

The full-run artifact directory ends in `kumo-parity-nFVoDt`; the focused Select
repeat ends in `kumo-parity-OHUrR4`. The runner prints their temporary absolute
paths and writes `results.json`, screenshots and pixel diffs there. These local
artifacts are not shipped with the package. Set `PARITY_OUTPUT` to an empty
directory to retain a new run at a chosen location. Exit code 1 is intentional
while differences or failed expectations remain; this is not an allowlisted CI
green gate.

## Confirmed port gaps

The [static API audit](./parity-api.md) compared all 52 non-chart component
entries and three providers, root/subpath exports, compound members, 76 common
Props types, and 82 variant/default constants. High-level component presence,
compound members, and variant/default value sets matched. It found:

1. **Missing root utilities:** `cn` and `safeRandomId` are absent from the native
   root API.
2. **Incomplete legacy input subpath:** `InputGroup`, its two variant constants,
   and two deprecated types are missing from `components/input`, although the
   component exists at the root and its dedicated subpath.
3. **Missing input composition prop:** native `Input` and `InputGroup.Input`
   omit the React `render` contract. Native event/ref differences are intentional;
   this omission is not a documented adaptation.

The browser lane adds:

4. **Select accessible name duplication:** React exposes `Environment`; Octane
   exposes `Production Environment Environment`. The native trigger combines
   its selected value, self-label and field label in `aria-labelledby`.
5. **Visible styling drift:** Select's label-to-control gap is 8px smaller in
   Octane (57px versus 65px probe height). Switch's off-state fill differs, with
   a 23px versus 21px wrapper extent. Flow nodes are 37px rather than 33px high;
   its vertical end node consequently starts at y303 rather than y291. Flow's
   node widths and branch topology match, and inspected dark screenshots show
   readable labels and connected branches. Native default nodes add `text-base`,
   unlike the oracle's inherited line-height. These are reviewable visual gaps,
   not evidence that the routing algorithm is broken.

## Shared issues, adaptations, and uncertainty

- **Tooltip semantic failure, both renderers:** all six overlay runs visibly
  opened the tooltip on focus, but no `role="tooltip"` was exposed. Captured
  trigger HTML also lacks `aria-describedby`. This is six of the 13 failed
  assertions, not an Octane-only keyboard-opening regression. ClipboardText's
  separate tooltip workaround does not repair the general Tooltip component.
- **Command disabled-item divergence:** all three React runs failed ordinary
  and modifier-Enter expectations (six assertions). With the fixture's unfiltered
  `getSelectableItems`, ArrowDown highlights `Disabled`; Enter does not activate
  it, but Ctrl+Enter selects `Disabled:new-tab`. Octane skips to `Deploy` and
  passes both checks. Preserve the safer native behavior unless review of the
  callback contract establishes a different requirement; do not reproduce an
  undesirable oracle behavior merely to achieve equal output.
- **Intermittent Select keyboard result:** one Octane mobile run returned `none`
  rather than `staging` after End/Enter. An unchanged focused repeat passed all
  18 selection assertions across six runs, while reproducing the name/spacing
  differences. This is unresolved timing/focus sensitivity, not a proven fix or
  a consistently reproduced component defect. The diagnostic uses some fixed
  waits, so harness timing remains a possible cause.
- **Legacy DateRangePicker mobile overflow is shared:** both render the same
  wide two-month calendar when placed directly in the narrow fixture. The
  component-specific preview previously tested an outer scrolling container;
  that does not establish that the bare component is intrinsically responsive.
- **Not every raw difference is a bug:** Select's clipped internal form control
  adds text to `innerText` without displaying duplicate options. Radio group
  naming is stronger in Octane; Switch DOM ordering differs without changing
  its visible label arrangement. Toast typography/spacing changes are documented
  adaptations. Loading animation/rasterization can produce very small pixel
  differences. Open command/confirmation screenshots also differ and remain
  review evidence rather than silently accepted pixel parity.

## Coverage limits and next slice

Passing checks exercise editing, checkbox/switch/radio keys, collection filtering
and commitment, tab selection, toolbar focus, disclosure, dialog/popover dismissal,
menu action/focus return, pagination, deletion confirmation, command filtering,
Flow orientation, date selection, clipboard/highlight copying, toast display, and
Sidebar opening/action. Legacy DateRangePicker is render-only in this lane.

This is representative coverage, not every variant, event reason, compound
composition, controlled transition, locale, touch gesture, portal target, or
browser engine. SSR/hydration and packed-consumer coverage remain in the native
suite, not a React differential SSR lane. Browser bundling of the React fixture
is not a React TypeScript consumer check. Initial overflow measurements do not
prove that every open state is overflow-free.

The native suite passed all 250 tests in 43 files when rerun without concurrent
browser work, including stylesheet hashes, hydration, and package-consumer checks.
An earlier overlapping run timed out in the existing Button SSR test (249/250);
no timeout was increased to obtain the passing result. Native typecheck, repository
lint, and the focused parity-fixture lint also passed. These checks validate the
audit addition and existing native contracts, not full React parity.

The next repair slice should restore compatibility exports and input composition,
then correct Select naming/spacing and isolate its intermittent keyboard case.
Review Switch/Flow visual drift and fix shared Tooltip semantics separately.
Do not port charts or weaken the remaining non-chart acceptance gates to make
this report green.
