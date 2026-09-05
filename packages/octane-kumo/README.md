# octane-kumo

An Octane-native port of Cloudflare's Kumo design system. The target is
observable compatibility with `@cloudflare/kumo@2.13.1`, expressed through
Octane's native component, ref, and event contracts.

This package is an early, source-published port. Its native surface currently
contains `Autocomplete`, `Badge`, `Banner`, `Breadcrumbs`, `Button`,
`CloudflareLogo`, `Code`, `CodeBlock`, `Combobox`, `DatePicker`, `DateRangePicker`, `Empty`, `Grid`, `Input`,
`InputArea`/`Textarea`, `InputGroup`, `Label`, `LayerCard`, `Link`, `Loader`,
`MenuBar`, `Meter`, `Pagination`, `Select`, `SensitiveInput`, `Sidebar`,
`SkeletonLine`, `Surface`, `Table`, `TableOfContents`, `Tabs`, `Text`, `Toolbar`, and
`Tooltip`; the complete `Collapsible`, `Dialog`, `DropdownMenu`, `Popover`,
`Checkbox`, `Switch`, and generic `Radio` families; the direct `RadioGroup`,
`RefreshButton`, `LinkButton`, and `PoweredByCloudflare` exports; and the native
link, tooltip, and portal providers.

```tsx
/** @jsxImportSource octane */
import { Button } from "octane-kumo";

export function SaveAction() {
  return <Button variant="primary">Save</Button>;
}
```

## Code display and syntax highlighting

The legacy `Code`, `Code.Block`, and `CodeBlock` exports render escaped plain
text, preserving Kumo's five language variants and styling metadata. As in the
pinned implementation, `Code.values` is accepted but does not interpolate.

Syntax highlighting lives only under `octane-kumo/code`; ordinary component
imports do not pull Shiki into their bundle. Engines, themes, and requested
grammars load asynchronously after mounting. Use a shared provider for multiple
blocks:

```tsx
/** @jsxImportSource octane */
import { ShikiProvider, CodeHighlighted } from "octane-kumo/code";

export function Example() {
  return (
    <ShikiProvider engine="javascript" languages={["ts", "bash"]}>
      <CodeHighlighted
        code={'const greeting = "Hello";\nconsole.log(greeting);'}
        lang="ts"
        showLineNumbers
        highlightLines={[2]}
        showCopyButton
      />
    </ShikiProvider>
  );
}
```

Both `javascript` and `wasm` engines use `github-light`/`vesper` themes, selected
by the existing `data-mode` styling. The 18 supported languages and aliases are
exported as types and `LANGUAGE_ALIASES`; `normalizeLanguage` rejects unknown
names. `useShikiHighlighter` exposes readiness, loading/error state, labels,
and a highlighting function. Unconfigured languages, loading, and failures
remain readable escaped text, including during SSR. Providers dispose engines
on replacement/unmount, including initialization that finishes late. Copy
buttons become visible on keyboard focus and copy the original source, with
provider/component labels and a cleaned-up two-second success timer.
Copy controls reserve their own space rather than overlaying multi-line source
on narrow screens; long lines scroll inside the remaining code viewport.

For build-time or server highlighting, import `highlightCode`,
`createServerHighlighter`, and `CodeBlock` from `octane-kumo/code/server`.
`highlightCode` creates and disposes a one-off engine; dispose reusable
highlighters yourself. Server utilities take canonical language names and
default to the JavaScript engine. The server `CodeBlock` takes **trusted HTML
produced by these helpers**, not arbitrary user HTML, and needs no provider.
It is distinct from the legacy root `CodeBlock`, which takes plain `code`.

Import `octane-kumo/styles/standalone` without Tailwind. Run
`pnpm --filter octane-kumo dev:visual` and open `/tests/visual/code.html` for
light/dark engines, line numbers/highlights, copy controls, fallback text, and
contained long-line scrolling.

## Date picking

`DatePicker` adapts `@octanejs/day-picker` to Kumo's six single/multiple/range
selection contracts, including required selection and the `onChange` callback
name. Pass `selected` with `onChange` for controlled selection; omitting the
callback enables engine-owned selection. As in the oracle, multiple selection
resets to the clicked date when adding beyond `max`.

