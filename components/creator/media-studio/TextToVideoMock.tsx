// components/creator/media-studio/TextToVideoStudio.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  Wand2, Clapperboard, Film, Mic2, Music4, ImagePlus, Loader2, Settings2,
  Download, Clipboard, Check, Sparkles, Save, Play, RefreshCw, FileText, ListTree
} from 'lucide-react'

// OPTIONAL: falls vorhanden – KI-Bilderzeugung & Metadaten wie im Projekt...
import { generateImageFromPrompt } from '@/lib/openai/generateImageFromPrompt'
import { generateImageMetadata } from '@/lib/openai/generateImageMetadata'
import type { Tables, TablesInsert } from '@/types/supabase'
type MediaRow = Tables<'session_media'>
type MediaInsert = TablesInsert<'session_media'>

interface Props {
  sessionId: string
  userId: string
  className?: string
}

/* ───────────────────────── Types ───────────────────────── */

type Shot = {
  id: string
  prompt: string
  vo?: string
  durationSec?: number
  camera?: string
  motion?: string
  location?: string
  notes?: string
  image_url?: string
}

type Scene = {
  id: string
  title: string
  summary: string
  durationSec?: number
  shots: Shot[]
  musicHint?: string
  transition?: string
}

type Storyboard = {
  title: string
  aspect: '16:9' | '9:16' | '1:1'
  fps: 24 | 25 | 30
  style: 'cinematic' | 'travel_magazine' | 'vlog' | 'documentary'
  scenes: Scene[]
}

const ASPECT_TO_SIZE: Record<Storyboard['aspect'], '1792x1024' | '1024x1792' | '1024x1024'> = {
  '16:9': '1792x1024',
  '9:16': '1024x1792',
  '1:1': '1024x1024',
}

const STYLE_HINT: Record<Storyboard['style'], string> = {
  cinematic:
    'cinematic grade, rich contrast, anamorphic bokeh, golden hour, premium travel film look, realistic textures',
  travel_magazine:
    'editorial magazine visuals, clean composition, balanced colors, premium travel lifestyle',
  vlog:
    'handheld feel, natural lighting, authentic travel vlog aesthetic, slight motion blur, real-life vibe',
  documentary:
    'documentary clarity, natural palette, grounded look, crisp details, informative tone',
}

const PRESETS = [
  {
    name: 'City Guide (3 Szenen)',
    script: `Kurzer City Guide über Barcelona: Anreise, Altstadt/La Rambla, Strand Barceloneta. Tipps: Tapas, öffentliche Verkehrsmittel, beste Zeit.`,
  },
  {
    name: 'Food Tour (4 Szenen)',
    script: `Food Tour Lissabon: Pastéis de Belém, Time Out Market, Bacalhau-Gerichte, Rooftop-Bar zum Sonnenuntergang. Fokus auf Geschmack & Atmosphäre.`,
  },
  {
    name: 'Weekend Vlog (5 Szenen)',
    script: `Wochenendtrip nach Rom: Ankunft, Kolosseum & Forum, Trastevere, Vatikan, Nachtleben. Lockerer Vlog-Stil.`,
  },
]

/* ───────────────────────── Component ───────────────────────── */

