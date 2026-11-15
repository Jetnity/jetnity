import type { Route } from 'next'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Ticket } from 'lucide-react'

import BuchungenFilter from '@/components/account/BuchungenFilter'
import { buchungPlanpunktPfad, type KontoBuchung } from '@/lib/account/buchungen'
import { buchungenAnsichtAus, type BuchungenAnsicht } from '@/lib/account/buchungen-abfrage'
import type { Problem } from '@/lib/api/datenbank-lesen'
import { BUCHUNGEN_TEXTE, buchungenZeitAnzeigen } from '@/lib/localization/buchungen-texte'
import type { UiSprache } from '@/lib/localization/ui-sprache'

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
  'inline-flex min-h-11 w-full min-w-0 max-w-full flex-wrap items-center justify-center gap-2 whitespace-normal rounded-full px-5 text-center text-sm font-semibold [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto'

/** The route's loading presentation, without a second locale read. */
export function BuchungenLadeanzeige({ sprache }: { sprache: UiSprache }) {
  const texte = BUCHUNGEN_TEXTE[sprache]
  return (
    <main lang={sprache} className="min-w-0 px-4 py-10 [overflow-wrap:anywhere] sm:px-6 sm:py-14">
      <div className="mx-auto min-w-0 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{texte.seitenEyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">{texte.seitenTitel}</h1>
        <section aria-busy="true" aria-live="polite" className="mt-10 rounded-[30px] border border-black/5 bg-white px-6 py-14 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
            <Ticket className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-800">{texte.ladenTitel}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">{texte.ladenText}</p>
        </section>
      </div>
    </main>
  )
}

