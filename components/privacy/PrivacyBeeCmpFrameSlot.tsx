import type { LiveContext } from '@/lib/privacy/privacybee-cmp/steuerung'

/** Isolated executable canary. It has no vendor URL. Unmounting removes the document. */
export function PrivacyBeeCmpFrameSlot({ live }: { live: LiveContext | null }) {
  if (!live) return null
  const payload = JSON.stringify({
    jetnityCanary: live.epoch,
    provider: live.providerId,
    scope: live.scopeKey,
  })
  const srcDoc = `<!doctype html><html><body><p>Lokaler Canary, kein Anbieter.</p><script>var info=${payload};var n=0;function send(kind){n+=1;parent.postMessage({jetnityCanary:info.jetnityCanary,provider:info.provider,scope:info.scope,kind:kind,n:n},"*");}send("active");setInterval(function(){send("pulse");},120);setTimeout(function(){send("delayed");},1500);</script></body></html>`
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
