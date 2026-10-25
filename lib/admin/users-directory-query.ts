// Reine Leseentscheidung für /admin/users.
// Kein Next-, React- oder Supabase-Import. Die Seite liefert den Client.

import { isAccountStatus, isRole, type AccountStatus, type Role } from '@/lib/auth/roles'
import { textSuchfilter } from '@/lib/api/suchfilter'
import { buildUsersListHref } from '@/lib/admin/users-search-navigation'

export const USERS_DIRECTORY_PAGE_SIZE = 20
export const USERS_DIRECTORY_Q_MAX = 200
export const USERS_DIRECTORY_MAX_PAGE = 5000

const SELECT_COLUMNS = 'user_id, email, display_name, role, status, created_at, last_seen_at'

export type UsersDirectoryQuery = {
  q: string
  page: number
  role: Role | null
  status: AccountStatus | null
}

export type UsersDirectoryInvalidReason =
  | 'repeated'
  | 'non-scalar'
  | 'oversized-q'
  | 'malformed-page'
  | 'page-above-max'
  | 'invalid-role'
  | 'invalid-status'

export type UsersDirectoryDecision =
  | { kind: 'query'; query: UsersDirectoryQuery }
  | {
      kind: 'invalid'
      reason: UsersDirectoryInvalidReason
      recovery: string
    }

export type UsersDirectoryResponse = {
  data: unknown
  count?: unknown
  error: { message: string; code?: string | null } | null
  status?: number
}

export type UsersDirectoryChain = {
  select: (columns: string, options: { count: 'exact' }) => UsersDirectoryChain
  order: (column: string, options: { ascending: boolean }) => UsersDirectoryChain
  range: (from: number, to: number) => UsersDirectoryChain
  or: (expression: string) => UsersDirectoryChain
  eq: (column: string, value: string) => UsersDirectoryChain
  then: (
    resolve: (value: UsersDirectoryResponse) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise<unknown>
}

export type UsersDirectoryClient = {
  from: (table: string) => UsersDirectoryChain
}

export type UsersDirectoryRead = {
  rows: unknown[]
  count: number | null
  error: { message: string; code?: string | null } | null
  status?: number
}

type Scalar = { ok: true; value: string | null } | { ok: false; reason: 'repeated' | 'non-scalar' }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function scalarAt(raw: unknown, key: string): Scalar {
  if (raw instanceof URLSearchParams) {
    const values = raw.getAll(key)
    if (values.length === 0) return { ok: true, value: null }
    if (values.length > 1) return { ok: false, reason: 'repeated' }
    return { ok: true, value: values[0] ?? null }
  }
  if (!isRecord(raw) && raw !== undefined && raw !== null) return { ok: false, reason: 'non-scalar' }
  if (raw === undefined || raw === null) return { ok: true, value: null }
  const value = raw[key]
  if (value === undefined) return { ok: true, value: null }
  if (Array.isArray(value)) {
    if (value.length > 1) return { ok: false, reason: 'repeated' }
    if (value.length === 0) return { ok: true, value: null }
    const only = value[0]
    if (typeof only !== 'string') return { ok: false, reason: 'non-scalar' }
    return { ok: true, value: only }
  }
  if (typeof value !== 'string') return { ok: false, reason: 'non-scalar' }
  return { ok: true, value }
}

function pageFromCanonical(text: string): { ok: true; page: number } | { ok: false; reason: 'malformed-page' | 'page-above-max' } {
  const trimmed = text.trim()
  if (!/^[1-9][0-9]*$/.test(trimmed)) return { ok: false, reason: 'malformed-page' }
  let page = 0
  for (const char of trimmed) {
    page = page * 10 + (char.charCodeAt(0) - 48)
    if (page > USERS_DIRECTORY_MAX_PAGE) return { ok: false, reason: 'page-above-max' }
  }
  if (page < 1) return { ok: false, reason: 'malformed-page' }
  return { ok: true, page }
}

function recoveryBase(current: unknown): URLSearchParams | string {
  if (current instanceof URLSearchParams) return current
  if (!isRecord(current)) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(current)) {
    if (typeof value === 'string') params.append(key, value)
    else if (Array.isArray(value) && value.length === 1 && typeof value[0] === 'string') {
      params.append(key, value[0])
    }
  }
  return params
}

function recoveryHref(current: unknown, query: UsersDirectoryQuery): string {
  return buildUsersListHref(recoveryBase(current), {
    q: query.q,
    page: 1,
    role: query.role,
    status: query.status,
  })
}

export function usersDirectoryQueryKey(query: UsersDirectoryQuery): string {
  return `${query.page}\n${query.role ?? ''}\n${query.status ?? ''}\n${query.q}`
}

