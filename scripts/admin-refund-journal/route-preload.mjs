import Module, { register } from 'node:module'
import { fileURLToPath } from 'node:url'
register(new URL('./route-hooks.mjs', import.meta.url))
const stub = fileURLToPath(new URL('./route-stubs.mjs', import.meta.url))
const original = Module._resolveFilename
Module._resolveFilename = function resolveRefundJournal(request, parent, isMain, options) {
  if (/\/(?:auth\/admin-guard|supabase\/server)(?:\.ts)?$/.test(request)) return stub
  return original.call(this, request, parent, isMain, options)
}
