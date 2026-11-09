// Pure display only. Input is the already validated/reproved server answer;
// presentation cannot qualify a source, approve a method or select a passport.
import { landAnzeigeText } from '@/lib/country/darstellung'
import { OFFICIAL_ANFORDERUNG_BEZEICHNUNG, OFFICIAL_ERGEBNIS_BEZEICHNUNG,
  OFFICIAL_VISA_MODUS_BEZEICHNUNG, officialActionZweckText } from '@/lib/readiness/bezeichnungen'
import { officialPruefzeitText } from '@/lib/readiness/official-presentation'
import type { RegulierungsAusdruckV2, RegulierungsPraedikatV2 } from '@/lib/readiness/regulierungs-anwendbarkeit'
import type { StayOutcomeV2 } from '@/lib/readiness/rule-claims'
import { officialTemporalTexte, type EventDeadlineV2 } from '@/lib/readiness/temporal'
import type { V3GlobalRuleContext, V3RuleFact, V3VisitorInput } from '../contract'
import type { V3VisitorAnswer } from './query'

type Statement = Readonly<{ text: string; when: string | null; href: string | null }>
export type V3VisitorViewResult =
  | Readonly<{ status: 'accepted'; title: string; conditions: readonly string[]; statements: readonly Statement[];
      source: Readonly<{ label: string; href: string }>; checkedAtText: string; validityText: string; ruleVersion: number }>
  | Readonly<{ status: 'pending' | 'conflict' | 'unavailable' | 'error'; title: string; message: string }>
export type V3VisitorView = Readonly<{
  input: V3VisitorInput; synthetic: boolean;
  cells: readonly Readonly<{ country: string; label: string; results: readonly V3VisitorViewResult[] }>[];
}>

const PURPOSE = { visitor: 'Besuch', business: 'Geschäftsreise', study: 'Studium', medical: 'medizinische Behandlung',
  transit: 'Transit', work: 'Arbeit', creative_worker: 'kreative Berufstätigkeit', other: 'anderer Reisezweck' } as const
const DOCUMENT = { ordinary: 'gewöhnliches Reisedokument', diplomatic: 'Diplomatenpass', official: 'Dienstpass',
  emergency: 'Notreisedokument', refugee_travel_document: 'Reiseausweis für Flüchtlinge', laissez_passer: 'Laissez-passer' } as const
const PERMISSION = { entry_clearance: 'vorherige Einreisebewilligung', permission_to_enter_or_stay: 'Einreise- oder Aufenthaltsbewilligung',
  electronic_travel_authorization: 'elektronische Reisegenehmigung', visa: 'Visum', residence_permit: 'Aufenthaltstitel' } as const
const COUNTING = { unspecified: 'Zählweise nicht bestimmt', calendar_dates_inclusive: 'Ein- und Ausreisetag zählen mit',
  calendar_dates_exit_exclusive: 'Einreisetag zählt mit, Ausreisetag zählt nicht mit' } as const
const ACTIVITY = { remunerative_activity: 'entgeltliche Tätigkeit', income_earning_activity: 'einkommenserzielende Tätigkeit',
  profit_making_business_operation: 'gewinnorientierter Geschäftsbetrieb', business_contacts: 'Geschäftskontakte' } as const
const unit = (value: number, kind: 'days' | 'months' | 'years') =>
  `${value} ${kind === 'days' ? (value === 1 ? 'Tag' : 'Tage') : kind === 'months' ? (value === 1 ? 'Monat' : 'Monate') : (value === 1 ? 'Jahr' : 'Jahre')}`

