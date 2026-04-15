'use client'
import { useState } from 'react'
import { updateMeetingStatusAction } from '@/app/meetings/[id]/actions'

export default function MeetingStatusButton({ meetingId, currentStatus, projectId }: {
  meetingId: string; currentStatus: string; projectId: string
}) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)

  async function handleClick(newStatus: string) {
    setLoading(true)
    await updateMeetingStatusAction(meetingId, newStatus, projectId)
    setStatus(newStatus)
    setLoading(false)
  }

  if (status === 'completed') return null

  return (
    <div className="flex gap-2">
      {status === 'scheduled' && (
        <button onClick={() => handleClick('completed')} disabled={loading}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition">
          标记完成
        </button>
      )}
      {status !== 'cancelled' && (
        <button onClick={() => handleClick('cancelled')} disabled={loading}
          className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-60 transition">
          取消会议
        </button>
      )}
    </div>
  )
}
