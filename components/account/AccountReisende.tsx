'use client'

import { AlertCircle, Plus, Users } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'

import AccountReisendeKarte, { RegistryBelege } from '@/components/account/AccountReisendeKarte'
import { useAccountRegistryWorkflow } from '@/components/account/useAccountRegistryWorkflow'
import LandFeld from '@/components/country/LandFeld'
import type { Problem } from '@/lib/api/datenbank-lesen'
import { REGISTRY_COPY } from '@/lib/traveller/account-registry-copy'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import { registryListeKlasse } from '@/lib/traveller/account-registry-workflow'
import {
  registryFlaecheAnlegen,
  registryFlaecheVerwalten,
  registryVerwalteteId,
  type RegistryFlaeche,
} from '@/lib/traveller/account-travellers-premium-registry-ux-1'

const feldKlasse =
  'min-h-11 w-full max-w-full scroll-mt-32 rounded-2xl border border-line-200 bg-white px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'

const hauptAktion =
  'inline-flex min-h-11 w-full scroll-mt-32 items-center justify-center gap-2 whitespace-normal rounded-full bg-brand-800 px-5 py-2 text-center text-base font-semibold leading-tight text-white transition hover:-translate-y-0.5 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto'

const nebenAktion =
  'inline-flex min-h-11 w-full scroll-mt-32 items-center justify-center whitespace-normal rounded-full border border-line-200 bg-white px-4 py-2 text-center text-base font-semibold leading-tight text-brand-800 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto'

function travellerFelder(wert: unknown): { label: string; residenceCountryCode: string } {
  const felder = wert as { label?: string; residenceCountryCode?: string } | null
  return { label: felder?.label ?? '', residenceCountryCode: felder?.residenceCountryCode ?? '' }
}

export default function AccountReisende({
  problem,
  travellers,
}: {
  problem: Problem | null
  travellers: AccountRegistryTraveller[] | null
}) {
  const workflow = useAccountRegistryWorkflow({ problem, travellers })
  const [flaeche, setFlaeche] = useState<RegistryFlaeche>({ art: 'uebersicht' })
  const anlegenRef = useRef<HTMLButtonElement>(null)
  const anlegenOffen = flaeche.art === 'anlegen'
  const verwaltetId = registryVerwalteteId(flaeche)
  const klasse = registryListeKlasse({ problem, travellers })
  const anlegenSlot = workflow.stand.slots.find((slot) => slot.editor === 'anlegen')
  const formular = anlegenSlot?.offen ? travellerFelder(anlegenSlot.felder) : null
  const montierteFlaechen = new Set((travellers ?? []).map((traveller) => `reisender:${traveller.id}`))
  const belege =
    klasse === 'gueltig'
      ? workflow.stand.belege.filter(
          (beleg) => beleg.surface === 'anlegen' || !montierteFlaechen.has(beleg.surface),
        )
      : workflow.stand.belege

  function flaecheWechseln(naechster: RegistryFlaeche) {
    if (flaeche.art === 'verwalten' && (naechster.art !== 'verwalten' || naechster.travellerId !== flaeche.travellerId)) {
      workflow.surfaceSchliessen(`reisender:${flaeche.travellerId}`)
    }
    if (flaeche.art === 'anlegen' && naechster.art !== 'anlegen') workflow.schliessen('anlegen')
    if (naechster.art === 'anlegen' && flaeche.art !== 'anlegen') {
      workflow.oeffnen('anlegen', 'anlegen', { label: '', residenceCountryCode: '' })
    }
    setFlaeche(naechster)
  }

  function anlegen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    workflow.senden('anlegen')
  }

  return (
    <div
      data-registry-klasse={klasse}
      className="min-w-0 [&_*]:[overflow-wrap:anywhere] [&_input]:!text-base [&_select]:!text-base"
      aria-busy={workflow.stand.lesen.offen}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
        {REGISTRY_COPY.seitenEyebrow}
      </p>
      <h1 className="mt-2 text-balance break-words text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
        {REGISTRY_COPY.seitenTitel}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-700">{REGISTRY_COPY.seitenLead}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">{REGISTRY_COPY.dualAuthorityHinweis}</p>

      {klasse !== 'gueltig' ? (
        <section
          role="alert"
          className="mt-8 rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center sm:px-10"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-red-800">{REGISTRY_COPY.fehlerTitel}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-700">
            {problem?.status === 503 ? REGISTRY_COPY.fehler503 : REGISTRY_COPY.fehler500}
          </p>
          <button
            type="button"
            className={`${nebenAktion} mt-5`}
            disabled={workflow.stand.lesen.offen}
            onClick={workflow.lesen}
          >
            {REGISTRY_COPY.erneutLesen}
          </button>
          <p className="mt-2 text-sm text-red-800">{REGISTRY_COPY.erneutLesenHinweis}</p>
        </section>
      ) : null}

      <RegistryBelege stand={workflow.stand} belege={belege} erneut={workflow.erneut} lesen={workflow.lesen} />

      {klasse === 'gueltig' ? (
        <>
          <div className="mt-6">
            <button
              ref={anlegenRef}
              type="button"
              data-fokus="anlegen-knopf"
              aria-expanded={anlegenOffen}
              aria-controls="registry-anlegen"
              onClick={() => flaecheWechseln(registryFlaecheAnlegen(flaeche))}
              className={hauptAktion}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              {REGISTRY_COPY.reisendenHinzufuegen}
            </button>
          </div>

          {anlegenOffen && formular ? (
            <form
              id="registry-anlegen"
              data-registry-innen="anlegen"
              data-registry-editor="anlegen"
              data-registry-epoche={anlegenSlot?.epoche ?? 0}
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
                    onChange={(event) =>
                      workflow.setzen('anlegen', { ...formular, label: event.target.value })
                    }
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
                  onChange={(residenceCountryCode) => workflow.setzen('anlegen', { ...formular, residenceCountryCode })}
                />
              </div>
              {anlegenSlot?.hinweis ? (
                <p role="alert" className="mt-3 text-sm text-red-800">{anlegenSlot.hinweis}</p>
              ) : null}
              {anlegenSlot?.konflikt ? (
                <div className="mt-3 grid gap-2">
                  <p>{REGISTRY_COPY.konflikt}</p>
                  <button type="button" className={nebenAktion} onClick={() => workflow.uebernehmen('anlegen')}>
                    {REGISTRY_COPY.uebernehmen}
                  </button>
                </div>
              ) : null}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button type="submit" disabled={workflow.unterwegs('anlegen')} className={hauptAktion}>
                  <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {REGISTRY_COPY.anlegenAktion}
                </button>
                <button
                  type="button"
                  className={nebenAktion}
                  onClick={() => {
                    workflow.schliessen('anlegen')
                    setFlaeche({ art: 'uebersicht' })
                    anlegenRef.current?.focus()
                  }}
                >
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
            <ul className={verwaltetId ? 'mt-6 grid grid-cols-1 gap-4' : 'mt-6 grid grid-cols-1 gap-4 md:grid-cols-2'}>
              {travellers.map((traveller) => {
                const verwaltet = verwaltetId === traveller.id
                return (
                  <li key={traveller.id} className={verwaltet ? 'min-w-0 md:col-span-2' : 'min-w-0'}>
                    <AccountReisendeKarte
                      traveller={traveller}
                      verwaltet={verwaltet}
                      workflow={workflow}
                      onVerwalten={() => flaecheWechseln(registryFlaecheVerwalten(flaeche, traveller.id))}
                    />
                  </li>
                )
              })}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
