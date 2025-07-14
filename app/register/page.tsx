// app/register/page.tsx
import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Jetzt kostenlos registrieren</h1>
        <RegisterForm />
        <p className="mt-4 text-center text-sm">
          Bereits registriert?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Zum Login
          </Link>
        </p>
      </div>
    </main>
  );
}
