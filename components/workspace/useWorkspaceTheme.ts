'use client'

import { useState, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'jetnity:workspace-theme:v1'
type WorkspaceTheme = 'light' | 'green'
const serverTheme = (): WorkspaceTheme => 'light'

// Each shell owns its presentation store; nothing is shared between SSR requests.
function createThemeStore() {
  let theme: WorkspaceTheme = 'light'
  const listeners = new Set<() => void>()
  const update = (next: WorkspaceTheme) => {
    if (theme === next) return
    theme = next
    listeners.forEach((listener) => listener())
  }
  const read = () => {
    try { update(localStorage.getItem(STORAGE_KEY) === 'green' ? 'green' : 'light') }
    catch { /* Unavailable storage leaves the in-memory selection usable. */ }
  }
  return {
    getSnapshot: () => theme,
    subscribe(listener: () => void) {
      listeners.add(listener)
      read()
      const changed = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY || event.key === null) read()
      }
      window.addEventListener('storage', changed)
      return () => {
        listeners.delete(listener)
        window.removeEventListener('storage', changed)
      }
    },
    toggle() {
      const next = theme === 'green' ? 'light' : 'green'
      try { localStorage.setItem(STORAGE_KEY, next) }
      catch { /* Saving a visual preference is optional. */ }
      update(next)
    },
  }
}

export default function useWorkspaceTheme() {
  const [store] = useState(createThemeStore)
  const theme = useSyncExternalStore(store.subscribe, store.getSnapshot, serverTheme)
  return { theme, toggleTheme: store.toggle }
}
