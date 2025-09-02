// components/creator/media-studio/TextToImageGenerator.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { generateImageFromPrompt } from '@/lib/openai/generateImageFromPrompt'
import { generateImageMetadata } from '@/lib/openai/generateImageMetadata'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Wand2,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Download,
  Copy,
  Settings2,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tables, TablesInsert } from '@/types/supabase'

type MediaRow = Tables<'session_media'>
type MediaInsert = TablesInsert<'session_media'>

interface Props {
  sessionId: string
  userId: string
  className?: string
}

/* ───────────────────────── Presets & Mapping ───────────────────────── */

type StylePreset =
  | 'photorealistic'
  | 'cinematic'
  | 'travel_magazine'
  | 'aerial_drone'
  | 'watercolor'
  | 'neon_night'

type Aspect = '1:1' | '4:5' | '3:2' | '16:9'
const ASPECT_TO_SIZE: Record<Aspect, '1024x1024' | '1024x1792' | '1792x1024' | '1216x832'> = {
  '1:1': '1024x1024',
  '4:5': '1024x1792', // portrait
  '3:2': '1216x832',
  '16:9': '1792x1024', // landscape
}

const STYLE_HINT: Record<StylePreset, string> = {
  photorealistic:
    'hyper-detailed, photorealistic travel photography, natural lighting, shallow depth of field, realistic textures',
  cinematic:
    'cinematic travel still, highly dynamic range, anamorphic bokeh, dramatic lighting, subtle film grain',
  travel_magazine:
    'editorial travel magazine cover, clean composition, balanced colors, premium look, minimal clutter',
  aerial_drone: 'drone aerial shot, high altitude, sweeping landscape, crisp geometry, wide angle',
  watercolor: 'watercolor painting, soft washes, delicate gradients, charming illustration',
  neon_night: 'vibrant neon night scene, reflections, rich contrast, atmospheric glow',
}

const QUICK_SNIPPETS = [
  'Sonnenaufgang über den Alpen, Nebel im Tal, Weitwinkel',
  'Historische Altstadtgasse in Lissabon, golden hour, Kopfsteinpflaster',
  'Drohnenaufnahme einer türkisen Lagune, Sandbank, Menschen in der Ferne',
  'Nordlichter über verschneiten Bergen, klare Luft, Sterne sichtbar',
]

/* ───────────────────────── Component ───────────────────────── */

