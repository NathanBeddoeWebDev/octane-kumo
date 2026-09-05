# Octane Kumo port

## Target

The first stable release targets the non-chart high-level Kumo catalog
while replacing React implementation dependencies with Octane-native
packages and renderer code. Compatibility means preserving names, compound
APIs, principal props and variants, semantic tokens, accessibility, and
observable behavior where practical. Octane-native events, refs, and element
types are intentional API adaptations.

Chart, SankeyChart, and TimeseriesChart are deferred at user request until needed.
They are excluded from current parity and release scope, not treated as passing
or silently replaced with React wrappers. Their oracle sources remain pinned.

Raw primitive subpaths are exported only when an Octane-native primitive exists.
ReactCompat is reserved for an optional `octane-kumo/react` emergency subpath;
anything under it is explicitly not native or verified.

## Package mapping

| Kumo dependency or surface                   | Native target                                           |
| -------------------------------------------- | ------------------------------------------------------- |
| Supported `@base-ui/react` families          | `@octanejs/base-ui`                                     |
| Autocomplete, Combobox, Select, Toolbar gaps | `@octanejs/aria/components` adapters                    |
| `@phosphor-icons/react`                      | `@octanejs/phosphor-icons`                              |
| `motion/react`                               | `@octanejs/motion`                                      |
| `react-day-picker`                           | `@octanejs/day-picker`, behind a Kumo v9-to-v10 adapter |
| ECharts, d3-geo, Shiki                       | Keep framework-neutral cores; port renderer glue        |
| Astro React islands                          | `@octanejs/astro` and package-as-consumer native demos  |

Package selection follows behavioral fit rather than the lineage of Kumo's
React dependency.

## Delivery order

1. **Foundation:** source package/compiler, provenance and audit records,
   styles, Button/Loader/Tooltip, SSR/hydration, and package contracts.
2. **Direct Base UI mappings:** simple display, form, and overlay components
   whose native primitive families already exist.
3. **Adapter mappings:** Select, Combobox, Autocomplete, and Toolbar on the
   native ARIA collection model, preserving Kumo's generic and multiple-value
   behavior.
4. **Renderer-owned integrations:** date picking, motion, charts, maps, and
   syntax highlighting without React wrappers.
5. **Complex composites:** CommandPalette, Sidebar, Flow, pagination, and the
   remaining compound components.
6. **Consumer proof:** port the Astro catalog to consume `octane-kumo` through
   package exports and exercise keyboard/focus, controlled and uncontrolled
   states, SSR, hydration, themes, and representative visual states.
7. **Stable release:** close the high-level export ledger, document accepted
   divergences, prove no React in native chunks, then remove the React oracle.

Incremental npm alpha releases may be cut from coherent verified slices. Stable
is blocked on the in-scope catalog and parity ledger; deferring charts does not
waive any acceptance gate for the native components.

## Component acceptance

A component can move from `adapted-unverified` to `verified` only when all
applicable evidence exists:

- public exports, compound members, props, defaults, and variants;
- keyboard, focus, accessibility, and controlled/uncontrolled behavior;
- representative light, dark, disabled, loading, open, error, and compact
  visual states;
- server rendering, hydration adoption, and post-hydration interaction;
- package-as-consumer import and type checks;
- no React implementation dependency in its native module graph;
- any intentional divergence recorded in the audit.

Internal DOM structure may differ when the observable contract remains intact.
The pinned React package is the oracle until these gates are closed.
