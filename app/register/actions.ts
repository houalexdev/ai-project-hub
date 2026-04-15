'use server'
import { redirect } from 'next/navigation'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma/client'
import { auditLog } from '@/lib/audit/logger'

function hashPwd(pwd: string) {
  return createHash('sha256').update(pwd + 'pmhub_salt').digest('hex')
}

export async function registerAction(formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const role = formData.get('role') as string || 'member'

  if (!name || !email || !password) return

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) redirect('/register?error=email_taken')

  const user = await prisma.user.create({
    data: { name, email, passwordHash: hashPwd(password), role, avatar: name[0].toUpperCase() }
  })

  await auditLog({ userId: user.id, action: 'CREATE', resource: 'user', resourceId: user.id, detail: `注册：${email}` })
  redirect('/login?registered=1')
}
