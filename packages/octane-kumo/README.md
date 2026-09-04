# octane-kumo

An Octane-native port of Cloudflare's Kumo design system. The target is
observable compatibility with `@cloudflare/kumo@2.13.1`, expressed through
Octane's native component, ref, and event contracts.

This package is an early, source-published port. Its native surface currently
contains `Button`, `RefreshButton`, `LinkButton`, `Loader`, `Tooltip`, `Label`,
`Field`, `Input`, `InputArea`/`Textarea`, `InputGroup`, `SensitiveInput`, and the
complete `Checkbox`, `Switch`, and generic `Radio` families (`Group`, `Item`,
and `Legend`), plus the direct `RadioGroup` export, `LinkProvider`,
`TooltipProvider`, and `KumoPortalProvider`.

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

Export presence is not a parity claim. Button, Tooltip, Input, InputArea,
InputGroup, SensitiveInput, Checkbox, Switch, and Radio have native interaction
and SSR/hydration coverage; Label and Field associations are tested; a packed
external consumer is compiled; the native bundle graph is checked for React
imports; and representative light/dark, validation, disabled, card,
transitioning, masked, and open-popup states are rendered in a reproducible
fixture. SensitiveInput reveal/copy interaction is manually exercised in that
fixture. Broad differential parity and the rest of the component catalog remain
in progress. See
[`status.json`](./status.json),
[`audit/export-crosswalk.json`](./audit/export-crosswalk.json), and [`PORTING.md`](./PORTING.md)
for the exact boundary.
