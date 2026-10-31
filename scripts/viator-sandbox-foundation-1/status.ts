/**
 * Offline status for the Viator sandbox foundation.
 * Prints whether a key is present. Never prints the key and never calls Viator.
 */
import {
  VIATOR_MAX_CACHE_SECONDS,
  VIATOR_NOINDEX_CONTRACT,
  VIATOR_SANDBOX_API_KEY_ENV,
  VIATOR_SANDBOX_CALLS_ENV,
  VIATOR_SANDBOX_ORIGIN,
} from '@/lib/providers/viator/activities/contracts'
import { viatorSandboxZugang } from '@/lib/providers/viator/activities/zugang'

const key = process.env[VIATOR_SANDBOX_API_KEY_ENV]
const zugang = viatorSandboxZugang({
  VERCEL_ENV: process.env.VERCEL_ENV,
  VIATOR_SANDBOX_CALLS: process.env[VIATOR_SANDBOX_CALLS_ENV],
  VIATOR_SANDBOX_API_KEY: key,
})

console.log(
  JSON.stringify({
    liveSandbox: 'BLOCKED',
    keyPresent: typeof key === 'string' && key.length > 0,
    keyEnvName: VIATOR_SANDBOX_API_KEY_ENV,
    zugang: zugang.ok ? 'enabled_but_script_does_not_call_network' : zugang.reason,
    sandboxOrigin: VIATOR_SANDBOX_ORIGIN,
    maxCacheSeconds: VIATOR_MAX_CACHE_SECONDS,
    noindex: VIATOR_NOINDEX_CONTRACT.value,
    productionRequests: false,
  }),
)
