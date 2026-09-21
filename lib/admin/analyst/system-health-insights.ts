import { messageForDenial } from '@/lib/auth/admin-access'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import { berechneFreshness } from '@/lib/admin/system-health/freshness'
import { wendeEvidenceAlterAn } from '@/lib/admin/system-health/bewertung'
import { systemHealthIdsVollstaendig } from '@/lib/admin/system-health/sammeln'
import {
  SYSTEM_HEALTH_IDS,
  SYSTEM_HEALTH_TTL_MS,
  istUeberzogenerGesamtClaim,
  type HealthFreshness,
  type HealthStatus,
  type SystemHealthBericht,
  type SystemHealthCheck,
  type SystemHealthId,
  type SystemHealthItem,
} from '@/lib/admin/system-health/typen'
import {
  ANALYST_DENIAL_TO_OBSERVED,
  ANALYST_INSIGHT_KIND,
  ANALYST_UNTERSUCHEN,
  DATENBANKGESTUETZTE_SYSTEM_HEALTH_CHECKS,
  ERWARTETE_NICHT_KONFIGURIERTE_IDS,
  type AnalystAccess,
  type AnalystAttribution,
  type AnalystBericht,
  type AnalystCoverage,
  type AnalystInsight,
  type AnalystObserved,
} from './typen'

const TEXTE = ADMIN_EHRLICHE_TEXTE
const SITZUNG_MUSTER = /in dieser Sitzung|diese Sitzung/i
const VERBOTENE_ALTERSBEHAUPTUNG = /höchstens 30s|hoechstens 30s|at most 30s old/i
const ZUGRIFF_ID = 'supabase-app-datenzugriff'
const PROZESS_ID = 'app-prozess'
const DEPLOYMENT_ID = 'app-deployment'

const LEERE_ABDECKUNG: AnalystCoverage = {
  evidenced: [],
  notConfigured: [],
  unknown: [],
  failed: [],
  notAttributed: [],
}

const UNBEKANNTE_FRISCHE: HealthFreshness = { state: 'unknown', ageMs: null, ttlMs: 60_000 }

export type AnalystInsightEingabe = {
  access: AnalystAccess
  bericht?: SystemHealthBericht | null
  nowMs: number
  sourceFailed?: boolean
}

export function alsUnvertrautenText(wert: string): string {
  return wert
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/[<>]/g, '')
}

export function enthältVerboteneAltersbehauptung(text: string): boolean {
  return VERBOTENE_ALTERSBEHAUPTUNG.test(text)
}

export function projiziereBreakGlassSystemHealth(bericht: SystemHealthBericht): {
  notAttributed: readonly string[]
} {
  const gefunden = new Set<string>()
  for (const item of bericht.items) {
    for (const check of item.checks ?? []) {
      if (istDatenbankgestuetzterCheck(check.id)) {
        gefunden.add(check.id)
      }
    }
    if (item.id === 'supabase' && istDatenbankgestuetzterCheck(item.source)) {
      gefunden.add(ZUGRIFF_ID)
    }
  }
  return { notAttributed: [...gefunden] }
}

function istDatenbankgestuetzterCheck(id: string): boolean {
  return (DATENBANKGESTUETZTE_SYSTEM_HEALTH_CHECKS as readonly string[]).includes(id)
}

function istGueltigerZeitpunkt(wert: string | null | undefined): boolean {
  if (!wert) return false
  return Number.isFinite(Date.parse(wert))
}

function iso(nowMs: number): string {
  return new Date(nowMs).toISOString()
}

function frischeAus(
  checkedAt: string | null | undefined,
  nowMs: number,
  ttlMs: number,
): HealthFreshness {
  return berechneFreshness({ checkedAt, nowMs, ttlMs })
}

function reifeBericht(bericht: SystemHealthBericht, nowMs: number): SystemHealthBericht {
  return {
    ...bericht,
    items: bericht.items.map((item) => wendeEvidenceAlterAn(item, nowMs)),
  }
}

function limitationen(teile: readonly (string | null | undefined)[]): string[] {
  const gesehen = new Set<string>()
  const liste: string[] = []
  for (const teil of teile) {
    if (!teil) continue
    const text = alsUnvertrautenText(teil).trim()
    if (!text || enthältVerboteneAltersbehauptung(text) || gesehen.has(text)) continue
    gesehen.add(text)
    liste.push(text)
  }
  return liste
}

