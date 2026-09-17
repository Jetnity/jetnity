// Nur für /ui-audit/account. Fixtures nie im Produktspeicher.
//
// Bewusst eine Server-Komponente, obwohl sie nur Fixtures zeigt. Der Audit
// soll denselben Weg messen wie das Produkt, und dort werden die Länderlabel
// auf dem Server gebildet und als Prop weitergereicht. Rechnete der Audit sie
// im Browser nach, prüfte er einen Weg, den es nicht gibt – und stolperte
// nebenbei über `Intl.DisplayNames`: Node und Chromium schreiben vier
// Ländernamen verschieden (FK, HK, MO, PS), was beim Hydrieren als
// Textabweichung gilt und die Seite verwerfen lässt.

import AccountBesuche from '@/components/account/AccountBesuche'
import AccountBuchungen from '@/components/account/AccountBuchungen'
import AccountNavigation from '@/components/account/AccountNavigation'
import AccountUebersicht from '@/components/account/AccountUebersicht'
import type { Besuch } from '@/lib/account/besuche'
import type { KontoBuchung } from '@/lib/account/buchungen'
import { naechsteReiseAus } from '@/lib/account/naechste-reise'
import { weltBesuchtAbleiten } from '@/lib/account/welt-ansicht'
import { weltLaenderAbleiten, type WeltGeometrie } from '@/lib/account/welt-laender'
import { worldMapAbleiten } from '@/lib/account/world-map'
import type { TripSummary } from '@/types/trips'

const REISE: TripSummary = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Lissabon',
  origin: 'Zürich',
  startDate: '2026-09-12',
  endDate: '2026-09-16',
  travellers: 2,
  currency: 'CHF',
  budgetAmount: null,
  status: 'planned',
  updatedAt: '2026-08-20T10:00:00.000Z',
  stages: [
    {
      name: 'Lissabon',
      position: 1,
      countryCode: 'PT',
      placeId: 'geonames:2267057',
      latitude: 38.7223,
      longitude: -9.1393,
    },
  ],
  stageCount: 1,
  dayCount: 5,
  itemCount: 0,
}

/**
 * Zweite Reise mit demselben Titel und derselben `placeId`. Sie prüft, dass
 * gleich betitelte eigene Reisen zwei unterscheidbare Aktionen bleiben und
 * nicht über den Titel zusammengelegt werden.
 */
const REISE_GLEICHER_TITEL: TripSummary = {
  id: '33333333-3333-4333-8333-333333333333',
  title: 'Lissabon',
  origin: 'Zürich',
  startDate: '2027-04-02',
  endDate: '2027-04-09',
  travellers: 2,
  currency: 'CHF',
  budgetAmount: null,
  status: 'draft',
  updatedAt: '2026-08-22T10:00:00.000Z',
  stages: [
    {
      name: 'Lisboa',
      position: 1,
      countryCode: 'PT',
      placeId: 'geonames:2267057',
      latitude: 38.7223,
      longitude: -9.1393,
    },
    {
      name: 'Porto',
      position: 2,
      countryCode: 'PT',
      placeId: 'geonames:2735943',
      latitude: 41.1496,
      longitude: -8.6109,
    },
  ],
  stageCount: 2,
  dayCount: 8,
  itemCount: 0,
}

/** Dichte Marker, eine Etappe ohne Koordinaten, eine ohne Ländercode. */
const REISE_JAPAN: TripSummary = {
  id: '44444444-4444-4444-8444-444444444444',
  title: 'Japan im Frühling',
  origin: 'Zürich',
  startDate: '2027-03-28',
  endDate: '2027-04-11',
  travellers: 2,
  currency: 'CHF',
  budgetAmount: null,
  status: 'planned',
  updatedAt: '2026-08-23T10:00:00.000Z',
  stages: [
    {
      name: 'Tokio',
      position: 1,
      countryCode: 'JP',
      placeId: 'geonames:1850147',
      latitude: 35.6895,
      longitude: 139.6917,
    },
    {
      name: 'Kyoto',
      position: 2,
      countryCode: 'JP',
      placeId: 'geonames:1857910',
      latitude: 35.0116,
      longitude: 135.7681,
    },
    { name: 'Osaka', position: 3, countryCode: 'JP', placeId: 'geonames:1853909' },
    {
      name: 'Auckland',
      position: 4,
      placeId: 'geonames:2193733',
      latitude: -36.8485,
      longitude: 174.7633,
    },
  ],
  stageCount: 4,
  dayCount: 15,
  itemCount: 0,
}

/**
 * Zwei geplante Etappen in Ländern ohne zeichenbare Fläche. Zusammen mit dem
 * bestätigten Besuch in Hongkong deckt das Fixture alle drei Formen der
 * Ersatzmarke ab: Malta nur geplant, Hongkong besucht und geplant, Singapur
 * nur besucht.
 */
