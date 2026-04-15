import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json([], { status: 401 })

  const items = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  return NextResponse.json(items)
}
