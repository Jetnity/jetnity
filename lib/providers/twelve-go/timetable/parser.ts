import 'server-only'
import { parseFragment, type DefaultTreeAdapterMap } from 'parse5'
import { ortSchluessel, timetableAnfrageSchema, timetableAntwortSchema, timetableLink, type TimetableAnfrage, type TimetableAntwort } from './schema'

type Node = DefaultTreeAdapterMap['node']
type Element = DefaultTreeAdapterMap['element']
function children(node: Node): Node[] { return 'childNodes' in node ? node.childNodes : [] }
function element(node: Node): node is Element { return 'tagName' in node }
function attr(node: Node, name: string): string { return element(node) ? node.attrs.find((a) => a.name === name)?.value ?? '' : '' }
function klasse(node: Node, name: string): boolean { return attr(node, 'class').split(/\s+/).includes(name) }
function all(node: Node, test: (n: Node) => boolean): Node[] {
  const result: Node[] = [], stack = [...children(node)].reverse()
  let count = 0
  while (stack.length) {
    const next = stack.pop()!
    if (++count > 15000) throw new Error('Timetable structure too large')
    if (element(next) && ['script', 'style', 'template', 'noscript'].includes(next.tagName)) continue
    if (test(next)) result.push(next)
    stack.push(...children(next).slice().reverse())
  }
  return result
}
function first(node: Node, name: string): Node | undefined { return all(node, (n) => klasse(n, name))[0] }
function text(node: Node | undefined): string {
  if (!node) return ''
  return all(node, (n) => n.nodeName === '#text').map((n) => 'value' in n ? n.value : '').join('').replace(/\s+/g, ' ').trim()
}
function anchor(node: Node): Node | undefined { return all(node, (n) => element(n) && n.tagName === 'a')[0] }

/** The provider HTML never reaches the browser. Only an exact, validated route is returned. */
export function parseTimetable(html: string, request: TimetableAnfrage, fetchedAt: string): TimetableAntwort {
  timetableAnfrageSchema.parse(request)
  const document = parseFragment(html)
  const containers = all(document, (n) => klasse(n, 'one2go-route-container'))
  if (!containers.length) throw new Error('Unrecognised timetable response')
  const expected = `${ortSchluessel(request.from, request.country)}|${ortSchluessel(request.to, request.country)}`
  const matches = containers.filter((container) => {
    const header = first(container, 'one2go-route-header')
    const link = header && anchor(header)
    if (!link) return false
    const raw = attr(link, 'href')
    const label = text(link).split(/\s+-\s+/).map((s) => ortSchluessel(s, request.country)).join('|')
    // Nearby airports and neighbouring cities must not silently replace the requested endpoints.
    return label === expected && timetableLink(raw, request)?.pathname.startsWith('/de/travel/')
  })
  if (matches.length > 1) throw new Error('Ambiguous timetable response')
  if (!matches.length) {
    // A matching label with an invalid URL is an error, not an empty result.
    if (containers.some((c) => {
      const header = first(c, 'one2go-route-header'), a = header && anchor(header)
      return a && text(a).split(/\s+-\s+/).map((s) => ortSchluessel(s, request.country)).join('|') === expected
    })) throw new Error('Invalid timetable link')
    return { status: 'unmatched', fetchedAt, currency: 'CHF', routeLabel: `${request.from} → ${request.to}`, href: null, options: [] }
  }
  const match = matches[0]!
  const routeAnchor = anchor(first(match, 'one2go-route-header')!)!
  const options: TimetableAntwort['options'] = []
  for (const row of all(match, (n) => element(n) && n.tagName === 'tr')) {
    const name = first(row, 'one2go-route-name')
    if (name) {
      const link = anchor(name)
      const href = link ? attr(link, 'href') : ''
      const url = timetableLink(href, request)
      const mode = url?.pathname.split('/')[2]
      if (!url || !mode || mode === 'travel') throw new Error('Invalid transport link')
      options.push({
        mode: mode as TimetableAntwort['options'][number]['mode'], href,
        price: text(first(name, 'one2go-route-price')),
        duration: text(first(name, 'one2go-route-duration')) || null,
        departures: [],
      })
    } else {
      const option = options.at(-1)
      if (!option) continue
      for (const li of all(row, (n) => element(n) && n.tagName === 'li')) {
        if (first(li, 'one2go-left')) continue
        const service = text(first(li, 'one2go-class'))
        const times = text(first(li, 'one2go-departures')) || null
        if (times && !/^(?:[01]?\d|2[0-3]):[0-5]\d(?:,\s*(?:[01]?\d|2[0-3]):[0-5]\d)*$/.test(times)) throw new Error('Invalid departure times')
        if (service) option.departures.push({ service, times })
      }
    }
  }
  return timetableAntwortSchema.parse({
    status: 'ready', fetchedAt, currency: 'CHF', routeLabel: text(routeAnchor).replace(' - ', ' → '),
    href: attr(routeAnchor, 'href'), options,
  })
}
