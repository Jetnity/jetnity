'use client'

import { createContext, useContext } from 'react'

// Presentation slots only. TripWorkspace remains the owner of every trip action
// and its URL/history state. No trip data is copied into the application shell.
export type WorkspaceSlots = {
  navigation: HTMLElement | null
  mobile: HTMLElement | null
  actions: HTMLElement | null
  title: HTMLElement | null
  collapsed: boolean
  closeNavigation: () => void
}

export const WorkspaceContext = createContext<WorkspaceSlots | null>(null)
export function useWorkspaceShell() {
  return useContext(WorkspaceContext)
}
