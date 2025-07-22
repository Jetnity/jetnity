import HeroSection from '@/components/layout/Hero/HeroSection'
import InspirationGrid from '@/components/home/InspirationGrid'
import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const supabase = createServerComponentClient()
  const { data: uploads, error } = await supabase
    .from('creator_uploads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <main>
      <HeroSection />
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Inspiration für deine nächste Reise</h2>
        {uploads && uploads.length > 0 ? (
          <InspirationGrid uploads={uploads} />
        ) : (
          <p className="text-gray-500">Noch keine Inhalte verfügbar.</p>
        )}
      </section>
    </main>
  )
}
