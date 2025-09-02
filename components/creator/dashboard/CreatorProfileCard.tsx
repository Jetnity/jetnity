'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Tables } from '@/types/supabase'
import ProfileCompletion from './ProfileCompletion'
import ConnectedAccounts from '../ConnectedAccounts'
import { cn } from '@/lib/utils'

/* ──────────────────────────────────────────────
   Types
─────────────────────────────────────────────── */
type CreatorProfileBase = Tables<'creator_profiles'>
// Facebook ist je nach Schema evtl. nicht vorhanden → optional halten:
type CreatorProfile = CreatorProfileBase & { facebook?: string | null }

type UsernameState =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'ok' }
  | { state: 'taken' }
  | { state: 'invalid'; message: string }

/* ──────────────────────────────────────────────
   Consts
─────────────────────────────────────────────── */
const AVATAR_BUCKET = 'creator-media'
const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="100%" height="100%" fill="%23E5E7EB"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="%239CA3AF" font-family="Arial" font-size="84">👤</text></svg>'

/* ──────────────────────────────────────────────
   Normalizer & Helpers
─────────────────────────────────────────────── */
const normalizeUsername = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9._-]/g, '').replace(/^@/, '').slice(0, 30)

const isValidUsername = (v: string) => /^[a-z0-9._-]{3,30}$/.test(v)

function extractHandle(input: string, domain: string) {
  if (!input) return ''
  const trimmed = input.trim()
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (u.hostname.includes(domain)) {
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts[0]) return parts[0].replace(/^@/, '')
    }
  } catch {}
  if (trimmed.startsWith('@')) return trimmed.slice(1)
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, '')
}

const normInstagram = (v: string) => extractHandle(v, 'instagram')
const normTikTok = (v: string) => extractHandle(v, 'tiktok')
const normTwitter = (v: string) => extractHandle(v, 'twitter') || extractHandle(v, 'x.com')
const normYouTube = (v: string) => {
  const t = v.trim()
  try {
    const u = new URL(t.startsWith('http') ? t : `https://${t}`)
    if (u.hostname.includes('youtube') || u.hostname.includes('youtu.be')) return u.toString()
  } catch {}
  if (t.startsWith('@')) return `https://youtube.com/${t}`
  return t
}
const normFacebook = (v: string) => {
  const h = extractHandle(v, 'facebook')
  return h ? `https://facebook.com/${h}` : v.trim()
}
const normWebsite = (v: string) => {
  const t = v.trim()
  if (!t) return ''
  try {
    const u = new URL(t.startsWith('http') ? t : `https://${t}`)
    return u.toString()
  } catch {
    return t
  }
}

/* Username-Vorschläge – akzeptieren jetzt auch null */
function baseFromName(name?: string | null) {
  return (name || '')
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.+/g, '.')
    .replace(/_+/g, '_')
    .slice(0, 20)
}
function generateUsernameSuggestions(name?: string | null, email?: string | null | undefined) {
  const base = baseFromName(name) || (email ? email.split('@')[0] : 'creator')
  const now = new Date()
  const y = String(now.getFullYear()).slice(2)
  const m = `${now.getMonth() + 1}`.padStart(2, '0')
  const r3 = Math.random().toString(36).slice(2, 5)
  const r2 = Math.random().toString(36).slice(2, 4)

  const variants = Array.from(
    new Set([
      base,
      `${base}.${y}`,
      `${base}${y}`,
      `${base}_${m}`,
      `${base}.${r2}`,
      `${base}-${r3}`,
      `${base}.official`,
      `${base}.de`,
      `the.${base}`,
      `${base}.tv`,
    ])
  ).filter(v => v.length >= 3 && v.length <= 30)

  return variants
}

