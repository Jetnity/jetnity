import { ReisendeKopf } from '@/components/account/ReisendeKopf'
import { Ladeplatzhalter } from '@/components/ui/ladeplatzhalter'
import { REGISTRY_COPY } from '@/lib/traveller/account-registry-copy'

export default function AccountReisendeLaden() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <ReisendeKopf />
        <Ladeplatzhalter sichtbar zeilen={2} status={REGISTRY_COPY.ladenTitel} className="mt-8 max-w-3xl" />
      </div>
    </main>
  )
}
