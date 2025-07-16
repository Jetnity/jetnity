// app/api/copilot/generate/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { generateCopilotUpload } from '@/lib/intelligence/copilot-upload-generator'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const destination = searchParams.get('destination')
    if (!destination) {
      return NextResponse.json({ success: false, error: 'Missing destination parameter' }, { status: 400 })
    }
    const result = await generateCopilotUpload(destination)
    return NextResponse.json({ success: true, upload: result })
  } catch (error) {
    console.error('❌ Fehler in API:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
