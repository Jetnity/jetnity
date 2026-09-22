import { messageForDenial } from '@/lib/auth/admin-access'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import {
  PROVIDER_OPS_BOARD_STATUSES,
  type BoardFreshness,
  type ProviderOpsBoardBericht,
  type ProviderOpsBoardItem,
  type ProviderOpsBoardStatus,
} from '@/lib/admin/provider-ops-board/typen'
import {
  LEERE_MODEL_USAGE_ABDECKUNG,
  MODEL_USAGE_DENIAL_TO_OBSERVED,
  MODEL_USAGE_INSIGHT_KIND,
  MODEL_USAGE_ITEM_ID,
  MODEL_USAGE_SOURCE,
  MODEL_USAGE_TTL_MS,
  MODEL_USAGE_UNTERSUCHEN,
  type ModelUsageAccess,
  type ModelUsageAttribution,
  type ModelUsageBericht,
  type ModelUsageCoverage,
  type ModelUsageInsight,
  type ModelUsageMateriality,
  type ModelUsageObserved,
} from './model-usage-typen'

const TEXTE = ADMIN_EHRLICHE_TEXTE
const SITZUNG_MUSTER = /in dieser Sitzung|in this session/i
const VERBOTENE_ALTERSBEHAUPTUNG = /höchstens 30s|hoechstens 30s|at most 30s old/i
const VERBOTENE_QUELLLECKS =
  /kosten_mikro|kostenMikroUsd|juengsteCreatedAt|sk_live_|Bearer |<script|onerror=|victim@|admin@|prompt=/i

const UNBEKANNTE_FRISCHE: BoardFreshness = {
  state: 'unknown',
  ageMs: null,
  ttlMs: MODEL_USAGE_TTL_MS,
}

export type ModelUsageInsightEingabe = {
  access: ModelUsageAccess
  board?: ProviderOpsBoardBericht | null
  nowMs: number
  sourceFailed?: boolean
}

function alsUnvertrautenModelUsageText(wert: string): string {
  return wert
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/[<>]/g, '')
}

export function enthältVerboteneModelUsageAltersbehauptung(text: string): boolean {
  return VERBOTENE_ALTERSBEHAUPTUNG.test(text)
}

export function enthältVerbotenesModelUsageQuellleck(text: string): boolean {
  return VERBOTENE_QUELLLECKS.test(text) || SITZUNG_MUSTER.test(text)
}

/** Exact collector contract: `new Date(ms).toISOString()` → `YYYY-MM-DDTHH:mm:ss.sssZ`. */
const COLLECTOR_ISO_INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/

/**
 * Retain only an evidenced collector instant. Annotated, timezone-free,
 * calendar-impossible and Date.parse-permissive strings are discarded.
 */
export function parseEvidencedIsoInstant(wert: string | null | undefined): string | null {
  if (typeof wert !== 'string' || wert.length !== 24) return null
  const treffer = COLLECTOR_ISO_INSTANT.exec(wert)
  if (!treffer) return null
  const jahr = Number(treffer[1])
  const monat = Number(treffer[2])
  const tag = Number(treffer[3])
  const stunde = Number(treffer[4])
  const minute = Number(treffer[5])
  const sekunde = Number(treffer[6])
  const milli = Number(treffer[7])
  if (monat < 1 || monat > 12) return null
  if (stunde > 23 || minute > 59 || sekunde > 59) return null
  const tageImMonat = new Date(Date.UTC(jahr, monat, 0)).getUTCDate()
  if (tag < 1 || tag > tageImMonat) return null
  const rekonstruiert = new Date(Date.UTC(jahr, monat - 1, tag, stunde, minute, sekunde, milli))
  if (
    rekonstruiert.getUTCFullYear() !== jahr ||
    rekonstruiert.getUTCMonth() !== monat - 1 ||
    rekonstruiert.getUTCDate() !== tag ||
    rekonstruiert.getUTCHours() !== stunde ||
    rekonstruiert.getUTCMinutes() !== minute ||
    rekonstruiert.getUTCSeconds() !== sekunde ||
    rekonstruiert.getUTCMilliseconds() !== milli
  ) {
    return null
  }
  if (rekonstruiert.toISOString() !== wert) return null
  return wert
}

