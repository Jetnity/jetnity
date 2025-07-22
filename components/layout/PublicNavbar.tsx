'use client'

import Link from 'next/link'
import { useState } from 'react'
import { User, LogIn, UserPlus, LayoutDashboard } from 'lucide-react'

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full bg-white shadow z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold">Jetnity</div>
        <nav className="space-x-4 text-sm font-medium hidden md:flex items-center">
          <Link href="#" className="hover:text-blue-600">Flüge</Link>
          <Link href="#" className="hover:text-blue-600">Hotels</Link>
          <Link href="#" className="hover:text-blue-600">Mietwagen</Link>
          <Link href="#" className="hover:text-blue-600">Aktivitäten</Link>
          <Link href="#" className="hover:text-blue-600">Kreuzfahrten</Link>
          <Link href="#" className="hover:text-blue-600">Reiseideen</Link>
          {/* Creator Login Dropdown */}
          <div className="relative inline-block">
            <button
              onClick={() => setOpen((v) => !v)}
              className="ml-4 px-4 py-2 rounded-lg font-semibold text-white bg-black hover:bg-neutral-800 transition-all flex items-center gap-2 shadow"
              aria-haspopup="true"
              aria-expanded={open}
              type="button"
            >
              <User className="w-4 h-4" /> Creator Login
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-xl z-50 py-2">
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-900"
                  onClick={() => setOpen(false)}
                >
                  <LogIn className="w-4 h-4" /> Anmelden
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-900"
                  onClick={() => setOpen(false)}
                >
                  <UserPlus className="w-4 h-4" /> Registrieren
                </Link>
                <Link
                  href="/creator/creator-dashboard"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-900"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" /> Creator Dashboard
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
