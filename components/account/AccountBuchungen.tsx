import type { Route } from 'next'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Ticket } from 'lucide-react'

import BuchungenFilter from '@/components/account/BuchungenFilter'
import { BUCHUNGEN_COPY, buchungPlanpunktPfad, buchungZeittext, type KontoBuchung } from '@/lib/account/buchungen'
import { buchungenAnsichtAus, type BuchungenAnsicht } from '@/lib/account/buchungen-abfrage'
import type { Problem } from '@/lib/api/datenbank-lesen'

type BuchungenAlt = {
  problem: Problem | null
  buchungen: readonly KontoBuchung[] | null
  abgeschnitten: boolean
}

function ansichtAusAlt(alt: BuchungenAlt): BuchungenAnsicht {
  const filter = { titel: null, art: null, archiv: 'alle' as const }
  if (alt.problem) {
    return buchungenAnsichtAus({
      ok: false,
      grund: 'lesen',
      status: alt.problem.status,
      filter,
      ersteSeite: '/account/bookings',
      wiederholen: '/account/bookings',
    })
  }
  return buchungenAnsichtAus({
    ok: true,
    filter,
    fortsetzung: false,
    buchungen: alt.buchungen ?? [],
    weiter: null,
    ersteSeite: '/account/bookings',
    wiederholen: '/account/bookings',
  })
}

const textLink =
  'inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'