function istGueltigerModelUsageZeitpunkt(wert: string | null | undefined): boolean {
  return parseEvidencedIsoInstant(wert) !== null
}

function formatiereModelUsageAlter(ageMs: number): string {
  const sekunden = Math.max(0, Math.round(ageMs / 1000))
  if (sekunden < 120) return `${sekunden} Sekunden`
  const minuten = Math.round(sekunden / 60)
  if (minuten < 120) return `${minuten} Minuten`
  return `${Math.round(minuten / 60)} Stunden`
}

export function modelUsageBeobachtungsstand(
  insight: Pick<ModelUsageInsight, 'checkedAt' | 'freshness'>,
): {
  dateTime: string | null
  zeittext: string
  alterstext: string
} {
  if (!istGueltigerModelUsageZeitpunkt(insight.checkedAt)) {
    return { dateTime: null, zeittext: 'Prüfzeitpunkt unbekannt', alterstext: 'Alter unbekannt' }
  }
  const instant = new Date(insight.checkedAt as string)
  return {
    dateTime: instant.toISOString(),
    zeittext: `${instant.toLocaleString('de-CH', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'UTC',
    })} UTC`,
    alterstext: insight.freshness.ageMs == null ? 'Alter unbekannt' : `vor ${formatiereModelUsageAlter(insight.freshness.ageMs)}`,
  }
}

/**
 * Original item time + evaluation now + source TTL 120s.
 * Future timestamps stay unknown; they must not become fresh via Math.max clamp.
 */
export function berechneModelUsageFreshness(
  checkedAt: string | null | undefined,
  nowMs: number,
): BoardFreshness {
  const instant = parseEvidencedIsoInstant(checkedAt)
  if (!instant) {
    return { ...UNBEKANNTE_FRISCHE }
  }
  const geprueft = Date.parse(instant)
  const delta = nowMs - geprueft
  if (delta < 0) {
    return { ...UNBEKANNTE_FRISCHE }
  }
  return {
    state: delta > MODEL_USAGE_TTL_MS ? 'stale' : 'fresh',
    ageMs: delta,
    ttlMs: MODEL_USAGE_TTL_MS,
  }
}

function istGueltigesModelUsageItem(wert: unknown): wert is ProviderOpsBoardItem {
  if (!wert || typeof wert !== 'object') return false
  const item = wert as Record<string, unknown>
  if (item.id !== MODEL_USAGE_ITEM_ID) return false
  if (typeof item.status !== 'string') return false
  if (!(PROVIDER_OPS_BOARD_STATUSES as readonly string[]).includes(item.status)) return false
  if (item.checkedAt !== undefined && item.checkedAt !== null && typeof item.checkedAt !== 'string') {
    return false
  }
  return true
}

export function leiteModelUsageInsights(eingabe: ModelUsageInsightEingabe): ModelUsageBericht {
  const generatedAt = iso(eingabe.nowMs)

  if (eingabe.access.status === 'denied') {
    return deniedBericht(eingabe.access, generatedAt)
  }

  if (eingabe.access.grant === 'break-glass') {
    return breakGlassBericht(eingabe.access, generatedAt)
  }

  if (eingabe.sourceFailed || !eingabe.board) {
    return sourceFailedBericht(eingabe.access, generatedAt)
  }

  const auswahl = waehleModelUsageItem(eingabe.board)
  if (auswahl.art !== 'ok') {
    return partialBericht(eingabe.access, generatedAt, auswahl.art)
  }

  return statusBericht(eingabe.access, generatedAt, auswahl.item, eingabe.nowMs)
}

function iso(nowMs: number): string {
  return new Date(nowMs).toISOString()
}

