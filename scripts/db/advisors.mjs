#!/usr/bin/env node
// Ruft die Supabase-Advisors (Security und Performance) für den Development-Branch ab.
//
// Aufruf:
//   node scripts/db/advisors.mjs            # Zusammenfassung
//   node scripts/db/advisors.mjs --json     # Rohdaten

const API = 'https://api.supabase.com/v1'

export async function advisors(type) {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const ref = process.env.SUPABASE_PROJECT_REF
  if (!token || !ref) throw new Error('SUPABASE_ACCESS_TOKEN oder SUPABASE_PROJECT_REF fehlt')

  const res = await fetch(`${API}/projects/${ref}/advisors/${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Advisors ${type} fehlgeschlagen (HTTP ${res.status}): ${text}`)
  return JSON.parse(text)
}

async function main() {
  const raw = process.argv.includes('--json')
  const out = {}
  for (const type of ['security', 'performance']) {
    out[type] = await advisors(type)
  }

  if (raw) {
    process.stdout.write(JSON.stringify(out, null, 2) + '\n')
    return
  }

  for (const [type, data] of Object.entries(out)) {
    const lints = data.lints ?? []
    console.log(`\n=== ${type.toUpperCase()} – ${lints.length} Befunde ===`)
    const byName = new Map()
    for (const l of lints) {
      const key = `${l.level}|${l.name}`
      if (!byName.has(key)) byName.set(key, [])
      byName.get(key).push(l)
    }
    for (const [key, group] of [...byName.entries()].sort()) {
      const [level, name] = key.split('|')
      console.log(`\n  [${level}] ${name} – ${group.length}x`)
      console.log(`    ${group[0].description ?? ''}`)
      for (const l of group.slice(0, 8)) {
        console.log(`      · ${l.metadata?.name ?? l.title ?? ''} ${l.detail ? '– ' + stripTags(l.detail).slice(0, 130) : ''}`)
      }
      if (group.length > 8) console.log(`      · … und ${group.length - 8} weitere`)
    }
  }
}

function stripTags(s) {
  return String(s).replace(/<[^>]*>/g, '`')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
