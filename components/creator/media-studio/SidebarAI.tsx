'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { RefreshCcw, PanelsTopLeft, Copy, Check, Clock, Calendar, Send, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

// Fallback für cn
import { cn as _cn } from '@/lib/utils'
const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

import SmartSnippetList from './SmartSnippetList'
import PublishSessionButton from './PublishSessionButton'

type Snippet = Database['public']['Tables']['session_snippets']['Row']

type ScoreResponse = {
  score: number
  label: string
  tips: string[]
  caption: string
}

type HeatCell = { dow: number; hour: number; sessions: number; impressions: number; views: number }
type Platform = 'instagram' | 'tiktok' | 'youtube' | 'x' | 'facebook'
type VariantMap = Record<Platform, { hook: string; value: string; cta: string }>

type Props = {
  sessionId: string | null
  title?: string
  content?: string | null
  className?: string
}

/* Helpers */
function platformMaxLen(p: Platform): number {
  switch (p) {
    case 'instagram': return 2200
    case 'tiktok':    return 2200
    case 'youtube':   return 5000
    case 'x':         return 280
    case 'facebook':  return 63206
  }
}
function squeezeText(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, Math.max(0, max - 1)) + '…'
}
function keepHashtags(text: string, maxTags: number) {
  const tags = (text.match(/#[\p{L}\p{N}_]+/giu) || []).slice(0, maxTags)
  const body = text.replace(/#[\p{L}\p{N}_]+/giu, '').replace(/\s{2,}/g, ' ').trim()
  return (body + (tags.length ? ' ' + tags.join(' ') : '')).trim()
}
function recommendHashtagCount(p: Platform) {
  switch (p) {
    case 'instagram': return 5
    case 'tiktok':    return 4
    case 'youtube':   return 12
    case 'x':         return 2
    case 'facebook':  return 4
  }
}
function toLocalDatetimeInputFromUTC(utcHour: number, nextDowIndex: number) {
  const now = new Date()
  const dayDiff = (7 + nextDowIndex - now.getUTCDay()) % 7 || 7
  const d = new Date(now.getTime() + dayDiff * 24 * 3600 * 1000)
  d.setUTCHours(utcHour, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function platformCaptionVariant(p: Platform, title: string, base: string, tone: 'hook' | 'value' | 'cta') {
  const max = platformMaxLen(p)
  const tagsMax = recommendHashtagCount(p)
  const prefix = tone === 'hook' ? '🔥 ' : tone === 'value' ? '✨ ' : '👉 '
  let body =
    tone === 'hook'
      ? `${title ? title + ' — ' : ''}${base}`
      : tone === 'value'
      ? `${base}\n\nWas dich erwartet: Mehrwert, Tipps & echte Eindrücke.`
      : `${base}\n\nJetzt entdecken & speichern!`
  body = keepHashtags(body, tagsMax)
  return squeezeText(prefix + body, max)
}
function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    } catch {/* ignore */}
  }
  return { copiedKey, copy }
}

/* Component */
export default function SidebarAI({ sessionId, title = '', content = '', className }: Props) {
  if (!sessionId) {
    return (
      <aside className={cn('space-y-6', className)}>
        <div className="rounded-xl border bg-card/60 p-4 text-sm text-muted-foreground">
          Wähle eine Session, um KI-Vorschläge, Score & Publishing zu sehen.
        </div>
      </aside>
    )
  }

  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [snipLoading, setSnipLoading] = useState(false)
  const [snipError, setSnipError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')

  const [scoreLoading, setScoreLoading] = useState(false)
  const [scored, setScored] = useState<ScoreResponse | null>(null)

  const [bestTimes, setBestTimes] = useState<Array<{ dow: number; hour: number; score: number }>>([])
  const [bestLoading, setBestLoading] = useState(false)

  const [platform, setPlatform] = useState<Platform>('instagram')
  const [when, setWhen] = useState<string>('') // datetime-local
  const [publishLoading, setPublishLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const [tab, setTab] = useState<'snippets' | 'score' | 'publish'>('snippets')

  useEffect(() => {
    let ignore = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!ignore && user) setUserId(user.id)
    })()
    return () => { ignore = true }
  }, [])

  const fetchSnippets = useCallback(async () => {
    setSnipLoading(true)
    setSnipError(null)
    try {
      const res = await fetch('/api/copilot/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data = Array.isArray(json?.snippets) ? (json.snippets as Snippet[]) : []
      setSnippets(data)
    } catch (e) {
      console.error('Fehler beim Laden der Snippets:', e)
      setSnippets([])
      setSnipError('Konnte Vorschläge gerade nicht laden.')
    } finally {
      setSnipLoading(false)
    }
  }, [sessionId])

  const refreshScore = useCallback(async () => {
    setScoreLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/creator/sessions/${sessionId}/copilot/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: ScoreResponse = await res.json()
      setScored(data)
    } catch (e: any) {
      setMsg(e?.message || 'Bewertung fehlgeschlagen')
    } finally {
      setScoreLoading(false)
    }
  }, [sessionId, title, content])

  const refreshBestTimes = useCallback(async () => {
    setBestLoading(true)
    try {
      const url = new URL('/api/creator/analytics/heatmap', window.location.origin)
      url.searchParams.set('range', '90')
      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      const raw: HeatCell[] = await res.json()
      const top = raw
        .map((c) => ({ dow: c.dow, hour: c.hour, score: c.views * 1.5 + c.impressions * 0.5 + c.sessions * 0.3 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
      setBestTimes(top)
    } catch (e) {
      console.error('Heatmap-Analyse fehlgeschlagen:', e)
      setBestTimes([])
    } finally {
      setBestLoading(false)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([fetchSnippets(), refreshScore(), refreshBestTimes()])
  }, [fetchSnippets, refreshScore, refreshBestTimes])

  useEffect(() => {
    refreshAll()
  }, [sessionId, refreshAll])

  const baseCaption = useMemo(() => (scored?.caption || String(content || '').trim() || title).trim(), [scored, content, title])

  // EXPLIZITE Varianten (keine Keys-Casts → keine TS7053-Fehler)
  const computedVariants: VariantMap = useMemo(() => ({
    instagram: {
      hook:  platformCaptionVariant('instagram', title, baseCaption, 'hook'),
      value: platformCaptionVariant('instagram', title, baseCaption, 'value'),
      cta:   platformCaptionVariant('instagram', title, baseCaption, 'cta'),
    },
    tiktok: {
      hook:  platformCaptionVariant('tiktok', title, baseCaption, 'hook'),
      value: platformCaptionVariant('tiktok', title, baseCaption, 'value'),
      cta:   platformCaptionVariant('tiktok', title, baseCaption, 'cta'),
    },
    youtube: {
      hook:  platformCaptionVariant('youtube', title, baseCaption, 'hook'),
      value: platformCaptionVariant('youtube', title, baseCaption, 'value'),
      cta:   platformCaptionVariant('youtube', title, baseCaption, 'cta'),
    },
    x: {
      hook:  platformCaptionVariant('x', title, baseCaption, 'hook'),
      value: platformCaptionVariant('x', title, baseCaption, 'value'),
      cta:   platformCaptionVariant('x', title, baseCaption, 'cta'),
    },
    facebook: {
      hook:  platformCaptionVariant('facebook', title, baseCaption, 'hook'),
      value: platformCaptionVariant('facebook', title, baseCaption, 'value'),
      cta:   platformCaptionVariant('facebook', title, baseCaption, 'cta'),
    },
  }), [baseCaption, title])

  const [variants, setVariants] = useState<VariantMap>(computedVariants)
  useEffect(() => { setVariants(computedVariants) }, [computedVariants])

  const { copiedKey, copy } = useCopy()

  async function publishNowOrSchedule() {
    setPublishLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/creator/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          platform,
          caption: variants[platform].cta,
          scheduledAt: when ? new Date(when).toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setMsg(when ? 'Geplant. 🎯' : 'Zur Veröffentlichung vorgemerkt. 🚀')
      if (!when) setTimeout(() => setMsg(null), 2500)
    } catch (e: any) {
      setMsg(e?.message || 'Planung fehlgeschlagen')
    } finally {
      setPublishLoading(false)
    }
  }

  const DOW = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const applyBestTime = (slot: { dow: number; hour: number }) => {
    setWhen(toLocalDatetimeInputFromUTC(slot.hour, slot.dow))
    setTab('publish')
  }

  return (
    <aside className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">KI-Vorschläge</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            disabled={snipLoading || scoreLoading || bestLoading}
            aria-busy={snipLoading || scoreLoading || bestLoading}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium',
              'border border-zinc-200 bg-white hover:bg-zinc-50'
            )}
            title="Alles aktualisieren"
          >
            <RefreshCcw className={cn('h-4 w-4', (snipLoading || scoreLoading || bestLoading) && 'animate-spin')} />
            {(snipLoading || scoreLoading || bestLoading) ? 'Lade …' : 'Aktualisieren'}
          </button>

          <Link
            href="/creator/media-studio"
            prefetch
            aria-label="Media-Studio öffnen"
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold',
              'bg-zinc-900 text-white hover:bg-zinc-800'
            )}
          >
            <PanelsTopLeft className="h-4 w-4" />
            Media-Studio
          </Link>
        </div>
      </div>

      {msg && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-[12px] text-amber-800">
          {msg}
        </div>
      )}
      {snipError && <p className="text-sm text-destructive">{snipError}</p>}

      {/* Tabs */}
      <div className="rounded-xl border bg-card/60 p-2">
        <div className="mb-2 grid grid-cols-3 gap-1">
          {(['snippets','score','publish'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'h-8 rounded-md text-xs font-medium',
                tab === t ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
              )}
            >
              {t === 'snippets' ? 'Snippets' : t === 'score' ? 'Score' : 'Publish'}
            </button>
          ))}
        </div>

        {/* Snippets */}
        {tab === 'snippets' && (
          <div className="space-y-3">
            <div className="rounded-lg border bg-background p-3">
              <div className="mb-1 text-xs font-medium">KI-Snippets</div>
              <p className="text-[12px] text-muted-foreground">
                Kurze Ideen, Hooks, Headlines & Hashtags – automatisch aus deiner Session.
              </p>
            </div>

            <SmartSnippetList snippets={snippets} sessionId={sessionId} userId={userId} />

            <div className="mt-3 rounded-lg border p-3 text-[11px] text-muted-foreground">
              Tipp: Markiere deine besten Snippets als Favorit – du findest sie schneller wieder.
            </div>
          </div>
        )}

        {/* Score */}
        {tab === 'score' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">CoPilot-Bewertung</div>
              <button
                onClick={refreshScore}
                disabled={scoreLoading}
                className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs hover:bg-accent disabled:opacity-50"
              >
                {scoreLoading ? 'Lade…' : 'Neu bewerten'}
              </button>
            </div>

            {scored ? (
              <>
                <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                  <div className="text-xs text-muted-foreground">Score</div>
                  <div className="text-sm font-medium">
                    {scored.score}/100 <span className="text-muted-foreground">· {scored.label}</span>
                  </div>
                </div>

                {scored.tips.length > 0 && (
                  <div>
                    <div className="mb-1 text-xs font-medium">Empfehlungen</div>
                    <ul className="list-disc pl-5 text-xs space-y-1">
                      {scored.tips.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}

                <div>
                  <div className="mb-1 text-xs font-medium">Empfohlene Caption (Basis)</div>
                  <textarea
                    className="w-full rounded-md border px-2 py-1 text-xs"
                    rows={4}
                    value={scored.caption}
                    onChange={(e) => setScored({ ...scored, caption: e.target.value })}
                  />
                </div>

                {/* Plattform-Varianten */}
                <div className="mt-2">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                    <Sparkles className="h-4 w-4" /> Plattform-Varianten
                  </div>

                  {(['instagram','tiktok','youtube','x','facebook'] as Platform[]).map((p) => (
                    <div key={p} className="mb-2 rounded-lg border p-2">
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="font-medium">{p[0].toUpperCase() + p.slice(1)}</span>
                        <span className="text-muted-foreground">Max {platformMaxLen(p)} Zeichen</span>
                      </div>

                      {(['hook','value','cta'] as const).map((tone) => {
                        const key = `${p}-${tone}`
                        const text = variants[p][tone]
                        return (
                          <div key={key} className="mt-1 grid grid-cols-[1fr_auto] gap-2">
                            <textarea
                              className="w-full rounded-md border px-2 py-1 text-xs"
                              rows={3}
                              value={text}
                              onChange={(e) =>
                                setVariants((prev) => ({
                                  ...prev,
                                  [p]: { ...prev[p], [tone]: e.target.value },
                                }))
                              }
                            />
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => copy(key, text)}
                                className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs hover:bg-accent"
                                title="In Zwischenablage kopieren"
                              >
                                {copiedKey === key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from('session_snippets')
                                    .insert({ session_id: sessionId, type: 'caption', content: text })
                                  if (!error) fetchSnippets()
                                }}
                                className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs hover:bg-accent"
                                title="Als Snippet speichern"
                              >
                                + Snippet
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Noch keine Bewertung.</p>
            )}
          </div>
        )}

        {/* Publish */}
        {tab === 'publish' && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-background p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                <Clock className="h-4 w-4" /> Beste Zeiten (UTC) · Heatmap-basiert
              </div>
              {bestLoading ? (
                <div className="text-xs text-muted-foreground">Analysiere …</div>
              ) : bestTimes.length ? (
                <div className="flex flex-wrap gap-2">
                  {bestTimes.map((t, i) => (
                    <button
                      key={`${t.dow}-${t.hour}-${i}`}
                      onClick={() => applyBestTime(t)}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] hover:bg-accent"
                      title="Zeit anwenden (lokal umgerechnet)"
                    >
                      <Calendar className="h-3 w-3" />
                      {DOW[t.dow]} {String(t.hour).padStart(2, '0')}:00
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Keine Daten vorhanden.</div>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Hinweis: Zeiten sind UTC-basiert. Beim Anwenden wird in deine lokale Zeitzone konvertiert.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                <select
                  className="w-40 rounded-md border px-2 py-1 text-xs"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  aria-label="Plattform wählen"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="x">X/Twitter</option>
                  <option value="facebook">Facebook</option>
                </select>

                <input
                  type="datetime-local"
                  className="rounded-md border px-2 py-1 text-xs"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  aria-label="Zeitplan"
                />
              </div>

              <button
                onClick={publishNowOrSchedule}
                disabled={publishLoading}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {publishLoading ? 'Wird eingeplant…' : when ? 'Planen' : 'Veröffentlichen (Queue)'}
              </button>

              <p className="text-[10px] text-muted-foreground">
                Ohne Zeitpunkt → Veröffentlichungs-Queue. Mit Zeitpunkt → Planung.
              </p>
            </div>

            <div className="pt-2 border-t">
              <PublishSessionButton sessionId={sessionId} />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
