// lib/rental-cars/suche.ts
//
// Orchestrierung: validierte Anfrage → Provider → Ranking
// Ohne Provider immer unavailable. Keine Fake-Ergebnisse.

import { sucheFuerClient, type RentalCarSucheAntwort } from '@/lib/rental-cars/client-sicht'
import {
  LEERE_RENTAL_EVIDENZ,
  RENTAL_ABDECKUNGSHINWEIS,
  RENTAL_SUCHE_GRENZEN,
  type RentalCarEvidenz,
  type RentalCarSuchanfrage,
} from '@/lib/rental-cars/domain'
import { RentalCarProviderFehler, type RentalCarProvider } from '@/lib/rental-cars/provider'
import { rentalCarSucheErlaubt } from '@/lib/rental-cars/rate-limit'
import { rentalCarKandidatAus, rentalCarOptionenBewerten } from '@/lib/rental-cars/ranking'
import { ersteRentalmeldung, rentalCarSucheEingabeSchema } from '@/lib/rental-cars/schema'
import {
  rentalCarZustand,
  rentalCarZustandMeldung,
  type RentalCarUmgebung,
  type RentalCarZustand,
} from '@/lib/rental-cars/zustand'
import {
  providerOpsConsoleEventSink,
  providerOpsEventSchreiben,
  type ProviderOpsEventSink,
  type ProviderOpsOutcome,
} from '@/lib/provider-ops'

export type RentalCarSuchePorts = {
  zustand: RentalCarZustand
  provider: RentalCarProvider | null
  kennung: string
  eventSink?: ProviderOpsEventSink
}

function evidenzAus(anfrage: RentalCarSuchanfrage): RentalCarEvidenz {
  return {
    hatAbholung: Boolean(anfrage.pickupName.trim() || anfrage.pickupPlaceId),
    hatRueckgabe: Boolean(anfrage.dropoffName.trim() || anfrage.dropoffPlaceId),
    hatAbholdatum: Boolean(anfrage.pickupOn),
    hatRueckgabedatum: Boolean(anfrage.dropoffOn),
  }
}

function leerAntwort(
  status: RentalCarSucheAntwort['status'],
  message: string,
  evidenz: RentalCarEvidenz = LEERE_RENTAL_EVIDENZ,
): RentalCarSucheAntwort {
  return sucheFuerClient({
    status,
    message,
    coverageNote: RENTAL_ABDECKUNGSHINWEIS,
    evidenz,
    options: [],
  })
}

async function mitTimeout<T>(arbeit: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, ablehnen) => {
    timer = setTimeout(() => {
      ablehnen(new RentalCarProviderFehler('timeout', 'Die Mietwagensuche hat zu lange gedauert.'))
    }, timeoutMs)
  })
  try {
    return await Promise.race([arbeit, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function rentalCarSuchePortsAusUmgebung(
  umgebung: RentalCarUmgebung,
  provider: RentalCarProvider | null,
  kennung: string,
): RentalCarSuchePorts {
  return {
    zustand: rentalCarZustand(umgebung, Boolean(provider)),
    provider,
    kennung,
    eventSink: providerOpsConsoleEventSink,
  }
}

export async function rentalCarSuchen(
  eingabe: unknown,
  ports: RentalCarSuchePorts,
): Promise<{ httpStatus: number; koerper: RentalCarSucheAntwort; retryAfterSec?: number }> {
  const gestartet = Date.now()
  const beobachten = (
    outcome: ProviderOpsOutcome,
    resultCount: number | null = 0,
    droppedCount: number | null = 0,
  ) => {
    void providerOpsEventSchreiben(ports.eventSink, {
      domain: 'rental_cars',
      providerId: ports.provider?.id ?? null,
      operation: 'search',
      outcome,
      durationMs: Math.max(0, Date.now() - gestartet),
      resultCount,
      droppedCount,
      rateLimitHit: outcome === 'rate_limited',
    })
  }

  const geprueft = rentalCarSucheEingabeSchema.safeParse(eingabe)
  if (!geprueft.success) {
    beobachten('invalid')
    return {
      httpStatus: 400,
      koerper: leerAntwort('invalid', ersteRentalmeldung(geprueft.error)),
    }
  }

  const anfrage: RentalCarSuchanfrage = geprueft.data
  const evidenz = evidenzAus(anfrage)

  if (!ports.zustand.aktiv || !ports.provider) {
    beobachten('unavailable')
    return {
      httpStatus: 200,
      koerper: leerAntwort('unavailable', rentalCarZustandMeldung(ports.zustand), evidenz),
    }
  }

  const rate = await rentalCarSucheErlaubt(ports.kennung)
  if (!rate.ok) {
    beobachten('rate_limited')
    return {
      httpStatus: 429,
      retryAfterSec: rate.retryAfterSec,
      koerper: leerAntwort('rate_limited', 'Zu viele Suchanfragen. Bitte später erneut versuchen.', evidenz),
    }
  }

  try {
    const treffer = await mitTimeout(ports.provider.suchen(anfrage), RENTAL_SUCHE_GRENZEN.timeoutMs)
    const kandidaten = treffer.options.slice(0, RENTAL_SUCHE_GRENZEN.angebote).map((option) =>
      rentalCarKandidatAus(option),
    )
    const options = rentalCarOptionenBewerten(kandidaten).slice(0, RENTAL_SUCHE_GRENZEN.empfohleneOptionen)

    if (options.length === 0) {
      const status = treffer.partial ? 'partial' : 'empty'
      beobachten(status, 0, treffer.partial ? null : treffer.options.length)
      return {
        httpStatus: 200,
        koerper: leerAntwort(
          status,
          treffer.partial
            ? 'Einzelne Angebote konnten nicht gelesen werden. Es bleibt kein gültiger Mietwagen.'
            : 'Für diesen Zeitraum liegt gerade kein Angebot vor.',
          evidenz,
        ),
      }
    }

    const status = treffer.partial ? 'partial' : 'ok'
    beobachten(
      status,
      options.length,
      treffer.partial ? null : Math.max(0, treffer.options.length - options.length),
    )
    return {
      httpStatus: 200,
      koerper: sucheFuerClient({
        status,
        message: treffer.partial
          ? 'Es liegen Mietwagen vor. Einzelne Angebote wurden verworfen.'
          : 'Mietwagen passend zur Anfrage.',
        coverageNote: RENTAL_ABDECKUNGSHINWEIS,
        evidenz,
        options,
      }),
    }
  } catch (fehler) {
    if (fehler instanceof RentalCarProviderFehler) {
      const status =
        fehler.art === 'timeout'
          ? 'timeout'
          : fehler.art === 'unavailable'
            ? 'unavailable'
            : fehler.art === 'invalid'
              ? 'invalid'
              : 'error'
      beobachten(status)
      const httpStatus = fehler.art === 'timeout' ? 504 : 200
      return { httpStatus, koerper: leerAntwort(status, fehler.message, evidenz) }
    }
    beobachten('error')
    return {
      httpStatus: 200,
      koerper: leerAntwort('error', 'Die Mietwagensuche ist gerade nicht verfügbar.', evidenz),
    }
  }
}
