'use client'

import CreatorProfileCard from './dashboard/CreatorProfileCard'
import CreatorMediaGrid from './dashboard/CreatorMediaGrid'
import CreatorBlogSection from './dashboard/CreatorBlogSection'
import SessionStatsPanel from './dashboard/SessionStatsPanel'

type Props = {
  sidebarOnly?: boolean
  gridOnly?: boolean
  blogOnly?: boolean
  statsOnly?: boolean
}

export default function CreatorDashboard({
  sidebarOnly,
  gridOnly,
  blogOnly,
  statsOnly,
}: Props) {
  if (sidebarOnly) return <CreatorProfileCard />
  if (gridOnly) return <CreatorMediaGrid />
  if (blogOnly) return <CreatorBlogSection />
  if (statsOnly) return <SessionStatsPanel />   

  return (
    <div className="space-y-10">
      <CreatorProfileCard />
      <CreatorMediaGrid />
      <CreatorBlogSection />
      <SessionStatsPanel />
    </div>
  )
}
