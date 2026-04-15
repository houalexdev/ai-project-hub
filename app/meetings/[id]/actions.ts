'use server'
import { prisma } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { auditLog } from '@/lib/audit/logger'
import { notifyTodosCreated } from '@/lib/notify'

// AI 解析纪要
export async function parseMinutesAction(meetingId: string, text: string) {
  const { processUploadedMinutes } = await import('@/workflows/meeting-workflow')
  return processUploadedMinutes(meetingId, text)
}

// 确认并下发待办
export async function confirmTodosAction({
  meetingId,
  projectId,
  items,
}: {
  meetingId: string
  projectId: string
  items: Array<{ title: string; assigneeName: string; assigneeId?: string; dueDate?: string; priority: string }>
}) {
  const session = await requireSession()

  // 获取会议信息
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { title: true } })

  await prisma.todoItem.createMany({
    data: items.map(item => ({
      meetingId,
      projectId,
      title: item.title,
      assigneeId: item.assigneeId || null,
      dueDate: item.dueDate ? new Date(item.dueDate) : null,
      priority: item.priority,
      aiGenerated: true,
      reviewed: true,
    })),
  })

  // 更新会议状态为已完成
  await prisma.meeting.update({ where: { id: meetingId }, data: { status: 'completed' } })

  await auditLog({ userId: session.id, action: 'CREATE', resource: 'todo', resourceId: meetingId, detail: `下发 ${items.length} 条待办` })

  // 按负责人分组通知
  const byAssignee = new Map<string, number>()
  for (const item of items) {
    if (item.assigneeId && item.assigneeId !== session.id) {
      byAssignee.set(item.assigneeId, (byAssignee.get(item.assigneeId) ?? 0) + 1)
    }
  }
  for (const [assigneeId, count] of byAssignee) {
    await notifyTodosCreated(assigneeId, count, meeting?.title ?? '会议', projectId)
  }

  revalidatePath(`/meetings/${meetingId}`)
  return { success: true }
}

// 更新会议状态
export async function updateMeetingStatusAction(meetingId: string, status: string, projectId: string) {
  const session = await requireSession()
  await prisma.meeting.update({ where: { id: meetingId }, data: { status } })
  await auditLog({ userId: session.id, action: 'UPDATE', resource: 'meeting', resourceId: meetingId, detail: `status→${status}` })
  revalidatePath(`/meetings/${meetingId}`)
  return { success: true }
}
