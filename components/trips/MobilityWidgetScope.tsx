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

/** Stable parent identity from trip, source, detail, day, and stage/date order. */
export function mobilityWidgetScopeKey(input: MobilityScopeInput): string | null {
  const tripId = input.tripId.trim()
  if (tripId === '') return null
  const stages = input.stages
    .map((stage) => `${teil(stage.id)}:${stage.position}:${stage.arrivalDate ?? ''}:${stage.departureDate ?? ''}`)
    .join(',')
  const days = input.days
    .map((day) => `${teil(day.id)}:${day.dayIndex}:${day.dayDate ?? ''}:${day.stageId ?? ''}`)
    .join(',')
  return ['v1', input.source, teil(tripId), teil(input.detail), input.dayId ?? '', stages, days].join('\u001f')
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
