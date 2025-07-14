// components/layout/PublicNavbar.tsx
'use client'

import Link from 'next/link'

export default function PublicNavbar() {
  return (
    <header className="fixed top-0 w-full bg-white shadow z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold">Jetnity</div>
        <nav className="space-x-4 text-sm font-medium hidden md:flex">
          <Link href="#" className="hover:text-blue-600">Flüge</Link>
          <Link href="#" className="hover:text-blue-600">Hotels</Link>
          <Link href="#" className="hover:text-blue-600">Mietwagen</Link>
          <Link href="#" className="hover:text-blue-600">Aktivitäten</Link>
          <Link href="#" className="hover:text-blue-600">Kreuzfahrten</Link>
          <Link href="#" className="hover:text-blue-600">Reiseideen</Link>
        </nav>
      </div>
    </header>
  )
}
