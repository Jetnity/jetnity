#!/usr/bin/env node
// Discover one verified local Unix Docker endpoint from the parent machine
// environment, then use only that host in the isolated child. Remote/tcp/ssh
// /cloud contexts fail closed. Private HOME never receives copied Docker
// credentials or config.

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { findeAusfuehrbare } from '../admin-account-counts-browser-acceptance-1/resolve-executable.mjs'
import { TIMEOUTS } from './constants.mjs'

export const LINUX_DEFAULT_SOCKETS = Object.freeze([
  '/var/run/docker.sock',
  '/run/docker.sock',
])

export const DOCKER_DESKTOP_RELATIVE_SOCKETS = Object.freeze([
  '.docker/run/docker.sock',
  '.docker/desktop/docker.sock',
])

const REMOTE_SCHEME = /^(tcp|ssh|https?|npipe|fd):/i
const REMOTE_CONTEXT_NAME = /^(cloud|ecs|aci|ssh)$/i

function tryExec(execFile, bin, args, env, timeout = TIMEOUTS.dockerInfoMs) {
  try {
    const out = execFile(bin, args, { encoding: 'utf8', timeout, env })
    return { ok: true, text: String(out).trim().split('\n')[0], full: String(out) }
  } catch (error) {
    return {
      ok: false,
      error: String(error && error.message ? error.message : error).split('\n')[0],
      full: String(error?.stdout || ''),
    }
  }
}

