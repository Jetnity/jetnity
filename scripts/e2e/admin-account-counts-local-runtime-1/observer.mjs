#!/usr/bin/env node
// Transparent loopback forwarding observer at the app-to-Supabase HTTP
// boundary. Exact configured upstream origin is enforced before every
// forward. Absolute and scheme-relative targets cannot replace it.
// Redirects are manual; remote redirects never receive forwarded credentials.

import { createServer } from 'node:http'
import { WRAPPER_PATH, TIMEOUTS } from './constants.mjs'

const SENSITIVE_QUERY = /(token|code|key|secret|password|access|refresh|auth|otp|apikey)/i
const ABSOLUTE_OR_SCHEME_RELATIVE = /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/

export function sanitizePath(url) {
  const parsed = new URL(url, 'http://127.0.0.1')
  if (SENSITIVE_QUERY.test(parsed.search)) return parsed.pathname
  return `${parsed.pathname}${parsed.search}`
}

export function resolveUpstreamTarget(reqUrl, upstreamOrigin) {
  if (!upstreamOrigin || !/^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(upstreamOrigin)) {
    throw new Error('Observer upstream must be a numeric loopback origin.')
  }
  const raw = String(reqUrl || '/')
  if (ABSOLUTE_OR_SCHEME_RELATIVE.test(raw) || raw.includes('://')) {
    throw new Error('observer refuses absolute or scheme-relative request target')
  }
  const upstream = new URL(upstreamOrigin)
  const target = new URL(raw, upstreamOrigin)
  if (target.origin !== upstream.origin) {
    throw new Error('observer refuses upstream origin escape')
  }
  return target
}

function isRemoteRedirect(location, upstreamOrigin) {
  if (!location) return false
  try {
    const dest = new URL(location, upstreamOrigin)
    return dest.origin !== new URL(upstreamOrigin).origin
  } catch {
    return true
  }
}

export function createRpcObserver({
  listenHost = '127.0.0.1',
  listenPort = 0,
  upstreamOrigin,
  createHttpServer = createServer,
  fetchImpl = fetch,
  maxBodyBytes = TIMEOUTS.observerMaxBodyBytes,
  upstreamMs = TIMEOUTS.httpMs,
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
  let aborting = false

  const server = createHttpServer(async (req, res) => {
    const id = nextId++
    inFlight.add(id)
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > maxBodyBytes) {
        dropped = true
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('error', () => {
      dropped = true
      inFlight.delete(id)
    })
    req.on('end', async () => {
      try {
        if (closed || aborting) {
          dropped = true
          if (!res.headersSent) res.writeHead(503, { 'content-type': 'text/plain' })
          res.end('observer closed')
          return
        }
        if (size > maxBodyBytes) {
          events.push({ id, method: req.method, path: sanitizePath(req.url || '/'), status: 413 })
          if (!res.headersSent) res.writeHead(413, { 'content-type': 'text/plain' })
          res.end('payload too large')
          return
        }
        const target = resolveUpstreamTarget(req.url || '/', upstreamOrigin)
        const headers = { ...req.headers, host: new URL(upstreamOrigin).host }
        delete headers['content-length']
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), upstreamMs)
        let upstream
        try {
          upstream = await fetchImpl(target, {
            method: req.method,
            headers,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
            redirect: 'manual',
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timer)
        }
        const location = upstream.headers?.get?.('location') || upstream.headers?.location
        if (isRemoteRedirect(location, upstreamOrigin)) {
          events.push({
            id,
            method: req.method,
            path: sanitizePath(req.url || '/'),
            status: upstream.status,
            remoteRedirect: true,
          })
          const outHeaders = {}
          upstream.headers.forEach((value, key) => {
            if (['transfer-encoding', 'authorization', 'cookie', 'set-cookie'].includes(key.toLowerCase())) return
            if (key.toLowerCase() === 'location') outHeaders[key] = value
            else outHeaders[key] = value
          })
          res.writeHead(upstream.status, outHeaders)
          res.end()
          return
        }
        const body = Buffer.from(await upstream.arrayBuffer())
        if (body.length > maxBodyBytes) {
          dropped = true
          events.push({ id, method: req.method, path: sanitizePath(req.url || '/'), status: 502 })
          if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' })
          res.end('upstream response too large')
          return
        }
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
    const complete = !dropped && !closed && !aborting && inFlight.size === 0 && events.every((event) => event.id)
    return { complete, calls }
  }

  async function drain({ timeoutMs = TIMEOUTS.drainMs } = {}) {
    const start = Date.now()
    while (inFlight.size > 0 && Date.now() - start < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
    return { complete: inFlight.size === 0 && !dropped && !aborting, inFlight: inFlight.size, dropped }
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

  async function close({ timeoutMs = TIMEOUTS.observerCloseMs } = {}) {
    aborting = true
    closed = true
    const drained = await drain({ timeoutMs })
    await Promise.race([
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('observer close timeout')), timeoutMs)),
    ])
    if (!drained.complete) dropped = true
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
