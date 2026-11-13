import { offerInput, type SavedOffer } from './contract'

export type PlanChoice = { id: string; title: string }
export type PlanDays = { days: { id: string; dayDate: string | null; dayIndex: number; stageId: string | null }[]; stages: { id: string; name: string }[] }

export function savedOfferPlanValues(offer: SavedOffer, timing: unknown, dayDate: string | null) {
  const values = offerInput.parse({ ...Object.fromEntries(['category', 'title', 'url', 'destination', 'starts_on', 'ends_on', 'starts_at', 'ends_at', 'start_timezone', 'end_timezone'].map(k => [k, offer[k as keyof SavedOffer]])), ...(typeof timing === 'object' && timing ? timing : {}) })
  if (!values.starts_on) values.starts_on = dayDate
  if (dayDate && values.starts_on !== dayDate) throw new Error('Wähle den Reisetag des Anfangsdatums. Bei Flügen zählt der Abflugtag.')
  if (values.ends_on && !values.starts_on) throw new Error('Bitte ergänze das Anfangsdatum.')
  if (values.ends_at && !values.starts_at) throw new Error('Bitte ergänze die Anfangszeit oder lasse beide Zeiten offen.')
  if (values.starts_on && values.ends_on && (values.ends_on < values.starts_on || (values.ends_on === values.starts_on && values.starts_at && values.ends_at && values.ends_at < values.starts_at))) {
    throw new Error('Diese Ortszeiten brauchen eine vollständige Flugroute mit Zeitzonen. Bitte nutze dafür den Flugeditor im Reiseplan.')
  }
  if (values.category === 'stay' && (!values.starts_on || !values.ends_on)) throw new Error('Bitte ergänze Check-in und Check-out, damit alle Übernachtungen richtig eingeplant werden.')
  const zones = [values.start_timezone, values.end_timezone].filter(Boolean).join(' → ')
  const note = `Aus Merkliste; nicht gebucht. ${values.destination ?? ''}${zones ? ` · Ortszeiten: ${zones}` : ''}\n${values.url}`
  return {
    kind: values.category, title: values.title.slice(0, 120),
    note: note.length <= 500 ? note : `Aus Merkliste; nicht gebucht. Angebotslink in Meine Merkliste. ${values.destination ?? ''}${zones ? ` · Ortszeiten: ${zones}` : ''}`.slice(0, 500),
    starts_on: values.starts_on, ends_on: values.ends_on, starts_at: values.starts_at, ends_at: values.ends_at,
    provider: null, external_ref: null, booking_url: null, booking_status: 'unconfirmed' as const,
    booking_source: null, booking_confirmed_at: null,
  }
}
