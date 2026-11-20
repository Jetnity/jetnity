#!/usr/bin/env node
// Narrow, optional FR provenance recovery research. The archived French
// initial HTML is NOT substituted as an official first monitored version.
// This compares two actual later monitor observations only. No publications.
// Manual Dev only; NO additional HTTP, no data persistence, no AI/paid calls.
import { ziel } from '../auth/ziel'
import { runSql } from '../db/sql.mjs'
import { reviewDevSourceDiff } from '@/lib/readiness/official-truth-source-text-diff-dev-worker-v1'
import { OFFICIAL_SOURCE_DIFF_DEV_REF } from '../official-truth-source-text-diff-dev-v1/read-pair'
import {
  FR_LATER_SELECTION,
  FR_MONITORED_POST_ARCHIVE_SQL,
  parseFrMonitoredPostArchivePair,
} from './fr-later-pair'

const BLOCKED = '{"status":"blocked","reason":"DEV_SOURCE_PROVENANCE_REQUIRED"}\n'
async function run():Promise<void> {
  if(process.argv.length!==3 || process.argv[2]!=='--entwicklung' ||
     process.env.SUPABASE_PROJECT_REF!==OFFICIAL_SOURCE_DIFF_DEV_REF){
    process.stdout.write(BLOCKED)
    process.exitCode=1
    return
  }
  try {
    const dev=await ziel()
    if(dev.ref!==OFFICIAL_SOURCE_DIFF_DEV_REF)throw Error('Wrong branch')
  }catch {
    process.stdout.write(BLOCKED)
    process.exitCode=1
    return
  }
  const result=await reviewDevSourceDiff(FR_LATER_SELECTION,async()=>{
    try {
      const rows:unknown=await runSql(FR_MONITORED_POST_ARCHIVE_SQL)
      return parseFrMonitoredPostArchivePair(rows)
    }catch {return {status:'unavailable'} }
  })
  // Comparison output contains only neutral source hashes/counts. Explicitly
  // disambiguate its basis from the INVALID earlier archived French original.
  const safe=result.status==='research_only'
    ? Object.freeze({
      ...result,
      provenance:'TWO_VERIFIED_POST_MONITOR_OBSERVATIONS_ONLY' as const,
    })
    : result
  process.stdout.write(JSON.stringify(safe)+'\n')
  if(result.status==='blocked')process.exitCode=1
}
run().catch(()=>{
  process.stdout.write(BLOCKED)
  process.exitCode=1
})
