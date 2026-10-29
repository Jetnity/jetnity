// Server-only Viator seam for the existing activity search and the
// selected-product detail, schedule, and live check.
// Missing credentials and Production stay closed. Tests inject HTTP.

import 'server-only'

import { ActivityProviderFehler, type ActivityProvider, type ActivityProviderTreffer } from '@/lib/activities/provider'
import type { ActivityOption, ActivityPreisRolle, ActivitySuchanfrage } from '@/lib/activities/domain'
import { createFetchProviderHttpClient, type ProviderHttpClient } from '@/lib/server/providers/core'
import {
  VIATOR_PROVIDER_ID,
  isViatorSearchCurrency,
  type ViatorAgeBandRule,
  type ViatorPriceRole,
} from '@/lib/providers/viator/activities/contracts'
import { viatorOrtAufloesen, type ViatorKatalogOrt } from '@/lib/providers/viator/activities/destination'
import { viatorStartzeiten } from '@/lib/providers/viator/activities/kalender'
import { validateViatorLiveCheckRequest } from '@/lib/providers/viator/activities/live-check'
import { createViatorSandboxClient } from '@/lib/providers/viator/activities/sandbox'
import { validateViatorImageUrl, validateViatorProductUrl } from '@/lib/providers/viator/activities/url'
import { viatorSandboxZugang, type ViatorSandboxEnv } from '@/lib/providers/viator/activities/zugang'

export type ViatorDienstStatus = 'ok' | 'unavailable' | 'invalid' | 'empty' | 'error' | 'rate_limited' | 'timeout'

export type ViatorDienstErgebnis<T> = {
  status: ViatorDienstStatus
  message: string
  httpStatus: number
  value: T | null
  availabilityClaim: boolean
}

const GESCHLOSSEN = 'Viator ist in dieser Umgebung nicht verbunden. Es werden keine Beispielangebote gezeigt.'

function geschlossen<T>(message = GESCHLOSSEN): ViatorDienstErgebnis<T> {
  return { status: 'unavailable', message, httpStatus: 200, value: null, availabilityClaim: false }
}

function umgebungAusProzess(): ViatorSandboxEnv {
  return {
    VERCEL_ENV: process.env.VERCEL_ENV,
    VIATOR_SANDBOX_CALLS: process.env.VIATOR_SANDBOX_CALLS,
    VIATOR_SANDBOX_API_KEY: process.env.VIATOR_SANDBOX_API_KEY,
  }
}

function rolle(value: ViatorPriceRole | null | undefined): ActivityPreisRolle | null {
  if (value === 'rrp_from' || value === 'rrp_schedule' || value === 'rrp_check') return value
  return null
}

export function activityOptionAusViatorProdukt(product: {
  productCode: string
  title: string
  description: string | null
  durationMinutes: number | null
  pricing: { amount: number; currency: string; priceRole: ViatorPriceRole; checkoutCurrencyConfirmed: false } | null
  reviewSummary: { combinedAverage: number | null; totalReviews: number | null } | null
  image: { url: string } | null
  cancellation: { stornierbar: boolean | null }
}): ActivityOption | null {
  const bild = product.image && validateViatorImageUrl(product.image.url).ok ? product.image.url : null
  return {
    id: `viator:${product.productCode}`,
    provider: VIATOR_PROVIDER_ID,
    externalRef: product.productCode,
    title: product.title,
    description: product.description,
    locationName: null,
    punkt: null,
    dauerMinuten: product.durationMinutes,
    timeslot: null,
    preis: product.pricing?.amount ?? null,
    preisWaehrung: product.pricing?.currency ?? null,
    bewertung: product.reviewSummary?.combinedAverage ?? null,
    bewertungenAnzahl: product.reviewSummary?.totalReviews ?? null,
    stornierbar: product.cancellation.stornierbar,
    kategorien: [],
    tags: [],
    bildUrl: bild,
    preisRolle: rolle(product.pricing?.priceRole),
  }
}

type Abhaengigkeiten = {
  env?: ViatorSandboxEnv
  http?: ProviderHttpClient
  nowMs?: number
}

const ZIEL_TTL_MS = 3_600_000
let zielCache: { at: number; orte: ViatorKatalogOrt[] } | null = null

export function viatorZielCacheLeeren(): void {
  zielCache = null
}

function transportErgebnis<T>(
  art: string | undefined,
): ViatorDienstErgebnis<T> | null {
  if (art === 'timeout') {
    return { status: 'timeout', message: 'Viator hat zu lange gebraucht.', httpStatus: 200, value: null, availabilityClaim: false }
  }
  if (art === 'rate_limited') {
    return { status: 'rate_limited', message: 'Viator begrenzt gerade die Anfragen.', httpStatus: 200, value: null, availabilityClaim: false }
  }
  return null
}

