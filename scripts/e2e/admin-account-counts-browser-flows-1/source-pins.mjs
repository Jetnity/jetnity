#!/usr/bin/env node
// Read-only reuse of accepted #556 working-tree pins, including caller-status.

import {
  assertPinnedSources,
  leseSourceManifest,
} from '../admin-account-counts-browser-acceptance-1/source-manifest.mjs'
import { BLOB_PINS, SOURCE_PATHS } from './constants.mjs'

export function detectProductDrift() {
  const manifest = leseSourceManifest()
  assertPinnedSources(manifest)
  if (SOURCE_PATHS.callerStatus !== 'lib/admin/account-counts-delivery/caller-status.ts') {
    throw new Error('caller-status path drifted')
  }
  if (!BLOB_PINS.callerStatus) {
    throw new Error('caller-status pin missing')
  }
  if (manifest.files.callerStatus?.workingTreeBlob !== BLOB_PINS.callerStatus) {
    throw new Error('caller-status working-tree blob drifted')
  }
  return {
    identityKind: manifest.identityKind,
    callerStatus: manifest.files.callerStatus.workingTreeBlob,
    reader: manifest.files.reader.workingTreeBlob,
    countsUi: manifest.files.countsUi.workingTreeBlob,
    loginPage: manifest.files.loginPage.workingTreeBlob,
  }
}
