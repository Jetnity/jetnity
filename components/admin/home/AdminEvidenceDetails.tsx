import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export default function AdminEvidenceDetails({ children, label = 'Datenqualität & Nachweis' }: {
  children: ReactNode
  label?: string
}) {
  return (
    <details className="group min-w-0 border-t border-border text-xs text-muted-foreground">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md py-2 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown aria-hidden className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-2 break-words pb-3 leading-relaxed">{children}</div>
    </details>
  )
}