export function decideUsersDirectoryRead(raw: unknown): UsersDirectoryDecision {
  const qField = scalarAt(raw, 'q')
  const pageField = scalarAt(raw, 'page')
  const roleField = scalarAt(raw, 'role')
  const statusField = scalarAt(raw, 'status')

  let q = ''
  let qReason: UsersDirectoryInvalidReason | null = null
  if (!qField.ok) qReason = qField.reason
  else if (qField.value !== null) {
    const trimmed = qField.value.trim()
    if (trimmed.length > USERS_DIRECTORY_Q_MAX) qReason = 'oversized-q'
    else q = trimmed
  }

  let page = 1
  let pageReason: UsersDirectoryInvalidReason | null = null
  if (!pageField.ok) pageReason = pageField.reason
  else if (pageField.value !== null) {
    const parsed = pageFromCanonical(pageField.value)
    if (!parsed.ok) pageReason = parsed.reason
    else page = parsed.page
  }

  let role: Role | null = null
  let roleReason: UsersDirectoryInvalidReason | null = null
  if (!roleField.ok) roleReason = roleField.reason
  else if (roleField.value !== null && roleField.value.trim() !== '') {
    const token = roleField.value.trim()
    if (!isRole(token)) roleReason = 'invalid-role'
    else role = token
  }

  let status: AccountStatus | null = null
  let statusReason: UsersDirectoryInvalidReason | null = null
  if (!statusField.ok) statusReason = statusField.reason
  else if (statusField.value !== null && statusField.value.trim() !== '') {
    const token = statusField.value.trim()
    if (!isAccountStatus(token)) statusReason = 'invalid-status'
    else status = token
  }

  const reason = qReason ?? pageReason ?? roleReason ?? statusReason
  if (!reason) return { kind: 'query', query: { q, page, role, status } }
  return { kind: 'invalid', reason, recovery: recoveryHref(raw, { q, page: 1, role, status }) }
}

export function normalizeDirectoryCount(count: unknown): number | null {
  return typeof count === 'number' && Number.isInteger(count) && count >= 0 && count <= Number.MAX_SAFE_INTEGER
    ? count
    : null
}

export function usersDirectoryRange(page: number): { from: number; to: number } {
  const from = (page - 1) * USERS_DIRECTORY_PAGE_SIZE
  return { from, to: from + USERS_DIRECTORY_PAGE_SIZE - 1 }
}

export async function executeUsersDirectoryRead(
  client: UsersDirectoryClient,
  query: UsersDirectoryQuery,
): Promise<UsersDirectoryRead> {
  const range = usersDirectoryRange(query.page)
  let chain = client
    .from('profiles')
    .select(SELECT_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('user_id', { ascending: true })
    .range(range.from, range.to)
  if (query.q) chain = chain.or(textSuchfilter(['display_name', 'email'], query.q))
  if (query.role) chain = chain.eq('role', query.role)
  if (query.status) chain = chain.eq('status', query.status)
  const response = (await chain) as UsersDirectoryResponse
  if (response.error) {
    return { rows: [], count: null, error: response.error, status: response.status }
  }
  if (!Array.isArray(response.data)) {
    return {
      rows: [],
      count: null,
      error: { message: 'Die Abfrage lieferte weder Daten noch einen Fehler.' },
      status: response.status ?? 500,
    }
  }
  return {
    rows: response.data,
    count: normalizeDirectoryCount(response.count),
    error: null,
    status: response.status,
  }
}

export async function readUsersDirectory<TUser extends { id: string }>(args: {
  guard: () => Promise<{ user: TUser; role: Role | null }>
  canManage: (role: Role) => boolean
  loadRaw: () => Promise<unknown>
  openClient: () => Promise<UsersDirectoryClient>
}): Promise<
  | { kind: 'denied' }
  | { kind: 'invalid'; decision: Extract<UsersDirectoryDecision, { kind: 'invalid' }>; user: TUser; role: Role }
  | { kind: 'read'; decision: Extract<UsersDirectoryDecision, { kind: 'query' }>; user: TUser; role: Role; result: UsersDirectoryRead }
> {
  const { user, role } = await args.guard()
  if (!role || !args.canManage(role)) return { kind: 'denied' }
  const raw = await args.loadRaw()
  const decision = decideUsersDirectoryRead(raw)
  if (decision.kind !== 'query') return { kind: 'invalid', decision, user, role }
  const client = await args.openClient()
  const result = await executeUsersDirectoryRead(client, decision.query)
  return { kind: 'read', decision, user, role, result }
}
