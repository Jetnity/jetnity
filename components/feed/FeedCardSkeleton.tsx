// components/feed/FeedCardSkeleton.tsx
'use client'

export default function FeedCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-e1 overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/5" />
        <div className="h-3 bg-muted rounded w-4/5" />
      </div>
    </div>
  )
}