function BuchungsKarte({ buchung, sprache }: { buchung: KontoBuchung; sprache: UiSprache }) {
  const texte = BUCHUNGEN_TEXTE[sprache]
  const zeit = buchungenZeitAnzeigen(buchung, sprache)
  const planpunkt = buchungPlanpunktPfad(buchung.tripId, buchung.id)

  return (
    <article className="min-w-0 max-w-full rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] [overflow-wrap:anywhere] sm:p-6">
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
        <p className="min-w-0 max-w-full text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 [overflow-wrap:anywhere]">{sprache === 'de' ? buchung.artBezeichnung : texte[`art.${buchung.kind}`]}</p>
        {buchung.tripArchived ? (
          <p className="rounded-full bg-surface-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            {texte.archivKennzeichen}
          </p>
        ) : null}
      </div>
      <h2 className="mt-3 min-w-0 max-w-full break-words text-xl font-semibold tracking-[-0.03em] text-brand-800 [overflow-wrap:anywhere]">{buchung.title}</h2>
      {zeit ? <p className="mt-2 text-sm text-ink-800">{zeit}</p> : null}
      {buchung.tripTitle ? (
        <p className="mt-2 break-words text-sm text-ink-700">
          {texte.reiseBezug}: {buchung.tripTitle}
        </p>
      ) : null}
      {planpunkt ? (
        <Link
          href={planpunkt as Route}
          className={`${textLink} mt-5 gap-2 bg-brand-800 text-white transition hover:-translate-y-0.5 hover:bg-brand-900 motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
        >
          {texte.planpunktOeffnen}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
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
          ? 'mt-8 min-w-0 max-w-full rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center [overflow-wrap:anywhere] sm:px-10'
          : 'mt-8 min-w-0 max-w-full rounded-[26px] border border-dashed border-line-400 bg-white/65 px-6 py-10 text-center [overflow-wrap:anywhere] sm:px-10'
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
      <h2 className={`mt-5 min-w-0 max-w-full break-words text-xl font-semibold tracking-[-0.03em] [overflow-wrap:anywhere] ${rolle === 'alert' ? 'text-red-800' : 'text-brand-800'}`}>
        {titel}
      </h2>
      <p className={`mx-auto mt-3 min-w-0 max-w-full break-words text-sm leading-6 [overflow-wrap:anywhere] sm:max-w-md ${rolle === 'alert' ? 'text-red-700' : 'text-ink-700'}`}>
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

export default function AccountBuchungen(props: ({ ansicht: BuchungenAnsicht } | BuchungenAlt) & { sprache?: UiSprache }) {
  const sprache = props.sprache ?? 'de'
  const texte = BUCHUNGEN_TEXTE[sprache]
  const ansicht = 'ansicht' in props ? props.ansicht : ansichtAusAlt(props)
  const fehlerText = ansicht.fehlerStatus === 503 ? texte.fehler503 : texte.fehler500

  return (
    <div lang={sprache} className="min-w-0 max-w-full [overflow-wrap:anywhere]" data-buchungen={ansicht.zustand}>
      <p className="max-w-full text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 [overflow-wrap:anywhere]">{texte.seitenEyebrow}</p>
      <h1 className="mt-2 min-w-0 max-w-full break-words text-3xl font-semibold tracking-[-0.04em] text-brand-800 [overflow-wrap:anywhere] sm:text-5xl">{texte.seitenTitel}</h1>
      <p className="mt-3 max-w-full break-words text-sm leading-6 text-ink-700 [overflow-wrap:anywhere] sm:max-w-xl">{texte.seitenLead}</p>
      <p className="mt-2 max-w-full break-words text-sm leading-6 text-ink-700 [overflow-wrap:anywhere] sm:max-w-xl">{texte.hinweis}</p>
      <p className="mt-2 max-w-full break-words text-sm leading-6 text-ink-700 [overflow-wrap:anywhere] sm:max-w-xl">{texte.ordnungHinweis}</p>

      <BuchungenFilter
        titel={ansicht.titel}
        art={ansicht.art}
        archiv={ansicht.archiv}
        zurueckHref={ansicht.zurueckHref}
        standHref={ansicht.wiederholenHref}
        sprache={sprache}
      />

      {ansicht.zustand === 'ungueltig' ? (
        <Hinweis
          rolle="alert"
          titel={texte.ungueltigTitel}
          text={texte.ungueltigText}
          href={ansicht.ersteSeiteHref}
          aktion={texte.ersteSeite}
        />
      ) : null}
      {ansicht.zustand === 'fehler' ? (
        <Hinweis rolle="alert" titel={texte.fehlerTitel} text={fehlerText} href={ansicht.wiederholenHref} aktion={texte.wiederholen} />
      ) : null}
      {ansicht.zustand === 'leer' ? (
        <Hinweis rolle="status" titel={texte.leerTitel} text={texte.leerText} />
      ) : null}
      {ansicht.zustand === 'keine' ? (
        <Hinweis rolle="status" titel={texte.keineTrefferTitel} text={texte.keineTrefferText} />
      ) : null}
      {ansicht.zustand === 'fortsetzungLeer' ? (
        <Hinweis
          rolle="status"
          titel={texte.fortsetzungEndeTitel}
          text={texte.fortsetzungEndeText}
          href={ansicht.ersteSeiteHref}
          aktion={texte.ersteSeite}
        />
      ) : null}

      {ansicht.zustand === 'ungueltig' && ansicht.wiederholenZeigen ? (
        <p className="mt-4">
          <Link href={ansicht.wiederholenHref as Route} className={`${textLink} border border-line-200 bg-white text-brand-800`}>
            {texte.wiederholen}
          </Link>
        </p>
      ) : null}

      {ansicht.buchungen.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {ansicht.buchungen.map((buchung) => (
            <li key={buchung.id}>
              <BuchungsKarte buchung={buchung} sprache={sprache} />
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
            {texte.weitere}
          </Link>
        </p>
      ) : null}

      {ansicht.endeZeigen ? (
        <p role="status" className="mt-6 text-sm leading-6 text-ink-700">
          {texte.seitenEnde}
        </p>
      ) : null}

      {ansicht.ersteSeiteZeigen && ansicht.zustand === 'liste' ? (
        <p className="mt-4">
          <Link href={ansicht.ersteSeiteHref as Route} className={`${textLink} border border-line-200 bg-white text-brand-800`}>
            {texte.ersteSeite}
          </Link>
        </p>
      ) : null}
    </div>
  )
}