function clientFuer(deps: Abhaengigkeiten) {
  const env = deps.env ?? umgebungAusProzess()
  const zugang = viatorSandboxZugang(env)
  if (!zugang.ok) return { ok: false as const, ergebnis: geschlossen<never>(GESCHLOSSEN) }
  const http = deps.http ?? createFetchProviderHttpClient()
  const erstellt = createViatorSandboxClient({ env, http, nowMs: deps.nowMs })
  if (!erstellt.ok) return { ok: false as const, ergebnis: geschlossen<never>() }
  return { ok: true as const, client: erstellt.client }
}

export function viatorActivityProvider(deps: Abhaengigkeiten = {}): ActivityProvider | null {
  const env = deps.env ?? umgebungAusProzess()
  if (!viatorSandboxZugang(env).ok) return null
  return {
    id: VIATOR_PROVIDER_ID,
    async suchen(anfrage: ActivitySuchanfrage): Promise<ActivityProviderTreffer> {
      const bereit = clientFuer(deps)
      if (!bereit.ok) throw new ActivityProviderFehler('unavailable', bereit.ergebnis.message)
      const jetzt = deps.nowMs ?? Date.now()
      let orte = zielCache && jetzt - zielCache.at <= ZIEL_TTL_MS ? zielCache.orte : null
      if (!orte) {
        const katalog = await bereit.client.destinations({ acceptLanguage: 'en-US' })
        if (!katalog.ok) {
          if (katalog.reason === 'transport' && katalog.transportKind === 'timeout') {
            throw new ActivityProviderFehler('timeout', 'Die Viator-Ziele haben zu lange gebraucht.')
          }
          if (katalog.reason === 'transport' && katalog.transportKind === 'rate_limited') {
            throw new ActivityProviderFehler('unavailable', 'Viator begrenzt gerade die Anfragen.')
          }
          throw new ActivityProviderFehler('error', 'Die Viator-Ziele konnten nicht gelesen werden.')
        }
        orte = katalog.katalog
        zielCache = { at: jetzt, orte }
      }
      if (!orte) throw new ActivityProviderFehler('error', 'Die Viator-Ziele konnten nicht gelesen werden.')
      const ziel = viatorOrtAufloesen({
        name: anfrage.destinationName,
        countryCode: anfrage.countryCode,
        latitude: anfrage.latitude,
        longitude: anfrage.longitude,
        katalog: orte,
        kanon: {
          namen: [anfrage.destinationName, ...(anfrage.placeAliases ?? [])],
          typ: anfrage.placeType ?? null,
          countryCode: anfrage.countryCode,
        },
      })
      if (!ziel.ok) {
        const message =
          ziel.reason === 'ambiguous'
            ? 'Für diesen Namen gibt es mehrere Viator-Ziele. Es wird keines geraten.'
            : 'Für diesen Ort ist kein eindeutiges Viator-Ziel hinterlegt.'
        throw new ActivityProviderFehler('invalid', message)
      }
      const currency = anfrage.currency && isViatorSearchCurrency(anfrage.currency) ? anfrage.currency : null
      const suche = await bereit.client.search({
        destinationId: ziel.destinationId,
        currency,
        acceptLanguage: 'de-DE',
        count: 5,
      })
      if (!suche.ok) {
        if (suche.reason === 'transport' && suche.transportKind === 'timeout') {
          throw new ActivityProviderFehler('timeout', 'Die Viator-Suche hat zu lange gedauert.')
        }
        if (suche.reason === 'transport' && suche.transportKind === 'rate_limited') {
          throw new ActivityProviderFehler('unavailable', 'Viator begrenzt gerade die Anfragen. Bitte warte einen Moment.')
        }
        throw new ActivityProviderFehler('error', 'Die Viator-Suche ist fehlgeschlagen.')
      }
      const options = suche.value.products
        .map((product) => activityOptionAusViatorProdukt(product))
        .filter((option): option is ActivityOption => option !== null)
      return { options, partial: suche.value.partial }
    },
  }
}

export function viatorActivityProviderAusUmgebung(): ActivityProvider | null {
  return viatorActivityProvider()
}

