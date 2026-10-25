import * as React from 'react'
import { createRoot } from 'react-dom/client'

import UsersTable, { type UserRow, type UsersDirectoryReadModel } from '@/components/admin/UsersTable'
import { decideUsersDirectoryRead } from '@/lib/admin/users-directory-query'
import type { AccountStatus, Role } from '@/lib/auth/roles'
import type { Fehler } from '@/lib/admin/ladezustand'
import {
  backUsersSearch,
  clearUsersNavReplaces,
  commitNextUsersNav,
  currentUsersSearch,
  externalUsersSearch,
  forwardUsersSearch,
  pendingUsersNavCommits,
  pushUsersHistory,
  setUsersNavDelayCommit,
  usersNavActionCalls,
  usersNavRefreshCalls,
  usersNavReplaces,
  useSearchParams,
} from './stubs/next-navigation'

const ACTOR = 'synthetic-actor'
const ASSIGNABLE: Role[] = ['user', 'creator', 'moderator', 'operator']

function row(
  id: string,
  name: string,
  email: string,
  role: Role = 'user',
  status: AccountStatus = 'active',
): UserRow {
  return {
    user_id: id,
    email,
    display_name: name,
    role,
    status,
    created_at: '2024-06-15T14:30:00.000Z',
    last_seen_at: id.endsWith('2') ? null : '2026-03-01T12:00:00.000Z',
  }
}

const BASE_USERS: UserRow[] = [
  row('synthetic-user-1', 'Ada Example', 'ada.example@example.test', 'user', 'active'),
  row('synthetic-user-2', 'Bao Example', 'bao.example@example.test', 'operator', 'pending'),
  row('synthetic-user-3', 'Cio Example', 'cio.example@example.test', 'admin', 'banned'),
  row(ACTOR, 'Akteur Selbst', 'actor.example@example.test', 'admin', 'active'),
]

type Fixture = {
  count: number | null
  users: UserRow[]
  mode: 'ready' | 'error' | 'invalid'
  fehler: Fehler
}

const DEFAULT_FIXTURE: Fixture = {
  count: 60,
  users: BASE_USERS,
  mode: 'ready',
  fehler: { meldung: 'synthetic read failed', wiederholbar: false },
}

type Snapshot = {
  read: UsersDirectoryReadModel
  page: number
  q: string
  users: UserRow[]
}

function makeSnapshot(search: string, fixture: Fixture): Snapshot {
  const decision = decideUsersDirectoryRead(new URLSearchParams(search))
  const readAttempt = crypto.randomUUID()
  if (decision.kind === 'invalid' || fixture.mode === 'invalid') {
    const invalid = decision.kind === 'invalid' ? decision : decideUsersDirectoryRead({ page: 'nope' })
    return {
      read: {
        kind: 'invalid',
        readAttempt,
        reason: invalid.kind === 'invalid' ? invalid.reason : 'malformed-page',
        recoveryHref: invalid.kind === 'invalid' ? invalid.recovery : '/admin/users?page=1',
      },
      page: 1,
      q: '',
      users: [],
    }
  }
  if (fixture.mode === 'error') {
    return {
      read: {
        kind: 'error',
        readAttempt,
        query: decision.query,
        fehler: fixture.fehler,
      },
      page: decision.query.page,
      q: decision.query.q,
      users: [],
    }
  }
  return {
    read: { kind: 'ready', readAttempt, query: decision.query, count: fixture.count },
    page: decision.query.page,
    q: decision.query.q,
    users: fixture.users,
  }
}

function HarnessTable({
  mounted,
  generation,
  onUnmount,
  onRemount,
}: {
  mounted: boolean
  generation: number
  onUnmount: () => void
  onRemount: () => void
}) {
  const sp = useSearchParams()
  const search = sp.toString()
  const fixtureRef = React.useRef(DEFAULT_FIXTURE)
  const followRef = React.useRef(true)
  const [follow, setFollow] = React.useState(true)
  const [snapshot, setSnapshot] = React.useState(() => makeSnapshot(search, DEFAULT_FIXTURE))

  React.useEffect(() => {
    if (!follow) return
    setSnapshot(makeSnapshot(search, fixtureRef.current))
  }, [search, follow])

  React.useEffect(() => {
    const api = {
      ready: true,
      replaces: () => usersNavReplaces(),
      clearReplaces: () => clearUsersNavReplaces(),
      search: () => currentUsersSearch(),
      input: () =>
        (document.querySelector('input[aria-label="Nutzer nach Name oder E-Mail suchen"]') as HTMLInputElement | null)
          ?.value ?? null,
      pageText: () => document.querySelector('[data-users-directory-page]')?.textContent ?? null,
      status: () => document.querySelector('[data-users-directory-status]')?.textContent ?? '',
      countText: () => document.querySelector('[data-users-directory-count]')?.textContent ?? null,
      html: () => document.querySelector('[data-users-directory-root]')?.innerHTML ?? '',
      refreshCalls: () => usersNavRefreshCalls(),
      actionCalls: () => usersNavActionCalls(),
      pendingCommits: () => pendingUsersNavCommits(),
      external: (value: string) => externalUsersSearch(value),
      delayCommits: (delay: boolean) => setUsersNavDelayCommit(delay),
      commitNext: () => commitNextUsersNav(),
      back: () => backUsersSearch(),
      forward: () => forwardUsersSearch(),
      pushHistory: (value: string) => pushUsersHistory(value),
      follow: (value: boolean) => {
        followRef.current = value
        setFollow(value)
      },
      setFixture: (partial: Partial<Fixture>) => {
        fixtureRef.current = { ...fixtureRef.current, ...partial }
        if (followRef.current) setSnapshot(makeSnapshot(currentUsersSearch(), fixtureRef.current))
      },
      applyServer: () => setSnapshot(makeSnapshot(currentUsersSearch(), fixtureRef.current)),
      unmount: () => onUnmount(),
      remount: () => onRemount(),
    }
    ;(window as unknown as { __usersDirectory?: typeof api }).__usersDirectory = api
    return () => {
      delete (window as unknown as { __usersDirectory?: typeof api }).__usersDirectory
    }
  }, [])

  if (!mounted) return <div data-users-directory-unmounted="true" />
  return (
    <div data-users-directory-generation={generation}>
      <UsersTable
        key={generation}
        users={snapshot.users}
        page={snapshot.page}
        pageSize={20}
        total={snapshot.read.kind === 'ready' && snapshot.read.count !== null ? snapshot.read.count : 0}
        q={snapshot.q}
        actorId={ACTOR}
        actorRole="admin"
        assignable={ASSIGNABLE}
        read={snapshot.read}
      />
    </div>
  )
}

function HarnessApp() {
  const [mounted, setMounted] = React.useState(true)
  const [generation, setGeneration] = React.useState(1)
  const unmount = React.useCallback(() => setMounted(false), [])
  const remount = React.useCallback(() => {
    setMounted(true)
    setGeneration((value) => value + 1)
  }, [])

  return (
    <React.StrictMode>
      <main className="p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Benutzerverwaltung</h1>
        <p className="text-sm text-muted-foreground">Synthetische Zeilen · kein echtes Konto</p>
        <div className="mt-6">
          <HarnessTable mounted={mounted} generation={generation} onUnmount={unmount} onRemount={remount} />
        </div>
      </main>
    </React.StrictMode>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('harness root missing')
createRoot(root).render(<HarnessApp />)
