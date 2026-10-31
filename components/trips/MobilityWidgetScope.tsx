'use client'

// Local visibility for mobility widgets. Default closed.
// The scope key stays in memory. It is not a URL, message, attribute, cookie, or consent decision.

import * as React from 'react'

export type MobilityWidgetArea = 'verbindungen' | 'mietwagen'

export type MobilityWidgetScope = Readonly<{
  workspaceActive: boolean
  activeArea: MobilityWidgetArea | null
  scopeKey: string | null
}>

export type MobilityScopeStage = Readonly<{
  id: string
  position: number
  name: string
  countryCode: string | null
  placeId: string | null
  arrivalDate: string | null
  departureDate: string | null
}>

export type MobilityScopeDay = Readonly<{
  id: string
  dayIndex: number
  dayDate: string | null
  stageId: string | null
}>

export type MobilityScopeInput = Readonly<{
  tripId: string
  source: 'guest' | 'account'
  origin: string | null
  originPlaceId: string | null
  detail: string
  dayId: string | null
  stages: readonly MobilityScopeStage[]
  days: readonly MobilityScopeDay[]
}>

const CLOSED: MobilityWidgetScope = { workspaceActive: false, activeArea: null, scopeKey: null }

const ScopeRead = React.createContext<MobilityWidgetScope>(CLOSED)
const AreaWrite = React.createContext<(area: MobilityWidgetArea | null) => void>(() => undefined)

function teil(value: string): string {
  return value.replaceAll('\u001f', ' ')
}

/** Stable parent identity. Place and origin changes count. Ordinary rerenders do not. */
export function mobilityWidgetScopeKey(input: MobilityScopeInput): string | null {
  const tripId = input.tripId.trim()
  if (tripId === '') return null
  const stages = input.stages
    .map((stage) => [
      teil(stage.id),
      String(stage.position),
      teil(stage.name),
      stage.countryCode ?? '',
      stage.placeId ?? '',
      stage.arrivalDate ?? '',
      stage.departureDate ?? '',
    ].join('\u001e'))
    .join('\u001f')
  const days = input.days
    .map((day) => [teil(day.id), String(day.dayIndex), day.dayDate ?? '', day.stageId ?? ''].join('\u001e'))
    .join('\u001f')
  return [
    'v2',
    input.source,
    teil(tripId),
    teil(input.origin ?? ''),
    input.originPlaceId ?? '',
    teil(input.detail),
    input.dayId ?? '',
    stages,
    days,
  ].join('\u001f')
}

export function MobilityWidgetScopeProvider({
  workspaceActive,
  scopeKey,
  children,
}: {
  workspaceActive: boolean
  scopeKey: string | null
  children: React.ReactNode
}) {
  const [activeArea, setActiveArea] = React.useState<MobilityWidgetArea | null>(null)
  const write = React.useCallback((area: MobilityWidgetArea | null) => {
    setActiveArea((current) => (current === area ? current : area))
  }, [])
  const published = React.useMemo<MobilityWidgetScope>(() => {
    const key = typeof scopeKey === 'string' && scopeKey.trim() !== '' ? scopeKey : null
    return {
      workspaceActive,
      activeArea: workspaceActive ? activeArea : null,
      scopeKey: workspaceActive ? key : null,
    }
  }, [workspaceActive, activeArea, scopeKey])

  return (
    <AreaWrite.Provider value={write}>
      <ScopeRead.Provider value={published}>{children}</ScopeRead.Provider>
    </AreaWrite.Provider>
  )
}

export function useMobilityWidgetScope(): MobilityWidgetScope {
  return React.useContext(ScopeRead)
}

/** Inner mobility area. Inactive workspaces stay null. */
export function useMobilityWidgetArea(area: MobilityWidgetArea | null) {
  const write = React.useContext(AreaWrite)
  React.useLayoutEffect(() => {
    write(area)
    return () => write(null)
  }, [area, write])
}
