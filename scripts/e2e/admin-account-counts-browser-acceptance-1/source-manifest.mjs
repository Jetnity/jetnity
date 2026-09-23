#!/usr/bin/env node
// Pin accepted product sources. Refuse the reduced #550 auth.users bootstrap
// as a GoTrue overlay. This is not a claim that those objects are applied.

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PINS, ROOT, SOURCE_PATHS } from './constants.mjs'

export function sha256Datei(relPath) {
  return createHash('sha256').update(readFileSync(join(ROOT, relPath))).digest('hex')
}

export function gitBlob(relPath, rev = 'HEAD') {
  return execFileSync('git', ['rev-parse', `${rev}:${relPath}`], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim()
}

export function leseSourceManifest({ rev = 'HEAD' } = {}) {
  return {
    rev,
    files: {
      producer: {
        path: SOURCE_PATHS.producer,
        sha256: sha256Datei(SOURCE_PATHS.producer),
        blob: gitBlob(SOURCE_PATHS.producer, rev),
      },
      wrapper: {
        path: SOURCE_PATHS.wrapper,
        sha256: sha256Datei(SOURCE_PATHS.wrapper),
        blob: gitBlob(SOURCE_PATHS.wrapper, rev),
      },
      bootstrap: {
        path: SOURCE_PATHS.bootstrap,
        sha256: sha256Datei(SOURCE_PATHS.bootstrap),
        note: 'Identified only so this harness can refuse overlaying it on GoTrue.',
      },
      contract: { path: SOURCE_PATHS.contract, blob: gitBlob(SOURCE_PATHS.contract, rev) },
      parser: { path: SOURCE_PATHS.parser, blob: gitBlob(SOURCE_PATHS.parser, rev) },
      activation: { path: SOURCE_PATHS.activation, blob: gitBlob(SOURCE_PATHS.activation, rev) },
      reader: { path: SOURCE_PATHS.reader, blob: gitBlob(SOURCE_PATHS.reader, rev) },
      server: { path: SOURCE_PATHS.server, blob: gitBlob(SOURCE_PATHS.server, rev) },
      guard: { path: SOURCE_PATHS.guard, blob: gitBlob(SOURCE_PATHS.guard, rev) },
      adminAal: { path: SOURCE_PATHS.adminAal, blob: gitBlob(SOURCE_PATHS.adminAal, rev) },
      adminAccess: { path: SOURCE_PATHS.adminAccess, blob: gitBlob(SOURCE_PATHS.adminAccess, rev) },
      roles: { path: SOURCE_PATHS.roles, blob: gitBlob(SOURCE_PATHS.roles, rev) },
      loginPage: { path: SOURCE_PATHS.loginPage, blob: gitBlob(SOURCE_PATHS.loginPage, rev) },
      loginActions: { path: SOURCE_PATHS.loginActions, blob: gitBlob(SOURCE_PATHS.loginActions, rev) },
      mfaPage: { path: SOURCE_PATHS.mfaPage, blob: gitBlob(SOURCE_PATHS.mfaPage, rev) },
      mfaStepUp: { path: SOURCE_PATHS.mfaStepUp, blob: gitBlob(SOURCE_PATHS.mfaStepUp, rev) },
      adminHome: { path: SOURCE_PATHS.adminHome, blob: gitBlob(SOURCE_PATHS.adminHome, rev) },
      countsUi: { path: SOURCE_PATHS.countsUi, blob: gitBlob(SOURCE_PATHS.countsUi, rev) },
      securityPage: { path: SOURCE_PATHS.securityPage, blob: gitBlob(SOURCE_PATHS.securityPage, rev) },
      securityMfa: { path: SOURCE_PATHS.securityMfa, blob: gitBlob(SOURCE_PATHS.securityMfa, rev) },
      config: { path: SOURCE_PATHS.config, blob: gitBlob(SOURCE_PATHS.config, rev) },
    },
  }
}

export function assertPinnedSources(manifest) {
  const { files } = manifest
  const fehlers = []
  if (files.producer.sha256 !== PINS.producerSha256) {
    fehlers.push(`producer sha256 ${files.producer.sha256} != ${PINS.producerSha256}`)
  }
  if (files.wrapper.sha256 !== PINS.wrapperSha256) {
    fehlers.push(`wrapper sha256 ${files.wrapper.sha256} != ${PINS.wrapperSha256}`)
  }
  if (files.contract.blob !== PINS.contractBlob) {
    fehlers.push(`contract blob ${files.contract.blob} != ${PINS.contractBlob}`)
  }
  if (files.parser.blob !== PINS.parserBlob) {
    fehlers.push(`parser blob ${files.parser.blob} != ${PINS.parserBlob}`)
  }
  if (files.activation.blob !== PINS.activationBlob) {
    fehlers.push(`activation blob ${files.activation.blob} != ${PINS.activationBlob}`)
  }
  if (files.reader.blob !== PINS.readerBlob) {
    fehlers.push(`reader blob ${files.reader.blob} != ${PINS.readerBlob}`)
  }
  if (files.bootstrap.sha256 !== PINS.bootstrapSha256) {
    fehlers.push(`bootstrap identity drifted; refuse to treat an unknown file as the #550 fixture`)
  }
  if (fehlers.length) {
    throw new Error(`Source pin mismatch:\n${fehlers.join('\n')}`)
  }
  return true
}

export function refuseBootstrapOverlay({ plannedSqlPaths = [], target = 'gotrue' } = {}) {
  const bootstrap = SOURCE_PATHS.bootstrap
  const hits = plannedSqlPaths.filter((path) => String(path).endsWith(bootstrap) || String(path).includes(bootstrap))
  if (hits.length && target === 'gotrue') {
    throw new Error(
      `Refusing to overlay ${bootstrap} onto a real GoTrue auth.users catalog. That file is a reduced synthetic SQL fixture from #550, not a full Supabase initialization script.`,
    )
  }
  return { ok: true, refused: hits, target }
}