/* ──────────────────────────────────────────────
   Component
─────────────────────────────────────────────── */
export default function CreatorProfileCard() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [form, setForm] = useState<Partial<CreatorProfile>>({})
  const [initial, setInitial] = useState<Partial<CreatorProfile>>({})
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [usernameCheck, setUsernameCheck] = useState<UsernameState>({ state: 'idle' })

  const [gravatarUrl, setGravatarUrl] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [suggestions, setSuggestions] = useState<Array<{ u: string; state: 'checking' | 'ok' | 'taken' }>>([])

  const supportsFacebook = useMemo(
    () => (profile ? Object.prototype.hasOwnProperty.call(profile, 'facebook') : false),
    [profile]
  )
  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])

  /* Cmd/Ctrl+S → speichern */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        document.getElementById('save-profile-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* Profil + Gravatar laden */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setProfileLoading(true)
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Nicht authentifiziert')

        if (user.email) setUserEmail(user.email)

        if (!gravatarUrl && user.email) {
          try {
            const res = await fetch(`/api/utils/gravatar?email=${encodeURIComponent(user.email)}&s=256&d=mp`)
            const j = await res.json()
            if (!cancelled) setGravatarUrl(j.url)
          } catch {}
        }

        const { data, error } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle<CreatorProfileBase>()
        if (error) throw error
        if (!data) throw new Error('Profil nicht gefunden')

        // Facebook-Feld sicher mergen, ohne ts-expect-error
        const withFb: CreatorProfile = { ...(data as CreatorProfileBase) }
        if (Object.prototype.hasOwnProperty.call(data as any, 'facebook')) {
          ;(withFb as any).facebook = (data as any).facebook ?? null
        }

        setProfile(withFb)
        setForm(withFb)
        setInitial(withFb)
      } catch (e: any) {
        console.error(e)
        toast.error(e?.message || 'Fehler beim Laden des Profils')
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Username Live-Check (debounced) */
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const u = (form.username || '').trim()
    if (!u || !profile) { setUsernameCheck({ state: 'idle' }); return }
    if (!isValidUsername(u)) {
      setUsernameCheck({ state: 'invalid', message: '3–30 Zeichen, a–z, 0–9, . _ -' })
      return
    }
    setUsernameCheck({ state: 'checking' })
    if (usernameTimer.current) clearTimeout(usernameTimer.current)
    usernameTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/creator/username-availability?u=${encodeURIComponent(u)}&excludeId=${encodeURIComponent(profile.id)}`)
        const j = await res.json()
        setUsernameCheck(j.available ? { state: 'ok' } : { state: 'taken' })
      } catch {
        setUsernameCheck({ state: 'idle' })
      }
    }, 400)
    return () => { if (usernameTimer.current) clearTimeout(usernameTimer.current) }
  }, [form.username, profile])

  /* Vorschläge erzeugen & prüfen (wenn belegt/ungültig) */
  const needSuggestions = usernameCheck.state === 'taken' || usernameCheck.state === 'invalid'
  useEffect(() => {
    if (!needSuggestions) return
    const list = generateUsernameSuggestions(form.name, userEmail)
      .map(normalizeUsername)
      .filter(Boolean)
    setSuggestions(list.map(u => ({ u, state: 'checking' })))
    let alive = true
    ;(async () => {
      for (const u of list) {
        try {
          const res = await fetch(`/api/creator/username-availability?u=${encodeURIComponent(u)}${profile ? `&excludeId=${encodeURIComponent(profile.id)}` : ''}`)
          const j = await res.json()
          if (!alive) return
          setSuggestions(prev => prev.map(s => s.u === u ? { u, state: j.available ? 'ok' : 'taken' } : s))
        } catch {
          if (!alive) return
          setSuggestions(prev => prev.map(s => s.u === u ? { u, state: 'taken' } : s))
        }
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needSuggestions, form.name, userEmail])

  /* Avatar Upload */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `avatars/${profile.id}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase
        .storage.from(AVATAR_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`
      const { error: updateError } = await supabase
        .from('creator_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)
      if (updateError) throw updateError

      const next = { ...profile, avatar_url: publicUrl }
      setProfile(next); setForm(next); setInitial(next)
      toast.success('Avatar aktualisiert')
    } catch (e: any) {
      console.error(e)
      toast.error('Avatar-Upload fehlgeschlagen')
    } finally {
      setAvatarUploading(false)
      e.currentTarget.value = ''
    }
  }

  /* Save */
  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!profile) return
    if (usernameCheck.state === 'taken' || usernameCheck.state === 'invalid') {
      toast.error('Bitte gültigen/freien Benutzernamen wählen')
      return
    }

    setProfileLoading(true)
    try {
      const payload: any = {
        name: (form.name || '').trim(),
        username: normalizeUsername(form.username || ''),
        bio: (form.bio || '').trim(),
        instagram: normInstagram(form.instagram || ''),
        tiktok: normTikTok(form.tiktok || ''),
        twitter: normTwitter(form.twitter || ''),
        youtube: normYouTube(form.youtube || ''),
        website: normWebsite(form.website || ''),
        avatar_url: form.avatar_url || null,
      }
      if (supportsFacebook) payload.facebook = normFacebook((form as any).facebook || '')

      // nur geänderte Felder übertragen
      const changed: Record<string, any> = {}
      for (const k of Object.keys(payload)) {
        if ((initial as any)[k] !== payload[k]) changed[k] = payload[k]
      }
      if (Object.keys(changed).length === 0) {
        toast.message('Keine Änderungen')
        setProfileLoading(false)
        return
      }

      const { error } = await supabase.from('creator_profiles').update(changed).eq('id', profile.id)
      if (error) throw error

      const next = { ...profile, ...changed }
      setProfile(next); setForm(next); setInitial(next)
      toast.success('Profil gespeichert')
    } catch (e: any) {
      console.error(e)
      toast.error('Profil konnte nicht gespeichert werden')
    } finally {
      setProfileLoading(false)
    }
  }

  const profileUrl = useMemo(() => {
    const u = (form.username || '').trim()
    return u ? `/@${normalizeUsername(u)}` : ''
  }, [form.username])

  /* ───────────────────────────────────────── UI ───────────────────────── */
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-gradient-to-br from-white via-blue-50 to-blue-100 p-6 shadow-2xl dark:border-neutral-800 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar */}
        <div className="relative mb-1 h-28 w-28 overflow-hidden rounded-full border-4 border-blue-500/20 shadow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id="avatar-preview"
            src={form.avatar_url || gravatarUrl || FALLBACK_AVATAR}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
          <input
            type="file"
            className="absolute inset-0 cursor-pointer opacity-0"
            accept="image/*"
            title="Avatar ändern"
            onChange={handleAvatarChange}
            disabled={avatarUploading}
          />
          {avatarUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-xs dark:bg-neutral-900/70">
              Hochladen…
            </div>
          )}
        </div>
        <div className="text-xs text-neutral-500">Avatar ändern (oder Gravatar-Fallback aktiv)</div>

        {/* Completion */}
        <div className="w-full">
          <ProfileCompletion profile={profile} />
        </div>

        {/* Connected Accounts */}
        <div className="w-full">
          <ConnectedAccounts />
        </div>

        {/* Formular */}
        <form onSubmit={handleSave} className="mt-4 grid w-full grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-200"
              value={form.name || ''}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              maxLength={50}
              required
              disabled={profileLoading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Benutzername</label>
            <div className="relative">
              <input
                className={cn(
                  'w-full rounded-lg border px-3 py-2 pr-24 focus:ring-2',
                  usernameCheck.state === 'taken' && 'border-red-400 focus:ring-red-200',
                  usernameCheck.state === 'ok' && 'border-emerald-400 focus:ring-emerald-200'
                )}
                value={form.username || ''}
                onChange={e => setForm(prev => ({ ...prev, username: normalizeUsername(e.target.value) }))}
                maxLength={30}
                required
                disabled={profileLoading}
                aria-describedby="username-help"
              />
              <div className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-xs text-neutral-500">
                {usernameCheck.state === 'checking' && 'prüfe…'}
                {usernameCheck.state === 'ok' && 'frei ✅'}
                {usernameCheck.state === 'taken' && <span className="text-red-600">vergeben ✖</span>}
                {usernameCheck.state === 'invalid' && <span className="text-red-600">ungültig</span>}
              </div>
            </div>
            <p id="username-help" className="mt-1 text-xs text-neutral-500">
              Nur Buchstaben/Zahlen/._-, 3–30 Zeichen. Öffentliche URL: {profileUrl || '/@username'}
            </p>

            {(usernameCheck.state === 'taken' || usernameCheck.state === 'invalid') && suggestions.length > 0 && (
              <div className="mt-2">
                <div className="mb-1 text-xs font-medium text-neutral-600">Vorschläge</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 8).map(s => (
                    <button
                      key={s.u}
                      type="button"
                      disabled={s.state === 'taken'}
                      onClick={() => setForm(prev => ({ ...prev, username: s.u }))}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs',
                        s.state === 'ok' && 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
                        s.state === 'checking' && 'border-neutral-200 text-neutral-500',
                        s.state === 'taken' && 'cursor-not-allowed border-neutral-200 text-neutral-400 line-through'
                      )}
                      aria-label={`Benutzername ${s.u} wählen`}
                      title={s.state === 'ok' ? 'Klick zum Übernehmen' : 'Nicht verfügbar'}
                    >
                      {s.u}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Bio</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-200"
              rows={2}
              value={form.bio || ''}
              onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
              maxLength={180}
              disabled={profileLoading}
            />
          </div>

          {/* Socials */}
          <div>
            <label className="mb-1 block text-sm font-medium">Instagram</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={form.instagram || ''}
              onChange={e => setForm(prev => ({ ...prev, instagram: normInstagram(e.target.value) }))}
              maxLength={120}
              placeholder="@deinname oder instagram.com/deinname"
              disabled={profileLoading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">TikTok</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={form.tiktok || ''}
              onChange={e => setForm(prev => ({ ...prev, tiktok: normTikTok(e.target.value) }))}
              maxLength={120}
              placeholder="@deinname oder tiktok.com/@deinname"
              disabled={profileLoading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">YouTube</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={form.youtube || ''}
              onChange={e => setForm(prev => ({ ...prev, youtube: normYouTube(e.target.value) }))}
              maxLength={200}
              placeholder="@channel oder vollständige URL"
              disabled={profileLoading}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Twitter/X</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={form.twitter || ''}
              onChange={e => setForm(prev => ({ ...prev, twitter: normTwitter(e.target.value) }))}
              maxLength={200}
              placeholder="@deinname oder x.com/deinname"
              disabled={profileLoading}
            />
          </div>

          {supportsFacebook && (
            <div>
              <label className="mb-1 block text-sm font-medium">Facebook</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={(form as any).facebook || ''}
                onChange={e => setForm(prev => ({ ...prev, facebook: normFacebook(e.target.value) }))}
                maxLength={200}
                placeholder="@seite oder facebook.com/…"
                disabled={profileLoading}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Website</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              value={form.website || ''}
              onChange={e => setForm(prev => ({ ...prev, website: normWebsite(e.target.value) }))}
              maxLength={200}
              placeholder="https://deinblog.com"
              disabled={profileLoading}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            {profileUrl ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline-offset-4 hover:underline"
              >
                Profil ansehen
              </a>
            ) : (
              <span />
            )}

            <button
              id="save-profile-btn"
              type="submit"
              className={cn(
                'rounded-xl bg-blue-600 px-6 py-2 font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300',
                !isDirty && 'opacity-70'
              )}
              disabled={profileLoading || !isDirty}
              onClick={(e) => void handleSave(e)}
            >
              {profileLoading ? 'Speichern…' : 'Profil speichern'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
