import { createHash } from 'node:crypto'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { modellAufrufen } from '@/lib/modell/aufruf'
import { modellZustand } from '@/lib/modell/konfiguration'
import { officialLeer } from '@/lib/readiness/official'
import { assistantTruthContextProjizieren } from '@/lib/reisebegleiter/kontext'
import { begleiterauskunftErzeugen } from '@/lib/reisebegleiter/erzeugen'
import type { Trip, TripStage, TripTraveller } from '@/types/trips'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

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

function response(status: number, body: Record<string, unknown>) {
  return NextResponse.json(
    {
      ...body,
      lockedProductHead: LOCKED_PRODUCT_HEAD,
      environment: 'preview/development',
    },
    { status, headers: { 'cache-control': 'no-store' } },
  )
}

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return response(412, { ok: false, stage: 'environment', reason: 'not-preview' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!supabaseUrl || !serviceKey) {
    return response(412, { ok: false, stage: 'environment', reason: 'supabase-server-config-missing' })
  }

  let hostname = ''
  try {
    hostname = new URL(supabaseUrl).hostname
  } catch {
    return response(412, { ok: false, stage: 'environment', reason: 'supabase-url-invalid' })
  }

  if (hostname !== `${EXPECTED_DEVELOPMENT_REF}.supabase.co`) {
    return response(412, {
      ok: false,
      stage: 'environment',
      reason: 'not-development-supabase',
      observedRef: hostname.endsWith('.supabase.co') ? hostname.slice(0, -'.supabase.co'.length) : 'other-host',
    })
  }

  const state = modellZustand()
  if (!state.aktiv) {
    return response(412, { ok: false, stage: 'model-state', reason: state.grund })
  }

  const service = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const usageHash = createHash('sha256').update(`konto:${SMOKE_ACCOUNT_ID}`).digest('hex')
  const preflight = await service
    .from('model_usage')
    .select('id, ergebnis')
    .eq('funktion', 'reisebegleiter')
    .eq('kennung_hash', usageHash)

  if (preflight.error) {
    return response(412, { ok: false, stage: 'development-db', reason: 'service-role-preflight-failed' })
  }
  if ((preflight.data?.length ?? 0) !== 0) {
    return response(409, { ok: false, stage: 'one-shot', reason: 'already-executed' })
  }

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
      return modellAufrufen(request)
    },
    abschliessen: async (id, outcome, usage, runtimeMs) => {
      order.push('abschliessen')
      await service.rpc('modell_nutzung_abschliessen', {
        _id: id,
        _ergebnis: outcome,
        _eingabe_tokens: usage?.eingabeTokens,
        _gecachte_tokens: usage?.gecachteTokens,
        _ausgabe_tokens: usage?.ausgabeTokens,
        _laufzeit_ms: Math.max(0, Math.round(runtimeMs)),
      })
    },
  })

  const usageQuery = await service
    .from('model_usage')
    .select(
      'funktion, modell, art, ergebnis, eingabe_tokens, gecachte_tokens, ausgabe_tokens, laufzeit_ms, kosten_mikro_usd, abgeschlossen_am',
    )
    .eq('funktion', 'reisebegleiter')
    .eq('kennung_hash', usageHash)
    .order('created_at', { ascending: true })

  if (usageQuery.error || usageQuery.data?.length !== 1) {
    return response(500, {
      ok: false,
      stage: 'accounting',
      reason: 'expected-exactly-one-usage-row',
      rows: usageQuery.data?.length ?? null,
      order,
    })
  }

  const usage = usageQuery.data[0]
  const orderOk = order.join('>') === 'beanspruchen>aufrufen>abschliessen'
  const accountingOk =
    usage.art === 'konto' &&
    usage.ergebnis === 'erfolg' &&
    Boolean(usage.abgeschlossen_am) &&
    Number(usage.eingabe_tokens) > 0 &&
    Number(usage.ausgabe_tokens) > 0 &&
    Number(usage.kosten_mikro_usd) > 0

  if (!result.ok || !orderOk || !accountingOk) {
    return response(502, {
      ok: false,
      stage: 'assistant-smoke',
      assistantClass: result.ok ? 'success' : result.klasse,
      order,
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
    })
  }

  return response(200, {
    ok: true,
    smoke: 'PASS',
    order,
    callsCreated: 1,
    model: state.modell,
    effort: state.aufwand,
    truthClass: result.auskunft.wahrheitsklasse,
    outputCounts: {
      findings: result.auskunft.befunde.length,
      references: result.auskunft.bezuege.length,
      officialNotices: result.auskunft.amtlicheHinweise.length,
    },
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
  })
}
