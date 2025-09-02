'use client'

import * as React from 'react'
import SliderField from '@/components/ui/slider-field'
import { Button } from '@/components/ui/button'

type Props = {
  kind: 'photo' | 'video' | 'none'
  selectionName?: string
}

type Adjust = {
  exposure: number
  contrast: number
  temperature: number
  tint: number
  highlights: number
  shadows: number
  whites: number
  blacks: number
  clarity: number
  sharpness: number
  noise: number
}

const DEFAULTS: Adjust = {
  exposure: 0, contrast: 0, temperature: 0, tint: 0,
  highlights: 0, shadows: 0, whites: 0, blacks: 0,
  clarity: 0, sharpness: 0, noise: 0,
}

export default function InspectorPanelPro({ kind, selectionName }: Props) {
  const [a, setA] = React.useState<Adjust>(DEFAULTS)
  const patch = (k: keyof Adjust) => (v: number) => setA((s) => ({ ...s, [k]: v }))
  const resetAll = () => setA(DEFAULTS)

  const applyPreset = (preset: Partial<Adjust>) => {
    setA((s) => ({ ...s, ...preset }))
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {selectionName || (kind === 'video' ? 'Video' : 'Foto')}
          </div>
          <p className="text-xs text-muted-foreground">Nicht-destruktive Anpassungen</p>
        </div>
        <Button size="sm" variant="outline" onClick={resetAll}>Alle zurücksetzen</Button>
      </header>

      {/* Belichtung */}
      <section className="rounded-lg border bg-card/60 p-3">
        <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">Belichtung</div>
        <div className="grid gap-3">
          <SliderField label="Belichtung" value={a.exposure} onChange={patch('exposure')} min={-2} max={2} step={0.01} unit="EV" />
          <SliderField label="Kontrast" value={a.contrast} onChange={patch('contrast')} min={-100} max={100} step={1} unit="%" />
          <SliderField label="Highlights" value={a.highlights} onChange={patch('highlights')} min={-100} max={100} step={1} unit="%" />
          <SliderField label="Schatten" value={a.shadows} onChange={patch('shadows')} min={-100} max={100} step={1} unit="%" />
          <SliderField label="Weißpunkte" value={a.whites} onChange={patch('whites')} min={-100} max={100} step={1} unit="%" />
          <SliderField label="Schwarzpunkte" value={a.blacks} onChange={patch('blacks')} min={-100} max={100} step={1} unit="%" />
        </div>
      </section>

      {/* Farbe */}
      <section className="rounded-lg border bg-card/60 p-3">
        <div className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">Farbe</div>
        <div className="grid gap-3">
          <SliderField label="Temperatur" value={a.temperature} onChange={patch('temperature')} min={-100} max={100} step={1} />
          <SliderField label="Tönung" value={a.tint} onChange={patch('tint')} min={-100} max={100} step={1} />
          <SliderField label="Klarheit" value={a.clarity} onChange={patch('clarity')} min={-100} max={100} step={1} />
          <SliderField label="Schärfe" value={a.sharpness} onChange={patch('sharpness')} min={0} max={100} step={1} />
          <SliderField label="Entrauschen" value={a.noise} onChange={patch('noise')} min={0} max={100} step={1} />
        </div>

        {/* Presets */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="xs" variant="outline" onClick={() => applyPreset({ exposure: 0.15, contrast: 12, clarity: 8 })}>Pop</Button>
          <Button size="xs" variant="outline" onClick={() => applyPreset({ temperature: 8, tint: -4 })}>Warm</Button>
          <Button size="xs" variant="outline" onClick={() => applyPreset({ temperature: -10, tint: 6 })}>Cool</Button>
          <Button size="xs" variant="outline" onClick={() => applyPreset({ highlights: -20, shadows: 15 })}>HDR-ish</Button>
        </div>
      </section>

      {/* TODO: HSL / Kurven / LUTs – logische Erweiterung hier */}
    </div>
  )
}
