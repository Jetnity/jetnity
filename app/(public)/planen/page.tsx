import type { Metadata } from 'next'

import TripPlanner from '@/components/trips/TripPlanner'

export const metadata: Metadata = {
  title: 'Reise planen',
  description: 'Erstelle deinen privaten Reiseentwurf mit Jetnity.',
}

type PlanPageProps = {
  searchParams?: {
    idee?: string | string[]
    ziel?: string | string[]
  }
}

export default function PlanPage({ searchParams }: PlanPageProps) {
  const idea = Array.isArray(searchParams?.idee) ? searchParams?.idee[0] : searchParams?.idee
  const destination = Array.isArray(searchParams?.ziel) ? searchParams?.ziel[0] : searchParams?.ziel

  return (
    <main className="min-h-screen bg-surface-75 px-4 py-10 sm:px-6 sm:py-14">
      <TripPlanner
        initialDestination={destination?.slice(0, 120) ?? ''}
        initialIdea={idea?.slice(0, 1000) ?? ''}
      />
    </main>
  )
}
