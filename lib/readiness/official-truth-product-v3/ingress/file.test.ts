import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import type { FileHandle } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import test, { type TestContext } from 'node:test'
import { fixture } from './test-support/fixture'

async function trackHandles(t: TestContext, action?: (handle: FileHandle, path: string) => void) {
  const opened: FileHandle[] = []
  const open = fs.open.bind(fs)
  t.mock.method(fs, 'open', async (...args: Parameters<typeof fs.open>) => {
    const handle = await open(...args)
    opened.push(handle)
    action?.(handle, String(args[0]))
    return handle
  })
  return async () => {
    assert.ok(opened.length > 0)
    for (const handle of opened) {
      assert.equal(handle.fd, -1)
      await assert.rejects(handle.stat(), { code: 'EBADF' })
    }
  }
}

test('N1 reads real whitespace UTF8 bytes exactly, closes both handles before capture, and creates no source receipt', async (t) => {
  const f = await fixture(t)
  const closed = await trackHandles(t)
  const capture = f.intake.port.capture
  f.intake.port.capture = async (...args) => { await closed(); return capture(...args) }
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'recorded', reference: f.expected })
  assert.equal(f.intake.captures[0].text, f.text)
  assert.equal(f.intake.rows.size, 1)
  assert.equal(f.originals.control.extracts, 0)
  await closed()
})

test('N1 rejects traversal, nested, absolute, hidden, extension, control and oversized names before IO', async (t) => {
  const f = await fixture(t)
  let io = 0
  t.mock.method(fs, 'lstat', async () => { io++; throw new Error('must not read') })
  t.mock.method(fs, 'open', async () => { io++; throw new Error('must not open') })
  for (const fileName of ['../proposal-1.json', 'nested/proposal-1.json', '/tmp/proposal-1.json',
    '.proposal.json', 'proposal.JSON', 'proposal.json.gz', 'a..json', 'a\\b.json', 'a\0.json',
    'a\n.json', 'a'.repeat(121) + '.json', 'https://example.test/a.json']) {
    assert.deepEqual(await f.ingress().deliver({ ...f.delivery, fileName }), { status: 'rejected', reason: 'invalid_delivery' })
  }
  assert.equal(io, 0)
  assert.equal(f.intake.captures.length, 0)
})

test('N1 requires closed delivery data and never invokes property getters', async (t) => {
  const f = await fixture(t)
  let getters = 0
  const getter = Object.defineProperty({ binding: f.binding }, 'fileName', { enumerable: true,
    get() { getters++; return f.fileName } })
  const values = [getter, { ...f.delivery, approved: true }, { fileName: f.fileName, binding: { ...f.binding, authority: 'owner' } },
    Object.assign(Object.create({ extra: true }), f.delivery), null, []]
  let io = 0
  t.mock.method(fs, 'lstat', async () => { io++; throw new Error('must not read') })
  for (const value of values) assert.deepEqual(await f.ingress().deliver(value), { status: 'rejected', reason: 'invalid_delivery' })
  assert.equal(getters, 0)
  assert.equal(io, 0)
})

for (const kind of ['symlink', 'hardlink', 'directory', 'fifo'] as const) {
  test(`N1 refuses actual ${kind} before capture with all handles closed`, async (t) => {
    const f = await fixture(t)
    const target = join(f.parent, 'original.json')
    await fs.rename(f.path, target)
    if (kind === 'symlink') await fs.symlink(target, f.path)
    if (kind === 'hardlink') await fs.link(target, f.path)
    if (kind === 'directory') await fs.mkdir(f.path)
    // Only own synthetic FIFO creation uses a shell-free test subprocess.
    if (kind === 'fifo') execFileSync('mkfifo', [f.path])
    const closed = await trackHandles(t)
    assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'rejected', reason: 'unsafe_file' })
    assert.equal(f.intake.captures.length, 0)
    await closed()
  })
}

test('N1 O_NONBLOCK rejects a regular-file-to-FIFO race without waiting for a writer', async (t) => {
  const f = await fixture(t)
  const open = fs.open.bind(fs)
  const opened: FileHandle[] = []
  let raced = false
  t.mock.method(fs, 'open', async (...args: Parameters<typeof fs.open>) => {
    if (String(args[0]).startsWith('/proc/self/fd/') && !raced) {
      raced = true
      await fs.unlink(f.path)
      execFileSync('mkfifo', [f.path])
    }
    const handle = await open(...args); opened.push(handle); return handle
  })
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'rejected', reason: 'unsafe_file' })
  assert.ok(raced)
  assert.equal(f.intake.captures.length, 0)
  assert.equal(opened.length, 2)
  assert.ok(opened.every((handle) => handle.fd === -1))
})

test('N1 refuses a symlink raced into the opened child path', async (t) => {
  const f = await fixture(t)
  const outside = join(f.parent, 'outside.json')
  await fs.writeFile(outside, f.text)
  const open = fs.open.bind(fs)
  let raced = false
  t.mock.method(fs, 'open', async (...args: Parameters<typeof fs.open>) => {
    if (String(args[0]).startsWith('/proc/self/fd/') && !raced) {
      raced = true; await fs.unlink(f.path); await fs.symlink(outside, f.path)
    }
    return open(...args)
  })
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'unavailable', reason: 'filesystem_unavailable' })
  assert.ok(raced)
  assert.equal(f.intake.captures.length, 0)
})

