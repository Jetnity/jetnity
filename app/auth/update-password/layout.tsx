// app/auth/update-password/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Passwort aktualisieren',
  robots: { index: false, follow: false },
};

export default function UpdatePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
