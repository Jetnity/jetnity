'use client'

import { useState, useSyncExternalStore } from 'react'

// Browser-local display only: no account setting, auth, database or travel data.
const STORAGE_KEY = 'jetnity:workspace-theme:v1'
const CHANGED = 'jetnity:workspace-theme-change'
export type WorkspaceTheme = 'light' | 'dark'
const serverTheme = (): WorkspaceTheme => 'light'

// An old "green" display was dark. Migrate it to the new neutral dark mode
// without touching a trip, user account or Supabase setting.
function createThemeStore() {
  let theme: WorkspaceTheme = 'light'
  const listeners = new Set<() => void>()
  const update = (next: WorkspaceTheme) => {
    if (theme === next) return
    theme = next
    listeners.forEach(listener => listener())
  }
  const read = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const next: WorkspaceTheme = raw === 'dark' || raw === 'green' ? 'dark' : 'light'
      if (raw === 'green') {
        try { localStorage.setItem(STORAGE_KEY, 'dark') } catch { /* read remains usable */ }
      }
      update(next)
    } catch { /* A blocked preference store leaves the existing visible theme usable. */ }
  }
  const setTheme = (next: WorkspaceTheme) => {
    try { localStorage.setItem(STORAGE_KEY, next) }
    catch { /* Preference storage is optional. */ }
    update(next)
    window.dispatchEvent(new Event(CHANGED))
  }
  return {
    getSnapshot: () => theme,
    subscribe(listener: () => void) {
      listeners.add(listener)
      read()
      const storageChanged = (event: StorageEvent) => {
        if (event.key === STORAGE_KEY || event.key === null) read()
      }
      const sameTabChanged = () => read()
      window.addEventListener('storage', storageChanged)
      window.addEventListener(CHANGED, sameTabChanged)
      return () => {
        listeners.delete(listener)
        window.removeEventListener('storage', storageChanged)
        window.removeEventListener(CHANGED, sameTabChanged)
      }
    },
    setTheme,
    toggle() { setTheme(theme === 'dark' ? 'light' : 'dark') },
  }
}

export default function useWorkspaceTheme() {
  const [store] = useState(createThemeStore)
  const theme = useSyncExternalStore(store.subscribe, store.getSnapshot, serverTheme)
  return { theme, toggleTheme: store.toggle, setTheme: store.setTheme }
}