function limitationen(teile: readonly (string | null | undefined)[]): string[] {
  const gesehen = new Set<string>()
  const liste: string[] = []
  for (const teil of teile) {
    if (!teil) continue
    const text = alsUnvertrautenModelUsageText(teil).trim()
    if (!text || enthältVerboteneModelUsageAltersbehauptung(text)) continue
    if (enthältVerbotenesModelUsageQuellleck(text)) continue
    if (gesehen.has(text)) continue
    gesehen.add(text)
    liste.push(text)
  }
  return liste
}

function untersucheWennRolle(access: ModelUsageAccess): ModelUsageInsight['next'] {
  return access.status === 'allowed' && access.grant === 'role' ? MODEL_USAGE_UNTERSUCHEN : null
}

function insightId(
  observed: ModelUsageObserved,
  freshness: BoardFreshness['state'],
  checkId: string | null = null,
): string {
  return `${MODEL_USAGE_SOURCE}:${MODEL_USAGE_ITEM_ID}:${checkId ?? 'item'}:${observed}:${freshness}`
}

function basisInsight(
  teil: Omit<ModelUsageInsight, 'kind' | 'category' | 'sourceItemId' | 'sourceRef' | 'next'> & {
    next?: ModelUsageInsight['next']
  },
): ModelUsageInsight {
  return {
    kind: MODEL_USAGE_INSIGHT_KIND,
    category: MODEL_USAGE_SOURCE,
    sourceItemId: MODEL_USAGE_ITEM_ID,
    sourceRef: MODEL_USAGE_SOURCE,
    next: teil.next ?? null,
    ...teil,
    title: alsUnvertrautenModelUsageText(teil.title),
    explanation: alsUnvertrautenModelUsageText(teil.explanation),
    proves: alsUnvertrautenModelUsageText(teil.proves),
    doesNotProve: alsUnvertrautenModelUsageText(teil.doesNotProve),
    limitations: limitationen(teil.limitations),
  }
}

function abschluss(teil: Omit<ModelUsageBericht, 'writeActions' | 'modelExplanation'>): ModelUsageBericht {
  const insights = teil.insights.map((insight) => ({
    ...insight,
    checkedAt: parseEvidencedIsoInstant(insight.checkedAt),
    title: alsUnvertrautenModelUsageText(insight.title),
    explanation: alsUnvertrautenModelUsageText(insight.explanation),
    proves: alsUnvertrautenModelUsageText(insight.proves),
    doesNotProve: alsUnvertrautenModelUsageText(insight.doesNotProve),
    limitations: limitationen(insight.limitations),
    next: normalisiereNext(insight.next),
  }))

  return {
    ...teil,
    source: MODEL_USAGE_SOURCE,
    insights,
    writeActions: [],
    modelExplanation: { enabled: false },
  }
}

function normalisiereNext(next: ModelUsageInsight['next']): ModelUsageInsight['next'] {
  if (!next) return null
  if (next.href !== '/admin/provider-ops' || next.kind !== 'investigate') return null
  return {
    href: '/admin/provider-ops',
    label: alsUnvertrautenModelUsageText(next.label || TEXTE.modellnutzungUntersuchen),
    kind: 'investigate',
  }
}

function deniedBericht(
  access: Extract<ModelUsageAccess, { status: 'denied' }>,
  generatedAt: string,
): ModelUsageBericht {
  const observed = MODEL_USAGE_DENIAL_TO_OBSERVED[access.denial]
  const denialText = messageForDenial(access.denial)
  const lookup = observed === 'lookup-failed'
  return abschluss({
    generatedAt,
    sourceCheckedAt: null,
    source: MODEL_USAGE_SOURCE,
    observationScope: 'none',
    access,
    insights: [
      basisInsight({
        id: insightId(observed, 'unknown'),
        sourceCheckId: null,
        observed,
        freshness: { ...UNBEKANNTE_FRISCHE },
        checkedAt: null,
        materiality: 'attention',
        attribution: 'none',
        title: lookup ? 'Berechtigung konnte nicht geprüft werden' : 'Modellnutzung nicht gelesen',
        explanation: `${denialText} ${TEXTE.modellnutzungOhnePruefung}`,
        proves: lookup
          ? 'Nur, dass die betrieb-lesen-Prüfung derzeit nicht belastbar war.'
          : 'Nur, dass diese Sitzung die Modellnutzung nicht lesen darf.',
        doesNotProve: lookup
          ? 'Nicht, dass die Sitzung abgemeldet ist, und nicht, dass keine Modellkosten entstanden sind.'
          : 'Nicht den Zustand aufgezeichneter Modellnutzung und nicht 0 USD.',
        limitations: [TEXTE.modellnutzungOhnePruefung],
        next: null,
      }),
    ],
    coverage: { ...LEERE_MODEL_USAGE_ABDECKUNG },
  })
}

