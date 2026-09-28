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
  USERS_SEARCH_DEBOUNCE_MS,
  usersListHrefFromParams,
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
  created_at: string
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
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const epoch = React.useRef(0)
  const spRef = React.useRef(sp)
  const routerRef = React.useRef(router)

  React.useEffect(() => {
    spRef.current = sp
    routerRef.current = router
  }, [sp, router])

  if (trackedUrl !== urlQuery) {
    setTrackedUrl(urlQuery)
    if (search !== urlQ) setSearch(urlQ)
  }

  // Nur ein normalisiert anderer Entwurf bestätigt nach 400 ms und setzt dann
  // auf Seite 1. Öffnen, Neuladen und dieselbe Suche schreiben die URL nicht um.
  React.useEffect(() => {
    const draft = normalizeUserSearch(search)
    if (draft === urlQ) return
    const ticket = ++epoch.current
    const handle = window.setTimeout(() => {
      if (ticket !== epoch.current) return
      const aktuell = spRef.current
      const href = buildUsersListHref(aktuell, { q: draft, page: 1 })
      if (href === usersListHrefFromParams(aktuell)) return
      routerRef.current.replace(href)
    }, USERS_SEARCH_DEBOUNCE_MS)
    return () => {
      window.clearTimeout(handle)
      if (epoch.current === ticket) epoch.current += 1
    }
  }, [search, urlQ, urlQuery])

  const maxPage = Math.max(1, Math.ceil(total / pageSize))

  function goto(p: number) {
    const np = Math.min(Math.max(1, p), maxPage)
    // Seitenwechsel behält den bestätigten Filter. Ein noch nicht bestätigter
    // Entwurf wird verworfen, damit Feld und Ergebnisliste übereinstimmen,
    // und der laufende Timer kann die neue Seite nicht zurücksetzen.
    epoch.current += 1
    if (search !== urlQ) setSearch(urlQ)
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
    active: 'aktiv',
    pending: 'ausstehend',
    disabled: 'deaktiviert',
    banned: 'gesperrt',
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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Suche nach Name oder E-Mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goto(page - 1)} aria-label="Vorherige Seite">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="shrink-0 whitespace-nowrap text-sm tabular-nums">{page} / {maxPage}</span>
          <Button variant="outline" size="sm" disabled={page >= maxPage} onClick={() => goto(page + 1)} aria-label="Nächste Seite">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabelle */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left">
              <th className="p-3">Name</th>
              <th className="p-3">E-Mail</th>
              <th className="p-3">Rolle</th>
              <th className="p-3">Status</th>
              <th className="p-3">Erstellt</th>
              <th className="p-3">Letzte Aktivität</th>
              <th className="p-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-t">
                <td className="p-3">{u.display_name ?? '—'}</td>
                <td className="p-3">{u.email ? <Link href={`mailto:${u.email}`} className="hover:underline">{u.email}</Link> : '—'}</td>
                <td className="p-3"><RoleBadge role={u.role} /></td>
                <td className="p-3"><StatusBadge status={u.status} /></td>
                <td className="p-3">{dtf.format(new Date(u.created_at))}</td>
                <td className="p-3">{u.last_seen_at ? dtf.format(new Date(u.last_seen_at)) : '—'}</td>
                <td className="p-3">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Aktionen">
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
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={7}>
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
