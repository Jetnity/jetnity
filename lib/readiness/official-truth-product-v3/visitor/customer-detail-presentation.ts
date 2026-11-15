// Pure display of a source-qualified canonical detail. This module does not
// validate a proposal, approve evidence or select facts for publication.
import type { V3CustomerInformationDetail, V3ResearchCost } from '../customer-information/details'

export type V3VisitorStatement = Readonly<{ text: string; when: string | null; href: string | null }>
const unavailable = 'Derzeit nicht verfügbar'
const statement = (text: string, href: string | null = null): V3VisitorStatement => ({ text, when: null, href })
type Duration = Readonly<{ value: number; unit: 'hours' | 'days' | 'months' | 'years' }>
const duration = ({ value, unit }: Duration) => `${value} ${({
  hours: value === 1 ? 'Stunde' : 'Stunden', days: value === 1 ? 'Tag' : 'Tage',
  months: value === 1 ? 'Monat' : 'Monate', years: value === 1 ? 'Jahr' : 'Jahre',
})[unit]}`
const boolean = (value: boolean | null, yes: string, no: string, unknown: string) =>
  value === true ? yes : value === false ? no : `${unknown}: ${unavailable}`
const moneyBasis = { per_person: 'pro Person', per_application: 'pro Antrag', per_entry: 'pro Einreise',
  per_day: 'pro Tag', per_stay: 'pro Aufenthalt', per_group: 'pro Gruppe' } as const
const money = (amount: Extract<V3ResearchCost, { status: 'specified' }>['amount']) =>
  `${amount.value} ${amount.currency} ${moneyBasis[amount.basis]}`
const cost = (value: V3ResearchCost) => value.status === 'unavailable' ? unavailable
  : value.status === 'free' ? 'Kostenlos' : money(value.amount)
type Action = NonNullable<Extract<V3CustomerInformationDetail, { kind: 'entry_form_details' }>['action']>
const action = (value: Action | null, missing: string): V3VisitorStatement => value
  ? statement(({ application: 'Amtlichen Antrag öffnen', form: 'Amtliches Formular öffnen',
    appointment: 'Amtlichen Termin vereinbaren', information: 'Amtliche Informationen öffnen' })[value.purpose], value.href)
  : statement(`${missing}: ${unavailable}`)

