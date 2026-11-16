'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Languages } from 'lucide-react'
import type { UiEinstellungenLesen, UiEinstellungenSpeichernErgebnis } from '@/lib/account/ui-einstellungen-1/vertrag'
import { uiSpracheLesen, type UiSprache } from '@/lib/localization/ui-sprache'
import { einstellungenText, type EinstellungenTextSchluessel } from '@/lib/localization/einstellungen-texte'
import { beobachteEinstellungenKonto, type KontoBeobachter } from './konto-beobachter'

type Fehlercode = Extract<UiEinstellungenSpeichernErgebnis, { ok: false }>['code']
type Phase = 'bereit' | 'speichern' | 'laden' | 'gespeichert' | 'fehler'

const FEHLERTEXT: Record<Fehlercode, EinstellungenTextSchluessel> = {
  eingabe: 'language.invalid', nicht_angemeldet: 'language.signedOut', nicht_verfuegbar: 'language.unavailable',
  konto_gewechselt: 'language.stale', nicht_bestaetigt: 'language.unconfirmed', abgelehnt: 'language.rejected',
}
const KNOPF = 'inline-flex min-h-11 min-w-0 items-center justify-center whitespace-normal rounded-2xl px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:cursor-not-allowed disabled:opacity-60'

export type KontospracheAktionen = {
  speichern: (eingabe: unknown) => Promise<UiEinstellungenSpeichernErgebnis>
  neuLaden: () => Promise<UiEinstellungenLesen>
  beobachten?: KontoBeobachter
}

function leseAntwortGueltig(wert: UiEinstellungenLesen): boolean {
  return Boolean(wert && (wert.status === 'nicht_angemeldet' || wert.status === 'nicht_verfuegbar'
    || (wert.status === 'bereit' && typeof wert.benutzerId === 'string' && wert.benutzerId.length > 0
      && uiSpracheLesen(wert.sprache) !== null && typeof wert.gespeichert === 'boolean')))
}