test('N1 rejects wrong root pin, symlink root, writable staging and root replacement before open', async (t) => {
  const f = await fixture(t)
  assert.deepEqual(await f.ingress({ root: { ...f.root, inode: String(BigInt(f.root.inode) + 1n) } }).deliver(f.delivery),
    { status: 'unavailable', reason: 'unsafe_root' })
  const alias = join(f.parent, 'alias')
  await fs.symlink(f.directory, alias)
  assert.deepEqual(await f.ingress({ root: { ...f.root, directory: alias } }).deliver(f.delivery),
    { status: 'unavailable', reason: 'unsafe_root' })
  await fs.chmod(f.directory, 0o770)
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'unavailable', reason: 'unsafe_root' })
  await fs.chmod(f.directory, 0o700)
  const open = fs.open.bind(fs)
  let raced = false
  t.mock.method(fs, 'open', async (...args: Parameters<typeof fs.open>) => {
    if (args[0] === f.directory && !raced) {
      raced = true; await fs.rename(f.directory, join(f.parent, 'old-root'))
      await fs.mkdir(f.directory, { mode: 0o700 }); await fs.writeFile(f.path, f.text)
    }
    return open(...args)
  })
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'unavailable', reason: 'unsafe_root' })
  assert.ok(raced)
  assert.equal(f.intake.captures.length, 0)
})

test('N1 held directory descriptor stays on the pinned root when its pathname is replaced', async (t) => {
  const f = await fixture(t)
  const open = fs.open.bind(fs)
  let raced = false
  t.mock.method(fs, 'open', async (...args: Parameters<typeof fs.open>) => {
    if (String(args[0]).startsWith('/proc/self/fd/') && !raced) {
      raced = true
      await fs.rename(f.directory, join(f.parent, 'selected-old'))
      await fs.mkdir(f.directory, { mode: 0o700 })
      await fs.writeFile(f.path, 'outside replacement must never be captured')
    }
    return open(...args)
  })
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'recorded', reference: f.expected })
  assert.ok(raced)
  assert.equal(f.intake.captures[0].text, f.text)
})

for (const change of ['replace', 'in_place', 'grow', 'unlink', 'new_hardlink'] as const) {
  test(`N1 refuses ${change} during an actual descriptor read`, async (t) => {
    const f = await fixture(t)
    let changed = false
    const closed = await trackHandles(t, (handle, path) => {
      if (!path.startsWith('/proc/self/fd/')) return
      const read = handle.read.bind(handle)
      t.mock.method(handle, 'read', async (buffer: Buffer, offset: number, length: number, position: number) => {
        const result = await read(buffer, offset, length, position)
        if (!changed) {
          changed = true
          if (change === 'replace') { await fs.unlink(f.path); await fs.writeFile(f.path, f.text) }
          if (change === 'in_place') await fs.writeFile(f.path, f.text.replace('"schema": 3', '"schema": 2'))
          if (change === 'grow') await fs.appendFile(f.path, ' ')
          if (change === 'unlink') await fs.unlink(f.path)
          if (change === 'new_hardlink') await fs.link(f.path, join(f.parent, 'linked.json'))
        }
        return result
      })
    })
    const result = await f.ingress().deliver(f.delivery)
    assert.equal(result.status, change === 'unlink' ? 'unavailable' : 'rejected')
    assert.equal(f.intake.captures.length, 0)
    assert.ok(changed)
    await closed()
  })
}

test('N1 observes at most 65537 actual bytes when a file grows during reading', async (t) => {
  const f = await fixture(t)
  let readBytes = 0, grown = false
  const closed = await trackHandles(t, (handle, path) => {
    if (!path.startsWith('/proc/self/fd/')) return
    const read = handle.read.bind(handle)
    t.mock.method(handle, 'read', async (buffer: Buffer, offset: number, length: number, position: number) => {
      const result = await read(buffer, offset, length, position)
      readBytes += result.bytesRead
      if (!grown) { grown = true; await fs.appendFile(f.path, Buffer.alloc(80_000, 0x20)) }
      return result
    })
  })
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'rejected', reason: 'bound_exceeded' })
  assert.equal(readBytes, 65_537)
  assert.equal(f.intake.captures.length, 0)
  await closed()
})

test('N1 refuses cleanup failure before capture and still closes the remaining root handle', async (t) => {
  const f = await fixture(t)
  const closed = await trackHandles(t, (handle, path) => {
    if (!path.startsWith('/proc/self/fd/')) return
    const close = handle.close.bind(handle)
    t.mock.method(handle, 'close', async () => { await close(); throw new Error('synthetic close acknowledgement loss') })
  })
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'unavailable', reason: 'cleanup_failed' })
  assert.equal(f.intake.captures.length, 0)
  await closed()
})

test('N1 abort after a real read drains IO and closes both handles without capture', async (t) => {
  const f = await fixture(t)
  const abort = new AbortController()
  const closed = await trackHandles(t, (handle, path) => {
    if (!path.startsWith('/proc/self/fd/')) return
    const read = handle.read.bind(handle)
    t.mock.method(handle, 'read', async (buffer: Buffer, offset: number, length: number, position: number) => {
      const result = await read(buffer, offset, length, position); abort.abort(); return result
    })
  })
  assert.deepEqual(await f.ingress().deliver(f.delivery, abort.signal), { status: 'unavailable', reason: 'aborted' })
  assert.equal(f.intake.captures.length, 0)
  await closed()
})

test('N1 reports missing input with fixed categories, no path or file contents', async (t) => {
  const f = await fixture(t)
  await fs.unlink(f.path)
  const closed = await trackHandles(t)
  assert.deepEqual(await f.ingress().deliver(f.delivery), { status: 'unavailable', reason: 'filesystem_unavailable' })
  await closed()
})
