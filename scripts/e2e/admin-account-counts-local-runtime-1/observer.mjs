#!/usr/bin/env node
// Transparent loopback forwarding observer at the app-to-Supabase HTTP
// boundary. Exact configured upstream origin is enforced before every
// forward. Absolute and scheme-relative targets cannot replace it.
// Redirects are manual. Out-of-scope Location is contained here: never
// forwarded downstream, never treated as Auth/API success. Byte/time/abort
// limits cover the entire streamed response.

import { createServer } from 'node:http'
import { WRAPPER_PATH, TIMEOUTS } from './constants.mjs'

const SENSITIVE_QUERY = /(token|code|key|secret|password|access|refresh|auth|otp|apikey)/i
const ABSOLUTE_OR_SCHEME_RELATIVE = /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/
const HOP_OR_CREDENTIAL_HEADERS = new Set([
  'transfer-encoding',
  'authorization',
  'cookie',
  'set-cookie',
  'proxy-authorization',
])

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

export function isRemoteRedirect(location, upstreamOrigin) {
  if (!location) return false
  try {
    const dest = new URL(location, upstreamOrigin)
    return dest.origin !== new URL(upstreamOrigin).origin
  } catch {
    return true
  }
}

export async function readBoundedBody(response, {
  maxBytes,
  signal,
  deadlineMs,
} = {}) {
  const limit = Number(maxBytes)
  if (!Number.isFinite(limit) || limit < 1) throw new Error('observer body limit is required')
  const reader = response?.body && typeof response.body.getReader === 'function'
    ? response.body.getReader()
    : null
  if (reader) {
    const chunks = []
    let size = 0
    try {
      while (true) {
        if (signal?.aborted || (deadlineMs != null && Date.now() > deadlineMs)) {
          await reader.cancel().catch(() => {})
          throw new Error('upstream response deadline')
        }
        const { done, value } = await reader.read()
        if (done) break
        const chunk = Buffer.from(value)
        size += chunk.byteLength
        if (size > limit) {
          await reader.cancel().catch(() => {})
          throw new Error('upstream response too large')
        }
        chunks.push(chunk)
      }
      return Buffer.concat(chunks)
    } finally {
      try { reader.releaseLock() } catch { /* already cancelled */ }
    }
  }
  if (typeof response?.arrayBuffer === 'function') {
    if (signal?.aborted || (deadlineMs != null && Date.now() > deadlineMs)) {
      throw new Error('upstream response deadline')
    }
    const body = Buffer.from(await response.arrayBuffer())
    if (body.length > limit) throw new Error('upstream response too large')
    return body
  }
  return Buffer.alloc(0)
}

function headerGet(headers, name) {
  if (!headers) return null
  if (typeof headers.get === 'function') return headers.get(name)
  return headers[name] || headers[name.toLowerCase()] || null
}

function copySafeHeaders(headers) {
  const out = {}
  if (!headers) return out
  const write = (key, value) => {
    const lower = String(key).toLowerCase()
    if (HOP_OR_CREDENTIAL_HEADERS.has(lower) || lower === 'location') return
    out[key] = value
  }
  if (typeof headers.forEach === 'function') {
    headers.forEach((value, key) => write(key, value))
    return out
  }
  for (const [key, value] of Object.entries(headers)) write(key, value)
  return out
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
  const outstanding = new Set()
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
      const controller = new AbortController()
      const deadlineMs = Date.now() + upstreamMs
      const timer = setTimeout(() => controller.abort(), upstreamMs)
      outstanding.add(controller)
      try {
        if (closed || aborting) {
          dropped = true
          if (!res.headersSent) res.writeHead(503, { 'content-type': 'text/plain' })
          res.end('observer closed')
          return
        }
        if (size > maxBodyBytes) {
          events.push({ id, method: req.method, path: sanitizePath(req.url || '/'), status: 413, incomplete: true })
          if (!res.headersSent) res.writeHead(413, { 'content-type': 'text/plain' })
          res.end('payload too large')
          return
        }
        const target = resolveUpstreamTarget(req.url || '/', upstreamOrigin)
        const headers = { ...req.headers, host: new URL(upstreamOrigin).host }
        delete headers['content-length']
        const upstream = await fetchImpl(target, {
          method: req.method,
          headers,
          body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
          redirect: 'manual',
          signal: controller.signal,
        })
        const location = headerGet(upstream.headers, 'location')
        if (isRemoteRedirect(location, upstreamOrigin)) {
          dropped = true
          events.push({
            id,
            method: req.method,
            path: sanitizePath(req.url || '/'),
            status: 502,
            remoteRedirect: true,
            incomplete: true,
            forwardedLocation: false,
          })
          if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' })
          res.end('observer refused out-of-scope redirect')
          return
        }
        const body = await readBoundedBody(upstream, {
          maxBytes: maxBodyBytes,
          signal: controller.signal,
          deadlineMs,
        })
        const outHeaders = copySafeHeaders(upstream.headers)
        if (location) outHeaders.location = location
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
          status: 502,
          incomplete: true,
          error: error instanceof Error ? error.message : String(error),
        })
        if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' })
        res.end('upstream failed')
      } finally {
        clearTimeout(timer)
        outstanding.delete(controller)
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
      remoteRedirect: event.remoteRedirect === true,
      incomplete: event.incomplete === true,
    }))
    const complete = !dropped && !closed && !aborting && inFlight.size === 0 && events.every((event) => event.id && event.incomplete !== true)
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
    for (const controller of outstanding) {
      try { controller.abort() } catch { /* already aborted */ }
    }
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
