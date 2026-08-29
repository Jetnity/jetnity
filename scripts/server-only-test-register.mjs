import Module from 'node:module'
import { fileURLToPath } from 'node:url'

import { register } from 'node:module'

register(new URL('./server-only-test-loader.mjs', import.meta.url).href)

const stub = fileURLToPath(new URL('./server-only-empty.cjs', import.meta.url))
const original = Module._resolveFilename
Module._resolveFilename = function resolveServerOnly(request, parent, isMain, options) {
  if (request === 'server-only') return stub
  return original.call(this, request, parent, isMain, options)
}
