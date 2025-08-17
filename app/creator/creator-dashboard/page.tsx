import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import CreatorProfileCard from '@/components/creator/dashboard/CreatorProfileCard'
import CreatorDashboardWelcome from '@/components/creator/CreatorDashboardWelcome.server'
import ContentUploadForm from '@/components/creator/ContentUploadForm'
import CreatorMediaGrid from '@/components/creator/dashboard/CreatorMediaGrid'
import CreatorBlogSection from '@/components/creator/dashboard/CreatorBlogSection'
import SessionStatsPanel from '@/components/creator/dashboard/SessionStatsPanel'
import ImpactScorePanel from '@/components/creator/dashboard/ImpactScorePanel'
import SectionHeader from '@/components/ui/SectionHeader'

export default async function CreatorDashboardPage() {
  const supabase = createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main className="max-w-7xl mx-auto px-2 md:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar: Profil */}
        <aside className="lg:col-span-3 order-2 lg:order-1">
          <div className="sticky top-8">
            <CreatorProfileCard />
          </div>
        </aside>

        {/* Main */}
        <section className="lg:col-span-6 order-1 lg:order-2 space-y-10">
          <CreatorDashboardWelcome />

          <div className="mt-2">
            <SectionHeader
              title="Neuen Inhalt hochladen"
              subtitle="Videos, Bilder oder Guides direkt per Upload."
            />
            <div className="mt-5">
              <ContentUploadForm />
            </div>
          </div>

          <div className="mt-2">
            <SectionHeader
              title="Deine Uploads & Stories"
              subtitle="Alle von dir erstellten Inhalte im Überblick."
            />
            <CreatorMediaGrid />
          </div>

          <div className="mt-2">
            <SectionHeader
              title="Blogposts & Stories"
              subtitle="Verwalte und veröffentliche deine Beiträge."
            />
            <CreatorBlogSection />
          </div>
        </section>

        {/* Right Panel */}
        <aside className="lg:col-span-3 order-3">
          <div className="sticky top-8 space-y-6">
            <ImpactScorePanel />
            <SessionStatsPanel />
          </div>
        </aside>
      </div>
    </main>
  )
}
