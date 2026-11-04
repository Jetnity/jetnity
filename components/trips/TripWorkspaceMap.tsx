'use client'

import * as React from 'react'
import { MapPin, Map as MapIcon } from 'lucide-react'
import { mapStopDay, mapWireStops, tripMapStops, type MapStop } from '@/lib/maps/trip-map'
import { cn } from '@/lib/utils'
import type { Trip } from '@/types/trips'

type Phase = 'idle' | 'loading' | 'ready' | 'error' | 'blocked' | 'expired'
const button = 'min-h-11 rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 disabled:opacity-50'

function MapFrame({ stops, selected, onSelect, onPhase, onRemove }: {
  stops: readonly MapStop[]
  selected: number | null
  onSelect: (index: number) => void
  onPhase: (phase: Phase) => void
  onRemove: () => void
}) {
  const host = React.useRef<HTMLDivElement>(null)
  const frame = React.useRef<HTMLIFrameElement | null>(null)
  const wire = JSON.stringify(mapWireStops(stops))
  const notify = React.useEffectEvent((phase: Phase) => onPhase(phase))
  const choose = React.useEffectEvent((index: number) => {
    if (stops.some((stop) => stop.index === index && stop.position)) onSelect(index)
  })
  const sendSelection = React.useEffectEvent(() => {
    frame.current?.contentWindow?.postMessage({ source: 'jetnity-trip-map-parent', type: 'select', index: selected }, '*')
  })

  React.useEffect(() => {
    const target = host.current
    if (!target) return
    const child = document.createElement('iframe')
    frame.current = child
    child.title = 'Interaktive Google-Karte deiner Reiseorte'
    child.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox')
    child.referrerPolicy = 'strict-origin'
    child.className = 'block h-[22rem] w-full border-0 sm:h-[26rem]'
    child.src = '/embed/trip-map'
    let done = false
    let expiry: ReturnType<typeof setTimeout> | undefined
    const end = (phase: Phase) => {
      if (done) return
      done = true
      child.remove()
      notify(phase)
    }
    const timeout = setTimeout(() => end('error'), 30000)
    const listener = (event: MessageEvent) => {
      if (done || event.source !== child.contentWindow || event.origin !== 'null') return
      const data: unknown = event.data
      if (!data || typeof data !== 'object') return
      const message = data as Record<string, unknown>
      if (message.source !== 'jetnity-trip-map') return
      if (message.type === 'frame-ready') {
        if (typeof message.expiresAt !== 'number' || !Number.isFinite(message.expiresAt)
          || message.expiresAt <= Date.now() || message.expiresAt - Date.now() > 3600000) { end('blocked'); return }
        clearTimeout(expiry)
        expiry = setTimeout(() => end('expired'), message.expiresAt - Date.now())
        child.contentWindow?.postMessage({ source: 'jetnity-trip-map-parent', type: 'init', stops: JSON.parse(wire) }, '*')
        sendSelection()
      } else if (message.type === 'ready') {
        clearTimeout(timeout)
        notify('ready')
        sendSelection()
      } else if (message.type === 'select' && Number.isInteger(message.index)) choose(message.index as number)
      else if (message.type === 'blocked' || message.type === 'error' || message.type === 'expired') end(message.type)
    }
    window.addEventListener('message', listener)
    target.replaceChildren(child)
    return () => {
      done = true
      clearTimeout(timeout)
      clearTimeout(expiry)
      window.removeEventListener('message', listener)
      child.remove()
      if (frame.current === child) frame.current = null
    }
  }, [wire])

  React.useEffect(() => { sendSelection() }, [selected])
  return (
    <div className="mt-3 min-w-0">
      <div ref={host} className="overflow-hidden rounded-2xl border border-line-200" />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={cn(button, 'border border-line-200 bg-white text-brand-800')}
          onClick={() => frame.current?.contentWindow?.postMessage({ source: 'jetnity-trip-map-parent', type: 'fit' }, '*')}>
          Alle Orte zeigen
        </button>
        <button type="button" className={cn(button, 'text-brand-800 underline underline-offset-4')} onClick={onRemove}>
          Karte ausschalten
        </button>
      </div>
    </div>
  )
}

