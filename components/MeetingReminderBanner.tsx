'use client'
import { useState } from 'react'
import { createMeetingAction } from '@/app/projects/[id]/actions'
import type { TaskWithMeetingAnalysis } from '@/workflows/task-workflow'

interface User { id: string; name: string; avatar?: string | null }
interface Props {
  projectId: string
  pendingTasks: TaskWithMeetingAnalysis[]
  members: User[]
}

export default function MeetingReminderBanner({ projectId, pendingTasks, members }: Props) {
  const [open, setOpen] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const current = pendingTasks[currentIdx]
  const analysis = current?.analysis

  const [title, setTitle] = useState('')
  const [agenda, setAgenda] = useState('')
  const [location, setLocation] = useState('')
  const [duration, setDuration] = useState('60')
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState('')

  function openDialog(idx: number) {
    const task = pendingTasks[idx]
    setTitle(task.analysis.suggestedTitle || task.taskTitle)
    setAgenda((task.analysis.suggestedAgenda ?? []).join('\n'))
    setSelectedAttendees(members.slice(0, 2).map(m => m.id))
    setLocation('')
    setDuration('60')
    setCurrentIdx(idx)
    setOpen(true)
  }

  async function handleSubmit() {
    if (!current) return
    setSubmitting(true)
    try {
      await createMeetingAction({
        projectId,
        taskId: current.taskId,
        title,
        agenda,
        location,
        duration: Number(duration),
        attendeeIds: selectedAttendees,
        scheduledAt: scheduledAt || undefined,
      })
      if (currentIdx + 1 < pendingTasks.length) {
        openDialog(currentIdx + 1)
      } else {
        setOpen(false)
        setDone(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function toggleAttendee(id: string) {
    setSelectedAttendees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  if (dismissed || done) return null

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">
            AI 已分析：您有 <span className="font-bold">{pendingTasks.length}</span> 个任务需要安排会议
          </p>
          <p className="text-xs text-blue-600 line-clamp-1">{pendingTasks.map(t => t.taskTitle).join('、')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => openDialog(0)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700">
            立即安排
          </button>
          <button onClick={() => setDismissed(true)}
            className="rounded-lg px-3 py-1.5 text-xs text-blue-500 transition hover:bg-blue-100">
            忽略
          </button>
        </div>
      </div>

      {open && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800">创建会议邀请</h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    关联任务：{current.taskTitle}
                    {analysis.source === 'ai' && (
                      <span className="ml-1.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">AI 已分析</span>
                    )}
                  </p>
                </div>
                {pendingTasks.length > 1 && (
                  <span className="text-xs text-slate-400">{currentIdx + 1}/{pendingTasks.length}</span>
                )}
              </div>
              {analysis.reason && (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
                  💡 {analysis.reason}
                </p>
              )}
            </div>

            <div className="space-y-4 px-6 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">会议标题</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">会议议程</label>
                <textarea value={agenda} onChange={e => setAgenda(e.target.value)} rows={3}
                  placeholder="每行一个议题..." className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">会议时间</label>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">时长（分钟）</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)} className={inputCls}>
                    {[30, 60, 90, 120].map(d => <option key={d} value={d}>{d} 分钟</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">会议地点</label>
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="例：3号楼A会议室 / 腾讯会议" className={inputCls} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600">参会人员</label>
                <div className="flex flex-wrap gap-2">
                  {members.map(m => (
                    <button key={m.id} onClick={() => toggleAttendee(m.id)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                        selectedAttendees.includes(m.id)
                          ? 'border-blue-300 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}>
                      <span className={`h-4 w-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                        selectedAttendees.includes(m.id) ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'
                      }`}>{m.avatar ?? m.name[0]}</span>
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-50">取消</button>
              <button onClick={handleSubmit} disabled={submitting || !title}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50">
                {submitting ? '创建中...' : currentIdx + 1 < pendingTasks.length ? '创建并处理下一个' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
