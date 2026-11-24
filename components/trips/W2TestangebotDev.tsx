'use client'

// Dev-only, account-independent QA; all test facts are written exclusively to a
// distinct localStorage key in the current browser. No bookings or provider calls.
import { useSyncExternalStore } from 'react'
import ReiseAenderungBuchungshinweise from '@/components/trips/ReiseAenderungBuchungshinweise'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { reiseLesen } from '@/lib/trips/schema'
import type { Trip } from '@/types/trips'

const KEY = 'jetnity:qa:w2-angebot:20261124'
const EVENT = 'jetnity:w2-angebot-fixture'
const get = () => { try { return localStorage.getItem(KEY) } catch { return null } }
const subscribe = (listener: () => void) => {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener('storage', listener) }
}
function testpaar(): { vorher: Trip; nachher: Trip } {
  const vorher = beispielreise()
  const angebot = vorher.days[0].items[0]
  angebot.title = 'W2-TEST: unverbindliche Stadtführung'
  angebot.kind = 'activity'
  angebot.priceAmount = 79
  angebot.priceCurrency = 'CHF'
  angebot.provider = 'viator'
  angebot.externalRef = 'SYNTHETIC-LOCAL-ONLY'
  angebot.bookingUrl = null
  angebot.bookingStatus = 'unconfirmed'
  angebot.bookingSource = null
  angebot.bookingConfirmedAt = null
  const unterkunft = vorher.days[1].items[0]
  unterkunft.title = 'W2-TEST: nur von dir als gebucht markierte Unterkunft'
  unterkunft.kind = 'stay'
  unterkunft.priceAmount = 140
  unterkunft.priceCurrency = 'CHF'
  unterkunft.bookingStatus = 'booked'
  unterkunft.bookingSource = 'user'
  unterkunft.bookingConfirmedAt = '2026-09-01T10:00:00Z'
  unterkunft.provider = null
  unterkunft.bookingUrl = null
  unterkunft.startsOn = '2026-09-13'
  unterkunft.endsOn = '2026-09-15'
  const nachher = structuredClone(vorher)
  nachher.startDate = '2026-09-13'
  nachher.endDate = '2026-09-17'
  return { vorher, nachher }
}
function read(value: string | null): { vorher: Trip; nachher: Trip } | null {
  if (!value) return null
  try {
    const json = JSON.parse(value)
    if (json?.marker !== 'W2-TEST-only') return null
    const vorher = reiseLesen(json.vorher), nachher = reiseLesen(json.nachher)
    if (!vorher || !nachher || vorher.id !== nachher.id) return null
    return { vorher, nachher }
  } catch { return null }
}
export default function W2TestangebotDev() {
  const raw = useSyncExternalStore(subscribe, get, () => null)
  const pair = read(raw)
  const save = () => {
    try {
      const sample = testpaar()
      localStorage.setItem(KEY, JSON.stringify({ marker: 'W2-TEST-only', ...sample }))
      window.dispatchEvent(new Event(EVENT))
    } catch { /* Show explicit absence rather than pretend test state was saved. */ }
  }
  const clear = () => {
    try { localStorage.removeItem(KEY); window.dispatchEvent(new Event(EVENT)) } catch { /* leave unchanged */ }
  }
  return <main className="mx-auto grid max-w-4xl gap-5 px-4 py-6 sm:px-6" data-w2-qa-offer="">
    <h1 className="text-title text-foreground">Synthetisches Angebot für die Dev-Prüfung</h1>
    <p className="max-w-prose text-body text-muted-foreground">Diese zwei Testeinträge existieren nur in diesem Browser. Sie sind keine Angebote, Buchungen oder Kontoreisen und senden keine Daten an Anbieter.</p>
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={save} className="min-h-11 rounded-full bg-primary px-4 py-2 text-primary-foreground">Testeinträge nur im Browser speichern</button>
      <button type="button" onClick={clear} className="min-h-11 rounded-full border border-border bg-card px-4 py-2 text-foreground">Testeinträge löschen</button>
    </div>
    <p role="status" className="text-meta text-foreground">{pair ? 'Gespeicherte synthetische Testeinträge aus dem Browser gelesen – Neuladen möglich.' : 'Noch keine Testeinträge gespeichert.'}</p>
    {pair ? <ReiseAenderungBuchungshinweise vorher={pair.vorher} nachher={pair.nachher} /> : null}
  </main>
}
