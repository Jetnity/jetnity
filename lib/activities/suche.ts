// lib/activities/suche.ts
//
// Orchestrierung:
// validierte Anfrage → Tageskontext → Provider → Anreicherung → Ranking
//
// Der Provider wird übergeben, damit Tests keinen echten Adapter brauchen.

import { activityKandidatenAnreichern } from '@/lib/activities/anreichern'
import { sucheFuerClient, type ActivitySucheAntwort } from '@/lib/activities/client-sicht'
import { ACTIVITY_SUCHE_GRENZEN, LEERE_ACTIVITY_EVIDENZ, type ActivityEvidenz } from '@/lib/activities/domain'
import { ActivityProviderFehler, type ActivityProvider } from '@/lib/activities/provider'
import { activitySucheErlaubt } from '@/lib/activities/rate-limit'
import { activityOptionenBewerten } from '@/lib/activities/ranking'
import { ersteActivitymeldung, activitySucheEingabeSchema } from '@/lib/activities/schema'
import { tageskontextAusReise } from '@/lib/activities/tageskontext'
import {
  activityZustand,
  activityZustandMeldung,
  type ActivityUmgebung,
  type ActivityZustand,
} from '@/lib/activities/zustand'
import { geoPunktGueltig } from '@/lib/hotels/geo'

export type ActivitySuchePorts = {
  zustand: ActivityZustand
  provider: ActivityProvider | null
  kennung: string
}

function leerAntwort(
  status: ActivitySucheAntwort['status'],
  message: string,
  evidenz: ActivityEvidenz = LEERE_ACTIVITY_EVIDENZ,
): ActivitySucheAntwort {
  return sucheFuerClient({
    status,
    message,
    evidenz,
    options: [],
  })
}

async function mitTimeout<T>(arbeit: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, ablehnen) => {
    timer = setTimeout(() => {
      ablehnen(new ActivityProviderFehler('timeout', 'Die Aktivitätensuche hat zu lange gedauert.'))
    }, timeoutMs)
  })
  try {
    return await Promise.race([arbeit, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function activitiesSuchen(
  eingabe: unknown,
  ports: ActivitySuchePorts,
): Promise<{ httpStatus: number; koerper: ActivitySucheAntwort; retryAfterSec?: number }> {
  const geprueft = activitySucheEingabeSchema.safeParse(eingabe)
  if (!geprueft.success) {
    return {
      httpStatus: 400,
      koerper: leerAntwort('error', ersteActivitymeldung(geprueft.error)),
    }
  }

  const { anfrage, bestehendeFenster, evidenz } = tageskontextAusReise(geprueft.data)

  if (!ports.zustand.aktiv || !ports.provider) {
    return {
      httpStatus: 200,
      koerper: leerAntwort('unavailable', activityZustandMeldung(ports.zustand), evidenz),
    }
  }

  if (!anfrage) {
    return {
      httpStatus: 200,
      koerper: leerAntwort(
        'invalid',
        'Für die Aktivitätensuche fehlt ein belastbares Reiseziel.',
        evidenz,
      ),
    }
  }

  const quota = activitySucheErlaubt(ports.kennung)
  if (!quota.ok) {
    return {
      httpStatus: 429,
      retryAfterSec: quota.retryAfterSec,
      koerper: leerAntwort(
        'rate_limited',
        'Du hast gerade zu oft nach Aktivitäten gesucht. Bitte warte einen Moment.',
        evidenz,
      ),
    }
  }

  const etappenPunkt =
    geprueft.data.stage.latitude !== null &&
    geprueft.data.stage.longitude !== null &&
    geoPunktGueltig({ lat: geprueft.data.stage.latitude, lon: geprueft.data.stage.longitude })
      ? { lat: geprueft.data.stage.latitude, lon: geprueft.data.stage.longitude }
      : null

  try {
    const treffer = await mitTimeout(ports.provider.suchen(anfrage), ACTIVITY_SUCHE_GRENZEN.timeoutMs)
    const begrenzt = treffer.options.slice(0, ACTIVITY_SUCHE_GRENZEN.angebote)
    const kandidaten = activityKandidatenAnreichern(begrenzt, anfrage, bestehendeFenster, etappenPunkt)
    const optionen = activityOptionenBewerten(kandidaten).slice(
      0,
      ACTIVITY_SUCHE_GRENZEN.empfohleneOptionen,
    )
    const status = treffer.partial ? 'partial' : optionen.length === 0 ? 'empty' : 'ok'
    const message =
      status === 'empty'
        ? 'Keine passenden Aktivitäten für diesen Reisetag gefunden.'
        : status === 'partial'
          ? 'Einige Angebote konnten nicht gelesen werden. Die übrigen Aktivitäten siehst du unten.'
          : 'Aktivitäten gefunden.'

    return {
      httpStatus: 200,
      koerper: sucheFuerClient({
        status,
        message,
        evidenz,
        options: optionen,
      }),
    }
  } catch (fehler) {
    if (fehler instanceof ActivityProviderFehler) {
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
        koerper: leerAntwort(status, fehler.message, evidenz),
      }
    }
    return {
      httpStatus: 200,
      koerper: leerAntwort('error', 'Die Aktivitätensuche ist fehlgeschlagen.', evidenz),
    }
  }
}

export function activitySuchePortsAusUmgebung(
  umgebung: ActivityUmgebung,
  provider: ActivityProvider | null,
  kennung: string,
): ActivitySuchePorts {
  return {
    zustand: activityZustand(umgebung, provider !== null),
    provider,
    kennung,
  }
}
