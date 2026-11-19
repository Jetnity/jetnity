#!/usr/bin/env node
// Explicit, manual Dev-only source-pair audit. Reads at most ONE immutable
// stored original + one later source body; NEVER prints URLs or raw text.
// No API model, new key, database mutation, scheduling, production or owner
// authority. Uses Jetnity's existing Supabase Management token/ref.
// Example:
//   node --import tsx scripts/official-truth-source-text-diff-dev-v1/run-dev.ts \
//     --entwicklung --familie SIX --ziel TH --quelle thai-tdac

import { ziel } from '../auth/ziel'
import { runSql } from '../db/sql.mjs'
import { reviewDevSourceDiff } from '@/lib/readiness/official-truth-source-text-diff-dev-worker-v1'
import {
  OFFICIAL_SOURCE_DIFF_DEV_REF,
  readSelection,
  parseOnePrivateRow,
  sourcePairReadSql,
} from './read-pair'

export function parseArguments(args: readonly string[]): ReturnType<typeof readSelection> {
  if(args.length!==7 || args[0]!=='--entwicklung' || args[1]!=='--familie' ||
     args[3]!=='--ziel' || args[5]!=='--quelle')return null
  return readSelection({
    sourceFamily:args[2],destinationCode:args[4],sourceKey:args[6],
  })
}

async function main() {
  const selected=parseArguments(process.argv.slice(2))
  if(!selected || process.env.SUPABASE_PROJECT_REF!==OFFICIAL_SOURCE_DIFF_DEV_REF) {
    process.stdout.write('{"status":"blocked","reason":"DEV_EXACT_TARGET_REQUIRED"}\n')
    process.exitCode=1
    return
  }
  // A project ref alone is not an authorization. Confirm via existing
  // management API that it is a Development *branch*, not a project.
  try {
    const verified=await ziel()
    if(verified.ref!==OFFICIAL_SOURCE_DIFF_DEV_REF)throw new Error('wrong dev branch')
  } catch {
    process.stdout.write('{"status":"blocked","reason":"DEV_BRANCH_AUTHORIZATION_FAILED"}\n')
    process.exitCode=1
    return
  }

  const sql=sourcePairReadSql(selected)
  if(!sql) {
    process.stdout.write('{"status":"blocked","reason":"INVALID_SOURCE_SELECTION"}\n')
    process.exitCode=1
    return
  }

  const result=await reviewDevSourceDiff(selected,async () => {
    try {
      // This is the ONLY permitted database query. SELECT only, bounded
      // by exact registered source, audited schema, BG1, and 1-row LIMIT.
      // Never relay SQL errors (which might contain private data) to logs.
      const rows:unknown=await runSql(sql)
      return parseOnePrivateRow(rows,selected)
    } catch {
      return {status:'unavailable'}
    }
  })
  // The result has hashes and counts only. No original HTML, URLs, personal
  // data, model prompts, queries, connection strings, tokens or DB errors.
  process.stdout.write(JSON.stringify(result)+'\n')
  if(result.status==='blocked')process.exitCode=1
}

main().catch(() => {
  process.stdout.write('{"status":"blocked","reason":"DEV_REVIEW_FAILED"}\n')
  process.exitCode=1
})
