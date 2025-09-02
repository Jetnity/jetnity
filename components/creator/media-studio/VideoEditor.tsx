'use client'

import { useState } from 'react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

export default function VideoEditor({ className }: { className?: string }) {
  const [cursor, setCursor] = useState(0)

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="flex items-center justify-between border-b bg-background/70 px-3 py-2 text-xs">
        <div className="text-muted-foreground">VideoEditor</div>
        <div className="flex items-center gap-2">
          <span className="tabular-nums">{cursor.toFixed(2)}s</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-auto p-4">
          <div className="grid h-full place-items-center">
            <div className="aspect-video w-full max-w-3xl rounded-xl border border-dashed bg-muted/40 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Preview-Platzhalter – hier erscheint später der Video-Player.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="border-t bg-background/60 p-3">
          <div className="relative h-24 overflow-hidden rounded-lg border bg-card/60">
            <div className="absolute inset-0 grid grid-rows-3 gap-2 p-2 text-[10px]">
              <div className="rounded bg-muted/60 p-1">Video-Track</div>
              <div className="rounded bg-muted/40 p-1">Audio-Track</div>
              <div className="rounded bg-muted/40 p-1">Caption-Track</div>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={0.01}
              value={cursor}
              onChange={(e) => setCursor(Number(e.target.value))}
              className="absolute bottom-2 left-2 right-2"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
