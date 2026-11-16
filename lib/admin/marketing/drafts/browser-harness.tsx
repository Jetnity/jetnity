import { createRoot } from 'react-dom/client'
import CampaignDrafts from '@/components/admin/marketing/CampaignDrafts'

export type CampaignFixtureBoot = { language: 'de' | 'en'; enabled: boolean }
declare global { interface Window { __campaignBoot: CampaignFixtureBoot; __campaignViolations: string[] } }
const boot = window.__campaignBoot
createRoot(document.getElementById('root')!).render(<CampaignDrafts sprache={boot.language} enabled={boot.enabled} />)
