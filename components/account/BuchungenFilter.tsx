import type { Route } from 'next'
import Link from 'next/link'

import { BUCHUNGEN_TITEL_MAX, buchbareBuchungsarten, type BuchungenArchiv } from '@/lib/account/buchungen-abfrage'
import { BUCHUNGEN_COPY } from '@/lib/account/buchungen'
import { ART_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'

const feld =
  'min-h-11 w-full rounded-2xl border border-line-200 bg-white px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'

const knopf =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto'

export default function BuchungenFilter({
  titel,
  art,
  archiv,
  zurueckHref,
}: {
  titel: string
  art: string
  archiv: BuchungenArchiv
  zurueckHref: string | null
}) {
  return (
    <form method="get" action="/account/bookings" className="mt-8">
      <fieldset className="min-w-0 rounded-[26px] border border-black/5 bg-white p-4 sm:p-5">
        <legend className="px-1 text-sm font-semibold text-brand-800">{BUCHUNGEN_COPY.filterLegende}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800 sm:col-span-2">
            {BUCHUNGEN_COPY.titelLabel}
            <input
              type="search"
              name="titel"
              defaultValue={titel}
              maxLength={BUCHUNGEN_TITEL_MAX}
              autoComplete="off"
              className={feld}
            />
          </label>
          <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">
            {BUCHUNGEN_COPY.artLabel}
            <select name="art" defaultValue={art} className={feld}>
              <option value="">{BUCHUNGEN_COPY.artAlle}</option>
              {buchbareBuchungsarten().map((kind) => (
                <option key={kind} value={kind}>
                  {ART_BEZEICHNUNG[kind]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid min-w-0 gap-1 text-sm font-medium text-brand-800">
            {BUCHUNGEN_COPY.archivLabel}
            <select name="archiv" defaultValue={archiv} className={feld}>
              <option value="alle">{BUCHUNGEN_COPY.archivAlle}</option>
              <option value="aktiv">{BUCHUNGEN_COPY.archivAktiv}</option>
              <option value="archiviert">{BUCHUNGEN_COPY.archivArchiviert}</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className={`${knopf} bg-brand-800 text-white transition hover:-translate-y-0.5 hover:bg-brand-900 motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
          >
            {BUCHUNGEN_COPY.suchen}
          </button>
          {zurueckHref ? (
            <Link href={zurueckHref as Route} className={`${knopf} border border-line-200 bg-white text-brand-800 hover:bg-surface-50`}>
              {BUCHUNGEN_COPY.zuruecksetzen}
            </Link>
          ) : null}
        </div>
      </fieldset>
    </form>
  )
}
