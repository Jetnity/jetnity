import { test } from 'node:test'
import { runHostedResultStoreNative } from '../../scripts/db/official-truth-v3-hosted-result-store-1/native'

test('HRS1: actual owned PG17 result custody, publication, expiry and recovery', { timeout: 240_000 }, runHostedResultStoreNative)
