import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center py-20">
      <h2 className="text-2xl font-semibold mb-4">🚫 Seite nicht gefunden</h2>
      <p className="text-gray-500 mb-6">Die aufgerufene Seite existiert nicht.</p>
      <Link
        href="/"
        className="text-blue-600 hover:underline text-sm"
        aria-label="Zur Startseite"
      >
        Zur Startseite
      </Link>
    </div>
  )
}
