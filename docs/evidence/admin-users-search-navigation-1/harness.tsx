import * as React from 'react'
import { createRoot } from 'react-dom/client'

import UsersTable, { type UserRow } from '@/components/admin/UsersTable'
import type { Role } from '@/lib/auth/roles'
import {
  backUsersSearch,
  clearUsersNavReplaces,
  commitNextUsersNav,
  currentUsersSearch,
  externalUsersSearch,
  forwardUsersSearch,
  pendingUsersNavCommits,
  setUsersNavDelayCommit,
  usersNavActionCalls,
  usersNavReplaces,
  useSearchParams,
} from './stubs/next-navigation'

const USERS: UserRow[] = [
  {
    user_id: 'synthetic-user-1',
    email: 'ada.example@example.test',
    display_name: 'Ada Example',
    role: 'user',
    status: 'active',
    created_at: '2026-01-15T09:30:00.000Z',
    last_seen_at: '2026-03-01T12:00:00.000Z',
  },
  {
    user_id: 'synthetic-user-2',
    email: 'bao.example@example.test',
    display_name: 'Bao Example',
    role: 'operator',
    status: 'pending',
    created_at: '2026-02-02T08:00:00.000Z',
    last_seen_at: null,
  },
  {
    user_id: 'synthetic-user-3',
    email: 'cio.example@example.test',
    display_name: 'Cio Example',
    role: 'admin',
    status: 'banned',
    created_at: '2026-02-20T16:45:00.000Z',
    last_seen_at: '2026-04-04T07:15:00.000Z',
  },
]

const ASSIGNABLE: Role[] = ['user', 'creator', 'moderator', 'operator']

function propsFromSearch(search: string) {
  const params = new URLSearchParams(search)
  const q = (params.get('q') ?? '').trim()
  const parsed = Number(params.get('page') ?? '1')
  const page = Number.isFinite(parsed) ? Math.max(1, parsed) : 1
  return { q, page }
}

function HarnessTable({ mounted, generation }: { mounted: boolean; generation: number }) {
  const sp = useSearchParams()
  const { q, page } = propsFromSearch(sp.toString())
  if (!mounted) return <div data-users-nav-unmounted="true" />
  return (
    <div data-users-nav-generation={generation}>
      <UsersTable
        key={generation}
        users={USERS}
        page={page}
        pageSize={20}
        total={60}
        q={q}
        actorId="synthetic-actor"
        actorRole="admin"
        assignable={ASSIGNABLE}
      />
    </div>
  )
}

function HarnessApp() {
  const [mounted, setMounted] = React.useState(true)
  const [generation, setGeneration] = React.useState(1)

  React.useEffect(() => {
    const api = {
      ready: true,
      replaces: () => usersNavReplaces(),
      clearReplaces: () => clearUsersNavReplaces(),
      search: () => currentUsersSearch(),
      input: () =>
        (document.querySelector('input[placeholder="Suche nach Name oder E-Mail…"]') as HTMLInputElement | null)
          ?.value ?? null,
      pageText: () => document.querySelector('span.tabular-nums')?.textContent ?? null,
      external: (search: string) => externalUsersSearch(search, 'push'),
      delayCommits: (delay: boolean) => setUsersNavDelayCommit(delay),
      pendingCommits: () => pendingUsersNavCommits(),
      commitNext: () => commitNextUsersNav(),
      back: () => backUsersSearch(),
      forward: () => forwardUsersSearch(),
      unmount: () => setMounted(false),
      remount: () => {
        setMounted(true)
        setGeneration((value) => value + 1)
      },
      actionCalls: () => usersNavActionCalls(),
    }
    ;(window as unknown as { __usersNav?: typeof api }).__usersNav = api
    return () => {
      delete (window as unknown as { __usersNav?: typeof api }).__usersNav
    }
  }, [])

  return (
    <React.StrictMode>
      <main className="p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Benutzerverwaltung</h1>
        <p className="text-sm text-muted-foreground">Synthetische Zeilen · kein echtes Konto</p>
        <div className="mt-6">
          <HarnessTable mounted={mounted} generation={generation} />
        </div>
      </main>
    </React.StrictMode>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('harness root missing')
createRoot(root).render(<HarnessApp />)
