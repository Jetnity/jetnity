// Mandatory PG17 native proof. Root must explicitly route this wrapper to the
// required PG17 family before publication; no skip, fallback or alternate claim.
// SOURCE-V1 A1: 90s effect + existing 35s complete drain + 5s wrapper headroom.
import { test } from 'node:test'
import { runProfileAuthorityIntegrityNative } from '../../scripts/db/profile-authority-integrity-1/native'

test('PAI1 profile authority integrity: exact baseline, additive protection and actual Auth cascade',
  { timeout: 130_000 }, async t => { await runProfileAuthorityIntegrityNative(t) })
