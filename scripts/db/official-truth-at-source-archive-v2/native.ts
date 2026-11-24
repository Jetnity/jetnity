import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { findLocalPgBins, startLocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'

export function runAtSourceArchiveNativePg17(): void {
 const cluster=startLocalProofCluster()
 try {
  assert.match(cluster.version, /PostgreSQL\) 17|PostgreSQL 17/)
  const bin=findLocalPgBins()
  assert.ok(bin)
  const result=execFileSync(bin.psql,[
   '-X','--no-psqlrc','-h',cluster.socket,'-p',String(cluster.port),
   '-U',cluster.user,'-d',cluster.database,'-v','ON_ERROR_STOP=1',
   '-f',fileURLToPath(new URL('native-archive-pg17-rollback.sql',import.meta.url)),
  ],{encoding:'utf8',timeout:45_000,maxBuffer:131072})
  assert.match(result,/AT_CH_SOURCE_ARCHIVE_PG17_APPEND_ONLY_TTL_NEGATIVE_PASS/)
  assert.match(result,/AT_CH_SOURCE_ARCHIVE_PG17_ROLLBACK_PASS/)
 } finally {
  cluster.stop()
 }
}
