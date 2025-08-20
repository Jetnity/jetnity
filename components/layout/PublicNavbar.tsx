'use client'

import Link from 'next/link'
import { useState } from 'react'
import { User, LogIn, UserPlus, LayoutDashboard } from 'lucide-react'

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full bg-white shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="text-xl font-bold">Jetnity</div>

        {/* Hauptnavigation (Desktop) */}
        <nav className="hidden items-center space-x-4 text-sm font-medium md:flex">
          <Link href="#" className="hover:text-blue-600">Reiseideen</Link>
          <Link href="/blog" className="hover:text-blue-600">Blog</Link>

          {/* Creator Login Dropdown */}
          <div className="relative inline-block">
            <button
              onClick={() => setOpen(v => !v)}
              className="ml-4 flex items-center gap-2 rounded-lg bg-black px-4 py-2 font-semibold text-white shadow transition-all hover:bg-neutral-800"
              aria-haspopup="true"
              aria-expanded={open}
              type="button"
            >
              <User className="h-4 w-4" /> Creator Login
            </button>

            {open && (
              <div
                className="absolute right-0 z-50 mt-2 w-56 rounded-xl border bg-white py-2 shadow-xl"
                role="menu"
              >
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 text-gray-900 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  <LogIn className="h-4 w-4" /> Anmelden
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-4 py-2 text-gray-900 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  <UserPlus className="h-4 w-4" /> Registrieren
                </Link>
                <Link
                  href="/creator/creator-dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-gray-900 hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                  role="menuitem"
                >
                  <LayoutDashboard className="h-4 w-4" /> Creator Dashboard
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
