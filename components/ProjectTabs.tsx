'use client'
import { useState } from 'react'
import TaskKanban from './TaskKanban'
import { createTaskAction, createMilestoneAction, updateMilestoneStatusAction } from '@/app/projects/[id]/actions'

interface User { id: string; name: string; avatar?: string | null; role: string }
interface Milestone { id: string; title: string; dueDate: Date; status: string; description?: string }
interface Task {
  id: string; title: string; description: string; status: string; priority: string
  dueDate?: Date | null; isMeetingRelated: boolean; meetingId?: string | null
  assignee?: User | null; milestone?: Milestone | null
}
interface Project {
  id: string; name: string; description: string
  milestones: Milestone[]; tasks: Task[]
  meetings: { id: string; title: string; status: string }[]
}

const TABS = ['概览', '里程碑', '任务看板'] as const

const msStatus: Record<string, { label: string; dot: string; badge: string }> = {
  pending:     { label: '待开始', dot: 'bg-slate-300',   badge: 'bg-slate-100 text-slate-500' },
  in_progress: { label: '进行中', dot: 'bg-blue-400',    badge: 'bg-blue-50 text-blue-700' },
  completed:   { label: '已完成', dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700' },
}

export default function ProjectTabs({ project, members, canEdit, currentUserId }: {
  project: Project; members: User[]; canEdit: boolean; currentUserId: string
}) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('概览')
  const [showNewTask, setShowNewTask] = useState(false)
  const [showNewMs, setShowNewMs] = useState(false)
  const [saving, setSaving] = useState(false)

  // 新建任务表单
  async function submitTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    await createTaskAction({
      projectId: project.id,
      milestoneId: fd.get('milestoneId') as string || undefined,
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      assigneeId: fd.get('assigneeId') as string || undefined,
      priority: fd.get('priority') as string,
      dueDate: fd.get('dueDate') as string || undefined,
    })
    setSaving(false)
    setShowNewTask(false)
  }

  // 新建里程碑表单
  async function submitMs(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    await createMilestoneAction({
      projectId: project.id,
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      dueDate: fd.get('dueDate') as string,
    })
    setSaving(false)
    setShowNewMs(false)
  }

  const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Tab 导航 */}
      <div className="flex border-b border-slate-100">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3.5 text-sm font-medium transition-colors ${
              activeTab === tab ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {tab}
            {tab === '任务看板' && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{project.tasks.length}</span>
            )}
            {tab === '里程碑' && (
              <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{project.milestones.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* 概览 */}
      {activeTab === '概览' && (
        <div className="p-6 space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-600">项目描述</h3>
            <p className="text-sm leading-relaxed text-slate-600">{project.description}</p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium text-slate-600">项目成员（{members.length} 人）</h3>
            <div className="flex flex-wrap gap-3">
              {members.map(m => {
                const roleMap: Record<string, string> = { admin: '管理员', pm: '项目经理', lead: '技术主管', member: '成员' }
                return (
                  <div key={m.id} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white shadow-sm">
                      {m.avatar ?? m.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{m.name}</p>
                      <p className="text-[11px] text-slate-400">{roleMap[m.role] ?? m.role}</p>
                    </div>
                    {m.id === currentUserId && <span className="text-[10px] text-blue-500">(我)</span>}
                  </div>
                )
              })}
            </div>
          </div>
          {project.meetings.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-slate-600">近期会议</h3>
              <div className="space-y-2">
                {project.meetings.map(m => (
                  <a key={m.id} href={`/meetings/${m.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2.5 text-sm transition hover:border-blue-200 hover:bg-blue-50">
                    <span className="text-slate-700">{m.title}</span>
                    <span className={`text-xs ${m.status === 'completed' ? 'text-emerald-600' : 'text-blue-600'}`}>
                      {m.status === 'completed' ? '已完成' : '查看 →'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 里程碑 */}
      {activeTab === '里程碑' && (
        <div className="p-6">
          {canEdit && (
            <div className="mb-4 flex justify-end">
              <button onClick={() => setShowNewMs(true)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                新建里程碑
              </button>
            </div>
          )}
          {project.milestones.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <p className="text-sm">暂无里程碑</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-200" />
              <div className="space-y-6 pl-10">
                {project.milestones.map(ms => {
                  const s = msStatus[ms.status] ?? msStatus.pending
                  const dateStr = new Date(ms.dueDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
                  const relatedTasks = project.tasks.filter(t => t.milestone?.id === ms.id)
                  const doneTasks = relatedTasks.filter(t => t.status === 'done')
                  return (
                    <div key={ms.id} className="relative">
                      <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white shadow ${s.dot}`} />
                      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-slate-800">{ms.title}</h4>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.badge}`}>{s.label}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400">截止：{dateStr}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {relatedTasks.length > 0 && (
                              <span className="text-xs text-slate-400">{doneTasks.length}/{relatedTasks.length} 任务</span>
                            )}
                            {canEdit && ms.status !== 'completed' && (
                              <button
                                onClick={() => updateMilestoneStatusAction(ms.id, ms.status === 'pending' ? 'in_progress' : 'completed', project.id)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 hover:border-blue-300 hover:text-blue-600 transition">
                                {ms.status === 'pending' ? '开始' : '完成'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 任务看板 */}
      {activeTab === '任务看板' && (
        <div className="p-6">
          {canEdit && (
            <div className="mb-4 flex justify-end">
              <button onClick={() => setShowNewTask(true)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                新建任务
              </button>
            </div>
          )}
          <TaskKanban tasks={project.tasks} projectId={project.id} members={members} canEdit={canEdit} />
        </div>
      )}

      {/* 新建任务弹窗 */}
      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-5 text-base font-semibold text-slate-800">新建任务</h3>
            <form onSubmit={submitTask} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">任务标题 *</label>
                <input name="title" required className={inputCls} placeholder="简洁描述任务内容" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">任务描述</label>
                <textarea name="description" rows={2} className={inputCls + ' resize-none'} placeholder="详细说明..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">负责人</label>
                  <select name="assigneeId" className={inputCls}>
                    <option value="">未分配</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">优先级</label>
                  <select name="priority" className={inputCls}>
                    <option value="high">高</option>
                    <option value="medium" selected>中</option>
                    <option value="low">低</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">截止日期</label>
                  <input type="date" name="dueDate" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">所属里程碑</label>
                  <select name="milestoneId" className={inputCls}>
                    <option value="">无</option>
                    {project.milestones.map(ms => <option key={ms.id} value={ms.id}>{ms.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNewTask(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                  取消
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                  {saving ? '保存中…' : '创建任务'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新建里程碑弹窗 */}
      {showNewMs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-5 text-base font-semibold text-slate-800">新建里程碑</h3>
            <form onSubmit={submitMs} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">里程碑名称 *</label>
                <input name="title" required className={inputCls} placeholder="例：总体技术方案评审" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">描述</label>
                <textarea name="description" rows={2} className={inputCls + ' resize-none'} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">截止日期 *</label>
                <input type="date" name="dueDate" required className={inputCls} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowNewMs(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                  取消
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition">
                  {saving ? '保存中…' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
