'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Wand2, Sparkles, SlidersHorizontal, Star, StarOff, Loader2,
  ImagePlus, History, Settings, ExternalLink, Tags, Cog, Copy, PlayCircle, FolderOpen
} from 'lucide-react'
import { useRenderJob } from '@/components/creator/media-studio/hooks/useRenderJob'

type Props = {
  sessionId: string
  userId: string
  imageUrl: string
  onRemixDone?: () => void
}

type Preset = {
  id: string
  label: string
  base: string
  negative?: string
  defaults?: Partial<ControlsState>
  tags?: string[]
}

const PRESETS: Preset[] = [
  { id: 'travel-style', label: 'Reisestil · Postkarte', base: 'travel postcard aesthetic, vibrant colors, subtle film grain, tasteful typography overlay, shallow depth of field', negative: 'low quality, jpeg artifacts, extra limbs, deformed, watermark, text logo', tags: ['travel','postcard','grain'], defaults: { cfg: 7.5, strength: 0.5, size: '1024x1024' } },
  { id: 'cinematic', label: 'Cinematic · Teal/Orange', base: 'cinematic, teal & orange color grade, high contrast, dramatic lighting, movie still, 35mm', negative: 'flat lighting, overexposed, underexposed, blurry', tags: ['cinematic','film'], defaults: { cfg: 8, strength: 0.6 } },
  { id: 'bright-retouch', label: 'Helle Retusche · Clean', base: 'high key lighting, soft glow, skin retouch, clean and crisp, minimal shadows', negative: 'over-smooth, plastic skin, washed out', tags: ['retouch','bright'], defaults: { cfg: 6.5, strength: 0.45 } },
  { id: 'ad-banner', label: 'Werbeformat · Bold', base: 'commercial ad look, bold typography space, high clarity, product focus, punchy colors', negative: 'cluttered, low resolution, noisy', tags: ['ad','product'], defaults: { cfg: 7, strength: 0.55, size: '1024x1024' } },
  { id: 'watercolor', label: 'Aquarell · Künstlerisch', base: 'watercolor painting, textured paper, soft bleed edges, hand-painted look', negative: 'photorealistic, hard edges, glossy', tags: ['art','watercolor'], defaults: { cfg: 9, strength: 0.75 } },
  { id: 'film-noir', label: 'Film Noir · Monochrom', base: 'film noir, black and white, hard shadows, smoky atmosphere, 1940s cinema', negative: 'color, modern, flat lighting', tags: ['noir','mono'], defaults: { cfg: 8.5, strength: 0.6 } },
]

type ControlsState = {
  presetId: string
  negativeOn: boolean
  cfg: number
  strength: number
  batch: number
  size: '1024x1024' | '768x1344' | '1344x768' | '512x512'
  model: 'auto' | 'v1'
}

const DEFAULTS: ControlsState = {
  presetId: PRESETS[0].id,
  negativeOn: true,
  cfg: 7.5,
  strength: 0.55,
  batch: 1,
  size: '1024x1024',
  model: 'auto',
}

function buildPrompt(userPrompt: string, p: Preset, negativeOn: boolean) {
  const main = [p.base, userPrompt.trim()].filter(Boolean).join(', ')
  const negative = negativeOn && p.negative ? p.negative : undefined
  return { main, negative }
}

