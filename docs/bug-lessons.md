# Bug lessons

## Preserve composition contracts and evidence boundaries

- **Symptom:** Polymorphic components accepted element descriptors but not render callbacks, and composed elements lost handlers, style precedence, or one of their refs. A compact Banner also treated unrelated components named `Link` as Kumo links.
- **Root cause:** Local render-merging and name-based detection approximated contracts already owned by Base UI and the source component identity.
- **Prevention:** Use Octane Base UI's `useRender` composition engine, test callback and descriptor forms with both refs/handlers/styles, and use exact component identity when the React oracle does. Audit claims must name only behavior exercised by their cited evidence.

## Reserve optional arguments before compiler hook slots

- **Symptom:** Flow parallel branches emitted an invalid `data-flow-id` warning and omitted their DOM registration IDs.
- **Root cause:** The compiler appended a hook-slot symbol to `useNode(nodeProps)`, occupying the custom hook's optional `id` parameter instead of following it.
- **Prevention:** Pass `undefined` explicitly for omitted custom-hook arguments before the appended slot. Check generated code when a hook receives an unexpected symbol, and assert registration attributes as well as visible geometry.
