const stub = new URL('./route-stubs.mjs', import.meta.url).href
export async function resolve(specifier, context, nextResolve) {
  if (/\/(?:auth\/admin-guard|supabase\/server)(?:\.ts)?$/.test(specifier)) return { url: stub, shortCircuit: true }
  return nextResolve(specifier, context)
}
