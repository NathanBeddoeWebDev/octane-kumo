# octane-kumo

An Octane-native port of Cloudflare's Kumo design system. The target is
observable compatibility with `@cloudflare/kumo@2.13.1`, expressed through
Octane's native component, ref, and event contracts.

This package is an early, source-published port. Its native surface currently
contains `Autocomplete`, `Badge`, `Banner`, `Breadcrumbs`, `Button`,
`CloudflareLogo`, `Combobox`, `Empty`, `Grid`, `Input`,
`InputArea`/`Textarea`, `InputGroup`, `Label`, `LayerCard`, `Link`, `Loader`,
`MenuBar`, `Meter`, `Select`, `SensitiveInput`, `Sidebar`,
`SkeletonLine`, `Surface`, `TableOfContents`, `Tabs`, `Text`, `Toolbar`, and
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
Switch, Radio, Tabs, Toolbar, and MenuBar have native interaction and
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
