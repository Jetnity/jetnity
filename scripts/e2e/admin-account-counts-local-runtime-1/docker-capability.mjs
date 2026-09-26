#!/usr/bin/env node
// One read-only Docker capability check. Never install, retry, or change
// privileges. Version-only binaries are not a usable daemon.

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { findeAusfuehrbare } from '../admin-account-counts-browser-acceptance-1/resolve-executable.mjs'
import { TIMEOUTS } from './constants.mjs'
import { istLokalerUnixDockerHost, istRemoteDockerHinweis, unixPfadAusDockerHost } from './docker-endpoint.mjs'

const COMMANDS = ['docker', 'podman', 'nerdctl']
const SOCKETS = [
  '/var/run/docker.sock',
  '/run/docker.sock',
  '/var/run/podman/podman.sock',
  '/run/podman/podman.sock',
]

function tryExec(execFile, bin, args, env, timeout = TIMEOUTS.dockerInfoMs) {
  try {
    const out = execFile(bin, args, { encoding: 'utf8', timeout, env })
    return { ok: true, text: String(out).trim().split('\n')[0], full: String(out) }
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error).split('\n')[0] }
  }
}

function contextIsRemote(text) {
  return istRemoteDockerHinweis(text) || /cloud|ecs|aci|ssh:|tcp:\/\/(?!127\.0\.0\.1|localhost)/i.test(String(text || ''))
}

export function pruefeDockerFaehigkeit({
  env,
  execFile = execFileSync,
  resolve = findeAusfuehrbare,
  exists = existsSync,
} = {}) {
  const resolved = {}
  const versions = {}
  const info = {}
  let usable = false
  let selected = null
  for (const name of COMMANDS) {
    const path = resolve(name, env)
    if (!path) continue
    resolved[name] = path
    versions[name] = tryExec(execFile, path, ['--version'], env)
    const daemon = tryExec(execFile, path, ['info'], env, TIMEOUTS.dockerInfoMs)
    info[name] = daemon
    if (daemon.ok && !usable) {
      if (name === 'docker' && !istLokalerUnixDockerHost(env?.DOCKER_HOST)) {
        continue
      }
      usable = true
      selected = { name, path }
    }
  }
  const sockets = SOCKETS.filter((path) => exists(path))
  let context = { ok: false, text: null, remote: false }
  if (selected) {
    const probed = tryExec(execFile, selected.path, ['context', 'show'], env)
    context = {
      ok: probed.ok,
      text: probed.ok ? probed.text : null,
      remote: contextIsRemote(probed.full || probed.text || probed.error),
    }
    if (context.remote) usable = false
  }
  const present = Object.keys(resolved).length > 0 || sockets.length > 0
  const dockerHostPath = unixPfadAusDockerHost(env?.DOCKER_HOST)
  const usedExplicitLocalHost = istLokalerUnixDockerHost(env?.DOCKER_HOST)
  if (selected?.name === 'docker' && !usedExplicitLocalHost) usable = false
  return {
    present,
    usable: usable && !context.remote,
    selected,
    resolved,
    commands: Object.keys(resolved),
    sockets,
    versions,
    info,
    context,
    localUnixSocket: usedExplicitLocalHost
      || sockets.includes('/var/run/docker.sock')
      || sockets.includes('/run/docker.sock'),
    usedExplicitLocalHost,
    dockerHostPathPresent: Boolean(dockerHostPath),
    note: usable && !context.remote
      ? 'A local Docker-API daemon answered info and the active context is not remote.'
      : present
        ? 'A container CLI or socket is present, but a usable isolated local daemon was not verified.'
        : 'No docker/podman/nerdctl executable and no local Docker/Podman socket.',
    severity: 'execution-blocker',
    notAProductionIncident: true,
    installAttempted: false,
  }
}
