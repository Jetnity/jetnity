'use client'

import { createElement, useEffect, useRef, useState } from 'react'
import type { Ref } from 'react'

import {
  PRIVACYBEE_AUS_HINWEIS,
  PRIVACYBEE_BEREITSCHAFT_MS,
  PRIVACYBEE_DATENSCHUTZ_SKRIPT,
  PRIVACYBEE_DATENSCHUTZ_URL,
  PRIVACYBEE_EIGENE_UEBERSCHRIFT,
  PRIVACYBEE_ELEMENT,
  PRIVACYBEE_FEHLER_HINWEIS,
  PRIVACYBEE_KONTAKT,
  PRIVACYBEE_LADE_HINWEIS,
  PRIVACYBEE_WEBSITE_ID,
  browserHostIstLizenziert,
  privacyBeeDomSignal,
  privacyBeeSkriptFuer,
  skriptEinfuegen,
  type PrivacyBeeDomSchnappschuss,
  type PrivacyBeeFlaeche,
} from '@/lib/legal/privacybee-vertrag'

export type PrivacyBeePhase = 'aus' | 'laden' | 'bereit' | 'fehler'

const ladungen = new Map<string, Promise<void>>()

const linkKlasse =
  'inline-flex min-h-11 items-center font-semibold text-brand-800 underline decoration-brand-800/30 underline-offset-4 hover:decoration-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15'

function schnappschussLesen(el: HTMLElement): PrivacyBeeDomSchnappschuss {
  return {
    text: el.textContent ?? '',
    ueberschriften: [...el.querySelectorAll('h1')].map((knoten) => knoten.textContent ?? ''),
    hatDatenschutzFehlerAbsatz: Boolean(el.querySelector('p.text-slate-900')),
    hatImpressumFehlerAbsatz: Boolean(el.querySelector('p.prx_text')),
  }
}

