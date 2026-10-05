// Resolves `server-only` for node:test. Production Next compile-time still
// blocks client bundles of any module that imports `server-only`.

export function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    return {
      shortCircuit: true,
      url: new URL('./server-only-empty.mjs', import.meta.url).href,
    }
  }
  return nextResolve(specifier, context)
}