function overlayProves(proves: string, observed: AnalystObserved): string {
  const roh = alsUnvertrautenText(proves)
  if (!SITZUNG_MUSTER.test(roh)) return roh
  if (observed === 'healthy') {
    return TEXTE.aktuelleHinweiseProzessBeweis
  }
  return `${roh
    .replace(/in dieser Sitzung/gi, 'in einem kürzlichen Sammellauf')
    .replace(/diese Sitzung/gi, 'dieser Prozess')} Das ist kein Nachweis für die aktuelle Sitzung.`
}

function insightId(
  itemId: AnalystInsight['sourceItemId'],
  checkId: string | null,
  observed: AnalystObserved,
  freshness: HealthFreshness['state'],
): string {
  return `system-health:${itemId}:${checkId ?? 'item'}:${observed}:${freshness}`
}

function untersucheWennErlaubt(access: AnalystAccess): AnalystInsight['next'] {
  return access.status === 'allowed' ? ANALYST_UNTERSUCHEN : null
}

function basisInsight(
  teil: Omit<AnalystInsight, 'kind' | 'category' | 'sourceRef' | 'next'> & {
    next?: AnalystInsight['next']
  },
): AnalystInsight {
  return {
    kind: ANALYST_INSIGHT_KIND,
    category: 'system-health',
    sourceRef: 'system-health',
    next: teil.next ?? null,
    ...teil,
    title: alsUnvertrautenText(teil.title),
    explanation: alsUnvertrautenText(teil.explanation),
    proves: alsUnvertrautenText(teil.proves),
    doesNotProve: alsUnvertrautenText(teil.doesNotProve),
    limitations: limitationen(teil.limitations),
  }
}

function sucheCheck(bericht: SystemHealthBericht, checkId: string): SystemHealthCheck | null {
  for (const item of bericht.items) {
    const treffer = item.checks?.find((check) => check.id === checkId)
    if (treffer) return treffer
  }
  return null
}

function sucheItem(bericht: SystemHealthBericht, id: SystemHealthId): SystemHealthItem | undefined {
  return bericht.items.find((item) => item.id === id)
}

export function leiteSystemHealthInsights(eingabe: AnalystInsightEingabe): AnalystBericht {
  const generatedAt = iso(eingabe.nowMs)

  if (eingabe.access.status === 'denied') {
    return deniedBericht(eingabe.access, generatedAt)
  }

  if (eingabe.sourceFailed && !eingabe.bericht) {
    return sammlungFehltBericht(eingabe.access, generatedAt, 'none')
  }

  if (!eingabe.bericht) {
    return sammlungFehltBericht(eingabe.access, generatedAt, 'none')
  }

  const originalCheckedAt = eingabe.bericht.checkedAt
  const bericht = reifeBericht(eingabe.bericht, eingabe.nowMs)
  const grant = eingabe.access.grant
  const projection =
    grant === 'break-glass' ? projiziereBreakGlassSystemHealth(bericht) : { notAttributed: [] as const }
  const notAttributed = new Set(projection.notAttributed)
  const coverage = baueCoverage(bericht, grant, notAttributed)
  const insights: AnalystInsight[] = []

  if (eingabe.sourceFailed) {
    insights.push(sammlungInsight(eingabe.access, berichtFreshness(bericht, eingabe.nowMs), originalCheckedAt))
  }

  if (!systemHealthIdsVollstaendig(bericht)) {
    insights.push(unvollstaendigInsight(eingabe.access, bericht, originalCheckedAt, eingabe.nowMs))
  }

  if (grant === 'break-glass' && notAttributed.size > 0) {
    insights.push(notzugangInsight(eingabe.access, bericht, originalCheckedAt, eingabe.nowMs, [...notAttributed]))
  }

  const kandidaten = sammleKandidaten(bericht, eingabe.access, notAttributed, originalCheckedAt)
  insights.push(...kandidaten)

  if (istKeinSignal(bericht, grant, notAttributed, insights)) {
    return abschluss(
      {
        generatedAt,
        sourceCheckedAt: originalCheckedAt || null,
        source: 'system-health',
        observationScope: 'process-recent',
        access: eingabe.access,
        insights: [keinSignalInsight(eingabe.access, bericht, originalCheckedAt)],
        coverage,
      },
      originalCheckedAt,
    )
  }

  const erwartet = erwarteteNichtKonfiguriertInsight(bericht, eingabe.access, originalCheckedAt, eingabe.nowMs)
  if (erwartet && !insights.some((insight) => insight.id === erwartet.id)) {
    insights.push(erwartet)
  }

  const eindeutig = dedupliziere(insights)
  const sortiert = sortiere(eindeutig)

  return abschluss(
    {
      generatedAt,
      sourceCheckedAt: originalCheckedAt || null,
      source: 'system-health',
      observationScope: 'process-recent',
      access: eingabe.access,
      insights: sortiert,
      coverage,
    },
    originalCheckedAt,
  )
}

