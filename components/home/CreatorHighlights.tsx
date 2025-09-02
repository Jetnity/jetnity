// components/home/CreatorHighlights.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

type CreatorItem = {
  name: string;
  username: string;
  bio?: string | null;
  image?: string | null;
  blurDataURL?: string | null;
};

type Props = {
  title?: string;
  subtitle?: string;
  creators?: CreatorItem[];
  className?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

const DEFAULT_CREATORS: CreatorItem[] = [
  { name: 'Lina Travelista', username: 'lina-travelista', bio: 'Hidden Gems in Südostasien', image: '/images/creators/lina.jpg' },
  { name: 'Urban Nomad', username: 'urban-nomad', bio: 'Städtereisen & Architektur', image: '/images/creators/urban.jpg' },
  { name: 'Wilderness Max', username: 'wilderness-max', bio: 'Abenteuer weltweit', image: '/images/creators/max.jpg' },
];

export default function CreatorHighlights({
  title = '🔥 Creator-Highlights',
  subtitle = 'Top Reiseinhalte von echten Profis',
  creators = DEFAULT_CREATORS,
  className,
  ctaHref = '/creator',
  ctaLabel = 'Alle Creator',
}: Props) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const updateEdgeState = React.useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= 2);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 2);
  }, []);

  const scrollByAmount = React.useCallback((dir: -1 | 1) => {
    const el = wrapRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.8) * dir;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  const onWheel = React.useCallback((e: React.WheelEvent) => {
    const el = wrapRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) {
      el.scrollLeft += e.deltaY;
    }
  }, []);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    updateEdgeState();
    const onScroll = () => updateEdgeState();
    const ro = new ResizeObserver(updateEdgeState);
    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [updateEdgeState]);

  return (
    <section className={cn('w-full py-10 px-4 md:px-8', className)}>
      <div className="mx-auto max-w-screen-xl">
        {/* Header-Zeile: SectionHeader + CTA rechts
            (kein rightSlot-Prop mehr → kein TS-Fehler) */}
        <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
          <SectionHeader title={title} subtitle={subtitle} />
          <Link
            href={ctaHref}
            prefetch={false}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40"
          >
            {ctaLabel} <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative">
          {/* Pfeile */}
          <button
            type="button"
            aria-label="Nach links scrollen"
            onClick={() => scrollByAmount(-1)}
            disabled={atStart}
            className={cn(
              'supports-blur:backdrop-blur-xl absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 shadow-e2 transition hover:scale-105',
              atStart && 'pointer-events-none opacity-40'
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Nach rechts scrollen"
            onClick={() => scrollByAmount(1)}
            disabled={atEnd}
            className={cn(
              'supports-blur:backdrop-blur-xl absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-border bg-card/90 p-2 shadow-e2 transition hover:scale-105',
              atEnd && 'pointer-events-none opacity-40'
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Scroller */}
          <div
            ref={wrapRef}
            role="list"
            aria-label="Creator Highlights"
            onWheel={onWheel}
            className={cn(
              'mask-edges no-scrollbar relative z-10 flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 pt-1'
            )}
          >
            {creators.map((c, i) => (
              <Link
                role="listitem"
                href={`/creator/${c.username}`}
                key={c.username}
                prefetch={false}
                aria-label={`Öffne Profil von ${c.name}`}
                className={cn(
                  'group relative flex w-[220px] shrink-0 snap-start flex-col rounded-2xl border border-border bg-card p-4 shadow-e1 transition hover:-translate-y-0.5 hover:shadow-e3'
                )}
              >
                <div className="relative mb-3 aspect-[16/11] w-full overflow-hidden rounded-xl bg-muted">
                  {c.image ? (
                    <Image
                      src={c.image}
                      alt={c.name}
                      fill
                      sizes="220px"
                      placeholder={c.blurDataURL ? 'blur' : 'empty'}
                      blurDataURL={c.blurDataURL ?? undefined}
                      priority={i < 2}
                      className="object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                      Kein Bild
                    </div>
                  )}
                </div>

                <h3 className="line-clamp-1 text-base font-semibold tracking-tight">{c.name}</h3>
                {c.bio ? (
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{c.bio}</p>
                ) : (
                  <p className="mt-0.5 text-sm text-muted-foreground">Reise-Creator</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
