// app/search/page.tsx

import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { maybeGenerateCopilotUpload } from '@/lib/intelligence/copilot-upload-checker'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { region?: string }
}) {
  const region = searchParams.region
  const supabase = createServerComponentClient({ cookies: cookies() })

  // ggf. neuen Copilot-Upload generieren
  if (region) {
    await maybeGenerateCopilotUpload(region)
  }

  // Uploads für die Region laden
  const { data: uploads } = await supabase
    .from('creator_uploads')
    .select('*')
    .ilike('region', `%${region ?? ''}%`)
    .order('created_at', { ascending: false })

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">
        Suchergebnisse für: {region ?? 'Alle Regionen'}
      </h1>

      {uploads && uploads.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="rounded-lg overflow-hidden shadow hover:shadow-xl transition"
            >
              <img
                src={upload.image_url ?? undefined}
                alt={upload.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold">{upload.title}</h2>
                <p className="text-sm text-gray-600">{upload.mood}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          Noch keine Inhalte verfügbar. CoPilot Pro bereitet passende Inhalte vor...
        </p>
      )}
    </div>
  )
}
