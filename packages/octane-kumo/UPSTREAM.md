# Kumo upstream ledger

`octane-kumo` targets `@cloudflare/kumo@2.13.1` from
`https://github.com/cloudflare/kumo.git`.

| Package            | Version  | Tag                       | Commit                                     |
| ------------------ | -------- | ------------------------- | ------------------------------------------ |
| `@cloudflare/kumo` | `2.13.1` | `@cloudflare/kumo@2.13.1` | `2c1cbed3dba66208e43ee7c43ac624fb98c6f0f6` |

The annotated tag object is `81b944a50ede94e3ab9d87d58a90a834265c595e` and
peels to the commit above. The supported range is this exact release. Updating
the pin requires a new export crosswalk and parity audit.

## Source and test boundary

- Canonical package root: `packages/kumo`
- Canonical source root: `packages/kumo/src`
- Canonical component tests: `packages/kumo/src/**/*.test.{ts,tsx}`
- License: MIT
- React oracle: the unchanged `packages/kumo` package at the pinned commit

The React package remains in this repository as the migration oracle while the
native port is incomplete. It is not a runtime dependency of `octane-kumo`.

## Verification boundary

The pin and current export inventory are recorded, but broad behavioral parity
is unverified. A component becomes verified only after its public API,
interaction, accessibility, visual, SSR/hydration, and package-contract lanes
are represented in the audit. Presence in the native package records only that
an implementation exists.
