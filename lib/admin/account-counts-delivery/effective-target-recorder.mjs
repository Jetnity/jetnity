export function transportState() {
  if (!globalThis.__jetnityAccountCountsTransport) {
    globalThis.__jetnityAccountCountsTransport = {
      create: [],
      rpc: [],
      guard: [],
      cookies: 0,
    }
  }
  return globalThis.__jetnityAccountCountsTransport
}
