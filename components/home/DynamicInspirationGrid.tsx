// components/home/DynamicInspirationGrid.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Tables } from '@/types/supabase';

type Upload = Tables<'creator_uploads'>;

type Props = {
  pageSize?: number;
  region?: string;
  mood?: string;
  q?: string;
  sort?: 'new' | 'old' | 'title';
  className?: string;
};

const PAGE_SIZE_DEFAULT = 9;

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      {children}
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-e1 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/5" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-2/5" />
      </div>
    </div>
  );
}

export default function DynamicInspirationGrid({
  pageSize = PAGE_SIZE_DEFAULT,
  region,
  mood,
  q,
  sort = 'new',
  className,
}: Props) {
  const [items, setItems] = React.useState<Upload[]>([]);
  const [page, setPage] = React.useState(1);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadedIds = React.useRef<Set<string | number>>(new Set());
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  // Initial load / Filteränderung
  React.useEffect(() => {
    let alive = true;
    (async () => {
      setInitialLoading(true);
      setError(null);
      loadedIds.current.clear();
      const ok = await fetchPage(1, true);
      if (!alive) return;
      setHasMore(ok);
      setInitialLoading(false);
    })();
    return () => { alive = false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, region, mood, q, sort]);

  // Realtime (optional, behält deine Live-Aktualität)
  React.useEffect(() => {
    const ch = supabase
      .channel('creator_uploads_dynamic_grid_api')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creator_uploads' }, (payload) => {
        setItems((prev) => {
          let next = [...prev];
          if (payload.eventType === 'INSERT') {
            const row = payload.new as any as Upload;
            if (!loadedIds.current.has(row.id)) {
              loadedIds.current.add(row.id as any);
              next = [row, ...next];
            }
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as any as Upload;
            const idx = next.findIndex((x) => x.id === row.id);
            if (idx >= 0) next[idx] = { ...next[idx], ...row };
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as any as Upload;
            loadedIds.current.delete(row.id as any);
            next = next.filter((x) => x.id !== row.id);
          }
          return next;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch) };
  }, []);

  // IntersectionObserver → loadMore
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const [e] = entries;
        if (e.isIntersecting) void loadMore();
      },
      { rootMargin: '400px 0px 600px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [page, hasMore, loadingMore]);

  async function fetchPage(targetPage: number, replace = false) {
    try {
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('perPage', String(pageSize));
      params.set('sort', sort);
      if (region?.trim()) params.set('region', region.trim());
      if (mood?.trim()) params.set('mood', mood.trim());
      if (q?.trim()) params.set('q', q.trim());

      const res = await fetch(`/api/inspiration?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const body = (await res.json()) as {
        items: Upload[];
        nextPage: number | null;
      };

      const next = replace ? [] : items.slice();
      for (const row of body.items || []) {
        if (!loadedIds.current.has(row.id)) {
          loadedIds.current.add(row.id);
          next.push(row);
        }
      }

      setItems(next);
      setPage(targetPage);
      const more = Boolean(body.nextPage);
      setHasMore(more);
      return more;
    } catch (e: any) {
      setError(e?.message || 'Unbekannter Fehler');
      return false;
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    const more = await fetchPage(page + 1);
    setLoadingMore(false);
    setHasMore(more);
  }

  async function refresh() {
    loadedIds.current.clear();
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setInitialLoading(true);
    const ok = await fetchPage(1, true);
    setHasMore(ok);
    setInitialLoading(false);
  }

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Inspirationen</h2>
        <button
          type="button"
          onClick={refresh}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted/40"
        >
          Neu laden
        </button>
      </div>

      {initialLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: pageSize }).map((_, i) => <CardSkeleton key={`sk-${i}`} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          Noch keine Inhalte verfügbar.
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((u) => {
              const href = `/creator-dashboard?id=${encodeURIComponent(String(u.id))}`;
              const title = u.title || 'Ohne Titel';
              const hasImg = Boolean(u.image_url);

              return (
                <article
                  key={u.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-e1 transition hover:-translate-y-0.5 hover:shadow-e3"
                >
                  <Link href={href} className="absolute inset-0 z-10" aria-label={`Öffne: ${title}`}>
                    <span className="sr-only">{title}</span>
                  </Link>

                  <div className="relative aspect-[4/3] bg-muted">
                    {hasImg ? (
                      <Image
                        src={u.image_url as string}
                        alt={title}
                        fill
                        sizes="(min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw"
                        className="object-cover transition duration-700 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                        Kein Bild
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="line-clamp-2 text-base font-semibold tracking-tight">{title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {u.region && <Badge>{u.region}</Badge>}
                      {u.mood && <Badge>{u.mood}</Badge>}
                    </div>
                    <Link href={href} className="relative z-20 inline-block text-sm text-primary underline-offset-4 hover:underline">
                      Zum Inhalt →
                    </Link>
                  </div>
                </article>
              );
            })}

            {loadingMore &&
              Array.from({ length: Math.min(3, pageSize) }).map((_, i) => <CardSkeleton key={`sk-more-${i}`} />)}
          </div>

          {error && (
            <div className="text-center text-destructive">
              {error}{' '}
              <button className="underline underline-offset-2 hover:opacity-80" onClick={loadMore}>
                erneut versuchen
              </button>
            </div>
          )}

          <div ref={sentinelRef} className="h-10 w-full" />
          {!hasMore && !loadingMore && (
            <div className="text-center text-sm text-muted-foreground">Ende erreicht.</div>
          )}
        </>
      )}
    </section>
  );
}