function deniedBericht(
  access: Extract<AnalystAccess, { status: 'denied' }>,
  generatedAt: string,
): AnalystBericht {
  const observed = ANALYST_DENIAL_TO_OBSERVED[access.denial]
  const denialText = messageForDenial(access.denial)
  const lookup = observed === 'lookup-failed'
  return {
    generatedAt,
    sourceCheckedAt: null,
    source: 'system-health',
    observationScope: 'none',
    access,
    insights: [
      basisInsight({
        id: insightId('system-health-collection', 'item', observed, 'unknown'),
        sourceItemId: 'system-health-collection',
        sourceCheckId: null,
        observed,
        freshness: UNBEKANNTE_FRISCHE,
        checkedAt: null,
        materiality: 'attention',
        attribution: 'none',
        title: lookup ? 'Berechtigung konnte nicht geprüft werden' : 'System Health nicht gelesen',
        explanation: `${denialText} ${TEXTE.aktuelleHinweiseOhnePruefung}`,
        proves: lookup
          ? 'Nur, dass die betrieb-lesen-Prüfung derzeit nicht belastbar war.'
          : 'Nur, dass diese Sitzung System Health nicht lesen darf.',
        doesNotProve: lookup
          ? 'Nicht, dass die Sitzung abgemeldet ist, und nicht, dass Systeme gesund oder ausgefallen sind.'
          : 'Nicht den Zustand von App, Supabase oder Plattform-Quellen.',
        limitations: [TEXTE.aktuelleHinweiseOhnePruefung],
        next: null,
      }),
    ],
    coverage: LEERE_ABDECKUNG,
    writeActions: [],
    modelExplanation: { enabled: false },
  }
}

function sammlungFehltBericht(
  access: AnalystAccess,
  generatedAt: string,
  scope: AnalystBericht['observationScope'],
): AnalystBericht {
  return {
    generatedAt,
    sourceCheckedAt: null,
    source: 'system-health',
    observationScope: scope,
    access,
    insights: [sammlungInsight(access, UNBEKANNTE_FRISCHE, null)],
    coverage: { ...LEERE_ABDECKUNG, failed: ['system-health-collection'] },
    writeActions: [],
    modelExplanation: { enabled: false },
  }
}

function sammlungInsight(
  access: AnalystAccess,
  freshness: HealthFreshness,
  checkedAt: string | null,
): AnalystInsight {
  return basisInsight({
    id: insightId('system-health-collection', 'item', 'source_failed', freshness.state),
    sourceItemId: 'system-health-collection',
    sourceCheckId: null,
    observed: 'source_failed',
    freshness,
    checkedAt: istGueltigerZeitpunkt(checkedAt) ? checkedAt : checkedAt || null,
    materiality: 'attention',
    attribution: access.status === 'allowed' ? 'process-recent' : 'none',
    title: 'System-Health-Sammlung fehlgeschlagen',
    explanation: TEXTE.aktuelleHinweiseSammlungFehlt,
    proves: 'Nur, dass dieser Prozessstand nicht vollständig eingesammelt wurde.',
    doesNotProve: 'Nicht, dass einzelne Plattformen down sind.',
    limitations: [TEXTE.aktuelleHinweiseProzessGrenze],
    next: untersucheWennErlaubt(access),
  })
}

