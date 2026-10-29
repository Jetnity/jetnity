'use client'

import { useEffect, useRef, useState } from 'react'

import {
  VIATOR_SEARCH_CURRENCIES,
  isViatorSearchCurrency,
  type ViatorAgeBand,
  type ViatorAgeBandRule,
  type ViatorSearchCurrency,
} from '@/lib/providers/viator/activities/contracts'
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

type Option = { code: string; title: string }

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
      timedEntries: Array<{ startTime: string; unavailableDates: string[]; daysOfWeek?: string[] }>
    }>
  }>
}

type Quote = {
  available: boolean
  price: { amount: number; currency: string; checkoutCurrencyConfirmed: false } | null
}

type Antwort<T> = { status: string; message: string; value: T | null }

function heuteIso(): string {
  const datum = new Date()
  const monat = String(datum.getMonth() + 1).padStart(2, '0')
  const tag = String(datum.getDate()).padStart(2, '0')
  return `${datum.getFullYear()}-${monat}-${tag}`
}

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

function ViatorPruefungLauf({
  productCode,
  dayDate,
  gewuenschteWaehrung,
  onRetry,
}: {
  productCode: string
  dayDate: string | null
  gewuenschteWaehrung: string
  onRetry: () => void
}) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [meldung, setMeldung] = useState('Details werden geladen.')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteMeldung, setQuoteMeldung] = useState<string | null>(null)
  const [prueft, setPrueft] = useState(false)
  const [laedt, setLaedt] = useState(true)
  const [datum, setDatum] = useState(dayDate ?? '')
  const [option, setOption] = useState('')
  const [startzeit, setStartzeit] = useState('')
  const [waehrungsWahl, setWaehrungsWahl] = useState('')
  const [mix, setMix] = useState<Partial<Record<ViatorAgeBand, number>>>({})
  const detailLauf = useRef(0)
  const quoteLauf = useRef(0)
  const detailAbort = useRef<AbortController | null>(null)
  const quoteAbort = useRef<AbortController | null>(null)
  const reiseWaehrung = isViatorSearchCurrency(gewuenschteWaehrung) ? gewuenschteWaehrung : null
  const waehrung: ViatorSearchCurrency | null = reiseWaehrung ?? (isViatorSearchCurrency(waehrungsWahl) ? waehrungsWahl : null)

  const verwerfen = () => {
    quoteLauf.current += 1
    quoteAbort.current?.abort()
    quoteAbort.current = null
    setQuote(null)
    setQuoteMeldung(null)
    setPrueft(false)
  }

  useEffect(() => {
    const steuerung = new AbortController()
    detailAbort.current?.abort()
    detailAbort.current = steuerung
    const eigene = ++detailLauf.current
    quoteLauf.current += 1
    quoteAbort.current?.abort()
    quoteAbort.current = null
    void (async () => {
      try {
        const [produkt, kalender] = await Promise.all([
          lesen<Detail>('/api/activities/viator/detail', { productCode }, steuerung.signal),
          lesen<Plan>('/api/activities/viator/schedule', { productCode }, steuerung.signal),
        ])
        if (steuerung.signal.aborted || detailLauf.current !== eigene) return
        setDetail(produkt.value)
        const kalenderOffen = kalender.status === 'ok' && kalender.value != null
        setPlan(kalenderOffen ? kalender.value : null)
        setMeldung(kalenderOffen ? produkt.message : kalender.message || produkt.message)
        setLaedt(false)
      } catch {
        if (!steuerung.signal.aborted && detailLauf.current === eigene) {
          setMeldung('Die Verbindung zu Viator ist abgebrochen.')
          setLaedt(false)
        }
      }
    })()
    return () => {
      steuerung.abort()
      detailLauf.current += 1
      quoteAbort.current?.abort()
      quoteLauf.current += 1
    }
  }, [productCode])

  const bild = viatorBildAnzeigen(detail?.imageUrl)
  const link = detail?.productUrl && validateViatorProductUrl(detail.productUrl).ok ? detail.productUrl : null
  const optionen = (detail?.productOptions ?? []).filter((eintrag) => eintrag.title.trim().length > 0)
  const ohneTitel = detail != null && optionen.length === 0 && detail.productOptionCodes.length > 0
  const standard = detail != null && optionen.length === 0 && detail.productOptionCodes.length === 0
  const kalenderMehrdeutig = standard && (plan?.options.length ?? 0) > 1
  const gewaehlteOption = optionen.length === 1 ? optionen[0]!.code : optionen.some((eintrag) => eintrag.code === option) ? option : ''
  const hinweis = standard
    ? plan?.options.length === 1
      ? plan.options[0]
      : undefined
    : plan?.options.find((eintrag) => eintrag.productOptionCode === gewaehlteOption)
  const zeiten =
    gewaehlteOption || (standard && !kalenderMehrdeutig) ? (viatorStartzeiten(hinweis, datum, heuteIso()) ?? []) : []
  const gewaehlteZeit = zeiten.length === 1 ? zeiten[0]! : zeiten.includes(startzeit) ? startzeit : ''
  const pruefungGesperrt = ohneTitel || kalenderMehrdeutig

  const pruefen = () => {
    if (!waehrung) {
      setQuote(null)
      setQuoteMeldung('Bitte wähle eine Anzeigewährung. Ohne Währung gibt es keinen aktuellen Preis.')
      return
    }
    if (pruefungGesperrt) {
      setQuote(null)
      setQuoteMeldung('Die Prüfung gilt hier nicht als erfolgreich. Der Link öffnet das Angebot bei Viator.')
      return
    }
    if (!standard && !gewaehlteOption) {
      setQuote(null)
      setQuoteMeldung('Bitte wähle eine Option.')
      return
    }
    if (zeiten.length > 1 && !gewaehlteZeit) {
      setQuote(null)
      setQuoteMeldung('Bitte wähle eine Startzeit.')
      return
    }
    const generation = ++quoteLauf.current
    quoteAbort.current?.abort()
    const steuerung = new AbortController()
    quoteAbort.current = steuerung
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
        ...(standard ? {} : { productOptionCode: gewaehlteOption }),
        travelDate: datum,
        ...(gewaehlteZeit ? { startTime: gewaehlteZeit } : {}),
        currency: waehrung,
        paxMix,
      },
      steuerung.signal,
    )
      .then((antwort) => {
        if (quoteLauf.current !== generation) return
        setQuote(antwort.value)
        setQuoteMeldung(antwort.message)
      })
      .catch(() => {
        if (quoteLauf.current !== generation) return
        setQuote(null)
        setQuoteMeldung('Die Prüfung wurde abgebrochen.')
      })
      .finally(() => {
        if (quoteLauf.current === generation) setPrueft(false)
      })
  }

  return (
    <section aria-label="Viator-Prüfung" aria-busy={prueft} className="mt-4 min-w-0 max-w-full rounded-2xl border border-line-200 bg-white p-3">
      <h3 className="text-base font-semibold text-brand-800">Ausgewähltes Angebot</h3>
      <p className="mt-1 text-sm leading-6 text-ink-800">{meldung}</p>
      {bild ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bild} alt="" className="mt-3 h-40 w-full rounded-xl object-cover" />
      ) : null}
      {detail?.description ? <p className="mt-3 break-words text-sm leading-6 text-ink-800">{detail.description}</p> : null}
      {plan ? <p className="mt-3 text-sm text-ink-800">Kalenderhinweis, keine aktuelle Verfügbarkeit.</p> : null}
      {!laedt && (!detail || !plan) ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-line-200 px-4 text-sm font-semibold text-brand-800"
        >
          Erneut laden
        </button>
      ) : null}
      {standard ? <p className="mt-3 text-sm text-ink-800">Dieses Angebot hat keine Zusatzoption.</p> : null}
      {pruefungGesperrt ? (
        <p className="mt-3 text-sm leading-6 text-ink-800">
          Die Optionen sind nicht eindeutig benannt. Eine Prüfung wird nicht als erfolgreich angezeigt.
        </p>
      ) : null}
      <div className="mt-4 grid min-w-0 max-w-full grid-cols-1 gap-3">
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
            className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-line-200 px-3"
          />
        </label>
        {optionen.length > 0 ? (
          <label className="grid gap-1 text-sm text-ink-800">
            Option
            <select
              value={gewaehlteOption}
              onChange={(event) => {
                setOption(event.target.value)
                setStartzeit('')
                verwerfen()
              }}
              className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-line-200 px-3"
            >
              {optionen.length === 1 ? null : <option value="">Bitte wählen</option>}
              {optionen.map((eintrag) => (
                <option key={eintrag.code} value={eintrag.code}>
                  {eintrag.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {zeiten.length > 0 ? (
          <label className="grid gap-1 text-sm text-ink-800">
            Startzeit
            <select
              value={gewaehlteZeit}
              onChange={(event) => {
                setStartzeit(event.target.value)
                verwerfen()
              }}
              className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-line-200 px-3"
            >
              {zeiten.length === 1 ? null : <option value="">Bitte wählen</option>}
              {zeiten.map((zeit) => (
                <option key={zeit} value={zeit}>
                  {zeit}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {reiseWaehrung ? (
          <p className="text-sm text-ink-800">Angefragte Anzeigewährung: {reiseWaehrung}. Das ist keine Checkout-Zusage.</p>
        ) : (
          <label className="grid gap-1 text-sm text-ink-800">
            Anzeigewährung
            <select
              value={waehrung ?? ''}
              onChange={(event) => {
                setWaehrungsWahl(event.target.value)
                verwerfen()
              }}
              className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-line-200 px-3"
            >
              <option value="">Bitte wählen</option>
              {VIATOR_SEARCH_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        )}
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
              className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-line-200 px-3"
            />
          </label>
        ))}
        {pruefungGesperrt ? null : (
          <button
            type="button"
            onClick={pruefen}
            disabled={prueft}
            className="inline-flex min-h-11 w-full min-w-0 max-w-full items-center justify-center whitespace-normal break-normal rounded-full bg-brand-800 px-3 text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-60"
          >
            Verfügbarkeit prüfen
          </button>
        )}
      </div>
      <p role="status" className="mt-3 text-sm leading-6 text-ink-800">
        {prueft ? 'Prüfung läuft.' : quoteMeldung}
      </p>
      {quote?.price && waehrung ? (
        <p className="mt-2 text-sm text-ink-800">
          {quote.price.currency} {quote.price.amount}. Keine Checkout-Zusage.
          {quote.price.currency !== waehrung ? ` Nicht als ${waehrung} übernommen.` : ''}
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

export default function ViatorPruefung(props: {
  productCode: string
  dayDate: string | null
  gewuenschteWaehrung: string
}) {
  const [versuch, setVersuch] = useState(0)
  return (
    <ViatorPruefungLauf
      key={`${props.productCode}:${versuch}`}
      {...props}
      onRetry={() => setVersuch((stand) => stand + 1)}
    />
  )
}
