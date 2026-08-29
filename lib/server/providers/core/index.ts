// lib/server/providers/core/index.ts
//
// Production entry. `import 'server-only'` is also on every runtime module so
// alternate paths (`exports`, `executor`, `http`, …) cannot bypass the guard.
// node:test loads a local stub via scripts/server-only-test-register.mjs.

import 'server-only'

export * from '@/lib/server/providers/core/exports'
