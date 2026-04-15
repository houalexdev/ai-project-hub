import { prisma } from '@/lib/prisma/client'
import { requireSession } from '@/lib/auth/session'
import Link from 'next/link'

function getHealth(done: number, total: number) {
  if (total === 0) return { label: '无任务', color: 'bg-slate-100 text-slate-500' }
  const rate = done / total
  if (rate >= 0.7) return { label: '健康', color: 'bg-emerald-50 text-emerald-700' }
  if (rate >= 0.3) return { label: '注意', color: 'bg-amber-50 text-amber-700' }
  return { label: '风险', color: 'bg-red-50 text-red-600' }
}

function statusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    active:    { label: '进行中', color: 'bg-blue-50 text-blue-700' },
    completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700' },
    paused:    { label: '已暂停', color: 'bg-slate-100 text-slate-500' },
    archived:  { label: '已归档', color: 'bg-slate-100 text-slate-400' },
  }
  return map[status] ?? { label: status, color: 'bg-slate-100 text-slate-500' }
}

export default async function ProjectsPage() {
  const session = await requireSession()

  // admin 看全部，其他人只看自己参与的项目
  const projects = await prisma.project.findMany({
    where: {
      isDeleted: false,
      ...(session.role !== 'admin' ? {
        members: { some: { userId: session.id } },
      } : {}),
    },
    include: {
      leader: true,
      members: { include: { user: true } },
      tasks: { where: { isDeleted: false } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const canCreate = ['admin', 'pm'].includes(session.role)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">项目列表</h1>
          <p className="mt-1 text-sm text-slate-500">共 {projects.length} 个项目</p>
        </div>
        {canCreate && (
          <Link
            href="/projects/new"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            新建项目
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-24 text-slate-400">
          <svg className="mb-3 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <p className="text-sm">暂无项目</p>
          {canCreate && (
            <Link href="/projects/new" className="mt-3 text-sm text-blue-600 hover:underline">新建第一个项目 →</Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => {
            const doneCount = project.tasks.filter(t => t.status === 'done').length
            const totalCount = project.tasks.length
            const health = getHealth(doneCount, totalCount)
            const status = statusLabel(project.status)
            const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                  <div className="mb-4 flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>{status.label}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${health.color}`}>{health.label}</span>
                  </div>
                  <h2 className="mb-1.5 line-clamp-2 text-base font-semibold leading-snug text-slate-800 group-hover:text-blue-700">
                    {project.name}
                  </h2>
                  <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-slate-500">{project.description}</p>
                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                      <span>任务进度</span>
                      <span>{doneCount}/{totalCount}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                        {project.leader.avatar ?? project.leader.name[0]}
                      </div>
                      <span className="text-xs text-slate-500">{project.leader.name}</span>
                    </div>
                    <div className="flex -space-x-1.5">
                      {project.members.slice(0, 4).map(m => (
                        <div key={m.userId} title={m.user.name}
                          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[9px] font-bold text-slate-600">
                          {m.user.avatar ?? m.user.name[0]}
                        </div>
                      ))}
                      {project.members.length > 4 && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[9px] text-slate-500">
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
