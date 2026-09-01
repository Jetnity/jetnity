// lib/flights/suche.ts
//
// Orchestrierung: Zustand → Rate-Limit → 0..N unabhängige FlugProvider →
// ein globales, providerneutrales Ranking → Client-Sicht.
//
// Jeder Provider behält sein eigenes FlugProviderTreffer. Es gibt kein
// zusammengesetztes Treffer-Objekt und keinen erfundenen gemeinsamen
// retrievedAt. Kombiniert werden nur normalisierte FlugOption[].

import { sucheFuerClient, type FlugSucheAntwort } from '@/lib/flights/client-sicht'
import {
  FLUG_ABDECKUNGSHINWEIS,
  FLUG_SUCHE_GRENZEN,
  type FlugOption,
  type FlugSuchanfrage,
  type FlugSuchStatus,
} from '@/lib/flights/domain'
import {
  FlugProviderFehler,
  type FlugProvider,
  type FlugProviderFehlerart,
  type FlugProviderTreffer,
} from '@/lib/flights/provider'
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
  providers: readonly FlugProvider[]
  kennung: string
  flughafenReferenz?: (codes: readonly string[]) => Promise<FlughafenReferenzKarte>
  eventSink?: ProviderOpsEventSink
}

const MELDUNG_OK = 'Verbindungen gefunden.'
const MELDUNG_EMPTY = 'Keine passenden Verbindungen gefunden.'
const MELDUNG_PARTIAL =
  'Einige Angebote konnten nicht gelesen werden. Die übrigen Verbindungen siehst du unten.'
const MELDUNG_TIMEOUT = 'Die Flugsuche hat zu lange gedauert.'
const MELDUNG_UNAVAILABLE = 'Der Fluganbieter hat die Suche abgelehnt.'
const MELDUNG_INVALID = 'Die Flugdaten waren unbrauchbar.'
const MELDUNG_ERROR = 'Die Flugsuche ist fehlgeschlagen.'
const MELDUNG_AGGREGAT =
  'Die Flugsuche konnte die Anbieter-Ergebnisse nicht vollständig lesen.'

type ProviderFehlerart = FlugProviderFehlerart

type ProviderErfolg = {
  art: 'erfolg'
  providerId: string
  options: FlugOption[]
  partial: boolean
  durationMs: number
}

type ProviderMisserfolg = {
  art: 'fehler'
  providerId: string
  fehlerart: ProviderFehlerart
  message: string
  durationMs: number
}

type ProviderAusgang = ProviderErfolg | ProviderMisserfolg

function sucheOhneProvider(zustand: FlugZustand): FlugSucheAntwort {
  return {
    status: 'unavailable',
    message: zustand.aktiv ? 'Die Flugsuche ist hier noch nicht eingerichtet.' : flugZustandMeldung(zustand),
    coverageNote: FLUG_ABDECKUNGSHINWEIS,
    options: [],
  }
}

function fehlerAlsStatus(art: ProviderFehlerart): Extract<
  FlugSuchStatus,
  'timeout' | 'unavailable' | 'invalid' | 'error'
> {
  if (art === 'timeout') return 'timeout'
  if (art === 'unavailable') return 'unavailable'
  if (art === 'invalid') return 'invalid'
  return 'error'
}

function meldungFuerFehlerart(art: ProviderFehlerart): string {
  if (art === 'timeout') return MELDUNG_TIMEOUT
  if (art === 'unavailable') return MELDUNG_UNAVAILABLE
  if (art === 'invalid') return MELDUNG_INVALID
  return MELDUNG_ERROR
}

function fehlerAusUnbekannt(fehler: unknown): { fehlerart: ProviderFehlerart; message: string } {
  if (fehler instanceof FlugProviderFehler) {
    return { fehlerart: fehler.art, message: fehler.message }
  }
  return { fehlerart: 'error', message: MELDUNG_ERROR }
}