function unvollstaendigInsight(
  access: AnalystAccess,
  bericht: SystemHealthBericht,
  originalCheckedAt: string | null,
  nowMs: number,
): AnalystInsight {
  const freshness = berichtFreshness(bericht, nowMs)
  return basisInsight({
    id: insightId('system-health-collection', 'item', 'partial_failed', freshness.state),
    sourceItemId: 'system-health-collection',
    sourceCheckId: null,
    observed: 'partial_failed',
    freshness,
    checkedAt: originalCheckedAt || null,
    materiality: 'attention',
    attribution: 'process-recent',
    title: 'System-Health-Bericht unvollständig',
    explanation: TEXTE.aktuelleHinweiseUnvollstaendig,
    proves: 'Nur, dass nicht alle erwarteten System-Health-Karten in diesem Prozessstand liegen.',
    doesNotProve: 'Nicht, dass eine fehlende Karte gesund ist.',
    limitations: [TEXTE.aktuelleHinweiseProzessGrenze],
    next: untersucheWennErlaubt(access),
  })
}

function notzugangInsight(
  access: AnalystAccess,
  bericht: SystemHealthBericht,
  originalCheckedAt: string | null,
  nowMs: number,
  notAttributed: readonly string[],
): AnalystInsight {
  const freshness = berichtFreshness(bericht, nowMs)
  return basisInsight({
    id: insightId('system-health-collection', 'not-attributed', 'unknown', freshness.state),
    sourceItemId: 'system-health-collection',
    sourceCheckId: notAttributed[0] ?? ZUGRIFF_ID,
    observed: 'unknown',
    freshness,
    checkedAt: originalCheckedAt || null,
    materiality: 'coverage',
    attribution: 'not_attributed',
    title: 'Datenbankgestützte System-Health-Fakten nicht zugeschrieben',
    explanation: TEXTE.aktuelleHinweiseNotzugang,
    proves: 'Nur, dass Notzugang keine datenbankgestützte System-Health-Aussage trägt.',
    doesNotProve: 'Nicht den airports-Zustand und nicht, dass die Datenbank erreichbar oder ausgefallen ist.',
    limitations: [TEXTE.aktuelleHinweiseNotzugang, TEXTE.aktuelleHinweiseProzessGrenze],
    next: null,
  })
}

function keinSignalInsight(
  access: AnalystAccess,
  bericht: SystemHealthBericht,
  originalCheckedAt: string | null,
): AnalystInsight {
  const zugriff = sucheCheck(bericht, ZUGRIFF_ID)
  const freshness = zugriff?.freshness ?? UNBEKANNTE_FRISCHE
  return basisInsight({
    id: insightId('system-health-collection', 'item', 'healthy', freshness.state),
    sourceItemId: 'system-health-collection',
    sourceCheckId: ZUGRIFF_ID,
    observed: 'healthy',
    freshness,
    checkedAt: originalCheckedAt || null,
    materiality: 'none',
    attribution: 'process-recent',
    title: TEXTE.aktuelleHinweiseKeinSignalTitel,
    explanation: TEXTE.aktuelleHinweiseKeinSignal,
    proves: TEXTE.aktuelleHinweiseProzessBeweis,
    doesNotProve: 'Nicht, dass alle Systeme gesund sind, und nicht, dass die aktuelle Sitzung airports gelesen hat.',
    limitations: [TEXTE.aktuelleHinweiseProzessGrenze],
    next: null,
  })
}

function erwarteteNichtKonfiguriertInsight(
  bericht: SystemHealthBericht,
  access: AnalystAccess,
  originalCheckedAt: string | null,
  nowMs: number,
): AnalystInsight | null {
  const ids = erwarteteNichtKonfigurierte(bericht)
  if (ids.length === 0) return null
  const freshness = berichtFreshness(bericht, nowMs)
  return basisInsight({
    id: insightId('system-health-collection', 'expected-not-configured', 'not_configured', freshness.state),
    sourceItemId: 'system-health-collection',
    sourceCheckId: null,
    observed: 'not_configured',
    freshness,
    checkedAt: originalCheckedAt || null,
    materiality: 'coverage',
    attribution: access.status === 'allowed' ? 'process-recent' : 'none',
    title: TEXTE.aktuelleHinweiseAbdeckungTitel,
    explanation: TEXTE.aktuelleHinweiseAbdeckungSatz,
    proves: 'Nur, dass diese Management-/CI-/DNS-Quellen in diesem Prozessstand nicht angebunden sind.',
    doesNotProve: 'Nicht Plattform-Health und nicht, dass Tokens angelegt werden müssen.',
    limitations: [TEXTE.aktuelleHinweiseProzessGrenze],
    next: null,
  })
}

