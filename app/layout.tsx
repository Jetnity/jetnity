// app/layout.tsx

import '../styles/globals.css';
import { Metadata } from 'next';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Jetnity – KI-Reiseplattform',
  description: 'Flüge, Hotels, Inspiration & Creator – alles auf einer Plattform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        {children}
        <Toaster /> {/* ← zeigt Toast-Benachrichtigungen global an */}
      </body>
    </html>
  );
}
