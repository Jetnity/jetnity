'use client'

// Conditional 12Go frame. A conscious click asks the production facade.
// A null answer mounts nothing. Hidden surfaces drop the frame without a new click.

import * as React from 'react'

import { useMobilityWidgetScope } from '@/components/trips/MobilityWidgetScope'
import { PrivacyBeeCmpPreferences } from '@/components/privacy/PrivacyBeeCmpPreferences'
import {
  checkProductionExecution,
  consumeProductionGrant,
  releaseProductionExecution,
  requestProductionExecution,
  type ProductionCapability,
} from '@/lib/privacy/privacybee-cmp/produktion'
import { readCmpController, serverCmpSnapshot, subscribeCmpController } from '@/lib/privacy/privacybee-cmp/abo'
import { TWELVEGO_PRODUCTION_DISCLOSURE } from '@/lib/privacy/privacybee-cmp/offenlegung'
import {
  TWELVE_GO_PARENT_ORIGIN,
  twelveGoGrantBauen,
  twelveGoReadyLesen,
  twelveGoRevokeLesen,
  type TwelveGoReady,
} from '@/lib/providers/twelve-go/widget/protokoll'
import {
  TWELVE_GO_WIDGET_RAHMEN_BREITE,
  TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX,
  twelveGoHostPasst,
} from '@/lib/providers/twelve-go/widget/rahmen'

export const TWELVE_GO_READY_TIMEOUT_MS = 12_000

type Phase = 'ruhend' | 'verweigert' | 'wartet' | 'eingesetzt' | 'fehler' | 'entfernt'

const TEXT: Record<Phase, string> = {
  ruhend: 'Die Anfrage ist eine eigene Entscheidung. Ein bereit gemeldetes Fenster ist noch keine Suche.',
  verweigert: 'Das Formular ist hier nicht eingesetzt. Die Links bleiben nutzbar.',
  wartet: 'Die Anfrage läuft. Das ist noch keine Suche.',
  eingesetzt: 'Der Rahmen ist hier eingesetzt. Das bestätigt keine Suche und keine Buchung.',
  fehler: 'Das Formular konnte nicht angezeigt werden. Die Links bleiben nutzbar.',
  entfernt: 'Der Rahmen ist hier entfernt. Die Links bleiben nutzbar.',
}

const KNOPF =
  'mt-3 inline-flex min-h-11 w-full max-w-full items-center whitespace-normal break-words rounded-full border border-line-300 bg-white px-4 py-2 text-left text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:mr-3 sm:w-auto'

function sichtbar(scope: { workspaceActive: boolean; activeArea: string | null; scopeKey: string | null }): boolean {
  return scope.workspaceActive && scope.activeArea === 'verbindungen' && Boolean(scope.scopeKey)
}

