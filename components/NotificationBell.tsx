'use client'
import { useState, useEffect, useCallback } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  link: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const unread = items.filter(n => !n.isRead).length

  const load = useCallback(async () => {
    const res = await fetch('/api/notifications')
    if (res.ok) setItems(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    setItems(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const iconByType: Record<string, string> = {
    meeting_reminder: '📅',
    task_assigned: '📋',
    todo_created: '✅',
    system: '🔔',
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) load() }}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700">通知</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">全部已读</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-slate-400">
                  <span className="text-2xl mb-1">🔔</span>
                  <p className="text-xs">暂无通知</p>
                </div>
              ) : (
                items.slice(0, 20).map(n => (
                  <div
                    key={n.id}
                    onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link }}
                    className={`flex cursor-pointer gap-3 px-4 py-3 hover:bg-slate-50 transition border-b border-slate-50 last:border-0 ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{iconByType[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.isRead ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="mt-0.5 text-xs text-slate-400 truncate">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-slate-300">
                        {new Date(n.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.isRead && <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