export default function TextToImageGenerator({ sessionId, userId, className }: Props) {
  // Core state
  const [prompt, setPrompt] = React.useState('')
  const [negPrompt, setNegPrompt] = React.useState('low quality, blurry, distorted, watermark, text artifacts')
  const [count, setCount] = React.useState(2)
  const [style, setStyle] = React.useState<StylePreset>('photorealistic')
  const [aspect, setAspect] = React.useState<Aspect>('4:5')
  const [seed, setSeed] = React.useState<string>('')
  const [busy, setBusy] = React.useState(false)
  const [results, setResults] = React.useState<MediaRow[]>([])
  const [history, setHistory] = React.useState<MediaRow[]>([])
  const [progress, setProgress] = React.useState({ done: 0, total: 0 })
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  // Options
  const [hdQuality, setHdQuality] = React.useState(true) // gibt generateImageFromPrompt nur als Hint weiter
  const [retryOnFail, setRetryOnFail] = React.useState(true)
  const [persistSettings, setPersistSettings] = React.useState(true)

  // Persist last used
  React.useEffect(() => {
    // load
    try {
      const raw = localStorage.getItem('ti-gen-settings')
      if (raw) {
        const s = JSON.parse(raw)
        if (s.style) setStyle(s.style)
        if (s.aspect) setAspect(s.aspect)
        if (typeof s.count === 'number') setCount(Math.max(1, Math.min(4, s.count)))
        if (typeof s.hdQuality === 'boolean') setHdQuality(s.hdQuality)
        if (typeof s.retryOnFail === 'boolean') setRetryOnFail(s.retryOnFail)
        if (typeof s.negPrompt === 'string') setNegPrompt(s.negPrompt)
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    if (!persistSettings) return
    try {
      localStorage.setItem(
        'ti-gen-settings',
        JSON.stringify({ style, aspect, count, hdQuality, retryOnFail, negPrompt })
      )
    } catch {}
  }, [style, aspect, count, hdQuality, retryOnFail, negPrompt, persistSettings])

  // Load last AI renders for this session
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('session_media')
        .select('id, image_url, description, created_at, is_ai_generated')
        .eq('session_id', sessionId)
        .eq('is_ai_generated', true)
        .order('created_at', { ascending: false })
        .limit(24)

      if (!cancelled && !error) setHistory((data || []) as MediaRow[])
    })()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  /* ───────────────────────── Helpers ───────────────────────── */

  const composePrompt = React.useCallback(() => {
    const base = prompt.trim()
    if (!base) return ''
    const styleText = STYLE_HINT[style]
    const ratioText =
      aspect === '1:1'
        ? 'square 1:1'
        : aspect === '4:5'
        ? 'portrait 4:5'
        : aspect === '3:2'
        ? 'landscape 3:2'
        : 'ultra wide 16:9'

    const neg = negPrompt.trim()
    const seedHint = seed ? ` seed:${seed}` : ''

    return `${base}. Style: ${styleText}. Aspect: ${ratioText}. ${
      hdQuality ? 'high detail, premium quality.' : ''
    } ${neg ? `Avoid: ${neg}.` : ''}${seedHint}`.replace(/\s+/g, ' ').trim()
  }, [prompt, style, aspect, negPrompt, hdQuality, seed])

  const normalizeUrl = (u: any): string => {
    if (!u) return ''
    if (typeof u === 'string') return u
    if (u?.url) return String(u.url)
    return ''
  }

  const insertMedia = async (url: string): Promise<MediaRow | null> => {
    const payload: MediaInsert = {
      session_id: sessionId,
      user_id: userId,
      image_url: url,
      // nur Felder setzen, die sicher existieren
      is_ai_generated: true as any,
    }
    const { data, error } = await supabase.from('session_media').insert(payload).select().maybeSingle()
    if (error) {
      console.error(error)
      toast.error('Bild konnte nicht gespeichert werden.')
      return null
    }
    return (data as MediaRow) || null
  }

  const enrichMetadata = async (row: MediaRow) => {
    try {
      const meta = await generateImageMetadata(row.image_url)
      const update: Partial<MediaRow> = {}
      if (meta?.description) (update as any).description = meta.description
      if (meta?.tags) (update as any).tags = meta.tags
      if (Object.keys(update).length > 0) {
        await supabase.from('session_media').update(update).eq('id', row.id)
      }
    } catch (e) {
      console.warn('generateImageMetadata failed', e)
    }
  }

  const downloadImage = async (url: string, name: string) => {
    try {
      const res = await fetch(url, { mode: 'cors' })
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      // Fallback: direct link open
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  /* ───────────────────────── Generate ───────────────────────── */

  const runOnce = async (finalPrompt: string, sizeHint: string) => {
    // second arg als "any", falls helper eine Options-Signatur unterstützt
    const res = await (generateImageFromPrompt as any)(finalPrompt, {
      size: sizeHint,
      quality: hdQuality ? 'high' : 'standard',
    })
    const url = normalizeUrl(res)
    if (!url) throw new Error('Kein Bild-URL erhalten')
    const saved = await insertMedia(url)
    if (!saved) throw new Error('Insert fehlgeschlagen')
    setResults((r) => [saved, ...r])
    void enrichMetadata(saved)
  }

  const handleGenerate = async () => {
    const finalPrompt = composePrompt()
    if (!finalPrompt) return

    const total = Math.max(1, Math.min(4, count))
    setBusy(true)
    setResults([])
    setProgress({ done: 0, total })

    const sizeHint = ASPECT_TO_SIZE[aspect]

    for (let i = 0; i < total; i++) {
      try {
        await runOnce(finalPrompt, sizeHint)
      } catch (e) {
        console.error(e)
        if (retryOnFail) {
          // einmaliger Retry pro Bild
          try {
            await runOnce(finalPrompt, sizeHint)
          } catch {
            toast.error('Ein Bild konnte nicht erzeugt werden.')
          }
        } else {
          toast.error('Ein Bild konnte nicht erzeugt werden.')
        }
      } finally {
        setProgress((p) => ({ ...p, done: Math.min(p.done + 1, p.total) }))
      }
    }

    // Historie auffrischen
    const { data } = await supabase
      .from('session_media')
      .select('id, image_url, description, created_at, is_ai_generated')
      .eq('session_id', sessionId)
      .eq('is_ai_generated', true)
      .order('created_at', { ascending: false })
      .limit(24)
    setHistory((data || []) as MediaRow[])

    setBusy(false)
    toast.success('Generierung abgeschlossen.')
  }

  const onKeyDownPrompt: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !busy) {
      e.preventDefault()
      void handleGenerate()
    }
  }

  /* ───────────────────────── UI ───────────────────────── */

  return (
    <div className={cn('space-y-5 rounded-2xl border bg-card p-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> KI-Bildgenerator
        </h3>
        {busy ? (
          <span className="text-xs text-muted-foreground">
            {progress.done}/{progress.total} erzeugt …
          </span>
        ) : null}
      </div>

      {/* Prompt */}
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="ti-prompt">Beschreibung</Label>
          <Textarea
            id="ti-prompt"
            value={prompt}
            onChange={(e: any) => setPrompt(typeof e === 'string' ? e : e?.target?.value ?? '')}
            onKeyDown={onKeyDownPrompt}
            placeholder="z. B. Goldene Stunde am Strand von Koh Lipe, Thailand – ruhiges Meer, Palmen, feiner Sand"
            rows={4}
            disabled={busy}
          />
          <div className="flex flex-wrap gap-2">
            {QUICK_SNIPPETS.map((s, i) => (
              <Button
                key={i}
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setPrompt((p) => (p ? `${p}\n${s}` : s))}
                disabled={busy}
              >
                + {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ti-neg">Negativ-Prompt (zu vermeiden)</Label>
          <Input
            id="ti-neg"
            value={negPrompt}
            onChange={(e) => setNegPrompt(e.target.value)}
            placeholder="low quality, watermark, text artifacts…"
            disabled={busy}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Stil</Label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STYLE_HINT) as StylePreset[]).map((s) => (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={style === s ? 'default' : 'outline'}
                onClick={() => setStyle(s)}
                disabled={busy}
              >
                {({
                  photorealistic: 'Fotorealistisch',
                  cinematic: 'Cinematic',
                  travel_magazine: 'Magazin',
                  aerial_drone: 'Drohne',
                  watercolor: 'Aquarell',
                  neon_night: 'Neon/Nacht',
                } as Record<StylePreset, string>)[s]}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Seitenverhältnis</Label>
          <div className="flex flex-wrap gap-1.5">
            {(['1:1', '4:5', '3:2', '16:9'] as Aspect[]).map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant={aspect === r ? 'default' : 'outline'}
                onClick={() => setAspect(r)}
                disabled={busy}
              >
                {r}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ti-count">Anzahl</Label>
          <div className="flex items-center gap-2">
            <Input
              id="ti-count"
              type="number"
              min={1}
              max={4}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(4, Number(e.target.value || 1))))}
              className="w-24"
              disabled={busy}
            />
            <Input
              placeholder="Seed (optional)"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="w-40"
              disabled={busy}
            />
          </div>
        </div>
      </div>

      {/* Advanced options */}
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <Settings2 className="mr-2 h-4 w-4" />
              Optionen
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Qualität & Verhalten</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={hdQuality}
              onCheckedChange={(v) => setHdQuality(!!v)}
            >
              Hochauflösend bevorzugen
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={retryOnFail}
              onCheckedChange={(v) => setRetryOnFail(!!v)}
            >
              Retry bei Fehlschlag
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={persistSettings}
              onCheckedChange={(v) => setPersistSettings(!!v)}
            >
              Einstellungen merken
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Shortcuts</DropdownMenuLabel>
            <div className="px-2 pb-2 text-xs text-muted-foreground">
              <kbd className="rounded bg-muted px-1 py-0.5">⌘/Ctrl</kbd> +{' '}
              <kbd className="rounded bg-muted px-1 py-0.5">Enter</kbd> zum Generieren
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleGenerate} disabled={busy || !prompt.trim()} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {busy ? `Generiere … (${progress.done}/${progress.total})` : 'Bild erzeugen'}
        </Button>
        <Button variant="outline" onClick={() => setPrompt('')} disabled={busy || !prompt} className="gap-2">
          <Trash2 className="h-4 w-4" />
          Leeren
        </Button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <ImagePlus className="h-4 w-4" /> Neu generiert
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.map((m) => {
              const fileName = `jetnity-ai-${m.id.slice(0, 8)}.jpg`
              return (
                <figure key={m.id} className="group rounded-xl overflow-hidden border relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.image_url}
                    alt={(m as any).description || 'KI-Bild'}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition">
                    <Button
                      size="xs" variant="secondary"
                      onClick={() => downloadImage(m.image_url, fileName)}
                    >
                      <Download className="h-3 w-3 mr-1" /> DL
                    </Button>
                    <Button
                      size="xs" variant="secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(m.image_url)
                          setCopiedId(m.id)
                          setTimeout(() => setCopiedId(null), 1200)
                        } catch {}
                      }}
                    >
                      {copiedId === m.id ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copy
                    </Button>
                  </div>
                </figure>
              )
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <ImagePlus className="h-4 w-4" /> Letzte KI-Bilder dieser Session
        </h4>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine KI-Bilder vorhanden.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {history.map((m) => {
              const fileName = `jetnity-ai-${m.id.slice(0, 8)}.jpg`
              return (
                <figure key={m.id} className="rounded-xl overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.image_url}
                    alt={(m as any).description || 'KI-Bild'}
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-2 flex gap-2 justify-end">
                    <Button size="xs" variant="ghost" onClick={() => downloadImage(m.image_url, fileName)}>
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(m.image_url)
                          setCopiedId(m.id)
                          setTimeout(() => setCopiedId(null), 1200)
                        } catch {}
                      }}
                    >
                      {copiedId === m.id ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Kopieren
                    </Button>
                  </div>
                </figure>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