function predicateText(predicate: RegulierungsPraedikatV2): string {
  switch (predicate.kind) {
    case 'travel_purpose': return `Reisezweck: ${PURPOSE[predicate.purpose]}`
    case 'document_class': return `Dokumentklasse: ${DOCUMENT[predicate.documentClass]}`
    case 'planned_stay_duration': return `Aufenthalt ${predicate.comparison === 'at_most' ? 'höchstens' : 'länger als'} ${unit(predicate.duration.value, predicate.duration.unit)} (${COUNTING[predicate.counting]})`
    case 'destination_permission': return `Am Reisetag gültige ${PERMISSION[predicate.permissionClass]} für ${landAnzeigeText(predicate.destinationCountryCode)}`
    case 'lawful_residence': return `Rechtmäßiger Aufenthalt in ${landAnzeigeText(predicate.countryCode)}${predicate.departure === 'unrestricted' ? ', Ausreise uneingeschränkt' : ', Ausreisebedingungen nicht bestimmt'}`
    case 'journey_origin': return `Reisebeginn: ${predicate.place.kind === 'country' ? landAnzeigeText(predicate.place.countryCode) : 'Common Travel Area'}`
    case 'age_on_travel_date': return `Alter am Reisetag ${predicate.comparison === 'at_least' ? 'mindestens' : 'höchstens'} ${predicate.years} Jahre`
    case 'issuing_country': return `Ausstellungsland des Dokuments: ${landAnzeigeText(predicate.countryCode)}`
    case 'citizenship_includes': return `Staatsangehörigkeit umfasst ${landAnzeigeText(predicate.countryCode)}`
    case 'credential_citizenship_link': return `Dokument gehört zur Staatsangehörigkeit ${landAnzeigeText(predicate.countryCode)}`
    case 'national_passport_for_citizenship': return `Nationaler Reisepass für die Staatsangehörigkeit ${landAnzeigeText(predicate.countryCode)}`
    case 'nationality_status': return predicate.status === 'british_national_overseas' ? 'Status British National (Overseas)' : 'Status British Overseas Territories Citizen'
    case 'institution_status': return predicate.status === 'confirmed_german_school' ? 'Bestätigte deutsche Schule' : 'Schule des französischen Bildungsministeriums'
    case 'group_size_at_least': return `Gruppe mit mindestens ${predicate.count} Personen`
    case 'group_membership': return 'Die reisende Person gehört zur Gruppe'
    case 'authority_confirmation': return 'Die Behörde hat den Institutionsstatus bestätigt'
    case 'activity_characteristic': return `Tätigkeitsmerkmal: ${ACTIVITY[predicate.characteristic]}`
  }
}

/** Retains every logical branch and negation; it does not evaluate a traveller. */
export function v3ConditionText(expression: RegulierungsAusdruckV2): string {
  if (expression.op === 'atomic') return predicateText(expression.predicate)
  if (expression.op === 'not') return `NICHT (${v3ConditionText(expression.operand)})`
  return expression.operands.map((item) => `(${v3ConditionText(item)})`).join(expression.op === 'all' ? ' UND ' : ' ODER ')
}

function contextText(context: V3GlobalRuleContext): string[] {
  const output = [context.route === 'direct_entry' ? 'Direkte Einreise ohne Transit'
    : context.route === 'transit' ? `Transit über ${landAnzeigeText(context.scope.transitCountryCode!)}` : 'Reiseroute noch ungeklärt']
  const credential = context.scope.credentialOption
  if (credential.mode === 'not_applicable') output.push('Für diese Regel ist keine bestimmte Dokumentoption Voraussetzung')
  else output.push(`${credential.documentType === 'passport' ? 'Reisepass' : credential.documentType === 'national_id' ? 'Personalausweis' : 'Dokumenttyp noch ungeklärt'}; Ausstellungsland ${landAnzeigeText(credential.issuingCountryCode)}; zugeordnete Staatsangehörigkeit ${credential.relatedCitizenshipCountryCode ? landAnzeigeText(credential.relatedCitizenshipCountryCode) : 'ungeklärt'}`)
  if (context.scope.residence.mode === 'required') output.push(`Wohnsitz: ${landAnzeigeText(context.scope.residence.countryCode)}`)
  if (context.conditions.status === 'specified') output.push(v3ConditionText(context.conditions.expression))
  else if (context.conditions.status === 'unresolved') output.push('Weitere Regelbedingungen sind noch ungeklärt')
  else output.push('Keine weiteren Bedingungen im geprüften Regelkontext')
  return output
}