export default function TextToVideoStudio({ sessionId, userId, className }: Props) {
  const [script, setScript] = React.useState('')
  const [board, setBoard] = React.useState<Storyboard>({
    title: 'Reise-Video',
    aspect: '16:9',
    fps: 25,
    style: 'travel_magazine',
    scenes: [],
  })
  const [loading, setLoading] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState<'md' | 'json' | 'csv' | null>(null)

  // Optionen
  const [autoDurations, setAutoDurations] = React.useState(true)
  const [autoTransitions, setAutoTransitions] = React.useState(true)
  const [attachPreviews, setAttachPreviews] = React.useState(true)
  const [retryOnFail, setRetryOnFail] = React.useState(true)
  const [persist, setPersist] = React.useState(true)

  // Restore last session settings
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('tv-studio-settings')
      if (raw) {
        const s = JSON.parse(raw)
        if (s.aspect) setBoard((b) => ({ ...b, aspect: s.aspect }))
        if (s.fps) setBoard((b) => ({ ...b, fps: s.fps }))
        if (s.style) setBoard((b) => ({ ...b, style: s.style }))
        if (typeof s.autoDurations === 'boolean') setAutoDurations(s.autoDurations)
        if (typeof s.autoTransitions === 'boolean') setAutoTransitions(s.autoTransitions)
        if (typeof s.attachPreviews === 'boolean') setAttachPreviews(s.attachPreviews)
        if (typeof s.retryOnFail === 'boolean') setRetryOnFail(s.retryOnFail)
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    if (!persist) return
    try {
      localStorage.setItem(
        'tv-studio-settings',
        JSON.stringify({
          aspect: board.aspect,
          fps: board.fps,
          style: board.style,
          autoDurations,
          autoTransitions,
          attachPreviews,
          retryOnFail,
        })
      )
    } catch {}
  }, [board.aspect, board.fps, board.style, autoDurations, autoTransitions, attachPreviews, retryOnFail, persist])

  /* ───────────────────────── Helpers ───────────────────────── */

  const uid = () => crypto.randomUUID()

  const splitIntoScenes = (text: string): Scene[] => {
    // Client-seitige Heuristik als Fallback (Backend /api/storyboard kann detaillierter sein)
    const parts = text
      .split(/\n{2,}|(?:^|\.)\s+(?=[A-ZÄÖÜ])/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8)

    return parts.map((p, i) => ({
      id: uid(),
      title: `Szene ${i + 1}`,
      summary: p,
      durationSec: autoDurations ? Math.min(20, Math.max(6, Math.round(p.length / 30))) : undefined,
      shots: draftShotsFromSummary(p),
      musicHint:
        i === 0 ? 'Leicht, neugierig machend; Intro-Füllung' : i === parts.length - 1 ? 'Warm, auflösend; ruhiges Outro' : 'Positive Reisetöne',
      transition: autoTransitions ? (i === parts.length - 1 ? 'Fade to black' : 'Cross dissolve 12f') : undefined,
    }))
  }

  const draftShotsFromSummary = (summary: string): Shot[] => {
    // 2–4 Shots aus Sätzen ableiten
    const sentences = summary
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4)

    const baseCamera = ['Wide establishing', 'Medium follow', 'Close-up detail', 'POV walk']
    const baseMotion = ['slow pan', 'gentle push-in', 'handheld walk', 'static locked-off']

    return sentences.map((s, i) => ({
      id: uid(),
      prompt: s,
      vo: i === 0 ? s : undefined,
      durationSec: autoDurations ? Math.min(8, Math.max(3, Math.round(s.length / 18))) : undefined,
      camera: baseCamera[i % baseCamera.length],
      motion: baseMotion[i % baseMotion.length],
    }))
  }

  const composeImagePrompt = (shot: Shot): string => {
    const style = STYLE_HINT[board.style]
    const ratio = board.aspect === '16:9' ? 'ultra wide 16:9' : board.aspect === '9:16' ? 'portrait 9:16' : 'square 1:1'
    return `${shot.prompt}. Style: ${style}. Aspect: ${ratio}. high detail, premium quality.`.replace(/\s+/g, ' ').trim()
  }

  const saveStoryboardToSnippets = async (payload: Storyboard) => {
    try {
      const content = JSON.stringify(payload, null, 2)
      const { error } = await supabase.from('session_snippets').insert({
        session_id: sessionId,
        content,
      })
      if (error) throw error
      toast.success('Storyboard gespeichert.')
    } catch (e) {
      console.error(e)
      toast.error('Konnte Storyboard nicht speichern.')
    }
  }

  const insertPreviewStill = async (url: string, sceneIdx: number, shotIdx: number): Promise<MediaRow | null> => {
    const row: MediaInsert = {
      session_id: sessionId,
      user_id: userId,
      image_url: url,
      is_ai_generated: true as any,
      // description ist Json|string|null → wir schreiben eine kurze Kennung
      // (falls description bei euch Json ist, könnt ihr hier auch ein JSON.stringify einsetzen)
      // @ts-ignore – Feld kann unterschiedlich typisiert sein
      description: `{"type":"storyboard-still","scene":${sceneIdx},"shot":${shotIdx}}`,
    }
    const { data, error } = await supabase.from('session_media').insert(row).select().maybeSingle()
    if (error) {
      console.error(error)
      return null
    }
    return data as MediaRow
  }

  const download = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  /* ───────────────────────── Actions ───────────────────────── */

  const handleGenerate = async () => {
    const base = script.trim()
    if (!base) return
    setLoading(true)
    try {
      // Versuche Backend (reichere Logik)
      let scenes: any[] | null = null
      try {
        const res = await fetch('/api/storyboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script: base,
            aspect: board.aspect,
            style: board.style,
            fps: board.fps,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (Array.isArray(json?.scenes)) scenes = json.scenes
      } catch {
        // ignoriere – fällt auf Heuristik zurück
      }

      let nextScenes: Scene[]
      if (scenes) {
        // Normieren auf internes Format
        nextScenes = scenes.slice(0, 12).map((s: any, i: number) => ({
          id: uid(),
          title: s.title || `Szene ${i + 1}`,
          summary: s.summary || s.description || '',
          durationSec: autoDurations ? s.durationSec ?? Math.min(20, Math.max(6, Math.round((s.summary || '').length / 30))) : s.durationSec,
          shots:
            Array.isArray(s.shots) && s.shots.length
              ? s.shots.slice(0, 6).map((sh: any, j: number) => ({
                  id: uid(),
                  prompt: sh.prompt || sh.description || sh.visual || 'Visual',
                  vo: sh.vo || sh.voiceover || undefined,
                  durationSec: autoDurations ? sh.durationSec ?? Math.min(8, Math.max(3, Math.round(String(sh.prompt || '').length / 18))) : sh.durationSec,
                  camera: sh.camera || 'Wide establishing',
                  motion: sh.motion || 'slow pan',
                  location: sh.location || undefined,
                  notes: sh.notes || undefined,
                }))
              : draftShotsFromSummary(s.summary || s.description || ''),
          musicHint: s.musicHint || undefined,
          transition: autoTransitions ? s.transition ?? (i === scenes.length - 1 ? 'Fade to black' : 'Cross dissolve 12f') : s.transition,
        }))
      } else {
        // Heuristik
        nextScenes = splitIntoScenes(base)
      }

      setBoard((b) => ({ ...b, scenes: nextScenes }))
      toast.success('Storyboard erstellt!')
    } catch (e) {
      console.error(e)
      toast.error('Storyboard-Generierung fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePreviews = async () => {
    if (!board.scenes.length) return
    setBusy(true)
    const size = ASPECT_TO_SIZE[board.aspect]

    for (let i = 0; i < board.scenes.length; i++) {
      const scene = board.scenes[i]
      for (let j = 0; j < scene.shots.length; j++) {
        const shot = scene.shots[j]
        if (shot.image_url) continue
        try {
          const prompt = composeImagePrompt(shot)
          const res = await (generateImageFromPrompt as any)(prompt, { size, quality: 'high' })
          const url = typeof res === 'string' ? res : res?.url
          if (!url) throw new Error('no url')
          // optional: persistieren
          let saved: MediaRow | null = null
          if (attachPreviews) {
            saved = await insertPreviewStill(url, i, j)
            if (saved) {
              void (async () => {
                try {
                  const meta = await generateImageMetadata(saved.image_url)
                  const upd: Partial<MediaRow> = {}
                  if (meta?.description) (upd as any).description = meta.description
                  if (meta?.tags) (upd as any).tags = meta.tags
                  if (Object.keys(upd).length) await supabase.from('session_media').update(upd).eq('id', saved.id)
                } catch {}
              })()
            }
          }
          // in UI setzen
          setBoard((b) => {
            const copy = structuredClone(b) as Storyboard
            copy.scenes[i].shots[j].image_url = saved?.image_url || url
            return copy
          })
        } catch (e) {
          console.error(e)
          if (retryOnFail) {
            try {
              const prompt = composeImagePrompt(shot)
              const res = await (generateImageFromPrompt as any)(prompt, { size, quality: 'standard' })
              const url = typeof res === 'string' ? res : res?.url
              if (url) {
                let saved: MediaRow | null = null
                if (attachPreviews) saved = await insertPreviewStill(url, i, j)
                setBoard((b) => {
                  const copy = structuredClone(b) as Storyboard
                  copy.scenes[i].shots[j].image_url = saved?.image_url || url
                  return copy
                })
              }
            } catch {}
          }
        }
      }
    }

    setBusy(false)
    toast.success('Preview-Stills generiert.')
  }

  const handleSave = () => saveStoryboardToSnippets(board)

  const handleRender = async () => {
    if (!board.scenes.length) return
    try {
      setBusy(true)
      const res = await fetch('/api/video/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          storyboard: board,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (json?.jobId) {
        toast.success(`Render-Job gestartet (#${json.jobId}).`)
      } else {
        toast.message('Render-Endpoint hat keinen Job zurückgegeben – bitte später erneut versuchen.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Render konnte nicht gestartet werden.')
    } finally {
      setBusy(false)
    }
  }

  /* ───────────────────────── Exports ───────────────────────── */

  const toMarkdown = (): string => {
    const lines: string[] = []
    lines.push(`# ${board.title}`, '')
    lines.push(`*Aspect:* ${board.aspect} · *FPS:* ${board.fps} · *Style:* ${board.style}`, '')
    board.scenes.forEach((s, i) => {
      lines.push(`## Szene ${i + 1}: ${s.title}`)
      if (s.summary) lines.push(s.summary)
      if (s.durationSec) lines.push(`*Dauer:* ~${s.durationSec}s`)
      if (s.musicHint) lines.push(`*Musik:* ${s.musicHint}`)
      if (s.transition) lines.push(`*Transition:* ${s.transition}`)
      if (s.shots.length) {
        lines.push('', `### Shots`)
        s.shots.forEach((sh, j) => {
          const parts = [
            `- **${j + 1}.** ${sh.prompt}`,
            sh.vo ? `  - VO: "${sh.vo}"` : '',
            sh.camera ? `  - Kamera: ${sh.camera}` : '',
            sh.motion ? `  - Bewegung: ${sh.motion}` : '',
            sh.location ? `  - Ort: ${sh.location}` : '',
            sh.durationSec ? `  - Dauer: ~${sh.durationSec}s` : '',
            sh.image_url ? `  - Preview: ${sh.image_url}` : '',
            sh.notes ? `  - Notizen: ${sh.notes}` : '',
          ].filter(Boolean)
          lines.push(...parts)
        })
      }
      lines.push('')
    })
    return lines.join('\n')
  }

  const toJSON = () => JSON.stringify(board, null, 2)

  const toCSV = (): string => {
    // CSV: Szene, Shot, Prompt, VO, Dauer, Kamera, Bewegung, Ort, PreviewURL
    const rows = [['scene', 'shot', 'title', 'prompt', 'vo', 'duration_sec', 'camera', 'motion', 'location', 'preview_url']]
    board.scenes.forEach((s, i) => {
      s.shots.forEach((sh, j) => {
        rows.push([
          String(i + 1),
          String(j + 1),
          s.title.replace(/"/g, '""'),
          sh.prompt.replace(/"/g, '""'),
          (sh.vo || '').replace(/"/g, '""'),
          sh.durationSec != null ? String(sh.durationSec) : '',
          (sh.camera || '').replace(/"/g, '""'),
          (sh.motion || '').replace(/"/g, '""'),
          (sh.location || '').replace(/"/g, '""'),
          sh.image_url || '',
        ])
      })
    })
    return rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  }

  const copyOut = async (kind: 'md' | 'json' | 'csv') => {
    const text = kind === 'md' ? toMarkdown() : kind === 'json' ? toJSON() : toCSV()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1400)
      toast.success('In Zwischenablage kopiert.')
    } catch {
      toast.error('Kopieren fehlgeschlagen.')
    }
  }

  const downloadOut = (kind: 'md' | 'json' | 'csv') => {
    const nameBase = board.title.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 64) || 'storyboard'
    if (kind === 'md') return download(`${nameBase}.md`, toMarkdown(), 'text/markdown')
    if (kind === 'json') return download(`${nameBase}.json`, toJSON(), 'application/json')
    return download(`${nameBase}-shotlist.csv`, toCSV(), 'text/csv')
  }

  /* ───────────────────────── UI ───────────────────────── */

  const totalShots = board.scenes.reduce((acc, s) => acc + s.shots.length, 0)

  return (
    <div className={cn('space-y-6 rounded-2xl border bg-card p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clapperboard className="h-4 w-4" />
          Text-to-Video Studio
        </h3>
        <div className="text-xs text-muted-foreground">
          {board.scenes.length ? `${board.scenes.length} Szenen · ${totalShots} Shots` : 'Bereit'}
        </div>
      </div>

      {/* Script + Presets */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium">Skript / Idee</label>
          <Textarea
            value={script}
            onChange={(e: any) => setScript(typeof e === 'string' ? e : e?.target?.value ?? '')}
            placeholder="Thema oder Skript – z. B. 'Städtetrip nach Lissabon mit Foodspots und Strand'"
            rows={5}
            disabled={loading || busy}
          />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.name}
                size="sm"
                variant="ghost"
                onClick={() => setScript(p.script)}
                disabled={loading || busy}
              >
                + {p.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Metadaten</label>
          <Input
            value={board.title}
            onChange={(e) => setBoard((b) => ({ ...b, title: e.target.value }))}
            placeholder="Titel des Videos"
            disabled={loading || busy}
          />
          <div className="grid grid-cols-3 gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm"><Film className="mr-1 h-4 w-4"/> {board.aspect}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Aspect Ratio</DropdownMenuLabel>
                {(['16:9', '9:16', '1:1'] as Storyboard['aspect'][]).map((a) => (
                  <DropdownMenuItem key={a} onClick={() => setBoard((b) => ({ ...b, aspect: a }))}>
                    {a}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm"><ListTree className="mr-1 h-4 w-4"/> {board.fps} fps</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>FPS</DropdownMenuLabel>
                {[24, 25, 30].map((f) => (
                  <DropdownMenuItem key={f} onClick={() => setBoard((b) => ({ ...b, fps: f as Storyboard['fps'] }))}>
                    {f} fps
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm"><Sparkles className="mr-1 h-4 w-4"/> {board.style}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Stil</DropdownMenuLabel>
                {(['cinematic', 'travel_magazine', 'vlog', 'documentary'] as Storyboard['style'][]).map((s) => (
                  <DropdownMenuItem key={s} onClick={() => setBoard((b) => ({ ...b, style: s }))}>
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Settings2 className="mr-1 h-4 w-4"/> Optionen</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Automatisierung</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={autoDurations} onCheckedChange={(v) => setAutoDurations(!!v)}>
                Auto-Dauern schätzen
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={autoTransitions} onCheckedChange={(v) => setAutoTransitions(!!v)}>
                Auto-Transitions
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={attachPreviews} onCheckedChange={(v) => setAttachPreviews(!!v)}>
                Previews in Supabase speichern
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={retryOnFail} onCheckedChange={(v) => setRetryOnFail(!!v)}>
                Retry bei Bildfehler
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={persist} onCheckedChange={(v) => setPersist(!!v)}>
                Einstellungen merken
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Actions (top) */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleGenerate} disabled={loading || busy || !script.trim()} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? 'Generiere …' : 'Storyboard generieren'}
        </Button>
        <Button variant="secondary" onClick={handleGeneratePreviews} disabled={busy || !board.scenes.length} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {busy ? 'Erzeuge Previews…' : 'Previews (Stills) erzeugen'}
        </Button>
        <Button variant="outline" onClick={handleSave} disabled={!board.scenes.length} className="gap-2">
          <Save className="h-4 w-4" /> Speichern
        </Button>
        <Button variant="outline" onClick={handleRender} disabled={!board.scenes.length} className="gap-2">
          <Play className="h-4 w-4" /> Render starten
        </Button>
      </div>

      {/* Scenes */}
      {!board.scenes.length ? (
        <div className="text-sm text-muted-foreground">Erstelle ein Storyboard, um die Szenen zu sehen.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {board.scenes.map((s, i) => (
            <div key={s.id} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Szene {i + 1}</div>
                <div className="text-xs text-muted-foreground">{s.shots.length} Shots{s.durationSec ? ` · ~${s.durationSec}s` : ''}</div>
              </div>
              <Input
                value={s.title}
                onChange={(e) =>
                  setBoard((b) => {
                    const copy = structuredClone(b) as Storyboard
                    copy.scenes[i].title = e.target.value
                    return copy
                  })
                }
                placeholder="Szenentitel"
              />
              <Textarea
                value={s.summary}
                onChange={(e: any) =>
                  setBoard((b) => {
                    const val = typeof e === 'string' ? e : e?.target?.value ?? ''
                    const copy = structuredClone(b) as Storyboard
                    copy.scenes[i].summary = val
                    return copy
                  })
                }
                rows={3}
                placeholder="Kurz zusammenfassen, was in der Szene passiert."
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={s.musicHint || ''}
                  onChange={(e) =>
                    setBoard((b) => {
                      const copy = structuredClone(b) as Storyboard
                      copy.scenes[i].musicHint = e.target.value
                      return copy
                    })
                  }
                  placeholder="Musik-Hinweis (optional)"
                />
                <Input
                  value={s.transition || ''}
                  onChange={(e) =>
                    setBoard((b) => {
                      const copy = structuredClone(b) as Storyboard
                      copy.scenes[i].transition = e.target.value
                      return copy
                    })
                  }
                  placeholder="Transition (z. B. Cross dissolve)"
                />
              </div>

              {/* Shots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Shots</div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setBoard((b) => {
                          const copy = structuredClone(b) as Storyboard
                          copy.scenes[i].shots.push({
                            id: crypto.randomUUID(),
                            prompt: 'Neuer Shot',
                            durationSec: 4,
                            camera: 'Medium',
                            motion: 'static',
                          })
                          return copy
                        })
                      }
                    >
                      + Shot
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setBoard((b) => {
                          const copy = structuredClone(b) as Storyboard
                          copy.scenes[i].shots = draftShotsFromSummary(copy.scenes[i].summary || '')
                          return copy
                        })
                      }
                    >
                      <RefreshCw className="h-4 w-4 mr-1" /> aus Summary
                    </Button>
                  </div>
                </div>

                {s.shots.map((sh, j) => (
                  <div key={sh.id} className="rounded-lg border p-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={sh.prompt}
                        onChange={(e) =>
                          setBoard((b) => {
                            const copy = structuredClone(b) as Storyboard
                            copy.scenes[i].shots[j].prompt = e.target.value
                            return copy
                          })
                        }
                        placeholder="Bildbeschreibung / Visual"
                      />
                      <Input
                        value={sh.vo || ''}
                        onChange={(e) =>
                          setBoard((b) => {
                            const copy = structuredClone(b) as Storyboard
                            copy.scenes[i].shots[j].vo = e.target.value
                            return copy
                          })
                        }
                        placeholder="Voiceover (optional)"
                      />
                      <Input
                        value={sh.camera || ''}
                        onChange={(e) =>
                          setBoard((b) => {
                            const copy = structuredClone(b) as Storyboard
                            copy.scenes[i].shots[j].camera = e.target.value
                            return copy
                          })
                        }
                        placeholder="Kamera"
                      />
                      <Input
                        value={sh.motion || ''}
                        onChange={(e) =>
                          setBoard((b) => {
                            const copy = structuredClone(b) as Storyboard
                            copy.scenes[i].shots[j].motion = e.target.value
                            return copy
                          })
                        }
                        placeholder="Bewegung"
                      />
                      <Input
                        value={sh.location || ''}
                        onChange={(e) =>
                          setBoard((b) => {
                            const copy = structuredClone(b) as Storyboard
                            copy.scenes[i].shots[j].location = e.target.value
                            return copy
                          })
                        }
                        placeholder="Ort (optional)"
                      />
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={sh.durationSec ?? 4}
                        onChange={(e) =>
                          setBoard((b) => {
                            const copy = structuredClone(b) as Storyboard
                            copy.scenes[i].shots[j].durationSec = Math.max(1, Math.min(30, Number(e.target.value || 4)))
                            return copy
                          })
                        }
                        placeholder="Dauer (s)"
                      />
                    </div>

                    {/* Preview / Tools */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        {sh.image_url ? 'Preview vorhanden' : 'Keine Preview'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            try {
                              const prompt = composeImagePrompt(sh)
                              const size = ASPECT_TO_SIZE[board.aspect]
                              const res = await (generateImageFromPrompt as any)(prompt, { size, quality: 'high' })
                              const url = typeof res === 'string' ? res : res?.url
                              if (!url) throw new Error('no url')
                              let saved: MediaRow | null = null
                              if (attachPreviews) saved = await insertPreviewStill(url, i, j)
                              setBoard((b) => {
                                const copy = structuredClone(b) as Storyboard
                                copy.scenes[i].shots[j].image_url = saved?.image_url || url
                                return copy
                              })
                              toast.success('Preview erstellt.')
                            } catch {
                              toast.error('Preview fehlgeschlagen.')
                            }
                          }}
                        >
                          <ImagePlus className="h-4 w-4 mr-1" /> Preview
                        </Button>
                        {sh.image_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(sh.image_url!)
                                setCopied('md') // reuse indicator
                                setTimeout(() => setCopied(null), 1200)
                              } catch {}
                            }}
                          >
                            <Clipboard className="h-4 w-4 mr-1" /> URL kopieren
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exports */}
      {board.scenes.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Export</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => downloadOut('md')}><FileText className="h-4 w-4 mr-1" /> Markdown</Button>
            <Button size="sm" onClick={() => downloadOut('json')}><Download className="h-4 w-4 mr-1" /> JSON</Button>
            <Button size="sm" onClick={() => downloadOut('csv')}><Download className="h-4 w-4 mr-1" /> Shotlist CSV</Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyOut('md')}
            >
              {copied === 'md' ? <Check className="h-4 w-4 mr-1" /> : <Clipboard className="h-4 w-4 mr-1" />}
              Markdown kopieren
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tipp: Nutze die CSV für Editoren / Spreadsheets. JSON eignet sich für automatisierte Renderpipelines.
          </p>
        </div>
      )}
    </div>
  )
}
