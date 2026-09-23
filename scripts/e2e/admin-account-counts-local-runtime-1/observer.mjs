#!/usr/bin/env node
// Transparent loopback forwarding observer at the app-to-Supabase HTTP
// boundary. Request/response/authentication semantics are preserved. Only
// sanitized path, method, status, counters and completeness are recorded.

import { createServer } from 'node:http'
import { WRAPPER_PATH, TIMEOUTS } from './constants.mjs'

const SENSITIVE_QUERY = /(token|code|key|secret|password|access|refresh|auth|otp|apikey)/i

export function sanitizePath(url) {
  const parsed = new URL(url, 'http://127.0.0.1')
  if (SENSITIVE_QUERY.test(parsed.search)) return parsed.pathname
  return `${parsed.pathname}${parsed.search}`
}

export function createRpcObserver({
  listenHost = '127.0.0.1',
  listenPort = 0,
  upstreamOrigin,
  createHttpServer = createServer,
  fetchImpl = fetch,
} = {}) {
  if (!upstreamOrigin || !/^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(upstreamOrigin)) {
    throw new Error('Observer upstream must be a numeric loopback origin.')
  }
  if (listenHost !== '127.0.0.1') {
    throw new Error(`Observer refuses non-loopback host ${listenHost}`)
  }

  const events = []
  const inFlight = new Set()
  let nextId = 1
  let dropped = false
  let closed = false

  const server = createHttpServer(async (req, res) => {
    const id = nextId++
    inFlight.add(id)
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('error', () => {
      dropped = true
      inFlight.delete(id)
    })
    req.on('end', async () => {
      try {
        const target = new URL(req.url || '/', upstreamOrigin)
        const headers = { ...req.headers, host: new URL(upstreamOrigin).host }
        delete headers['content-length']
        const upstream = await fetchImpl(target, {
          method: req.method,
          headers,
          body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
        })
        const body = Buffer.from(await upstream.arrayBuffer())
        const outHeaders = {}
        upstream.headers.forEach((value, key) => {
          if (key.toLowerCase() === 'transfer-encoding') return
          outHeaders[key] = value
        })
        events.push({
          id,
          method: req.method,
          path: sanitizePath(req.url || '/'),
          status: upstream.status,
        })
        res.writeHead(upstream.status, outHeaders)
        res.end(body)
      } catch (error) {
        dropped = true
        events.push({
          id,
          method: req.method,
          path: sanitizePath(req.url || '/'),
          status: null,
          error: error instanceof Error ? error.message : String(error),
        })
        if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' })
        res.end('upstream failed')
      } finally {
        inFlight.delete(id)
      }
    })
  })

  function mark() {
    return events.length
  }

  function since(markValue) {
    const calls = events.slice(markValue).map((event) => ({
      method: event.method,
      path: event.path,
      status: event.status,
    }))
    const complete = !dropped && inFlight.size === 0 && events.every((event) => event.id)
    return { complete, calls }
  }

  async function drain({ timeoutMs = TIMEOUTS.drainMs } = {}) {
    const start = Date.now()
    while (inFlight.size > 0 && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
    return { complete: inFlight.size === 0 && !dropped, inFlight: inFlight.size, dropped }
  }

  function listen() {
    return new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(listenPort, listenHost, () => {
        const address = server.address()
        if (!address || address.address !== '127.0.0.1') {
          server.close()
          reject(new Error(`Observer bound ${address && address.address}`))
          return
        }
        resolve({ origin: `http://127.0.0.1:${address.port}`, port: address.port })
      })
    })
  }

  async function close() {
    closed = true
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }

  return {
    mark,
    since,
    drain,
    listen,
    close,
    get dropped() { return dropped },
    get closed() { return closed },
    get inFlight() { return inFlight.size },
    wrapperPath: WRAPPER_PATH,
  }
}
