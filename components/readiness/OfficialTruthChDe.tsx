'use client'

import OfficialTruthVisitorV3 from './OfficialTruthVisitorV3'
import { loadChDeVisa } from '@/lib/readiness/official-truth-product-v3/visitor/ch-de-http'

export default function OfficialTruthChDe() {
  return <OfficialTruthVisitorV3 query={loadChDeVisa} mode="ch-de-visa" />
}
