import { decide } from '../../lib/decide.mjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function answer(request: Request) {
  return decide(request)
}

export function GET(request: Request) {
  return answer(request)
}

export function POST(request: Request) {
  return answer(request)
}

export function PUT(request: Request) {
  return answer(request)
}

export function PATCH(request: Request) {
  return answer(request)
}

export function DELETE(request: Request) {
  return answer(request)
}

export function HEAD(request: Request) {
  return answer(request)
}

export function OPTIONS(request: Request) {
  return answer(request)
}