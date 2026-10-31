import type { LiveContext } from '@/lib/privacy/privacybee-cmp/steuerung'

/** Isolated local document. Removing `live` removes the frame. No provider URL. */
export function PrivacyBeeCmpFrameSlot({ live }: { live: LiveContext | null }) {
  if (!live) return null
  const srcDoc = `<!doctype html><html><body><p data-canary="${live.generation}">${live.providerId}</p></body></html>`
  return (
    <iframe
      title="Synthetischer Einwilligungsrahmen"
      sandbox=""
      srcDoc={srcDoc}
      data-synthetic-frame="1"
      data-provider={live.providerId}
      data-generation={String(live.generation)}
    />
  )
}
