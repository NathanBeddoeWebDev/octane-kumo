# Bug lessons

## Preserve composition contracts and evidence boundaries

- **Symptom:** Polymorphic components accepted element descriptors but not render callbacks, and composed elements lost handlers, style precedence, or one of their refs. A compact Banner also treated unrelated components named `Link` as Kumo links.
- **Root cause:** Local render-merging and name-based detection approximated contracts already owned by Base UI and the source component identity.
- **Prevention:** Use Octane Base UI's `useRender` composition engine, test callback and descriptor forms with both refs/handlers/styles, and use exact component identity when the React oracle does. Audit claims must name only behavior exercised by their cited evidence.

## Reserve optional arguments before compiler hook slots

- **Symptom:** Flow parallel branches emitted an invalid `data-flow-id` warning and omitted their DOM registration IDs.
- **Root cause:** The compiler appended a hook-slot symbol to `useNode(nodeProps)`, occupying the custom hook's optional `id` parameter instead of following it.
- **Prevention:** Pass `undefined` explicitly for omitted custom-hook arguments before the appended slot. Check generated code when a hook receives an unexpected symbol, and assert registration attributes as well as visible geometry.

## 2026-09-05 — Select navigation state preceded DOM focus

- **Affected area:** `packages/octane-kumo/src/components/select/select.tsx`, `SelectPopover`, with `@octanejs/aria@0.0.45`.
- **Symptom signature:** Pointer-open Select, then rapid Home/End and Enter, sometimes committed the previous option. Repeated alternating selections reproduced it across desktop and mobile; a visible option was not proof that navigation focus had settled.
- **Root cause:** Aria changed its roving focused key, then deferred DOM focus to a passive effect. Enter reached the old option before that effect ran. Captured key/focus traces showed Home keydown/keyup and Enter on Staging, followed by focus moving to Production too late.
- **Resolution:** A layout-transparent native wrapper receives navigation events after Aria, flushes the pending render, and focuses Aria's current roving option synchronously. Aria still owns navigation, disabled-item handling, selection, initial focus, and dismissal. Popover's public DOM prop forwarding did not deliver the key handler, so the wrapper is intentional.
- **Regression signal:** `pnpm --filter octane-kumo test:parity selection` records `select-repeated-keyboard`: 20 alternating Home/End/arrow-and-Enter cycles per renderer/profile, without a wait between navigation and activation. Inspect that step rather than the overall strict-diff exit code.
- **Prevention rule:** For composite widgets, test rapid navigation followed by activation against real DOM focus, not only focused-key state or popup visibility. Do not mask deferred-focus races with sleeps or replace the primitive's selection algorithm.
