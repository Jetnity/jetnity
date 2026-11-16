// Synthetic presentation inputs only. They contain no live account, booking,
// analytics result, session, secret, provider confirmation or stored preference.
import { buchungenAnsichtAus, type BuchungenAnsicht, type BuchungenFilter } from '@/lib/account/buchungen-abfrage'
import type { KontoBuchung } from '@/lib/account/buchungen'
import type { AnalyticsRange, TravelAnalyticsReport } from '@/lib/admin/analytics/report'
import { ausProblem } from '@/lib/admin/ladezustand'

export const ORIGINAL_DIAGNOSTIC = 'Synthetischer Quellfehler <unverändert>'
export const OBSERVED_AT = '2026-11-15T12:00:00.000Z'
export type AnalyticsFixtureState = 'ready' | 'zero' | 'unavailable' | 'partial'
export type BookingsFixtureState = BuchungenAnsicht['zustand'] | 'fehler503'

export const BOOKING: KontoBuchung = {
  id: '22222222-2222-4222-8222-222222222222',
  title: 'Synthetischer Flug & eigener Titel',
  kind: 'flight', artBezeichnung: 'Flug',
  startsOn: '2026-12-01', startsAt: '07:15', endsOn: null, endsAt: null,
  tripId: '11111111-1111-4111-8111-111111111111',
  tripTitle: 'Eigene Reise nach Zürich', tripStatus: 'archived', tripArchived: true,
}

export function analyticsFixture(state: AnalyticsFixtureState = 'ready', range: AnalyticsRange = 7): TravelAnalyticsReport {
  const rows = Array.from({ length: range }, (_, index) => ({
    date: new Date(Date.UTC(2026, 10, 15 - range + index + 1)).toISOString().slice(0, 10),
    trips: state === 'zero' ? 0 : index + 1,
  }))
  return {
    observedAt: OBSERVED_AT, range,
    metrics: state === 'unavailable' ? { kind: 'unavailable' }
      : state === 'partial' ? { kind: 'error', error: ausProblem({ status: 503, message: ORIGINAL_DIAGNOSTIC }) }
        : { kind: 'ready', data: state === 'zero' ? { total: 0, last30Days: 0, accountsWithTrip30Days: 0 } : { total: 1234, last30Days: 34, accountsWithTrip30Days: 12 } },
    series: state === 'unavailable' ? { kind: 'unavailable' } : { kind: 'ready', data: rows },
  }
}

export function bookingsFixture(state: BookingsFixtureState = 'liste', filters?: BuchungenFilter): BuchungenAnsicht {
  const filter: BuchungenFilter = filters ?? { titel: state === 'keine' ? 'synthetic-no-match' : null, art: null, archiv: 'alle' }
  const first = '/account/bookings?art=flight&archiv=archiviert'
  const repeat = `${first}&weiter=synthetic-continuation`
  if (state === 'ungueltig') {
    return buchungenAnsichtAus({ ok: false, grund: 'cursor', filter, ersteSeite: first, wiederholen: repeat })
  }
  if (state === 'fehler' || state === 'fehler503') {
    return buchungenAnsichtAus({ ok: false, grund: 'lesen', status: state === 'fehler503' ? 503 : 500, filter, ersteSeite: first, wiederholen: repeat })
  }
  return buchungenAnsichtAus({
    ok: true, filter, fortsetzung: state === 'fortsetzungLeer',
    buchungen: state === 'liste' ? [BOOKING] : [], weiter: state === 'liste' ? repeat : null,
    ersteSeite: first, wiederholen: repeat,
  })
}
