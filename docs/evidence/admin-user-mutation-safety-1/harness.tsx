import * as React from 'react'
import { createRoot } from 'react-dom/client'

import UsersTable, { type UserRow, type UsersDirectoryReadModel } from '@/components/admin/UsersTable'
import { decideUsersDirectoryRead } from '@/lib/admin/users-directory-query'
import type { AccountStatus, Role } from '@/lib/auth/roles'
import {
  mutationCalls,
  rejectOldestHang,
  resolveOldestHang,
  setMutationMode,
} from './stubs/actions'
import { currentMutationSearch, mutationRefreshCount, mutationReplaces, useSearchParams } from './stubs/next-navigation'

const ACTOR = 'synthetic-actor'
const ASSIGNABLE: Role[] = ['user', 'creator', 'moderator', 'operator']

function row(
  id: string,
  name: string,
  email: string,
  role: Role | null,
  status: AccountStatus | null,
): UserRow {
  return {
    user_id: id,
    email,
    display_name: name,
    role,
    status,
    created_at: '2024-06-15T14:30:00.000Z',
    last_seen_at: '2026-03-01T12:00:00.000Z',
  }
}

const INITIAL: UserRow[] = [
  row('synthetic-ada', 'Ada Example', 'ada.example@example.test', 'user', 'active'),
  row('synthetic-bao', 'Bao Example', 'bao.example@example.test', 'operator', 'pending'),
  row('synthetic-cio', 'Cio Example', 'cio.example@example.test', 'admin', 'banned'),
  row(ACTOR, 'Akteur Selbst', 'actor.example@example.test', 'admin', 'active'),
  row('synthetic-unknown-role', 'Unbekannte Rolle', 'unknown-role@example.test', null, 'active'),
  row('synthetic-unknown-status', 'Unbekannter Status', 'unknown-status@example.test', 'user', null),
  row('bad id', 'Unbrauchbare Kennung', 'bad-id@example.test', 'user', 'active'),
]

type ReadMode = 'follow' | 'error' | 'invalid'

