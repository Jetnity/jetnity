import { createHash } from 'node:crypto'

import { createClient } from '@supabase/supabase-js'

import { ENDPUNKT, anfragekoerper, type Modellanfrage } from '@/lib/modell/anfrage'
import { rohergebnisAus } from '@/lib/modell/antwort'
import {
  modellZustand,
  timeoutMsFuer,
  type Ergebnisklasse,
} from '@/lib/modell/konfiguration'
import type { Modellergebnis } from '@/lib/modell/aufruf'
import type { Tokennutzung } from '@/lib/modell/preise'
import { officialLeer } from '@/lib/readiness/official'
import { assistantTruthContextProjizieren } from '@/lib/reisebegleiter/kontext'
import { begleiterauskunftErzeugen } from '@/lib/reisebegleiter/erzeugen'
import type { Trip, TripStage, TripTraveller } from '@/types/trips'

const EXPECTED_DEVELOPMENT_REF = 'yfvbxvijcorffwxbxahl'
const LOCKED_PRODUCT_HEAD = '8915ef45849b6544fe6fea201fb1450392c15f83'
const SMOKE_ACCOUNT_ID = '8915ef45-849b-4544-fe6f-ea201fb14503'
const QUESTION = 'Was ist bei dieser Reise noch offen?'
const NOW = '2026-09-17T10:00:00.000Z'
const TODAY = '2026-09-17'

function stage(partial: Partial<TripStage> & Pick<TripStage, 'id' | 'name'>): TripStage {
  return {
    position: 1,
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...partial,
  }
}

