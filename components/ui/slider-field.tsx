'use client'

import * as React from 'react'
import { cn as _cn } from '@/lib/utils'
import { RotateCcw } from 'lucide-react'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

export type SliderFieldProps = {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  defaultValue?: number
  className?: string
}

export default function SliderField({
  label,
  value,
  onChange,
  min = -100,
  max = 100,
  step = 1,
  unit = '',
  defaultValue = 0,
  className,
}: SliderFieldProps) {
  const [local, setLocal] = React.useState<number>(value)
  React.useEffect(() => setLocal(value), [value])

  function clamp(n: number) {
    return Math.min(max, Math.max(min, Number.isFinite(n) ? n : 0))
  }

  const commit = (n: number) => onChange(clamp(n))

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">{label}</label>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent"
          title="Zurücksetzen (Doppelklick)"
          onDoubleClick={() => commit(defaultValue)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={local}
          onChange={(e) => {
            const v = clamp(parseFloat(e.target.value))
            setLocal(v)
            onChange(v)
          }}
          className="w-full accent-foreground"
        />
        <div className="flex w-[92px] items-center gap-1 rounded-md border bg-background px-2 py-1">
          <input
            type="number"
            value={local}
            onChange={(e) => setLocal(clamp(parseFloat(e.target.value)))}
            onBlur={() => commit(local)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(local)
              if (e.key === 'ArrowUp') commit(clamp(local + step))
              if (e.key === 'ArrowDown') commit(clamp(local - step))
            }}
            className="h-6 w-full bg-transparent text-right text-xs outline-none"
          />
          <span className="select-none text-[11px] text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  )
}
