// lib/hotels/suche.ts
//
// Orchestrierung:
// validierte Anfrage → Quartierkontext → Quartierbewertung → Provider → Ranking
//
// Der Provider wird übergeben, damit Tests keinen echten Adapter brauchen.

import { hotelKandidatenAnreichern } from '@/lib/hotels/anreichern'
import { sucheFuerClient, type HotelSucheAntwort } from '@/lib/hotels/client-sicht'
import {
  HOTEL_SUCHE_GRENZEN,
  LEERE_QUARTIER_EVIDENZ,
  type BewertetesQuartier,
  type QuartierEvidenz,
} from '@/lib/hotels/domain'
import { HotelProviderFehler, type HotelProvider } from '@/lib/hotels/provider'
import { quartierKontextAusReise, suchanfrageAusKontext } from '@/lib/hotels/quartier-kontext'
import { quartiereBewerten } from '@/lib/hotels/quartier-ranking'
import { hotelSucheErlaubt } from '@/lib/hotels/rate-limit'
import { hotelOptionenBewerten } from '@/lib/hotels/ranking'
import { ersteHotelmeldung, hotelSucheEingabeSchema } from '@/lib/hotels/schema'
import { hotelZustand, hotelZustandMeldung, type HotelUmgebung, type HotelZustand } from '@/lib/hotels/zustand'

export type HotelSuchePorts = {
  zustand: HotelZustand
  provider: HotelProvider | null
  kennung: string
}

function leerAntwort(
  status: HotelSucheAntwort['status'],
  message: string,
  quartier: BewertetesQuartier | null = null,
  evidenz: QuartierEvidenz = LEERE_QUARTIER_EVIDENZ,
): HotelSucheAntwort {
  return sucheFuerClient({
    status,
    message,
    quartier,
    evidenz,
    options: [],
  })
}

async function mitTimeout<T>(arbeit: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, ablehnen) => {
    timer = setTimeout(() => {
      ablehnen(new HotelProviderFehler('timeout', 'Die Hotelsuche hat zu lange gedauert.'))
    }, timeoutMs)
  })
  try {
    return await Promise.race([arbeit, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function hotelsSuchen(
  eingabe: unknown,
  ports: HotelSuchePorts,
): Promise<{ httpStatus: number; koerper: HotelSucheAntwort }> {
  const geprueft = hotelSucheEingabeSchema.safeParse(eingabe)
  if (!geprueft.success) {
    return {
      httpStatus: 400,
      koerper: leerAntwort('error', ersteHotelmeldung(geprueft.error)),
    }
  }

  const { kontext, kandidaten, evidenz } = quartierKontextAusReise(geprueft.data)
  const bewertet = kontext ? quartiereBewerten(kandidaten, kontext) : []
  const quartier = bewertet[0] ?? null
  const suchanfrage = suchanfrageAusKontext(
    geprueft.data,
    quartier
      ? { id: quartier.id, name: quartier.name, zentrum: quartier.zentrum }
      : null,
  )

  if (!ports.zustand.aktiv || !ports.provider) {
    return {
      httpStatus: 200,
      koerper: leerAntwort('unavailable', hotelZustandMeldung(ports.zustand), quartier, evidenz),
    }
  }

  if (!suchanfrage) {
    return {
      httpStatus: 200,
      koerper: leerAntwort(
        'invalid',
        'Für die Hotelsuche fehlen ein belastbarer Zeitraum oder ein Zielort.',
        quartier,
        evidenz,
      ),
    }
  }

  const quota = hotelSucheErlaubt(ports.kennung)
  if (!quota.ok) {
    return {
      httpStatus: 429,
      koerper: leerAntwort(
        'rate_limited',
        'Du hast gerade zu oft nach Hotels gesucht. Bitte warte einen Moment.',
        quartier,
        evidenz,
      ),
    }
  }

  try {
    const treffer = await mitTimeout(ports.provider.suchen(suchanfrage), HOTEL_SUCHE_GRENZEN.timeoutMs)
    const begrenzt = treffer.options.slice(0, HOTEL_SUCHE_GRENZEN.angebote)
    const kandidatenHotels = hotelKandidatenAnreichern(begrenzt, suchanfrage)
    const optionen = hotelOptionenBewerten(kandidatenHotels, suchanfrage).slice(
      0,
      HOTEL_SUCHE_GRENZEN.empfohleneOptionen,
    )
    const status = treffer.partial ? 'partial' : optionen.length === 0 ? 'empty' : 'ok'
    const message =
      status === 'empty'
        ? 'Keine passenden Hotels in dieser Gegend gefunden.'
        : status === 'partial'
          ? 'Einige Angebote konnten nicht gelesen werden. Die übrigen Hotels siehst du unten.'
          : 'Hotels gefunden.'

    return {
      httpStatus: 200,
      koerper: sucheFuerClient({
        status,
        message,
        quartier,
        evidenz,
        options: optionen,
      }),
    }
  } catch (fehler) {
    if (fehler instanceof HotelProviderFehler) {
      const status =
        fehler.art === 'timeout'
          ? 'timeout'
          : fehler.art === 'unavailable'
            ? 'unavailable'
            : fehler.art === 'invalid'
              ? 'invalid'
              : 'error'
      return {
        httpStatus: 200,
        koerper: leerAntwort(status, fehler.message, quartier, evidenz),
      }
    }
    return {
      httpStatus: 200,
      koerper: leerAntwort('error', 'Die Hotelsuche ist fehlgeschlagen.', quartier, evidenz),
    }
  }
}

export function hotelSuchePortsAusUmgebung(
  umgebung: HotelUmgebung,
  provider: HotelProvider | null,
  kennung: string,
): HotelSuchePorts {
  return {
    zustand: hotelZustand(umgebung, provider !== null),
    provider,
    kennung,
  }
}
