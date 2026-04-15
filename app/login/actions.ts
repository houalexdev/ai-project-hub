'use server'
import { createHash } from 'crypto'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'
import { createSession, destroySession } from '@/lib/auth/session'
import { auditLog } from '@/lib/audit/logger'

function hashPwd(pwd: string) {
  return createHash('sha256').update(pwd + 'pmhub_salt').digest('hex')
}

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: '请填写邮箱和密码' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.isActive) {
    return { error: '账号不存在或已被禁用' }
  }

  const hash = hashPwd(password)
  if (user.passwordHash !== hash) {
    await auditLog({ action: 'LOGIN', resource: 'user', resourceId: user.id, detail: '密码错误' })
    return { error: '邮箱或密码错误' }
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar })
  await auditLog({ userId: user.id, action: 'LOGIN', resource: 'user', resourceId: user.id, detail: '登录成功' })

  redirect('/projects')
}

export async function logoutAction() {
  await destroySession()
  redirect('/login')
}
