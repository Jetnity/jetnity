import type { Route } from 'next'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Ticket } from 'lucide-react'

import {
  BUCHUNGEN_COPY,
  buchungReisePfad,
  buchungZeittext,
  buchungenGruppenAus,
  type KontoBuchung,
} from '@/lib/account/buchungen'
import type { Problem } from '@/lib/api/datenbank-lesen'

function BuchungsKarte({
  buchung,
  ueberschrift: Ueberschrift = 'h3',
}: {
  buchung: KontoBuchung
  ueberschrift?: 'h2' | 'h3'
}) {
  const zeit = buchungZeittext(buchung)
  const reisePfad = buchungReisePfad(buchung.tripId)

  return (
    <article className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          {buchung.artBezeichnung}
        </p>
        {buchung.tripArchived ? (
          <p className="rounded-full bg-surface-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            {BUCHUNGEN_COPY.archivKennzeichen}
          </p>
        ) : null}
      </div>
      <Ueberschrift className="mt-3 text-xl font-semibold tracking-[-0.03em] text-brand-800">
        {buchung.title}
      </Ueberschrift>
      {zeit ? <p className="mt-2 text-sm text-ink-800">{zeit}</p> : null}
      {buchung.tripTitle ? (
        <p className="mt-2 text-sm text-ink-700">
          {BUCHUNGEN_COPY.reiseBezug}: {buchung.tripTitle}
        </p>
      ) : null}
      <Link
        href={reisePfad as Route}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
      >
        {BUCHUNGEN_COPY.reiseOeffnen}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  )
}

function BuchungsListe({
  buchungen,
  titel,
  hinweis,
}: {
  buchungen: readonly KontoBuchung[]
  titel: string
  hinweis?: string
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-[-0.03em] text-brand-800">{titel}</h2>
      {hinweis ? <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">{hinweis}</p> : null}
      <ul className="mt-4 space-y-4">
        {buchungen.map((buchung) => (
          <li key={buchung.id}>
            <BuchungsKarte buchung={buchung} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function AccountBuchungen({
  problem,
  buchungen,
  abgeschnitten,
}: {
  problem: Problem | null
  buchungen: readonly KontoBuchung[] | null
  abgeschnitten: boolean
}) {
  const gruppen = buchungen ? buchungenGruppenAus(buchungen) : null
  const beideGruppen = Boolean(gruppen && gruppen.aktuell.length > 0 && gruppen.archiviert.length > 0)

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
        {BUCHUNGEN_COPY.seitenEyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
        {BUCHUNGEN_COPY.seitenTitel}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-700">{BUCHUNGEN_COPY.seitenLead}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">{BUCHUNGEN_COPY.hinweis}</p>

      {abgeschnitten && !problem ? (
        <section
          role="status"
          className="mt-8 rounded-2xl border border-brand-100 bg-surface-50 px-4 py-3 text-sm text-brand-800"
        >
          <p className="font-semibold">{BUCHUNGEN_COPY.abgeschnittenTitel}</p>
          <p className="mt-1 leading-6">{BUCHUNGEN_COPY.abgeschnittenText}</p>
        </section>
      ) : null}

      {problem ? (
        <section
          role="alert"
          className="mt-10 rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center sm:px-10"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-red-800">{BUCHUNGEN_COPY.fehlerTitel}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-700">
            {problem.status === 503 ? BUCHUNGEN_COPY.fehler503 : BUCHUNGEN_COPY.fehler500}
          </p>
        </section>
      ) : buchungen && buchungen.length === 0 ? (
        <section className="mt-10 rounded-[30px] border border-dashed border-line-400 bg-white/65 px-6 py-14 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
            <Ticket className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-800">
            {BUCHUNGEN_COPY.leerTitel}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">{BUCHUNGEN_COPY.leerText}</p>
        </section>
      ) : gruppen ? (
        <>
          {gruppen.aktuell.length > 0 ? (
            beideGruppen ? (
              <BuchungsListe buchungen={gruppen.aktuell} titel={BUCHUNGEN_COPY.offenGruppe} />
            ) : (
              <ul className="mt-10 space-y-4">
                {gruppen.aktuell.map((buchung) => (
                  <li key={buchung.id}>
                    <BuchungsKarte buchung={buchung} ueberschrift="h2" />
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {gruppen.archiviert.length > 0 ? (
            <BuchungsListe
              buchungen={gruppen.archiviert}
              titel={BUCHUNGEN_COPY.archivGruppe}
              hinweis={BUCHUNGEN_COPY.archivHinweis}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
