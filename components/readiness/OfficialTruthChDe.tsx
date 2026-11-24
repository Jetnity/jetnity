'use client'

import { useState } from 'react'
import EinreiseLaenderpruefer from './EinreiseLaenderpruefer'
import { AtVisitorPreviewNotice } from './AtVisitorPreview'
import './at-visitor-preview.css'

function AtVisitorPreviewFrame() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  return (
    <div className="at-visitor-preview workspace-shell mx-auto min-w-0 max-w-4xl rounded-panel border border-border p-2 sm:p-5" data-workspace-theme={theme} data-at-visitor-preview-frame>
      <div className="workspace-content">
        <div className="mb-5 grid min-w-0 gap-3">
          <AtVisitorPreviewNotice placement="entry" />
          <div role="group" aria-label="Darstellung" className="flex flex-wrap gap-2">
            {(['light', 'dark'] as const).map((mode) => (
              <button key={mode} type="button" aria-pressed={theme === mode} onClick={() => setTheme(mode)}
                className="min-h-11 rounded-full border border-input bg-card px-4 text-sm font-semibold text-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground">
                {mode === 'light' ? 'Hell' : 'Dunkel'}
              </button>
            ))}
          </div>
        </div>
        <EinreiseLaenderpruefer atVisitorPreview />
      </div>
    </div>
  )
}

export default function OfficialTruthChDe({ atVisitorPreview = false }: { atVisitorPreview?: boolean } = {}) {
  return atVisitorPreview ? <AtVisitorPreviewFrame /> : <EinreiseLaenderpruefer />
}
