import { createRoot } from 'react-dom/client'

import TripPlanner from '@/components/trips/TripPlanner'

declare global {
  interface Window {
    __planenAngemeldet?: boolean
  }
}

const host = document.getElementById('root')
if (!host) throw new Error('missing root')

createRoot(host).render(
  <TripPlanner
    angemeldet={window.__planenAngemeldet === true}
    initialDestination="Bangkok"
    initialDestinationId="geonames:1609350"
    initialWeitereZiele={[
      { id: 'geonames:1153671', name: 'Chiang Mai' },
      { id: 'geonames:1151254', name: 'Phuket' },
    ]}
  />,
)