const REISE_KLEINSTAATEN: TripSummary = {
  id: '66666666-6666-4666-8666-666666666666',
  title: 'Malta und Hongkong',
  origin: 'Zürich',
  startDate: '2028-02-04',
  endDate: '2028-02-18',
  travellers: 1,
  currency: 'CHF',
  budgetAmount: null,
  status: 'draft',
  updatedAt: '2026-08-26T10:00:00.000Z',
  stages: [
    {
      name: 'Valletta',
      position: 1,
      countryCode: 'MT',
      placeId: 'geonames:2562305',
      latitude: 35.8997,
      longitude: 14.5147,
    },
    {
      name: 'Hongkong',
      position: 2,
      countryCode: 'HK',
      placeId: 'geonames:1819729',
      latitude: 22.2783,
      longitude: 114.1747,
    },
  ],
  stageCount: 2,
  dayCount: 15,
  itemCount: 0,
}

/**
 * Eine geplante Etappe in einem grossen Land, das zugleich bestätigt besucht
 * ist. Auf Weltmassstab ist Brasilien gross genug, dass der überlagerte
 * Zustand – volle Füllung *und* Schraffur – ohne Lupe erkennbar bleibt.
 */
const REISE_BRASILIEN: TripSummary = {
  id: '55555555-5555-4555-8555-555555555555',
  title: 'Brasilien',
  origin: 'Zürich',
  startDate: '2027-11-02',
  endDate: '2027-11-20',
  travellers: 2,
  currency: 'CHF',
  budgetAmount: null,
  status: 'draft',
  updatedAt: '2026-08-25T10:00:00.000Z',
  stages: [
    {
      name: 'São Paulo',
      position: 1,
      countryCode: 'BR',
      placeId: 'geonames:3448439',
      latitude: -23.5475,
      longitude: -46.6361,
    },
  ],
  stageCount: 1,
  dayCount: 19,
  itemCount: 0,
}

const BUCHUNG: KontoBuchung = {
  id: 'booking-1',
  title: 'Zürich – Lissabon',
  kind: 'flight',
  artBezeichnung: 'Flug',
  startsOn: '2026-09-12',
  startsAt: '08:40',
  endsOn: '2026-09-12',
  endsAt: null,
  tripId: '11111111-1111-4111-8111-111111111111',
  tripTitle: 'Lissabon',
  tripStatus: 'planned',
  tripArchived: false,
}

/**
 * Bestätigte Besuche als Fixture.
 *
 * Absichtlich so gewählt, dass jeder Zustand der Karte einmal vorkommt:
 * Brasilien und Portugal sind besucht *und* geplant (überlagert), Italien nur
 * besucht, Japan nur geplant. Lissabon steht zweimal – ein wiederholter Besuch
 * bleibt zwei Ereignisse und ein Ort.
 *
 * Drei Länder haben auf Weltmassstab keine zeichenbare Fläche und prüfen die
 * Ersatzmarke in allen drei Formen: Singapur nur besucht, Hongkong besucht und
 * geplant, Malta nur geplant.
 *
 * Der letzte Eintrag trägt keinen Ländercode und darf die Länderzahl deshalb
 * nicht erhöhen.
 */
const BESUCHE: readonly Besuch[] = [
  {
    id: 'aaaa1111-0000-4000-8000-000000000001',
    placeId: 'geonames:2267057',
    placeLabel: 'Lissabon',
    countryCode: 'PT',
    latitude: 38.7223,
    longitude: -9.1393,
    jahr: 2012,
    monat: 7,
    tag: 14,
    erstelltAm: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'aaaa1111-0000-4000-8000-000000000002',
    placeId: 'geonames:2267057',
    placeLabel: 'Lissabon',
    countryCode: 'PT',
    latitude: 38.7223,
    longitude: -9.1393,
    jahr: 2019,
    monat: null,
    tag: null,
    erstelltAm: '2026-09-02T10:00:00.000Z',
  },
  {
    id: 'aaaa1111-0000-4000-8000-000000000003',
    placeId: 'geonames:3169070',
    placeLabel: 'Rom',
    countryCode: 'IT',
    latitude: 41.8931,
    longitude: 12.4828,
    jahr: null,
    monat: null,
    tag: null,
    erstelltAm: '2026-09-03T10:00:00.000Z',
  },
  {
    id: 'aaaa1111-0000-4000-8000-000000000004',
    placeId: 'geonames:1880252',
    placeLabel: 'Singapur',
    countryCode: 'SG',
    latitude: 1.2897,
    longitude: 103.8501,
    jahr: 2005,
    monat: 3,
    tag: null,
    erstelltAm: '2026-09-04T10:00:00.000Z',
  },
  {
    id: 'aaaa1111-0000-4000-8000-000000000006',
    placeId: 'geonames:3451190',
    placeLabel: 'Rio de Janeiro',
    countryCode: 'BR',
    latitude: -22.9028,
    longitude: -43.2075,
    jahr: 2016,
    monat: 8,
    tag: 5,
    erstelltAm: '2026-09-06T10:00:00.000Z',
  },
  {
    id: 'aaaa1111-0000-4000-8000-000000000007',
    placeId: 'geonames:1819729',
    placeLabel: 'Hongkong',
    countryCode: 'HK',
    latitude: 22.2783,
    longitude: 114.1747,
    jahr: 2018,
    monat: 11,
    tag: null,
    erstelltAm: '2026-09-07T10:00:00.000Z',
  },
  {
    id: 'aaaa1111-0000-4000-8000-000000000005',
    placeId: 'geonames:9999999',
    placeLabel: 'Ort ohne Ländercode',
    countryCode: null,
    latitude: null,
    longitude: null,
    jahr: 1998,
    monat: null,
    tag: null,
    erstelltAm: '2026-09-05T10:00:00.000Z',
  },
]

