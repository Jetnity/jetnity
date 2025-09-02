// components/admin/UsersTable.tsx
'use client'

import * as React from 'react'
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
import { setUserRole, setUserStatus } from '@/app/(admin)/users/actions'

export type UserRow = {
  user_id: string
  email: string | null
  display_name: string | null
  role: 'user' | 'creator' | 'admin'
  status: 'active' | 'banned'
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
  const [search, setSearch] = React.useState(q)
  const [pendingId, setPendingId] = React.useState<string | null>(null)

  // Debounced Suche in URL schreiben
  React.useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString())
      if (search) params.set('q', search)
      else params.delete('q')
      params.set('page', '1')
      router.replace(`/admin/users?${params.toString()}`)
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const maxPage = Math.max(1, Math.ceil(total / pageSize))

  function goto(p: number) {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    params.set('page', String(p))
    router.replace(`/admin/users?${params.toString()}`)
  }

  async function changeRole(u: UserRow, role: UserRow['role']) {
    try {
      setPendingId(u.user_id)
      await setUserRole(u.user_id, role)
      toast.success(`Rolle geändert: ${u.email ?? u.user_id} → ${role}`)
      // kein reload nötig – Server Action revalidiert
    } catch (e: any) {
      toast.error(e?.message ?? 'Fehler beim Ändern der Rolle')
    } finally {
      setPendingId(null)
    }
  }

  async function toggleBan(u: UserRow) {
    const target = u.status === 'banned' ? 'active' : 'banned'
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

  // Badges ohne "destructive"-Variante (kompatibel zu deiner shadcn-Version)
  function RoleBadge({ role }: { role: UserRow['role'] }) {
    if (role === 'admin') {
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-600">
          admin
        </Badge>
      )
    }
    if (role === 'creator') {
      return <Badge variant="secondary">creator</Badge>
    }
    return <Badge variant="default">user</Badge>
  }

  function StatusBadge({ status }: { status: UserRow['status'] }) {
    if (status === 'banned') {
      return (
        <Badge variant="outline" className="border-red-500 text-red-600">
          banned
        </Badge>
      )
    }
    return <Badge variant="default">active</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Suche nach Name oder E-Mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => goto(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm tabular-nums">
            {page} / {maxPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= maxPage}
            onClick={() => goto(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
                <td className="p-3">{u.email ?? '—'}</td>
                <td className="p-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="p-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="p-3">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {u.last_seen_at
                    ? new Date(u.last_seen_at).toLocaleString()
                    : '—'}
                </td>
                <td className="p-3">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => changeRole(u, 'user')}>
                          <UserMinus className="mr-2 h-4 w-4" /> Rolle: user
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => changeRole(u, 'creator')}
                        >
                          <UserPlus className="mr-2 h-4 w-4" /> Rolle: creator
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeRole(u, 'admin')}>
                          <Shield className="mr-2 h-4 w-4" /> Rolle: admin
                        </DropdownMenuItem>
                        <div className="my-1 h-px bg-border" />
                        <DropdownMenuItem onClick={() => toggleBan(u)}>
                          {u.status === 'banned' ? 'Entsperren' : 'Sperren'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {pendingId === u.user_id && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        speichere…
                      </span>
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