function breakGlassBericht(
  access: Extract<ModelUsageAccess, { status: 'allowed' }>,
  generatedAt: string,
): ModelUsageBericht {
  return abschluss({
    generatedAt,
    sourceCheckedAt: null,
    source: MODEL_USAGE_SOURCE,
    observationScope: 'none',
    access,
    insights: [
      basisInsight({
        id: insightId('unknown', 'unknown', 'not-attributed'),
        sourceCheckId: 'not-attributed',
        observed: 'unknown',
        freshness: { ...UNBEKANNTE_FRISCHE },
        checkedAt: null,
        materiality: 'coverage',
        attribution: 'not_attributed',
        title: 'Modellnutzung nicht zugeschrieben',
        explanation: TEXTE.modellnutzungNotzugang,
        proves: 'Nur, dass Notzugang keine datenbankgestützte Modellnutzungs-Aussage trägt.',
        doesNotProve:
          'Nicht, dass model_usage leer, verfügbar oder ausgefallen ist, und nicht 0 USD.',
        limitations: [TEXTE.modellnutzungNotzugang, TEXTE.modellnutzungProzessGrenze],
        next: null,
      }),
    ],
    coverage: { ...LEERE_MODEL_USAGE_ABDECKUNG, notAttributed: [MODEL_USAGE_ITEM_ID] },
  })
}

function sourceFailedBericht(
  access: Extract<ModelUsageAccess, { status: 'allowed' }>,
  generatedAt: string,
): ModelUsageBericht {
  return abschluss({
    generatedAt,
    sourceCheckedAt: null,
    source: MODEL_USAGE_SOURCE,
    observationScope: 'none',
    access,
    insights: [
      basisInsight({
        id: insightId('source_failed', 'unknown'),
        sourceCheckId: null,
        observed: 'source_failed',
        freshness: { ...UNBEKANNTE_FRISCHE },
        checkedAt: null,
        materiality: 'attention',
        attribution: 'process-recent',
        title: 'Modellnutzungsquelle fehlgeschlagen',
        explanation: TEXTE.modellnutzungSammlungFehlt,
        proves: 'Nur, dass dieser Prozessstand die Modellnutzung nicht vollständig gelesen hat.',
        doesNotProve: 'Nicht, dass keine Kosten entstanden sind, und nicht einen leeren Read.',
        limitations: [TEXTE.modellnutzungProzessGrenze],
        next: untersucheWennRolle(access),
      }),
    ],
    coverage: { ...LEERE_MODEL_USAGE_ABDECKUNG, failed: [MODEL_USAGE_ITEM_ID] },
  })
}

function partialBericht(
  access: Extract<ModelUsageAccess, { status: 'allowed' }>,
  generatedAt: string,
  art: 'missing' | 'duplicate' | 'malformed',
): ModelUsageBericht {
  return abschluss({
    generatedAt,
    sourceCheckedAt: null,
    source: MODEL_USAGE_SOURCE,
    observationScope: 'process-recent',
    access,
    insights: [
      basisInsight({
        id: insightId('partial_failed', 'unknown', art),
        sourceCheckId: art,
        observed: 'partial_failed',
        freshness: { ...UNBEKANNTE_FRISCHE },
        checkedAt: null,
        materiality: 'attention',
        attribution: 'process-recent',
        title: 'Modellnutzung unvollständig',
        explanation: TEXTE.modellnutzungUnvollstaendig,
        proves: `Nur, dass die model-usage-Karte in diesem Stand ${art === 'missing' ? 'fehlt' : art === 'duplicate' ? 'doppelt vorkommt' : 'unbrauchbar ist'}.`,
        doesNotProve: 'Nicht den ersten Treffer, keinen gesunden Fallback und nicht 0 USD.',
        limitations: [TEXTE.modellnutzungProzessGrenze],
        next: untersucheWennRolle(access),
      }),
    ],
    coverage: { ...LEERE_MODEL_USAGE_ABDECKUNG, failed: [MODEL_USAGE_ITEM_ID] },
  })
}

