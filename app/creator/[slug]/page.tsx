// app/creator/[slug]/page.tsx

import Image from "next/image";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// ✅ Datenquelle (temporär lokal, später via DB/API)
const creators = [
  {
    username: "lina-travelista",
    name: "Lina Travelista",
    bio: "Hidden Gems in Südostasien",
    image: "/images/creators/lina.jpg",
    socials: {
      instagram: "https://instagram.com/lina.travelista",
      youtube: "https://youtube.com/@linatravelista",
    },
    gallery: [
      "/images/creator-content/lina1.jpg",
      "/images/creator-content/lina2.jpg",
    ],
  },
  {
    username: "urban-nomad",
    name: "Urban Nomad",
    bio: "Städtereisen & Architektur",
    image: "/images/creators/urban.jpg",
    socials: {
      instagram: "https://instagram.com/urban.nomad",
    },
    gallery: [],
  },
  {
    username: "wilderness-max",
    name: "Wilderness Max",
    bio: "Abenteuer weltweit",
    image: "/images/creators/max.jpg",
    socials: {
      youtube: "https://youtube.com/@wildernessmax",
    },
    gallery: [],
  },
];

export async function generateStaticParams() {
  return creators.map((creator) => ({
    slug: creator.username,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const creator = creators.find((c) => c.username === params.slug);
  if (!creator) return {};
  return {
    title: `${creator.name} – Jetnity Creator`,
    description: creator.bio,
    openGraph: {
      title: creator.name,
      description: creator.bio,
      images: [creator.image],
    },
  };
}

export default function CreatorPage({ params }: { params: { slug: string } }) {
  const creator = creators.find((c) => c.username === params.slug);

  if (!creator) return notFound();

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="w-full md:w-1/3">
          <div className="relative w-full aspect-square rounded-xl overflow-hidden">
            <Image
              src={creator.image}
              alt={creator.name}
              fill
              className="object-cover"
            />
          </div>
        </div>
        <div className="w-full md:w-2/3">
          <h1 className="text-3xl font-bold">{creator.name}</h1>
          <p className="mt-2 text-gray-600">{creator.bio}</p>

          <div className="flex gap-4 mt-4">
            {creator.socials.instagram && (
              <a
                href={creator.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Instagram
              </a>
            )}
            {creator.socials.youtube && (
              <a
                href={creator.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-500 hover:underline"
              >
                YouTube
              </a>
            )}
          </div>
        </div>
      </div>

      {creator.gallery.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Galerie</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {creator.gallery.map((src, idx) => (
              <div
                key={idx}
                className="relative w-full h-60 rounded-lg overflow-hidden"
              >
                <Image src={src} alt={`Media ${idx + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
