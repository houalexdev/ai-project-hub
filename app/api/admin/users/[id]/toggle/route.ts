import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { auditLog } from '@/lib/audit/logger'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { isActive } = await req.json()
  await prisma.user.update({ where: { id: params.id }, data: { isActive } })
  await auditLog({ userId: session.id, action: 'UPDATE', resource: 'user', resourceId: params.id, detail: isActive ? '启用账号' : '禁用账号' })
  return NextResponse.json({ ok: true })
}
