import Link from 'next/link'
import { Upload, Images, FileText, BarChart3 } from 'lucide-react'

const Btn = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
  <Link
    href={href}
    className="inline-flex items-center gap-2 rounded-xl border border-input px-3 py-2 text-sm hover:bg-accent"
  >
    <Icon className="h-4 w-4" /> {label}
  </Link>
)

export default function QuickActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Btn href="/creator/media/new" icon={Upload} label="Neu hochladen" />
      <Btn href="/creator/media" icon={Images} label="Media-Studio öffnen" />
      <Btn href="/creator/guides/new" icon={FileText} label="Guide erstellen" />
      <Btn href="/creator/analytics" icon={BarChart3} label="Analytics ansehen" />
    </div>
  )
}