export default function TwelveGoWidgetHost() {
  const scope = useMobilityWidgetScope()
  const offen = sichtbar(scope)
  const cmp = React.useSyncExternalStore(subscribeCmpController, readCmpController, serverCmpSnapshot)
  const [phase, setPhase] = React.useState<Phase>('ruhend')
  const [capability, setCapability] = React.useState<ProductionCapability | null>(null)
  const [boundKey, setBoundKey] = React.useState<string | null>(null)
  const capRef = React.useRef<ProductionCapability | null>(null)
  const keyRef = React.useRef<string | null>(null)
  const challengeRef = React.useRef<string | null>(null)
  const generationRef = React.useRef<number | null>(null)
  const grantedRef = React.useRef(false)
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null)
  const buttonRef = React.useRef<HTMLButtonElement | null>(null)
  const focusRef = React.useRef(false)
  const mountedRef = React.useRef(false)
  const offenRef = React.useRef(offen)
  const keyNowRef = React.useRef(scope.scopeKey)

  const abbauen = React.useCallback((next: Phase, handle: ProductionCapability | null, focus = false) => {
    if (handle && capRef.current !== handle) return
    if (handle) {
      capRef.current = null
      releaseProductionExecution(handle)
    }
    keyRef.current = null
    challengeRef.current = null
    generationRef.current = null
    grantedRef.current = false
    focusRef.current = focus
    setBoundKey(null)
    setCapability(null)
    setPhase(next)
  }, [])

  React.useLayoutEffect(() => {
    offenRef.current = offen
    keyNowRef.current = scope.scopeKey
    const handle = capRef.current
    if (!handle) return
    if (offen && scope.scopeKey && scope.scopeKey === keyRef.current) return
    abbauen('ruhend', handle)
  }, [offen, scope.scopeKey, abbauen])

  const annehmen = React.useCallback((handle: ProductionCapability, ready: TwelveGoReady, frame: Window) => {
    if (grantedRef.current) {
      if (ready.challenge !== challengeRef.current) abbauen('fehler', handle)
      return
    }
    if (challengeRef.current && challengeRef.current !== ready.challenge) {
      abbauen('fehler', handle)
      return
    }
    if (!offenRef.current || keyNowRef.current !== keyRef.current || keyNowRef.current !== boundKey || handle.childOrigin === TWELVE_GO_PARENT_ORIGIN || !checkProductionExecution(handle)) {
      abbauen('fehler', handle)
      return
    }
    const grant = consumeProductionGrant(handle)
    if (!grant || !checkProductionExecution(handle)) {
      abbauen('fehler', handle)
      return
    }
    const message = twelveGoGrantBauen({
      challenge: ready.challenge,
      frameGeneration: ready.frameGeneration,
      parentGeneration: grant.parentGeneration,
      policyId: grant.policyId,
      artifactSha256: grant.artifactSha256,
    })
    if (!message) {
      abbauen('fehler', handle)
      return
    }
    challengeRef.current = ready.challenge
    generationRef.current = ready.frameGeneration
    grantedRef.current = true
    frame.postMessage(message, handle.childOrigin)
    setPhase('eingesetzt')
  }, [abbauen, boundKey])

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      const handle = capRef.current
      queueMicrotask(() => {
        if (mountedRef.current || !handle || capRef.current !== handle) return
        capRef.current = null
        releaseProductionExecution(handle)
      })
    }
  }, [])

  React.useEffect(() => {
    const handle = capRef.current
    if (!handle) return
    if (checkProductionExecution(handle)) return
    abbauen('fehler', handle)
  }, [cmp, abbauen])

  React.useEffect(() => {
    if (phase !== 'wartet') return
    const handle = capRef.current
    if (!handle) return
    const timer = window.setTimeout(() => {
      if (capRef.current !== handle || grantedRef.current) return
      abbauen('fehler', handle)
    }, TWELVE_GO_READY_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [phase, abbauen])

  React.useEffect(() => {
    if (!focusRef.current) return
    focusRef.current = false
    buttonRef.current?.focus()
  }, [phase])

  React.useEffect(() => {
    const handle = capability
    if (!handle) return
    const onMessage = (event: MessageEvent) => {
      if (capRef.current !== handle) return
      const frame = iframeRef.current?.contentWindow
      if (event.origin !== handle.childOrigin || !frame || event.source !== frame) return
      if (!offenRef.current || keyNowRef.current !== keyRef.current || keyNowRef.current !== boundKey) {
        abbauen('ruhend', handle)
        return
      }
      const ready = twelveGoReadyLesen(event.data)
      if (!ready) {
        const revoke = twelveGoRevokeLesen(event.data)
        if (!revoke) return
        if (generationRef.current !== null && revoke.frameGeneration !== generationRef.current) return
        abbauen('fehler', handle)
        return
      }
      annehmen(handle, ready, frame)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [capability, abbauen, annehmen, boundKey])

  function anfragen() {
    if (!offen || !scope.scopeKey || capRef.current) return
    const handle = requestProductionExecution('twelvego', scope.scopeKey)
    if (!handle || !twelveGoHostPasst(handle) || !checkProductionExecution(handle)) {
      if (handle) releaseProductionExecution(handle)
      setPhase('verweigert')
      return
    }
    capRef.current = handle
    keyRef.current = scope.scopeKey
    challengeRef.current = null
    generationRef.current = null
    grantedRef.current = false
    setBoundKey(scope.scopeKey)
    setCapability(handle)
    setPhase('wartet')
  }

  function entfernen() {
    abbauen('entfernt', capRef.current, true)
  }

  const frameOn = Boolean(
    capability &&
    offen &&
    boundKey != null &&
    scope.scopeKey === boundKey &&
    twelveGoHostPasst(capability),
  )
  const aktion = phase === 'wartet' || phase === 'eingesetzt' ? 'entfernen' : phase === 'ruhend' ? 'anfragen' : 'erneut'
  const aktionText = aktion === 'entfernen' ? 'Formular entfernen' : aktion === 'anfragen' ? 'Suchformular anfragen' : 'Erneut anfragen'
  const hinweis = TWELVEGO_PRODUCTION_DISCLOSURE

  return (
    <div className="mt-5" data-twelve-go-widget={phase === 'ruhend' ? 'consent-blocked' : phase} data-twelve-go-widget-ausfuehrbar={frameOn ? 'true' : 'false'}>
      <div data-twelve-go-disclosure={hinweis.disclosureRevision} className="min-w-0 max-w-full">
        {hinweis.paragraphs.map((absatz) => (
          <p key={absatz} className="mt-3 text-sm leading-6 text-ink-800" style={{ overflowWrap: 'anywhere' }}>{absatz}</p>
        ))}
        <p className="mt-3 text-sm leading-6 text-ink-800" style={{ overflowWrap: 'anywhere' }}>{hinweis.withdrawalLimitation}</p>
        <p className="mt-3 text-sm leading-6 text-ink-800" style={{ overflowWrap: 'anywhere' }}>{hinweis.v1Alternative}</p>
        <a
          href={hinweis.privacyHref}
          target="_blank"
          rel="noopener noreferrer"
          data-twelve-go-datenschutz="1"
          className="mt-3 inline-flex min-h-11 max-w-full items-center text-sm font-semibold text-brand-800 underline"
          style={{ overflowWrap: 'anywhere' }}
        >
          {hinweis.privacyLinkLabel}
        </a>
      </div>
      <div className="mt-3 max-w-full">
        <PrivacyBeeCmpPreferences appearance="surface" />
      </div>
      <p className="mt-3 text-sm leading-6 text-ink-800">{TEXT[phase]}</p>
      <button
        ref={buttonRef}
        type="button"
        className={KNOPF}
        data-twelve-go-aktion={aktion}
        onClick={aktion === 'entfernen' ? entfernen : anfragen}
      >
        {aktionText}
      </button>
      {frameOn && capability ? (
        <iframe
          ref={iframeRef}
          title="Allgemeines 12Go-Suchformular"
          src={capability.src}
          sandbox={capability.sandbox}
          referrerPolicy="no-referrer"
          data-twelve-go-host="frame"
          style={{ width: TWELVE_GO_WIDGET_RAHMEN_BREITE, height: TWELVE_GO_WIDGET_RAHMEN_HOEHE_PX, border: 0 }}
        />
      ) : null}
    </div>
  )
}
