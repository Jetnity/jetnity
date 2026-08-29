'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, Plus, Users } from 'lucide-react'
import { useState, useTransition, type FormEvent } from 'react'

import AccountReisendeKarte from '@/components/account/AccountReisendeKarte'
import type { Problem } from '@/lib/api/datenbank-lesen'
import { REGISTRY_COPY } from '@/lib/traveller/account-registry-copy'
import { registryTravellerAnlegen } from '@/lib/traveller/account-registry-aktionen'
import { registryTravellerFormularAnfang } from '@/lib/traveller/account-registry-eingabe'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'

type Status = { art: 'erfolg' | 'fehler'; text: string } | null

const feldKlasse =
  'min-h-11 w-full rounded-2xl border border-line-200 bg-white px-3 text-sm text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'

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

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
        {REGISTRY_COPY.seitenEyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
        {REGISTRY_COPY.seitenTitel}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-700">{REGISTRY_COPY.seitenLead}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">{REGISTRY_COPY.dualAuthorityHinweis}</p>

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
          className="mt-10 rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center sm:px-10"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-red-800">{REGISTRY_COPY.fehlerTitel}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-700">
            {problem.status === 503 ? REGISTRY_COPY.fehler503 : REGISTRY_COPY.fehler500}
          </p>
        </section>
      ) : travellers && travellers.length === 0 ? (
        <section className="mt-10 rounded-[30px] border border-dashed border-line-400 bg-white/65 px-6 py-14 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-800">
            {REGISTRY_COPY.leerTitel}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">{REGISTRY_COPY.leerText}</p>
        </section>
      ) : travellers ? (
        <ul className="mt-10 space-y-6">
          {travellers.map((traveller) => (
            <li key={traveller.id}>
              <AccountReisendeKarte
                traveller={traveller}
                onStatus={setStatus}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {problem ? null : (
        <form
          onSubmit={anlegen}
          className="mt-10 rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-6"
        >
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-brand-800">
            {REGISTRY_COPY.anlegenTitel}
          </h2>
          <div className="mt-4 grid gap-4">
            <label className="grid gap-1 text-sm font-medium text-brand-800">
              {REGISTRY_COPY.bezeichnungLabel}
              <input
                value={formular.label}
                onChange={(event) => setFormular((aktuell) => ({ ...aktuell, label: event.target.value }))}
                maxLength={40}
                autoComplete="off"
                className={feldKlasse}
              />
              <span className="font-normal text-ink-700">{REGISTRY_COPY.bezeichnungHinweis}</span>
            </label>
            <label className="grid gap-1 text-sm font-medium text-brand-800">
              {REGISTRY_COPY.wohnsitzLabel}
              <input
                value={formular.residenceCountryCode}
                onChange={(event) =>
                  setFormular((aktuell) => ({
                    ...aktuell,
                    residenceCountryCode: event.target.value.toUpperCase(),
                  }))
                }
                maxLength={2}
                autoComplete="off"
                inputMode="text"
                spellCheck={false}
                className={`${feldKlasse} uppercase`}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {REGISTRY_COPY.anlegenAktion}
          </button>
        </form>
      )}
    </div>
  )
}