export async function viatorProduktLaden(productCode: string, deps: Abhaengigkeiten = {}): Promise<ViatorDienstErgebnis<{
  productCode: string
  title: string
  description: string | null
  durationMinutes: number | null
  imageUrl: string | null
  price: { amount: number; currency: string; priceRole: ActivityPreisRolle; checkoutCurrencyConfirmed: false } | null
  productOptionCodes: string[]
  productOptions: Array<{ code: string; title: string }>
  ageBands: ViatorAgeBandRule[]
  productUrl: string | null
}>> {
  const bereit = clientFuer(deps)
  if (!bereit.ok) return bereit.ergebnis
  const detail = await bereit.client.detail({ productCode, acceptLanguage: 'de-DE' })
  if (!detail.ok) return transportErgebnis(detail.reason === 'transport' ? detail.transportKind ?? undefined : undefined) ?? { status: 'error', message: 'Die Produktdetails konnten nicht geladen werden.', httpStatus: 200, value: null, availabilityClaim: false }
  const product = detail.value.products[0]
  if (!product) return { status: 'empty', message: 'Viator hat zu diesem Angebot keine lesbaren Details geliefert.', httpStatus: 200, value: null, availabilityClaim: false }
  const link = detail.value.affiliateRedirects[0]?.productUrl ?? null
  const productUrl = link && validateViatorProductUrl(link).ok ? link : null
  return {
    status: 'ok',
    message: 'Details geladen. Das ist keine aktuelle Verfügbarkeit.',
    httpStatus: 200,
    availabilityClaim: false,
    value: {
      productCode: product.productCode,
      title: product.title,
      description: product.description,
      durationMinutes: product.durationMinutes,
      imageUrl: product.image && validateViatorImageUrl(product.image.url).ok ? product.image.url : null,
      price: product.pricing
        ? {
            amount: product.pricing.amount,
            currency: product.pricing.currency,
            priceRole: product.pricing.priceRole,
            checkoutCurrencyConfirmed: false,
          }
        : null,
      productOptionCodes: product.productOptionCodes,
      productOptions: product.productOptions,
      ageBands: product.ageBands,
      productUrl,
    },
  }
}

export async function viatorKalenderLaden(productCode: string, deps: Abhaengigkeiten = {}): Promise<ViatorDienstErgebnis<{
  productCode: string
  supplierCurrency: string | null
  options: Array<{
    productOptionCode: string
    seasons: Array<{ startDate: string; endDate: string | null; startTimes: string[]; unavailableDates: string[]; timedEntries: Array<{ startTime: string; unavailableDates: string[]; daysOfWeek: string[] }> }>
  }>
}>> {
  const bereit = clientFuer(deps)
  if (!bereit.ok) return bereit.ergebnis
  const plan = await bereit.client.schedule({ productCode, acceptLanguage: 'de-DE' })
  if (!plan.ok) {
    return transportErgebnis(plan.reason === 'transport' ? plan.transportKind ?? undefined : undefined) ?? {
      status: 'error',
      message: 'Der Kalenderhinweis konnte nicht geladen werden.',
      httpStatus: 200,
      value: null,
      availabilityClaim: false,
    }
  }
  return {
    status: 'ok',
    message: 'Kalenderhinweis. Das ist keine aktuelle Verfügbarkeit.',
    httpStatus: 200,
    availabilityClaim: false,
    value: {
      productCode: plan.value.productCode,
      supplierCurrency: plan.value.supplierCurrency,
      options: plan.value.options.map((option) => ({
        productOptionCode: option.productOptionCode,
        seasons: option.seasons.map((season) => ({
          startDate: season.startDate,
          endDate: season.endDate,
          startTimes: season.startTimes,
          unavailableDates: season.unavailableDates,
          timedEntries: season.timedEntries,
        })),
      })),
    },
  }
}