function waehleModelUsageItem(
  board: ProviderOpsBoardBericht,
):
  | { art: 'ok'; item: ProviderOpsBoardItem }
  | { art: 'missing' | 'duplicate' | 'malformed' } {
  const kandidaten = Array.isArray(board.items)
    ? board.items.filter((item) => item && typeof item === 'object' && item.id === MODEL_USAGE_ITEM_ID)
    : []
  if (kandidaten.length === 0) return { art: 'missing' }
  if (kandidaten.length > 1) return { art: 'duplicate' }
  const item = kandidaten[0]
  if (!istGueltigesModelUsageItem(item)) return { art: 'malformed' }
  return { art: 'ok', item }
}

function statusBericht(
  access: Extract<ModelUsageAccess, { status: 'allowed' }>,
  generatedAt: string,
  item: ProviderOpsBoardItem,
  nowMs: number,
): ModelUsageBericht {
  const originalCheckedAt = parseEvidencedIsoInstant(
    typeof item.checkedAt === 'string' ? item.checkedAt : null,
  )
  const freshness = berechneModelUsageFreshness(originalCheckedAt, nowMs)
  const status = item.status
  const klass = klassifiziere(status, freshness)
  const coverage = baueCoverage(status, freshness, klass.attribution)

  return abschluss({
    generatedAt,
    sourceCheckedAt: originalCheckedAt,
    source: MODEL_USAGE_SOURCE,
    observationScope: 'process-recent',
    access,
    insights: [
      basisInsight({
        id: insightId(klass.observed, freshness.state),
        sourceCheckId: null,
        observed: klass.observed,
        freshness,
        checkedAt: originalCheckedAt,
        materiality: klass.materiality,
        attribution: klass.attribution,
        title: klass.title,
        explanation: klass.explanation,
        proves: klass.proves,
        doesNotProve: klass.doesNotProve,
        limitations: limitationen(klass.limitations),
        next: klass.next ? untersucheWennRolle(access) : null,
      }),
    ],
    coverage,
  })
}

