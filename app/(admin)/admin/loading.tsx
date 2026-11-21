import { Ladeplatzhalter } from '@/components/ui/ladeplatzhalter'

export default function AdminLoading() {
  return (
    <div className="mx-auto min-w-0 max-w-7xl">
      <Ladeplatzhalter status="Bereich wird geladen." zeilen={4} />
    </div>
  )
}
