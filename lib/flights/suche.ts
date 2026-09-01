// lib/flights/suche.ts
//
// Orchestrierung: Zustand → Rate-Limit → Provider → Ranking.
// Der Provider wird übergeben, damit Tests keinen echten Adapter brauchen.

import { sucheFuerClient, type FlugSucheAntwort } from '@/lib/flights/client-sicht'
import { FLUG_ABDECKUNGSHINWEIS } from '@/lib/flights/domain'
import { FlugProviderFehler, type FlugProvider } from '@/lib/flights/provider'
import { optionenBewerten } from '@/lib/flights/ranking'
import { flugSucheErlaubt } from '@/lib/flights/rate-limit'
import { ersteFlugmeldung, flugSuchanfrageSchema } from '@/lib/flights/schema'
import { flugZustand, flugZustandMeldung, type FlugUmgebung, type FlugZustand } from '@/lib/flights/zustand'
import {
  providerOpsConsoleEventSink,
  providerOpsEventSchreiben,
  type ProviderOpsEventSink,
  type ProviderOpsOutcome,
} from '@/lib/provider-ops'
import type { FlughafenReferenzKarte } from '@/lib/route/domain'
import { iatasAusOption } from '@/lib/route/referenz'

export type SuchePorts = {
  zustand: FlugZustand
  provider: FlugProvider | null
  kennung: string
  flughafenReferenz?: (codes: readonly string[]) => Promise<FlughafenReferenzKarte>
  eventSink?: ProviderOpsEventSink
}

function sucheOhneProvider(zustand: FlugZustand): FlugSucheAntwort {
  return {
    status: 'unavailable',
    message: flugZustandMeldung(zustand),
    coverageNote: FLUG_ABDECKUNGSHINWEIS,
    options: [],
  }
}

export async function fluegeSuchen(
  eingabe: unknown,
  ports: SuchePorts,
): Promise<{ httpStatus: number; koerper: FlugSucheAntwort; retryAfterSec?: number }> {
  const gestartet = Date.now()
  const beobachten = (
    outcome: ProviderOpsOutcome,
    resultCount: number | null = 0,
    droppedCount: number | null = 0,
  ) => {
    void providerOpsEventSchreiben(ports.eventSink, {
      domain: 'flights',
      providerId: ports.provider?.id ?? null,
      operation: 'search',
      outcome,
      durationMs: Math.max(0, Date.now() - gestartet),
      resultCount,
      droppedCount,
      rateLimitHit: outcome === 'rate_limited',
    })
  }

  if (!ports.zustand.aktiv || !ports.provider) {
    beobachten('unavailable')
    return { httpStatus: 200, koerper: sucheOhneProvider(ports.zustand) }
  }

  const geprueft = flugSuchanfrageSchema.safeParse(eingabe)
  if (!geprueft.success) {
    beobachten('invalid')
    return {
      httpStatus: 400,
      koerper: {
        status: 'error',
        message: ersteFlugmeldung(geprueft.error),
        coverageNote: FLUG_ABDECKUNGSHINWEIS,
        options: [],
      },
    }
  }

  const quota = await flugSucheErlaubt(ports.kennung)
  if (!quota.ok) {
    beobachten('rate_limited')
    return {
      httpStatus: 429,
      retryAfterSec: quota.retryAfterSec,
      koerper: {
        status: 'rate_limited',
        message: 'Du hast gerade zu oft gesucht. Bitte warte einen Moment.',
        coverageNote: FLUG_ABDECKUNGSHINWEIS,
        options: [],
      },
    }
  }

  try {
    const treffer = await ports.provider.suchen(geprueft.data)
    // E5-B1R/E5-B2A/E5-B3B: Timezone-/Instant-Evidence und retrievedAt bleiben
    // serverseitig und gehen nicht ins Ranking und nicht in die Browser-Antwort.
    // Nur options/partial werden weiterverwendet.
    const bewertet = optionenBewerten(treffer.options, geprueft.data)
    const status = treffer.partial ? 'partial' : bewertet.length === 0 ? 'empty' : 'ok'
    const message =
      status === 'empty'
        ? 'Keine passenden Verbindungen gefunden.'
        : status === 'partial'
          ? 'Einige Angebote konnten nicht gelesen werden. Die übrigen Verbindungen siehst du unten.'
          : 'Verbindungen gefunden.'
    const airportRefs = ports.flughafenReferenz
      ? await ports.flughafenReferenz(bewertet.flatMap((option) => iatasAusOption(option)))
      : {}

    beobachten(
      status,
      bewertet.length,
      treffer.partial ? null : Math.max(0, treffer.options.length - bewertet.length),
    )
    return {
      httpStatus: 200,
      koerper: sucheFuerClient({ status, message, options: bewertet, airportRefs }),
    }
  } catch (fehler) {
    if (fehler instanceof FlugProviderFehler) {
      const status =
        fehler.art === 'timeout'
          ? 'timeout'
          : fehler.art === 'unavailable'
            ? 'unavailable'
            : fehler.art === 'invalid'
              ? 'invalid'
              : 'error'
      beobachten(status)
      return {
        httpStatus: 200,
        koerper: {
          status,
          message: fehler.message,
          coverageNote: FLUG_ABDECKUNGSHINWEIS,
          options: [],
        },
      }
    }
    beobachten('error')
    return {
      httpStatus: 200,
      koerper: {
        status: 'error',
        message: 'Die Flugsuche ist fehlgeschlagen.',
        coverageNote: FLUG_ABDECKUNGSHINWEIS,
        options: [],
      },
    }
  }
}

export function suchePortsAusUmgebung(
  umgebung: FlugUmgebung,
  provider: FlugProvider | null,
  kennung: string,
): SuchePorts {
  return {
    zustand: flugZustand(umgebung),
    provider,
    kennung,
    eventSink: providerOpsConsoleEventSink,
  }
}
