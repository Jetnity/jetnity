'use client'

import { useState } from 'react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

export default function PhotoEditor({
  className,
}: { className?: string }) {
  const [zoom, setZoom] = useState(1)

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="flex items-center justify-between border-b bg-background/70 px-3 py-2 text-xs">
        <div className="text-muted-foreground">PhotoEditor</div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2">
            Zoom
            <input type="range" min={0.25} max={4} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          </label>
          <span className="tabular-nums">{(zoom * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="grid h-full place-items-center">
          <div className="aspect-video w-full max-w-3xl rounded-xl border border-dashed bg-muted/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Canvas-Platzhalter – hier kommt später der Layer-Stack & non-destructive Pipeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
