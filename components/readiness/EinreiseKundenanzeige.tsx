'use client'

import { AlertCircle, Check, Circle, ChevronDown } from 'lucide-react'

import {
  EINREISE_PLATZHALTER,
  EINREISE_WEITERE_THEMEN,
  einreiseNachLand,
  type EinreiseAmpel,
  type EinreiseAnzeige,
  type EinreiseLandKarte,
  type EinreisePaar,
  type EinreiseThema,
} from '@/lib/readiness/einreise-kundenanzeige'
import { Hinweis } from '@/components/ui/hinweis'
import { cn } from '@/lib/utils'

function Ampel({ art, text }: { art: EinreiseAmpel; text: string }) {
  const Icon = art === 'gruen' ? Check : art === 'orange' ? AlertCircle : Circle
  return (
    <p
      className={cn(
        'inline-flex min-h-11 max-w-full items-center gap-2 rounded-full px-3 text-sm font-semibold leading-5',
        'border',
        art === 'gruen' && 'border-status-ok-line bg-status-ok-soft text-status-ok',
        art === 'orange' && 'border-status-achtung-line bg-status-achtung-soft text-status-achtung',
        art === 'neutral' && 'border-dashed border-status-neutral-line bg-status-neutral-soft text-status-neutral',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="break-words">{text}</span>
    </p>
  )
}

function ThemaZeile({ thema }: { thema: EinreiseThema }) {
  return (
    <li
      className="min-w-0 rounded-2xl border border-line-200 bg-white px-3 py-3"
      data-official-requirement-type={thema.requirementType ?? undefined}
      data-official-freshness={thema.freshness ?? undefined}
      data-official-status={thema.status ?? undefined}
      data-official-result={thema.result ?? undefined}
    >
      <p className="break-words text-sm font-semibold text-brand-800">{thema.label}</p>
      <p className="mt-1 break-words text-sm leading-6 text-ink-900">{thema.text}</p>
      {thema.bedingung ? <p className="mt-1 break-words text-xs leading-5 text-ink-800">Wenn: {thema.bedingung}</p> : null}
      {thema.timingTexte.map((text) => (
        <p key={text} className="mt-1 break-words text-xs leading-5 text-ink-800">{text}</p>
      ))}
      {thema.href && thema.hrefLabel ? (
        <a
          href={thema.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          {thema.hrefLabel}
        </a>
      ) : null}
      {thema.quelle ? (
        <p className="mt-2 break-words text-xs leading-5 text-ink-700">
          {thema.quelleHref ? (
            <a href={thema.quelleHref} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              {thema.quelle}
            </a>
          ) : thema.quelle}
          {thema.stand ? ` · Stand ${thema.stand}` : ''}
        </p>
      ) : null}
    </li>
  )
}

function PaarKarte({ paar }: { paar: EinreisePaar }) {
  return (
    <article
      className="min-w-0 rounded-2xl border border-line-200 bg-surface-25 px-3 py-3"
      data-einreise-land={paar.landCode || 'ohne'}
      data-einreise-ampel={paar.ampel}
      aria-label={`${paar.reisende}, ${paar.land}`}
    >
      <h5 className="break-words text-sm font-semibold text-brand-800">{paar.reisende}</h5>
      <p className="mt-0.5 break-words text-xs leading-5 text-ink-800">
        Pass: {paar.dokument} · Ziel: {paar.land}
      </p>
      <div className="mt-3">
        <Ampel art={paar.ampel} text={paar.ampelText} />
      </div>
      <PaarInhalt paar={paar} />
    </article>
  )
}

function LandKarte({ karte }: { karte: EinreiseLandKarte }) {
  const einzeln = karte.paare.length === 1 ? karte.paare[0]! : null
  const erste = karte.paare[0]!
  return (
    <article
      className="min-w-0 rounded-2xl border border-line-200 bg-surface-25 px-3 py-3"
      data-einreise-land={karte.landCode || 'ohne'}
      data-einreise-ampel={karte.ampel}
      data-einreise-eintraege={karte.paare.length}
      data-einreise-einheitlich={karte.einheitlich ? 'ja' : 'nein'}
      aria-label={karte.land}
    >
      <h5 className="break-words text-sm font-semibold text-brand-800">{karte.land}</h5>
      <p className="mt-0.5 break-words text-xs leading-5 text-ink-800">
        {einzeln
          ? `${einzeln.reisende} · Pass: ${einzeln.dokument}`
          : karte.einheitlich
            ? `Gleiche Angabe für alle ${karte.paare.length} Einträge (Person und Pass)`
            : 'Die Angaben unterscheiden sich je Person oder Pass. Details stehen darunter.'}
      </p>
      <div className="mt-3">
        <Ampel art={karte.ampel} text={karte.ampelText} />
      </div>
      {karte.einheitlich ? <PaarInhalt paar={erste} /> : null}
      {einzeln ? null : (
        <details open={!karte.einheitlich} className="mt-3 rounded-2xl border border-line-200 bg-white" data-einreise-je-person>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 [&::-webkit-details-marker]:hidden">
            Je Person und Pass ({karte.paare.length})
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
          </summary>
          <ul className="grid gap-2 border-t border-line-200 px-3 py-3">
            {karte.paare.map((paar) => (
              <li key={paar.id} className="min-w-0" data-einreise-person-ampel={paar.ampel}>
                <p className="break-words text-sm font-semibold text-brand-800">{paar.reisende}</p>
                <p className="break-words text-xs leading-5 text-ink-800">Pass: {paar.dokument}</p>
                {karte.einheitlich ? null : (
                  <>
                    <div className="mt-2">
                      <Ampel art={paar.ampel} text={paar.ampelText} />
                    </div>
                    <PaarInhalt paar={paar} />
                  </>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  )
}

function PaarInhalt({ paar }: { paar: EinreisePaar }) {
  return (
    <>
      {paar.antragHref && paar.antragLabel ? (
        <a
          href={paar.antragHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          {paar.antragLabel}
        </a>
      ) : null}
      {paar.themen.length > 0 ? (
        <ul className="mt-3 grid gap-2" data-official-group="bestaetigt">
          {paar.themen.map((thema) => <ThemaZeile key={thema.id} thema={thema} />)}
        </ul>
      ) : null}
      {paar.ungeprueft.length > 0 ? (
        <details className="mt-3 rounded-2xl border border-line-200 bg-white">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 [&::-webkit-details-marker]:hidden">
            {EINREISE_WEITERE_THEMEN}
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
          </summary>
          <div className="border-t border-line-200 px-3 py-3">
            <p className="max-w-prose text-sm leading-6 text-ink-900">
              {paar.platzhalter ? `${EINREISE_PLATZHALTER}. ` : ''}
              Für diese Themen liegt derzeit keine geprüfte Angabe vor.
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {paar.ungeprueft.map((name) => (
                <li key={name} className="rounded-full bg-surface-50 px-3 py-1 text-xs leading-5 text-ink-800">{name}</li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}
    </>
  )
}

export default function EinreiseKundenanzeige({
  anzeige,
  satzZeigen = true,
  nachLand = false,
}: {
  anzeige: EinreiseAnzeige
  /** Aus, wo die Zusammenfassung schon direkt darüber steht. */
  satzZeigen?: boolean
  /** Eine Karte pro Land statt pro Person, Pass und Land (Reisevorbereitung). */
  nachLand?: boolean
}) {
  const todos = anzeige.paare.flatMap((paar) => paar.todos.map((todo) => ({ paar, todo })))
  return (
    <div className="grid min-w-0 gap-3" data-einreise-kundenanzeige="ein">
      {satzZeigen ? <p className="break-words text-sm leading-6 text-ink-900">{anzeige.satz}</p> : null}
      {todos.length > 0 ? (
        <ul className="grid gap-2">
          {todos.map(({ paar, todo }) => (
            <li key={`${paar.id}:${todo.id}`} className="min-w-0">
              <Hinweis
                ton="aufgabe"
                titel={`${paar.reisende} · ${paar.land}: ${todo.label}`}
                aktion={
                  todo.href && todo.hrefLabel ? (
                    <a
                      href={todo.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                    >
                      {todo.hrefLabel}
                    </a>
                  ) : null
                }
              >
                <p>{todo.text}</p>
              </Hinweis>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-3">
        {nachLand
          ? einreiseNachLand(anzeige).map((karte) => <LandKarte key={karte.id} karte={karte} />)
          : anzeige.paare.map((paar) => <PaarKarte key={paar.id} paar={paar} />)}
      </div>
      <p className="max-w-prose break-words text-xs leading-5 text-ink-800">{anzeige.standSatz}</p>
    </div>
  )
}
