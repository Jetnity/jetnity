// app/(public)/register/page.tsx
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/server';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Registrieren – Jetnity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RegisterPage() {
  const supabase = createServerComponentClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/creator/creator-dashboard');
  }

  return (
    <main className="min-h-[70vh] container mx-auto px-4 py-10 flex items-center justify-center">
      <RegisterForm />
    </main>
  );
}