export default function ImageRemixForm({ sessionId, userId, imageUrl, onRemixDone }: Props) {
  const [prompt, setPrompt] = useState('')
  const [controls, setControls] = useState<ControlsState>(() => {
    const d = { ...DEFAULTS }
    const p = PRESETS.find(x => x.id === d.presetId)!
    return { ...d, ...(p.defaults || {}) }
  })
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('ms:preset:favs') || '[]') } catch { return [] }
  })
  const [history, setHistory] = useState<Array<{ id: string; prompt: string; presetId: string; at: number }>>(() => {
    try { return JSON.parse(localStorage.getItem('ms:remix:history') || '[]') } catch { return [] }
  })

  const [remixing, setRemixing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<Array<{ url: string; storagePath?: string; signed?: string }>>([])

  const { job, error: renderError, start: startRender } = useRenderJob()

  const activePreset = useMemo(() => PRESETS.find(p => p.id === controls.presetId)!, [controls.presetId])
  const canRun = useMemo(
    () => !!imageUrl && !remixing && (prompt.trim().length > 0 || !!activePreset),
    [imageUrl, remixing, prompt, activePreset]
  )

  useEffect(() => {
    localStorage.setItem('ms:preset:favs', JSON.stringify(favorites))
  }, [favorites])
  useEffect(() => {
    localStorage.setItem('ms:remix:history', JSON.stringify(history.slice(0, 20)))
  }, [history])

  const applyPreset = (id: string) => {
    const p = PRESETS.find(x => x.id === id)!
    setControls(c => ({ ...c, presetId: id, ...(p.defaults || {}) }))
  }

  const handleRemix = useCallback(async () => {
    if (!canRun) return
    setRemixing(true)
    setError(null)
    setPreviews([])
    setStatus('Sende an KI …')

    try {
      const { main, negative } = buildPrompt(prompt, activePreset, controls.negativeOn)
      const batch = Math.max(1, Math.min(controls.batch, 4))
      const outs: Array<{ url: string; storagePath?: string; signed?: string }> = []

      for (let i = 0; i < batch; i++) {
        setStatus(`KI-Generierung ${i + 1}/${batch} …`)
        const res = await fetch('/api/remix-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            prompt: main,
            negative_prompt: negative,
            size: controls.size,
            cfg: controls.cfg,
            strength: controls.strength,
            model: controls.model,
            store: 'server',
            dedupe: true,
          }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Remix fehlgeschlagen')

        if (json?.signed_url && json?.path) {
          const storagePath = `${'media-renders'}/${json.path}`
          outs.push({ url: json.signed_url as string, signed: json.signed_url, storagePath })

          const tags = Array.from(new Set([...(activePreset.tags || []), 'ai', 'remix']))
          const insertPayload: any = {
            session_id: sessionId,
            user_id: userId,
            image_url: storagePath,
            is_ai_generated: true,
            description: main,
            tags,
          }
          const { error: insErr } = await supabase.from('session_media').insert(insertPayload)
          if (insErr) throw insErr
        } else if (typeof json?.image_url === 'string') {
          outs.push({ url: json.image_url as string })
        } else {
          throw new Error('Unerwartete Antwort vom Server')
        }
      }

      setPreviews(outs)
      setHistory(h => [{ id: uuidv4(), prompt: [activePreset.label, prompt.trim()].filter(Boolean).join(' · '), presetId: activePreset.id, at: Date.now() }, ...h].slice(0, 20))
      setStatus('Fertig 🎉')
      setTimeout(() => setStatus(null), 1800)
      setPrompt('')
      onRemixDone?.()

      try {
        window.dispatchEvent(new CustomEvent('assets:refresh', { detail: { sessionId } }))
      } catch {}
    } catch (e: any) {
      setError(e?.message || 'Unbekannter Fehler')
      setStatus(null)
    } finally {
      setRemixing(false)
    }
  }, [canRun, prompt, activePreset, controls, imageUrl, sessionId, userId, onRemixDone])

  const openInAssets = (path?: string) => {
    if (!path) return
    try { window.dispatchEvent(new CustomEvent('assets:highlight', { detail: { path, sessionId } })) } catch {}
  }

  const tagAsProxy = async (path?: string) => {
    if (!path) return
    const { error: updErr } = await supabase
      .from('session_media')
      .update({ tags: ['ai','remix','proxy'] })
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('image_url', path)
    if (updErr) setError(updErr.message)
    else try { window.dispatchEvent(new CustomEvent('assets:refresh', { detail: { sessionId } })) } catch {}
  }

  const copyLink = async (url: string) => {
    try { await navigator.clipboard.writeText(url); setStatus('Link kopiert'); setTimeout(() => setStatus(null), 1500) } catch {}
  }

  const doRender = async (path?: string) => {
    if (!path) return
    try {
      await startRender({
        sessionId,
        jobType: 'photo',
        sourcePath: path,
        options: { preset: activePreset.id, cfg: controls.cfg, strength: controls.strength, size: controls.size },
      })
    } catch {}
  }

  return (
    <div className="rounded border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          <h4 className="text-sm font-medium">Bild remixen</h4>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Settings className="h-3.5 w-3.5" /> {controls.model}</span>
          <span className="inline-flex items-center gap-1"><ImagePlus className="h-3.5 w-3.5" /> {previews.length || 0}</span>
          <span className="inline-flex items-center gap-1"><History className="h-3.5 w-3.5" /> {history.length}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && canRun) { e.preventDefault(); void handleRemix() } }}
          placeholder="Motiv/Änderung – z. B. „als Aquarell, Retro-Look“"
          disabled={remixing}
          className="sm:flex-1"
          aria-label="Remix-Prompt"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="sm:w-56 inline-flex items-center justify-between">
              <span className="truncate flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {PRESETS.find(p => p.id === controls.presetId)?.label}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Presets</DropdownMenuLabel>
            {PRESETS.map(p => (
              <DropdownMenuItem key={p.id} onClick={() => applyPreset(p.id)} className="flex items-center justify-between gap-2">
                <span className="truncate">{p.label}</span>
                <Button
                  type="button"
                  variant="ghost" size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFavorites(f => f.includes(p.id) ? f.filter(x => x !== p.id) : [...f, p.id])
                  }}
                  title="Als Favorit speichern/entfernen"
                >
                  {favorites.includes(p.id) ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                </Button>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setControls(c => ({ ...DEFAULTS }))}>Zurücksetzen</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={handleRemix} disabled={!canRun} className="sm:w-44">
          {remixing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Remixe …</>) : 'Remix starten'}
        </Button>
      </div>

      <div className="rounded-md border bg-background p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Feineinstellungen
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <LabeledSlider label="Strength" min={0.1} max={1} step={0.05} value={controls.strength}
            onChange={(v) => setControls(c => ({ ...c, strength: v }))} />
          <LabeledSlider label="Guidance (CFG)" min={1} max={12} step={0.5} value={controls.cfg}
            onChange={(v) => setControls(c => ({ ...c, cfg: v }))} />
          <LabeledSlider label="Batch" min={1} max={4} step={1} value={controls.batch}
            onChange={(v) => setControls(c => ({ ...c, batch: v }))} integer />
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs mb-1 block">Größe</label>
            <select
              value={controls.size}
              onChange={(e) => setControls(c => ({ ...c, size: e.target.value as any }))}
              className="w-full h-9 rounded-md border px-2 text-sm bg-background"
            >
              <option value="1024x1024">Quadrat · 1024</option>
              <option value="768x1344">Portrait · 768×1344</option>
              <option value="1344x768">Landscape · 1344×768</option>
              <option value="512x512">Quadrat · 512</option>
            </select>
          </div>

          <div>
            <label className="text-xs mb-1 block">Modell</label>
            <select
              value={controls.model}
              onChange={(e) => setControls(c => ({ ...c, model: e.target.value as any }))}
              className="w-full h-9 rounded-md border px-2 text-sm bg-background"
            >
              <option value="auto">Auto</option>
              <option value="v1">v1</option>
            </select>
          </div>

          <div className="flex items-center gap-2 mt-5 sm:mt-7">
            <Checkbox
              checked={controls.negativeOn}
              onCheckedChange={(v) => setControls(c => ({ ...c, negativeOn: !!v }))}
              id="neg"
            />
            <label htmlFor="neg" className="text-xs">Negative Prompt des Presets verwenden</label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">{status ?? (remixing ? '…' : 'Bereit')}</div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-destructive">{error}</span>}
          {renderError && <span className="text-xs text-destructive">{renderError}</span>}
          {job && (
            <span className="text-xs inline-flex items-center gap-2 rounded-md border px-2 py-1">
              <Cog className="h-3.5 w-3.5 animate-spin" />
              {job.status} · {job.progress ?? 0}%
              {job.result_url && <a className="inline-flex items-center gap-1 underline ml-2" href={job.result_url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Download
              </a>}
            </span>
          )}
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {previews.map((p, i) => (
            <div key={i} className="rounded-md border overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.signed ?? p.url} alt={`Remix ${i + 1}`} className="w-full h-40 object-cover" />
              <div className="flex items-center justify-between gap-1 p-2">
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => openInAssets(p.storagePath)}>
                  <FolderOpen className="h-3.5 w-3.5 mr-1" /> Assets
                </Button>
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => tagAsProxy(p.storagePath)}>
                  <Tags className="h-3.5 w-3.5 mr-1" /> Proxy
                </Button>
                <Button size="sm" className="h-8 px-2" onClick={() => doRender(p.storagePath)}>
                  <PlayCircle className="h-3.5 w-3.5 mr-1" /> Render
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => copyLink(p.signed ?? p.url)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.filter(p => favorites.includes(p.id)).slice(0, 6).map(p => (
          <button key={p.id} onClick={() => applyPreset(p.id)} className="text-xs rounded-md border px-2 py-1 hover:bg-accent" title="Favorit anwenden">
            ⭐ {p.label}
          </button>
        ))}
      </div>

      {history.length > 0 && (
        <details className="rounded-md border p-3">
          <summary className="text-sm cursor-pointer">Verlauf (lokal, letzte {history.length})</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {history.map(h => {
              const p = PRESETS.find(x => x.id === h.presetId)
              return (
                <li key={h.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate"><span className="text-muted-foreground">{p?.label}</span> – {h.prompt}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(h.at).toLocaleString()}</div>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { setPrompt(h.prompt); if (p) applyPreset(p.id) }}
                    className="shrink-0"
                  >
                    Wiederverwenden
                  </Button>
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </div>
  )
}

function LabeledSlider({
  label, min, max, step, value, onChange, integer,
}: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; integer?: boolean }) {
  const fmt = step >= 1 ? 0 : 2
  return (
    <div>
      <label className="flex items-center justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{integer ? Math.round(value) : value.toFixed(fmt)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const n = parseFloat(e.currentTarget.value)
          onChange(integer ? Math.round(n) : n)
        }}
        className="w-full"
      />
    </div>
  )
}
