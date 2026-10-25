/** Simple advisory range checks. No registry and no install. */

export function parseVersion(text) {
  const value = String(text).trim()
  if (!/^\d+\.\d+\.\d+$/.test(value)) return null
  return value.split('.').map((part) => Number(part))
}

export function compareVersions(left, right) {
  const a = parseVersion(left)
  const b = parseVersion(right)
  if (!a || !b) return null
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1
  }
  return 0
}

export function matchesRange(version, expression) {
  if (!parseVersion(version)) return null
  const parts = String(expression).split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length === 0) return null
  for (const part of parts) {
    const op = ['>=', '<=', '>', '<'].find((candidate) => part.startsWith(candidate))
    if (!op) return null
    const other = part.slice(op.length).trim()
    const order = compareVersions(version, other)
    if (order === null) return null
    const ok = (op === '>=' && order >= 0)
      || (op === '<=' && order <= 0)
      || (op === '>' && order > 0)
      || (op === '<' && order < 0)
    if (!ok) return false
  }
  return true
}

export function matchingNpmRanges(version, vulnerabilities, packageName) {
  const matches = []
  for (const entry of vulnerabilities || []) {
    const pkg = entry.package || {}
    if (pkg.ecosystem !== 'npm' || pkg.name !== packageName) continue
    const matched = matchesRange(version, entry.vulnerable_version_range || '')
    if (matched === null) return { state: 'RANGE_UNPARSEABLE', matches: [] }
    if (matched) matches.push(entry)
  }
  return { state: matches.length ? 'RANGE_DECIDED' : 'UNAFFECTED', matches }
}

export const SEVERITY = { critical: 'critical', high: 'high', medium: 'moderate', moderate: 'moderate', low: 'low', info: 'info' }

export function priorityCell(severity, bucket) {
  const table = {
    critical: { A: 'provisional P1', B: 'provisional P1', C: 'provisional P1', D: 'P2', U: 'provisional P1' },
    high: { A: 'provisional P1', B: 'provisional P1', C: 'provisional P2', D: 'P2', U: 'provisional P1' },
    moderate: { A: 'provisional P1', B: 'provisional P2', C: 'provisional P2', D: 'P3', U: 'provisional P1' },
    low: { A: 'P2', B: 'P3', C: 'P3', D: 'P3', U: 'P2' },
    info: { A: 'P2', B: 'P3', C: 'P3', D: 'P3', U: 'P2' },
  }
  return table[severity]?.[bucket] || null
}

export function priorityRank(label) {
  return { 'provisional P0': 0, 'provisional P1': 1, 'provisional P2': 2, P2: 2, P3: 3 }[label]
}