function BuchungsKarte({ buchung }: { buchung: KontoBuchung }) {
  const zeit = buchungZeittext(buchung)
  const planpunkt = buchungPlanpunktPfad(buchung.tripId, buchung.id)

  return (
    <article className="min-w-0 rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">{buchung.artBezeichnung}</p>
        {buchung.tripArchived ? (
          <p className="rounded-full bg-surface-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            {BUCHUNGEN_COPY.archivKennzeichen}
          </p>
        ) : null}
      </div>
      <h2 className="mt-3 break-words text-xl font-semibold tracking-[-0.03em] text-brand-800">{buchung.title}</h2>
      {zeit ? <p className="mt-2 text-sm text-ink-800">{zeit}</p> : null}
      {buchung.tripTitle ? (
        <p className="mt-2 break-words text-sm text-ink-700">
          {BUCHUNGEN_COPY.reiseBezug}: {buchung.tripTitle}
        </p>
      ) : null}
      {planpunkt ? (
        <Link
          href={planpunkt as Route}
          className={`${textLink} mt-5 gap-2 bg-brand-800 text-white transition hover:-translate-y-0.5 hover:bg-brand-900 motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
        >
          {BUCHUNGEN_COPY.planpunktOeffnen}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </article>
  )
}

function Hinweis({
  rolle,
  titel,
  text,
  href,
  aktion,
}: {
  rolle: 'alert' | 'status'
  titel: string
  text: string
  href?: string
  aktion?: string
}) {
  return (
    <section
      role={rolle}
      className={
        rolle === 'alert'
          ? 'mt-8 rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center sm:px-10'
          : 'mt-8 rounded-[26px] border border-dashed border-line-400 bg-white/65 px-6 py-10 text-center sm:px-10'
      }
    >
      {rolle === 'alert' ? (
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : (
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
          <Ticket className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <h2 className={`mt-5 text-xl font-semibold tracking-[-0.03em] ${rolle === 'alert' ? 'text-red-800' : 'text-brand-800'}`}>
        {titel}
      </h2>
      <p className={`mx-auto mt-3 max-w-md text-sm leading-6 ${rolle === 'alert' ? 'text-red-700' : 'text-ink-700'}`}>
        {text}
      </p>
      {href && aktion ? (
        <Link href={href as Route} className={`${textLink} mt-5 border border-line-200 bg-white text-brand-800`}>
          {aktion}
        </Link>
      ) : null}
    </section>
  )
}

export default function AccountBuchungen(props: { ansicht: BuchungenAnsicht } | BuchungenAlt) {
  const ansicht = 'ansicht' in props ? props.ansicht : ansichtAusAlt(props)
  const fehlerText = ansicht.fehlerStatus === 503 ? BUCHUNGEN_COPY.fehler503 : BUCHUNGEN_COPY.fehler500

  return (
    <div className="min-w-0" data-buchungen={ansicht.zustand}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{BUCHUNGEN_COPY.seitenEyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">{BUCHUNGEN_COPY.seitenTitel}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-700">{BUCHUNGEN_COPY.seitenLead}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">{BUCHUNGEN_COPY.hinweis}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">{BUCHUNGEN_COPY.ordnungHinweis}</p>

      <BuchungenFilter
        titel={ansicht.titel}
        art={ansicht.art}
        archiv={ansicht.archiv}
        zurueckHref={ansicht.zurueckHref}
        standHref={ansicht.wiederholenHref}
      />

      {ansicht.zustand === 'ungueltig' ? (
        <Hinweis
          rolle="alert"
          titel={BUCHUNGEN_COPY.ungueltigTitel}
          text={BUCHUNGEN_COPY.ungueltigText}
          href={ansicht.ersteSeiteHref}
          aktion={BUCHUNGEN_COPY.ersteSeite}
        />
      ) : null}
      {ansicht.zustand === 'fehler' ? (
        <Hinweis rolle="alert" titel={BUCHUNGEN_COPY.fehlerTitel} text={fehlerText} href={ansicht.wiederholenHref} aktion={BUCHUNGEN_COPY.wiederholen} />
      ) : null}
      {ansicht.zustand === 'leer' ? (
        <Hinweis rolle="status" titel={BUCHUNGEN_COPY.leerTitel} text={BUCHUNGEN_COPY.leerText} />
      ) : null}
      {ansicht.zustand === 'keine' ? (
        <Hinweis rolle="status" titel={BUCHUNGEN_COPY.keineTrefferTitel} text={BUCHUNGEN_COPY.keineTrefferText} />
      ) : null}
      {ansicht.zustand === 'fortsetzungLeer' ? (
        <Hinweis
          rolle="status"
          titel={BUCHUNGEN_COPY.fortsetzungEndeTitel}
          text={BUCHUNGEN_COPY.fortsetzungEndeText}
          href={ansicht.ersteSeiteHref}
          aktion={BUCHUNGEN_COPY.ersteSeite}
        />
      ) : null}

      {ansicht.zustand === 'ungueltig' && ansicht.wiederholenZeigen ? (
        <p className="mt-4">
          <Link href={ansicht.wiederholenHref as Route} className={`${textLink} border border-line-200 bg-white text-brand-800`}>
            {BUCHUNGEN_COPY.wiederholen}
          </Link>
        </p>
      ) : null}

      {ansicht.buchungen.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {ansicht.buchungen.map((buchung) => (
            <li key={buchung.id}>
              <BuchungsKarte buchung={buchung} />
            </li>
          ))}
        </ul>
      ) : null}

      {ansicht.weiterHref ? (
        <p className="mt-6">
          <Link
            href={ansicht.weiterHref as Route}
            className={`${textLink} bg-brand-800 text-white transition hover:-translate-y-0.5 hover:bg-brand-900 motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
          >
            {BUCHUNGEN_COPY.weitere}
          </Link>
        </p>
      ) : null}

      {ansicht.endeZeigen ? (
        <p role="status" className="mt-6 text-sm leading-6 text-ink-700">
          {BUCHUNGEN_COPY.seitenEnde}
        </p>
      ) : null}

      {ansicht.ersteSeiteZeigen && ansicht.zustand === 'liste' ? (
        <p className="mt-4">
          <Link href={ansicht.ersteSeiteHref as Route} className={`${textLink} border border-line-200 bg-white text-brand-800`}>
            {BUCHUNGEN_COPY.ersteSeite}
          </Link>
        </p>
      ) : null}
    </div>
  )
}
