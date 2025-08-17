'use client'

import type { Tables } from '@/types/supabase'

type Profile = Tables<'creator_profiles'> & { facebook?: string | null }

export default function ProfileCompletion({ profile }: { profile: Profile | null }) {
  if (!profile) return null

  const checks = [
    { label: 'Name', ok: !!profile.name },
    { label: 'Benutzername', ok: !!profile.username },
    { label: 'Bio (≥ 40 Zeichen)', ok: !!profile.bio && profile.bio!.trim().length >= 40 },
    { label: 'Avatar', ok: !!profile.avatar_url },
    {
      label: 'Mind. 1 Social',
      ok: !!(profile.instagram || profile.tiktok || profile.youtube || profile.twitter || (profile as any).facebook),
    },
    { label: 'Website', ok: !!profile.website },
  ]
  const done = checks.filter(c => c.ok).length
  const pct = Math.round((done / checks.length) * 100)

  return (
    <div className="w-full rounded-xl border bg-white/70 dark:bg-neutral-900 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Profil-Vervollständigung</div>
        <div className="text-sm text-neutral-500">{pct}%</div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? 'text-green-600' : 'text-neutral-500'}>
            {c.ok ? '✅' : '⬜️'} {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