export function normalizeDockerHost(host) {
  return String(host || '').trim().replace(/^unix:\/\//i, 'unix://')
}

export function unixPfadAusDockerHost(host) {
  const value = normalizeDockerHost(host)
  if (!value.startsWith('unix://')) return null
  const path = value.slice('unix://'.length)
  return path.startsWith('/') ? path : null
}

export function istRemoteDockerHinweis(value) {
  const text = String(value || '').trim()
  if (!text) return false
  if (REMOTE_SCHEME.test(text)) return true
  if (REMOTE_CONTEXT_NAME.test(text)) return true
  if (/(?:^|[/\s:_-])(?:cloud|ecs|aci)(?:$|[/\s:_-])/i.test(text) && !/desktop-linux/i.test(text)) {
    return true
  }
  return false
}

export function istLokalerUnixDockerHost(host) {
  const path = unixPfadAusDockerHost(host)
  if (!path) return false
  if (path.includes('\0') || path.includes('://')) return false
  if (istRemoteDockerHinweis(host) || istRemoteDockerHinweis(path)) return false
  return true
}

export function klassifiziereLokalenUnixDockerHost(host) {
  const path = unixPfadAusDockerHost(host)
  if (!path) return 'invalid'
  if (path === '/var/run/docker.sock') return 'linux-var-run-sock'
  if (path === '/run/docker.sock') return 'linux-run-sock'
  if (/\.docker\/(?:run|desktop)\/docker\.sock$/.test(path)) return 'docker-desktop-unix'
  return 'other-local-unix'
}

export function sanitizeDockerHost(host, { parentHome } = {}) {
  let sanitized = normalizeDockerHost(host)
  const home = String(parentHome || '').replace(/\/+$/, '')
  if (home && sanitized.includes(home)) {
    sanitized = sanitized.split(home).join('<redacted-home>')
  }
  sanitized = sanitized.replace(/\/Users\/[^/]+/g, '/Users/<redacted>')
  sanitized = sanitized.replace(/\/home\/[^/]+/g, '/home/<redacted>')
  sanitized = sanitized.replace(/\/private\/var\/folders\/[^/]+/g, '/private/var/folders/<redacted>')
  return sanitized
}

function leerAuswahl(note, extra = {}) {
  return {
    ok: false,
    verified: false,
    host: null,
    kind: null,
    source: extra.source || null,
    contextName: extra.contextName || null,
    remoteRefused: extra.remoteRefused === true,
    note,
  }
}

function trefferAuswahl({ host, source, contextName = null, note }) {
  const normalized = normalizeDockerHost(host)
  return {
    ok: true,
    verified: false,
    host: normalized,
    kind: klassifiziereLokalenUnixDockerHost(normalized),
    source,
    contextName,
    remoteRefused: false,
    note: note || 'Selected a local Unix Docker endpoint; daemon verification is still required.',
  }
}

export function sanitizeDockerEndpunktBeweis(selection, { parentHome } = {}) {
  return {
    ok: selection?.ok === true,
    verified: selection?.verified === true,
    kind: selection?.kind || null,
    source: selection?.source || null,
    contextName: selection?.contextName || null,
    hostSanitized: selection?.host ? sanitizeDockerHost(selection.host, { parentHome }) : null,
    remoteRefused: selection?.remoteRefused === true,
    note: selection?.note || null,
  }
}

export function extrahiereDockerInspectHost(text) {
  const raw = String(text || '').trim()
  if (!raw) return null
  const firstLine = raw.split('\n')[0].trim()
  if (istLokalerUnixDockerHost(firstLine) || istRemoteDockerHinweis(firstLine)) return firstLine
  try {
    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed) ? parsed : [parsed]
    for (const item of items) {
      const host = item?.Endpoints?.docker?.Host
      if (host) return String(host).trim()
    }
  } catch {
    /* not JSON */
  }
  const match = raw.match(/unix:\/\/\/[^\s"']+/)
  return match ? match[0] : null
}

function inspectAktivenKontext({ dockerBin, parentEnv, execFile }) {
  const show = tryExec(execFile, dockerBin, ['context', 'show'], parentEnv)
  const contextName = show.ok ? String(show.text || '').trim() || null : null
  if (contextName && istRemoteDockerHinweis(contextName)) {
    return { contextName, host: null, remote: true }
  }
  let host = null
  if (contextName) {
    const formatted = tryExec(
      execFile,
      dockerBin,
      ['context', 'inspect', contextName, '--format', '{{.Endpoints.docker.Host}}'],
      parentEnv,
    )
    if (formatted.ok) host = extrahiereDockerInspectHost(formatted.full || formatted.text)
    if (!host) {
      const inspected = tryExec(execFile, dockerBin, ['context', 'inspect', contextName], parentEnv)
      if (inspected.ok) host = extrahiereDockerInspectHost(inspected.full || inspected.text)
    }
  }
  if (host && istRemoteDockerHinweis(host) && !istLokalerUnixDockerHost(host)) {
    return { contextName, host, remote: true }
  }
  return {
    contextName,
    host: istLokalerUnixDockerHost(host) ? normalizeDockerHost(host) : null,
    remote: false,
  }
}

export function waehleLokalenUnixDockerEndpunkt({
  parentEnv = {},
  execFile = execFileSync,
  resolve = findeAusfuehrbare,
  exists = existsSync,
  platform = process.platform,
} = {}) {
  const parentHost = normalizeDockerHost(parentEnv.DOCKER_HOST)
  const parentContext = String(parentEnv.DOCKER_CONTEXT || '').trim()

  if (parentHost && (istRemoteDockerHinweis(parentHost) || !istLokalerUnixDockerHost(parentHost))) {
    return leerAuswahl('Parent DOCKER_HOST is remote or not a local Unix endpoint and is not inherited.', {
      remoteRefused: true,
      source: 'parent-docker-host',
    })
  }
  if (parentContext && istRemoteDockerHinweis(parentContext)) {
    return leerAuswahl('Parent DOCKER_CONTEXT is remote and is not inherited.', {
      remoteRefused: true,
      source: 'parent-docker-context',
      contextName: parentContext,
    })
  }

  const dockerBin = resolve('docker', parentEnv)
  let inspect = { contextName: null, host: null, remote: false }
  if (dockerBin) {
    inspect = inspectAktivenKontext({ dockerBin, parentEnv, execFile })
    if (inspect.remote) {
      return leerAuswahl('Active Docker context is remote and is refused.', {
        remoteRefused: true,
        source: 'docker-context',
        contextName: inspect.contextName,
      })
    }
  }

  const collected = []
  if (istLokalerUnixDockerHost(parentHost)) {
    collected.push({
      host: normalizeDockerHost(parentHost),
      source: 'parent-docker-host',
      contextName: inspect.contextName,
    })
  }
  if (istLokalerUnixDockerHost(inspect.host)) {
    collected.push({
      host: normalizeDockerHost(inspect.host),
      source: 'docker-context',
      contextName: inspect.contextName,
    })
  }

  const uniqueHosts = [...new Set(collected.map((item) => item.host))]
  if (uniqueHosts.length > 1) {
    return leerAuswahl('Active Docker CLI and context disagree on the local Unix endpoint.', {
      contextName: inspect.contextName,
      source: 'ambiguous',
    })
  }
  if (uniqueHosts.length === 1) {
    const chosen = collected.find((item) => item.host === uniqueHosts[0])
    return trefferAuswahl(chosen)
  }

  if (platform !== 'darwin') {
    for (const sock of LINUX_DEFAULT_SOCKETS) {
      if (exists(sock)) {
        return trefferAuswahl({
          host: `unix://${sock}`,
          source: 'linux-default-socket',
          contextName: inspect.contextName,
          note: 'Selected the existing Linux default local Unix Docker socket.',
        })
      }
    }
    if (dockerBin && platform === 'linux') {
      return trefferAuswahl({
        host: 'unix:///var/run/docker.sock',
        source: 'linux-default-socket',
        contextName: inspect.contextName,
        note: 'Selected the Linux default local Unix Docker socket for daemon verification.',
      })
    }
  }

  const parentHome = parentEnv.HOME
  if (platform === 'darwin' && parentHome) {
    for (const rel of DOCKER_DESKTOP_RELATIVE_SOCKETS) {
      const sock = join(parentHome, rel)
      if (exists(sock)) {
        return trefferAuswahl({
          host: `unix://${sock}`,
          source: 'docker-desktop-home-socket',
          contextName: inspect.contextName,
          note: 'Selected an existing Docker Desktop local Unix socket derived from parent HOME.',
        })
      }
    }
  }

  return leerAuswahl(
    dockerBin
      ? 'No local Unix Docker endpoint was discovered from the parent CLI, context or default sockets.'
      : 'No docker executable was resolved from the parent environment.',
    { contextName: inspect.contextName },
  )
}

export function verifiziereLokalenUnixDockerEndpunkt({
  selection,
  isolatedEnv = {},
  execFile = execFileSync,
  resolve = findeAusfuehrbare,
  exists = existsSync,
} = {}) {
  if (!selection?.ok || !istLokalerUnixDockerHost(selection.host)) {
    return leerAuswahl(selection?.note || 'No local Unix Docker endpoint was selected.', {
      remoteRefused: selection?.remoteRefused === true,
      source: selection?.source,
      contextName: selection?.contextName,
    })
  }
  if (isolatedEnv.DOCKER_HOST !== selection.host) {
    return {
      ...selection,
      ok: false,
      verified: false,
      note: 'Isolated child DOCKER_HOST is not the selected local Unix endpoint.',
    }
  }
  if (isolatedEnv.DOCKER_CONTEXT || isolatedEnv.DOCKER_CERT_PATH || isolatedEnv.DOCKER_TLS_VERIFY) {
    return {
      ...selection,
      ok: false,
      verified: false,
      note: 'Isolated child still contains DOCKER_CONTEXT or TLS/cert variables.',
    }
  }
  const path = unixPfadAusDockerHost(selection.host)
  if (!path || !exists(path)) {
    return {
      ...selection,
      ok: false,
      verified: false,
      note: 'Selected local Unix Docker socket is missing.',
    }
  }
  const dockerBin = resolve('docker', isolatedEnv)
  if (!dockerBin) {
    return {
      ...selection,
      ok: false,
      verified: false,
      note: 'Docker executable is absent in the isolated environment.',
    }
  }
  const info = tryExec(execFile, dockerBin, ['info'], isolatedEnv)
  if (!info.ok) {
    return {
      ...selection,
      ok: false,
      verified: false,
      note: `docker info failed on the selected local Unix endpoint: ${info.error || 'non-responsive daemon'}`,
    }
  }
  return {
    ...selection,
    ok: true,
    verified: true,
    note: 'docker info succeeded using the explicit verified local Unix endpoint in the isolated environment.',
  }
}