const ARCHIV_BUCHUNG: KontoBuchung = {
  ...BUCHUNG,
  id: 'booking-2',
  title: 'Lissabon Zentrum',
  kind: 'stay',
  artBezeichnung: 'Unterkunft',
  startsOn: '2025-04-02',
  startsAt: null,
  endsOn: '2025-04-06',
  tripId: '22222222-2222-4222-8222-222222222222',
  tripTitle: 'Algarve 2025',
  tripStatus: 'archived',
  tripArchived: true,
}

export default function AccountAuditClient({
  geometrie,
  zustand,
  ansicht,
}: {
  geometrie: WeltGeometrie
  zustand: string
  ansicht: string | null
}) {
  const buchungenSicht = (() => {
    if (zustand === 'fehler') {
      return { problem: { status: 503 as const, message: 'unavailable' }, buchungen: null, abgeschnitten: false }
    }
    if (zustand === 'leer') {
      return { problem: null, buchungen: [], abgeschnitten: false }
    }
    return { problem: null, buchungen: [BUCHUNG, ARCHIV_BUCHUNG], abgeschnitten: false }
  })()

  const sicht = (() => {
    if (zustand === 'fehler') {
      return {
        name: 'Sasa',
        problem: { status: 503 as const, message: 'unavailable' },
        naechste: null,
        hatReisen: false,
        reisen: [],
      }
    }
    if (zustand === 'leer') {
      return { name: 'Sasa', problem: null, naechste: null, hatReisen: false, reisen: [] }
    }
    if (zustand === 'welt') {
      const reisen = [
        REISE,
        REISE_GLEICHER_TITEL,
        REISE_JAPAN,
        REISE_BRASILIEN,
        REISE_KLEINSTAATEN,
      ]
      return {
        name: 'Sasa',
        problem: null,
        naechste: naechsteReiseAus(reisen, '2026-08-24'),
        hatReisen: true,
        reisen,
      }
    }
    return {
      name: 'Sasa',
      problem: null,
      naechste: naechsteReiseAus([REISE], '2026-08-24'),
      hatReisen: true,
      reisen: [REISE],
    }
  })()

  /**
   * `welt` zeigt beide Wahrheiten, `besuch-fehler` nur den Ausfall der
   * bestätigten Seite. Alle übrigen Zustände bleiben ohne Besuchshistorie –
   * die Karte muss auch dann eine gültige Aussage sein.
   */
  const besucht =
    zustand === 'besuch-fehler'
      ? weltBesuchtAbleiten({
          besuche: [],
          problem: { status: 503 as const, message: 'unavailable' },
        })
      : weltBesuchtAbleiten({ besuche: zustand === 'welt' ? BESUCHE : [], problem: null })

  const welt = worldMapAbleiten({ problem: sicht.problem, reisen: sicht.reisen })

  const laender = weltLaenderAbleiten({
    besucht: besucht.laenderCodes,
    geplant: welt.laenderCodes,
    geometrie,
  })

  return (
    <div data-account-audit={zustand} className="min-h-screen bg-surface-75">
      <AccountNavigation />
      <main className="px-4 py-10 sm:px-6 sm:py-14">
        <div className={ansicht === 'bookings' ? 'mx-auto max-w-3xl' : 'mx-auto max-w-6xl'}>
          {ansicht === 'bookings' ? (
            <AccountBuchungen {...buchungenSicht} />
          ) : ansicht === 'besuche' ? (
            <AccountBesuche
              welt={welt}
              besucht={besucht}
              laender={laender}
              besuche={zustand === 'welt' ? BESUCHE : []}
              problem={zustand === 'besuch-fehler' ? { status: 503, message: 'unavailable' } : null}
            />
          ) : (
            <AccountUebersicht {...sicht} besucht={besucht} laender={laender} />
          )}
        </div>
      </main>
    </div>
  )
}
