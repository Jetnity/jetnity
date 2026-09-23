#!/usr/bin/env node
// Authoritative live ownership registry. Handles are recorded BEFORE
// fallible acquisition and updated on every restart. Partial network,
// container, volume, browser and child handles stay visible to cleanup.

export function createOwnershipRegistry({
  runId = null,
  privateHome = null,
  evidenceDir = null,
} = {}) {
  const browsers = new Map()
  return {
    runId,
    privateHome,
    evidenceDir,
    hadFallibleAcquisition: false,
    stopUnknown: false,
    network: null,
    containers: [],
    volumes: [],
    stackChild: null,
    stack: null,
    appChild: null,
    app: null,
    observer: null,
    browsers,
    browserRegistry: browsers,
    workdir: null,
    checkoutDir: null,
    cliBin: null,
    dockerBin: null,
    childEnv: null,
    execFile: null,
  }
}

export function authoritativeBrowserRegistry(registry, fallback = null) {
  if (!registry) return fallback
  if (!(registry.browsers instanceof Map)) registry.browsers = new Map()
  if (registry.browserRegistry instanceof Map && registry.browserRegistry !== registry.browsers) {
    for (const [id, handle] of registry.browserRegistry) {
      if (!registry.browsers.has(id)) registry.browsers.set(id, handle)
    }
  }
  registry.browserRegistry = registry.browsers
  return registry.browsers
}

export function markFallible(registry) {
  if (registry) registry.hadFallibleAcquisition = true
  return registry
}

export function markStopUnknown(registry) {
  if (registry) registry.stopUnknown = true
  return registry
}

export function registerHandle(registry, field, value) {
  if (registry) registry[field] = value
  return value
}

export function recordDockerResources(registry, { containers = [], volumes = [] } = {}) {
  if (!registry) return { containers, volumes }
  const seenContainers = new Set((registry.containers || []).map((item) => item.id || item.Id))
  const seenVolumes = new Set((registry.volumes || []).map((item) => item.name || item.Name))
  for (const item of containers) {
    const id = item.id || item.Id
    if (id && !seenContainers.has(id)) {
      registry.containers.push(item)
      seenContainers.add(id)
    }
  }
  for (const item of volumes) {
    const name = item.name || item.Name
    if (name && !seenVolumes.has(name)) {
      registry.volumes.push(item)
      seenVolumes.add(name)
    }
  }
  return { containers: registry.containers, volumes: registry.volumes }
}

export function syncAppOwnership(registry, app) {
  if (!registry) return app
  registry.app = app || null
  registry.appChild = app?.child || null
  return app
}

export function registryHasLiveHandles(registry) {
  if (!registry) return false
  return Boolean(
    registry.hadFallibleAcquisition
    || registry.stackChild
    || registry.appChild
    || registry.observer
    || registry.network?.name
    || (registry.containers && registry.containers.length)
    || (registry.volumes && registry.volumes.length)
    || (registry.browsers && registry.browsers.size)
  )
}
