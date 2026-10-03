// components/admin/UsersTable.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronLeft, ChevronRight, MoreHorizontal, Shield } from 'lucide-react'
import { setUserRole, setUserStatus } from '@/app/(admin)/admin/users/actions'
import {
  buildUsersListHref,
  normalizeUserSearch,
  userSearchHrefCarriesDraft,
  USERS_SEARCH_DEBOUNCE_MS,
  usersListHrefFromParams,
  usersListHrefMatches,
} from '@/lib/admin/users-search-navigation'
import {
  rankOf,
  ROLE_LABELS,
  type AccountStatus,
  type Role,
} from '@/lib/auth/roles'

export type UserRow = {
  user_id: string
  email: string | null
  display_name: string | null
  role: Role
  status: AccountStatus
  created_at: string | null
  last_seen_at: string | null
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
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const urlQuery = sp?.toString() ?? ''
  // Die Adresse ist die bestätigte Suche. `q` initialisiert nur und darf einen
  // inzwischen geänderten URL-Stand nicht wiederherstellen.
  const urlQ = sp?.has('q') ? normalizeUserSearch(sp.get('q') ?? '') : ''
  const [search, setSearch] = React.useState(() => normalizeUserSearch(q ?? ''))
  const [trackedUrl, setTrackedUrl] = React.useState(urlQuery)
  const [ownSearchAcks, setOwnSearchAcks] = React.useState<string[]>([])
  const [historyTraversal, setHistoryTraversal] = React.useState(0)
  const [seenTraversal, setSeenTraversal] = React.useState(0)
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const epoch = React.useRef(0)
  const spRef = React.useRef(sp)
  const routerRef = React.useRef(router)

  React.useEffect(() => {
    spRef.current = sp
    routerRef.current = router
  }, [sp, router])

  // pushState/replaceState feuern kein popstate. Natives Zurück/Vor schon.
  // Eine Adressgleichheit allein darf das nicht als eigene Suchbestätigung lesen.
  React.useEffect(() => {
    const onPopState = () => {
      epoch.current += 1
      setOwnSearchAcks([])
      setHistoryTraversal((value) => value + 1)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const nativeTraversal = historyTraversal !== seenTraversal
  if (trackedUrl !== urlQuery || nativeTraversal) {
    const hrefNow = usersListHrefFromParams(sp)
    const ackIndex = ownSearchAcks.findIndex((href) => usersListHrefMatches(href, hrefNow))
    const ownAck = !nativeTraversal && ackIndex >= 0
    if (trackedUrl !== urlQuery) setTrackedUrl(urlQuery)
    if (nativeTraversal) setSeenTraversal(historyTraversal)
    if (ownAck) setOwnSearchAcks(ownSearchAcks.slice(ackIndex + 1))
    else if (ownSearchAcks.length > 0) setOwnSearchAcks([])
    // Nur fremde Navigation, natives Zurück/Vor und Seitenwechsel übernehmen
    // die URL ins Feld. Die verspätete Bestätigung der eigenen Suche lässt
    // einen inzwischen neueren Entwurf stehen.
    if (!ownAck && search !== urlQ) setSearch(urlQ)
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
      setOwnSearchAcks((current) =>
        current.some((item) => usersListHrefMatches(item, href)) ? current : [...current, href],
      )
      routerRef.current.replace(href)
    }, USERS_SEARCH_DEBOUNCE_MS)
    return () => {
      window.clearTimeout(handle)
      if (epoch.current === ticket) epoch.current += 1
    }
  }, [search, urlQ, urlQuery, ownSearchAcks])

  const maxPage = Math.max(1, Math.ceil(total / pageSize))

  function goto(p: number) {
    const np = Math.min(Math.max(1, p), maxPage)
    // Seitenwechsel behält den bestätigten Filter. Ein noch nicht bestätigter
    // Entwurf wird verworfen, damit Feld und Ergebnisliste übereinstimmen,
    // und der laufende Timer kann die neue Seite nicht zurücksetzen.
    epoch.current += 1
    if (search !== urlQ) setSearch(urlQ)
    if (ownSearchAcks.length > 0) setOwnSearchAcks([])
    const href = buildUsersListHref(sp, { q: urlQ, page: np })
    if (href === usersListHrefFromParams(sp)) return
    router.replace(href)
  }

  /**
   * Was die Tabelle anbietet, spiegelt nur die serverseitige Regel – die
   * Entscheidung fällt in der Server-Action. Ein eigener Rang lässt sich nicht
   * ändern, und fremde Konten nur unterhalb des eigenen Rangs.
   */
  function editable(u: UserRow) {
    if (u.user_id === actorId) return false
    if (actorRole === 'owner') return true
    return rankOf(actorRole) > rankOf(u.role)
  }

  async function changeRole(u: UserRow, role: Role) {
    try {
      setPendingId(u.user_id)
      await setUserRole(u.user_id, role)
      toast.success(`Rolle geändert: ${u.email ?? u.user_id} → ${ROLE_LABELS[role]}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Fehler beim Ändern der Rolle')
    } finally {
      setPendingId(null)
    }
  }

  async function toggleBan(u: UserRow) {
    const target: AccountStatus = u.status === 'banned' ? 'active' : 'banned'
    try {
      setPendingId(u.user_id)
      await setUserStatus(u.user_id, target)
      toast.success(`${u.email ?? u.user_id} ist jetzt ${target}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Fehler beim Aktualisieren')
    } finally {
      setPendingId(null)
    }
  }

  // Badges (outline – Farben aus der V2-Palette, nicht aus Roh-Tailwind)
  function RoleBadge({ role }: { role: Role }) {
    const emphasis: Partial<Record<Role, string>> = {
      owner: 'border-primary text-primary',
      admin: 'border-primary/70 text-primary',
      operator: 'border-citrus-600 text-citrus-700',
      moderator: 'border-citrus-500/70 text-citrus-700',
    }
    return (
      <Badge variant="outline" className={emphasis[role]}>
        {ROLE_LABELS[role]}
      </Badge>
    )
  }

  const STATUS_LABELS: Record<AccountStatus, string> = {
    active: 'Aktiv',
    pending: 'Ausstehend',
    disabled: 'Deaktiviert',
    banned: 'Gesperrt',
  }

  function StatusBadge({ status }: { status: AccountStatus }) {
    if (status === 'active') return <Badge>{STATUS_LABELS.active}</Badge>
    const emphasis: Record<Exclude<AccountStatus, 'active'>, string> = {
      banned: 'border-destructive text-destructive',
      pending: 'border-citrus-600 text-citrus-700',
      disabled: 'border-border text-muted-foreground',
    }
    return (
      <Badge variant="outline" className={emphasis[status]}>
        {STATUS_LABELS[status]}
      </Badge>
    )
  }

  const dtf = React.useMemo(
    () =>
      new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' }),
    []
  )

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <Input
          containerClassName="w-full sm:w-80 [&>div:last-child]:hidden"
          aria-label="Nutzer nach Name oder E-Mail suchen"
          placeholder="Name oder E-Mail suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
        <span className="text-sm text-muted-foreground">{total} {q ? 'Treffer' : 'Nutzer'}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goto(page - 1)} aria-label="Vorherige Seite">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums">Seite {page} / {maxPage}</span>
          <Button variant="outline" size="sm" disabled={page >= maxPage} onClick={() => goto(page + 1)} aria-label="Nächste Seite">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabelle */}
      <div>
        <table role="table" className="block w-full text-sm lg:table">
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
            {users.map((u) => (
              <tr role="row" key={u.user_id} className="relative grid grid-cols-2 gap-3 border-t p-4 first:border-t-0 lg:table-row lg:p-0">
                <td role="cell" className="col-span-2 min-w-0 pr-12 lg:w-[32%] lg:p-4">
                  <p className="font-medium">{u.display_name || 'Ohne Namen'}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{u.email ? <Link href={`mailto:${u.email}`} className="hover:underline">{u.email}</Link> : 'Keine E-Mail hinterlegt'}</p>
                </td>
                <td role="cell" className="col-span-2 lg:p-4"><div className="flex flex-wrap gap-2"><RoleBadge role={u.role} /><StatusBadge status={u.status} /></div></td>
                <td role="cell" className="min-w-0 text-xs text-muted-foreground lg:p-4">
                  <span className="mb-1 block lg:hidden">Erstellt</span>
                  {u.created_at ? dtf.format(new Date(u.created_at)) : 'Nicht verfügbar'}
                </td>
                <td role="cell" className="min-w-0 text-xs text-muted-foreground lg:p-4">
                  <span className="mb-1 block lg:hidden">Letzte Aktivität</span>
                  {u.last_seen_at ? dtf.format(new Date(u.last_seen_at)) : 'Nicht verfügbar'}
                </td>
                <td role="cell" className="absolute right-2 top-2 lg:static lg:p-4">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Aktionen für ${u.display_name || u.email || 'Konto'}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60">
                        {editable(u) ? (
                          <>
                            {assignable
                              .filter(role => role !== u.role)
                              .map(role => (
                                <DropdownMenuItem key={role} onClick={() => changeRole(u, role)}>
                                  <Shield className="mr-2 h-4 w-4" /> Rolle: {ROLE_LABELS[role]}
                                </DropdownMenuItem>
                              ))}

                            <div className="my-1 h-px bg-border" />

                            <DropdownMenuItem onClick={() => toggleBan(u)}>
                              {u.status === 'banned' ? 'Entsperren' : 'Sperren'}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <div className="px-2 py-2 text-xs text-muted-foreground">
                            {u.user_id === actorId
                              ? 'Das eigene Konto lässt sich hier nicht ändern.'
                              : 'Für dieses Konto fehlt die Berechtigung.'}
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {pendingId === u.user_id && (
                      <span className="ml-2 text-xs text-muted-foreground">speichere…</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr role="row" className="block lg:table-row">
                <td role="cell" className="block p-6 text-center text-muted-foreground lg:table-cell" colSpan={5}>
                  Keine Nutzer gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
