'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Consent = 'pending' | 'granted' | 'blocked'
type WeatherContext = { active: boolean; consent: Consent; grant(): void; revoke(): void }
const Context = createContext<WeatherContext | null>(null)

/** Session-local affirmative choice. No cookie, storage or provider IO. */
export function WetterZustimmung({ aktiv, children }: { aktiv: boolean; children: ReactNode }) {
  const [consent, setConsent] = useState<Consent>('pending')
  useEffect(() => {
    // Until the CMP has an explicit reviewed provider mapping, its presence
    // fails closed, just like the existing Google map consent boundary.
    const block = () => setConsent('blocked')
    if (window.PrivacyBee !== undefined) block()
    document.addEventListener('privacybee:ready', block)
    document.addEventListener('privacybee:consent-changed', block)
    return () => {
      document.removeEventListener('privacybee:ready', block)
      document.removeEventListener('privacybee:consent-changed', block)
    }
  }, [])
  return <Context.Provider value={{ active: aktiv, consent,
    grant() { if (aktiv && consent !== 'blocked' && window.PrivacyBee === undefined) setConsent('granted') },
    revoke() { setConsent(value => value === 'blocked' ? value : 'pending') },
  }}>{children}</Context.Provider>
}

/** Children with timers, location resolution and fetch are NOT mounted before consent. */
export function WetterSchutz({ children }: { children: ReactNode }) {
  const context = useContext(Context)
  if (!context?.active) return null
  if (context.consent !== 'granted') return <section aria-label="Zustimmung zu Wetterdaten" className="my-3 rounded-2xl border border-line-200 bg-white p-4 text-sm text-ink-900">
    <h3 className="font-semibold">Wetter für deine Reise</h3>
    <p className="mt-2">Nach deiner Zustimmung fragt Jetnity OpenWeather nach dem Wetter an den Orten deiner Reise.
      Übermittelt werden auf zwei Dezimalstellen gerundete Ortskoordinaten. Dein Browser verbindet sich nicht direkt mit OpenWeather.
      Die Zustimmung gilt bis zum Widerruf oder Neuladen. Eine Anmeldung ist für den begrenzten Wetterabruf erforderlich.</p>
    {context.consent === 'blocked' ? <p role="status">Die Wetterabfrage ist über die Datenschutzeinstellungen deaktiviert.</p>
      : <button type="button" className="mt-2 min-h-11 underline" onClick={context.grant}>Zustimmen und Wetter laden</button>}
    <a href="https://openweather.co.uk/privacy-policy" target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex min-h-11 items-center underline">Datenschutz bei OpenWeather</a>
  </section>
  return <>
    <button type="button" className="min-h-11 text-sm underline" onClick={context.revoke}>Wetterzustimmung widerrufen</button>
    {children}
  </>
}
