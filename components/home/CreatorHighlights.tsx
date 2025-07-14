// components/home/CreatorHighlights.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/ui/SectionHeader";

const creators = [
  {
    name: "Lina Travelista",
    username: "lina-travelista",
    bio: "Hidden Gems in Südostasien",
    image: "/images/creators/lina.jpg",
  },
  {
    name: "Urban Nomad",
    username: "urban-nomad",
    bio: "Städtereisen & Architektur",
    image: "/images/creators/urban.jpg",
  },
  {
    name: "Wilderness Max",
    username: "wilderness-max",
    bio: "Abenteuer weltweit",
    image: "/images/creators/max.jpg",
  },
];

export default function CreatorHighlights() {
  return (
    <section className="w-full py-10 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <SectionHeader
          title="🔥 Creator-Highlights"
          subtitle="Top Reiseinhalte von echten Profis"
        />

        <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-2">
          {creators.map((creator) => (
            <Link
              href={`/creator/${creator.username}`}
              key={creator.username}
              className="flex-shrink-0 w-[220px] rounded-xl bg-white shadow-md hover:shadow-lg transition p-4"
            >
              <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden">
                <Image
                  src={creator.image}
                  alt={creator.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-lg font-semibold">{creator.name}</h3>
              <p className="text-sm text-gray-600">{creator.bio}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