function traveller(): TripTraveller {
  return {
    id: 'smoke-traveller-1',
    clientRef: 'traveller:smoke:1',
    label: 'Smoke',
    residenceCountryCode: 'CH',
    citizenships: [
      {
        id: 'smoke-cit-ch',
        clientRef: 'cit:smoke:ch',
        countryCode: 'CH',
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    documents: [],
    createdAt: NOW,
    updatedAt: NOW,
  }
}

function trip(): Trip {
  return {
    id: 'smoke-trip-1',
    clientRef: 'smoke-trip-1',
    title: 'Assistant Smoke',
    origin: 'Zürich',
    originPlaceId: null,
    startDate: '2026-11-05',
    endDate: '2026-11-07',
    travellers: 1,
    currency: 'CHF',
    budgetAmount: null,
    status: 'draft',
    pace: 'calm',
    interests: ['culture'],
    travelWish: 'Kurze Städtereise mit klarer Etappe.',
    revision: 1,
    lastMutationId: null,
    stages: [
      stage({
        id: 'smoke-stage-lisbon',
        position: 1,
        name: 'Lissabon',
        countryCode: 'PT',
        arrivalDate: '2026-11-05',
        departureDate: '2026-11-07',
      }),
    ],
    days: [],
    ohneTag: [],
    party: [traveller()],
    createdAt: NOW,
    updatedAt: NOW,
  }
}

function context() {
  return assistantTruthContextProjizieren({
    reise: trip(),
    officialEvaluations: [
      officialLeer({
        requirementType: 'visa',
        contextFingerprint: 'smoke-fingerprint-1',
        travellerClientRef: 'traveller:smoke:1',
        credentialOptionRef: null,
        destinationCountryCode: 'PT',
        transitCountryCode: null,
        status: 'unknown',
        freshness: 'provider_unavailable',
      }),
    ],
    routeFacts: {
      quelle: 'none',
      destinationCountryCodes: ['PT'],
      transitCountryCodes: [],
    },
  })
}

async function realModelCall(request: Modellanfrage): Promise<Modellergebnis> {
  const key = process.env.OPENAI_API_KEY?.trim()
  const started = Date.now()
  if (!key) {
    return {
      ok: false,
      klasse: 'netz',
      hinweis: 'Server model key missing.',
      nutzung: null,
      laufzeitMs: 0,
    }
  }

  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMsFuer(request.modell))

  try {
    const response = await fetch(ENDPUNKT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: anfragekoerper(request),
      signal: controller.signal,
      cache: 'no-store',
    })
    const raw: unknown = await response.json().catch(() => null)
    return { ...rohergebnisAus(response.status, raw), laufzeitMs: Date.now() - started }
  } catch (error) {
    return {
      ok: false,
      klasse: timedOut ? 'zeitueberschreitung' : 'netz',
      hinweis: timedOut ? 'Smoke model timeout.' : `Smoke model network failure (${error instanceof Error ? error.name : 'unknown'}).`,
      nutzung: null,
      laufzeitMs: Date.now() - started,
    }
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  if (process.env.VERCEL_ENV !== 'preview') {
    throw new Error('SMOKE_ABORT not-preview')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SMOKE_ABORT supabase-server-config-missing')
  }

  const hostname = new URL(supabaseUrl).hostname
  if (hostname !== `${EXPECTED_DEVELOPMENT_REF}.supabase.co`) {
    const observed = hostname.endsWith('.supabase.co')
      ? hostname.slice(0, -'.supabase.co'.length)
      : 'other-host'
    throw new Error(`SMOKE_ABORT not-development-supabase observed=${observed}`)
  }

  const state = modellZustand()
  if (!state.aktiv) {
    throw new Error(`SMOKE_ABORT model-state-${state.grund}`)
  }

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const usageHash = createHash('sha256').update(`konto:${SMOKE_ACCOUNT_ID}`).digest('hex')

  const before = await service
    .from('model_usage')
    .select('id, ergebnis')
    .eq('funktion', 'reisebegleiter')
    .eq('kennung_hash', usageHash)
  if (before.error) throw new Error('SMOKE_ABORT development-db-preflight-failed')
  if ((before.data?.length ?? 0) !== 0) throw new Error('SMOKE_ABORT already-executed')

  const order: string[] = []
  const result = await begleiterauskunftErzeugen(QUESTION, context(), {
    zustand: state,
    heute: TODAY,
    beanspruchen: async (model) => {
      order.push('beanspruchen')
      const booked = await service.rpc('modell_kontingent_beanspruchen', {
        _funktion: 'reisebegleiter',
        _modell: model,
        _gastkennung: null,
        _konto: SMOKE_ACCOUNT_ID,
      })
      if (booked.error || typeof booked.data !== 'string' || !booked.data) {
        return { ok: false as const, meldung: 'Development cost reservation failed.' }
      }
      return { ok: true as const, id: booked.data }
    },
    aufrufen: async (request) => {
      order.push('aufrufen')
      return realModelCall(request)
    },
    abschliessen: async (
      id: string,
      outcome: Ergebnisklasse,
      usage: Tokennutzung | null,
      runtimeMs: number,
    ) => {
      order.push('abschliessen')
      const closed = await service.rpc('modell_nutzung_abschliessen', {
        _id: id,
        _ergebnis: outcome,
        _eingabe_tokens: usage?.eingabeTokens,
        _gecachte_tokens: usage?.gecachteTokens,
        _ausgabe_tokens: usage?.ausgabeTokens,
        _laufzeit_ms: Math.max(0, Math.round(runtimeMs)),
      })
      if (closed.error) throw new Error('Development usage completion failed.')
    },
  })

  const after = await service
    .from('model_usage')
    .select('funktion, modell, art, ergebnis, eingabe_tokens, gecachte_tokens, ausgabe_tokens, laufzeit_ms, kosten_mikro_usd, abgeschlossen_am')
    .eq('funktion', 'reisebegleiter')
    .eq('kennung_hash', usageHash)
    .order('created_at', { ascending: true })

  if (after.error || after.data?.length !== 1) {
    throw new Error(`SMOKE_FAIL accounting-row-count=${after.data?.length ?? 'unknown'} order=${order.join('>')}`)
  }

  const usage = after.data[0]
  const orderOk = order.join('>') === 'beanspruchen>aufrufen>abschliessen'
  const accountingOk =
    usage.art === 'konto' &&
    usage.ergebnis === 'erfolg' &&
    Boolean(usage.abgeschlossen_am) &&
    Number(usage.eingabe_tokens) > 0 &&
    Number(usage.ausgabe_tokens) > 0 &&
    Number(usage.kosten_mikro_usd) > 0

  const evidence = {
    smoke: result.ok && orderOk && accountingOk ? 'PASS' : 'FAIL',
    lockedProductHead: LOCKED_PRODUCT_HEAD,
    environment: 'preview/development',
    harnessCommit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    order,
    callsCreated: after.data.length,
    model: state.modell,
    effort: state.aufwand,
    assistantClass: result.ok ? 'success' : result.klasse,
    truthClass: result.ok ? result.auskunft.wahrheitsklasse : null,
    outputCounts: result.ok
      ? {
          findings: result.auskunft.befunde.length,
          references: result.auskunft.bezuege.length,
          officialNotices: result.auskunft.amtlicheHinweise.length,
        }
      : null,
    usage: {
      function: usage.funktion,
      model: usage.modell,
      kind: usage.art,
      result: usage.ergebnis,
      inputTokens: usage.eingabe_tokens,
      cachedTokens: usage.gecachte_tokens,
      outputTokens: usage.ausgabe_tokens,
      runtimeMs: usage.laufzeit_ms,
      costMicroUsd: usage.kosten_mikro_usd,
      completed: Boolean(usage.abgeschlossen_am),
    },
  }

  console.log(`JETNITY_ASSISTANT_SMOKE_EVIDENCE ${JSON.stringify(evidence)}`)
  if (evidence.smoke !== 'PASS') process.exit(1)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
