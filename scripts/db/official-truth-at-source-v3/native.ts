import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { findLocalPgBins, startLocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'

export function runAtSourceV3NativePg17(): void {
 const cluster=startLocalProofCluster()
 try {
  assert.match(cluster.version, /PostgreSQL\) 17|PostgreSQL 17/)
  const bin=findLocalPgBins()
  assert.ok(bin)
  const result=execFileSync(bin.psql,[
   '-X','--no-psqlrc','-h',cluster.socket,'-p',String(cluster.port),
   '-U',cluster.user,'-d',cluster.database,'-v','ON_ERROR_STOP=1',
   '-f',fileURLToPath(new URL('native-pg17-rollback.sql',import.meta.url)),
  ],{encoding:'utf8',timeout:45_000,maxBuffer:131072})
  assert.match(result,/BMEIA_PG17_ALL_NEGATIVE_CASES_PASS/)
  assert.match(result,/BMEIA_PG17_ROLLBACK_PASS/)
 } finally {
  cluster.stop()
 }
}
