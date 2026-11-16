import KartenSuche, { metadata } from './KartenSuche'
export { metadata }
export default function Seite({ params }: { params: Promise<{ tripId: string }> }) {
  return <KartenSuche params={params} />
}
