// lib/server/providers/core/index.ts
//
// Production entry for later server adapters. Next treats `server-only` as a
// compile-time client-bundle boundary. node:test cannot load this file.

import 'server-only'

export * from '@/lib/server/providers/core/exports'
