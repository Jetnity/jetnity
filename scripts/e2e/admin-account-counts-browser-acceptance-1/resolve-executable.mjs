#!/usr/bin/env node
// Shell-free executable resolver. `command` is a shell builtin and is not an
// executable; spawnSync('command', ['-v', name]) is not discovery.

import { existsSync, statSync } from 'node:fs'
import { delimiter, isAbsolute, join } from 'node:path'

function istAusfuehrbareDatei(path) {
  try {
    const stat = statSync(path)
    return stat.isFile() && (stat.mode & 0o111) !== 0
  } catch {
    return false
  }
}

export function findeAusfuehrbare(name, env = {}) {
  if (!name || typeof name !== 'string') return null
  if (name.includes('/') || name.includes('\\') || isAbsolute(name)) {
    return istAusfuehrbareDatei(name) ? name : null
  }
  const pathVar = env.PATH
  if (pathVar == null || String(pathVar) === '') return null
  for (const dir of String(pathVar).split(delimiter)) {
    if (!dir) continue
    const candidate = join(dir, name)
    if (istAusfuehrbareDatei(candidate)) return candidate
  }
  return null
}

export function defaultWhich(name, env = {}) {
  return findeAusfuehrbare(name, env) != null
}
