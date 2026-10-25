// app/(admin)/admin/users/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { leseOptionalRequestParam, type PageRequestParam } from '@/lib/next/request-api'
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
import { ausProblem } from '@/lib/admin/ladezustand'
import { profilErstellt } from '@/lib/admin/profil-erstellt'
import { problemAus } from '@/lib/api/datenbank-lesen'
import { readUsersDirectory } from '@/lib/admin/users-directory-query'

const PAGE_SIZE = 20

type SearchParams = { q?: string; page?: string; role?: string; status?: string }

function rawQueryText(raw: unknown, key: string): string {
  if (raw instanceof URLSearchParams) return (raw.get(key) ?? '').trim()
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return ''
  const value = (raw as Record<string, unknown>)[key]
  return typeof value === 'string' ? value.trim() : ''
}

type ProfileRow = {
  user_id?: string | null
  email?: string | null
  display_name?: string | null
  role?: string | null
  status?: string | null
  created_at?: string | null
  last_seen_at?: string | null
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: PageRequestParam<SearchParams>
}) {
  noStore()

  // Der Bereichsschutz sitzt im Layout der Gruppe `(admin)`. Hier geht es um
  // die zusätzliche Anforderung dieser Seite und um die Rolle des Aufrufers,
  // die bestimmt, welche Aktionen die Tabelle überhaupt anbietet.
  // Die Ablehnung bleibt ein Redirect und wird nicht zur leeren Liste.
  const outcome = await readUsersDirectory({
    guard: () => requireAdminPage({ surface: 'users', capability: 'konten-verwalten' }),
    canManage: canManageUsers,
    loadRaw: async () => {
      const params = await leseOptionalRequestParam(searchParams)
      return params
    },
    openClient: async () => (await createServerComponentClient()) as any,
  })

  if (outcome.kind === 'denied') {
    redirect('/unauthorized?grund=forbidden')
  }

  const readAttempt = crypto.randomUUID()
  const actorId = outcome.user.id
  const actorRole = outcome.role
  const assignable = assignableRoles(actorRole)

  if (outcome.kind === 'invalid') {
    const rawQ = rawQueryText(await leseOptionalRequestParam(searchParams), 'q')
    return (
      <section className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Benutzerverwaltung</h1>
          <p className="text-sm text-muted-foreground">Konten, Rollen und Zugriffsstatus verwalten.</p>
        </div>
        <UsersTable
          users={[]}
          page={1}
          pageSize={PAGE_SIZE}
          total={0}
          q={rawQ}
          actorId={actorId}
          actorRole={actorRole}
          assignable={assignable}
          read={{
            kind: 'invalid',
            readAttempt,
            reason: outcome.decision.reason,
            recoveryHref: outcome.decision.recovery,
          }}
        />
      </section>
    )
  }

  const { query } = outcome.decision
  const result = outcome.result

  if (result.error) {
    console.error('[admin/users] list error:', result.error)
    return (
      <section className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Benutzerverwaltung</h1>
          <p className="text-sm text-muted-foreground">Konten, Rollen und Zugriffsstatus verwalten.</p>
        </div>
        <UsersTable
          users={[]}
          page={query.page}
          pageSize={PAGE_SIZE}
          total={0}
          q={query.q}
          actorId={actorId}
          actorRole={actorRole}
          assignable={assignable}
          read={{
            kind: 'error',
            readAttempt,
            query,
            fehler: ausProblem(
              problemAus(
                { data: null, error: result.error, status: result.status },
                result.error,
              ),
            ),
          }}
        />
      </section>
    )
  }

  const users: UserRow[] = (result.rows as ProfileRow[]).map((r) => ({
    user_id: r?.user_id ?? '',
    email: r?.email ?? null,
    display_name: r?.display_name ?? null,
    role: parseRole(r?.role) ?? DEFAULT_ROLE,
    status: isAccountStatus(r?.status) ? r.status : 'active',
    created_at: profilErstellt(r?.created_at),
    last_seen_at: r?.last_seen_at ?? null,
  }))

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Benutzerverwaltung</h1>
        <p className="text-sm text-muted-foreground">Konten, Rollen und Zugriffsstatus verwalten.</p>
      </div>
      <UsersTable
        users={users}
        page={query.page}
        pageSize={PAGE_SIZE}
        total={result.count ?? 0}
        q={query.q}
        actorId={actorId}
        actorRole={actorRole}
        assignable={assignable}
        read={{
          kind: 'ready',
          readAttempt,
          query,
          count: result.count,
        }}
      />
    </section>
  )
}
