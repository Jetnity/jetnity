// components/admin/AdminReviewTable.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, CheckCircle2, XCircle, Clock, Filter } from 'lucide-react';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

type Session = {
  id: string;
  title: string | null;
  user_id: string;
  review_status: ReviewStatus;
  created_at: string;
};

type Props = {
  sessions: Session[];
  onUpdate: (formData: FormData) => Promise<void>; // Server Action
};

const statusConfig: Record<ReviewStatus, { label: string; variant: 'outline' | 'default' | 'destructive' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

function fmt(dateISO: string) {
  try {
    return new Intl.DateTimeFormat('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateISO));
  } catch {
    return dateISO;
  }
}

export default function AdminReviewTable({ sessions, onUpdate }: Props) {
  const [optimistic, setOptimistic] = React.useState(() => new Map<string, ReviewStatus>());
  const currentStatus = (id: string, initial: ReviewStatus) => optimistic.get(id) ?? initial;

  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState<ReviewStatus | 'all'>('all');

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    return sessions.filter((s) => {
      const statusOk = filter === 'all' ? true : s.review_status === filter;
      const text = `${s.title ?? ''} ${s.user_id}`.toLowerCase();
      const searchOk = term ? text.includes(term) : true;
      return statusOk && searchOk;
    });
  }, [q, filter, sessions]);

  const submit = async (id: string, review_status: ReviewStatus) => {
    const fd = new FormData();
    fd.set('id', id);
    fd.set('review_status', review_status);
    setOptimistic((prev) => new Map(prev).set(id, review_status));
    try {
      await onUpdate(fd);
    } catch (e) {
      // rollback
      setOptimistic((prev) => {
        const clone = new Map(prev);
        clone.delete(id);
        return clone;
      });
      alert((e as Error).message || 'Update fehlgeschlagen');
    }
  };

  return (
    <section className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k as any)}
                className={`text-sm px-3 py-1.5 rounded-full border ${
                  filter === k ? 'bg-accent' : 'bg-background'
                }`}
              >
                {k === 'all' ? 'Alle' : (k as string).replace(/^\w/, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full sm:w-80">
          <Input
            placeholder="Suche nach Titel oder User-ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 w-[44%]">Titel</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Review-Status</th>
              <th className="px-4 py-3">Erstellt</th>
              <th className="px-4 py-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const st = currentStatus(s.id, s.review_status);
              const cfg = statusConfig[st];
              return (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="line-clamp-2 font-medium">{s.title || 'Untitled'}</div>
                    <div className="text-xs text-muted-foreground">ID: {s.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs">{s.user_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant as any} className="capitalize">
                      {cfg.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{fmt(s.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => submit(s.id, 'pending')} title="Auf Pending setzen">
                        <Clock className="h-4 w-4 mr-1" />
                        Pending
                      </Button>
                      <Button size="sm" variant="success" onClick={() => submit(s.id, 'approved')} title="Freigeben">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => submit(s.id, 'rejected')} title="Ablehnen">
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm" variant="ghost" asChild title="In neuer Seite öffnen">
                        <a href={`/creator/media-studio/session/${s.id}`} target="_blank" rel="noopener noreferrer">
                          Öffnen <ArrowUpRight className="h-4 w-4 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Keine Einträge gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