function sammleKandidaten(
  bericht: SystemHealthBericht,
  access: AnalystAccess,
  notAttributed: Set<string>,
  originalCheckedAt: string | null,
): AnalystInsight[] {
  const insights: AnalystInsight[] = []

  for (const item of bericht.items) {
    if (istUeberzogenerGesamtClaim(item)) {
      continue
    }

    if (item.checks?.length) {
      for (const check of item.checks) {
        if (istDatenbankgestuetzterCheck(check.id) && notAttributed.has(check.id)) {
          continue
        }
        if (istErwarteteAbdeckung(check.id, check.status)) {
          continue
        }
        if (check.id === ZUGRIFF_ID && check.status === 'not_configured') {
          continue
        }
        if (check.id === PROZESS_ID && check.status === 'healthy' && check.freshness.state === 'fresh') {
          continue
        }
        if (check.id === DEPLOYMENT_ID && (check.status === 'unknown' || check.status === 'not_configured')) {
          continue
        }
        const insight = checkInsight(item, check, access, originalCheckedAt)
        if (insight) insights.push(insight)
      }
      continue
    }

    if (istErwarteteAbdeckung(item.id, item.status)) {
      continue
    }
    const insight = itemInsight(item, access, originalCheckedAt)
    if (insight) insights.push(insight)
  }

  return insights
}

function istErwarteteAbdeckung(id: string, status: HealthStatus): boolean {
  if (status !== 'not_configured' && status !== 'unknown') return false
  return (ERWARTETE_NICHT_KONFIGURIERTE_IDS as readonly string[]).includes(id)
}

function checkInsight(
  item: SystemHealthItem,
  check: SystemHealthCheck,
  access: AnalystAccess,
  originalCheckedAt: string | null,
): AnalystInsight | null {
  const klass = klassifiziere(check.status, check.freshness, check.id)
  if (!klass) return null
  const stale = check.freshness.state === 'stale'
  const explanation = [
    alsUnvertrautenText(check.summary),
    stale ? TEXTE.aktuelleHinweiseVeraltet : null,
  ]
    .filter(Boolean)
    .join(' ')

  return basisInsight({
    id: insightId(item.id, check.id, klass.observed, check.freshness.state),
    sourceItemId: item.id,
    sourceCheckId: check.id,
    observed: klass.observed,
    freshness: check.freshness,
    checkedAt: originalCheckedAt || item.checkedAt || null,
    materiality: klass.materiality,
    attribution: 'process-recent',
    title: checkTitel(check.name, klass.observed, stale),
    explanation,
    proves: overlayProves(check.proves, klass.observed),
    doesNotProve: alsUnvertrautenText(check.doesNotProve),
    limitations: [
      TEXTE.aktuelleHinweiseProzessGrenze,
      stale ? TEXTE.aktuelleHinweiseVeraltet : null,
    ],
    next: klass.next ? untersucheWennErlaubt(access) : null,
  })
}

function itemInsight(
  item: SystemHealthItem,
  access: AnalystAccess,
  originalCheckedAt: string | null,
): AnalystInsight | null {
  const klass = klassifiziere(item.status, item.freshness, item.id)
  if (!klass) return null
  const stale = item.freshness.state === 'stale'
  return basisInsight({
    id: insightId(item.id, 'item', klass.observed, item.freshness.state),
    sourceItemId: item.id,
    sourceCheckId: null,
    observed: klass.observed,
    freshness: item.freshness,
    checkedAt: originalCheckedAt || item.checkedAt || null,
    materiality: klass.materiality,
    attribution: 'process-recent',
    title: checkTitel(item.name, klass.observed, stale),
    explanation: [alsUnvertrautenText(item.summary), stale ? TEXTE.aktuelleHinweiseVeraltet : null]
      .filter(Boolean)
      .join(' '),
    proves: overlayProves(item.proves, klass.observed),
    doesNotProve: alsUnvertrautenText(item.doesNotProve),
    limitations: [TEXTE.aktuelleHinweiseProzessGrenze, stale ? TEXTE.aktuelleHinweiseVeraltet : null],
    next: klass.next ? untersucheWennErlaubt(access) : null,
  })
}

