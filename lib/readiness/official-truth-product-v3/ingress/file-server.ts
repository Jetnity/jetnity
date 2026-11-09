import 'server-only'

import { constants, promises as fs, type BigIntStats } from 'node:fs'
import type { FileHandle } from 'node:fs/promises'
import { OFFICIAL_TRUTH_V3_LIMITS } from '../contract'
import type { V3IngressBudget, V3IngressRootPin, V3ResearchIngressResult } from './types'
import { V3_RESEARCH_FILE_NAME } from './types'

type FileResult = Readonly<{ status: 'read'; text: string }>
  | Extract<V3ResearchIngressResult, { status: 'rejected' | 'unavailable' }>

function identityMatches(left: BigIntStats, right: BigIntStats): boolean {
  return left.dev === right.dev && left.ino === right.ino
}
function unchanged(left: BigIntStats, right: BigIntStats): boolean {
  return identityMatches(left, right) && left.size === right.size && left.nlink === right.nlink
    && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs
    && right.isFile() && right.nlink === 1n
}
function rootMatches(value: BigIntStats, pin: V3IngressRootPin, uid: number): boolean {
  return value.isDirectory() && value.dev.toString() === pin.device && value.ino.toString() === pin.inode
    && value.uid === BigInt(uid) && (value.mode & 0o022n) === 0n
}
function stopped(budget: V3IngressBudget): FileResult | null {
  const reason = budget.stopped()
  return reason === null ? null : Object.freeze({ status: 'unavailable', reason })
}
function reject(reason: 'unsafe_file' | 'file_changed' | 'bound_exceeded' | 'invalid_encoding'): FileResult {
  return Object.freeze({ status: 'rejected', reason })
}

/**
 * Linux-only descriptor-relative read. The runner pins the selected root inode;
 * /proc/self/fd keeps child lookups on that opened root despite ancestor renames.
 * No realpath/readFile race, portability fallback, directory scan or subprocess.
 */
export async function readV3ResearchFile(
  root: V3IngressRootPin, fileName: string, budget: V3IngressBudget,
): Promise<FileResult> {
  const early = stopped(budget)
  if (early) return early
  if (typeof fileName !== 'string' || !V3_RESEARCH_FILE_NAME.test(fileName)) {
    return Object.freeze({ status: 'rejected', reason: 'invalid_delivery' })
  }
  if (process.platform !== 'linux' || typeof process.getuid !== 'function') {
    return Object.freeze({ status: 'unavailable', reason: 'unsupported_platform' })
  }
  let directory: FileHandle | undefined
  let file: FileHandle | undefined
  let cleanupFailed = false
  const bytes = Buffer.alloc(OFFICIAL_TRUTH_V3_LIMITS.payloadBytes + 1)
  async function consume(): Promise<FileResult> {
    const uid = process.getuid!()
    const inspectedRoot = await fs.lstat(root.directory, { bigint: true })
    let aborted = stopped(budget); if (aborted) return aborted
    if (!rootMatches(inspectedRoot, root, uid)) return { status: 'unavailable', reason: 'unsafe_root' }
    directory = await fs.open(root.directory, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW)
    aborted = stopped(budget); if (aborted) return aborted
    const openedRoot = await directory.stat({ bigint: true })
    aborted = stopped(budget); if (aborted) return aborted
    if (!rootMatches(openedRoot, root, uid) || !identityMatches(inspectedRoot, openedRoot)) {
      return { status: 'unavailable', reason: 'unsafe_root' }
    }
    const anchoredPath = `/proc/self/fd/${directory.fd}/${fileName}`
    const inspectedFile = await fs.lstat(anchoredPath, { bigint: true })
    aborted = stopped(budget); if (aborted) return aborted
    if (!inspectedFile.isFile() || inspectedFile.nlink !== 1n) return reject('unsafe_file')
    if (inspectedFile.size > BigInt(OFFICIAL_TRUTH_V3_LIMITS.payloadBytes)) return reject('bound_exceeded')
    // NONBLOCK avoids hanging if the inspected regular file is raced into a FIFO.
    file = await fs.open(anchoredPath, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
    aborted = stopped(budget); if (aborted) return aborted
    const before = await file.stat({ bigint: true })
    aborted = stopped(budget); if (aborted) return aborted
    if (!before.isFile() || before.nlink !== 1n) return reject('unsafe_file')
    if (!unchanged(inspectedFile, before)) return reject('file_changed')
    if (before.size > BigInt(OFFICIAL_TRUTH_V3_LIMITS.payloadBytes)) return reject('bound_exceeded')
    let length = 0
    for (;;) {
      aborted = stopped(budget); if (aborted) return aborted
      // At most maximumBytes+1 bytes ever enter the owned buffer.
      const { bytesRead } = await file.read(bytes, length, Math.min(4096, bytes.length - length), length)
      aborted = stopped(budget); if (aborted) return aborted
      length += bytesRead
      if (length > OFFICIAL_TRUTH_V3_LIMITS.payloadBytes) return reject('bound_exceeded')
      if (bytesRead === 0) break
    }
    const after = await file.stat({ bigint: true })
    aborted = stopped(budget); if (aborted) return aborted
    const pathAfter = await fs.lstat(anchoredPath, { bigint: true })
    aborted = stopped(budget); if (aborted) return aborted
    const rootAfter = await directory.stat({ bigint: true })
    aborted = stopped(budget); if (aborted) return aborted
    if (!rootMatches(rootAfter, root, uid)) return { status: 'unavailable', reason: 'unsafe_root' }
    if (!unchanged(before, after) || !unchanged(before, pathAfter) || before.size !== BigInt(length)) {
      return reject('file_changed')
    }
    try {
      // Keep BOM visible and reject it; neither strip it nor replace invalid UTF8.
      const original = bytes.subarray(0, length)
      const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(original)
      if (text.charCodeAt(0) === 0xfeff || !Buffer.from(text, 'utf8').equals(original)) return reject('invalid_encoding')
      return Object.freeze({ status: 'read', text })
    } catch { return reject('invalid_encoding') }
  }
  let result: FileResult
  try { result = await consume() }
  catch { result = stopped(budget) ?? Object.freeze({ status: 'unavailable', reason: 'filesystem_unavailable' }) }
  finally {
    // Cleanup is owned even after abort; no detached close/read promises.
    for (const handle of [file, directory]) {
      if (handle) { try { await handle.close() } catch { cleanupFailed = true } }
    }
    bytes.fill(0)
  }
  if (cleanupFailed) return Object.freeze({ status: 'unavailable', reason: 'cleanup_failed' })
  return stopped(budget) ?? Object.freeze(result)
}