export default function TripWorkspaceMap({ trip, selectedDay, onDay }: {
  trip: Trip
  selectedDay: string
  onDay: (id: string) => void
}) {
  const stops = React.useMemo(() => tripMapStops(trip), [trip])
  const located = stops.filter((stop) => stop.position)
  const [accepted, setAccepted] = React.useState(false)
  const [consent, setConsent] = React.useState(false)
  const [online, setOnline] = React.useState(true)
  const [cmpBlocked, setCmpBlocked] = React.useState(false)
  const [phase, setPhase] = React.useState<Phase>('idle')
  const [localSelection, setLocalSelection] = React.useState<{ stageId: string; day: string } | null>(null)
  const selected = localSelection?.day === selectedDay
    ? stops.find((stop) => stop.stageId === localSelection.stageId)?.index ?? null : stops.find((stop) => stop.dayIds.includes(selectedDay))?.index ?? null

  React.useEffect(() => {
    const revoke = () => { setAccepted(false); setConsent(false); setPhase('idle') }
    const connectivity = () => { setOnline(navigator.onLine); if (!navigator.onLine) revoke() }
    // Maps has no approved shared CMP category/policy yet. Never override its
    // presence or a consent-change signal with a second positive grant.
    const cmp = () => { setCmpBlocked(true); revoke() }
    connectivity()
    if (window.PrivacyBee !== undefined) cmp()
    document.addEventListener('privacybee:ready', cmp)
    document.addEventListener('privacybee:consent-changed', cmp)
    window.addEventListener('online', connectivity)
    window.addEventListener('offline', connectivity)
    return () => {
      document.removeEventListener('privacybee:ready', cmp)
      document.removeEventListener('privacybee:consent-changed', cmp)
      window.removeEventListener('online', connectivity)
      window.removeEventListener('offline', connectivity)
    }
  }, [])

  const select = (index: number) => {
    const stop = stops.find((entry) => entry.index === index)
    if (!stop) return
    const day = mapStopDay(stop, selectedDay)
    setLocalSelection(day ? null : { stageId: stop.stageId, day: selectedDay })
    if (day) onDay(day)
  }
  const remove = () => { setAccepted(false); setConsent(false); setPhase('idle') }
  const active = accepted && online && !cmpBlocked && located.length > 0
    && (phase === 'loading' || phase === 'ready')

  return (
    <section aria-label="Reisekarte" data-trip-map data-trip-map-state={!online ? 'offline' : phase}
      className="mt-4 min-w-0 rounded-[20px] border border-line-200 bg-surface-50 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <MapIcon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-brand-700" />
        <div>
          <h2 className="text-base font-semibold text-brand-800">Deine Reise auf der Karte</h2>
          <p className="mt-1 text-sm text-ink-700">Alle Reiseorte im Blick. Wähle einen Stopp für den passenden Tagesplan.</p>
        </div>
      </div>
      <div role="status" aria-live="polite" className="mt-3 text-sm leading-6 text-ink-800">
        {stops.length === 0 ? 'Deine Reise hat noch keine Orte.'
          : located.length === 0 ? 'Für deine Reiseorte sind noch keine Kartenpositionen gespeichert. Die Stoppliste bleibt verfügbar.'
          : !online ? 'Du bist offline. Deine gespeicherten Reiseorte bleiben hier sichtbar.'
          : cmpBlocked ? 'Google Maps bleibt ausgeschaltet. Die Datenschutzeinstellungen für Karten sind noch nicht freigegeben.'
          : phase === 'blocked' ? 'Google Maps ist in dieser Vorschau noch nicht freigeschaltet. Deine Reiseorte bleiben verfügbar.'
          : phase === 'expired' ? 'Die Kartenvorschau ist beendet. Deine Reise bleibt unverändert.'
          : phase === 'error' ? 'Die Karte konnte nicht geladen werden. Du kannst es später erneut versuchen.'
          : phase === 'loading' ? 'Google Maps wird geladen …'
          : phase === 'ready' ? `${located.length} Reiseorte auf der Karte. Nahe Orte sind zusammengefasst.`
          : `${located.length} von ${stops.length} Reiseorten haben eine gespeicherte Kartenposition.`}
      </div>
      {located.length > 0 && online && !cmpBlocked && !active ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs leading-5 text-ink-700">
            Mit dem Laden wird eine Verbindung zu Google hergestellt. Dabei werden deine IP-Adresse,
            Browserdaten und die angezeigten Kartenregionen an Google übermittelt. Die Reiseorte werden
            innerhalb der Google-Karte dargestellt. Du kannst die Karte jederzeit ausschalten.{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Google-Datenschutz</a>
            {' · '}<a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Jetnity-Datenschutz</a>
          </p>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-ink-900">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-brand-800" />
            <span>Ich stimme dem Laden von Google Maps für diese Kartenansicht zu.</span>
          </label>
          <button type="button" disabled={!consent} className={cn(button, 'w-full bg-brand-800 text-white sm:w-auto')}
            onClick={() => {
              if (window.PrivacyBee !== undefined) { setCmpBlocked(true); remove(); return }
              if (!navigator.onLine) { setOnline(false); remove(); return }
              setPhase('loading'); setAccepted(true)
            }}>
            {phase === 'error' ? 'Erneut versuchen' : 'Google-Karte laden'}
          </button>
        </div>
      ) : null}
      {active ? <MapFrame stops={stops} selected={selected} onSelect={select} onPhase={setPhase} onRemove={remove} /> : null}
      {stops.length > 0 ? (
        <ol aria-label="Orte auf der Reisekarte" className="mt-4 grid min-w-0 gap-2">
          {stops.map((stop) => (
            <li key={`${stop.stageId}:${stop.index}`}>
              <button type="button" aria-pressed={selected === stop.index} onClick={() => select(stop.index)}
                className={cn('flex min-h-11 w-full min-w-0 items-start gap-3 rounded-xl border px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30',
                  selected === stop.index ? 'border-brand-800 bg-brand-800 text-white' : 'border-line-200 bg-white text-ink-900')}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold" aria-hidden="true">{stop.index + 1}</span>
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <span className="block font-semibold">{stop.name}</span>
                  {!stop.position ? <span className="block text-xs">Kartenposition fehlt</span> : null}
                  {stop.dayIds.length === 0 ? <span className="block text-xs">Noch keinem eindeutigen Reisetag zugeordnet</span> : null}
                </span>
                {stop.position ? <MapPin className="ml-auto mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-ink-700">Die Markierungen zeigen gespeicherte Reiseorte. Es wird keine Straßenroute berechnet.</p>
    </section>
  )
}
