// components/creator/media-studio/InspectorPanel.tsx
'use client'

import * as React from 'react'
import type { EditorMediaItem } from './EditorShell'

/** ---------- Types im Edit-Dokument ---------- */
type Adjustments = {
  exposure?: number
  contrast?: number
  saturation?: number
  vibrance?: number
  temperature?: number
  tint?: number
  highlights?: number
  shadows?: number
  whites?: number
  blacks?: number
  clarity?: number
  sharpness?: number
  noise?: number
  gamma?: number
  vignette?: number
  vignetteMidpoint?: number
  vignetteRoundness?: number
  vignetteFeather?: number
  blur?: number
  grain?: number
}

type HSL = {
  red?: { h?: number; s?: number; l?: number }
  orange?: { h?: number; s?: number; l?: number }
  yellow?: { h?: number; s?: number; l?: number }
  green?: { h?: number; s?: number; l?: number }
  aqua?: { h?: number; s?: number; l?: number }
  blue?: { h?: number; s?: number; l?: number }
  purple?: { h?: number; s?: number; l?: number }
  magenta?: { h?: number; s?: number; l?: number }
}

type Transform = {
  rotate?: number        // -180..180
  flipH?: boolean
  flipV?: boolean
  scale?: number         // 0.1..3
  translateX?: number    // px relativ
  translateY?: number
  aspect?: 'free' | '1:1' | '4:5' | '3:2' | '16:9' | '9:16'
  fit?: 'contain' | 'cover'
}

type Overlay = {
  text?: string
  size?: number          // px
  color?: string         // hex
  opacity?: number       // 0..100
  position?: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right'
}

/** ---------- Presets ---------- */
const PRESETS: Record<string, Partial<Adjustments>> = {
  Neutral: {},
  Cinematic: {
    contrast: 12, saturation: -8, vibrance: 6, temperature: -4,
    blacks: -6, highlights: -6, shadows: 6, clarity: 6, gamma: -4, vignette: 12
  },
  Vivid: {
    exposure: 4, contrast: 10, saturation: 12, vibrance: 14, clarity: 6, whites: 6
  },
  'B&W': {
    saturation: -100, contrast: 16, clarity: 10, grain: 8, gamma: 2
  },
  Portrait: {
    contrast: 6, saturation: 8, vibrance: 10, highlights: -8, shadows: 6, sharpness: 6, noise: -8, temperature: 2
  },
}

