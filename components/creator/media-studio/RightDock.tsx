// components/creator/media-studio/RightDock.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn as _cn } from '@/lib/utils'
import {
  Sparkles,
  Copy,
  Check,
  Star,
  StarOff,
  ListChecks,
  Send,
  Wrench,
  Link as LinkIcon,
  Clipboard,
  ClipboardCheck,
  Eye,
  ExternalLink,
} from 'lucide-react'

import InspectorPanel from './InspectorPanelPro'
import RendersPanel from './RendersPanel'
import SessionRating from './SessionRating'
import PublishSessionButton from './PublishSessionButton'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type SnippetItem = { id?: string; text: string; favorite?: boolean }
type TabKey = 'inspector' | 'snippets' | 'score' | 'renders' | 'publish'

type SessionMeta = {
  status?: string | null
  visibility?: 'public' | 'unlisted' | 'private' | null
  published_at?: string | null
}

type TabDef = {
  key: TabKey
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

const TABS: TabDef[] = [
  { key: 'inspector', label: 'Inspector', icon: Wrench },
  { key: 'snippets', label: 'Snippets', icon: Sparkles },
  { key: 'score', label: 'Score', icon: ListChecks },
  { key: 'renders', label: 'Renders' },
  { key: 'publish', label: 'Publish', icon: Send },
]

export default function RightDock({
  userId,
  sessionId,
  title,
  content,
  kind = 'photo',
}: {
  userId: string
  sessionId: string | null
  title: string
  content: string
  kind?: 'photo' | 'video' | 'none'
}) {
  const [tab, setTab] = useState<TabKey>('inspector')
  const tabListRef = useRef<HTMLDivElement | null>(null)

  // ── Snippets
  const [prompt, setPrompt] = useState(
    'Formuliere 5 knackige Bild-/Videobeschreibungen mit passenden Hashtags.'
  )
  const [genBusy, setGenBusy] = useState(false)
  const [snippets, setSnippets] = useState<SnippetItem[]>([])
  const [filter, setFilter] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredSnippets = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return snippets
    return snippets.filter((s) => s.text.toLowerCase().includes(q))
  }, [snippets, filter])

  const generateSnippets = useCallback(async () => {
    setGenBusy(true)
    try {
      const res = await fetch('/api/media/snippets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          mode: 'snippets',
          title,
          content,
          prompt,
          count: 5,
          locale: 'de',
        }),
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => '')
        throw new Error(msg || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const list: string[] = Array.isArray(data?.snippets) ? data.snippets : []
      setSnippets(list.map((t) => ({ text: t })))
    } catch (e) {
      console.error('[RightDock] generateSnippets error:', e)
    } finally {
      setGenBusy(false)
    }
  }, [title, content, prompt])

  const toggleFavorite = useCallback(
    async (idx: number) => {
      const s = snippets[idx]
      const next = [...snippets]
      next[idx] = { ...s, favorite: !s.favorite }
      setSnippets(next)
      if (!sessionId || !next[idx].favorite) return
      try {
        await supabase.from('session_snippets').insert({
          session_id: sessionId,
          content: s.text,
        })
      } catch {
        /* noop */
      }
    },
    [snippets, sessionId]
  )

  const copySnippet = useCallback(
    async (idx: number) => {
      const text = snippets[idx]?.text ?? ''
      if (!text) return
      await navigator.clipboard.writeText(text)
      setCopiedId(String(idx))
      setTimeout(() => setCopiedId(null), 1200)
    },
    [snippets]
  )

  // ── Score / Storytext
  const [storyText, setStoryText] = useState<string>(content ?? '')

  useEffect(() => {
    let alive = true
    if (sessionId) {
      ;(async () => {
        const { data } = await supabase
          .from('session_snippets')
          .select('content')
          .eq('session_id', sessionId)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true })
        if (!alive) return
        const text = (data ?? [])
          .map((s) => s.content ?? '')
          .filter(Boolean)
          .join('\n')
        setStoryText(text || content || '')
      })()
    } else {
      setStoryText(content || '')
    }
    return () => {
      alive = false
    }
  }, [sessionId, content])

  // ── Meta (Publish)
  const [meta, setMeta] = useState<SessionMeta>({})
  useEffect(() => {
    let alive = true
    if (!sessionId) {
      setMeta({})
      return
    }
    ;(async () => {
      const { data } = await supabase
        .from('creator_sessions')
        .select('status,visibility,published_at')
        .eq('id', sessionId)
        .single()
      if (!alive) return
      setMeta({
        status: (data as any)?.status ?? null,
        visibility: (data as any)?.visibility ?? null,
        published_at: (data as any)?.published_at ?? null,
      })
    })()
    return () => {
      alive = false
    }
  }, [sessionId])

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !sessionId) return ''
    return `${window.location.origin}/story/${sessionId}`
  }, [sessionId])

  // ── Tabs: roving focus
  const currentIndex = TABS.findIndex((t) => t.key === tab)
  const onTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const delta = e.key === 'ArrowRight' ? 1 : -1
    const next = (currentIndex + delta + TABS.length) % TABS.length
    setTab(TABS[next].key)
    const btns = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    btns?.[next]?.focus()
  }

  // ── UI
  return (
    <div className="flex h-full flex-col">
      {/* Tabs */}
      <div
        ref={tabListRef}
        className="flex flex-wrap items-center gap-1 border-b bg-background/50 px-3 pt-2"
        role="tablist"
        aria-label="Media Studio Panels"
        onKeyDown={onTabKeyDown}
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key
          const id = `rd-tab-${key}`
          const panelId = `rd-panel-${key}`
          return (
            <button
              key={key}
              id={id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(key)}
              className={cn(
                'inline-flex items-center rounded-t-md px-3 py-2 text-xs font-medium transition-colors',
                active
                  ? 'bg-background text-foreground border border-b-transparent border-border -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={label}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {label}
            </button>
          )
        })}
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {/* Inspector */}
        <section
          id="rd-panel-inspector"
          role="tabpanel"
          aria-labelledby="rd-tab-inspector"
          hidden={tab !== 'inspector'}
          className="outline-none"
        >
          {tab === 'inspector' && (
            <InspectorPanel kind={kind} selectionName={title || undefined} />
          )}
        </section>

        {/* Snippets */}
        <section
          id="rd-panel-snippets"
          role="tabpanel"
          aria-labelledby="rd-tab-snippets"
          hidden={tab !== 'snippets'}
          className="outline-none"
        >
          {tab === 'snippets' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Prompt (für {title ? `„${title}“` : 'deine Story'})
                </label>

                {/* Safe onChange: akzeptiert String ODER Event */}
                <Textarea
                  rows={3}
                  value={prompt}
                  onChange={(e: any) => {
                    const v =
                      typeof e === 'string'
                        ? e
                        : (e?.target as HTMLTextAreaElement)?.value ?? ''
                    setPrompt(v)
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={generateSnippets} isLoading={genBusy}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {genBusy ? 'Erzeuge…' : 'Snippets erzeugen'}
                  </Button>

                  {/* Safe onChange für Input */}
                  <Input
                    value={filter}
                    onChange={(e: any) => {
                      const v =
                        typeof e === 'string'
                          ? e
                          : (e?.target as HTMLInputElement)?.value ?? ''
                      setFilter(v)
                    }}
                    placeholder="Snippets filtern…"
                    className="ml-auto h-8 w-[200px]"
                  />
                </div>
              </div>

              {filteredSnippets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Noch keine Snippets. Prompt anpassen und „Snippets erzeugen“ klicken.
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredSnippets.map((s, idx) => {
                    const globalIdx = snippets.findIndex((x) => x.text === s.text)
                    const copied = String(globalIdx) === (copiedId ?? '')
                    return (
                      <li
                        key={`${s.text}-${idx}`}
                        className="rounded-lg border bg-card/60 p-2"
                      >
                        <div className="flex items-start gap-2">
                          <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">
                            {s.text}
                          </p>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => copySnippet(globalIdx)}
                              title="In Zwischenablage kopieren"
                            >
                              {copied ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant={s.favorite ? 'default' : 'outline'}
                              className="h-8 w-8"
                              onClick={() => toggleFavorite(globalIdx)}
                              title={
                                s.favorite
                                  ? 'Favorit entfernen'
                                  : 'Als Favorit speichern'
                              }
                            >
                              {s.favorite ? (
                                <Star className="h-4 w-4" />
                              ) : (
                                <StarOff className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Score */}
        <section
          id="rd-panel-score"
          role="tabpanel"
          aria-labelledby="rd-tab-score"
          hidden={tab !== 'score'}
          className="outline-none"
        >
          {tab === 'score' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Bewertung & Hinweise auf Basis deines Storytexts.
                </p>
                <span className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-xs">
                  <Eye className="h-3.5 w-3.5" />{' '}
                  {storyText ? 'Text erkannt' : 'Kein Text'}
                </span>
              </div>

              <SessionRating
                sessionId={sessionId ?? ''}
                storyText={storyText}
                existingRating={undefined}
                existingInsights={undefined}
              />
            </div>
          )}
        </section>

        {/* Renders */}
        <section
          id="rd-panel-renders"
          role="tabpanel"
          aria-labelledby="rd-tab-renders"
          hidden={tab !== 'renders'}
          className="outline-none"
        >
          {tab === 'renders' && (
            <RendersPanel userId={userId} sessionId={sessionId} />
          )}
        </section>

        {/* Publish */}
        <section
          id="rd-panel-publish"
          role="tabpanel"
          aria-labelledby="rd-tab-publish"
          hidden={tab !== 'publish'}
          className="outline-none"
        >
          {tab === 'publish' && (
            <div className="space-y-3">
              <PublishHeader meta={meta} />
              <PublishSessionButton sessionId={sessionId ?? ''} />
              <SharePanel
                sessionId={sessionId}
                shareUrl={shareUrl}
                visible={meta.visibility === 'public'}
              />
              {!sessionId && (
                <p className="text-xs text-muted-foreground">
                  Wähle zuerst links eine Session aus.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

/* ───────────────────── UI-Snippets ───────────────────── */

function PublishHeader({ meta }: { meta: SessionMeta }) {
  const status = (meta.status ?? 'draft').toString()
  const visibility = (meta.visibility ?? 'private').toString()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-md border bg-card/60 px-2 py-1 text-xs">
        Status: <span className="ml-1 font-medium">{status}</span>
      </span>
      <span className="inline-flex items-center rounded-md border bg-card/60 px-2 py-1 text-xs">
        Sichtbarkeit: <span className="ml-1 font-medium">{visibility}</span>
      </span>
      {meta.published_at && (
        <span className="inline-flex items-center rounded-md border bg-card/60 px-2 py-1 text-xs">
          Veröffentlicht:{' '}
          <span className="ml-1">
            {new Date(meta.published_at).toLocaleString()}
          </span>
        </span>
      )}
    </div>
  )
}

function SharePanel({
  sessionId,
  shareUrl,
  visible,
}: {
  sessionId: string | null
  shareUrl: string
  visible: boolean
}) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const pathPreview = sessionId ? `/story/${sessionId}` : '—'

  return (
    <div className="space-y-2 rounded-xl border bg-card/60 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Öffentlicher Link</div>
        <span
          className={cn(
            'rounded-md border px-2 py-0.5 text-xs',
            visible
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {visible ? 'sichtbar' : 'privat'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex select-none items-center justify-center rounded-md border bg-muted px-2 py-1 text-xs">
          <LinkIcon className="mr-1 h-3.5 w-3.5" />
          {pathPreview}
        </span>
      </div>

      <div className="flex gap-2">
        <Input readOnly value={shareUrl} className="text-xs" />
        <Button type="button" variant="outline" onClick={copy} disabled={!shareUrl}>
          {copied ? (
            <ClipboardCheck className="mr-2 h-4 w-4" />
          ) : (
            <Clipboard className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Kopiert' : 'Kopieren'}
        </Button>
        {shareUrl && (
          <Button variant="ghost" asChild>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Öffnen
            </a>
          </Button>
        )}
      </div>

      {!visible && (
        <p className="text-xs text-muted-foreground">
          Der Link funktioniert, sobald die Session öffentlich ist.
        </p>
      )}
    </div>
  )
}
