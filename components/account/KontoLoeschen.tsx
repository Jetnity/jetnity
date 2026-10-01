// components/account/KontoLoeschen.tsx
//
// Destruktiver Abschnitt unter /account/settings. Export zuerst, exakte
// Bestätigung, frisches Passwort, TOTP-Step-up nur wenn ein verifizierter
// Faktor die Sitzung noch nicht auf AAL2 gehoben hat.

'use client'

import * as React from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SICHERHEIT_EINGABE_16, SICHERHEIT_ZIEL_44, SICHERHEIT_ZIEL_44_QUADRAT } from '@/lib/auth/account-security-premium-ux-1'
import {
  KONTOLOESCHUNG_ANFANG,
  kontoloeschungAnstossen,
  kontoloeschungAntwortHolen,
  kontoloeschungCodeSenden,
  kontoloeschungFunktionsUrl,
  kontoloeschungIstBeschaeftigt,
  kontoloeschungSendenGesperrt,
  kontoloeschungStatusText,
  kontoloeschungWeiter,
  type KontoloeschungPort,
  type KontoloeschungZustand,
} from '@/lib/account/kontoloeschung-client'
import { loeschUmgebungErlaubt } from '@/lib/account/kontoloeschung-vertrag'
import { mfaStepUpChallengeIdLesen } from '@/lib/auth/account-mfa-step-up'
import { createBrowserClient } from '@/lib/supabase/client'

function portBauen(): KontoloeschungPort {
  const client = createBrowserClient()
  const url = kontoloeschungFunktionsUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return {
    getUser: async () => {
      const { data, error } = await client.auth.getUser()
      if (error || !data.user) return { user: null }
      const providers = (data.user.identities ?? [])
        .map((identity) => identity.provider)
        .filter((provider): provider is string => typeof provider === 'string' && provider.length > 0)
      return {
        user: {
          id: data.user.id,
          email: data.user.email ?? null,
          providers,
        },
      }
    },
    signInWithPassword: async (email, password) => {
      const { data, error } = await client.auth.signInWithPassword({ email, password })
      if (error || !data.session?.access_token) {
        return { ok: false, rateLimited: error?.status === 429, accessToken: null }
      }
      return { ok: true, rateLimited: false, accessToken: data.session.access_token }
    },
    faktorenUndAal: async () => {
      const mfa = client.auth.mfa
      if (!mfa?.listFactors || !mfa.getAuthenticatorAssuranceLevel) return { ok: false }
      const [faktoren, aal] = await Promise.all([
        mfa.listFactors(),
        mfa.getAuthenticatorAssuranceLevel(),
      ])
      if (faktoren.error || !faktoren.data || aal.error || !aal.data) return { ok: false }
      const alle = faktoren.data.all ?? []
      const verified = alle.filter((faktor) => faktor.status === 'verified')
      const current = aal.data.currentLevel
      return {
        ok: true,
        verifiedTotpIds: verified
          .filter((faktor) => faktor.factor_type === 'totp' && faktor.id)
          .map((faktor) => faktor.id),
        verifiedAndere: verified.filter((faktor) => faktor.factor_type !== 'totp').length,
        currentLevel: current === 'aal1' || current === 'aal2' ? current : null,
      }
    },
    mfaChallenge: async (factorId) => {
      if (!client.auth.mfa?.challenge) return { challengeId: null }
      const { data, error } = await client.auth.mfa.challenge({ factorId })
      if (error) return { challengeId: null }
      return { challengeId: mfaStepUpChallengeIdLesen(data) }
    },
    mfaVerify: async (factorId, challengeId, code) => {
      if (!client.auth.mfa?.verify || !client.auth.mfa.getAuthenticatorAssuranceLevel) {
        return { ok: false, accessToken: null, currentLevel: null }
      }
      const { data, error } = await client.auth.mfa.verify({ factorId, challengeId, code })
      if (error || !data) return { ok: false, accessToken: null, currentLevel: null }
      const token = data.access_token
      const aal = await client.auth.mfa.getAuthenticatorAssuranceLevel()
      const current = aal.data?.currentLevel
      return {
        ok: typeof token === 'string' && token.length > 0,
        accessToken: typeof token === 'string' ? token : null,
        currentLevel: current === 'aal1' || current === 'aal2' ? current : null,
      }
    },
    loeschen: async (accessToken) => {
      if (!url || !anon) return { klasse: 'nicht_verfuegbar', netz: false }
      return kontoloeschungAntwortHolen(url, accessToken, anon)
    },
    lokaleSitzungBeenden: async () => {
      await client.auth.signOut({ scope: 'local' })
    },
    speicher: typeof window === 'undefined' ? null : window.localStorage,
    ortWechseln: (pfad) => {
      window.location.assign(pfad)
    },
  }
}