function HarnessTable({ mounted, generation }: { mounted: boolean; generation: number }) {
  const sp = useSearchParams()
  const search = sp.toString()
  const [snapshot, setSnapshot] = React.useState<{ rows: UserRow[]; attempt: string; mode: ReadMode }>({
    rows: INITIAL,
    attempt: 'read-seed',
    mode: 'follow',
  })
  const { rows, attempt, mode } = snapshot

  const decision = decideUsersDirectoryRead(new URLSearchParams(search))
  const fallbackQuery = { q: '', page: 1, role: null, status: null } as const
  const read: UsersDirectoryReadModel =
    mode === 'error'
      ? {
          kind: 'error',
          readAttempt: attempt,
          query: decision.kind === 'query' ? decision.query : fallbackQuery,
          fehler: { meldung: 'Datenbank abgelehnt', wiederholbar: true },
        }
      : mode === 'invalid' || decision.kind === 'invalid'
        ? {
            kind: 'invalid',
            readAttempt: attempt,
            reason: decision.kind === 'invalid' ? decision.reason : 'repeated',
            recoveryHref: decision.kind === 'invalid' ? decision.recovery : '/admin/users?page=1',
          }
        : { kind: 'ready', readAttempt: attempt, query: decision.query, count: rows.length }

  React.useEffect(() => {
    const storage = window.localStorage
    const session = window.sessionStorage
    const localSet = storage.setItem.bind(storage)
    const sessionSet = session.setItem.bind(session)
    let writes = 0
    storage.setItem = (key: string, value: string) => {
      writes += 1
      localSet(key, value)
    }
    session.setItem = (key: string, value: string) => {
      writes += 1
      sessionSet(key, value)
    }
    const api = {
      ready: true,
      calls: () => mutationCalls(),
      refreshes: () => mutationRefreshCount(),
      replaces: () => mutationReplaces(),
      search: () => currentMutationSearch(),
      storageWrites: () => writes,
      setRows: (next: UserRow[]) => setSnapshot((current) => ({ ...current, rows: next })),
      bump: () => setSnapshot((current) => ({ ...current, attempt: crypto.randomUUID(), mode: 'follow' })),
      deliver: (next: { rows?: UserRow[]; mode: 'ready' | 'error' | 'invalid' }) =>
        setSnapshot((current) => ({
          rows: next.rows ?? current.rows,
          mode: next.mode === 'ready' ? 'follow' : next.mode,
          attempt: crypto.randomUUID(),
        })),
      hang: () => setMutationMode('hang'),
      resolveNext: () => setMutationMode('resolve'),
      rejectNext: (message: string) => setMutationMode('reject', message),
      transportNext: () => setMutationMode('transport'),
      releaseHang: () => resolveOldestHang(),
      failHang: (message: string) => rejectOldestHang(message),
      phases: () =>
        [...document.querySelectorAll<HTMLElement>('[data-mutation-phase]')].map((node) => ({
          phase: node.getAttribute('data-mutation-phase'),
          subject: node.getAttribute('data-mutation-subject'),
          reason: node.getAttribute('data-mutation-reason'),
          detached: Boolean(node.closest('[data-mutation-detached]')),
          text: node.textContent ?? '',
        })),
      rowText: (id: string) => document.querySelector(`[data-user-row="${CSS.escape(id)}"]`)?.textContent ?? '',
      holds: () =>
        [...document.querySelectorAll<HTMLElement>('[data-hold]')].map((node) => node.getAttribute('data-hold')),
    }
    ;(window as unknown as { __mutation?: typeof api }).__mutation = api
    return () => {
      storage.setItem = localSet
      session.setItem = sessionSet
    }
  }, [])

  if (!mounted) return <div data-mutation-unmounted="true" />
  return (
    <div data-mutation-generation={generation}>
      <UsersTable
        key={generation}
        users={rows}
        page={decision.kind === 'query' ? decision.query.page : 1}
        pageSize={20}
        total={rows.length}
        q={decision.kind === 'query' ? decision.query.q : ''}
        actorId={ACTOR}
        actorRole="admin"
        assignable={ASSIGNABLE}
        read={read}
      />
    </div>
  )
}

function HarnessApp() {
  const [mounted, setMounted] = React.useState(true)
  const [generation, setGeneration] = React.useState(1)
  React.useEffect(() => {
    const win = window as unknown as { __mutationMount?: { unmount: () => void; remount: () => void } }
    win.__mutationMount = {
      unmount: () => setMounted(false),
      remount: () => {
        setMounted(true)
        setGeneration((value) => value + 1)
      },
    }
  }, [])
  return (
    <React.StrictMode>
      <main className="p-4">
        <h1 className="text-2xl font-semibold tracking-tight">Benutzerverwaltung</h1>
        <p className="text-sm text-muted-foreground">Synthetische Zeilen. Kein echtes Konto.</p>
        <div className="mt-4">
          <HarnessTable mounted={mounted} generation={generation} />
        </div>
      </main>
    </React.StrictMode>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('harness root missing')
createRoot(root).render(<HarnessApp />)

declare global {
  interface Window {
    __mutation?: {
      ready: boolean
      calls: () => Array<{ name: string; userId: string; value: string }>
      refreshes: () => number
      replaces: () => string[]
      search: () => string
      storageWrites: () => number
      setRows: (next: UserRow[]) => void
      bump: () => void
      deliver: (next: { rows?: UserRow[]; mode: 'ready' | 'error' | 'invalid' }) => void
      hang: () => void
      resolveNext: () => void
      rejectNext: (message: string) => void
      transportNext: () => void
      releaseHang: () => void
      failHang: (message: string) => void
      phases: () => Array<{ phase: string | null; subject: string | null; reason: string | null; detached: boolean; text: string }>
      rowText: (id: string) => string
      holds: () => Array<string | null>
    }
    __mutationMount?: { unmount: () => void; remount: () => void }
  }
}
