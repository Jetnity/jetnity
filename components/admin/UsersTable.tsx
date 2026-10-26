// components/admin/UsersTable.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Fehlerflaeche } from '@/components/admin/Ladezustand'
import { ChevronLeft, ChevronRight, MoreHorizontal, Shield } from 'lucide-react'
import { setUserRole, setUserStatus } from '@/app/(admin)/admin/users/actions'
import type { Fehler } from '@/lib/admin/ladezustand'
import {
  banToggleTarget,
  isDispatchableUserId,
  mutationBlockReason,
} from '@/lib/admin/user-row-truth'
import {
  cancelConfirmation,
  confirmDispatch,
  detachedOperations,
  dismissFeedback,
  EMPTY_LIFECYCLE,
  isTransportFailure,
  MUTATION_TRANSPORT_TIMEOUT_MS,
  noteFulfilled,
  noteRejected,
  noteTransportFailure,
  liveHold,
  observeLifecycle,
  releaseHiddenConfirmations,
  requestConfirmation,
  type LifecycleState,
  type MutationIntent,
  type TargetOperation,
  type TruthRow,
} from '@/lib/admin/user-mutation-lifecycle'
import { UserMutationConfirmation } from '@/components/admin/users/UserMutationConfirmation'
import { USER_MUTATION_CONFIRMATION_CSS } from '@/components/admin/users/user-mutation-confirmation.css'
import {
  blockCopy,
  DETACHED_PREFIX,
  outcomeCopy,
  RECOVER_LABEL,
  roleLabel,
  statusLabel,
  STATUS_LABELS,
} from '@/components/admin/users/user-mutation-copy'
import {
  buildUsersListHref,
  normalizeUserSearch,
  userSearchEditChangesFilter,
  userSearchHrefCarriesDraft,
  USERS_SEARCH_DEBOUNCE_MS,
  usersListHrefFromParams,
  usersListHrefMatches,
} from '@/lib/admin/users-search-navigation'
import {
  decideUsersDirectoryRead,
  USERS_DIRECTORY_MAX_PAGE,
  usersDirectoryLiveMatchesQuery,
  usersDirectoryQueryKey,
  type UsersDirectoryInvalidReason,
  type UsersDirectoryQuery,
} from '@/lib/admin/users-directory-query'
import {
  DIRECTORY_ADDRESS_UNREADABLE,
  DIRECTORY_CHECK_UNCONFIRMED,
  DIRECTORY_CHECKING,
  DIRECTORY_CURRENT,
  DIRECTORY_PREVIOUS,
  directoryCeilingCopy,
  directoryCountLabel,
  directoryInvalidReason,
  directoryPageLabel,
  directoryView,
  formatUsersDirectoryTimestamp,
  lastDirectoryPage,
  nextDirectoryPage,
  previousDirectoryPage,
  USERS_DIRECTORY_REFRESH_LEASE_MS,
} from '@/lib/admin/users-directory-presentation'
import {
  ACCOUNT_STATUSES,
  isRole,
  ROLE_LABELS,
  ROLES,
  type AccountStatus,
  type Role,
} from '@/lib/auth/roles'

export type UserRow = {
  user_id: string
  email: string | null
  display_name: string | null
  role: Role | null
  status: AccountStatus | null
  created_at: string | null
  last_seen_at: string | null
}

export type UsersDirectoryReadModel =
  | {
      kind: 'ready'
      readAttempt: string
      query: UsersDirectoryQuery
      count: number | null
    }
  | {
      kind: 'invalid'
      readAttempt: string
      reason: UsersDirectoryInvalidReason
      recoveryHref: string
    }
  | {
      kind: 'error'
      readAttempt: string
      query: UsersDirectoryQuery
      fehler: Fehler
    }

type NavigateOperation = {
  kind: 'navigate'
  phase: 'dispatched' | 'acknowledged' | 'settled' | 'cancelled'
  href: string
  targetKey: string
  attempt: string
  q: string
}

type RefreshLease = {
  id: number
  phase: 'checking' | 'settled' | 'cancelled' | 'released'
  attempt: string
  queryKey: string
  href: string
}

function truthOf(user: UserRow): TruthRow {
  return {
    userId: user.user_id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    status: user.status,
  }
}

function targetOfHref(href: string): { key: string; q: string } {
  const params = new URLSearchParams(href.includes('?') ? href.slice(href.indexOf('?') + 1) : '')
  const decision = decideUsersDirectoryRead(params)
  if (decision.kind !== 'query') return { key: '', q: normalizeUserSearch(params.get('q') ?? '') }
  return { key: usersDirectoryQueryKey(decision.query), q: decision.query.q }
}