function checkTitel(name: string, observed: AnalystObserved, stale: boolean): string {
  if (observed === 'unavailable') return `${name} nicht erreichbar`
  if (observed === 'degraded') return `${name} eingeschränkt`
  if (observed === 'unknown') return `${name} unbekannt`
  if (stale) return `${name} — ${TEXTE.aktuelleHinweiseVeraltet}`
  return name
}

function klassifiziere(
  status: HealthStatus,
  freshness: HealthFreshness,
  id: string,
): { observed: AnalystObserved; materiality: AnalystInsight['materiality']; next: boolean } | null {
  if (status === 'healthy' && freshness.state === 'fresh') {
    return null
  }
  if (status === 'unavailable') {
    return { observed: 'unavailable', materiality: 'attention', next: true }
  }
  if (status === 'degraded') {
    return { observed: 'degraded', materiality: 'attention', next: true }
  }
  if (status === 'healthy') {
    return { observed: 'healthy', materiality: 'attention', next: true }
  }
  if (status === 'unknown' && id === ZUGRIFF_ID) {
    return { observed: 'unknown', materiality: 'coverage', next: true }
  }
  if (status === 'unknown' || status === 'not_configured') {
    return { observed: status, materiality: 'coverage', next: false }
  }
  return null
}

function istKeinSignal(
  bericht: SystemHealthBericht,
  grant: 'role' | 'break-glass',
  notAttributed: Set<string>,
  vorhandene: readonly AnalystInsight[],
): boolean {
  if (grant !== 'role') return false
  if (notAttributed.has(ZUGRIFF_ID)) return false
  const zugriff = sucheCheck(bericht, ZUGRIFF_ID)
  if (!zugriff || zugriff.status !== 'healthy' || zugriff.freshness.state !== 'fresh') return false
  if (vorhandene.some((insight) => insight.materiality === 'attention')) return false
  if (!systemHealthIdsVollstaendig(bericht)) return false
  if (bericht.items.some((item) => istUeberzogenerGesamtClaim(item))) return false

  for (const item of bericht.items) {
    if (item.status !== 'unknown' && item.status !== 'not_configured') return false
    for (const check of item.checks ?? []) {
      if (check.id === ZUGRIFF_ID) continue
      if (check.id === PROZESS_ID && check.status === 'healthy') continue
      if (check.status !== 'unknown' && check.status !== 'not_configured') return false
    }
  }
  return true
}

function baueCoverage(
  bericht: SystemHealthBericht,
  grant: 'role' | 'break-glass',
  notAttributed: Set<string>,
): AnalystCoverage {
  const evidenced = new Set<string>()
  const notConfigured = new Set<string>()
  const unknown = new Set<string>()
  const failed = new Set<string>()

  for (const item of bericht.items) {
    if (item.status === 'not_configured') notConfigured.add(item.id)
    if (item.status === 'unknown') unknown.add(item.id)
    if (item.status === 'unavailable') failed.add(item.id)

    for (const check of item.checks ?? []) {
      if (notAttributed.has(check.id) || (grant === 'break-glass' && istDatenbankgestuetzterCheck(check.id))) {
        continue
      }
      if (check.status === 'healthy' && check.freshness.state === 'fresh') evidenced.add(check.id)
      if (check.status === 'not_configured') notConfigured.add(check.id)
      if (check.status === 'unknown') unknown.add(check.id)
      if (check.status === 'unavailable') failed.add(check.id)
    }
  }

  for (const id of ERWARTETE_NICHT_KONFIGURIERTE_IDS) {
    if (hatId(bericht, id)) {
      const status = statusVon(bericht, id)
      if (status === 'not_configured') notConfigured.add(id)
    }
  }

  return {
    evidenced: [...evidenced],
    notConfigured: [...notConfigured],
    unknown: [...unknown],
    failed: [...failed],
    notAttributed: [...notAttributed],
  }
}

function hatId(bericht: SystemHealthBericht, id: string): boolean {
  if (bericht.items.some((item) => item.id === id)) return true
  return bericht.items.some((item) => item.checks?.some((check) => check.id === id))
}

