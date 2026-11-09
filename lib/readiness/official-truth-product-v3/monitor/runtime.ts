import 'server-only'
import { createV3QueueCoordinator, createV3DiscoveryQueueCoordinator } from './queue'

/** No ENV switch, secret, client, RPC, provider, cron or fallback is constructed. */
export function officialTruthV3MonitoringRuntime() {
  const options = { storage: null, methodAuthority: null, now: () => new Date().toISOString(),
    invocationMilliseconds: 1000, backoffBaseMilliseconds: 1000, backoffMaxMilliseconds: 60_000 }
  return Object.freeze({
    status: 'unbound' as const,
    ruleQueue: createV3QueueCoordinator(options), discoveryQueue: createV3DiscoveryQueueCoordinator(options),
    worker: null, sourceMonitor: null, transitionCommit: null, scheduler: null,
  })
}