Events, footer content, and custom components use native Octane contracts.
`DateRange` and the native `DayPickerProps` convenience type are also exported.
Month navigation, localization, disabled/hidden days, modifiers, dropdown
captions, and custom class names/components are forwarded to the native engine.
Outside days and month animations default to enabled, as in Kumo.

The adapter maps `initialFocus`, `fromMonth`/`toMonth`, and `fromYear`/`toYear` to
v10 focus/navigation props; modern props take precedence. The v10 engine no
longer accepts deprecated v8-era class/style keys, `components.Button`, or
`fromDate`/`toDate`. Use current class/style keys, specific button components,
and `hidden` matchers instead. Navigation bounds use `aria-disabled`, not the
native `disabled` attribute, and prevent navigation at the boundary.

The deprecated `DateRangePicker` preserves the two-month, internally owned
range API, all sizes/variants, preview, reset callbacks, and display-only
timezone footer. Month navigation is normalized to the first day to avoid
month-end skips; invalid month edits do not change the calendar. Selected dates
are local-midnight `Date` values. It remains a legacy tab-through button grid;
prefer `DatePicker mode="range"` for roving calendar keyboard navigation.

Import `octane-kumo/styles/standalone` without Tailwind, or the existing
`octane-kumo/styles/tailwind` entry alongside your Tailwind setup. The native
standalone entry composes the pinned utility and component styles, since the
pinned prebuilt utility sheet omits calendar rules. The source copies remain
byte-for-byte unchanged.

Open `/tests/visual/date-pickers.html` using `pnpm --filter octane-kumo dev:visual`
for light/dark, selected, disabled, dropdown, range, and legacy-size examples.
Legacy calendars initialize from the current local month; SSR clients and
servers must agree on the initial month and locale.

## Table and pagination

`Table` preserves the semantic compound API, layout and row variants, compact
and sticky headers/columns, selection checkboxes, and styled resize handle.
The caller owns row data, selection, paging, and any column resizing; no
data-grid engine is included.

`Pagination` preserves both the compound and deprecated legacy APIs. Pages
are caller-controlled through `page` and `setPage` (omitting `page` means 1),
not uncontrolled state. `Pagination.PageSize` uses the native Select and leaves
page resets to its `onChange` callback. Known totals support input or dropdown
page selection; `hasNextPage` supports sequential navigation for unknown totals.
Empty totals stay on page 1; invalid input drafts cannot emit non-finite or
fractional pages. These edge corrections are recorded in the audit.

Run `pnpm --filter octane-kumo dev:visual` and open
`/tests/visual/table-pagination.html` for selectable resource tables in light
and dark themes, automatic/fixed layouts, compact/sticky headers, both page
selectors, and unknown/empty totals.

## Native contract

- Event props receive native DOM events.
- Refs are passed through the `ref` prop; no `forwardRef` wrapper is used.
- Icons come from `@octanejs/phosphor-icons`, or may be Octane element
  descriptors.
- The main package has no React or ReactCompat implementation dependency.

## Current limits

Export presence is not a parity claim. Badge, Button, Collapsible, Empty,
Meter, SkeletonLine, Tooltip, Dialog, Popover, DropdownMenu, Select,
Autocomplete, Combobox, Input, InputArea, InputGroup, SensitiveInput, Checkbox,
Switch, Radio, DatePicker, DateRangePicker, Table, Pagination, Tabs, Toolbar, and MenuBar have native interaction and
SSR/hydration coverage; Label and Field associations are tested; a packed
external consumer is compiled; the native bundle graph is checked for React
imports; and representative light/dark states are rendered in a reproducible
fixture. Dialog, Popover, DropdownMenu, and selection popup states, navigation
controls, Collapsible opening, and Empty and SensitiveInput copy interactions
are manually exercised in that fixture. Broad differential parity and the rest
of the component catalog remain in progress. See
[`status.json`](./status.json),
[`audit/export-crosswalk.json`](./audit/export-crosswalk.json), and [`PORTING.md`](./PORTING.md)
for the exact boundary.