export async function viatorLivePruefen(
  raw: unknown,
  deps: Abhaengigkeiten = {},
): Promise<ViatorDienstErgebnis<{
  available: boolean
  price: { amount: number; currency: string; priceRole: 'rrp_check'; checkoutCurrencyConfirmed: false } | null
  quoteComplete: boolean
}>> {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null
  const productCode = typeof record?.productCode === 'string' ? record.productCode : ''
  const bereit = clientFuer(deps)
  if (!bereit.ok) return bereit.ergebnis
  const detail = await bereit.client.detail({ productCode, acceptLanguage: 'de-DE' })
  if (!detail.ok) {
    return transportErgebnis(detail.reason === 'transport' ? detail.transportKind ?? undefined : undefined) ?? {
      status: 'error',
      message: 'Die Prüfung braucht zuerst lesbare Produktdetails.',
      httpStatus: 200,
      value: null,
      availabilityClaim: false,
    }
  }
  const product = detail.value.products[0]
  if (!product) {
    return { status: 'error', message: 'Die Prüfung braucht zuerst lesbare Produktdetails.', httpStatus: 200, value: null, availabilityClaim: false }
  }
  const hatOptionen = product.productOptionCodes.length > 0
  const anfrage = validateViatorLiveCheckRequest({
    ...(record ?? {}),
    standardProduct: !hatOptionen,
    productAgeBands: product.ageBands,
  })
  if (!anfrage.ok) {
    const message =
      anfrage.reason === 'total_is_not_age_mix'
        ? 'Eine Gesamtzahl ist keine Altersmischung.'
        : anfrage.reason === 'nonmatching_age_band'
          ? 'Diese Altersgruppe gibt es bei diesem Angebot nicht.'
          : anfrage.reason === 'missing_currency'
            ? 'Die Prüfung braucht eine unterstützte Anzeigewährung.'
            : anfrage.reason === 'missing_option'
              ? 'Bitte wähle eine Option. Es wird kein Standardcode erfunden.'
              : 'Für die Prüfung fehlen Datum, Option oder Altersgruppen.'
    return { status: 'invalid', message, httpStatus: 200, value: null, availabilityClaim: false }
  }
  if (hatOptionen) {
    if (!anfrage.value.productOptionCode || !product.productOptionCodes.includes(anfrage.value.productOptionCode)) {
      return { status: 'invalid', message: 'Diese Option gehört nicht zum Angebot.', httpStatus: 200, value: null, availabilityClaim: false }
    }
  } else if (anfrage.value.productOptionCode) {
    return {
      status: 'invalid',
      message: 'Dieses Angebot hat keinen Optionscode. Es wird keiner erfunden.',
      httpStatus: 200,
      value: null,
      availabilityClaim: false,
    }
  }
  const plan = await bereit.client.schedule({ productCode, acceptLanguage: 'de-DE' })
  if (!plan.ok) {
    return transportErgebnis(plan.reason === 'transport' ? plan.transportKind ?? undefined : undefined) ?? {
      status: 'error',
      message: 'Der Kalenderhinweis konnte nicht gelesen werden.',
      httpStatus: 200,
      value: null,
      availabilityClaim: false,
    }
  }
  const code = anfrage.value.productOptionCode
  const passende = code
    ? plan.value.options.filter((option) => option.productOptionCode === code)
    : plan.value.options
  if (code && passende.length !== 1) {
    return { status: 'invalid', message: 'Diese Option steht im Kalenderhinweis nicht.', httpStatus: 200, value: null, availabilityClaim: false }
  }
  if (!code && passende.length > 1) {
    return {
      status: 'invalid',
      message: 'Ohne Optionscode ist der Kalenderhinweis nicht eindeutig.',
      httpStatus: 200,
      value: null,
      availabilityClaim: false,
    }
  }
  const heute = new Date(deps.nowMs ?? Date.now()).toISOString().slice(0, 10)
  if (passende.length === 1) {
    const zeiten = viatorStartzeiten(passende[0], anfrage.value.travelDate, heute)
    if (zeiten == null) {
      return { status: 'invalid', message: 'Dieses Datum liegt ausserhalb des Kalenderhinweises.', httpStatus: 200, value: null, availabilityClaim: false }
    }
    if (zeiten.length > 0 && !anfrage.value.startTime) {
      return { status: 'invalid', message: 'Bitte wähle eine Startzeit.', httpStatus: 200, value: null, availabilityClaim: false }
    }
    if (anfrage.value.startTime && !zeiten.includes(anfrage.value.startTime)) {
      return { status: 'invalid', message: 'Diese Startzeit gilt nicht für die gewählte Option und das Datum.', httpStatus: 200, value: null, availabilityClaim: false }
    }
  } else if (anfrage.value.startTime) {
    return { status: 'invalid', message: 'Ohne Kalenderhinweis wird keine Startzeit gesetzt.', httpStatus: 200, value: null, availabilityClaim: false }
  }
  const check = await bereit.client.check({ liveCheck: anfrage.value, acceptLanguage: 'de-DE' })
  if (!check.ok) {
    return transportErgebnis(check.reason === 'transport' ? check.transportKind ?? undefined : undefined) ?? {
      status: 'error',
      message: 'Die aktuelle Prüfung ist fehlgeschlagen.',
      httpStatus: 200,
      value: null,
      availabilityClaim: false,
    }
  }
  return {
    status: 'ok',
    message: check.value.available ? 'Viator meldet das Angebot für diese Auswahl.' : 'Viator meldet für diese Auswahl keine Verfügbarkeit.',
    httpStatus: 200,
    availabilityClaim: true,
    value: {
      available: check.value.available,
      quoteComplete: check.value.quoteComplete,
      price: check.value.pricing
        ? {
            amount: check.value.pricing.amount,
            currency: check.value.pricing.currency,
            priceRole: 'rrp_check',
            checkoutCurrencyConfirmed: false,
          }
        : null,
    },
  }
}
