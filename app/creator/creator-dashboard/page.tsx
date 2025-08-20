// app/creator/creator-dashboard/page.tsx
import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import CreatorProfileCard from "@/components/creator/dashboard/CreatorProfileCard";
import CreatorDashboardWelcome from "@/components/creator/CreatorDashboardWelcome.server";
import ContentUploadForm from "@/components/creator/ContentUploadForm";
import CreatorMediaGrid from "@/components/creator/dashboard/CreatorMediaGrid";
import CreatorBlogSection from "@/components/creator/dashboard/CreatorBlogSection";
import SessionStatsPanel from "@/components/creator/dashboard/SessionStatsPanel";
import ImpactScorePanel from "@/components/creator/dashboard/ImpactScorePanel";
import SectionHeader from "@/components/ui/SectionHeader";
import GoToMediaStudioButton from "@/components/creator/GoToMediaStudioButton";

// ⬇️ Neu: Zeitfenster-Tabs
import TimeframeTabs from "@/components/creator/dashboard/TimeframeTabs";

export default async function CreatorDashboardPage({
  searchParams,
}: {
  searchParams?: { range?: string }
}) {
  const supabase = createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Range aus URL lesen und in Tage umsetzen
  const range = (searchParams?.range ?? "90").toLowerCase();
  const days: number | "all" =
    range === "all"
      ? "all"
      : [30, 90, 180].includes(Number(range))
      ? (Number(range) as 30 | 90 | 180)
      : 90;

  return (
    <main className="mx-auto max-w-7xl px-2 md:px-6 py-12">
      {/* Top-Bar mit Titel + Range-Tabs + Media-Studio CTA */}
      <div className="mb-8 flex flex-wrap items-center gap-3 justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Creator-Dashboard</h1>
        <div className="flex items-center gap-3">
          <TimeframeTabs />
          <GoToMediaStudioButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* ---- Sidebar: Creator-Profil ---- */}
        <aside className="lg:col-span-3 order-2 lg:order-1">
          <div className="sticky top-8">
            <CreatorProfileCard />
          </div>
        </aside>

        {/* ---- Main Content ---- */}
        <section className="lg:col-span-6 order-1 lg:order-2 space-y-10">
          <CreatorDashboardWelcome />

          {/* Upload Formular */}
          <div className="mt-8">
            <SectionHeader
              title="Neuen Inhalt hochladen"
              subtitle="Videos, Bilder oder Guides direkt per Upload."
            />
            <div className="mt-5">
              <ContentUploadForm />
            </div>
          </div>

          {/* Uploads Grid & Filter */}
          <div className="mt-8">
            <SectionHeader
              title="Deine Uploads & Stories"
              subtitle="Alle von dir erstellten Inhalte im Überblick."
            />
            <CreatorMediaGrid />
          </div>

          {/* Blog Section */}
          <div className="mt-8">
            <SectionHeader
              title="Blogposts & Stories"
              subtitle="Verwalte und veröffentliche deine Beiträge."
            />
            <CreatorBlogSection />
          </div>
        </section>

        {/* ---- Right Panel: Impact + (optional) Stats ---- */}
        <aside className="lg:col-span-3 order-3">
          <div className="sticky top-8 space-y-10">
            {/* Zeitfenster wird ins Panel gereicht */}
            <ImpactScorePanel days={days} />
            <SessionStatsPanel days={days} hideWhenEmpty />
          </div>
        </aside>
      </div>
    </main>
  );
}
