/** Historical bytes bound to this controlled worker's loaded implementation. */
export type ControlledImplementationSnapshot = Readonly<{
  schema: 'ot-controlled-implementation-snapshot-v1'
  files: readonly Readonly<{ path: string; utf8: string }>[]
}>

/**
 * Ordinary module loading never grants snapshot authority. The controlled build
 * replaces this module with a closure-local, one-shot accessor in its worker.
 * There is deliberately no setter, token constructor, argument or global hook.
 */
export function consumeControlledImplementationSnapshot(): ControlledImplementationSnapshot | null {
  return null
}
