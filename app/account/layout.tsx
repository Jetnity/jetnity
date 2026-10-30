// app/account/layout.tsx
//
// Gemeinsamer Darstellungsrahmen für Konto, Reiseauswahl und Reiseplanung.
// Die einzelnen Seiten behalten ihre Zugriffsprüfung und Fachlogik.

import type { Metadata } from 'next'

import WorkspaceShell from '@/components/workspace/WorkspaceShell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell contentId="account-content">{children}</WorkspaceShell>
}
