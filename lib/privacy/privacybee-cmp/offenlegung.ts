// Factual 12Go notice data. This is not a grant, a consent model, or legal text.

import { WIDGET_CONSENT_PROVIDERS } from '@/lib/privacy/widget-consent/vertrag'

import { PRODUCTION_POLICY_TABLE } from '@/lib/privacy/privacybee-cmp/produktionspolitik'

const provider = WIDGET_CONSENT_PROVIDERS.twelvego

export const TWELVEGO_PRODUCTION_DISCLOSURE = Object.freeze({
  providerId: 'twelvego' as const,
  disclosureRevision: PRODUCTION_POLICY_TABLE.twelvego.disclosureRevision,
  label: provider.label,
  privacyHref: provider.privacyHref,
  privacyLinkLabel: provider.privacyLinkLabel,
  recipients: Object.freeze([
    '12go.asia',
    'cdn0.trainbusferry.com',
    'agent.12go.asia',
    'ajax.googleapis.com',
  ] as const),
  paragraphs: Object.freeze([
    'Das allgemeine Formular verbindet sich mit 12Go und dessen Ressourcen. Google stellt die jQuery-Abhängigkeit bereit. Empfänger sind 12go.asia, cdn0.trainbusferry.com, agent.12go.asia und ajax.googleapis.com.',
    'Das Laden umfasst die Messung von Widget-Aufrufen und Partnerstatistik. Netzwerkanfragen können IP-Adresse und Browser-Angaben übertragen. Orte und Daten, die anschliessend in das Formular eingegeben werden, verarbeitet der Anbieter. Jetnity füllt keine privaten Reise- oder Kontodaten und nicht die Bangkok-Referenz vor.',
    'Das unveränderte Formular und diese Messung lassen sich nicht getrennt schalten. Dafür braucht es eine aktuelle Zustimmung zur Statistik und eine neue bewusste Formularanfrage. Eine Ablehnung behält die bestehenden Links und die manuelle Planung.',
    'Entfernen des eingebetteten Rahmens beendet diesen Zusammenhang. Bereits übertragene Angaben, nicht erreichbarer Speicher des Anbieters und gesondert geöffnete Anbieterseiten werden dadurch nicht zurückgeholt, gelöscht oder geschlossen. Ein gemeinsamer Ursprung mehrerer Anbieterpfade ist damit kein getrennter Speicher.',
  ] as const),
  withdrawalLimitation:
    'Entfernen des Rahmens beendet nur diesen eingebetteten Zusammenhang. Bereits übertragene Angaben, Speicher beim Anbieter und gesondert geöffnete Anbieterseiten bleiben davon unberührt.',
  v1Alternative: 'Ohne diese Einwilligung bleiben die bestehenden Links und die manuelle Planung nutzbar.',
})
