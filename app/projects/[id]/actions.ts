'use server'
import { prisma } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth/session'
import { auditLog } from '@/lib/audit/logger'
import { notifyMeetingCreated, notifyTaskAssigned } from '@/lib/notify'

// ── 创建会议 ──────────────────────────────────────────────────────
export async function createMeetingAction(data: {
  projectId: string
  taskId: string
  title: string
  agenda: string
  attendeeIds: string[]
  scheduledAt?: string
  duration?: number
  location?: string
}) {
  const session = await requireSession()

  const meeting = await prisma.meeting.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      agenda: data.agenda,
      location: data.location ?? '',
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      duration: data.duration ?? 60,
      status: 'scheduled',
      attendees: {
        create: data.attendeeIds.map(uid => ({ userId: uid })),
      },
    },
  })

  await prisma.task.update({
    where: { id: data.taskId },
    data: { meetingId: meeting.id },
  })

  await auditLog({ userId: session.id, action: 'CREATE', resource: 'meeting', resourceId: meeting.id, detail: data.title })

  // 通知参会人
  const notifyIds = data.attendeeIds.filter(id => id !== session.id)
  await notifyMeetingCreated(meeting.id, notifyIds, data.projectId, data.title)

  revalidatePath(`/projects/${data.projectId}`)
  return { success: true, meetingId: meeting.id }
}

// ── 更新任务状态（看板拖拽） ───────────────────────────────────────
export async function updateTaskStatusAction(taskId: string, status: string, projectId: string) {
  const session = await requireSession()

  await prisma.task.update({ where: { id: taskId }, data: { status } })
  await auditLog({ userId: session.id, action: 'UPDATE', resource: 'task', resourceId: taskId, detail: `status→${status}` })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

// ── 新建任务 ──────────────────────────────────────────────────────
export async function createTaskAction(data: {
  projectId: string
  milestoneId?: string
  title: string
  description?: string
  assigneeId?: string
  priority?: string
  dueDate?: string
  isMeetingRelated?: boolean
}) {
  const session = await requireSession()

  const task = await prisma.task.create({
    data: {
      projectId: data.projectId,
      milestoneId: data.milestoneId || null,
      title: data.title,
      description: data.description ?? '',
      assigneeId: data.assigneeId || null,
      priority: data.priority ?? 'medium',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      isMeetingRelated: data.isMeetingRelated ?? false,
    },
  })

  await auditLog({ userId: session.id, action: 'CREATE', resource: 'task', resourceId: task.id, detail: data.title })

  if (data.assigneeId && data.assigneeId !== session.id) {
    await notifyTaskAssigned(data.title, data.assigneeId, data.projectId)
  }

  revalidatePath(`/projects/${data.projectId}`)
  return { success: true, taskId: task.id }
}

// ── 软删除任务 ────────────────────────────────────────────────────
export async function deleteTaskAction(taskId: string, projectId: string) {
  const session = await requireSession()
  await prisma.task.update({ where: { id: taskId }, data: { isDeleted: true } })
  await auditLog({ userId: session.id, action: 'DELETE', resource: 'task', resourceId: taskId })
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

// ── 新建里程碑 ────────────────────────────────────────────────────
export async function createMilestoneAction(data: {
  projectId: string
  title: string
  description?: string
  dueDate: string
}) {
  const session = await requireSession()
  const milestone = await prisma.milestone.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      description: data.description ?? '',
      dueDate: new Date(data.dueDate),
    },
  })
  await auditLog({ userId: session.id, action: 'CREATE', resource: 'milestone', resourceId: milestone.id, detail: data.title })
  revalidatePath(`/projects/${data.projectId}`)
  return { success: true }
}

// ── 更新里程碑状态 ────────────────────────────────────────────────
export async function updateMilestoneStatusAction(milestoneId: string, status: string, projectId: string) {
  const session = await requireSession()
  await prisma.milestone.update({ where: { id: milestoneId }, data: { status } })
  await auditLog({ userId: session.id, action: 'UPDATE', resource: 'milestone', resourceId: milestoneId, detail: `status→${status}` })
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}
