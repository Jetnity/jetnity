// app/embed/twelve-go/route.ts
//
// Immer 404. Kein Anbieterdokument, kein Fetch, kein Schalter in der Query.

import { twelveGoEmbedVerweigern } from '@/lib/providers/twelve-go/widget/einbettung'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export function GET(_request: Request): Response {
  void _request
  return twelveGoEmbedVerweigern()
}

export function POST(_request: Request): Response {
  void _request
  return twelveGoEmbedVerweigern()
}

export function PUT(_request: Request): Response {
  void _request
  return twelveGoEmbedVerweigern()
}

export function PATCH(_request: Request): Response {
  void _request
  return twelveGoEmbedVerweigern()
}

export function DELETE(_request: Request): Response {
  void _request
  return twelveGoEmbedVerweigern()
}

export function HEAD(_request: Request): Response {
  void _request
  return twelveGoEmbedVerweigern()
}

export function OPTIONS(_request: Request): Response {
  void _request
  return twelveGoEmbedVerweigern()
}
