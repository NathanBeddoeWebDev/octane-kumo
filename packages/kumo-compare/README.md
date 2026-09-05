# Kumo comparison workbench

A separate Astro app for comparing the pinned React implementation with the
Octane-native port. The existing `kumo-docs-astro` app and both libraries remain
unchanged. Charts are intentionally deferred.

From the workspace root (Node 24+, pnpm):

```sh
pnpm install
pnpm --filter kumo-compare dev
```

Open <http://127.0.0.1:4322/>. Choose one of the 14 shared scenario groups, switch
light/dark mode, select a preview width, or reset both examples. State is
independent on each side; changing the theme or width preserves it. Theme and
width are kept in the URL across sidebar navigation. Fixed-width previews scroll
inside their panels when the available space is narrower. “Open alone” opens a
preview in a full browser viewport, keeping the theme.

## How comparison works

- Astro provides the static shell and routes; `@astrojs/react` and
  `@octanejs/astro` mount actual `client:only` islands.
- Each runtime lives in its own iframe document so CSS, focus traps, portals,
  and demo state cannot interfere with the other preview.
- `scripts/examples.mjs` generates both islands from
  `packages/octane-kumo/tests/parity/fixture.tsx`. It removes the harness mount,
  passes the scenario as a prop, and substitutes renderer imports. For React it
  also erases the native-only `CommandPalette.Results<string>` type argument;
  the emitted JSX is unchanged. Generated files are ignored. Dev, build, and
  typecheck regenerate them; fixture edits regenerate them during development.
- React resolves to the pinned workspace source through Vite aliases, not a
  potentially stale `dist` build. Both frames use the port’s pinned standalone
  Kumo CSS. This is not a published-package resolution test.
- Vite deduplicates both runtimes. TypeScript resolves Octane through the app’s
  installation too, avoiding nominal type conflicts from pnpm optional-peer
  variants. Renderer include/exclude patterns keep React and Octane compilation
  disjoint.

This is an interactive comparison tool, **not an automated parity verdict or an
SSR/hydration test**. The scenario notes distinguish known shared defects from
intentional native adaptations. For the deeper differential audit, use
`pnpm --filter octane-kumo test:parity` and the reports under
`packages/octane-kumo/audit/`.

## Verification

```sh
pnpm --filter kumo-compare typecheck
pnpm --filter kumo-compare build
pnpm --filter kumo-compare test
```

The browser test uses installed Playwright Chromium, starts a temporary Astro
preview server against `dist`, and shuts it down afterwards. It checks all 14
groups in both runtimes/themes, state isolation, reset, selection, dialogs,
responsive sizing, navigation, and standalone preview. Screenshots are written
to a temporary directory printed at completion. It checks the workbench, not
every component behavior covered by the separate parity audit.

To test an already-running dev server instead:

```sh
COMPARE_URL=http://127.0.0.1:4322 pnpm --filter kumo-compare test
```

The dev-server run currently fails the strict console-error check on React’s
nested-`li` warning in the pinned Flow parallel-node example. All workbench
interaction assertions pass. Production React does not emit this development
diagnostic, so the built-page run passes. Neither the reference fixture nor the
warning is suppressed by this app.

Build warnings about raw `@theme` directives originate in the pinned stylesheet
that accompanies its already-compiled standalone CSS. The all-component fixture
and syntax highlighter also produce a large-chunk warning. These do not prevent
the static build; this workbench prioritizes matching audit examples over a
production documentation bundle.