function trefferAnnehmen(
  provider: FlugProvider,
  treffer: FlugProviderTreffer,
): { options: FlugOption[] } | { fehlerart: 'invalid'; message: string } {
  if (!Array.isArray(treffer.options)) {
    return { fehlerart: 'invalid', message: MELDUNG_INVALID }
  }

  const geseheneIds = new Set<string>()
  for (const option of treffer.options) {
    if (!option?.id || !option.externalRef || option.provider !== provider.id) {
      return { fehlerart: 'invalid', message: MELDUNG_INVALID }
    }
    if (geseheneIds.has(option.id)) {
      return { fehlerart: 'invalid', message: MELDUNG_INVALID }
    }
    geseheneIds.add(option.id)
  }

  return { options: treffer.options }
}

async function providerUnabhaengigSuchen(
  provider: FlugProvider,
  anfrage: FlugSuchanfrage,
): Promise<ProviderAusgang> {
  const gestartet = Date.now()
  try {
    const treffer = await provider.suchen(anfrage)
    const geprueft = trefferAnnehmen(provider, treffer)
    const durationMs = Math.max(0, Date.now() - gestartet)
    if ('fehlerart' in geprueft) {
      return {
        art: 'fehler',
        providerId: provider.id,
        fehlerart: geprueft.fehlerart,
        message: geprueft.message,
        durationMs,
      }
    }
    return {
      art: 'erfolg',
      providerId: provider.id,
      options: geprueft.options,
      partial: treffer.partial === true,
      durationMs,
    }
  } catch (fehler) {
    const { fehlerart, message } = fehlerAusUnbekannt(fehler)
    return {
      art: 'fehler',
      providerId: provider.id,
      fehlerart,
      message,
      durationMs: Math.max(0, Date.now() - gestartet),
    }
  }
}

function kollidierendeProviderIds(erfolge: readonly ProviderErfolg[]): ReadonlySet<string> {
  const idZuProvidern = new Map<string, Set<string>>()
  for (const erfolg of erfolge) {
    for (const option of erfolg.options) {
      const bisher = idZuProvidern.get(option.id) ?? new Set<string>()
      bisher.add(erfolg.providerId)
      idZuProvidern.set(option.id, bisher)
    }
  }

  const kollision = new Set<string>()
  for (const providerIds of idZuProvidern.values()) {
    if (providerIds.size < 2) continue
    for (const providerId of providerIds) kollision.add(providerId)
  }
  return kollision
}

function ausgaengeMitKollision(ausgaenge: readonly ProviderAusgang[]): ProviderAusgang[] {
  const erfolge = ausgaenge.filter((eintrag): eintrag is ProviderErfolg => eintrag.art === 'erfolg')
  const kollision = kollidierendeProviderIds(erfolge)
  if (kollision.size === 0) return [...ausgaenge]

  return ausgaenge.map((eintrag) => {
    if (eintrag.art !== 'erfolg' || !kollision.has(eintrag.providerId)) return eintrag
    return {
      art: 'fehler',
      providerId: eintrag.providerId,
      fehlerart: 'invalid',
      message: MELDUNG_INVALID,
      durationMs: eintrag.durationMs,
    }
  })
}

function outcomeFuerAusgang(ausgang: ProviderAusgang): ProviderOpsOutcome {
  if (ausgang.art === 'fehler') return fehlerAlsStatus(ausgang.fehlerart)
  if (ausgang.partial) return 'partial'
  return ausgang.options.length === 0 ? 'empty' : 'ok'
}

