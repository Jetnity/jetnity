import * as React from 'react'
import { createRoot } from 'react-dom/client'

import UsersTable, { type UserRow } from '@/components/admin/UsersTable'
import type { Role } from '@/lib/auth/roles'
import { createdHonestyActionCalls } from './stubs/actions'
import { createdHonestyReplaces } from './stubs/next-navigation'

const REAL_CREATED_AT = '2024-06-15T14:30:00.000Z'
const REAL_LAST_SEEN_AT = '2024-07-01T08:00:00.000Z'
const ASSIGNABLE: Role[] = ['user', 'moderator']

type Mode = 'baseline' | 'fixed'

function readMode(): Mode {
  const value = (window as Window & { __createdHonestyMode?: string }).__createdHonestyMode
  return value === 'baseline' ? 'baseline' : 'fixed'
}

function dtf() {
  return new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' })
}

function baseRow(partial: Pick<UserRow, 'user_id' | 'display_name' | 'email' | 'created_at' | 'last_seen_at'>): UserRow {
  return {
    role: 'user',
    status: 'active',
    ...partial,
  }
}

function rowsFor(mode: Mode, inventedIso: string): UserRow[] {
  if (mode === 'baseline') {
    return [
      baseRow({
        user_id: 'synthetic-null-mapped',
        display_name: 'Baseline null mapping',
        email: 'null.mapping@example.test',
        created_at: inventedIso,
        last_seen_at: null,
      }),
      baseRow({
        user_id: 'synthetic-known',
        display_name: 'Known timestamp',
        email: 'known.time@example.test',
        created_at: REAL_CREATED_AT,
        last_seen_at: REAL_LAST_SEEN_AT,
      }),
    ]
  }

  return [
    baseRow({
      user_id: 'synthetic-unknown',
      display_name: 'Unknown creation',
      email: 'unknown.creation@example.test',
      created_at: null,
      last_seen_at: REAL_LAST_SEEN_AT,
    }),
    baseRow({
      user_id: 'synthetic-known',
      display_name: 'Known timestamp',
      email: 'known.time@example.test',
      created_at: REAL_CREATED_AT,
      last_seen_at: null,
    }),
  ]
}

function readTable() {
  return [...document.querySelectorAll('tbody tr')]
    .filter((row) => row.querySelectorAll('td').length > 1)
    .map((row) => {
      const cells = [...row.querySelectorAll('td')].map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim() ?? '')
      return {
        name: cells[0] ?? '',
        email: cells[1] ?? '',
        role: cells[2] ?? '',
        status: cells[3] ?? '',
        created: cells[4] ?? '',
        lastSeen: cells[5] ?? '',
      }
    })
}

function HarnessApp() {
  const mode = readMode()
  // Historical server expression: a missing created_at became the page clock.
  const inventedIso = (null as string | null) ?? new Date().toISOString()
  const format = dtf()
  const users = rowsFor(mode, inventedIso)

  React.useEffect(() => {
    const api = {
      ready: true,
      mode,
      inventedIso,
      realCreatedAt: REAL_CREATED_AT,
      realLastSeenAt: REAL_LAST_SEEN_AT,
      formattedInvented: format.format(new Date(inventedIso)),
      formattedRealCreated: format.format(new Date(REAL_CREATED_AT)),
      formattedRealLastSeen: format.format(new Date(REAL_LAST_SEEN_AT)),
      formattedEpoch: format.format(new Date(0)),
      formattedNow: format.format(new Date()),
      timeZone: format.resolvedOptions().timeZone,
      rows: () => readTable(),
      replaces: () => createdHonestyReplaces(),
      actionCalls: () => createdHonestyActionCalls(),
      searchValue: () =>
        (document.querySelector('input[placeholder="Suche nach Name oder E-Mail…"]') as HTMLInputElement | null)
          ?.value ?? null,
      pageText: () => document.querySelector('span.tabular-nums')?.textContent?.trim() ?? null,
    }
    ;(window as Window & { __createdHonesty?: typeof api }).__createdHonesty = api
  }, [format, inventedIso, mode, users])

  return (
    <main className="p-6 space-y-4">
      <p className="text-sm text-muted-foreground">
        Synthetische Zeilen. Kein angemeldetes Admin-Konto. Modus: {mode}
      </p>
      <UsersTable
        users={users}
        page={1}
        pageSize={20}
        total={users.length}
        q=""
        actorId="synthetic-actor"
        actorRole="admin"
        assignable={ASSIGNABLE}
      />
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing harness root')
createRoot(root).render(<HarnessApp />)
