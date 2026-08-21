// lib/mobility/suche.ts
//
// Orchestrierung: validierte Anfrage → Provider → Ranking
// Ohne Provider immer unavailable. Keine Fake-Ergebnisse.

import { sucheFuerClient, type MobilitySucheAntwort } from '@/lib/mobility/client-sicht'
import {
  LEERE_MOBILITY_EVIDENZ,
  MOBILITY_ABDECKUNGSHINWEIS,
  MOBILITY_SUCHE_GRENZEN,
  type MobilityEvidenz,
  type MobilitySuchanfrage,
} from '@/lib/mobility/domain'
import { MobilityProviderFehler, type MobilityProvider } from '@/lib/mobility/provider'
import { mobilitySucheErlaubt } from '@/lib/mobility/rate-limit'
import { mobilityKandidatAus, mobilityOptionenBewerten } from '@/lib/mobility/ranking'
import { ersteMobilitymeldung, mobilitySucheEingabeSchema } from '@/lib/mobility/schema'
import {
  mobilityZustand,
  mobilityZustandMeldung,
  type MobilityUmgebung,
  type MobilityZustand,
} from '@/lib/mobility/zustand'

export type MobilitySuchePorts = {
  zustand: MobilityZustand
  provider: MobilityProvider | null
  kennung: string
}

function evidenzAus(anfrage: MobilitySuchanfrage): MobilityEvidenz {
  return {
    hatStart: Boolean(anfrage.originName.trim() || anfrage.originPlaceId),
    hatZiel: Boolean(anfrage.destinationName.trim() || anfrage.destinationPlaceId),
    hatDatum: Boolean(anfrage.date),
    hatModus: Boolean(anfrage.mode),
  }
}

function leerAntwort(
  status: MobilitySucheAntwort['status'],
  message: string,
  evidenz: MobilityEvidenz = LEERE_MOBILITY_EVIDENZ,
): MobilitySucheAntwort {
  return sucheFuerClient({
    status,
    message,
    coverageNote: MOBILITY_ABDECKUNGSHINWEIS,
    evidenz,
    options: [],
  })
}

async function mitTimeout<T>(arbeit: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, ablehnen) => {
    timer = setTimeout(() => {
      ablehnen(new MobilityProviderFehler('timeout', 'Die Mobilitätssuche hat zu lange gedauert.'))
    }, timeoutMs)
  })
  try {
    return await Promise.race([arbeit, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function mobilitySuchePortsAusUmgebung(
  umgebung: MobilityUmgebung,
  provider: MobilityProvider | null,
  kennung: string,
): MobilitySuchePorts {
  return {
    zustand: mobilityZustand(umgebung, Boolean(provider)),
    provider,
    kennung,
  }
}

export async function mobilitySuchen(
  eingabe: unknown,
  ports: MobilitySuchePorts,
): Promise<{ httpStatus: number; koerper: MobilitySucheAntwort; retryAfterSec?: number }> {
  const geprueft = mobilitySucheEingabeSchema.safeParse(eingabe)
  if (!geprueft.success) {
    return {
      httpStatus: 400,
      koerper: leerAntwort('invalid', ersteMobilitymeldung(geprueft.error)),
    }
  }

  const anfrage: MobilitySuchanfrage = geprueft.data
  const evidenz = evidenzAus(anfrage)

  if (!ports.zustand.aktiv || !ports.provider) {
    return {
      httpStatus: 200,
      koerper: leerAntwort('unavailable', mobilityZustandMeldung(ports.zustand), evidenz),
    }
  }

  const rate = mobilitySucheErlaubt(ports.kennung)
  if (!rate.ok) {
    return {
      httpStatus: 429,
      retryAfterSec: rate.retryAfterSec,
      koerper: leerAntwort('rate_limited', 'Zu viele Suchanfragen. Bitte später erneut versuchen.', evidenz),
    }
  }

  try {
    const treffer = await mitTimeout(ports.provider.suchen(anfrage), MOBILITY_SUCHE_GRENZEN.timeoutMs)
    const kandidaten = treffer.options.slice(0, MOBILITY_SUCHE_GRENZEN.angebote).map((option) =>
      mobilityKandidatAus(option),
    )
    const options = mobilityOptionenBewerten(kandidaten).slice(0, MOBILITY_SUCHE_GRENZEN.empfohleneOptionen)

    if (options.length === 0) {
      return {
        httpStatus: 200,
        koerper: leerAntwort(
          treffer.partial ? 'partial' : 'empty',
          treffer.partial
            ? 'Einzelne Angebote konnten nicht gelesen werden. Es bleibt keine gültige Verbindung.'
            : 'Für diese Verbindung liegt gerade kein Angebot vor.',
          evidenz,
        ),
      }
    }

    return {
      httpStatus: 200,
      koerper: sucheFuerClient({
        status: treffer.partial ? 'partial' : 'ok',
        message: treffer.partial
          ? 'Es liegen Verbindungen vor. Einzelne Angebote wurden verworfen.'
          : 'Verbindungen passend zur Anfrage.',
        coverageNote: MOBILITY_ABDECKUNGSHINWEIS,
        evidenz,
        options,
      }),
    }
  } catch (fehler) {
    if (fehler instanceof MobilityProviderFehler) {
      const status =
        fehler.art === 'timeout'
          ? 'timeout'
          : fehler.art === 'unavailable'
            ? 'unavailable'
            : fehler.art === 'invalid'
              ? 'invalid'
              : 'error'
      const httpStatus = fehler.art === 'timeout' ? 504 : 200
      return { httpStatus, koerper: leerAntwort(status, fehler.message, evidenz) }
    }
    return {
      httpStatus: 200,
      koerper: leerAntwort('error', 'Die Mobilitätssuche ist gerade nicht verfügbar.', evidenz),
    }
  }
}
