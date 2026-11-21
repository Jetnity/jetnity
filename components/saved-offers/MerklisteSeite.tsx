import SavedOffers from '@/components/saved-offers/SavedOffers'
import { Hinweis } from '@/components/ui/hinweis'
import { Seitenkopf } from '@/components/ui/seitenkopf'
import type { SavedOffer } from '@/lib/saved-offers/contract'

type MerklisteErgebnis = { ok: true; value: SavedOffer[] } | { ok: false; message: string; anmeldung?: true }

const AKTION = 'inline-flex min-h-11 items-center font-semibold text-foreground underline underline-offset-4'

/** Ein Lesefehler ist keine leere Merkliste und keine Abmeldung (AGENTS.md 15). */
export default function MerklisteSeite({ ergebnis }: { ergebnis: MerklisteErgebnis }) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
      <Seitenkopf kicker="Konto" titel="Meine Merkliste" className="mb-8">
        <p>Konkrete Angebote für später – in deinem Konto und auf deinen Geräten verfügbar.</p>
      </Seitenkopf>
      {ergebnis.ok ? (
        <SavedOffers offers={ergebnis.value} />
      ) : (
        <Hinweis
          ton={ergebnis.anmeldung ? 'aufgabe' : 'dringend'}
          role={ergebnis.anmeldung ? 'status' : 'alert'}
          aktion={
            ergebnis.anmeldung ? (
              <a href="/login?next=%2Faccount%2Fmerkliste" className={AKTION}>Zur Anmeldung</a>
            ) : (
              <a href="/account/merkliste" className={AKTION}>Erneut laden</a>
            )
          }
        >
          <p>{ergebnis.message}</p>
        </Hinweis>
      )}
    </main>
  )
}
