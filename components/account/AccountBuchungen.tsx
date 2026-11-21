import type { Route } from 'next'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Ticket } from 'lucide-react'

import BuchungenFilter from '@/components/account/BuchungenFilter'
import { Karte } from '@/components/ui/karte'
import { Ladeplatzhalter } from '@/components/ui/ladeplatzhalter'
import { Leerzustand } from '@/components/ui/leerzustand'
import { Seitenkopf } from '@/components/ui/seitenkopf'
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

function Kopf({ sprache }: { sprache: UiSprache }) {
  const texte = BUCHUNGEN_TEXTE[sprache]
  return (
    <Seitenkopf kicker={texte.seitenEyebrow} titel={texte.seitenTitel}>
      <p>{texte.seitenLead}</p>
      <p className="mt-2 text-meta">{texte.hinweis}</p>
    </Seitenkopf>
  )
}

/** The route's loading presentation, without a second locale read. */
export function BuchungenLadeanzeige({ sprache }: { sprache: UiSprache }) {
  return (
    <main lang={sprache} className="min-w-0 px-4 py-10 [overflow-wrap:anywhere] sm:px-6 sm:py-14">
      <div className="mx-auto min-w-0 max-w-3xl">
        <Kopf sprache={sprache} />
        <Ladeplatzhalter sichtbar status={BUCHUNGEN_TEXTE[sprache].ladenTitel} className="mt-8" />
      </div>
    </main>
  )
}

function BuchungsKarte({ buchung, sprache }: { buchung: KontoBuchung; sprache: UiSprache }) {
  const texte = BUCHUNGEN_TEXTE[sprache]
  const zeit = buchungenZeitAnzeigen(buchung, sprache)
  const planpunkt = buchungPlanpunktPfad(buchung.tripId, buchung.id)

  return (
    <Karte as="article" className="p-5 [overflow-wrap:anywhere] sm:p-6">
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
        <p className="min-w-0 max-w-full text-kicker uppercase text-brand-600 [overflow-wrap:anywhere]">{sprache === 'de' ? buchung.artBezeichnung : texte[`art.${buchung.kind}`]}</p>
        {buchung.tripArchived ? (
          <p className="rounded-full bg-surface-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            {texte.archivKennzeichen}
          </p>
        ) : null}
      </div>
      <h2 className="mt-2 min-w-0 max-w-full break-words text-subtitle text-foreground [overflow-wrap:anywhere]">{buchung.title}</h2>
      {zeit ? <p className="mt-2 text-meta text-foreground">{zeit}</p> : null}
      {buchung.tripTitle ? (
        <p className="mt-1 break-words text-meta text-muted-foreground">
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
    </Karte>
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
          ? 'mt-8 min-w-0 max-w-full rounded-panel border border-destructive/40 bg-card px-6 py-10 text-center [overflow-wrap:anywhere] sm:px-10'
          : 'mt-8 min-w-0 max-w-full rounded-panel border border-dashed border-border bg-card px-6 py-10 text-center [overflow-wrap:anywhere] sm:px-10'
      }
    >
      {rolle === 'alert' ? (
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-destructive">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
        </span>
      ) : (
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
          <Ticket className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <h2 className="mt-5 min-w-0 max-w-full break-words text-title text-foreground [overflow-wrap:anywhere]">
        {titel}
      </h2>
      <p className="mx-auto mt-3 min-w-0 max-w-full break-words text-body text-muted-foreground [overflow-wrap:anywhere] sm:max-w-md">
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
      <Kopf sprache={sprache} />

      {ansicht.zustand === 'leer' ? null : (
        <BuchungenFilter
          titel={ansicht.titel}
          art={ansicht.art}
          archiv={ansicht.archiv}
          zurueckHref={ansicht.zurueckHref}
          standHref={ansicht.wiederholenHref}
          sprache={sprache}
        />
      )}

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
        <div role="status" className="mt-8">
          <Leerzustand
            symbol={Ticket}
            titel={texte.leerTitel}
            aktion={
              <Link href="/reisen" className={`${textLink} bg-brand-800 text-white hover:bg-brand-900`}>
                {texte.leerAktion}
              </Link>
            }
          >
            {texte.leerText}
          </Leerzustand>
        </div>
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
        <p className="mt-8 text-meta text-muted-foreground">{texte.ordnungHinweis}</p>
      ) : null}
      {ansicht.buchungen.length > 0 ? (
        <ul className="mt-3 space-y-4">
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
        <p role="status" className="mt-6 text-meta text-muted-foreground">
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
