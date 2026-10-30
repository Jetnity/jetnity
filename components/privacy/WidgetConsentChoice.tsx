'use client'

// Kontrollierte Auswahl. Dieses Modul lädt kein Anbieter-Skript und schreibt
// keinen Speicher. Zustimmung bleibt informativ, solange der Kill-Switch aus ist.

import { useEffect, useId, useRef } from 'react'

import {
  commandForAction,
  vendorScriptMayExecute,
  type WidgetConsentCommand,
  type WidgetConsentState,
} from '@/lib/privacy/widget-consent/entscheidung'
import {
  WIDGET_CONSENT_PROVIDERS,
  purposeControlsEnforceable,
} from '@/lib/privacy/widget-consent/vertrag'

const AKTION =
  'inline-flex min-h-11 w-full min-w-0 items-center justify-center whitespace-normal break-words rounded-lg border border-line-300 bg-surface-0 px-4 py-3 text-center text-base font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

const ZWECK_TEXT = [
  ['functional_load', 'Funktion des Widgets'],
  ['nonessential_analytics', 'Nicht notwendige Statistik'],
  ['advertising_marketing', 'Werbung'],
] as const

export type WidgetConsentChoiceProps = {
  state: WidgetConsentState
  onCommand: (command: WidgetConsentCommand) => void
}

export function WidgetConsentChoice({ state, onCommand }: WidgetConsentChoiceProps) {
  const faktum = WIDGET_CONSENT_PROVIDERS[state.providerId]
  const zweckGetrennt = purposeControlsEnforceable(state.providerId)
  const ausfuehrungErlaubt = vendorScriptMayExecute(state)
  const titelId = useId()
  const textId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef(state)
  const onCommandRef = useRef(onCommand)

  useEffect(() => {
    stateRef.current = state
    onCommandRef.current = onCommand
  }, [state, onCommand])

  useEffect(() => {
    if (state.panel !== 'open') return
    const root = dialogRef.current
    if (!root) return
    root.querySelector<HTMLElement>('[data-widget-consent-initial-focus="true"]')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onCommandRef.current(commandForAction(stateRef.current, 'close'))
    }
    root.addEventListener('keydown', onKey)
    return () => root.removeEventListener('keydown', onKey)
  }, [state.panel, state.generation, state.informative])

  const status =
    state.informative === 'granted'
      ? 'Diese Anzeige hält nur eine informative Auswahl fest. Kein Zweck ist freigegeben, und es startet kein Anbieter-Skript.'
      : state.informative === 'refused'
        ? 'Du hast abgelehnt. Es wird nichts geladen.'
        : 'Noch keine Auswahl. Standard ist Ablehnung, und es wird nichts geladen.'

  const rahmen = 'w-full min-w-0 max-w-full break-words rounded-2xl border border-line-200 bg-surface-0 p-4 text-brand-800 [overflow-wrap:anywhere] sm:p-5'
  const ausfuehrungWert = ausfuehrungErlaubt ? 'allowed' : 'denied'
  const ausfuehrung = (
    <p className="text-base font-semibold" data-effective-vendor-execution={ausfuehrungWert}>
      Wirksame Anbieter-Ausführung: {ausfuehrungErlaubt ? 'an' : 'aus'}.
    </p>
  )

  if (state.panel === 'closed') {
    return (
      <section
        aria-labelledby={titelId}
        className={rahmen}
        data-widget-consent="1"
        data-provider={state.providerId}
        data-panel="closed"
        data-informative={state.informative}
        data-purpose-controls={zweckGetrennt ? 'open' : 'locked'}
        data-effective-vendor-execution={ausfuehrungWert}
      >
        <h2 id={titelId} className="break-words text-xl font-semibold">
          {faktum.label}
        </h2>
        <div className="mt-3 grid gap-3">
          {ausfuehrung}
          <p className="text-base leading-6 text-ink-900">{status}</p>
          <button
            type="button"
            className={AKTION}
            data-widget-consent-action="reopen"
            onClick={() => onCommand(commandForAction(state, 'reopen'))}
          >
            Auswahl erneut öffnen
          </button>
        </div>
      </section>
    )
  }

  const ersterFokus = state.informative === 'not_decided' ? 'refuse' : 'withdraw'

  return (
    <section
      ref={dialogRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titelId}
      aria-describedby={textId}
      tabIndex={-1}
      className={rahmen}
      data-widget-consent="1"
      data-provider={state.providerId}
      data-panel="open"
      data-informative={state.informative}
      data-purpose-controls={zweckGetrennt ? 'open' : 'locked'}
      data-effective-vendor-execution={ausfuehrungWert}
    >
      <h2 id={titelId} className="break-words text-xl font-semibold">
        {faktum.label}
      </h2>
      <div id={textId} className="mt-3 grid gap-3 text-base leading-6 text-ink-900">
        <p>
          Jetnity hat {faktum.label} nicht geladen. Diese Auswahl speichert nichts und ist keine Freigabe, ein
          Anbieter-Skript auszuführen.
        </p>
        {ausfuehrung}
        <p>{status}</p>
        <p>
          Funktion, Statistik und Werbung lassen sich hier nicht einzeln schalten. Eine getrennte Abschaltung beim
          Anbieter ist nicht nachgewiesen.
        </p>
        <ul className="grid gap-1">
          {ZWECK_TEXT.map(([id, label]) => (
            <li key={id} data-purpose={id}>
              {label}: nicht getrennt schaltbar
            </li>
          ))}
        </ul>
        <p>Bei einer früheren isolierten Prüfung, nicht in Jetnity geladen:</p>
        <ul className="grid gap-1 break-all">
          {faktum.observedHosts.map((host) => (
            <li key={host}>{host}</li>
          ))}
        </ul>
      </div>
      <p className="mt-4">
        <a
          href={faktum.privacyHref}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          data-widget-consent-privacy="1"
          className="block min-h-11 w-full min-w-0 max-w-full py-2 break-words font-semibold text-brand-800 underline decoration-brand-800/30 underline-offset-4 [overflow-wrap:anywhere]"
        >
          {faktum.privacyLinkLabel}
        </a>
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          className={AKTION}
          data-widget-consent-action="refuse"
          data-widget-consent-initial-focus={ersterFokus === 'refuse' ? 'true' : 'false'}
          onClick={() => onCommand(commandForAction(state, 'refuse'))}
        >
          Ablehnen
        </button>
        <button
          type="button"
          className={AKTION}
          data-widget-consent-action="grant_informative"
          onClick={() => onCommand(commandForAction(state, 'grant_informative'))}
        >
          Zustimmen
        </button>
      </div>
      {state.informative !== 'not_decided' ? (
        <button
          type="button"
          className={`${AKTION} mt-3`}
          data-widget-consent-action="withdraw"
          data-widget-consent-initial-focus={ersterFokus === 'withdraw' ? 'true' : 'false'}
          onClick={() => onCommand(commandForAction(state, 'withdraw'))}
        >
          Entscheidung zurücknehmen
        </button>
      ) : null}
      <button
        type="button"
        className={`${AKTION} mt-3`}
        data-widget-consent-action="close"
        onClick={() => onCommand(commandForAction(state, 'close'))}
      >
        Schliessen
      </button>
    </section>
  )
}
