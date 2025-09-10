// app/(admin)/users/page.tsx
import { createServerComponentClient } from '@/lib/supabase/server'
import UsersTable, { UserRow } from '@/components/admin/UsersTable'
import { notFound } from 'next/navigation'

const PAGE_SIZE = 20
const ROLES = ['user', 'creator', 'admin'] as const
const STATUSES = ['active', 'banned'] as const

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string }
}) {
  const q = (searchParams?.q ?? '').trim()
  const page = Math.max(1, Number(searchParams?.page ?? 1))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = createServerComponentClient()

  // Admin-Gate
  const { data: auth } = await supabase.auth.getUser()
  const myId = auth?.user?.id ?? ''
  const { data: me } = await supabase
    .from('creator_profiles')
    .select('user_id, role')
    .eq('user_id', myId)
    .maybeSingle()

  if (!me || me.role !== 'admin') return notFound()

  // Liste holen (nur existierende Felder)
  let query = supabase
    .from('creator_profiles')
    .select(
      'user_id, email, display_name, role, status, created_at, last_seen_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q) {
    // Suche über Name/Email
    query = query.or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: rows, count } = await query

  // Streng typisiert & null-sicher fürs UI
  const users: UserRow[] = (rows ?? []).map((r: any) => {
    const role = ROLES.includes(r?.role) ? (r.role as UserRow['role']) : 'user'
    const status = STATUSES.includes(r?.status)
      ? (r.status as UserRow['status'])
      : 'active'
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

  const total = count ?? 0

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>
        <p className="text-sm text-muted-foreground">
          Admin • {total} Nutzer gesamt
        </p>
      </div>
      <UsersTable users={users} page={page} pageSize={PAGE_SIZE} total={total} q={q} />
    </main>
  )
}
