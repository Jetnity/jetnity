import { Seitenkopf } from '@/components/ui/seitenkopf'
import { REGISTRY_COPY } from '@/lib/traveller/account-registry-copy'

/** Derselbe Kopf beim Laden und mit Liste, damit nichts springt. */
export function ReisendeKopf() {
  return (
    <Seitenkopf kicker={REGISTRY_COPY.seitenEyebrow} titel={REGISTRY_COPY.seitenTitel}>
      <p>{REGISTRY_COPY.seitenLead}</p>
      <p className="mt-2 text-meta">{REGISTRY_COPY.dualAuthorityHinweis}</p>
    </Seitenkopf>
  )
}