const statement = (text: string, when: string | null = null, href: string | null = null): Statement => ({ text, when, href })
const visaOutcome = (eligibility: string, mandate: string) =>
  `${eligibility === 'allowed' ? 'Zulässig' : eligibility === 'not_allowed' ? 'Nicht zulässig' : 'Zulässigkeit ungeklärt'}; ${mandate === 'mandatory' ? 'verpflichtend' : mandate === 'not_mandatory' ? 'nicht verpflichtend' : 'Pflichtstatus ungeklärt'}`
const effectText = (effect: 'required' | 'not_required', visaMode: keyof typeof OFFICIAL_VISA_MODUS_BEZEICHNUNG | null) =>
  `${OFFICIAL_ERGEBNIS_BEZEICHNUNG[effect]}${visaMode ? ` · ${OFFICIAL_VISA_MODUS_BEZEICHNUNG[visaMode]}` : ''}`

const deadlineText = (deadline: EventDeadlineV2) =>
  `${deadline.semantics === 'mandatory' ? 'Pflichtfrist' : 'Empfehlung'}: Aufenthaltsverlängerung vor Ablauf der derzeitigen Aufenthaltsbewilligung in ${landAnzeigeText(deadline.reference.countryCode)} beantragen`
function stayV2Text(outcome: StayOutcomeV2): string[] {
  const lines: string[] = []
  if (outcome.perVisit) lines.push(`Pro Aufenthalt: ${unit(outcome.perVisit.value, outcome.perVisit.unit)}`)
  if (outcome.initialGrant) lines.push(`Bei Erteilung der Einreisebewilligung: ${unit(outcome.initialGrant.quantity.value, outcome.initialGrant.quantity.unit)}`)
  if (outcome.extension) {
    lines.push(`Verlängerung ${outcome.extension.requiresApplication ? 'nur auf Antrag' : 'ohne Antrag'}; insgesamt höchstens ${unit(outcome.extension.maximumTotal.value, outcome.extension.maximumTotal.unit)}`)
    if (outcome.extension.applicationDeadline) lines.push(deadlineText(outcome.extension.applicationDeadline))
    if (outcome.extension.authority) lines.push(`Zuständig: Einwanderungsbehörde ${landAnzeigeText(outcome.extension.authority.countryCode)}`)
  }
  lines.push(outcome.borderDiscretion === 'fixed' ? 'Die Dauer ist festgelegt' : outcome.borderDiscretion === 'may_be_shorter'
    ? 'Die Grenzbehörde kann eine kürzere Dauer bewilligen' : 'Die Grenzbehörde bestimmt die Dauer')
  return lines
}

