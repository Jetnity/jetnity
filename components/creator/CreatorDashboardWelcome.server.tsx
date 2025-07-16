import { getCopilotSuggestions } from '@/lib/intelligence/copilot-pro.server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import CreatorDashboardWelcome from './CreatorDashboardWelcome'
import { redirect } from 'next/navigation'

export default async function CreatorDashboardWelcomeServer() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const suggestions = await getCopilotSuggestions()
  return <CreatorDashboardWelcome suggestions={suggestions} />
}
