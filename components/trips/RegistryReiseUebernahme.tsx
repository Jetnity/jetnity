'use client'

import Link from 'next/link'
import { AlertCircle, Users } from 'lucide-react'
import { useState, useTransition } from 'react'

import type { Problem } from '@/lib/api/datenbank-lesen'
import { REGISTRY_DOKUMENT_TYP_LABEL } from '@/lib/traveller/account-registry-copy'
import {
  registryTripAnzeigeName,
  type RegistryTripAnzeige,
} from '@/lib/traveller/account-registry-trip'
import { REGISTRY_TRIP_COPY } from '@/lib/traveller/account-registry-trip-copy'

type Status = { art: 'erfolg' | 'fehler'; text: string } | null

const hauptAktion =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-60'

const nebenAktion =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-line-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-60'

export default function RegistryReiseUebernahme({
  problem,
  travellers,
  voll,
  onUebernehmen,
}: {
  problem: Problem | null
  travellers: RegistryTripAnzeige[] | null
  voll: boolean
  onUebernehmen: (registryTravellerId: string) => Promise<string | null>
}) {
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<Status>(null)
  const [bestaetigungId, setBestaetigungId] = useState<string | null>(null)

  function uebernehmen(registryTravellerId: string) {
    startTransition(async () => {
      setStatus(null)
      const fehler = await onUebernehmen(registryTravellerId)
      if (fehler) {
        setStatus({ art: 'fehler', text: fehler })
        return
      }
      setBestaetigungId(null)
      setStatus({ art: 'erfolg', text: REGISTRY_TRIP_COPY.erfolg })
    })
  }

  return (
    <section aria-labelledby="registry-reise-uebernahme-titel" className="rounded-2xl border border-line-200 bg-surface-25 px-3 py-3">
      <h5 id="registry-reise-uebernahme-titel" className="text-sm font-semibold text-brand-800">
        {REGISTRY_TRIP_COPY.titel}
      </h5>
      <p className="mt-1 text-xs leading-5 text-ink-800">{REGISTRY_TRIP_COPY.hinweis}</p>

      {status ? (
        <p
          role={status.art === 'fehler' ? 'alert' : 'status'}
          className={
            status.art === 'fehler'
              ? 'mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800'
              : 'mt-3 rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm text-brand-800'
          }
        >
          {status.text}
        </p>
      ) : null}

      {pending ? (
        <p role="status" className="mt-3 text-sm text-ink-800">
          {REGISTRY_TRIP_COPY.pending}
        </p>
      ) : null}

      {voll ? (
        <p role="status" className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-ink-800">
          {REGISTRY_TRIP_COPY.limit}
        </p>
      ) : null}

      {problem ? (
        <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
          <p className="flex items-start gap-2 text-sm font-semibold text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {REGISTRY_TRIP_COPY.fehlerTitel}
          </p>
          <p className="mt-1 text-xs leading-5 text-red-800">
            {problem.status === 503 ? REGISTRY_TRIP_COPY.fehler503 : REGISTRY_TRIP_COPY.fehler500}
          </p>
        </div>
      ) : travellers && travellers.length === 0 ? (
        <div role="status" className="mt-3 rounded-xl bg-white px-3 py-3">
          <p className="flex items-start gap-2 text-sm font-semibold text-brand-800">
            <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {REGISTRY_TRIP_COPY.leerTitel}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-800">{REGISTRY_TRIP_COPY.leerText}</p>
          <Link
            href="/account/travellers"
            className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
          >
            {REGISTRY_TRIP_COPY.leerLink}
          </Link>
        </div>
      ) : travellers == null ? (
        <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
          <p className="text-sm font-semibold text-red-800">{REGISTRY_TRIP_COPY.fehlerTitel}</p>
          <p className="mt-1 text-xs leading-5 text-red-800">{REGISTRY_TRIP_COPY.fehler500}</p>
        </div>
      ) : (
        <ul className="mt-3 grid gap-2">
          {travellers.map((traveller) => {
            const bestaetigt = bestaetigungId === traveller.id
            return (
              <li key={traveller.id} className="rounded-xl border border-line-200 bg-white px-3 py-3">
                <p className="text-sm font-semibold text-brand-800">
                  {registryTripAnzeigeName(traveller.label)}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-ink-800">
                  {traveller.residenceCountryCode
                    ? `${REGISTRY_TRIP_COPY.wohnsitz}: ${traveller.residenceCountryCode}`
                    : REGISTRY_TRIP_COPY.wohnsitzLeer}
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-800">
                  {REGISTRY_TRIP_COPY.staatsbuergerschaften}:{' '}
                  {traveller.citizenshipCountryCodes.length === 0
                    ? 'keine hinterlegt'
                    : traveller.citizenshipCountryCodes.join(', ')}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-ink-800">
                  {REGISTRY_TRIP_COPY.dokumente}:{' '}
                  {traveller.documents.length === 0
                    ? 'keine hinterlegt'
                    : traveller.documents
                        .map(
                          (dokument) =>
                            `${REGISTRY_DOKUMENT_TYP_LABEL[dokument.documentType]}${
                              dokument.issuingCountryCode ? ` · ${dokument.issuingCountryCode}` : ''
                            }`,
                        )
                        .join('; ')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {bestaetigt ? (
                    <>
                      <button
                        type="button"
                        className={hauptAktion}
                        disabled={pending || voll}
                        aria-label={`${REGISTRY_TRIP_COPY.bestaetigen}: ${registryTripAnzeigeName(traveller.label)}`}
                        onClick={() => uebernehmen(traveller.id)}
                      >
                        {REGISTRY_TRIP_COPY.bestaetigen}
                      </button>
                      <button
                        type="button"
                        className={nebenAktion}
                        disabled={pending}
                        onClick={() => setBestaetigungId(null)}
                      >
                        {REGISTRY_TRIP_COPY.abbrechen}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={nebenAktion}
                      disabled={pending || voll}
                      aria-label={`${REGISTRY_TRIP_COPY.aktion}: ${registryTripAnzeigeName(traveller.label)}`}
                      onClick={() => {
                        setStatus(null)
                        setBestaetigungId(traveller.id)
                      }}
                    >
                      {REGISTRY_TRIP_COPY.aktion}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
