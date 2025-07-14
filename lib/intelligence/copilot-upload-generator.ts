// lib/intelligence/copilot-upload-generator.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateDalleImage } from '@/lib/openai/generateDalleImage'
import { copilotCreators } from './copilot-creators'

export async function generateCopilotUpload(destination: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  const supabase = createServerClient(supabaseUrl, supabaseKey, { cookies: cookies() })

  // Check if upload already exists
  const { data: existingUpload } = await supabase
    .from('creator_uploads')
    .select('*')
    .eq('title', destination)
    .eq('is_virtual', true)
    .maybeSingle()

  if (existingUpload) {
    return { success: true, upload: existingUpload }
  }

  // Pick a virtual creator randomly
  const creator = copilotCreators[Math.floor(Math.random() * copilotCreators.length)]

  // Generate prompt
  const prompt = `Reisebild von ${destination}, realistisch, in hoher Qualität, dramatische Landschaft, stimmungsvoll, perfekt für Reiseinspiration`

  // Generate image using DALL·E
  const image = await generateDalleImage(prompt)
  if (!image) return { success: false }

  // Insert into Supabase
  const { data: upload } = await supabase.from('creator_uploads').insert({
    title: destination,
    creator_name: creator.name,
    creator_avatar: creator.avatar,
    image_url: image,
    is_virtual: true,
  }).select().single()

  return { success: true, upload }
}
