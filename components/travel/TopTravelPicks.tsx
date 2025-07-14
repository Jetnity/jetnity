// components/travel/TopTravelPicks.tsx

import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";

const picks = [
  {
    title: "Athen entdecken",
    subtitle: "Geschichte & Kultur erleben",
    image: "/images/travelpicks/athen.jpg",
    href: "#",
  },
  {
    title: "Gletscher in Patagonien",
    subtitle: "Eisige Naturwunder bestaunen",
    image: "/images/travelpicks/patagonien.jpg",
    href: "#",
  },
  {
    title: "Strandparadies Tulum",
    subtitle: "Relaxen an traumhaften Küsten",
    image: "/images/travelpicks/tulum.jpg",
    href: "#",
  },
];

export default function TopTravelPicks() {
  return (
    <section className="w-full py-12 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <SectionHeader
          title="🔥 Top Travel Picks"
          subtitle="Unsere Empfehlungen der Woche"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {picks.map((pick, idx) => (
            <div
              key={idx}
              className="rounded-xl overflow-hidden shadow-md bg-white"
            >
              <div className="relative w-full h-48">
                <Image
                  src={pick.image}
                  alt={pick.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">{pick.title}</h3>
                <p className="text-sm text-gray-600">{pick.subtitle}</p>
                <a
                  href={pick.href}
                  className="inline-block mt-4 px-4 py-2 rounded bg-yellow-100 text-black font-medium hover:bg-yellow-200 transition"
                >
                  Jetzt entdecken
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
