// Owner-gated SQL **generator**, not an installer. No network or DB access.
// Emits one exact-commit transaction only after validating the canonical file
// using its original Git blob identity. This generator never executes SQL.
import { createHash } from 'node:crypto'
import { readFileSync, openSync, writeFileSync, closeSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const directory=dirname(fileURLToPath(import.meta.url))
const repository=resolve(directory,'../../..')
const migrationPath=resolve(repository,'supabase/migrations/20261113173644_saved_offers.sql')
export const MIGRATION_BLOB='667766f5455ff2460f4eb56f04c7a62c84ca9e05'
const fail=()=>{ throw Error('saved_offers_guard_package_refused') }
export function verifyMigrationBytes(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length<1000 || bytes.length>65536) fail()
  const source=Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])
  if (createHash('sha1').update(source).digest('hex')!==MIGRATION_BLOB) fail()
  return true
}
export function compileSavedOffersGuard() {
  const bytes=readFileSync(migrationPath)
  verifyMigrationBytes(bytes)
  const migration=bytes.toString('utf8')
  const paths=['preflight.sql','delta.sql','successor.sql','post.sql']
  const parts=paths.map(name=>readFileSync(resolve(directory,'parts',name),'utf8'))
  if (parts[2].split('/* INJECT_CANONICAL_MIGRATION_STATEMENT */').length!==2
    || parts.some(x=>x.length<1000)) fail()
  const substituted=parts[2].replace('/* INJECT_CANONICAL_MIGRATION_STATEMENT */',
    '$saved_migration_statement$'+migration+'$saved_migration_statement$')
  const sql=['BEGIN;',parts[0],migration,parts[1],substituted,parts[3],'COMMIT;',''].join('\n')
  if (!sql.startsWith('BEGIN;\n')||!sql.endsWith('COMMIT;\n')) fail()
  return sql
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length===3 && process.argv[2]==='--check') {
      compileSavedOffersGuard()
      process.stdout.write('saved_offers_bundle_verified=1 applied=0\n')
    } else if(process.argv.length===4 && process.argv[2]==='--emit'){
      const output=resolve(process.argv[3])
      if (output.startsWith(repository+'/') || output===repository || dirname(output)==='/' ) fail()
      const sql=compileSavedOffersGuard()
      const file=openSync(output,'wx',0o600)
      try { writeFileSync(file,sql) } finally { closeSync(file) }
      process.stdout.write('saved_offers_bundle_emitted=1 applied=0\n')
    } else fail()
  } catch { process.stderr.write('saved_offers_bundle_refused=1 applied=0\n');process.exitCode=1 }
}