function factText(container: V3RuleFact): Statement[] {
  const fact = container.fact
  if (fact.kind === 'requirement_effect') {
    if ('applicability' in fact && fact.applicability.kind === 'branches') return fact.applicability.branches.map((branch) =>
      statement(effectText(branch.outcome.effect, branch.outcome.visaMode), branch.when.kind === 'otherwise'
        ? 'In allen übrigen Fällen' : v3ConditionText(branch.when.expression)))
    return 'effect' in fact ? [statement(effectText(fact.effect, fact.visaMode))] : []
  }
  if (fact.kind === 'visa_options') return fact.options.flatMap((option) => {
    const label = OFFICIAL_VISA_MODUS_BEZEICHNUNG[option.visaMode]
    if ('applicability' in option && option.applicability.kind === 'branches') return option.applicability.branches.map((branch) =>
      statement(`${label}: ${visaOutcome(branch.outcome.eligibility, branch.outcome.mandate)}`, branch.when.kind === 'otherwise'
        ? 'In allen übrigen Fällen' : v3ConditionText(branch.when.expression)))
    return 'eligibility' in option ? [statement(`${label}: ${visaOutcome(option.eligibility, option.mandate)}`)] : []
  })
  if (fact.kind === 'blank_passport_pages') return [statement(`Mindestens ${fact.minimumPages} freie Passseite${fact.minimumPages === 1 ? '' : 'n'}`)]
  if (fact.kind === 'stay_limit') {
    if ('schema' in fact) {
      if ('outcome' in fact) return stayV2Text(fact.outcome).map((line) => statement(line))
      return fact.applicability.branches.flatMap((branch) => stayV2Text(branch.outcome).map((line) => statement(line,
        branch.when.kind === 'otherwise' ? 'In allen übrigen Fällen' : v3ConditionText(branch.when.expression))))
    }
    const result: Statement[] = []
    if (fact.perVisit) result.push(statement(`Pro Aufenthalt: ${unit(fact.perVisit.value, fact.perVisit.unit)}`))
    if (fact.rollingWindow) result.push(statement(`In jedem Zeitraum von ${unit(fact.rollingWindow.within.value, fact.rollingWindow.within.unit)} insgesamt höchstens ${unit(fact.rollingWindow.maximum.value, fact.rollingWindow.maximum.unit)}`))
    if (fact.initialGrant) result.push(statement(`Erste Bewilligung: ${unit(fact.initialGrant.value, fact.initialGrant.unit)}`))
    if (fact.extension) result.push(statement(`Verlängerung ${fact.extension.requiresApplication ? 'nur auf Antrag' : 'ohne Antrag'}; insgesamt höchstens ${unit(fact.extension.maximumTotal.value, fact.extension.maximumTotal.unit)}`))
    result.push(statement(fact.borderDiscretion === 'fixed' ? 'Die Dauer ist festgelegt' : fact.borderDiscretion === 'may_be_shorter'
      ? 'Die Grenzbehörde kann eine kürzere Dauer bewilligen' : 'Die Grenzbehörde bestimmt die Dauer'))
    return result
  }
  if (fact.kind === 'passport_validity') {
    const semantics = { valid_on_entry: 'Bei Einreise gültig', valid_through_stay: 'Während des gesamten Aufenthalts gültig',
      minimum_remaining_from_entry: 'Mindestrestgültigkeit ab Einreise', minimum_remaining_from_planned_departure: 'Mindestrestgültigkeit ab geplanter Ausreise',
      minimum_remaining_at_application: 'Mindestrestgültigkeit bei Antragstellung', expired_document_exception: 'Ausnahme für abgelaufene Dokumente' }
    return [statement(`${semantics[fact.semantics]}${fact.duration ? `: ${unit(fact.duration.value, fact.duration.unit)}` : ''}`)]
  }
  if (fact.kind === 'official_actions') return fact.actions.map((action) => statement(
    `${officialActionZweckText(action.purpose)}${action.visaMode ? ` · ${OFFICIAL_VISA_MODUS_BEZEICHNUNG[action.visaMode]}` : ''}`, null, action.href))
  if (fact.kind === 'temporal_rule') {
    if ('rule' in fact) return officialTemporalTexte(fact.rule).map((text) => statement(text))
    if ('outcome' in fact) return [statement(deadlineText(fact.outcome))]
    return fact.applicability.branches.map((branch) => statement(deadlineText(branch.outcome),
      branch.when.kind === 'otherwise' ? 'In allen übrigen Fällen' : v3ConditionText(branch.when.expression)))
  }
  const transport = { air: 'Flug', land: 'Landweg', sea: 'Seeweg' }
  return fact.paths.map((path, index) => {
    const parts = [`Transitoption ${index + 1}`]
    const boolean = (value: boolean | null, yes: string, no: string, unknown: string) => parts.push(value === null ? unknown : value ? yes : no)
    boolean(path.crossesBorderControl, 'Grenzkontrolle wird passiert', 'Grenzkontrolle wird nicht passiert', 'Grenzkontrolle ungeklärt')
    boolean(path.leavesTransitArea, 'Transitbereich wird verlassen', 'Transitbereich wird nicht verlassen', 'Verlassen des Transitbereichs ungeklärt')
    boolean(path.thirdCountryRequired, 'Weiterreise in ein Drittland erforderlich', 'Kein Drittland erforderlich', 'Drittlandvoraussetzung ungeklärt')
    boolean(path.sameFlightRequired, 'Derselbe Flug erforderlich', 'Flugwechsel möglich', 'Flugwechsel ungeklärt')
    boolean(path.onwardTicketRequired, 'Weiterflug-/Weiterreiseticket erforderlich', 'Kein Weiterreiseticket erforderlich', 'Weiterreiseticketvoraussetzung ungeklärt')
    parts.push(path.transitAirportCodes ? `Flughäfen: ${path.transitAirportCodes.join(', ')}` : 'Flughafenbindung nicht bestimmt')
    parts.push(path.maxTransitDurationMinutes === null ? 'Maximale Transitdauer nicht bestimmt' : `Höchstens ${path.maxTransitDurationMinutes} Minuten Transit`)
    parts.push(`Ankunft: ${path.arrivalMode ? transport[path.arrivalMode] : 'nicht bestimmt'}; Abreise: ${path.departureMode ? transport[path.departureMode] : 'nicht bestimmt'}`)
    return statement(parts.join(' · '))
  })
}

