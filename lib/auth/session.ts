// 轻量会话管理 — 基于 httpOnly Cookie + JWT（不依赖 next-auth）
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma/client'

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'ai-project-hub-secret-change-in-prod'
)
const COOKIE = 'pmhub_session'
const EXPIRES = 60 * 60 * 24 * 7 // 7 天

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  avatar?: string | null
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES}s`)
    .sign(SECRET)

  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRES,
    path: '/',
  })
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return (payload as { user: SessionUser }).user
  } catch {
    return null
  }
}

export async function destroySession() {
  ;(await cookies()).delete(COOKIE)
}

/** 获取当前会话，若未登录重定向到登录页 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }
  return session
}

/** 仅 admin / pm 可操作项目管理类接口 */
export async function requirePM(): Promise<SessionUser> {
  const session = await requireSession()
  if (!['admin', 'pm'].includes(session.role)) {
    const { redirect } = await import('next/navigation')
    redirect('/403')
  }
  return session
}

/** 检查用户是否有权访问某个项目（admin 全通，其他只看自己的） */
export async function canAccessProject(userId: string, projectId: string, role: string) {
  if (role === 'admin') return true
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  return !!member
}