function statusVon(bericht: SystemHealthBericht, id: string): HealthStatus | null {
  const item = sucheItem(bericht, id as SystemHealthId)
  if (item) return item.status
  return sucheCheck(bericht, id)?.status ?? null
}

function erwarteteNichtKonfigurierte(bericht: SystemHealthBericht): string[] {
  return ERWARTETE_NICHT_KONFIGURIERTE_IDS.filter((id) => {
    const status = statusVon(bericht, id)
    return status === 'not_configured' || status === 'unknown'
  })
}

function berichtFreshness(bericht: SystemHealthBericht, nowMs: number): HealthFreshness {
  const app = sucheItem(bericht, 'app')
  const ttl = app?.freshness.ttlMs ?? SYSTEM_HEALTH_TTL_MS.app
  return frischeAus(bericht.checkedAt, nowMs, ttl)
}

function dedupliziere(insights: AnalystInsight[]): AnalystInsight[] {
  const nachCheck = new Map<string, AnalystInsight>()
  const ohneCheck: AnalystInsight[] = []
  for (const insight of insights) {
    const schluessel = insight.sourceCheckId
      ? `${insight.sourceItemId}:${insight.sourceCheckId}:${insight.observed}:${insight.freshness.state}`
      : insight.id
    if (!insight.sourceCheckId && insight.sourceItemId !== 'system-health-collection') {
      if (insights.some((andere) => andere.sourceItemId === insight.sourceItemId && andere.sourceCheckId)) {
        continue
      }
    }
    if (nachCheck.has(schluessel)) continue
    nachCheck.set(schluessel, insight)
    ohneCheck.push(insight)
  }
  return ohneCheck
}

function rang(insight: AnalystInsight): number {
  if (insight.observed === 'access_denied' || insight.observed === 'lookup-failed') return 0
  if (insight.observed === 'source_failed' || insight.observed === 'partial_failed') return 1
  if (insight.observed === 'unavailable') return 2
  if (insight.observed === 'degraded') return 3
  if (insight.freshness.state === 'stale' && insight.materiality === 'attention') return 4
  if (insight.observed === 'unknown' && insight.next) return 5
  if (insight.materiality === 'none') return 7
  return 6
}

function itemRang(id: AnalystInsight['sourceItemId']): number {
  const index = SYSTEM_HEALTH_IDS.indexOf(id as SystemHealthId)
  return index === -1 ? SYSTEM_HEALTH_IDS.length : index
}

function sortiere(insights: AnalystInsight[]): AnalystInsight[] {
  return [...insights].sort((a, b) => {
    const r = rang(a) - rang(b)
    if (r !== 0) return r
    const i = itemRang(a.sourceItemId) - itemRang(b.sourceItemId)
    if (i !== 0) return i
    const c = (a.sourceCheckId ?? 'item').localeCompare(b.sourceCheckId ?? 'item')
    if (c !== 0) return c
    return a.id.localeCompare(b.id)
  })
}

function abschluss(
  teil: Omit<AnalystBericht, 'writeActions' | 'modelExplanation'>,
  originalCheckedAt: string | null,
): AnalystBericht {
  const insights = teil.insights.map((insight) => ({
    ...insight,
    checkedAt: originalCheckedAt !== null && originalCheckedAt !== undefined
      ? originalCheckedAt || insight.checkedAt
      : insight.checkedAt,
    proves: overlayProves(insight.proves, insight.observed),
    title: alsUnvertrautenText(insight.title),
    explanation: alsUnvertrautenText(insight.explanation),
    doesNotProve: alsUnvertrautenText(insight.doesNotProve),
    limitations: limitationen(insight.limitations),
    next: normalisiereNext(insight.next),
  }))

  return {
    ...teil,
    sourceCheckedAt: originalCheckedAt || null,
    insights,
    writeActions: [],
    modelExplanation: { enabled: false },
  }
}

function normalisiereNext(next: AnalystInsight['next']): AnalystInsight['next'] {
  if (!next) return null
  if (next.href !== '/admin/system-health' || next.kind !== 'investigate') return null
  return {
    href: '/admin/system-health',
    label: alsUnvertrautenText(next.label || TEXTE.aktuelleHinweiseUntersuchen),
    kind: 'investigate',
  }
}
