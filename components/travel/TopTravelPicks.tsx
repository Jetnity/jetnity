// components/travel/TopTravelPicks.tsx
import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

export type TravelPick = {
  title: string;
  subtitle?: string;
  image: string;     // /public/... oder remote
  href: string;
  tag?: string;
  prefetch?: boolean;
};

const DEFAULT_PICKS: Readonly<TravelPick[]> = [
  {
    title: "Athen entdecken",
    subtitle: "Geschichte & Kultur erleben",
    image: "/images/travelpicks/athen.jpg",
    href: "/search?dest=athen",
    tag: "City & Kultur",
  },
  {
    title: "Gletscher in Patagonien",
    subtitle: "Eisige Naturwunder bestaunen",
    image: "/images/travelpicks/patagonien.jpg",
    href: "/search?dest=patagonien",
    tag: "Abenteuer",
  },
  {
    title: "Strandparadies Tulum",
    subtitle: "Relaxen an traumhaften Küsten",
    image: "/images/travelpicks/tulum.jpg",
    href: "/search?dest=tulum",
    tag: "Beach",
  },
];

export default function TopTravelPicks({
  items = DEFAULT_PICKS,
  title = "🔥 Top Travel Picks",
  subtitle = "Unsere Empfehlungen der Woche",
  className,
}: {
  items?: readonly TravelPick[];
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <section className={cn("w-full py-12 px-4 md:px-8", className)}>
      <div className="mx-auto max-w-screen-xl">
        <SectionHeader title={title} subtitle={subtitle} />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {items.map((pick, idx) => {
            const cardId = `travel-pick-${idx}`;
            const isFirst = idx === 0;

            return (
              <Link
                key={cardId}
                href={pick.href}
                prefetch={pick.prefetch ?? true}
                aria-labelledby={`${cardId}-title`}
                className={cn(
                  "group relative block overflow-hidden rounded-2xl border",
                  "bg-card text-foreground shadow-e1 transition hover:shadow-e2",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
              >
                {/* Bildbereich */}
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={pick.image}
                    alt={pick.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 400px"
                    priority={isFirst}
                    className="object-cover"
                  />
                  {/* Tag/Badge optional */}
                  {pick.tag && (
                    <span
                      className={cn(
                        "absolute left-3 top-3 rounded-full border border-white/30 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur",
                        "group-hover:bg-black/45"
                      )}
                    >
                      {pick.tag}
                    </span>
                  )}
                  {/* leichter Gradient für Lesbarkeit */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
                </div>

                {/* Textbereich */}
                <div className="p-4">
                  <h3 id={`${cardId}-title`} className="text-lg font-semibold">
                    {pick.title}
                  </h3>
                  {pick.subtitle && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {pick.subtitle}
                    </p>
                  )}

                  <span
                    className={cn(
                      "mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold",
                      "bg-primary text-primary-foreground",
                      "transition group-hover:brightness-95"
                    )}
                  >
                    Jetzt entdecken
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