/** Called after server validation/reproof; no raw payload or exception is shown. */
export function presentV3VisitorAnswer(answer: V3VisitorAnswer): V3VisitorView {
  return { input: answer.response.input, synthetic: answer.response.dataMode === 'synthetic_test',
    cells: answer.response.cells.map((cell) => ({ country: cell.citizenshipCountryCode,
      label: landAnzeigeText(cell.citizenshipCountryCode), results: cell.results.map((result): V3VisitorViewResult => {
        if (result.status === 'accepted') {
          const projection = result.projection, source = answer.sources[projection.reference]
          if (!source) return { status: 'unavailable', title: 'Derzeit nicht verfügbar', message: 'Der amtliche Quellenverweis konnte nicht bestätigt werden.' }
          const validity = projection.rule.subject.evidence.legalValidity
          return { status: 'accepted', title: OFFICIAL_ANFORDERUNG_BEZEICHNUNG[projection.rule.subject.context.scope.requirementType],
            conditions: contextText(projection.rule.subject.context), statements: factText(projection.rule.subject.fact),
            source: { label: source.authorityName, href: source.href },
            checkedAtText: (officialPruefzeitText(projection.sourceCheckedAt) ?? 'Quellenstand nicht verfügbar').replace('Jetnity-Prüfung', 'Stand vom'),
            validityText: validity.status === 'specified' ? `Gültigkeit: ${validity.validFrom ? `ab ${validity.validFrom}` : 'kein Beginn angegeben'} · ${validity.validUntil ? `bis ${validity.validUntil}` : 'kein Ende angegeben'}` : 'Gültigkeit noch ungeklärt',
            ruleVersion: projection.rule.revision }
        }
        if (result.status === 'pending') return { status: 'pending', title: 'Wird geprüft', message: 'Die Recherche zu amtlichen Angaben wurde angenommen. Bitte später erneut abrufen.' }
        if (result.status === 'conflict') return { status: 'conflict', title: 'Amtliche Angaben werden geklärt', message: result.reason === 'primary_unclear'
          ? 'Die maßgebliche amtliche Aussage ist unklar. Bis zur Klärung wird keine Regel angezeigt.'
          : 'Amtliche Quellen widersprechen sich. Bis zur Klärung wird keine Regel angezeigt.' }
        if (result.status === 'error') return { status: 'error', title: 'Abfrage fehlgeschlagen', message: result.retryable
          ? 'Der Auskunftsdienst ist vorübergehend nicht erreichbar. Bitte erneut versuchen.' : 'Die Antwort konnte nicht verlässlich gelesen werden.' }
        return { status: 'unavailable', title: 'Derzeit nicht verfügbar', message: result.reason === 'expired'
          ? 'Der bisherige Quellenstand ist nicht mehr aktuell.' : result.reason === 'withdrawn'
            ? 'Die bisherige Regel wurde zurückgenommen.' : result.reason === 'conditions_unresolved'
              ? 'Die Bedingungen dieser Regel sind noch nicht eindeutig geklärt.' : 'Für diese Kombination ist aktuell keine verlässliche Auskunft verfügbar.' }
      }) })) }
}
