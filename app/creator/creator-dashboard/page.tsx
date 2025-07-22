import { createServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import CreatorDashboardWelcome from "@/components/creator/CreatorDashboardWelcome.server";
import ContentUploadForm from "@/components/creator/ContentUploadForm";
import CreatorDashboard from "@/components/creator/CreatorDashboard";
import SectionHeader from "@/components/ui/SectionHeader";

export default async function CreatorDashboardPage() {
  const supabase = createServerComponentClient();

  // Stabilerer Auth-Check (SSR)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="px-4 py-10 max-w-6xl mx-auto space-y-12">
      <CreatorDashboardWelcome />
      <section>
        <SectionHeader
          title="Neuen Inhalt hochladen"
          subtitle="Videos, Bilder oder Guides einfach per Formular einreichen."
        />
        <div className="mt-6">
          <ContentUploadForm />
        </div>
      </section>
      <section>
        <SectionHeader
          title="Deine bisherigen Uploads"
          subtitle="Alle von dir hochgeladenen Inhalte – aktuell und vollständig."
        />
        <div className="mt-6">
          <CreatorDashboard />
        </div>
      </section>
    </main>
  );
}
