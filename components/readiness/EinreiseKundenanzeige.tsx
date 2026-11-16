'use client'

import { AlertCircle, Check, Circle, ChevronDown } from 'lucide-react'

import {
  EINREISE_PLATZHALTER,
  EINREISE_WEITERE_THEMEN,
  type EinreiseAmpel,
  type EinreiseAnzeige,
  type EinreisePaar,
  type EinreiseThema,
} from '@/lib/readiness/einreise-kundenanzeige'
import { cn } from '@/lib/utils'

function Ampel({ art, text }: { art: EinreiseAmpel; text: string }) {
  const Icon = art === 'gruen' ? Check : art === 'orange' ? AlertCircle : Circle
  return (
    <p
      className={cn(
        'inline-flex min-h-11 max-w-full items-center gap-2 rounded-full px-3 text-sm font-semibold leading-5',
        art === 'gruen' && 'bg-surface-100 text-brand-800',
        art === 'orange' && 'bg-amber-100 text-amber-950',
        art === 'neutral' && 'bg-surface-50 text-ink-900',
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
            <p className="text-sm leading-6 text-ink-900">
              {paar.platzhalter ? `${EINREISE_PLATZHALTER}. ` : ''}
              Für diese Themen gilt derzeit nicht verfügbar.
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {paar.ungeprueft.map((name) => (
                <li key={name} className="rounded-full bg-surface-50 px-3 py-1 text-xs leading-5 text-ink-800">{name}</li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}
    </article>
  )
}

export default function EinreiseKundenanzeige({ anzeige }: { anzeige: EinreiseAnzeige }) {
  const todos = anzeige.paare.flatMap((paar) => paar.todos.map((todo) => ({ paar, todo })))
  return (
    <div className="grid min-w-0 gap-3" data-einreise-kundenanzeige="ein">
      <p className="break-words text-sm leading-6 text-ink-900">{anzeige.satz}</p>
      {todos.length > 0 ? (
        <ul className="grid gap-2">
          {todos.map(({ paar, todo }) => (
            <li key={`${paar.id}:${todo.id}`} className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
              <p className="break-words text-sm font-semibold text-amber-950">
                {paar.reisende} · {paar.land}: {todo.label}
              </p>
              <p className="mt-1 break-words text-sm leading-6 text-amber-950">{todo.text}</p>
              {todo.href && todo.hrefLabel ? (
                <a
                  href={todo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                >
                  {todo.hrefLabel}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-3">
        {anzeige.paare.map((paar) => <PaarKarte key={paar.id} paar={paar} />)}
      </div>
      <p className="break-words text-xs leading-5 text-ink-800">{anzeige.standSatz}</p>
    </div>
  )
}
