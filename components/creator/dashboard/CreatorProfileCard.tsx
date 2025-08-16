'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Tables } from '@/types/supabase'

type CreatorProfile = Tables<'creator_profiles'>

export default function CreatorProfileCard() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [profileEdit, setProfileEdit] = useState<Partial<CreatorProfile>>({})
  const [profileLoading, setProfileLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    const fetchOrCreateProfile = async () => {
      setProfileLoading(true)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('Nicht authentifiziert')
        setProfileLoading(false)
        return
      }

      // 1) Profil holen
      const { data: profileData, error: profileError } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single<CreatorProfile>()

      // 2) Falls nicht vorhanden → anlegen
      if (profileError || !profileData) {
        const fallbackUsername =
          (user.user_metadata?.username as string | undefined)?.toLowerCase()?.replace(/\s+/g, '-') ||
          (user.email?.split('@')[0] ?? `user-${user.id.slice(0, 6)}`)

        const insertRes = await supabase
          .from('creator_profiles')
          .insert({
            user_id: user.id,
            name: (user.user_metadata?.full_name as string) || 'Creator',
            username: fallbackUsername,
            bio: '',
            website: '',
            instagram: '',
            tiktok: '',
            youtube: '',
            twitter: '',
            avatar_url: ''
          })
          .select('*')
          .single<CreatorProfile>()

        if (insertRes.error || !insertRes.data) {
          toast.error('Profil konnte nicht angelegt werden')
          setProfileLoading(false)
          return
        }
        setProfile(insertRes.data)
        setProfileEdit(insertRes.data)
        setProfileLoading(false)
        return
      }

      setProfile(profileData)
      setProfileEdit(profileData)
      setProfileLoading(false)
    }

    fetchOrCreateProfile()
  }, [])

  const normalizeUsername = (v: string) =>
    v.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')

  const normalizeUrl = (v: string) => {
    const val = v.trim()
    if (!val) return ''
    if (/^https?:\/\//i.test(val)) return val
    return `https://${val}`
  }

  // Avatar upload handler
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setAvatarUploading(true)

    const fileExt = file.name.split('.').pop()
    const filePath = `avatars/${profile.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('creator-media')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      toast.error('Upload fehlgeschlagen')
      setAvatarUploading(false)
      return
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/creator-media/${filePath}`

    const { error: updateError } = await supabase
      .from('creator_profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id)

    if (updateError) {
      toast.error('Avatar konnte nicht gespeichert werden')
    } else {
      toast.success('Avatar aktualisiert')
      setProfile({ ...profile, avatar_url: publicUrl })
      setProfileEdit({ ...profileEdit, avatar_url: publicUrl })
    }
    setAvatarUploading(false)
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setProfileLoading(true)

    const payload: Partial<CreatorProfile> = {
      name: (profileEdit.name ?? '').trim(),
      username: normalizeUsername(profileEdit.username ?? ''),
      bio: (profileEdit.bio ?? '').trim(),
      instagram: (profileEdit.instagram ?? '').trim(),
      tiktok: (profileEdit.tiktok ?? '').trim(),
      youtube: normalizeUrl(profileEdit.youtube ?? ''),
      twitter: (profileEdit.twitter ?? '').trim(),
      website: normalizeUrl(profileEdit.website ?? ''),
      avatar_url: profileEdit.avatar_url ?? profile.avatar_url
    }

    const { error } = await supabase
      .from('creator_profiles')
      .update(payload)
      .eq('id', profile.id)

    if (error) {
      toast.error('Profil konnte nicht gespeichert werden')
    } else {
      toast.success('Profil gespeichert')
      setProfile({ ...profile, ...payload } as CreatorProfile)
      setProfileEdit(prev => ({ ...prev, ...payload }))
    }
    setProfileLoading(false)
  }

  const handleProfileEdit = (field: keyof CreatorProfile, value: string) => {
    setProfileEdit(prev => ({ ...prev, [field]: value }))
  }

  // Skeleton, wenn erstmalig geladen
  if (profileLoading && !profile) {
    return (
      <section className="w-full max-w-md mx-auto rounded-3xl p-8 border border-neutral-100 dark:border-neutral-800 shadow-2xl bg-white/70 dark:bg-neutral-900">
        <div className="animate-pulse space-y-6">
          <div className="mx-auto w-28 h-28 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
          <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      </section>
    )
  }

  return (
    <section className="w-full bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 shadow-2xl rounded-3xl p-8 border border-neutral-100 dark:border-neutral-800 max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar */}
        <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-blue-500/20 mb-1 shadow">
          {profileEdit.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profileEdit.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-5xl text-neutral-300 bg-neutral-100 dark:bg-neutral-700">
              <span>👤</span>
            </div>
          )}
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept="image/*"
            title="Avatar ändern"
            onChange={handleAvatarChange}
            disabled={avatarUploading}
            aria-label="Avatar hochladen"
          />
          {avatarUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/70 text-xs">
              Hochladen...
            </div>
          )}
        </div>
        <div className="text-xs text-neutral-500">Avatar ändern</div>

        {/* Profil-Felder */}
        <form className="w-full mt-4 grid grid-cols-1 gap-3" onSubmit={handleProfileSave}>
          <div>
            <label className="block font-semibold mb-1">Name</label>
            <input
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 ring-blue-200"
              value={profileEdit.name || ''}
              onChange={e => handleProfileEdit('name', e.target.value)}
              maxLength={50}
              required
              disabled={profileLoading}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Benutzername</label>
            <input
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 ring-blue-200"
              value={profileEdit.username || ''}
              onChange={e => handleProfileEdit('username', e.target.value)}
              maxLength={30}
              required
              disabled={profileLoading}
            />
            <p className="text-xs text-neutral-500 mt-1">Nur Buchstaben, Zahlen, „-“ und „_“.</p>
          </div>

          <div>
            <label className="block font-semibold mb-1">Bio</label>
            <textarea
              className="w-full border px-3 py-2 rounded-lg focus:ring-2 ring-blue-200"
              rows={2}
              value={profileEdit.bio || ''}
              onChange={e => handleProfileEdit('bio', e.target.value)}
              maxLength={180}
              disabled={profileLoading}
            />
          </div>

          {/* Social Links */}
          <div>
            <label className="block font-semibold mb-1">Instagram</label>
            <input
              className="w-full border px-3 py-2 rounded-lg"
              value={profileEdit.instagram || ''}
              onChange={e => handleProfileEdit('instagram', e.target.value)}
              maxLength={80}
              placeholder="@instagram"
              disabled={profileLoading}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">TikTok</label>
            <input
              className="w-full border px-3 py-2 rounded-lg"
              value={profileEdit.tiktok || ''}
              onChange={e => handleProfileEdit('tiktok', e.target.value)}
              maxLength={80}
              placeholder="@tiktok"
              disabled={profileLoading}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">YouTube</label>
            <input
              className="w-full border px-3 py-2 rounded-lg"
              value={profileEdit.youtube || ''}
              onChange={e => handleProfileEdit('youtube', e.target.value)}
              maxLength={120}
              placeholder="https://youtube.com/..."
              disabled={profileLoading}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Twitter/X</label>
            <input
              className="w-full border px-3 py-2 rounded-lg"
              value={profileEdit.twitter || ''}
              onChange={e => handleProfileEdit('twitter', e.target.value)}
              maxLength={80}
              placeholder="@twitter"
              disabled={profileLoading}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Website</label>
            <input
              className="w-full border px-3 py-2 rounded-lg"
              value={profileEdit.website || ''}
              onChange={e => handleProfileEdit('website', e.target.value)}
              maxLength={120}
              placeholder="https://deinblog.com"
              disabled={profileLoading}
            />
          </div>

          <button
            type="submit"
            className="mt-4 px-8 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 disabled:bg-neutral-300 transition"
            disabled={profileLoading}
          >
            {profileLoading ? 'Speichern…' : 'Profil speichern'}
          </button>
        </form>
      </div>
    </section>
  )
}
