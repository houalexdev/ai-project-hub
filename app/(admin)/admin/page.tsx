import { requireSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'

export default async function AdminPage() {
  const session = await requireSession()
  if (session.role !== 'admin') redirect('/403')

  const [userCount, projectCount, meetingCount, auditCount] = await Promise.all([
    prisma.user.count(),
    prisma.project.count({ where: { isDeleted: false } }),
    prisma.meeting.count(),
    prisma.auditLog.count(),
  ])

  const recentLogs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const actionLabel: Record<string, string> = {
    CREATE: '创建', UPDATE: '更新', DELETE: '删除', LOGIN: '登录', LOGOUT: '退出', VIEW: '查看'
  }
  const resourceLabel: Record<string, string> = {
    project: '项目', task: '任务', meeting: '会议', user: '用户', todo: '待办', milestone: '里程碑'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">系统管理</h1>
        <p className="text-sm text-slate-500 mt-1">系统概览与审计日志</p>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '用户总数', value: userCount, icon: '👤', href: '/admin/users' },
          { label: '项目总数', value: projectCount, icon: '📁', href: '/projects' },
          { label: '会议总数', value: meetingCount, icon: '📅', href: null },
          { label: '操作记录', value: auditCount, icon: '📋', href: '/admin/audit' },
        ].map(stat => (
          <a key={stat.label} href={stat.href ?? '#'}
            className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${stat.href ? 'hover:border-blue-200 hover:shadow-md transition' : ''}`}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </a>
        ))}
      </div>

      {/* 最近操作日志 */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">最近操作记录</h2>
          <a href="/admin/audit" className="text-xs text-blue-600 hover:underline">查看全部 →</a>
        </div>
        <div className="divide-y divide-slate-50">
          {recentLogs.map(log => (
            <div key={log.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                {log.user?.avatar ?? log.user?.name[0] ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">{log.user?.name ?? '系统'}</span>
                  <span className="mx-1 text-slate-400">{actionLabel[log.action] ?? log.action}</span>
                  <span className="text-slate-500">{resourceLabel[log.resource] ?? log.resource}</span>
                  {log.detail && <span className="ml-1 text-slate-400">"{log.detail}"</span>}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {new Date(log.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