export default function Kontosprache({ initial, sprache, waehlen, speichern, neuLaden, bereich = 'konto', beobachten = beobachteEinstellungenKonto }: {
  initial: UiEinstellungenLesen
  sprache: UiSprache
  waehlen: (sprache: UiSprache) => void
  bereich?: 'konto' | 'admin'
} & KontospracheAktionen) {
  const admin = bereich === 'admin'
  const titelFarbe = admin ? 'text-card-foreground' : 'text-brand-800'
  const textFarbe = admin ? 'text-muted-foreground' : 'text-ink-800'
  const nebenKnopf = admin ? 'border border-border text-card-foreground hover:bg-muted' : 'border border-line-200 text-brand-800 hover:bg-surface-100'
  const [stand, setStand] = useState(initial)
  const [phase, setPhase] = useState<Phase>('bereit')
  const [fehler, setFehler] = useState<Fehlercode | null>(null)
  const generation = useRef(0)
  const aktiv = useRef(false)
  const laufend = useRef(false)
  const frist = useRef<ReturnType<typeof setTimeout> | null>(null)
  const benutzerId = stand.status === 'bereit' ? stand.benutzerId : null
  const urspruenglichesKonto = useRef(initial.status === 'bereit' ? initial.benutzerId : null)
  const beschaeftigt = phase === 'speichern' || phase === 'laden'
  const harteSperre = fehler === 'konto_gewechselt' || fehler === 'nicht_angemeldet'
  const erstLesen = fehler !== null && fehler !== 'eingabe'
  const geaendert = stand.status === 'bereit' && (!stand.gespeichert || sprache !== stand.sprache)
  const speichernErlaubt = stand.status === 'bereit' && geaendert && !beschaeftigt && !erstLesen

  useEffect(() => {
    aktiv.current = true
    return () => {
      aktiv.current = false
      generation.current += 1
      if (frist.current !== null) clearTimeout(frist.current)
    }
  }, [])

  useEffect(() => {
    if (!benutzerId) return
    return beobachten(benutzerId, () => {
      if (!aktiv.current) return
      generation.current += 1
      laufend.current = false
      if (frist.current !== null) clearTimeout(frist.current)
      setFehler('konto_gewechselt')
      setPhase('fehler')
    })
  }, [benutzerId, beobachten])

  function aktuell(meine: number) {
    return aktiv.current && generation.current === meine
  }

  function beginnen(art: 'speichern' | 'laden') {
    laufend.current = true
    const meine = ++generation.current
    setFehler(null)
    setPhase(art)
    frist.current = setTimeout(() => {
      if (!aktuell(meine)) return
      generation.current += 1
      laufend.current = false
      setFehler(art === 'speichern' ? 'nicht_bestaetigt' : 'nicht_verfuegbar')
      setPhase('fehler')
    }, 30_000)
    return meine
  }

  function beenden(meine: number) {
    if (!aktuell(meine)) return
    if (frist.current !== null) clearTimeout(frist.current)
    frist.current = null
    laufend.current = false
  }

  async function absenden(event: FormEvent) {
    event.preventDefault()
    if (!speichernErlaubt || laufend.current || stand.status !== 'bereit') return
    const erwarteteBenutzerId = stand.benutzerId
    const auswahl = sprache
    const meine = beginnen('speichern')
    try {
      const ergebnis = await speichern({ sprache: auswahl, erwarteteBenutzerId })
      if (!aktuell(meine)) return
      if (ergebnis?.ok === true && ergebnis.benutzerId === erwarteteBenutzerId && ergebnis.sprache === auswahl) {
        setStand({ status: 'bereit', benutzerId: erwarteteBenutzerId, sprache: auswahl, gespeichert: true })
        setPhase('gespeichert')
      } else {
        const code = ergebnis?.ok === false && Object.hasOwn(FEHLERTEXT, ergebnis.code) ? ergebnis.code : 'nicht_bestaetigt'
        setFehler(code)
        setPhase('fehler')
      }
    } catch {
      if (!aktuell(meine)) return
      setFehler('nicht_bestaetigt')
      setPhase('fehler')
    } finally { beenden(meine) }
  }

  async function erneutLesen() {
    if (laufend.current || harteSperre) return
    const meine = beginnen('laden')
    try {
      const ergebnis = await neuLaden()
      if (!aktuell(meine)) return
      if (!leseAntwortGueltig(ergebnis)) {
        setFehler('nicht_verfuegbar')
        setPhase('fehler')
      } else if (ergebnis.status !== 'bereit') {
        setStand(ergebnis)
        setFehler(ergebnis.status)
        setPhase('fehler')
      } else if (urspruenglichesKonto.current && ergebnis.benutzerId !== urspruenglichesKonto.current) {
        setFehler('konto_gewechselt')
        setPhase('fehler')
      } else {
        urspruenglichesKonto.current = ergebnis.benutzerId
        setStand(ergebnis)
        waehlen(ergebnis.sprache)
        setPhase('bereit')
      }
    } catch {
      if (!aktuell(meine)) return
      setFehler('nicht_verfuegbar')
      setPhase('fehler')
    } finally { beenden(meine) }
  }

  const sichtbarerFehler = beschaeftigt ? null : fehler ?? (stand.status === 'bereit' ? null : stand.status)
  const meldung: EinstellungenTextSchluessel = sichtbarerFehler ? FEHLERTEXT[sichtbarerFehler]
    : phase === 'speichern' ? 'language.saving' : phase === 'laden' ? 'language.loading'
      : geaendert ? (stand.status === 'bereit' && !stand.gespeichert && sprache === stand.sprache ? 'language.default' : 'language.changed')
        : phase === 'gespeichert' ? 'language.confirmed' : 'language.saved'

  return (
    <section aria-labelledby="konto-sprache-titel" data-kontosprache-phase={phase} className={`mt-6 min-w-0 rounded-[26px] border p-4 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-5 ${admin ? 'border-border bg-card text-card-foreground' : 'border-black/5 bg-white'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${admin ? 'bg-muted text-card-foreground' : 'bg-surface-100 text-brand-600'}`}><Languages aria-hidden="true" className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 id="konto-sprache-titel" className={`text-lg font-semibold tracking-[-0.03em] ${titelFarbe}`}>{einstellungenText(sprache, 'language.title')}</h2>
          <p id="konto-sprache-umfang" className={`mt-1 max-w-2xl text-sm leading-6 ${textFarbe}`}>{einstellungenText(sprache, 'language.scope')}</p>
          <form onSubmit={(event) => void absenden(event)} className="mt-4 max-w-2xl" aria-busy={beschaeftigt}>
            <label className={`block text-sm font-semibold ${titelFarbe}`} htmlFor="konto-sprache-auswahl">{einstellungenText(sprache, 'language.label')}</label>
            <select id="konto-sprache-auswahl" value={sprache} disabled={beschaeftigt || stand.status !== 'bereit' || erstLesen} aria-describedby="konto-sprache-umfang konto-sprache-status" className={`mt-2 min-h-11 w-full min-w-0 rounded-2xl border px-3 text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20 disabled:opacity-60 sm:max-w-xs ${admin ? 'border-input bg-card text-card-foreground' : 'border-black/15 bg-white text-brand-800'}`} onChange={(event) => {
              const auswahl = uiSpracheLesen(event.target.value)
              if (!auswahl || laufend.current) return
              waehlen(auswahl)
              setFehler(null)
              setPhase('bereit')
            }}>
              <option value="de" lang="de">Deutsch</option>
              <option value="en" lang="en">English</option>
            </select>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button type="submit" disabled={!speichernErlaubt} className={`${KNOPF} ${admin ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-brand-800 text-white hover:bg-brand-700'}`}>{einstellungenText(sprache, phase === 'speichern' ? 'language.saving' : 'language.save')}</button>
              {geaendert && !erstLesen ? <button type="button" disabled={beschaeftigt} className={`${KNOPF} ${nebenKnopf}`} onClick={() => { if (stand.status === 'bereit' && !laufend.current) { waehlen(stand.sprache); setPhase('bereit'); setFehler(null) } }}>{einstellungenText(sprache, 'language.discard')}</button> : null}
              {harteSperre ? <button type="button" className={`${KNOPF} ${nebenKnopf}`} onClick={() => window.location.reload()}>{einstellungenText(sprache, 'language.pageReload')}</button>
                : <button type="button" disabled={beschaeftigt} className={`${KNOPF} ${nebenKnopf}`} onClick={() => void erneutLesen()}>{einstellungenText(sprache, 'language.reload')}</button>}
            </div>
          </form>
          <p id="konto-sprache-status" role={sichtbarerFehler ? 'alert' : 'status'} className={`mt-3 break-words text-sm leading-6 ${sichtbarerFehler ? (admin ? 'text-destructive' : 'text-red-800') : textFarbe}`}>{einstellungenText(sprache, meldung)}</p>
          <p className={`mt-3 max-w-2xl text-sm leading-6 ${textFarbe}`}>{einstellungenText(sprache, 'language.persistence')}</p>
          <p className={`mt-1 max-w-2xl text-sm leading-6 ${textFarbe}`}>{einstellungenText(sprache, 'language.browser')}</p>
        </div>
      </div>
    </section>
  )
}
