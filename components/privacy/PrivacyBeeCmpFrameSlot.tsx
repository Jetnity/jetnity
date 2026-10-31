import type { LiveContext } from '@/lib/privacy/privacybee-cmp/steuerung'

/** Isolated executable canary. It has no vendor URL. Unmounting removes the document. */
export function PrivacyBeeCmpFrameSlot({ live }: { live: LiveContext | null }) {
  if (!live) return null
  const payload = JSON.stringify({
    jetnityCanary: live.epoch,
    provider: live.providerId,
    scope: live.scopeKey,
  })
  const srcDoc = `<!doctype html><html><body><p>Lokaler Canary, kein Anbieter.</p><script>parent.postMessage(${payload},"*")</script></body></html>`
  return (
    <iframe
      title="Synthetischer Einwilligungsrahmen"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      data-synthetic-frame="1"
      data-provider={live.providerId}
      data-generation={String(live.generation)}
      data-epoch={String(live.epoch)}
    />
  )
}
