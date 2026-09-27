'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  anbieterAusBenutzer,
  ersterVerifizierterTotp,
  verifizierteTotpAnzahl,
} from '@/lib/account/kontoloeschung'
import {
  KONTO_LOESCHUNG_TEXTE,
  kontoLoeschungHttpAuftrag,
  loeschungAntwortLesen,
  loeschungKannAbsenden,
  loeschungOberflaeche,
  loeschungSatz,
  lokaleSitzungNachLoeschung,
  totpFuerLoeschungBestaetigen,
  zielNachLoeschung,
} from '@/lib/account/kontoloeschung-zustand'
import { createBrowserClient } from '@/lib/supabase/client'

type Sitzung = {
  beweis: 'passwort' | 'nur_oauth' | 'nicht_unterstuetzt' | 'unbekannt'
  mfa: 'kein_faktor' | 'bereits_aal2' | 'step_up' | 'aal_unbekannt'
  faktoren: unknown
}

const ANFANG: Sitzung = { beweis: 'unbekannt', mfa: 'aal_unbekannt', faktoren: null }

export default function KontoLoeschen() {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(), [])
  const [sitzung, setSitzung] = useState<Sitzung>(ANFANG)
  const [confirmation, setConfirmation] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [arbeitet, setArbeitet] = useState(false)
  const [geladen, setGeladen] = useState(false)
  const [hinweis, setHinweis] = useState<string | null>(null)

  useEffect(() => {
    let aktiv = true
    void (async () => {
      try {
        const naechste = await sitzungLesen(supabase)
        if (aktiv) setSitzung(naechste)
      } catch {
        if (aktiv) setSitzung(ANFANG)
      } finally {
        if (aktiv) setGeladen(true)
      }
    })()
    return () => {
      aktiv = false
    }
  }, [supabase])

  const bereit = loeschungKannAbsenden({
    confirmation,
    password,
    beweis: sitzung.beweis,
    mfa: sitzung.mfa,
    totpCode,
    arbeitet,
  })

  async function absenden(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (arbeitet) return
    setArbeitet(true)
    setHinweis(null)
    try {
      const aktuell = await sitzungLesen(supabase)
      setSitzung(aktuell)
      const darf = loeschungKannAbsenden({
        confirmation,
        password,
        beweis: aktuell.beweis,
        mfa: aktuell.mfa,
        totpCode,
        arbeitet: false,
      })
      if (!darf) {
        setHinweis(
          aktuell.beweis === 'nur_oauth' || aktuell.beweis === 'nicht_unterstuetzt'
            ? KONTO_LOESCHUNG_TEXTE.oauth
            : KONTO_LOESCHUNG_TEXTE.unbekannt,
        )
        return
      }
      if (aktuell.mfa === 'step_up') {
        const faktorId = ersterVerifizierterTotp(aktuell.faktoren) ?? ''
        const stand = await totpFuerLoeschungBestaetigen(supabase.auth, faktorId, totpCode)
        if (stand !== 'aal2') {
          setHinweis(loeschungSatz({ art: 'abgelehnt', code: stand }))
          return
        }
      }
      const { data } = await supabase.auth.getSession()
      const auftrag = kontoLoeschungHttpAuftrag({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        accessToken: data.session?.access_token ?? '',
        confirmation,
        password,
      })
      if ('art' in auftrag) {
        setHinweis(KONTO_LOESCHUNG_TEXTE.unbekannt)
        return
      }
      const antwort = await fetch(auftrag.url, auftrag.init)
      const body: unknown = await antwort.json().catch(() => null)
      const ergebnis = loeschungAntwortLesen(antwort.status, body)
      if (ergebnis.art === 'geloescht' || ergebnis.art === 'residual' || ergebnis.art === 'nicht_gefunden') {
        await lokaleSitzungNachLoeschung((options) => supabase.auth.signOut(options))
        router.push(zielNachLoeschung(ergebnis.art))
        return
      }
      setHinweis(loeschungSatz(ergebnis))
    } catch {
      setHinweis(KONTO_LOESCHUNG_TEXTE.unbekannt)
    } finally {
      setArbeitet(false)
    }
  }

  return (
    <section
      aria-labelledby="account-kontoloeschung-title"
      className="rounded-[26px] border border-danger-600/30 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)]"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger-600/10 text-danger-600">
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="account-kontoloeschung-title"
            className="text-lg font-semibold tracking-[-0.03em] text-brand-800"
          >
            {KONTO_LOESCHUNG_TEXTE.titel}
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-700">{KONTO_LOESCHUNG_TEXTE.erklaerung}</p>
          <p className="mt-3 text-sm leading-6 text-ink-700">{KONTO_LOESCHUNG_TEXTE.exportHinweis}</p>
          <a
            href="/api/account/export"
            className="mt-4 inline-flex min-h-11 items-center rounded-2xl border border-brand-800 px-4 text-sm font-semibold text-brand-800 transition hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
          >
            Konto- und Reisedaten als JSON herunterladen
          </a>

          {sitzung.beweis === 'nur_oauth' || sitzung.beweis === 'nicht_unterstuetzt' ? (
            <p className="mt-4 text-sm leading-6 text-ink-700" role="status">
              {KONTO_LOESCHUNG_TEXTE.oauth}
            </p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={absenden}>
              <Input
                label={KONTO_LOESCHUNG_TEXTE.phraseLabel}
                name="confirmation"
                autoComplete="off"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
              <Input
                label={KONTO_LOESCHUNG_TEXTE.passwortLabel}
                name="password"
                type="password"
                revealable
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {sitzung.mfa === 'step_up' ? (
                <div className="space-y-2">
                  <p className="text-sm leading-6 text-ink-700">{KONTO_LOESCHUNG_TEXTE.totpHinweis}</p>
                  <Input
                    label={KONTO_LOESCHUNG_TEXTE.totpLabel}
                    name="totp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={totpCode}
                    onChange={(event) => setTotpCode(event.target.value)}
                  />
                </div>
              ) : null}
              {geladen && sitzung.mfa === 'aal_unbekannt' ? (
                <p className="text-sm leading-6 text-ink-700" role="status">
                  {loeschungSatz({ art: 'abgelehnt', code: 'aal_unbekannt' })}
                </p>
              ) : null}
              {hinweis ? (
                <p className="text-sm leading-6 text-ink-700" role="alert">
                  {hinweis}
                </p>
              ) : null}
              <Button type="submit" variant="destructive" disabled={!bereit} isLoading={arbeitet} loadingText="Konto wird gelöscht">
                Konto endgültig löschen
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

async function sitzungLesen(supabase: ReturnType<typeof createBrowserClient>): Promise<Sitzung> {
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return ANFANG
  const faktoren = await supabase.auth.mfa.listFactors()
  const anzahl = faktoren.error ? null : verifizierteTotpAnzahl(faktoren.data)
  let aal: 'aal1' | 'aal2' | null = null
  if (anzahl && anzahl > 0) {
    const stand = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const current = stand.data?.currentLevel
    if (!stand.error && (current === 'aal1' || current === 'aal2')) aal = current
  }
  const flaeche = loeschungOberflaeche({
    anbieter: anbieterAusBenutzer(user),
    email: typeof user.email === 'string' ? user.email : null,
    verifizierteTotp: anzahl,
    aal,
  })
  return { ...flaeche, faktoren: faktoren.data }
}
