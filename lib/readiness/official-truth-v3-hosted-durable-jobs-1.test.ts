// Mandatory only after Root integrates accepted prerequisites into the PG17 selector.
// No optional prerequisite/environment skip. This file must never use the old Core/PG16 route.
import { test } from 'node:test'
import { runHostedDurableJobsNative } from '../../scripts/db/official-truth-v3-hosted-durable-jobs-1/native'

test('HM04 mandatory native: finite durable jobs, full S1/MA1 authority, original uncertainty and terminal ownership',
  { timeout: 300000, concurrency: 2 }, runHostedDurableJobsNative)
