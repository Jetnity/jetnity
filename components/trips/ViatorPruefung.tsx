'use client'

import { useEffect, useRef, useState } from 'react'

import type { ViatorAgeBand, ViatorAgeBandRule } from '@/lib/providers/viator/activities/contracts'
import { viatorStartzeiten } from '@/lib/providers/viator/activities/kalender'
import { validateViatorProductUrl, viatorBildAnzeigen } from '@/lib/providers/viator/activities/url'

const ALTER: Record<ViatorAgeBand, string> = {
  ADULT: 'Erwachsene',
  CHILD: 'Kinder',
  INFANT: 'Kleinkinder',
  YOUTH: 'Jugendliche',
  SENIOR: 'Senioren',
  TRAVELER: 'Reisende',
}

type Option = { code: string; title: string | null }

type Detail = {
  productCode: string
  title: string
  description: string | null
  imageUrl: string | null
  price: { amount: number; currency: string; priceRole: string; checkoutCurrencyConfirmed: false } | null
  productOptionCodes: string[]
  productOptions: Option[]
  ageBands: ViatorAgeBandRule[]
  productUrl: string | null
}

type Plan = {
  supplierCurrency: string | null
  options: Array<{
    productOptionCode: string
    seasons: Array<{
      startDate: string
      endDate: string | null
      startTimes: string[]
      unavailableDates: string[]
      timedEntries: Array<{ startTime: string; unavailableDates: string[] }>
    }>
  }>
}

type Quote = {
  available: boolean
  price: { amount: number; currency: string; checkoutCurrencyConfirmed: false } | null
}

type Antwort<T> = { status: string; message: string; value: T | null }

