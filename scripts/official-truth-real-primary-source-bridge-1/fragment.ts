/** Complete finite fragment parser. No DOM, script execution, substring fact or
 * ignored tail. Accepted tags/nesting are a narrow observed manual-list shape.
 * A token carrying a country name is an observation, never a legal predicate. */
function scanFragment(body: string, withLocator: boolean) {
  if (typeof body !== 'string' || Buffer.byteLength(body) > 65_536) return null
  const stack: string[] = [], counts: number[] = []
  let cursor = 0, listCount = 0, itemIndex = 0
  const found: { pointer: '/details/body'; list: number; item: number; start: number; end: number;
    byteStart: number; byteEnd: number; quote: 'Switzerland' }[] = []
  const allowed: Record<string, string> = { '<p>': 'p', '<div class="legislative-list-wrapper">': 'div',
    '<ol class="legislative-list">': 'ol', '<li>': 'li' }
  while (cursor < body.length) {
    if (body[cursor] === '<') {
      const end = body.indexOf('>', cursor)
      if (end < 0) return null
      const tag = body.slice(cursor, end + 1), parent = stack.at(-1)
      if (tag === '<br>') { if (parent !== 'li') return null; counts[counts.length - 1]!++ }
      else if (tag.startsWith('</')) {
        if (parent === undefined || tag !== `</${parent}>`) return null
        stack.pop(); counts.pop()
      } else {
        const kind = allowed[tag]
        if (!kind || stack.length >= 4 || !(
          (kind === 'p' && parent === undefined) || (kind === 'div' && parent === undefined)
          || (kind === 'ol' && parent === 'div') || (kind === 'li' && parent === 'ol'))) return null
        stack.push(kind); counts.push(0)
        if (kind === 'ol') { listCount++; itemIndex = 0 }
        if (kind === 'li') itemIndex++
      }
      cursor = end + 1
    } else {
      const end = body.indexOf('<', cursor), stop = end < 0 ? body.length : end
      const text = body.slice(cursor, stop), parent = stack.at(-1)
      if (!['p', 'li'].includes(parent ?? '') && text.trim()) return null
      if (text.includes('&') || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) return null
      if (withLocator && parent === 'li' && text === 'Switzerland' && counts.at(-1) === 0 && body.slice(stop, stop + 5) === '</li>') {
        found.push({ pointer: '/details/body', list: listCount, item: itemIndex,
          start: cursor, end: stop, byteStart: Buffer.byteLength(body.slice(0, cursor)),
          byteEnd: Buffer.byteLength(body.slice(0, stop)), quote: 'Switzerland' })
      }
      if (counts.length) counts[counts.length - 1]! += text.length
      cursor = stop
    }
  }
  return stack.length ? null : { locator: found.length === 1 ? Object.freeze(found[0]!) : null }
}

export function hasClosedNationalListFragment(body: string): boolean {
  return scanFragment(body, false) !== null
}
export function locateNationality(body: string) {
  return scanFragment(body, true)?.locator ?? null
}
