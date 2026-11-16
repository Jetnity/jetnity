import KartenSuche from '../KartenSuche'

export { metadata } from '../KartenSuche'
export const dynamic = 'force-dynamic'

export default function Page({ params }: { params: Promise<{ tripId: string }> }) {
  return <KartenSuche params={params} bereich="unterkunft" />
}