async function lesen<T>(pfad: string, body: unknown, signal: AbortSignal): Promise<Antwort<T>> {
  try {
    const response = await fetch(pfad, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
    const json = (await response.json()) as Antwort<T>
    if (!json || typeof json.message !== 'string' || typeof json.status !== 'string') {
      return { status: 'error', message: 'Die Antwort konnte nicht gelesen werden.', value: null }
    }
    if (response.status === 429 || json.status === 'rate_limited') {
      return { status: 'rate_limited', message: json.message, value: null }
    }
    return json
  } catch (fehler) {
    if (fehler instanceof DOMException && fehler.name === 'AbortError') throw fehler
    return { status: 'error', message: 'Die Verbindung zu Viator ist abgebrochen.', value: null }
  }
}

export default function ViatorPruefung({
  productCode,
  dayDate,
  gewuenschteWaehrung,
}: {
  productCode: string
  dayDate: string | null
  gewuenschteWaehrung: string
}) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [meldung, setMeldung] = useState('Details werden geladen.')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteMeldung, setQuoteMeldung] = useState<string | null>(null)
  const [prueft, setPrueft] = useState(false)
  const [datum, setDatum] = useState(dayDate ?? '')
  const [option, setOption] = useState('')
  const [startzeit, setStartzeit] = useState('')
  const [mix, setMix] = useState<Partial<Record<ViatorAgeBand, number>>>({})
  const lauf = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const verwerfen = () => {
    lauf.current += 1
    abortRef.current?.abort()
    abortRef.current = null
    setQuote(null)
    setQuoteMeldung(null)
    setPrueft(false)
  }

  useEffect(() => {
    const steuerung = new AbortController()
    const eigene = ++lauf.current
    void (async () => {
      try {
        const [produkt, kalender] = await Promise.all([
          lesen<Detail>('/api/activities/viator/detail', { productCode }, steuerung.signal),
          lesen<Plan>('/api/activities/viator/schedule', { productCode }, steuerung.signal),
        ])
        if (steuerung.signal.aborted || lauf.current !== eigene) return
        setDetail(produkt.value)
        setPlan(kalender.value)
        setOption(produkt.value?.productOptions[0]?.code ?? produkt.value?.productOptionCodes[0] ?? '')
        setMeldung(produkt.status === 'rate_limited' || produkt.status === 'timeout' ? produkt.message : produkt.message)
      } catch {
        if (!steuerung.signal.aborted && lauf.current === eigene) setMeldung('Die Verbindung zu Viator ist abgebrochen.')
      }
    })()
    return () => {
      steuerung.abort()
      lauf.current += 1
    }
  }, [productCode])

  const bild = viatorBildAnzeigen(detail?.imageUrl)
  const link = detail?.productUrl && validateViatorProductUrl(detail.productUrl).ok ? detail.productUrl : null
  const saison = plan?.options.find((eintrag) => eintrag.productOptionCode === option)
  const zeiten = viatorStartzeiten(saison, datum) ?? []
  const optionen = detail?.productOptions?.length
    ? detail.productOptions
    : (detail?.productOptionCodes ?? []).map((code) => ({ code, title: null }))

  const pruefen = () => {
    const generation = ++lauf.current
    abortRef.current?.abort()
    const steuerung = new AbortController()
    abortRef.current = steuerung
    setQuote(null)
    setQuoteMeldung(null)
    setPrueft(true)
    const paxMix = (detail?.ageBands ?? [])
      .map((band) => ({ ageBand: band.ageBand, numberOfTravelers: mix[band.ageBand] ?? 0 }))
      .filter((eintrag) => eintrag.numberOfTravelers > 0)
    void lesen<Quote>(
      '/api/activities/viator/check',
      {
        productCode,
        productOptionCode: option,
        travelDate: datum,
        startTime: startzeit || null,
        currency: gewuenschteWaehrung === 'CHF' ? 'CHF' : null,
        paxMix,
      },
      steuerung.signal,
    )
      .then((antwort) => {
        if (lauf.current !== generation) return
        setQuote(antwort.value)
        setQuoteMeldung(antwort.message)
      })
      .catch(() => {
        if (lauf.current !== generation) return
        setQuote(null)
        setQuoteMeldung('Die Prüfung wurde abgebrochen.')
      })
      .finally(() => {
        if (lauf.current === generation) setPrueft(false)
      })
  }

  return (
    <section aria-label="Viator-Prüfung" aria-busy={prueft} className="mt-4 min-w-0 rounded-2xl border border-line-200 bg-white p-4">
      <h3 className="text-base font-semibold text-brand-800">Ausgewähltes Angebot</h3>
      <p className="mt-1 text-sm leading-6 text-ink-800">{meldung}</p>
      {bild ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bild} alt="" className="mt-3 h-40 w-full rounded-xl object-cover" />
      ) : null}
      {detail?.description ? <p className="mt-3 break-words text-sm leading-6 text-ink-800">{detail.description}</p> : null}
      {plan ? <p className="mt-3 text-sm text-ink-800">Kalenderhinweis, keine aktuelle Verfügbarkeit.</p> : null}
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm text-ink-800">
          Datum
          <input
            type="date"
            value={datum}
            onChange={(event) => {
              setDatum(event.target.value)
              setStartzeit('')
              verwerfen()
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
              setStartzeit('')
              verwerfen()
            }}
            className="min-h-11 rounded-xl border border-line-200 px-3"
          >
            {optionen.map((eintrag) => (
              <option key={eintrag.code} value={eintrag.code}>
                {eintrag.title ? `${eintrag.title}` : eintrag.code}
              </option>
            ))}
          </select>
        </label>
        {zeiten.length > 0 ? (
          <label className="grid gap-1 text-sm text-ink-800">
            Startzeit
            <select
              value={zeiten.includes(startzeit) ? startzeit : ''}
              onChange={(event) => {
                setStartzeit(event.target.value)
                verwerfen()
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
            {ALTER[band.ageBand]} ({band.startAge}–{band.endAge})
            <input
              inputMode="numeric"
              aria-label={`${ALTER[band.ageBand]} Anzahl`}
              value={mix[band.ageBand] ?? ''}
              onChange={(event) => {
                const zahl = Number(event.target.value)
                setMix((stand) => ({ ...stand, [band.ageBand]: Number.isInteger(zahl) ? zahl : 0 }))
                verwerfen()
              }}
              className="min-h-11 rounded-xl border border-line-200 px-3"
            />
          </label>
        ))}
        <button
          type="button"
          onClick={pruefen}
          disabled={prueft}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-60"
        >
          Verfügbarkeit prüfen
        </button>
      </div>
      <p role="status" className="mt-3 text-sm leading-6 text-ink-800">
        {prueft ? 'Prüfung läuft.' : quoteMeldung}
      </p>
      {quote?.price ? (
        <p className="mt-2 text-sm text-ink-800">
          {quote.price.currency} {quote.price.amount}. Keine Checkout-Zusage.
          {gewuenschteWaehrung === 'CHF' && quote.price.currency !== 'CHF' ? ' Nicht als CHF übernommen.' : ''}
        </p>
      ) : null}
      {link ? (
        <a href={link} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline">
          Bei Viator ansehen
        </a>
      ) : (
        <p className="mt-4 text-sm text-ink-700">Kein geprüfter Link.</p>
      )}
    </section>
  )
}
