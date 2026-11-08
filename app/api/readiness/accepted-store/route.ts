import { NextResponse } from 'next/server'
import { acceptedStoreTripRequest } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/request-server'
import { readinessHttpHeader } from '@/lib/readiness/anfrage'

export const runtime='nodejs'
export async function POST(req:Request) {
  const response=await acceptedStoreTripRequest(req)
  return NextResponse.json(response.body,{status:response.status,headers:readinessHttpHeader()})
}