function sucheZusammenfassen(ausgaenge: readonly ProviderAusgang[]): {
  status: FlugSuchStatus
  message: string
  options: FlugOption[]
} {
  const erfolge = ausgaenge.filter((eintrag): eintrag is ProviderErfolg => eintrag.art === 'erfolg')
  const fehler = ausgaenge.filter((eintrag): eintrag is ProviderMisserfolg => eintrag.art === 'fehler')
  const options = erfolge.flatMap((eintrag) => eintrag.options)
  const hatPartial = erfolge.some((eintrag) => eintrag.partial)

  if (options.length > 0) {
    return {
      status: hatPartial || fehler.length > 0 ? 'partial' : 'ok',
      message: hatPartial || fehler.length > 0 ? MELDUNG_PARTIAL : MELDUNG_OK,
      options,
    }
  }

  if (erfolge.length > 0 && fehler.length === 0) {
    return {
      status: hatPartial ? 'partial' : 'empty',
      message: hatPartial ? MELDUNG_PARTIAL : MELDUNG_EMPTY,
      options: [],
    }
  }

  if (erfolge.length > 0 && fehler.length > 0) {
    return { status: 'partial', message: MELDUNG_PARTIAL, options: [] }
  }

  if (ausgaenge.length === 1 && fehler[0]) {
    return {
      status: fehlerAlsStatus(fehler[0].fehlerart),
      message: fehler[0].message,
      options: [],
    }
  }

  const arten = new Set(fehler.map((eintrag) => eintrag.fehlerart))
  if (arten.size === 1) {
    const art = fehler[0]!.fehlerart
    return {
      status: fehlerAlsStatus(art),
      message: meldungFuerFehlerart(art),
      options: [],
    }
  }

  return { status: 'error', message: MELDUNG_AGGREGAT, options: [] }
}

export async function fluegeSuchen(
  eingabe: unknown,
  ports: SuchePorts,
): Promise<{ httpStatus: number; koerper: FlugSucheAntwort; retryAfterSec?: number }> {
  const gestartet = Date.now()
  const providers = ports.providers
  const beobachten = (
    outcome: ProviderOpsOutcome,
    providerId: string | null,
    resultCount: number | null = 0,
    droppedCount: number | null = 0,
    durationMs = Math.max(0, Date.now() - gestartet),
  ) => {
    void providerOpsEventSchreiben(ports.eventSink, {
      domain: 'flights',
      providerId,
      operation: 'search',
      outcome,
      durationMs,
      resultCount,
      droppedCount,
      rateLimitHit: outcome === 'rate_limited',
    })
  }

  if (!ports.zustand.aktiv || providers.length === 0) {
    beobachten('unavailable', null)
    return { httpStatus: 200, koerper: sucheOhneProvider(ports.zustand) }
  }

  const geprueft = flugSuchanfrageSchema.safeParse(eingabe)
  if (!geprueft.success) {
    beobachten('invalid', null)
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
    beobachten('rate_limited', null)
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

  const rohAusgaenge = await Promise.all(
    providers.map((provider) => providerUnabhaengigSuchen(provider, geprueft.data)),
  )
  const ausgaenge = ausgaengeMitKollision(rohAusgaenge)

  for (const ausgang of ausgaenge) {
    beobachten(
      outcomeFuerAusgang(ausgang),
      ausgang.providerId,
      ausgang.art === 'erfolg' ? ausgang.options.length : 0,
      ausgang.art === 'erfolg' ? (ausgang.partial ? null : 0) : 0,
      ausgang.durationMs,
    )
  }

  const zusammen = sucheZusammenfassen(ausgaenge)
  const bewertet = optionenBewerten(zusammen.options, geprueft.data).slice(
    0,
    FLUG_SUCHE_GRENZEN.angebote,
  )
  const airportRefs = ports.flughafenReferenz
    ? await ports.flughafenReferenz(bewertet.flatMap((option) => iatasAusOption(option)))
    : {}

  return {
    httpStatus: 200,
    koerper: sucheFuerClient({
      status: zusammen.status,
      message: zusammen.message,
      options: bewertet,
      airportRefs,
    }),
  }
}

export function suchePortsAusUmgebung(
  umgebung: FlugUmgebung,
  providers: readonly FlugProvider[],
  kennung: string,
): SuchePorts {
  return {
    zustand: flugZustand(umgebung),
    providers,
    kennung,
    eventSink: providerOpsConsoleEventSink,
  }
}