export default function KontoLoeschen() {
  const [zustand, setZustand] = React.useState<KontoloeschungZustand>(KONTOLOESCHUNG_ANFANG)
  const [formularOffen, setFormularOffen] = React.useState(false)
  const [zeigePasswort, setZeigePasswort] = React.useState(false)
  const [bestaetigung, setBestaetigung] = React.useState('')
  const [passwort, setPasswort] = React.useState('')
  const [code, setCode] = React.useState('')
  const laufend = React.useRef(false)
  const statusRef = React.useRef<HTMLDivElement>(null)
  const codeRef = React.useRef<HTMLInputElement>(null)
  const beschaeftigt = kontoloeschungIstBeschaeftigt(zustand)
  const gesperrt = kontoloeschungSendenGesperrt(zustand, bestaetigung, passwort, code)
  const status = kontoloeschungStatusText(zustand)
  // Nur Darstellung. Die Zustandsmaschine bleibt unberührt, solange die Phase
  // noch `bereit` ist. Nach dem Start gibt es kein Schließen.
  const formularSichtbar = zustand.phase !== 'nicht_unterstuetzt' && (formularOffen || zustand.phase !== 'bereit')
  const vorbereitenSichtbar = zustand.phase === 'bereit' && !formularOffen
  const schliessenSichtbar = zustand.phase === 'bereit' && formularOffen

  function vorbereitungSchliessen() {
    if (zustand.phase !== 'bereit') return
    setBestaetigung('')
    setPasswort('')
    setCode('')
    setZeigePasswort(false)
    setFormularOffen(false)
  }

  React.useEffect(() => {
    if (zustand.phase === 'mfa') codeRef.current?.focus()
    if (zustand.phase === 'fehler' || zustand.phase === 'nicht_unterstuetzt') statusRef.current?.focus()
  }, [zustand.phase])

  async function absenden(ereignis: React.FormEvent) {
    ereignis.preventDefault()
    if (gesperrt || laufend.current) return
    laufend.current = true
    setZustand((aktuell) => kontoloeschungWeiter(aktuell, { typ: 'starte' }))
    try {
      const port = portBauen()
      const ergebnis =
        zustand.phase === 'mfa' && zustand.faktorId && zustand.challengeId
          ? await kontoloeschungCodeSenden(port, {
              code,
              faktorId: zustand.faktorId,
              challengeId: zustand.challengeId,
            })
          : await kontoloeschungAnstossen(port, { bestaetigung, passwort })
      if (ergebnis.typ === 'mfa_noetig' || ergebnis.typ === 'geloescht') {
        setPasswort('')
        setCode('')
      }
      setZustand((aktuell) => kontoloeschungWeiter(aktuell, ergebnis))
    } finally {
      laufend.current = false
    }
  }

  if (!loeschUmgebungErlaubt(process.env.NEXT_PUBLIC_SUPABASE_URL)) return null

  return (
    <section
      aria-labelledby="konto-loeschen-titel"
      data-kontoloeschung-phase={zustand.phase}
      data-kontoloeschung-formular={formularSichtbar ? 'offen' : 'zu'}
      className="scroll-mt-24 rounded-[26px] border border-red-200 bg-red-50/50 p-4 sm:p-5"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-100 text-brand-800">
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="konto-loeschen-titel" className="text-lg font-semibold tracking-[-0.03em] text-brand-800">
            Konto löschen
          </h2>
          <p id="konto-loeschen-hinweis" className="mt-1 text-sm leading-6 text-ink-700">
            Das Löschen entfernt dieses Jetnity-Konto und die dazu gespeicherten Reisen, Reisenden
            und Besuche. Eine Wiederherstellung dieses Kontos ist nicht vorgesehen.
          </p>
          <p className="mt-3 text-sm leading-6 text-ink-700">
            Bevor du löschst, kannst du die vorhandenen Konto- und Reisedaten herunterladen.
          </p>
          <a
            href="/api/account/export"
            className={`${SICHERHEIT_ZIEL_44} mt-4 inline-flex items-center rounded-2xl border border-brand-800 px-4 text-sm font-semibold text-brand-800 transition hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15`}
          >
            Daten zuerst exportieren
          </a>

          {vorbereitenSichtbar ? (
            <Button
              type="button"
              variant="outline"
              className={`${SICHERHEIT_ZIEL_44} mt-4 border-red-700 text-red-900 hover:bg-red-100`}
              aria-expanded={false}
              aria-controls="konto-loeschen-formular"
              onClick={() => setFormularOffen(true)}
            >
              Kontolöschung vorbereiten
            </Button>
          ) : null}

          {zustand.phase === 'nicht_unterstuetzt' ? (
            <p className="mt-4 text-sm leading-6 text-ink-700">{status}</p>
          ) : formularSichtbar ? (
            <form id="konto-loeschen-formular" className="mt-6 space-y-4" onSubmit={absenden}>
              <div>
                <label htmlFor="konto-loeschen-bestaetigung" className="text-sm font-medium text-brand-800">
                  Gib KONTO LÖSCHEN ein, um fortzufahren
                </label>
                <input
                  id="konto-loeschen-bestaetigung"
                  className={`mt-2 min-h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 ${SICHERHEIT_EINGABE_16}`}
                  value={bestaetigung}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={zustand.fehler?.code === 'bestaetigung' || undefined}
                  aria-describedby="konto-loeschen-hinweis konto-loeschen-status"
                  disabled={beschaeftigt || zustand.phase === 'fertig'}
                  onChange={(ereignis) => setBestaetigung(ereignis.target.value)}
                />
              </div>

              {zustand.phase === 'mfa' ? (
                <div>
                  <label htmlFor="konto-loeschen-code" className="text-sm font-medium text-brand-800">
                    6-stelliger Code
                  </label>
                  <input
                    ref={codeRef}
                    id="konto-loeschen-code"
                    className={`mt-2 min-h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 ${SICHERHEIT_EINGABE_16}`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    aria-invalid={zustand.fehler?.code === 'mfa_code' || undefined}
                    disabled={beschaeftigt}
                    onChange={(ereignis) => setCode(ereignis.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="konto-loeschen-passwort" className="text-sm font-medium text-brand-800">
                    Aktuelles Passwort
                  </label>
                  <div className="relative mt-2">
                    <input
                      id="konto-loeschen-passwort"
                      type={zeigePasswort ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={passwort}
                      disabled={beschaeftigt || zustand.phase === 'fertig'}
                      onChange={(ereignis) => setPasswort(ereignis.target.value)}
                      className={`min-h-11 w-full rounded-2xl border border-black/10 bg-white px-4 pr-14 text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-60 ${SICHERHEIT_EINGABE_16}`}
                    />
                    <button
                      type="button"
                      className={`${SICHERHEIT_ZIEL_44_QUADRAT} absolute right-1 top-1/2 -translate-y-1/2 rounded-xl text-brand-800 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15`}
                      aria-label={zeigePasswort ? 'Passwort verbergen' : 'Passwort anzeigen'}
                      onClick={() => setZeigePasswort((wert) => !wert)}
                    >
                      {zeigePasswort ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={gesperrt}
                  isLoading={beschaeftigt}
                  loadingText="Konto wird gelöscht"
                  className={SICHERHEIT_ZIEL_44}
                >
                  Konto endgültig löschen
                </Button>
                {schliessenSichtbar ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className={SICHERHEIT_ZIEL_44}
                    onClick={vorbereitungSchliessen}
                  >
                    Vorbereitung schließen
                  </Button>
                ) : null}
              </div>
            </form>
          ) : null}

          <div
            ref={statusRef}
            id="konto-loeschen-status"
            role="status"
            aria-live="polite"
            tabIndex={-1}
            className="mt-4 text-sm leading-6 text-ink-700 outline-none"
          >
            {status}
          </div>
        </div>
      </div>
    </section>
  )
}
