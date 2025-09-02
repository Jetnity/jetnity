'use client'
import Link from 'next/link'
import { Upload, Images, BarChart3 } from 'lucide-react'

export default function MobileQuickbar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] md:hidden">
      <div className="mx-auto flex max-w-[640px] items-center justify-around p-2">
        <Link href="/creator/media/new" className="flex flex-col items-center text-xs">
          <Upload className="h-5 w-5" /> Hochladen
        </Link>
        <Link href="/creator/media" className="flex flex-col items-center text-xs">
          <Images className="h-5 w-5" /> Studio
        </Link>
        <Link href="/creator/analytics" className="flex flex-col items-center text-xs">
          <BarChart3 className="h-5 w-5" /> Analytics
        </Link>
      </div>
    </div>
  )
}
