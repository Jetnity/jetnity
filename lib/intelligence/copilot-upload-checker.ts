import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { generateCopilotUpload } from './copilot-upload-generator'

/**
 * Prüft, ob bereits ein Upload zu dieser Region existiert.
 * Wenn nicht, generiert Copilot Pro automatisch einen Upload.
 */
export async function maybeGenerateCopilotUpload(region: string) {
  const supabase = createServerComponentClient()

  const { data: existing, error } = await supabase
    .from('creator_uploads')
    .select('id')
    .eq('region', region)
    .limit(1)

  if (error) {
    console.error('❌ Fehler bei Regions-Check:', error.message)
    return null
  }

  if (existing && existing.length > 0) {
    return '✅ Bereits existierender Upload gefunden.'
  }

  const upload = await generateCopilotUpload(region)
  return upload ? '✅ Copilot-Pro Upload generiert.' : '❌ Upload fehlgeschlagen.'
}
