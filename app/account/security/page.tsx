// app/account/security/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import SecurityMFA from "@/components/account/SecurityMFA";

// Diese Seite zeigt user-spezifische Inhalte → niemals statisch cachen
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sicherheit & Anmeldung – Jetnity",
  description:
    "MFA-Einstellungen (TOTP & Passkeys) für deinen Jetnity-Account.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Sicherheit & Anmeldung",
    description: "MFA-Einstellungen für deinen Account.",
  },
};

export default function SecurityPage() {
  // Server-Komponente, rendert das geschützte Client-Widget
  return (
    <main id="content" className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Kontosicherheit</h1>
        <p className="text-muted-foreground mt-2">
          Richte eine Zwei-Faktor-Authentifizierung ein, um deinen Account
          besser zu schützen.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="rounded-xl border p-6">
            <div className="h-4 w-40 bg-muted rounded mb-4" />
            <div className="space-y-2">
              <div className="h-3 w-3/4 bg-muted rounded" />
              <div className="h-3 w-2/3 bg-muted rounded" />
              <div className="h-10 w-48 bg-muted rounded mt-4" />
            </div>
          </div>
        }
      >
        <SecurityMFA />
      </Suspense>
    </main>
  );
}
