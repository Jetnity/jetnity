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
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Shield,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { setUserRole, setUserStatus } from '@/app/(admin)/admin/users/actions'

export type UserRow = {
  user_id: string
  email: string | null
  display_name: string | null
  role: 'user' | 'creator' | 'admin' | 'owner' | 'operator' | 'moderator'
  status: 'active' | 'banned' | 'pending' | 'disabled'
  created_at: string
  last_seen_at: string | null
}

export default function UsersTable({
  users,
  page,
  pageSize,
  total,
  q,
}: {
  users: UserRow[]
  page: number
  pageSize: number
  total: number
  q: string
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const [search, setSearch] = React.useState(q ?? '')
  const [pendingId, setPendingId] = React.useState<string | null>(null)

  // Debounced Suche → URL (preserve other params)
  React.useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp?.toString())
      if (search.trim()) params.set('q', search.trim())
      else params.delete('q')
      params.set('page', '1')
      router.replace(`/admin/users?${params.toString()}`)
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const maxPage = Math.max(1, Math.ceil(total / pageSize))

  function goto(p: number) {
    const np = Math.min(Math.max(1, p), maxPage)
    const params = new URLSearchParams(sp?.toString())
    if (search.trim()) params.set('q', search.trim())
    else params.delete('q')
    params.set('page', String(np))
    router.replace(`/admin/users?${params.toString()}`)
  }

  async function changeRole(u: UserRow, role: UserRow['role']) {
    try {
      setPendingId(u.user_id)
      await setUserRole(u.user_id, role)
      toast.success(`Rolle geändert: ${u.email ?? u.user_id} → ${role}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Fehler beim Ändern der Rolle')
    } finally {
      setPendingId(null)
    }
  }

  async function toggleBan(u: UserRow) {
    const target: UserRow['status'] = u.status === 'banned' ? 'active' : 'banned'
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

  // Badges (neutral/outline – kompatibel zu shadcn)
  function RoleBadge({ role }: { role: UserRow['role'] }) {
    const map: Record<UserRow['role'], { cls: string }> = {
      owner: { cls: 'border-purple-500 text-purple-600' },
      admin: { cls: 'border-amber-500 text-amber-600' },
      operator: { cls: 'border-blue-500 text-blue-600' },
      moderator: { cls: 'border-cyan-500 text-cyan-600' },
      creator: { cls: '' },
      user: { cls: '' },
    }
    const m = map[role] ?? { cls: '' }
    return (
      <Badge variant="outline" className={m.cls ? `${m.cls}` : undefined}>
        {role}
      </Badge>
    )
  }

  function StatusBadge({ status }: { status: UserRow['status'] }) {
    if (status === 'banned') {
      return <Badge variant="outline" className="border-red-500 text-red-600">banned</Badge>
    }
    if (status === 'pending') {
      return <Badge variant="outline" className="border-amber-500 text-amber-600">pending</Badge>
    }
    if (status === 'disabled') {
      return <Badge variant="outline" className="border-slate-500 text-slate-600">disabled</Badge>
    }
    return <Badge>active</Badge>
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
          <span className="text-sm tabular-nums">{page} / {maxPage}</span>
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
                      <DropdownMenuContent align="end" className="w-56">
                        {/* Rollenwechsel */}
                        <DropdownMenuItem onClick={() => changeRole(u, 'user')}>
                          <UserMinus className="mr-2 h-4 w-4" /> Rolle: user
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeRole(u, 'creator')}>
                          <UserPlus className="mr-2 h-4 w-4" /> Rolle: creator
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeRole(u, 'moderator')}>
                          <Shield className="mr-2 h-4 w-4" /> Rolle: moderator
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeRole(u, 'operator')}>
                          <Shield className="mr-2 h-4 w-4" /> Rolle: operator
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeRole(u, 'admin')}>
                          <Shield className="mr-2 h-4 w-4" /> Rolle: admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeRole(u, 'owner')}>
                          <Shield className="mr-2 h-4 w-4" /> Rolle: owner
                        </DropdownMenuItem>

                        <div className="my-1 h-px bg-border" />

                        {/* Sperren/Entsperren */}
                        <DropdownMenuItem onClick={() => toggleBan(u)}>
                          {u.status === 'banned' ? 'Entsperren' : 'Sperren'}
                        </DropdownMenuItem>

                        <div className="my-1 h-px bg-border" />

                        {/* Detail öffnen */}
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${u.user_id}`}>Details öffnen</Link>
                        </DropdownMenuItem>
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
