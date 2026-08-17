// app/(admin)/admin/users/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import {
  assignableRoles,
  canManageUsers,
  isAccountStatus,
  parseRole,
  DEFAULT_ROLE,
} from '@/lib/auth/roles'
import UsersTable, { type UserRow } from '@/components/admin/UsersTable'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import { ausProblem } from '@/lib/admin/ladezustand'
import { problemAus } from '@/lib/api/datenbank-lesen'
import { textSuchfilter } from '@/lib/api/suchfilter'

const PAGE_SIZE = 20

type SearchParams = { q?: string; page?: string }

export default async function UsersPage({ searchParams }: { searchParams?: SearchParams }) {
  noStore()

  // Der Bereichsschutz sitzt im Layout der Gruppe `(admin)`. Hier geht es um
  // die zusätzliche Anforderung dieser Seite und um die Rolle des Aufrufers,
  // die bestimmt, welche Aktionen die Tabelle überhaupt anbietet.
  const { user, role } = await requireAdminPage({ surface: 'users', capability: 'konten-verwalten' })
  if (!role || !canManageUsers(role)) {
    redirect('/unauthorized?grund=forbidden')
  }

  const q = (searchParams?.q ?? '').trim()
  const page = Math.max(1, Number(searchParams?.page ?? 1))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = createServerComponentClient() as any

  let query = supabase
    .from('creator_profiles')
    .select('user_id, email, display_name, role, status, created_at, last_seen_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q) {
    // Der Begriff stand vorher unzitiert im `or`-Ausdruck, in dem das Komma die
    // Glieder trennt. Am Branch gemessen: Eine Suche nach `a,b` ergab HTTP 400,
    // „failed to parse logic tree" – und weil die Ablehnung nur ins Protokoll
    // ging, zeigte die Seite „0 Nutzer gesamt". Dieselbe Stelle war in der
    // Ereignissuche zu korrigieren (ADR-0037); der Ausdruck kommt jetzt von dort.
    query = query.or(textSuchfilter(['display_name', 'email'], q))
  }

  const { data: rows, count = 0, error, status } = await query

  // Vorher wurde die Ablehnung nur ins Serverprotokoll geschrieben und die Seite
  // zeigte „Admin · 0 Nutzer gesamt" mit leerer Tabelle – in einer
  // Benutzerverwaltung die Aussage, es gebe niemanden (ADR-0040). Von RLS
  // weggefilterte Zeilen bleiben bewusst eine leere Liste: Das ist der Fall
  // einer Notzugangs-Sitzung, den der Hinweisbalken erklärt (ADR-0036).
  if (error) {
    console.error('[admin/users] list error:', error)

    return (
      <main className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Benutzerverwaltung</h1>
        </div>
        <Fehlerflaeche fehler={ausProblem(problemAus({ data: null, error, status }, error))} />
      </main>
    )
  }

  const users: UserRow[] = (rows ?? []).map((r: any) => ({
    user_id: r?.user_id ?? '',
    email: r?.email ?? null,
    display_name: r?.display_name ?? null,
    role: parseRole(r?.role) ?? DEFAULT_ROLE,
    status: isAccountStatus(r?.status) ? r.status : 'active',
    created_at: r?.created_at ?? new Date().toISOString(),
    last_seen_at: r?.last_seen_at ?? null,
  }))

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
        actorId={user.id}
        actorRole={role}
        assignable={assignableRoles(role)}
      />
    </main>
  )
}