/** ---------- Komponente ---------- */
export default function InspectorPanel({
  item,
  editDoc,
  onChange,
  loading,
  kind,
  selectionName,
}: {
  item?: EditorMediaItem
  editDoc?: { id: string; doc: any } | null
  onChange?: (patch: any) => void
  loading?: boolean
  kind?: 'video' | 'photo' | 'none'
  selectionName?: string
}) {
  const safeOnChange = onChange ?? (() => {})

  const effectiveKind: 'image' | 'video' | undefined =
    item?.kind ??
    (kind === 'photo' ? 'image' : kind === 'video' ? 'video' : undefined)

  const a: Adjustments = editDoc?.doc?.adjustments ?? {}
  const hsl: HSL = editDoc?.doc?.hsl ?? {}
  const t: Transform = editDoc?.doc?.transform ?? {}
  const ov: Overlay = editDoc?.doc?.overlay ?? {}

  /** ---------- Helper fürs sichere Mergen ---------- */
  const merge = React.useCallback((patch: Partial<{adjustments: Adjustments; hsl: HSL; transform: Transform; overlay: Overlay}>) => {
    const next = {
      adjustments: { ...(a || {}), ...(patch.adjustments ?? {}) },
      hsl:         deepMerge(hsl || {}, patch.hsl || {}),
      transform:   { ...(t || {}), ...(patch.transform ?? {}) },
      overlay:     { ...(ov || {}), ...(patch.overlay ?? {}) },
    }
    safeOnChange(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(a), JSON.stringify(hsl), JSON.stringify(t), JSON.stringify(ov), safeOnChange])

  const resetAll = () => {
    safeOnChange({
      adjustments: defaultAdjustments(),
      hsl: defaultHSL(),
      transform: { rotate: 0, flipH: false, flipV: false, scale: 1, translateX: 0, translateY: 0, aspect: 'free', fit: 'contain' } as Transform,
      overlay: { text: '', size: 24, color: '#ffffff', opacity: 60, position: 'bottom-right' } as Overlay,
    })
  }

  /** Copy/Paste & JSON Import/Export */
  const [clipboard, setClipboard] = React.useState<any | null>(null)
  const copySettings = () => setClipboard({ adjustments: a, hsl, transform: t, overlay: ov })
  const pasteSettings = () => clipboard && merge(clipboard)
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ adjustments: a, hsl, transform: t, overlay: ov }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const aTag = document.createElement('a')
    aTag.href = url
    aTag.download = `inspector-settings-${Date.now()}.json`
    aTag.click()
    URL.revokeObjectURL(url)
  }
  const importFileRef = React.useRef<HTMLInputElement>(null)
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      merge(json)
    } catch (err) {
      console.error('Import failed', err)
    } finally {
      e.target.value = ''
    }
  }

  if (!item && !effectiveKind) {
    return (
      <div className="rounded-lg border p-3 text-sm text-muted-foreground">
        Keine Auswahl. Wähle links ein Medium.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Kopfzeile */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Allgemein</h4>
            <div className="mt-1 text-xs text-muted-foreground">
              {loading ? 'Laden…' : 'Bereit'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded border px-2 py-1 text-xs hover:bg-accent" onClick={resetAll}>Reset</button>
            <button className="rounded border px-2 py-1 text-xs hover:bg-accent" onClick={copySettings}>Kopieren</button>
            <button className="rounded border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50" onClick={pasteSettings} disabled={!clipboard}>Einfügen</button>
            <button className="rounded border px-2 py-1 text-xs hover:bg-accent" onClick={exportJSON}>Export</button>
            <button className="rounded border px-2 py-1 text-xs hover:bg-accent" onClick={() => importFileRef.current?.click()}>Import</button>
            <input ref={importFileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile}/>
          </div>
        </div>

        {item && (
          <div className="mt-2 text-sm">
            <Row label="Name" value={item.name ?? selectionName ?? '—'} />
            <Row label="Typ" value={item.kind === 'image' ? 'Foto' : 'Video'} />
            <Row label="Größe" value={`${item.width ?? '—'} × ${item.height ?? '—'} px`} />
            {typeof item.durationMs === 'number' && <Row label="Dauer" value={`${Math.round(item.durationMs / 1000)} s`} />}
          </div>
        )}
      </div>

      {/* Presets */}
      <Section title="Presets">
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESETS).map((key) => (
            <button
              key={key}
              className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
              onClick={() => merge({ adjustments: PRESETS[key] })}
            >
              {key}
            </button>
          ))}
        </div>
      </Section>

      {/* Farbkorrektur */}
      <Section title="Farbkorrektur (Preview)">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Slider label="Belichtung" value={n(a.exposure)} onChange={(v)=>merge({adjustments:{exposure:v}})} />
          <Slider label="Kontrast"   value={n(a.contrast)} onChange={(v)=>merge({adjustments:{contrast:v}})} />
          <Slider label="Sättigung"  value={n(a.saturation)} onChange={(v)=>merge({adjustments:{saturation:v}})} />
          <Slider label="Vibrance"   value={n(a.vibrance)} onChange={(v)=>merge({adjustments:{vibrance:v}})} />
          <Slider label="Temperatur" value={n(a.temperature)} onChange={(v)=>merge({adjustments:{temperature:v}})} />
          <Slider label="Tint"       value={n(a.tint)} onChange={(v)=>merge({adjustments:{tint:v}})} />
          <Slider label="Highlights" value={n(a.highlights)} onChange={(v)=>merge({adjustments:{highlights:v}})} />
          <Slider label="Schatten"   value={n(a.shadows)} onChange={(v)=>merge({adjustments:{shadows:v}})} />
          <Slider label="Weißpunkte" value={n(a.whites)} onChange={(v)=>merge({adjustments:{whites:v}})} />
          <Slider label="Schwarzpkt." value={n(a.blacks)} onChange={(v)=>merge({adjustments:{blacks:v}})} />
          <Slider label="Klarheit"   value={n(a.clarity)} onChange={(v)=>merge({adjustments:{clarity:v}})} />
          <Slider label="Gamma"      value={n(a.gamma)} onChange={(v)=>merge({adjustments:{gamma:v}})} />
          <Slider label="Schärfe"    value={n(a.sharpness)} onChange={(v)=>merge({adjustments:{sharpness:v}})} />
          <Slider label="Rauschen −" value={n(a.noise)} onChange={(v)=>merge({adjustments:{noise:v}})} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Live-Vorschau per CSS; im Export in hoher Qualität. „Rauschen −“ = Entrauschen.
        </p>
      </Section>

      {/* HSL */}
      <Section title="HSL (Farbbereiche)">
        <HSLControls value={hsl} onChange={(next)=>merge({hsl: next})}/>
      </Section>

      {/* Effekte */}
      <Section title="Effekte">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Slider label="Vignette" value={n(a.vignette)} onChange={(v)=>merge({adjustments:{vignette:v}})} />
          <Slider label="Midpoint" value={n(a.vignetteMidpoint)} onChange={(v)=>merge({adjustments:{vignetteMidpoint:v}})} />
          <Slider label="Roundness" value={n(a.vignetteRoundness)} onChange={(v)=>merge({adjustments:{vignetteRoundness:v}})} />
          <Slider label="Feather" value={n(a.vignetteFeather)} onChange={(v)=>merge({adjustments:{vignetteFeather:v}})} />
          <Slider label="Blur" value={n(a.blur)} onChange={(v)=>merge({adjustments:{blur:v}})} />
          <Slider label="Film Grain" value={n(a.grain)} onChange={(v)=>merge({adjustments:{grain:v}})} />
        </div>
      </Section>

      {/* Transform / Zuschnitt */}
      <Section title="Transform & Zuschnitt">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <NumberRow label="Rotation" value={n(t.rotate)} unit="°" min={-180} max={180} onChange={(v)=>merge({transform:{rotate:v}})} />
          <NumberRow label="Skalierung" value={n(t.scale,1)} step={0.05} min={0.1} max={3} onChange={(v)=>merge({transform:{scale:v}})} />
          <NumberRow label="Verschiebung X" value={n(t.translateX)} unit="px" min={-2000} max={2000} onChange={(v)=>merge({transform:{translateX:v}})} />
          <NumberRow label="Verschiebung Y" value={n(t.translateY)} unit="px" min={-2000} max={2000} onChange={(v)=>merge({transform:{translateY:v}})} />
          <SelectRow
            label="Seitenverhältnis"
            value={t.aspect ?? 'free'}
            options={['free','1:1','4:5','3:2','16:9','9:16']}
            onChange={(v)=>merge({transform:{aspect: v as Transform['aspect']}})}
          />
          <SelectRow
            label="Bildanpassung"
            value={t.fit ?? 'contain'}
            options={['contain','cover']}
            onChange={(v)=>merge({transform:{fit: v as Transform['fit']}})}
          />
          <Toggle label="Horizontal spiegeln" checked={!!t.flipH} onChange={(v)=>merge({transform:{flipH:v}})} />
          <Toggle label="Vertikal spiegeln" checked={!!t.flipV} onChange={(v)=>merge({transform:{flipV:v}})} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Zuschnitt/Transform wird beim Export/Render angewandt.</p>
      </Section>

      {/* Overlay / Wasserzeichen */}
      <Section title="Overlay / Wasserzeichen">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <TextRow label="Text" value={ov.text ?? ''} onChange={(v)=>merge({overlay:{text:v}})} />
          <NumberRow label="Größe" value={n(ov.size,24)} unit="px" min={8} max={200} onChange={(v)=>merge({overlay:{size:v}})} />
          <ColorRow label="Farbe" value={ov.color ?? '#ffffff'} onChange={(v)=>merge({overlay:{color:v}})} />
          <NumberRow label="Deckkraft" value={n(ov.opacity,60)} unit="%" min={0} max={100} onChange={(v)=>merge({overlay:{opacity:v}})} />
          <SelectRow
            label="Position"
            value={ov.position ?? 'bottom-right'}
            options={['top-left','top-right','center','bottom-left','bottom-right']}
            onChange={(v)=>merge({overlay:{position: v as Overlay['position']}})}
          />
        </div>
      </Section>

      {/* Video-spezifisch */}
      {(item?.kind === 'video' || effectiveKind === 'video') && (
        <Section title="Audio (Video)">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <NumberRow label="Lautstärke" value={80} min={0} max={200} onChange={()=>{}} />
            <Toggle label="Rauschunterdrückung" checked={true} onChange={()=>{}} />
            <Toggle label="Auto-Ducking" checked={true} onChange={()=>{}} />
            <Toggle label="Loudness-Norm." checked={true} onChange={()=>{}} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Platzhalter: Einstellungen wirken beim Export/Render (FFmpeg/AI).
          </p>
        </Section>
      )}
    </div>
  )
}

