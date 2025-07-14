import { getTrendingUploads } from "@/lib/intelligence/copilot-feed.server"
import Image from "next/image"
import Link from "next/link"

export default async function CoPilotFeedServer() {
  const uploads = await getTrendingUploads()

  if (uploads.length === 0) {
    return (
      <p className="text-center text-gray-400 py-10">
        Noch keine Empfehlungen von CoPilot Pro verfügbar.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {uploads.map((upload) => (
        <div key={upload.id} className="bg-white rounded-xl shadow p-4 flex flex-col space-y-2">
          <Image
            src={upload.image_url ?? ""}
            alt={upload.title}
            width={500}
            height={300}
            className="rounded-xl object-cover w-full h-48"
          />
          <h3 className="text-lg font-semibold">{upload.title}</h3>
          <p className="text-sm text-gray-600">
            {upload.region} • {upload.mood}
          </p>
          <Link
            href={`/creator-dashboard?id=${upload.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Mehr erfahren
          </Link>
        </div>
      ))}
    </div>
  )
}
