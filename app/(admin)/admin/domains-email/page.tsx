// app/(admin)/admin/domains-email/page.tsx
import React from 'react';
import DomainEmailOverview from '@/components/admin/domains/DomainEmailOverview';

export const metadata = {
  title: 'Domains & E-Mail · Jetnity Admin',
  robots: { index: false, follow: false }, // Admin noindex
};

export default function DomainsEmailPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Domains & E-Mail</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Prüfe & korrigiere DNS-Einträge für E-Mail-Zustellbarkeit (SPF, DKIM, DMARC, MX) und optional Web (Apex A / WWW CNAME).
      </p>
      <DomainEmailOverview />
    </div>
  );
}
