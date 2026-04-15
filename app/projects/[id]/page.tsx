import { prisma } from '@/lib/prisma/client'
import { notFound, redirect } from 'next/navigation'
import { requireSession, canAccessProject } from '@/lib/auth/session'
import { checkMeetingNeeded } from '@/workflows/task-workflow'
import MeetingReminderBanner from '@/components/MeetingReminderBanner'
import ProjectTabs from '@/components/ProjectTabs'

function getHealth(done: number, total: number) {
  if (total === 0) return { label: '待启动', color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200' }
  const rate = done / total
  if (rate >= 0.7) return { label: '健康', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' }
  if (rate >= 0.3) return { label: '注意', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
  return { label: '风险', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession()

  // 权限检查
  const hasAccess = await canAccessProject(session.id, params.id, session.role)
  if (!hasAccess) redirect('/403')

  const project = await prisma.project.findUnique({
    where: { id: params.id, isDeleted: false },
    include: {
      leader: true,
      members: { include: { user: true } },
      milestones: { orderBy: { dueDate: 'asc' } },
      tasks: {
        where: { isDeleted: false },
        include: { assignee: true, milestone: true },
        orderBy: { createdAt: 'asc' },
      },
      meetings: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })

  if (!project) notFound()

  const meetingNeeded = await checkMeetingNeeded(project.id).catch(() => [])
  const doneCount = project.tasks.filter(t => t.status === 'done').length
  const health = getHealth(doneCount, project.tasks.length)
  const members = project.members.map(m => m.user)

  const startStr = project.startDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const endStr = project.endDate.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })

  const canEdit = ['admin', 'pm'].includes(session.role) || project.leaderId === session.id

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <a href="/projects" className="hover:text-slate-600">项目列表</a>
        <span>/</span>
        <span className="text-slate-700">{project.name}</span>
      </nav>

      {meetingNeeded.length > 0 && (
        <MeetingReminderBanner projectId={project.id} pendingTasks={meetingNeeded} members={members} />
      )}

      {/* 项目信息卡 */}
      <div className={`rounded-2xl border p-6 shadow-sm ${health.bg}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-slate-800 leading-tight">{project.name}</h1>
              <span className={`shrink-0 text-sm font-semibold ${health.color}`}>{health.label}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{project.description}</p>
          </div>
          {canEdit && (
            <a href={`/projects/${project.id}/edit`}
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600 transition">
              编辑项目
            </a>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-slate-400">负责人</span>
            <span className="ml-2 font-medium text-slate-700">{project.leader.name}</span>
          </div>
          <div>
            <span className="text-slate-400">周期</span>
            <span className="ml-2 font-medium text-slate-700">{startStr} — {endStr}</span>
          </div>
          <div>
            <span className="text-slate-400">成员</span>
            <span className="ml-2 font-medium text-slate-700">{members.length} 人</span>
          </div>
          <div>
            <span className="text-slate-400">任务完成</span>
            <span className="ml-2 font-medium text-slate-700">{doneCount} / {project.tasks.length}</span>
          </div>
        </div>
      </div>

      <ProjectTabs project={project} members={members} canEdit={canEdit} currentUserId={session.id} />
    </div>
  )
}
