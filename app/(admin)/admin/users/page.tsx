import { requireSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'
import UserManageClient from './UserManageClient'

export default async function AdminUsersPage() {
  const session = await requireSession()
  if (session.role !== 'admin') redirect('/403')

  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">用户管理</h1>
          <p className="text-sm text-slate-500 mt-1">共 {users.length} 个用户</p>
        </div>
        <a href="/register" className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          添加用户
        </a>
      </div>
      <UserManageClient users={users} />
    </div>
  )
}