function klassifiziere(
  status: ProviderOpsBoardStatus,
  freshness: BoardFreshness,
): {
  observed: ModelUsageObserved
  materiality: ModelUsageMateriality
  attribution: ModelUsageAttribution
  title: string
  explanation: string
  proves: string
  doesNotProve: string
  limitations: readonly (string | null)[]
  next: boolean
} {
  const stale = freshness.state === 'stale'
  const staleSatz = stale ? TEXTE.modellnutzungVeraltet : null
  const attribution: ModelUsageAttribution = 'process-recent'

  if (status === 'available') {
    return {
      observed: 'available',
      materiality: stale || freshness.state === 'unknown' ? 'attention' : 'coverage',
      attribution,
      title: stale ? `Modellnutzung lesbar — ${TEXTE.modellnutzungVeraltet}` : 'Modellnutzung lesbar',
      explanation: [TEXTE.modellnutzungAvailable, staleSatz].filter(Boolean).join(' '),
      proves: 'Nur, dass aufgezeichnete Modellnutzungszeilen in diesem begrenzten Read lesbar waren.',
      doesNotProve: TEXTE.modellnutzungKeinFinanzClaim,
      limitations: [TEXTE.modellnutzungProzessGrenze, TEXTE.modellnutzungFensterGrenze, staleSatz],
      next: true,
    }
  }

  if (status === 'empty') {
    return {
      observed: 'empty',
      materiality: stale || freshness.state === 'unknown' ? 'attention' : 'coverage',
      attribution,
      title: stale ? `Keine aufgezeichneten Einträge — ${TEXTE.modellnutzungVeraltet}` : 'Keine aufgezeichneten Einträge',
      explanation: [TEXTE.modellnutzungEmpty, staleSatz].filter(Boolean).join(' '),
      proves: 'Nur, dass dieser begrenzte Read keine aufgezeichnete Zeile gefunden hat.',
      doesNotProve: TEXTE.modellnutzungKeinNullSpend,
      limitations: [TEXTE.modellnutzungProzessGrenze, TEXTE.modellnutzungFensterGrenze, staleSatz],
      next: true,
    }
  }

  if (status === 'unavailable') {
    return {
      observed: 'unavailable',
      materiality: 'attention',
      attribution,
      title: 'Modellnutzung nicht erreichbar',
      explanation: [TEXTE.modellnutzungUnavailable, staleSatz].filter(Boolean).join(' '),
      proves: 'Nur, dass dieser Read fehlgeschlagen oder nicht rechtzeitig zurückgekommen ist.',
      doesNotProve: TEXTE.modellnutzungKeinNullSpend,
      limitations: [TEXTE.modellnutzungProzessGrenze, staleSatz],
      next: true,
    }
  }

  if (status === 'unknown') {
    return {
      observed: 'unknown',
      materiality: 'coverage',
      attribution,
      title: 'Modellnutzung unbekannt',
      explanation: [TEXTE.modellnutzungUnknown, staleSatz].filter(Boolean).join(' '),
      proves: 'Nur, dass in diesem Stand keine belastbare Modellnutzungs-Aussage vorliegt.',
      doesNotProve: 'Nicht, dass der Read leer war, und nicht 0 USD.',
      limitations: [TEXTE.modellnutzungProzessGrenze, staleSatz],
      next: true,
    }
  }

  return {
    observed: status,
    materiality: 'coverage',
    attribution,
    title: 'Keine nutzbare Modellnutzungs-Evidenz',
    explanation: [TEXTE.modellnutzungFoundation, staleSatz].filter(Boolean).join(' '),
    proves: 'Nur, dass dieser Stand keine nutzbare Modellnutzungs-Evidenz trägt.',
    doesNotProve: TEXTE.modellnutzungKeineAktivierung,
    limitations: [TEXTE.modellnutzungProzessGrenze, staleSatz],
    next: true,
  }
}

function baueCoverage(
  status: ProviderOpsBoardStatus,
  freshness: BoardFreshness,
  attribution: ModelUsageAttribution,
): ModelUsageCoverage {
  if (attribution === 'not_attributed') {
    return { ...LEERE_MODEL_USAGE_ABDECKUNG, notAttributed: [MODEL_USAGE_ITEM_ID] }
  }
  if (status === 'available' && freshness.state === 'fresh') {
    return { ...LEERE_MODEL_USAGE_ABDECKUNG, evidenced: [MODEL_USAGE_ITEM_ID] }
  }
  if (status === 'unavailable') {
    return { ...LEERE_MODEL_USAGE_ABDECKUNG, failed: [MODEL_USAGE_ITEM_ID] }
  }
  if (status === 'unknown') {
    return { ...LEERE_MODEL_USAGE_ABDECKUNG, unknown: [MODEL_USAGE_ITEM_ID] }
  }
  if (status === 'not_configured' || status === 'foundation_only' || status === 'disabled') {
    return { ...LEERE_MODEL_USAGE_ABDECKUNG, notConfigured: [MODEL_USAGE_ITEM_ID] }
  }
  return { ...LEERE_MODEL_USAGE_ABDECKUNG }
}

export function modelUsageBerichtTexte(bericht: ModelUsageBericht): string {
  return [
    TEXTE.modellnutzungHinweis,
    ...bericht.insights.flatMap((insight) => [
      insight.title,
      insight.explanation,
      insight.proves,
      insight.doesNotProve,
      ...insight.limitations,
    ]),
  ].join('\n')
}