/* ================= UI-Bausteine ================= */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  )
}

function Slider({
  label, value, onChange, min = -100, max = 100, step = 1,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  const [local, setLocal] = React.useState(value)
  React.useEffect(() => setLocal(value), [value])

  return (
    <label className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range" min={min} max={max} step={step}
          value={local}
          onChange={(e)=>setLocal(clamp(Number(e.target.value), min, max))}
          onMouseUp={()=>onChange(local)}
          onTouchEnd={()=>onChange(local)}
          className="w-32"
        />
        <input
          type="number" min={min} max={max} step={step}
          value={local}
          onChange={(e)=>{ const n = clamp(Number(e.target.value), min, max); setLocal(n); onChange(n)}}
          className="w-16 rounded border bg-background px-1 py-0.5 text-right"
        />
      </div>
    </label>
  )
}

function NumberRow({
  label, value, onChange, min = -100, max = 100, step = 1, unit = '',
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  const [local, setLocal] = React.useState(value)
  React.useEffect(() => setLocal(value), [value])
  return (
    <label className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number" min={min} max={max} step={step}
          value={local}
          onChange={(e)=>{ const n = clamp(Number(e.target.value), min, max); setLocal(n); onChange(n)}}
          className="w-20 rounded border bg-background px-1 py-0.5 text-right"
        />
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </label>
  )
}

function TextRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-40 rounded border bg-background px-2 py-1 text-sm"
      />
    </label>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <input type="color" value={value} onChange={(e)=>onChange(e.target.value)} className="h-8 w-12 rounded border bg-background" />
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={(e)=>onChange(e.target.checked)} />
    </label>
  )
}

