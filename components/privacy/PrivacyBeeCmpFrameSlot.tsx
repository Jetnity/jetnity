import type { LiveFrame } from '@/lib/privacy/privacybee-cmp/rahmen'

/** Local stand-in for a later isolated frame. Not an iframe and not a provider. */
export function PrivacyBeeCmpFrameSlot({ live }: { live: LiveFrame | null }) {
  if (!live) return null
  return (
    <div data-synthetic-frame="1" data-provider={live.providerId} data-generation={String(live.generation)}>
      Synthetischer Rahmen, kein Anbieter.
    </div>
  )
}