function readSettles(read: UsersDirectoryReadModel, operation: NavigateOperation): boolean {
  if (read.readAttempt === operation.attempt) return false
  if (read.kind === 'invalid') return operation.targetKey === ''
  return usersDirectoryQueryKey(read.query) === operation.targetKey
}

export default function UsersTable({
  users,
  page,
  pageSize,
  total,
  q,
  actorId,
  actorRole,
  assignable,
  read,
}: {
  users: UserRow[]
  page: number
  pageSize: number
  total: number
  q: string
  actorId: string
  actorRole: Role
  /** Rollen, die der Aufrufer vergeben darf – serverseitig bestimmt. */
  assignable: Role[]
  read?: UsersDirectoryReadModel
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const urlQuery = sp?.toString() ?? ''
  // Die Adresse ist die bestätigte Suche. `q` beschreibt den Serverstand und
  // darf einen inzwischen geänderten URL-Stand nicht wiederherstellen.
  const urlQ = sp?.has('q') ? normalizeUserSearch(sp.get('q') ?? '') : ''
  const rawRole = sp?.get('role') ?? ''
  const rawStatus = sp?.get('status') ?? ''
  const [search, setSearch] = React.useState(() => normalizeUserSearch(q ?? ''))
  const [trackedUrl, setTrackedUrl] = React.useState(urlQuery)
  const [ownSearchAcks, setOwnSearchAcks] = React.useState<string[]>([])
  const [historyTraversal, setHistoryTraversal] = React.useState(0)
  const [seenTraversal, setSeenTraversal] = React.useState(0)
  const [lifecycle, setLifecycle] = React.useState<LifecycleState>(EMPTY_LIFECYCLE)
  const [operation, setOperation] = React.useState<NavigateOperation | null>(null)
  const [lease, setLease] = React.useState<RefreshLease | null>(null)
  const epoch = React.useRef(0)
  const spRef = React.useRef(sp)
  const routerRef = React.useRef(router)
  const readRef = React.useRef(read)
  const searchRef = React.useRef(search)
  const operationRef = React.useRef(operation)
  const leaseRef = React.useRef(lease)
  const mountedRef = React.useRef(true)
  const leaseSeq = React.useRef(0)
  const lifecycleRef = React.useRef(lifecycle)
  const usersRef = React.useRef(users)

  React.useEffect(() => {
    readRef.current = read
    searchRef.current = search
    operationRef.current = operation
    leaseRef.current = lease
    spRef.current = sp
    routerRef.current = router
    usersRef.current = users
    lifecycleRef.current = lifecycle
  })

  React.useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      epoch.current += 1
      if (leaseRef.current?.phase === 'checking') {
        leaseRef.current = { ...leaseRef.current, phase: 'cancelled' }
      }
      if (
        operationRef.current &&
        (operationRef.current.phase === 'dispatched' || operationRef.current.phase === 'acknowledged')
      ) {
        operationRef.current = { ...operationRef.current, phase: 'cancelled' }
      }
    }
  }, [])

  const cancelLease = React.useCallback(() => {
    const current = leaseRef.current
    if (!current || current.phase !== 'checking') return
    const cancelled = { ...current, phase: 'cancelled' as const }
    leaseRef.current = cancelled
    if (mountedRef.current) setLease(cancelled)
  }, [])

  const dispatchNavigate = React.useCallback((href: string) => {
    const target = targetOfHref(href)
    cancelLease()
    const currentRead = readRef.current
    if (currentRead) {
      const next: NavigateOperation = {
        kind: 'navigate',
        phase: 'dispatched',
        href,
        targetKey: target.key,
        attempt: currentRead.readAttempt,
        q: target.q,
      }
      operationRef.current = next
      setOperation(next)
    }
    setOwnSearchAcks((current) =>
      current.some((item) => usersListHrefMatches(item, href)) ? current : [...current, href],
    )
    routerRef.current.replace(href)
  }, [cancelLease])

  // pushState/replaceState feuern kein popstate. Natives Zurück/Vor schon.
  // Eine Adressgleichheit allein darf das nicht als eigene Suchbestätigung lesen.
  React.useEffect(() => {
    const onPopState = () => {
      epoch.current += 1
      setOwnSearchAcks([])
      setHistoryTraversal((value) => value + 1)
      cancelLease()
      const currentRead = readRef.current
      if (!currentRead || !mountedRef.current) return
      const href = `${window.location.pathname}${window.location.search}`
      const target = targetOfHref(href)
      const next: NavigateOperation = {
        kind: 'navigate',
        phase: 'dispatched',
        href,
        targetKey: target.key,
        attempt: currentRead.readAttempt,
        q: target.q,
      }
      operationRef.current = next
      setOperation(next)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [cancelLease])

  const nativeTraversal = historyTraversal !== seenTraversal
  const hrefNow = usersListHrefFromParams(sp)
  const ackIndex = ownSearchAcks.findIndex((href) => usersListHrefMatches(href, hrefNow))
  const ownAck = !nativeTraversal && ackIndex >= 0
  if (trackedUrl !== urlQuery || nativeTraversal) {
    if (trackedUrl !== urlQuery) setTrackedUrl(urlQuery)
    if (nativeTraversal) setSeenTraversal(historyTraversal)
    if (ownAck) setOwnSearchAcks(ownSearchAcks.slice(ackIndex + 1))
    else if (ownSearchAcks.length > 0) setOwnSearchAcks([])
    // Nur fremde Navigation, natives Zurück/Vor und Seitenwechsel übernehmen
    // die URL ins Feld. Die verspätete Bestätigung der eigenen Suche lässt
    // einen inzwischen neueren Entwurf stehen.
    if (!ownAck && search !== urlQ) setSearch(urlQ)
  }

  if (read && lease?.phase === 'checking' && trackedUrl !== urlQuery) {
    const cancelled = { ...lease, phase: 'cancelled' as const }
    setLease(cancelled)
  }

  if (read && (trackedUrl !== urlQuery || nativeTraversal) && !ownAck) {
    const target = targetOfHref(hrefNow)
    const propsMatch =
      read.kind === 'invalid' ? target.key === '' : usersDirectoryQueryKey(read.query) === target.key
    const already =
      operation !== null &&
      usersListHrefMatches(operation.href, hrefNow) &&
      (operation.phase === 'dispatched' || operation.phase === 'acknowledged' || operation.phase === 'settled')
    if (!already) {
      const next: NavigateOperation = {
        kind: 'navigate',
        phase: propsMatch ? 'settled' : 'dispatched',
        href: hrefNow,
        targetKey: target.key,
        attempt: read.readAttempt,
        q: target.q,
      }
      setOperation(next)
    }
  } else if (
    read &&
    operation &&
    (operation.phase === 'dispatched' || operation.phase === 'acknowledged') &&
    usersListHrefMatches(hrefNow, operation.href)
  ) {
    if (readSettles(read, operation)) {
      const settled = { ...operation, phase: 'settled' as const }
      setOperation(settled)
    } else if (operation.phase === 'dispatched') {
      const acknowledged = { ...operation, phase: 'acknowledged' as const }
      setOperation(acknowledged)
    }
  }

  if (read && lease?.phase === 'checking' && read.readAttempt !== lease.attempt) {
    const sameQuery =
      read.kind !== 'invalid' && usersDirectoryQueryKey(read.query) === lease.queryKey
    const sameInvalid = read.kind === 'invalid' && usersListHrefMatches(hrefNow, lease.href)
    const done = { ...lease, phase: (sameQuery || sameInvalid ? 'settled' : 'cancelled') as RefreshLease['phase'] }
    setLease(done)
  }

  // Nur ein normalisiert anderer Entwurf bestätigt nach 400 ms und setzt dann
  // auf Seite 1. Öffnen, Neuladen und dieselbe Suche schreiben die URL nicht um.
  React.useEffect(() => {
    const draft = normalizeUserSearch(search)
    if (draft === urlQ) return
    if (ownSearchAcks.some((href) => userSearchHrefCarriesDraft(href, draft))) return
    const ticket = ++epoch.current
    const handle = window.setTimeout(() => {
      if (ticket !== epoch.current) return
      const aktuell = spRef.current
      const href = buildUsersListHref(aktuell, { q: draft, page: 1 })
      if (href === usersListHrefFromParams(aktuell)) return
      dispatchNavigate(href)
    }, USERS_SEARCH_DEBOUNCE_MS)
    return () => {
      window.clearTimeout(handle)
      if (epoch.current === ticket) epoch.current += 1
    }
  }, [search, urlQ, urlQuery, ownSearchAcks, dispatchNavigate])

  React.useEffect(() => {
    if (!lease || lease.phase !== 'checking') return
    const id = lease.id
    const attempt = lease.attempt
    const handle = window.setTimeout(() => {
      if (!mountedRef.current) return
      const current = leaseRef.current
      if (!current || current.id !== id || current.phase !== 'checking') return
      if (readRef.current && readRef.current.readAttempt !== attempt) return
      const released = { ...current, phase: 'released' as const }
      leaseRef.current = released
      setLease(released)
    }, USERS_DIRECTORY_REFRESH_LEASE_MS)
    return () => window.clearTimeout(handle)
  }, [lease])

  const visibleIds = new Set(users.map((user) => user.user_id))
  React.useEffect(() => {
    const ids = new Set(users.map((user) => user.user_id))
    const canonical = !read || read.kind === 'ready'
    let next = canonical ? releaseHiddenConfirmations(lifecycleRef.current, ids) : lifecycleRef.current
    if (read?.kind === 'ready') {
      next = observeLifecycle(next, users.map(truthOf), read.readAttempt, 'accepted')
    } else if (read) {
      next = observeLifecycle(next, users.map(truthOf), read.readAttempt, read.kind === 'error' ? 'failed' : 'invalid')
    }
    if (next === lifecycleRef.current) return
    lifecycleRef.current = next
    setLifecycle(next)
  }, [users, read])

  React.useEffect(() => {
    const pending = Object.values(lifecycle.byTarget).filter((item) => item.phase === 'pending')
    if (pending.length === 0) return
    const timers = pending.map((item) =>
      window.setTimeout(() => {
        const current = lifecycleRef.current.byTarget[item.subject.userId]
        if (!current || current.id !== item.id || current.phase !== 'pending') return
        const next = noteTransportFailure(lifecycleRef.current, item.subject.userId, item.id)
        lifecycleRef.current = next
        if (mountedRef.current) setLifecycle(next)
      }, MUTATION_TRANSPORT_TIMEOUT_MS),
    )
    return () => {
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [lifecycle])

  const maxPage = Math.max(1, Math.ceil(total / pageSize))
  const directoryCount = read?.kind === 'ready' ? read.count : null
  const filtered = Boolean(urlQ || rawRole || rawStatus)
  const view =
    read?.kind === 'ready' ? directoryView({ count: directoryCount, page, filtered }) : null
  const previousPage = read ? previousDirectoryPage(page) : page > 1 ? page - 1 : null
  const nextPage = read
    ? read.kind === 'ready'
      ? nextDirectoryPage({ page, count: directoryCount, rowCount: users.length })
      : null
    : page < maxPage
      ? page + 1
      : null
  const reachableLast = read?.kind === 'ready' && directoryCount !== null ? lastDirectoryPage(directoryCount) : null
  const showFirstLast = read?.kind === 'ready' && directoryCount !== null && view?.kind !== 'unknown-count'
  const navigateOpen =
    operation !== null && (operation.phase === 'dispatched' || operation.phase === 'acknowledged')
  const draftDiffers = userSearchEditChangesFilter(urlQ, search)
  const showPrevious = Boolean(read) && (navigateOpen || draftDiffers)
  const checking = lease?.phase === 'checking'
  const showRows = read ? read.kind === 'ready' : true

  function goto(p: number) {
    if (read) {
      if (!Number.isInteger(p) || p < 1 || p > USERS_DIRECTORY_MAX_PAGE) return
      cancelLease()
    }
    const np = read ? p : Math.min(Math.max(1, p), maxPage)
    // Seitenwechsel behält den bestätigten Filter. Ein noch nicht bestätigter
    // Entwurf wird verworfen, damit Feld und Ergebnisliste übereinstimmen,
    // und der laufende Timer kann die neue Seite nicht zurücksetzen.
    epoch.current += 1
    if (search !== urlQ) setSearch(urlQ)
    if (ownSearchAcks.length > 0) setOwnSearchAcks([])
    const href = buildUsersListHref(sp, { q: urlQ, page: np })
    if (href === usersListHrefFromParams(sp)) return
    if (read) dispatchNavigate(href)
    else router.replace(href)
  }

  function commitFilters(change: { role?: string | null; status?: string | null }) {
    cancelLease()
    epoch.current += 1
    if (search !== urlQ) setSearch(urlQ)
    // Die bereits ausgelöste Suche bleibt eine eigene Bestätigung. Sonst wirkt
    // ihre verspätete Adresse wie eine fremde Navigation und überschreibt das
    // neuere Rollen- oder Statusziel.
    const href = buildUsersListHref(sp, { q: urlQ, page: 1, ...change })
    if (href === usersListHrefFromParams(sp)) return
    dispatchNavigate(href)
  }

  function clearFilters() {
    epoch.current += 1
    cancelLease()
    setSearch('')
    const href = buildUsersListHref(sp, { q: '', page: 1, role: null, status: null })
    const same = usersListHrefMatches(href, usersListHrefFromParams(sp))
    const open = operationRef.current
    const inFlight =
      ownSearchAcks.length > 0 || open?.phase === 'dispatched' || open?.phase === 'acknowledged'
    // Dieselbe Adresse ist nur dann ein No-Op, wenn keine eigene Navigation
    // noch aussteht. Eine verspätete Suchbestätigung bleibt in ownSearchAcks,
    // damit sie das neuere Löschen nicht als fremde Adresse überschreibt.
    if (same && !inFlight) return
    dispatchNavigate(href)
  }

  function onSearchChange(next: string) {
    setSearch(next)
    if (!read || !userSearchEditChangesFilter(urlQ, next)) return
    cancelLease()
    const current = operationRef.current
    if (
      current &&
      (current.phase === 'dispatched' || current.phase === 'acknowledged') &&
      userSearchEditChangesFilter(current.q, next)
    ) {
      const cancelled = { ...current, phase: 'cancelled' as const }
      operationRef.current = cancelled
      setOperation(cancelled)
    }
  }

  function retry() {
    const currentRead = readRef.current
    if (!currentRead || currentRead.kind !== 'error') return
    if (leaseRef.current?.phase === 'checking') return
    if (userSearchEditChangesFilter(urlQ, searchRef.current)) return
    const live = spRef.current
    if (!usersDirectoryLiveMatchesQuery(live, currentRead.query)) return
    const failed = buildUsersListHref(live, {
      q: currentRead.query.q,
      page: currentRead.query.page,
      role: currentRead.query.role,
      status: currentRead.query.status,
    })
    const open = operationRef.current
    if (open && (open.phase === 'dispatched' || open.phase === 'acknowledged')) return
    const next: RefreshLease = {
      id: ++leaseSeq.current,
      phase: 'checking',
      attempt: currentRead.readAttempt,
      queryKey: usersDirectoryQueryKey(currentRead.query),
      href: failed,
    }
    leaseRef.current = next
    setLease(next)
    routerRef.current.refresh()
  }

  function publish(next: LifecycleState) {
    lifecycleRef.current = next
    setLifecycle(next)
  }

  function currentQueryKey(): string | null {
    const current = readRef.current
    if (!current) return null
    if (current.kind === 'invalid') return `invalid:${current.reason}`
    return usersDirectoryQueryKey(current.query)
  }

  /**
   * Was die Tabelle anbietet, spiegelt nur die serverseitige Regel – die
   * Entscheidung fällt in der Server-Action. Ein eigener Rang lässt sich nicht
   * ändern, und fremde Konten nur unterhalb des eigenen Rangs. Unbekannte
   * gespeicherte Werte werden nicht als gewöhnliches Konto behandelt.
   */
  function begin(user: UserRow, intent: MutationIntent) {
    if (!user.role || !user.status) return
    if (
      mutationBlockReason({
        userId: user.user_id,
        role: user.role,
        status: user.status,
        actorId,
        actorRole,
      })
    ) {
      return
    }
    const decision = requestConfirmation(lifecycleRef.current, {
      id: crypto.randomUUID(),
      subject: {
        userId: user.user_id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        status: user.status,
      },
      intent,
      queryKey: currentQueryKey(),
    })
    if (!decision.ok) return
    publish(decision.state)
  }

  async function commit(targetId: string) {
    const currentRead = readRef.current
    const decision = confirmDispatch(lifecycleRef.current, targetId, {
      rows: usersRef.current.map(truthOf),
      actorId,
      actorRole,
      assignable,
      readAttempt: currentRead?.readAttempt ?? null,
    })
    publish(decision.state)
    if (!decision.ok) return
    const operation = decision.operation
    try {
      if (operation.intent.kind === 'role') await setUserRole(operation.subject.userId, operation.intent.nextRole)
      else await setUserStatus(operation.subject.userId, operation.intent.nextStatus)
      if (!mountedRef.current) return
      const live = lifecycleRef.current.byTarget[targetId]
      if (!live || live.id !== operation.id || live.phase !== 'pending') return
      publish(noteFulfilled(lifecycleRef.current, targetId, operation.id, readRef.current?.readAttempt ?? null))
      routerRef.current.refresh()
    } catch (error: unknown) {
      if (!mountedRef.current) return
      const live = lifecycleRef.current.byTarget[targetId]
      if (!live || live.id !== operation.id || live.phase !== 'pending') return
      const next = isTransportFailure(error)
        ? noteTransportFailure(lifecycleRef.current, targetId, operation.id)
        : noteRejected(
            lifecycleRef.current,
            targetId,
            operation.id,
            error instanceof Error && error.message ? error.message : 'Die Aktion ist ohne lesbare Rückmeldung fehlgeschlagen.',
          )
      publish(next)
    }
  }

  function cancel(targetId: string) {
    publish(cancelConfirmation(lifecycleRef.current, targetId))
  }

  function recover(targetId: string) {
    publish(dismissFeedback(lifecycleRef.current, targetId))
  }

  function RoleBadge({ role }: { role: Role | null }) {
    if (!role) {
      return (
        <Badge variant="outline" data-role-truth="unknown">
          {roleLabel(null)}
        </Badge>
      )
    }
    const emphasis: Partial<Record<Role, string>> = {
      owner: 'border-primary text-primary',
      admin: 'border-primary/70 text-primary',
      operator: 'border-citrus-600 text-citrus-700',
      moderator: 'border-citrus-500/70 text-citrus-700',
    }
    return (
      <Badge variant="outline" data-role-truth="known" className={emphasis[role]}>
        {roleLabel(role)}
      </Badge>
    )
  }

  function StatusBadge({ status }: { status: AccountStatus | null }) {
    if (!status) {
      return (
        <Badge variant="outline" data-status-truth="unknown">
          {statusLabel(null)}
        </Badge>
      )
    }
    if (status === 'active') return <Badge data-status-truth="known">{statusLabel(status)}</Badge>
    const emphasis: Record<Exclude<AccountStatus, 'active'>, string> = {
      banned: 'border-destructive text-destructive',
      pending: 'border-citrus-600 text-citrus-700',
      disabled: 'border-border text-muted-foreground',
    }
    return (
      <Badge variant="outline" data-status-truth="known" className={emphasis[status]}>
        {statusLabel(status)}
      </Badge>
    )
  }

  function Feedback({ item }: { item: TargetOperation }) {
    const recoverable = item.phase === 'fulfilled' || item.phase === 'confirmed' || item.phase === 'rejected' || item.phase === 'ambiguous'
    return (
      <div
        className="user-mutation-feedback"
        data-mutation-phase={item.phase}
        data-mutation-subject={item.subject.userId}
        data-mutation-reason={item.ambiguousReason ?? 'none'}
      >
        <p>{outcomeCopy(item)}</p>
        {recoverable ? (
          <div className="user-mutation-feedback__actions">
            <button type="button" className="user-mutation-confirmation__button" data-mutation-recover="true" onClick={() => recover(item.subject.userId)}>
              {RECOVER_LABEL}
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  const pageLabel = read
    ? view
      ? directoryPageLabel({ page, count: directoryCount, view })
      : `Seite ${page}`
    : `Seite ${page} / ${maxPage}`
  const countLabel =
    read?.kind === 'ready'
      ? directoryCountLabel(directoryCount, filtered)
      : read
        ? null
        : `${total} ${q ? 'Treffer' : 'Nutzer'}`
  const ceiling = read?.kind === 'ready' && directoryCount !== null ? directoryCeilingCopy(directoryCount) : null
  const bodyCopy =
    view?.kind === 'empty-directory'
      ? 'Keine Konten vorhanden.'
      : view?.kind === 'no-match'
        ? 'Keine Treffer für diese Suche oder Filter.'
        : view?.kind === 'out-of-range'
          ? directoryPageLabel({ page, count: directoryCount, view })
          : null
  const statusCopy = [
    checking ? DIRECTORY_CHECKING : null,
    lease?.phase === 'released' ? DIRECTORY_CHECK_UNCONFIRMED : null,
    showPrevious ? DIRECTORY_PREVIOUS : null,
    read?.kind === 'ready' && !showPrevious && !checking ? DIRECTORY_CURRENT : null,
    read?.kind === 'invalid' ? DIRECTORY_ADDRESS_UNREADABLE : null,
    read?.kind === 'invalid' ? directoryInvalidReason(read.reason) : null,
  ]
    .filter(Boolean)
    .join(' ')

  const roleOptions: { value: string; label: string }[] = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))
  if (rawRole && !isRole(rawRole)) roleOptions.push({ value: rawRole, label: rawRole })
  const statusOptions: { value: string; label: string }[] = ACCOUNT_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }))
  if (rawStatus && !ACCOUNT_STATUSES.includes(rawStatus as AccountStatus)) {
    statusOptions.push({ value: rawStatus, label: rawStatus })
  }

  return (
    <div
      data-users-directory-root="true"
      tabIndex={-1}
      data-operation-phase={operation?.phase ?? 'none'}
      data-lease-phase={lease?.phase ?? 'none'}
      className="min-w-0 rounded-2xl border bg-card"
    >
      <style>{USER_MUTATION_CONFIRMATION_CSS}</style>
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-3 border-b p-4">
        <Input
          containerClassName="w-full sm:w-80 [&>div:last-child]:hidden"
          aria-label="Nutzer nach Name oder E-Mail suchen"
          placeholder="Name oder E-Mail suchen…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
        {read ? (
          <>
            <select
              aria-label="Rolle"
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
              value={roleOptions.some((option) => option.value === rawRole) ? rawRole : ''}
              onChange={(event) =>
                commitFilters({ role: event.target.value === '' ? null : event.target.value })
              }
            >
              <option value="">Alle Rollen</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Status"
              className="h-10 max-w-full rounded-md border border-input bg-background px-3 text-sm"
              value={statusOptions.some((option) => option.value === rawStatus) ? rawStatus : ''}
              onChange={(event) =>
                commitFilters({ status: event.target.value === '' ? null : event.target.value })
              }
            >
              <option value="">Alle Status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" size="sm" className="max-w-full whitespace-normal" onClick={clearFilters}>
              Filter löschen
            </Button>
          </>
        ) : null}
        {countLabel ? (
          <span data-users-directory-count="true" className="text-sm text-muted-foreground">
            {countLabel}
          </span>
        ) : null}
        <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2">
          {showFirstLast ? (
            <Button type="button" variant="outline" size="sm" className="max-w-full whitespace-normal" disabled={page <= 1} onClick={() => goto(1)}>
              Erste Seite
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={previousPage === null}
            onClick={() => previousPage !== null && goto(previousPage)}
            aria-label="Vorherige Seite"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span
            data-users-directory-page="true"
            className="max-w-full text-xs text-muted-foreground tabular-nums"
          >
            {pageLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={nextPage === null}
            onClick={() => nextPage !== null && goto(nextPage)}
            aria-label="Nächste Seite"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {showFirstLast && reachableLast !== null ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="max-w-full whitespace-normal"
              disabled={page >= reachableLast}
              onClick={() => goto(reachableLast)}
            >
              Letzte erreichbare Seite
            </Button>
          ) : null}
        </div>
      </div>

      {read ? (
        <div
          id="users-directory-status"
          data-users-directory-status="true"
          data-read-attempt={read.readAttempt}
          role="status"
          className="px-4 pt-4 text-sm text-muted-foreground"
        >
          {statusCopy}
          {ceiling ? <p className="mt-1">{ceiling}</p> : null}
        </div>
      ) : null}

      {read?.kind === 'invalid' ? (
        <div className="p-4">
          <Link href={read.recoveryHref} className="text-sm underline">
            Gültige Adresse öffnen
          </Link>
        </div>
      ) : null}

      {read?.kind === 'error' ? (
        <div className="p-4">
          <Fehlerflaeche fehler={read.fehler} onWiederholen={retry} laeuft={checking} />
        </div>
      ) : null}

      {detachedOperations(lifecycle, visibleIds).map((item) => (
        <div key={item.id} className="min-w-0 px-4" data-mutation-detached="true">
          <p className="text-sm text-muted-foreground">{DETACHED_PREFIX}</p>
          <Feedback item={item} />
        </div>
      ))}

      <div className="min-w-0 max-w-full">
        <table role="table" className="block w-full min-w-0 max-w-full text-sm lg:table">
          <thead className="sr-only bg-muted/40 lg:not-sr-only lg:table-header-group">
            <tr className="text-left">
              <th scope="col" className="p-4">Konto</th>
              <th scope="col" className="p-4">Rolle & Status</th>
              <th scope="col" className="p-4">Erstellt</th>
              <th scope="col" className="p-4">Letzte Aktivität</th>
              <th scope="col" className="p-4 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody role="rowgroup" className="block lg:table-row-group">
            {showRows &&
              users.map((u, index) => {
                const block = mutationBlockReason({
                  userId: u.user_id,
                  role: u.role,
                  status: u.status,
                  actorId,
                  actorRole,
                })
                const item = lifecycle.byTarget[u.user_id]
                const owned = Boolean(item)
                const shownHold =
                  item?.phase === 'confirming'
                    ? liveHold(item, {
                        rows: users.map(truthOf),
                        actorId,
                        actorRole,
                        assignable,
                        readAttempt: read?.readAttempt ?? null,
                      })
                    : null
                const rowKey = isDispatchableUserId(u.user_id) ? u.user_id : `undispatchable-${index}`
                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      role="row"
                      data-user-row={u.user_id || 'empty'}
                      aria-busy={item?.phase === 'pending' ? true : undefined}
                      className="relative grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 border-t p-4 first:border-t-0 lg:table-row lg:grid-cols-none lg:p-0"
                    >
                      <td role="cell" className="col-span-2 min-w-0 pr-12 lg:w-[32%] lg:p-4">
                        <p className="break-words font-medium">{u.display_name || 'Ohne Namen'}</p>
                        <p className="mt-1 break-all text-xs text-muted-foreground">
                          {u.email ? (
                            <Link href={`mailto:${u.email}`} className="hover:underline">
                              {u.email}
                            </Link>
                          ) : (
                            'Keine E-Mail hinterlegt'
                          )}
                        </p>
                      </td>
                      <td role="cell" className="col-span-2 lg:p-4">
                        <div className="flex flex-wrap gap-2">
                          <RoleBadge role={u.role} />
                          <StatusBadge status={u.status} />
                        </div>
                      </td>
                      <td role="cell" className="min-w-0 break-words text-xs text-muted-foreground lg:p-4">
                        <span className="mb-1 block lg:hidden">Erstellt</span>
                        {formatUsersDirectoryTimestamp(u.created_at)}
                      </td>
                      <td role="cell" className="min-w-0 break-words text-xs text-muted-foreground lg:p-4">
                        <span className="mb-1 block lg:hidden">Letzte Aktivität</span>
                        {formatUsersDirectoryTimestamp(u.last_seen_at)}
                      </td>
                      <td role="cell" className="absolute right-2 top-2 lg:static lg:p-4">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                data-mutation-trigger={u.user_id}
                                variant="ghost"
                                size="icon"
                                aria-label={`Aktionen für ${u.display_name || u.email || 'Konto'}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-60 max-w-[calc(100vw-2rem)]"
                              onCloseAutoFocus={(event) => {
                                if (lifecycleRef.current.byTarget[u.user_id]?.phase === 'confirming') {
                                  event.preventDefault()
                                }
                              }}
                            >
                              {block ? (
                                <div className="px-2 py-2 text-xs text-muted-foreground">{blockCopy(block)}</div>
                              ) : u.role && u.status ? (
                                <>
                                  {assignable
                                    .filter((role) => role !== u.role)
                                    .map((role) => (
                                      <DropdownMenuItem
                                        key={role}
                                        disabled={owned}
                                        onSelect={() => begin(u, { kind: 'role', nextRole: role })}
                                      >
                                        <Shield className="mr-2 h-4 w-4" /> Rolle: {ROLE_LABELS[role]}
                                      </DropdownMenuItem>
                                    ))}

                                  <div className="my-1 h-px bg-border" />

                                  <DropdownMenuItem
                                    disabled={owned}
                                    onSelect={() => begin(u, { kind: 'status', nextStatus: banToggleTarget(u.status as AccountStatus) })}
                                  >
                                    {u.status === 'banned' ? 'Entsperren' : 'Sperren'}
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                    {item?.phase === 'confirming' ? (
                      <tr role="row" className="block min-w-0 lg:table-row">
                        <td role="cell" className="block min-w-0 p-4 lg:table-cell" colSpan={5}>
                          <UserMutationConfirmation
                            subject={item.subject}
                            intent={item.intent}
                            hold={shownHold}
                            onConfirm={() => void commit(u.user_id)}
                            onCancel={() => cancel(u.user_id)}
                            triggerId={u.user_id}
                          />
                        </td>
                      </tr>
                    ) : null}
                    {item && item.phase !== 'confirming' ? (
                      <tr role="row" className="block min-w-0 lg:table-row">
                        <td role="cell" className="block min-w-0 p-4 lg:table-cell" colSpan={5}>
                          <Feedback item={item} />
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                )
              })}
            {showRows && users.length === 0 && (
              <tr role="row" className="block lg:table-row">
                <td role="cell" className="block p-6 text-center text-muted-foreground lg:table-cell" colSpan={5}>
                  {read ? (bodyCopy ?? 'Anzahl nicht verfügbar') : 'Keine Nutzer gefunden.'}
                </td>
              </tr>
            )}
            {read && !showRows && bodyCopy ? (
              <tr role="row" className="block lg:table-row">
                <td role="cell" className="block p-6 text-center text-muted-foreground lg:table-cell" colSpan={5}>
                  {bodyCopy}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
