// app/(admin)/admin/users/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import UsersTable, { UserRow } from '@/components/admin/UsersTable'

const PAGE_SIZE = 20
const ROLES = ['user', 'creator', 'admin', 'owner', 'operator', 'moderator'] as const
const STATUSES = ['active', 'banned', 'pending', 'disabled'] as const

type SearchParams = { q?: string; page?: string }

export default async function UsersPage({ searchParams }: { searchParams?: SearchParams }) {
  noStore()

  // 1) Security: nur Admin-Rollen hinein
  const { user, role } = await requireAdmin()
  // Optional: nur bestimmte Rollen dürfen User verwalten
  if (!['owner', 'admin', 'operator', 'moderator'].includes(role ?? '')) {
    redirect('/unauthorized')
  }

  // 2) Query-Parameter
  const q = (searchParams?.q ?? '').trim()
  const page = Math.max(1, Number(searchParams?.page ?? 1))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // 3) Supabase (lockerer Client, falls Typen nicht vollständig sind)
  const supabase = createServerComponentClient() as any

  // 4) Daten laden (Anzeige-Felder strikt begrenzen)
  let query = supabase
    .from('creator_profiles')
    .select('user_id, email, display_name, role, status, created_at, last_seen_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q) {
    // Suche über Name/Email
    // Hinweis: or()-Syntax ist PostgREST-konform
    query = query.or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: rows, count = 0, error } = await query
  if (error) {
    // Fallback: leere Liste, damit UI nicht crasht
    console.error('[admin/users] list error:', error)
  }

  // 5) Streng & null-sicher ins UI-Format mappen
  const users: UserRow[] = (rows ?? []).map((r: any) => {
    const role = (ROLES as readonly string[]).includes(r?.role) ? (r.role as UserRow['role']) : 'user'
    const status = (STATUSES as readonly string[]).includes(r?.status) ? (r.status as UserRow['status']) : 'active'
    return {
      user_id: r?.user_id ?? '',
      email: r?.email ?? null,
      display_name: r?.display_name ?? null,
      role,
      status,
      created_at: r?.created_at ?? new Date().toISOString(),
      last_seen_at: r?.last_seen_at ?? null,
    }
  })

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Benutzerverwaltung</h1>
        <p className="text-sm text-muted-foreground">
          Admin · {count} Nutzer gesamt
        </p>
      </div>

      <UsersTable
        users={users}
        page={page}
        pageSize={PAGE_SIZE}
        total={count}
        q={q}
      />
    </main>
  )
}