function ladePrivacyBeeSkript(src: string, tag: string): Promise<void> {
  const laufend = ladungen.get(src)
  if (laufend) return laufend
  if (typeof customElements !== 'undefined' && customElements.get(tag)) return Promise.resolve()

  const versprechen = new Promise<void>((resolve, reject) => {
    const lage = {
      elementDefiniert: typeof customElements !== 'undefined' && Boolean(customElements.get(tag)),
      skriptVorhanden: Boolean(document.querySelector(`script[src="${src}"]`)),
    }
    if (!skriptEinfuegen(lage)) {
      if (typeof customElements !== 'undefined' && customElements.get(tag)) resolve()
      else reject(new Error('privacybee-skript-unvollstaendig'))
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = false
    // Official privacy snippet sets defer. Dynamically inserted classic scripts
    // ignore defer; async=false keeps a single ordered execution. The define
    // guard above is what prevents a second registration on remount.
    if (src === PRIVACYBEE_DATENSCHUTZ_SKRIPT) script.defer = true
    script.dataset.jetnityPrivacybee = tag
    script.onload = () => {
      if (customElements.get(tag)) resolve()
      else reject(new Error('privacybee-element-fehlt'))
    }
    script.onerror = () => reject(new Error('privacybee-skript'))
    document.head.appendChild(script)
  })

  ladungen.set(src, versprechen)
  versprechen.catch(() => {
    ladungen.delete(src)
  })
  return versprechen
}

function Fallback({ flaeche }: { flaeche: PrivacyBeeFlaeche }) {
  if (flaeche === 'datenschutz') {
    return (
      <div data-privacybee-fallback="datenschutz" className="mt-4 max-w-xl space-y-3 text-sm leading-6 text-brand-800/80">
        <p>{PRIVACYBEE_AUS_HINWEIS.datenschutz}</p>
        <a href={PRIVACYBEE_DATENSCHUTZ_URL} className={linkKlasse}>
          Datenschutzerklärung bei PrivacyBee
        </a>
      </div>
    )
  }

  return (
    <div data-privacybee-fallback="impressum" className="mt-4 max-w-xl space-y-3 text-sm leading-6 text-brand-800/80">
      <p>{PRIVACYBEE_AUS_HINWEIS.impressum}</p>
      <p>
        Schreiben Sie an{' '}
        <a href={`mailto:${PRIVACYBEE_KONTAKT}`} className={linkKlasse}>
          {PRIVACYBEE_KONTAKT}
        </a>
        .
      </p>
    </div>
  )
}

function VendorElement({
  flaeche,
  slotRef,
}: {
  flaeche: PrivacyBeeFlaeche
  slotRef: Ref<HTMLElement>
}) {
  const props: {
    ref: Ref<HTMLElement>
    'website-id': string
    lang: string
    type?: string
  } = {
    ref: slotRef,
    'website-id': PRIVACYBEE_WEBSITE_ID,
    lang: 'de',
  }
  if (flaeche === 'datenschutz') props.type = 'dsgvo'
  return (
    <div className="mt-8 min-w-0 overflow-x-auto" data-privacybee-slot={flaeche}>
      {createElement(PRIVACYBEE_ELEMENT[flaeche], props)}
    </div>
  )
}

export function PrivacyBeeAnsicht({
  flaeche,
  einbetten,
  phase,
  vendorHatUeberschrift,
  slotRef,
}: {
  flaeche: PrivacyBeeFlaeche
  einbetten: boolean
  phase: PrivacyBeePhase
  vendorHatUeberschrift: boolean
  slotRef?: Ref<HTMLElement>
}) {
  const ueberschrift = PRIVACYBEE_EIGENE_UEBERSCHRIFT[flaeche]
  const zeigeEigeneUeberschrift = !vendorHatUeberschrift
  const zeigeVendor = Boolean(einbetten && phase !== 'aus' && slotRef)
  const zeigeLaden = einbetten && phase === 'laden'
  const zeigeFehler = einbetten && phase === 'fehler'
  const zeigeSichtbarenFallback = !einbetten || phase === 'aus' || zeigeFehler

  return (
    <div data-privacybee-phase={zeigeVendor ? phase : einbetten ? 'warten' : 'aus'}>
      {zeigeEigeneUeberschrift ? (
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-brand-900 sm:text-4xl">{ueberschrift}</h1>
      ) : null}
      {zeigeLaden ? (
        <p className="mt-4 text-sm leading-6 text-brand-800/70" role="status">
          {PRIVACYBEE_LADE_HINWEIS[flaeche]}
        </p>
      ) : null}
      {zeigeFehler ? (
        <p className="mt-4 text-sm leading-6 text-brand-800" role="alert">
          {PRIVACYBEE_FEHLER_HINWEIS[flaeche]}
        </p>
      ) : null}
      {zeigeSichtbarenFallback ? <Fallback flaeche={flaeche} /> : null}
      {einbetten ? (
        <noscript>
          <Fallback flaeche={flaeche} />
        </noscript>
      ) : null}
      {zeigeVendor && slotRef ? <VendorElement flaeche={flaeche} slotRef={slotRef} /> : null}
    </div>
  )
}

export default function PrivacyBeeEinbettung({
  flaeche,
  einbetten,
}: {
  flaeche: PrivacyBeeFlaeche
  einbetten: boolean
}) {
  const slotRef = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState<PrivacyBeePhase>(einbetten ? 'laden' : 'aus')
  const [vendorHatUeberschrift, setVendorHatUeberschrift] = useState(false)

  useEffect(() => {
    if (!einbetten) return
    if (!browserHostIstLizenziert(window.location.hostname)) {
      const sperre = window.setTimeout(() => setPhase('aus'), 0)
      return () => window.clearTimeout(sperre)
    }

    const el = slotRef.current
    if (!el) return

    let offen = true
    const timer = window.setTimeout(() => {
      if (!offen) return
      setPhase((aktuell) => (aktuell === 'laden' ? 'fehler' : aktuell))
    }, PRIVACYBEE_BEREITSCHAFT_MS)

    const pruefen = () => {
      const signal = privacyBeeDomSignal(flaeche, schnappschussLesen(el))
      const titel = schnappschussLesen(el).ueberschriften.some((eintrag) => eintrag.trim().length > 0)
      setVendorHatUeberschrift(titel)
      if (signal === 'bereit' || signal === 'fehler') {
        offen = false
        window.clearTimeout(timer)
        setPhase(signal)
      }
    }

    const beobachter = new MutationObserver(pruefen)
    beobachter.observe(el, { childList: true, subtree: true, characterData: true })

    ladePrivacyBeeSkript(privacyBeeSkriptFuer(flaeche), PRIVACYBEE_ELEMENT[flaeche])
      .then(() => {
        if (offen) pruefen()
      })
      .catch(() => {
        if (!offen) return
        offen = false
        window.clearTimeout(timer)
        setPhase('fehler')
      })

    return () => {
      offen = false
      window.clearTimeout(timer)
      beobachter.disconnect()
      if (flaeche === 'datenschutz') {
        document.documentElement.style.removeProperty('--custom-title-color')
        document.documentElement.style.removeProperty('--custom-body-color')
      }
    }
  }, [einbetten, flaeche])

  return (
    <PrivacyBeeAnsicht
      flaeche={flaeche}
      einbetten={einbetten}
      phase={phase}
      vendorHatUeberschrift={vendorHatUeberschrift}
      slotRef={slotRef}
    />
  )
}
