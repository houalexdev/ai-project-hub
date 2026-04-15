import { prisma } from '@/lib/prisma/client'
import { notFound } from 'next/navigation'
import { requireSession, canAccessProject } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import MinutesUploader from '@/components/MinutesUploader'
import MeetingStatusButton from '@/components/MeetingStatusButton'

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession()

  const meeting = await prisma.meeting.findUnique({
    where: { id: params.id },
    include: {
      project: { include: { members: { include: { user: true } } } },
      attendees: { include: { user: true } },
      todoItems: { include: { assignee: true }, orderBy: { createdAt: 'asc' } },
    },
  })
  if (!meeting) notFound()

  const hasAccess = await canAccessProject(session.id, meeting.projectId, session.role)
  if (!hasAccess) redirect('/403')

  const members = meeting.project.members.map(m => m.user)
  const canEdit = ['admin', 'pm'].includes(session.role) || meeting.project.leaderId === session.id

  const timeStr = meeting.scheduledAt
    ? meeting.scheduledAt.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '待定'

  const statusMap: Record<string, { label: string; color: string }> = {
    scheduled: { label: '已安排', color: 'bg-blue-50 text-blue-700' },
    completed:  { label: '已完成', color: 'bg-emerald-50 text-emerald-700' },
    cancelled:  { label: '已取消', color: 'bg-slate-100 text-slate-500' },
  }
  const status = statusMap[meeting.status] ?? { label: meeting.status, color: 'bg-slate-100 text-slate-500' }

  const priorityLabel: Record<string, { label: string; color: string }> = {
    high:   { label: '高', color: 'text-red-600 bg-red-50' },
    medium: { label: '中', color: 'text-amber-600 bg-amber-50' },
    low:    { label: '低', color: 'text-blue-500 bg-blue-50' },
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <a href="/projects" className="hover:text-slate-600">项目列表</a>
        <span>/</span>
        <a href={`/projects/${meeting.projectId}`} className="hover:text-slate-600">{meeting.project.name}</a>
        <span>/</span>
        <span className="text-slate-700">会议详情</span>
      </nav>

      {/* 会议信息卡 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-800">{meeting.title}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>{status.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* ICS 日历下载 */}
            <a href={`/api/ics/${meeting.id}`}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              导出日历
            </a>
            {canEdit && meeting.status !== 'completed' && (
              <MeetingStatusButton meetingId={meeting.id} currentStatus={meeting.status} projectId={meeting.projectId} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">时间</p>
            <p className="font-medium text-slate-700">{timeStr}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">时长</p>
            <p className="font-medium text-slate-700">{meeting.duration} 分钟</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">地点</p>
            <p className="font-medium text-slate-700">{meeting.location || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">参会人</p>
            <p className="font-medium text-slate-700">{meeting.attendees.length} 人</p>
          </div>
        </div>

        {meeting.agenda && (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 mb-1.5">议程</p>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
              {meeting.agenda}
            </div>
          </div>
        )}

        {/* 参会人头像 */}
        <div className="mt-4 flex flex-wrap gap-2">
          {meeting.attendees.map(a => (
            <div key={a.userId} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                {a.user.avatar ?? a.user.name[0]}
              </div>
              <span className="text-xs text-slate-600">{a.user.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 待办列表 */}
      {meeting.todoItems.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">会议待办（{meeting.todoItems.length} 条）</h2>
          <div className="space-y-2">
            {meeting.todoItems.map(item => {
              const p = priorityLabel[item.priority] ?? priorityLabel.medium
              return (
                <div key={item.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                  item.status === 'done' ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'
                }`}>
                  <div className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center ${
                    item.status === 'done' ? 'border-emerald-400 bg-emerald-400' : 'border-slate-300'
                  }`}>
                    {item.status === 'done' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </div>
                  <p className={`flex-1 text-sm ${item.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {item.title}
                  </p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${p.color}`}>{p.label}</span>
                  {item.assignee && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">
                        {item.assignee.avatar ?? item.assignee.name[0]}
                      </div>
                      <span className="text-[11px] text-slate-400">{item.assignee.name}</span>
                    </div>
                  )}
                  {item.dueDate && (
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.dueDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                    </span>
                  )}
                  {item.aiGenerated && (
                    <span className="rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-600">AI</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 纪要上传 */}
      {meeting.status !== 'cancelled' && (
        <MinutesUploader meetingId={meeting.id} projectId={meeting.projectId} members={members} />
      )}
    </div>
  )
}