/** Every optional subfield remains explicit; null never becomes no requirement. */
export function presentV3CustomerDetail(detail: V3CustomerInformationDetail): readonly V3VisitorStatement[] {
  switch (detail.kind) {
    case 'vaccination_details': return detail.vaccines.flatMap(vaccine => [
      statement(`${detail.classification === 'required' ? 'Pflichtimpfung' : 'Empfohlene Impfung'}: ${vaccine.vaccineLabel} · ${vaccine.diseaseLabel}`),
      statement(`Mindestanzahl Dosen: ${vaccine.minimumDoses === null ? unavailable : vaccine.minimumDoses}`),
      statement(`Zeitabstand vor Einreise: ${vaccine.beforeEntry === null ? unavailable : duration(vaccine.beforeEntry)}`),
      statement(boolean(vaccine.certificateRequired, 'Impfnachweis erforderlich', 'Impfnachweis nicht erforderlich', 'Impfnachweis')),
    ])
    case 'health_measures': return detail.measures.flatMap(measure => [
      statement(`${measure.classification === 'required' ? 'Pflicht' : 'Empfehlung'}: ${{ test: 'Test', quarantine: 'Quarantäne',
        screening: 'Gesundheitskontrolle', isolation: 'Isolation', health_declaration: 'Gesundheitserklärung', treatment: 'Behandlung' }[measure.measure]} · ${measure.measureLabel}`),
      statement(`Dauer: ${measure.duration === null ? unavailable : duration(measure.duration)}`),
      statement(boolean(measure.proofRequired, 'Nachweis erforderlich', 'Nachweis nicht erforderlich', 'Nachweispflicht')),
    ])
    case 'entry_form_details': return [
      statement(`Formularname: ${detail.formTitle}`),
      statement(detail.completion === 'required' ? 'Das Formular ist erforderlich' : 'Das Formular ist freiwillig'),
      statement(`Formularkosten: ${cost(detail.cost)}`),
      statement(`Zeitpunkt: ${detail.due === null ? unavailable : ({ before_entry: 'vor der Einreise', on_arrival: 'bei Ankunft',
        before_departure: 'vor der Abreise' })[detail.due.relation]}`),
      ...(detail.due && detail.due.relation !== 'on_arrival' ? [statement(`Zeitlicher Abstand: ${detail.due.offset ? duration(detail.due.offset) : unavailable}`)] : []),
      action(detail.action, 'Amtlicher Link zum Formular'),
    ]
    case 'fee_details': return [
      statement(`Gebühr: ${detail.feeLabel}`),
      statement(`Zweck: ${{ visa: 'Visum', electronic_travel_authorization: 'elektronische Reisegenehmigung',
        entry_form: 'Einreiseformular', arrival: 'Einreise', departure: 'Ausreise', tourism: 'Tourismus', health: 'Gesundheit' }[detail.purpose]}`),
      statement(`Betrag: ${cost(detail.cost)}`),
      statement(`Zahlungszeitpunkt: ${{ application: 'bei Antragstellung', before_entry: 'vor Einreise', on_arrival: 'bei Ankunft',
        on_departure: 'bei Ausreise', unavailable }[detail.paymentTiming]}`),
    ]
    case 'fraud_warning': return [
      statement(({ unofficial_intermediaries: 'Amtliche Warnung vor nicht amtlichen Vermittlern',
        imitation_website: 'Amtliche Warnung vor nachgeahmten Behördenwebseiten', excessive_fees: 'Amtliche Warnung vor überhöhten Gebühren',
        personal_data_theft: 'Amtliche Warnung vor Diebstahl persönlicher Daten' })[detail.warning]),
      action(detail.officialAction, 'Amtlicher Link zum Erledigen'),
    ]
    case 'ticket_details': return [statement(`${({ return: 'Rückreiseticket', onward: 'Weiterreiseticket',
      return_or_onward: 'Rückreise- oder Weiterreiseticket' })[detail.ticket]} ${detail.effect === 'required' ? 'erforderlich' : 'nicht erforderlich'}`)]
    case 'financial_means_details': return [
      statement(`Geldnachweis ${detail.effect === 'required' ? 'erforderlich' : 'nicht erforderlich'}`),
      statement(`Mindestbetrag: ${detail.minimum === null ? unavailable : money(detail.minimum)}`),
      statement(`Anerkannte Nachweise: ${detail.acceptedProofs.length === 0 ? unavailable : detail.acceptedProofs.map(proof => ({
        cash: 'Bargeld', bank_statement: 'Kontoauszug', payment_card: 'Zahlungskarte', sponsorship: 'Kostenübernahme',
        prepaid_accommodation: 'bezahlte Unterkunft', employment_income: 'Erwerbseinkommen',
      })[proof]).join(', ')}`),
    ]
    case 'minor_travel_details': return [
      statement(`Gilt für Reisende unter ${detail.appliesBelowAge} Jahren`),
      ...detail.documents.map(document => statement(`Dokument: ${{ own_travel_document: 'eigenes Reisedokument', birth_certificate: 'Geburtsurkunde',
        parental_consent: 'Einverständniserklärung', custody_order: 'Sorgerechtsnachweis', death_certificate: 'Sterbeurkunde',
        guardian_identity: 'Identitätsnachweis der sorgeberechtigten Person' }[document]}`)),
    ]
    case 'parental_consent_details': return [
      statement(`Einverständniserklärung ${detail.effect === 'required' ? 'erforderlich' : 'nicht erforderlich'}`),
      statement(`Unterschriften: ${detail.signatories === null ? unavailable : ({ all_legal_guardians: 'alle sorgeberechtigten Personen',
        non_travelling_legal_guardian: 'nicht mitreisende sorgeberechtigte Person', one_legal_guardian: 'eine sorgeberechtigte Person' })[detail.signatories]}`),
      statement(boolean(detail.notarisationRequired, 'Notarielle Beglaubigung erforderlich', 'Notarielle Beglaubigung nicht erforderlich', 'Notarielle Beglaubigung')),
      statement(boolean(detail.translationRequired, 'Übersetzung erforderlich', 'Übersetzung nicht erforderlich', 'Übersetzung')),
      action(detail.officialForm, 'Amtliches Formular zur Einverständniserklärung'),
    ]
    case 'customs_details': return [
      statement(`Zollkategorie: ${{ cash: 'Bargeld', alcohol: 'Alkohol', tobacco: 'Tabak', medicines: 'Medikamente', food: 'Lebensmittel',
        plants: 'Pflanzen', animals: 'Tiere', personal_goods: 'persönliche Waren' }[detail.category]}`),
      statement(({ prohibited: 'Verboten', declaration_required: 'Anmeldung erforderlich', permit_required: 'Bewilligung erforderlich',
        allowance: 'Amtliche Freimenge oder Freigrenze' })[detail.disposition]),
      statement(`Mengenangabe: ${detail.allowance === null ? unavailable : `${detail.allowance.value} ${{ items: 'Stück', grams: 'g', kilograms: 'kg',
        millilitres: 'ml', litres: 'l' }[detail.allowance.unit]}`}`),
      statement(`Geldbetrag: ${detail.monetaryThreshold === null ? unavailable : money(detail.monetaryThreshold)}`),
      action(detail.officialAction, 'Amtlicher Link für Zollangelegenheiten'),
    ]
    case 'document_alternative_details': return [
      statement(`Anerkanntes Reisedokument: ${detail.acceptedDocument === 'passport' ? 'Reisepass' : 'Identitätskarte'}`),
      statement(detail.replacesPassport ? 'Das genannte Dokument kann den Reisepass ersetzen' : 'Das genannte Dokument ersetzt den Reisepass nicht'),
      statement(`Dokumentklasse: ${detail.documentClass === null ? unavailable : ({ ordinary: 'gewöhnliches Dokument', temporary: 'vorläufiges Dokument',
        emergency: 'Notdokument' })[detail.documentClass]}`),
    ]
    case 'dual_national_details': return [
      statement(detail.destinationNationalityHeld ? 'Gilt bei zusätzlicher Staatsangehörigkeit des Ziellandes' : 'Gilt ohne Staatsangehörigkeit des Ziellandes'),
      statement(`Einreisedokument: ${{ destination_passport: 'Reisepass des Ziellandes', destination_national_id: 'Identitätskarte des Ziellandes',
        either_citizenship_document: 'Reisedokument einer der Staatsangehörigkeiten' }[detail.entryDocument]}`),
      statement(`Ausreisedokument: ${detail.departureDocument === null ? unavailable : ({ same_document: 'dasselbe Dokument wie bei der Einreise',
        destination_passport: 'Reisepass des Ziellandes', destination_national_id: 'Identitätskarte des Ziellandes' })[detail.departureDocument]}`),
    ]
    case 'change_notice': return [
      statement(`Geändertes Thema: ${detail.changedTopic}`),
      statement(({ introduced: 'Anforderung eingeführt', removed: 'Anforderung aufgehoben', conditions_changed: 'Bedingungen geändert',
        fee_changed: 'Gebühr geändert', form_changed: 'Formular geändert', document_rule_changed: 'Dokumentregel geändert' })[detail.change]),
      statement(`Änderungsdatum: ${detail.changedOn ?? unavailable}`),
      statement(`Wirksam ab: ${detail.effectiveFrom ?? unavailable}`),
      action(detail.announcement, 'Amtliche Bekanntmachung'),
    ]
  }
}
