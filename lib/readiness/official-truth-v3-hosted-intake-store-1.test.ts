// Mandatory owned PG17 proof; HMA1 CI prerequisite must be gated by Root first.
import { test } from 'node:test'
import { runHostedIntakeNative } from '../../scripts/db/official-truth-v3-hosted-intake-store-1/native'

test('HS1 hosted intake source: mandatory real non-superuser PostgreSQL17 proof',
  { timeout: 210_000 }, runHostedIntakeNative)
