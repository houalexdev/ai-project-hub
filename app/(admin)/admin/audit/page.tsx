import { requireSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'

export default async function AuditPage({ searchParams }: { searchParams: { page?: string } }) {
  const session = await requireSession()
  if (session.role !== 'admin') redirect('/403')

  const page = Number(searchParams.page ?? 1)
  const pageSize = 30
  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  const actionColor: Record<string, string> = {
    CREATE: 'bg-emerald-50 text-emerald-700', UPDATE: 'bg-blue-50 text-blue-700',
    DELETE: 'bg-red-50 text-red-600', LOGIN: 'bg-purple-50 text-purple-700',
    LOGOUT: 'bg-slate-100 text-slate-500', VIEW: 'bg-slate-50 text-slate-500',
  }
  const actionLabel: Record<string, string> = { CREATE: '创建', UPDATE: '更新', DELETE: '删除', LOGIN: '登录', LOGOUT: '退出', VIEW: '查看' }
  const resourceLabel: Record<string, string> = { project: '项目', task: '任务', meeting: '会议', user: '用户', todo: '待办', milestone: '里程碑' }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin" className="text-slate-400 hover:text-slate-600 text-sm">← 管理后台</a>
        <h1 className="text-2xl font-bold text-slate-800">操作审计日志</h1>
        <span className="text-sm text-slate-500">共 {total} 条</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">时间</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">操作人</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">动作</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">对象</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">详情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                      {log.user?.avatar ?? log.user?.name?.[0] ?? '?'}
                    </div>
                    <span className="text-slate-700">{log.user?.name ?? '系统'}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${actionColor[log.action] ?? 'bg-slate-100 text-slate-500'}`}>
                    {actionLabel[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500">{resourceLabel[log.resource] ?? log.resource}</td>
                <td className="px-5 py-3 text-xs text-slate-400 max-w-xs truncate">{log.detail || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
            <span className="text-xs text-slate-500">第 {page} / {totalPages} 页</span>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?page=${page - 1}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">上一页</a>
              )}
              {page < totalPages && (
                <a href={`?page=${page + 1}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">下一页</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
