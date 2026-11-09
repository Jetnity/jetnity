// Maintainer-only pure source generation. Never connects or applies SQL.
import { readFileSync, writeFileSync } from 'node:fs'
import { S1_RETENTION_SHAPE } from '../../../lib/readiness/official-truth-product-v3/storage/retention-shape'

export const shapeSql = () => `-- S1_RETENTION_SHAPE_BEGIN\nCREATE FUNCTION official_v3_intake_private.proposal_shape_v1() RETURNS jsonb\nLANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $shape_function$\n  SELECT $shape_json$${JSON.stringify(S1_RETENTION_SHAPE)}$shape_json$::jsonb\n$shape_function$;\n-- S1_RETENTION_SHAPE_END`

if (process.argv.includes('--write-s1-shape')) {
  if (process.argv.length !== 3) throw Error('shape_generator_arguments')
  const file = new URL('./intake-candidate.sql', import.meta.url), original = readFileSync(file, 'utf8')
  const range = /-- S1_RETENTION_SHAPE_BEGIN[\s\S]*?-- S1_RETENTION_SHAPE_END/g
  if ([...original.matchAll(range)].length !== 1) throw Error('shape_marker_count')
  writeFileSync(file, original.replace(range, shapeSql()))
}
