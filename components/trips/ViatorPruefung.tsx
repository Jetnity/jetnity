'use client'

import { useEffect, useState } from 'react'

import type { ViatorAgeBand, ViatorAgeBandRule } from '@/lib/providers/viator/activities/contracts'
import { validateViatorImageUrl, validateViatorProductUrl } from '@/lib/providers/viator/activities/url'

type Detail = {
  productCode: string
  title: string
  description: string | null
  imageUrl: string | null
  price: { amount: number; currency: string; priceRole: string; checkoutCurrencyConfirmed: false } | null
  productOptionCodes: string[]
  ageBands: ViatorAgeBandRule[]
  productUrl: string | null
}

type Plan = {
  supplierCurrency: string | null
  options: Array<{ productOptionCode: string; startTimes: string[] }>
}

type Quote = {
  available: boolean
  price: { amount: number; currency: string; checkoutCurrencyConfirmed: false } | null
}

type Antwort<T> = { status: string; message: string; availabilityClaim?: boolean; value: T | null }

async function lesen<T>(pfad: string, body: unknown, signal: AbortSignal): Promise<Antwort<T> | null> {
  const response = await fetch(pfad, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const json = (await response.json()) as Antwort<T>
  if (!json || typeof json.message !== 'string' || typeof json.status !== 'string') return null
  return json
}

export default function ViatorPruefung({
  productCode,
  dayDate,
  gewuenschteWaehrung,
  vorgabe,
}: {
  productCode: string
  dayDate: string | null
  gewuenschteWaehrung: string
  /** Nur für den lokalen Browser-Harness. Die Route übergibt das nie. */
  vorgabe?: { detail: Detail; plan: Plan }
}) {
  const [detail, setDetail] = useState<Detail | null>(vorgabe?.detail ?? null)
  const [plan, setPlan] = useState<Plan | null>(vorgabe?.plan ?? null)
  const [meldung, setMeldung] = useState(
    vorgabe ? 'Details geladen. Das ist keine aktuelle Verfügbarkeit.' : 'Details werden geladen.',
  )
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteMeldung, setQuoteMeldung] = useState<string | null>(null)
  const [datum, setDatum] = useState(dayDate ?? '')
  const [option, setOption] = useState(vorgabe?.detail.productOptionCodes[0] ?? '')
  const [startzeit, setStartzeit] = useState('')
  const [mix, setMix] = useState<Partial<Record<ViatorAgeBand, number>>>({})

  useEffect(() => {
    if (vorgabe) return
    const steuerung = new AbortController()
    void (async () => {
      try {
        const [produkt, kalender] = await Promise.all([
          lesen<Detail>('/api/activities/viator/detail', { productCode }, steuerung.signal),
          lesen<Plan>('/api/activities/viator/schedule', { productCode }, steuerung.signal),
        ])
        if (steuerung.signal.aborted) return
        setDetail(produkt?.value ?? null)
        setPlan(kalender?.value ?? null)
        setOption(produkt?.value?.productOptionCodes[0] ?? '')
        setMeldung(produkt?.message ?? 'Die Details konnten nicht gelesen werden.')
      } catch {
        if (!steuerung.signal.aborted) setMeldung('Die Verbindung zu Viator ist abgebrochen.')
      }
    })()
    return () => steuerung.abort()
  }, [productCode, vorgabe])

  const bild = detail?.imageUrl && validateViatorImageUrl(detail.imageUrl).ok ? detail.imageUrl : null
  const link = detail?.productUrl && validateViatorProductUrl(detail.productUrl).ok ? detail.productUrl : null
  const zeiten = plan?.options.find((eintrag) => eintrag.productOptionCode === option)?.startTimes ?? []

  const pruefen = () => {
    setQuote(null)
    const paxMix = (detail?.ageBands ?? [])
      .map((band) => ({ ageBand: band.ageBand, numberOfTravelers: mix[band.ageBand] ?? 0 }))
      .filter((eintrag) => eintrag.numberOfTravelers > 0)
    void lesen<Quote>('/api/activities/viator/check', {
      productCode,
      productOptionCode: option,
      travelDate: datum,
      startTime: startzeit || null,
      currency: gewuenschteWaehrung === 'CHF' ? 'CHF' : null,
      paxMix,
    }, new AbortController().signal).then((antwort) => {
      setQuote(antwort?.value ?? null)
      setQuoteMeldung(antwort?.message ?? 'Die Prüfung konnte nicht gelesen werden.')
    })
  }

  return (
    <section aria-label="Viator-Prüfung" className="mt-4 min-w-0 rounded-2xl border border-line-200 bg-white p-4">
      <h3 className="text-base font-semibold text-brand-800">Ausgewähltes Viator-Angebot</h3>
      <p className="mt-1 text-sm leading-6 text-ink-800">{meldung}</p>
      {bild ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bild} alt="" className="mt-3 h-40 w-full rounded-xl object-cover" />
      ) : null}
      {detail?.description ? <p className="mt-3 break-words text-sm leading-6 text-ink-800">{detail.description}</p> : null}
      {plan ? (
        <p className="mt-3 text-sm text-ink-800">
          Kalenderhinweis in {plan.supplierCurrency ?? 'unbekannter Währung'}. Das ist keine aktuelle Verfügbarkeit.
        </p>
      ) : null}
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm text-ink-800">
          Datum
          <input
            value={datum}
            onChange={(event) => {
              setDatum(event.target.value)
              setQuote(null)
            }}
            className="min-h-11 rounded-xl border border-line-200 px-3"
          />
        </label>
        <label className="grid gap-1 text-sm text-ink-800">
          Option
          <select
            value={option}
            onChange={(event) => {
              setOption(event.target.value)
              setQuote(null)
            }}
            className="min-h-11 rounded-xl border border-line-200 px-3"
          >
            {(detail?.productOptionCodes ?? []).map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </label>
        {zeiten.length > 0 ? (
          <label className="grid gap-1 text-sm text-ink-800">
            Startzeit
            <select
              value={startzeit}
              onChange={(event) => {
                setStartzeit(event.target.value)
                setQuote(null)
              }}
              className="min-h-11 rounded-xl border border-line-200 px-3"
            >
              <option value="">Bitte wählen</option>
              {zeiten.map((zeit) => (
                <option key={zeit} value={zeit}>{zeit}</option>
              ))}
            </select>
          </label>
        ) : null}
        {(detail?.ageBands ?? []).map((band) => (
          <label key={band.ageBand} className="grid gap-1 text-sm text-ink-800">
            {band.ageBand} ({band.startAge}–{band.endAge})
            <input
              inputMode="numeric"
              value={mix[band.ageBand] ?? ''}
              onChange={(event) => {
                const zahl = Number(event.target.value)
                setMix((stand) => ({ ...stand, [band.ageBand]: Number.isInteger(zahl) ? zahl : 0 }))
                setQuote(null)
              }}
              className="min-h-11 rounded-xl border border-line-200 px-3"
            />
          </label>
        ))}
        <button
          type="button"
          onClick={pruefen}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          Verfügbarkeit prüfen
        </button>
      </div>
      {quoteMeldung ? <p className="mt-3 text-sm leading-6 text-ink-800">{quoteMeldung}</p> : null}
      {quote?.price ? (
        <p className="mt-2 text-sm text-ink-800">
          {quote.price.currency} {quote.price.amount}. Checkout-Währung ist nicht bestätigt.
          {gewuenschteWaehrung === 'CHF' && quote.price.currency !== 'CHF' ? ' Nicht als CHF übernommen.' : ''}
        </p>
      ) : null}
      {link ? (
        <a
          href={link}
          className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          Bei Viator ansehen
        </a>
      ) : (
        <p className="mt-4 text-sm text-ink-700">Kein geprüfter Viator-Link.</p>
      )}
    </section>
  )
}