function SelectRow({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-40 rounded border bg-background px-2 py-1 text-sm"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>
  )
}

/** HSL Control-Gruppe */
function HSLControls({ value, onChange }: { value: HSL; onChange: (v: HSL) => void }) {
  const setBand = (band: keyof HSL, patch: {h?: number; s?: number; l?: number}) => {
    const next = { ...(value || {}) }
    const cur = next[band] || {}
    next[band] = { ...cur, ...patch }
    onChange(next)
  }
  const Band = ({ name }:{name: keyof HSL}) => (
    <div className="rounded-md border p-2">
      <div className="mb-1 text-xs font-semibold">{labelForBand(name)}</div>
      <Slider label="Hue" value={n(value[name]?.h)} onChange={(v)=>setBand(name,{h:v})}/>
      <Slider label="Sat" value={n(value[name]?.s)} onChange={(v)=>setBand(name,{s:v})}/>
      <Slider label="Lum" value={n(value[name]?.l)} onChange={(v)=>setBand(name,{l:v})}/>
    </div>
  )
  return (
    <div className="grid grid-cols-2 gap-2">
      <Band name="red" />
      <Band name="orange" />
      <Band name="yellow" />
      <Band name="green" />
      <Band name="aqua" />
      <Band name="blue" />
      <Band name="purple" />
      <Band name="magenta" />
    </div>
  )
}

/* ================= Utils ================= */

function n(v: unknown, d = 0) {
  const x = Number(v)
  return Number.isFinite(x) ? x : d
}
function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x))
}
function labelForBand(k: keyof HSL) {
  const map: Record<keyof HSL,string> = {
    red:'Rot', orange:'Orange', yellow:'Gelb', green:'Grün', aqua:'Aqua', blue:'Blau', purple:'Violett', magenta:'Magenta'
  }
  return map[k]
}
function deepMerge<T extends object>(base: T, patch: Partial<T>): T {
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) }
  for (const [k, v] of Object.entries(patch || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge((base as any)[k] ?? {}, v as any)
    } else {
      out[k] = v
    }
  }
  return out
}
function defaultAdjustments(): Adjustments {
  return {
    exposure: 0, contrast: 0, saturation: 0, vibrance: 0, temperature: 0, tint: 0,
    highlights: 0, shadows: 0, whites: 0, blacks: 0, clarity: 0, sharpness: 0, noise: 0, gamma: 0,
    vignette: 0, vignetteMidpoint: 50, vignetteRoundness: 0, vignetteFeather: 50, blur: 0, grain: 0,
  }
}
function defaultHSL(): HSL {
  return { red:{}, orange:{}, yellow:{}, green:{}, aqua:{}, blue:{}, purple:{}, magenta:{} }
}
