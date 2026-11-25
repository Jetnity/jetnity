import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AT_VISITOR_INFORMATION_LINKS } from './at-visitor-links'
import { pruefen } from '../../../scripts/official-truth-at-visitor-link-check'

type Call = { url: string; method?: string; redirect?: RequestRedirect; signal?: AbortSignal | null }
function transport(replies: readonly (Response | Error)[]) {
  const calls: Call[] = []
  const request: typeof fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    calls.push({ url, method: init?.method, redirect: init?.redirect, signal: init?.signal })
    const reply = replies[calls.length - 1]
    if (!reply) throw new Error('Unexpected extra HTTP request in offline test')
    if (reply instanceof Error) throw reply
    return reply
  }
  return { request, calls }
}
const html = () => new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })
const redirect = (location: string) => new Response(null, { status: 302, headers: { location } })

test('all three displayed AT information URLs are covered by the same bounded GET checker used by the manual script', async () => {
  assert.equal(AT_VISITOR_INFORMATION_LINKS.length, 3)
  for (const link of AT_VISITOR_INFORMATION_LINKS) {
    const mock = transport([html()])
    assert.deepEqual(await pruefen(link.href, mock.request), { status: 200, url: link.href, ok: true })
    assert.equal(mock.calls.length, 1)
    assert.equal(mock.calls[0]?.url, link.href)
    assert.equal(mock.calls[0]?.method, 'GET')
    assert.equal(mock.calls[0]?.redirect, 'manual')
    assert.ok(mock.calls[0]?.signal instanceof AbortSignal)
  }
})

test('HTTP failures and non-HTML responses never count as reachable official information', async () => {
  const url = AT_VISITOR_INFORMATION_LINKS[2].href
  for (const status of [404, 403, 503]) {
    const mock = transport([new Response('Not available', { status, headers: { 'content-type': 'text/html' } })])
    assert.deepEqual(await pruefen(url, mock.request), { status, url, ok: false })
    assert.equal(mock.calls.length, 1)
  }
  const mock = transport([new Response('not HTML', { status: 200, headers: { 'content-type': 'text/plain' } })])
  assert.deepEqual(await pruefen(url, mock.request), { status: 200, url, ok: false })
})

test('redirects are bounded and may only reach the allowed official HTTPS hosts', async () => {
  const url = AT_VISITOR_INFORMATION_LINKS[2].href
  const target = AT_VISITOR_INFORMATION_LINKS[0].href
  const valid = transport([redirect(target), html()])
  assert.deepEqual(await pruefen(url, valid.request), { status: 200, url: target, ok: true })
  assert.deepEqual(valid.calls.map(call => call.url), [url, target])
  assert.equal(valid.calls[0]?.signal, valid.calls[1]?.signal)
  for (const unsafe of ['https://untrusted.invalid/path', 'http://www.bmeia.gv.at/', 'https://user:pass@www.bmeia.gv.at/', 'https://www.bmeia.gv.at:444/']) {
    const mock = transport([redirect(unsafe)])
    await assert.rejects(pruefen(url, mock.request), /ausserhalb amtlicher HTTPS-Adressen/)
    assert.equal(mock.calls.length, 1)
    const initial = transport([])
    await assert.rejects(pruefen(unsafe, initial.request), /ausserhalb amtlicher HTTPS-Adressen/)
    assert.equal(initial.calls.length, 0)
  }
  const loop = transport(Array.from({ length: 5 }, () => redirect(url)))
  await assert.rejects(pruefen(url, loop.request), /Zu viele Weiterleitungen/)
  assert.equal(loop.calls.length, 5)
})

test('timeout and network failures are reported as failures, without retry or a fabricated HTTP result', async () => {
  const url = AT_VISITOR_INFORMATION_LINKS[2].href
  for (const error of [new DOMException('Timeout', 'TimeoutError'), new TypeError('fetch failed')]) {
    const mock = transport([error])
    await assert.rejects(pruefen(url, mock.request), error)
    assert.equal(mock.calls.length, 1)
  }
})
