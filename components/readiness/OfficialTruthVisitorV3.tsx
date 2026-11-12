'use client'

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import LandFeld from '@/components/country/LandFeld'
import { landAnzeigeText } from '@/lib/country/darstellung'
import { istKatalogLand } from '@/lib/country/katalog'
import type { V3VisitorInput } from '@/lib/readiness/official-truth-product-v3/contract'
import { createV3VisitorController, unboundV3VisitorLoad,
  type V3VisitorLoad, type V3VisitorUiState } from '@/lib/readiness/official-truth-product-v3/visitor/controller'
import type { V3VisitorViewResult } from '@/lib/readiness/official-truth-product-v3/visitor/presentation'

const secondary = 'min-h-11 min-w-0 max-w-full whitespace-normal rounded-full border border-border px-[min(1rem,4vw)] py-2 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4'

function Result({ result }: { result: V3VisitorViewResult }) {
  if (result.status !== 'accepted') return <article className="min-w-0 space-y-2 rounded-2xl border border-border bg-muted px-[min(1.25rem,4vw)] py-5 sm:p-5">
    <h4 className="font-semibold text-foreground">{result.title}</h4>
    <p className="text-sm leading-6 text-ink-950">{result.message}</p>
  </article>
  return <article className="min-w-0 space-y-4 rounded-2xl border border-border bg-card px-[min(1.25rem,4vw)] py-5 sm:p-5">
    <h4 className="text-lg font-semibold tracking-tight text-foreground">{result.title}</h4>
    <ul className="space-y-3 text-ink-950">
      {result.statements.map((item, index) => <li key={index} className="min-w-0">
        {item.when ? <p className="mb-1 text-sm leading-6">Wenn: {item.when}</p> : null}
        {item.href ? <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 min-w-0 max-w-full items-center font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{item.text}</a>
          : <p className="font-medium leading-6">{item.text}</p>}
      </li>)}
    </ul>
    <div className="rounded-xl bg-surface-50 px-[min(1rem,3vw)] py-4 sm:px-4">
      <p className="mb-2 text-sm font-semibold text-foreground">Diese Bedingungen gelten</p>
      <ul className="list-disc space-y-1 pl-[min(1.25rem,6vw)] text-sm leading-6 text-ink-950 sm:pl-5">
        {result.conditions.map((text, index) => <li key={index}>{text}</li>)}
      </ul>
    </div>
    <footer className="min-w-0 border-t border-border pt-3 text-sm leading-6 text-ink-950">
      <p>{result.checkedAtText}</p>
      <p>{result.validityText} · Regelversion {result.ruleVersion}</p>
      <a href={result.source.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 min-w-0 max-w-full items-center font-medium text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Amtliche Quelle: {result.source.label}
      </a>
    </footer>
  </article>
}

/**
 * Client display. A client-owned transport may supply query;
 * this file imports no server ports, registry, credentials or proof machinery.
 */
export default function OfficialTruthVisitorV3({ query = unboundV3VisitorLoad, initialInput, mode }: {
  query?: V3VisitorLoad; initialInput?: V3VisitorInput; mode?: 'ch-de-visa'
}) {
  const fixedChDe = mode === 'ch-de-visa'
  const ResultHeading = fixedChDe ? 'h2' : 'h3'
  const id = useId()
  const [destination, setDestination] = useState(initialInput?.destinationCountryCode ?? '')
  const [citizenships, setCitizenships] = useState<string[]>(initialInput ? [...initialInput.citizenshipCountryCodes] : [''])
  const [state, setState] = useState<V3VisitorUiState>({ phase: 'idle', view: null, message: null })
  const heading = useRef<HTMLHeadingElement>(null)
  const controller = useMemo(() => createV3VisitorController(query, setState), [query])
  useEffect(() => () => controller.dispose(), [controller])
  useEffect(() => {
    if ((state.phase === 'ready' || state.phase === 'error') && state.focusResult) heading.current?.focus()
  }, [state])
  const selected = [...new Set(citizenships.filter(istKatalogLand))].sort()
  const valid = fixedChDe || (istKatalogLand(destination) && selected.length > 0 && citizenships.every((country) => istKatalogLand(country)) && citizenships.length <= 5)
  const changed = (action: () => void) => { controller.invalidate(); action() }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valid) return
    void controller.submit(fixedChDe ? { destinationCountryCode: 'DE', citizenshipCountryCodes: ['CH'] }
      : { destinationCountryCode: destination, citizenshipCountryCodes: selected })
  }
  return <section className="mx-auto grid w-full min-w-0 max-w-4xl grid-cols-1 gap-6 text-foreground [overflow-wrap:anywhere]" aria-labelledby={`${id}-title`}>
    <header className="min-w-0 space-y-3">
      <p className="text-sm font-medium text-brand-600">Einreise vorbereiten</p>
      {fixedChDe ? <h1 id={`${id}-title`} className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Visum für Deutschland</h1>
        : <h2 id={`${id}-title`} className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Einreisebestimmungen</h2>}
      <p className="max-w-2xl text-base leading-7 text-ink-950">{fixedChDe
        ? 'Amtliche Angaben zur Visumpflicht für Schweizer Staatsangehörige mit Schweizer Reisepass bei direkter Einreise nach Deutschland.'
        : 'Wähle dein Zielland und deine Staatsangehörigkeiten. Du erhältst die Angaben für jede Staatsangehörigkeit getrennt, mit ihren Bedingungen und amtlichen Quellen.'}</p>
    </header>
    <form onSubmit={submit} noValidate className="grid min-w-0 grid-cols-1 gap-5 rounded-3xl border border-border bg-card px-[min(1.25rem,4vw)] py-5 sm:p-8">
      {fixedChDe ? <dl className="grid min-w-0 grid-cols-1 gap-4 text-sm leading-6 sm:grid-cols-2">
        <div><dt className="font-medium">Zielland</dt><dd>Deutschland</dd></div>
        <div><dt className="font-medium">Staatsangehörigkeit</dt><dd>Schweiz</dd></div>
        <div><dt className="font-medium">Reisedokument</dt><dd>Schweizer Reisepass</dd></div>
        <div><dt className="font-medium">Einreise</dt><dd>Direkte Einreise nach Deutschland</dd></div>
      </dl> : <>
      <LandFeld id={`${id}-destination`} label="Zielland" value={destination} optional={false} searchable={false}
        onChange={(country) => changed(() => setDestination(country))} />
      <fieldset className="grid min-w-0 grid-cols-1 gap-3" aria-describedby={`${id}-citizenship-help`}>
        <legend className="mb-3 min-w-0 max-w-full text-base font-semibold">Staatsangehörigkeiten</legend>
        {citizenships.map((country, index) => <div key={index} className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <LandFeld id={`${id}-citizenship-${index}`} label={`Staatsangehörigkeit ${index + 1}`} value={country} optional={false} searchable={false}
            onChange={(value) => changed(() => setCitizenships((items) => items.map((item, at) => at === index ? value : item)))} />
          {citizenships.length > 1 ? <button type="button" className={secondary} aria-label={`Staatsangehörigkeit ${index + 1} entfernen`}
            onClick={() => changed(() => setCitizenships((items) => items.filter((_, at) => at !== index)))}>Entfernen</button> : null}
        </div>)}
        <p id={`${id}-citizenship-help`} className="text-sm leading-6 text-ink-950">Bis zu fünf Staatsangehörigkeiten. Du brauchst keine Passnummer und kein Dokument hochzuladen.</p>
        {citizenships.length < 5 ? <button type="button" className={`${secondary} justify-self-start`}
          onClick={() => changed(() => setCitizenships((items) => [...items, '']))}>Weitere Staatsangehörigkeit</button> : null}
      </fieldset>
      </>}
      <div className="min-w-0 space-y-2 border-t border-border pt-5">
        <button type="submit" disabled={!valid || state.phase === 'loading'} aria-describedby={!valid ? `${id}-selection-help` : undefined}
          className="min-h-11 w-full min-w-0 max-w-full whitespace-normal rounded-full bg-primary px-[min(1.25rem,4vw)] py-3 font-semibold text-primary-foreground transition-colors hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5">
          {state.phase === 'loading' ? 'Angaben werden geladen …' : fixedChDe ? 'Visumangaben anzeigen' : 'Einreisebestimmungen anzeigen'}
        </button>
        {!valid ? <p id={`${id}-selection-help`} className="text-sm leading-6 text-ink-950">Bitte wähle ein Zielland und in jedem Feld eine Staatsangehörigkeit.</p> : null}
      </div>
    </form>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {state.phase === 'loading' ? 'Einreisebestimmungen werden geladen.' : state.phase === 'ready'
        ? state.message ?? `Ergebnisse für ${state.view.cells.length} Staatsangehörigkeiten geladen.` : state.phase === 'error' ? state.message : ''}
    </p>
    {state.phase === 'loading' ? <p className="rounded-2xl bg-muted px-[min(1.25rem,4vw)] py-5 text-ink-950 sm:p-5">Vorbereitete Angaben werden abgerufen …</p> : null}
    {state.phase === 'error' ? <div className="min-w-0 space-y-2 rounded-2xl border border-border bg-muted px-[min(1.25rem,4vw)] py-5 sm:p-5">
      <ResultHeading ref={heading} tabIndex={-1} className="font-semibold focus:outline-none">Abfrage fehlgeschlagen</ResultHeading>
      <p className="text-ink-950">{state.message}</p>
    </div> : null}
    {state.phase === 'ready' ? <div className="grid min-w-0 grid-cols-1 gap-5">
      <div className="min-w-0 space-y-2">
        <ResultHeading ref={heading} tabIndex={-1} className="text-2xl font-semibold tracking-tight focus:outline-none">Einreise nach {landAnzeigeText(state.view.input.destinationCountryCode)}</ResultHeading>
        <p className="text-sm leading-6 text-ink-950">Es gelten die jeweils angegebenen Bedingungen. Die Übersicht ist keine individuelle Einreisezusage.</p>
        {state.message ? <p className="rounded-xl bg-muted px-[min(0.75rem,3vw)] py-3 text-sm leading-6 text-ink-950 sm:px-3">{state.message}</p> : null}
        {state.view.synthetic ? <p className="rounded-xl border border-border bg-citrus-300 px-[min(0.75rem,3vw)] py-3 text-sm font-semibold text-brand-900 sm:px-3">Synthetische Testdaten · Keine echte Einreiseauskunft</p> : null}
      </div>
      {state.view.cells.map((cell) => <section key={cell.country} className="grid min-w-0 grid-cols-1 gap-3" aria-label={`Staatsangehörigkeit ${landAnzeigeText(cell.country)}`}>
        <h3 className="text-lg font-semibold">Staatsangehörigkeit {landAnzeigeText(cell.country)}</h3>
        {cell.results.map((result, index) => <Result key={index} result={result} />)}
      </section>)}
    </div> : null}
  </section>
}
