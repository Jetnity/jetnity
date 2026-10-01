'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, Plus, Users } from 'lucide-react'
import { useRef, useState, useTransition, type FormEvent } from 'react'

import AccountReisendeKarte from '@/components/account/AccountReisendeKarte'
import LandFeld from '@/components/country/LandFeld'
import type { Problem } from '@/lib/api/datenbank-lesen'
import { REGISTRY_COPY } from '@/lib/traveller/account-registry-copy'
import { registryTravellerAnlegen } from '@/lib/traveller/account-registry-aktionen'
import { registryTravellerFormularAnfang } from '@/lib/traveller/account-registry-eingabe'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import {
  registryFlaecheAnlegen,
  registryFlaecheVerwalten,
  registryVerwalteteId,
  type RegistryFlaeche,
} from '@/lib/traveller/account-travellers-premium-registry-ux-1'

type Status = { art: 'erfolg' | 'fehler'; text: string } | null

const feldKlasse =
  'min-h-11 w-full max-w-full scroll-mt-32 rounded-2xl border border-line-200 bg-white px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'

const hauptAktion =
  'inline-flex min-h-11 w-full scroll-mt-32 items-center justify-center gap-2 whitespace-normal rounded-full bg-brand-800 px-5 py-2 text-center text-base font-semibold leading-tight text-white transition hover:-translate-y-0.5 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto'

const nebenAktion =
  'inline-flex min-h-11 w-full scroll-mt-32 items-center justify-center whitespace-normal rounded-full border border-line-200 bg-white px-4 py-2 text-center text-base font-semibold leading-tight text-brand-800 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto'

export default function AccountReisende({
  problem,
  travellers,
}: {
  problem: Problem | null
  travellers: AccountRegistryTraveller[] | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [formular, setFormular] = useState(registryTravellerFormularAnfang)
  const [status, setStatus] = useState<Status>(null)
  const [flaeche, setFlaeche] = useState<RegistryFlaeche>({ art: 'uebersicht' })
  const anlegenRef = useRef<HTMLButtonElement>(null)
  const anlegenOffen = flaeche.art === 'anlegen'
  const verwaltetId = registryVerwalteteId(flaeche)

  function anlegen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const ergebnis = await registryTravellerAnlegen({
        label: formular.label,
        residenceCountryCode: formular.residenceCountryCode,
      })
      if (!ergebnis.ok) {
        setStatus({ art: 'fehler', text: ergebnis.meldung })
        return
      }
      setFormular(registryTravellerFormularAnfang())
      setStatus({ art: 'erfolg', text: REGISTRY_COPY.erfolgAngelegt })
      router.refresh()
    })
  }

  function anlegenSchliessen() {
    setFlaeche({ art: 'uebersicht' })
    anlegenRef.current?.focus()
  }

  return (
    <div className="min-w-0 [&_*]:[overflow-wrap:anywhere] [&_input]:!text-base [&_select]:!text-base">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
        {REGISTRY_COPY.seitenEyebrow}
      </p>
      <h1 className="mt-2 text-balance break-words text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
        {REGISTRY_COPY.seitenTitel}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-700">{REGISTRY_COPY.seitenLead}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">{REGISTRY_COPY.dualAuthorityHinweis}</p>

      {status ? (
        <p
          role={status.art === 'fehler' ? 'alert' : 'status'}
          className={
            status.art === 'fehler'
              ? 'mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
              : 'mt-6 rounded-2xl border border-brand-100 bg-surface-50 px-4 py-3 text-sm text-brand-800'
          }
        >
          {status.text}
        </p>
      ) : null}

      {problem ? (
        <section
          role="alert"
          className="mt-8 rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center sm:px-10"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-red-800">{REGISTRY_COPY.fehlerTitel}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-700">
            {problem.status === 503 ? REGISTRY_COPY.fehler503 : REGISTRY_COPY.fehler500}
          </p>
        </section>
      ) : (
        <>
          <div className="mt-6">
            <button
              ref={anlegenRef}
              type="button"
              aria-expanded={anlegenOffen}
              aria-controls="registry-anlegen"
              onClick={() => setFlaeche((aktuell) => registryFlaecheAnlegen(aktuell))}
              className={hauptAktion}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              {REGISTRY_COPY.reisendenHinzufuegen}
            </button>
          </div>

          {anlegenOffen ? (
            <form
              id="registry-anlegen"
              onSubmit={anlegen}
              className="mt-4 max-w-xl rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-6"
            >
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-brand-800">
                {REGISTRY_COPY.reisendenHinzufuegen}
              </h2>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-1 text-sm font-medium text-brand-800">
                  {REGISTRY_COPY.bezeichnungLabel}
                  <input
                    value={formular.label}
                    onChange={(event) => setFormular((aktuell) => ({ ...aktuell, label: event.target.value }))}
                    maxLength={40}
                    autoComplete="off"
                    autoFocus
                    className={feldKlasse}
                  />
                  <span className="font-normal text-ink-700">{REGISTRY_COPY.bezeichnungHinweis}</span>
                </label>
                <LandFeld
                  label={REGISTRY_COPY.wohnsitzLabel}
                  value={formular.residenceCountryCode}
                  onChange={(residenceCountryCode) =>
                    setFormular((aktuell) => ({ ...aktuell, residenceCountryCode }))
                  }
                />
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button type="submit" disabled={pending} className={hauptAktion}>
                  <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {REGISTRY_COPY.anlegenAktion}
                </button>
                <button type="button" className={nebenAktion} onClick={anlegenSchliessen}>
                  {REGISTRY_COPY.abbrechen}
                </button>
              </div>
            </form>
          ) : null}

          {travellers && travellers.length === 0 ? (
            <section className="mt-6 rounded-[30px] border border-dashed border-line-400 bg-white/65 px-6 py-10 text-center sm:px-10">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
                <Users className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-800">
                {REGISTRY_COPY.leerTitel}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">{REGISTRY_COPY.leerText}</p>
            </section>
          ) : travellers ? (
            <ul
              className={
                verwaltetId
                  ? 'mt-6 grid grid-cols-1 gap-4'
                  : 'mt-6 grid grid-cols-1 gap-4 md:grid-cols-2'
              }
            >
              {travellers.map((traveller) => {
                const verwaltet = verwaltetId === traveller.id
                return (
                  <li key={traveller.id} className={verwaltet ? 'min-w-0 md:col-span-2' : 'min-w-0'}>
                    <AccountReisendeKarte
                      traveller={traveller}
                      verwaltet={verwaltet}
                      onVerwalten={() =>
                        setFlaeche((aktuell) => registryFlaecheVerwalten(aktuell, traveller.id))
                      }
                      onStatus={setStatus}
                    />
                  </li>
                )
              })}
            </ul>
          ) : null}
        </>
      )}
    </div>
  )
}
