// components/home/TrendingUploadsSkeleton.tsx
import SectionHeader from '@/components/ui/SectionHeader'

export default function TrendingUploadsSkeleton() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <SectionHeader title="Im Trend" subtitle="Lädt gerade …" />
        <div className="h-10 w-32 rounded-xl border bg-card" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="h-60 rounded-2xl border bg-muted animate-pulse" />
        <div className="h-60 rounded-2xl border bg-muted animate-pulse" />
        <div className="h-60 rounded-2xl border bg-muted animate-pulse" />
      </div>
    </section>
  )
}
