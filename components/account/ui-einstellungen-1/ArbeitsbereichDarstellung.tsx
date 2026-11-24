'use client'

import { Moon, Sun } from 'lucide-react'
import useWorkspaceTheme, { type WorkspaceTheme } from '@/components/workspace/useWorkspaceTheme'
import type { UiSprache } from '@/lib/localization/ui-sprache'

export default function ArbeitsbereichDarstellung({ sprache }: { sprache: UiSprache }) {
  const { theme, setTheme } = useWorkspaceTheme()
  const en = sprache === 'en'
  const thema: { id: WorkspaceTheme; label: string; erklaerung: string; Icon: typeof Moon }[] = [
    { id: 'light', label: en ? 'Light' : 'Hell', erklaerung: en ? 'Light background' : 'Helle Oberfläche', Icon: Sun },
    { id: 'dark', label: en ? 'Dark' : 'Dunkel', erklaerung: en ? 'Dark background' : 'Dunkle Oberfläche', Icon: Moon },
  ]
  return <section aria-label={en ? 'Appearance' : 'Darstellung'} className="mt-6 min-w-0 rounded-card border border-border bg-card p-4 shadow-card sm:p-5">
    <h2 className="text-subtitle text-foreground">{en ? 'Appearance' : 'Darstellung'}</h2>
    <p className="mt-1 max-w-prose text-meta text-muted-foreground">{en
      ? 'Choose how your travel workspace looks on this device.'
      : 'Wähle, wie deine Reiseansicht auf diesem Gerät aussieht.'}</p>
    <div className="mt-4 grid min-w-0 grid-cols-2 gap-3" role="group" aria-label={en ? 'Choose appearance' : 'Darstellung wählen'}>
      {thema.map(({ id, label, erklaerung, Icon }) => <button
        key={id} type="button" aria-pressed={theme === id}
        onClick={() => setTheme(id)}
        className="flex min-h-11 min-w-0 items-center gap-3 rounded-control border border-border bg-card px-3 py-3 text-left text-body text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
      ><Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="min-w-0"><span className="block font-semibold">{label}</span><span className="block text-meta">{erklaerung}</span></span>
      </button>)}
    </div>
  </section>
