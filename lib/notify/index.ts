// 通知服务：站内信 + 企业微信/钉钉 Webhook（可选）
import { prisma } from '@/lib/prisma/client'

export type NotifyType = 'meeting_reminder' | 'task_assigned' | 'todo_created' | 'system'

/** 创建站内通知 */
export async function createNotification(opts: {
  userId: string
  type: NotifyType
  title: string
  body?: string
  link?: string
}) {
  return prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body ?? '',
      link: opts.link ?? '',
    },
  })
}

/** 批量通知一批用户 */
export async function notifyMany(userIds: string[], opts: Omit<Parameters<typeof createNotification>[0], 'userId'>) {
  if (userIds.length === 0) return
  await prisma.notification.createMany({
    data: userIds.map(uid => ({
      userId: uid,
      type: opts.type,
      title: opts.title,
      body: opts.body ?? '',
      link: opts.link ?? '',
    })),
  })
}

/** 推送企业微信/钉钉 Webhook（环境变量配置则启用） */
export async function pushWebhook(text: string) {
  const url = process.env.WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msgtype: 'text', text: { content: text } }),
    })
  } catch (e) {
    console.warn('[Webhook] 推送失败', e)
  }
}

/** 会议创建后通知参会人 */
export async function notifyMeetingCreated(meetingId: string, attendeeIds: string[], projectId: string, title: string) {
  await notifyMany(attendeeIds, {
    type: 'meeting_reminder',
    title: `📅 新会议：${title}`,
    body: '你有一个新的会议邀请，请查看详情。',
    link: `/meetings/${meetingId}`,
  })
  await pushWebhook(`【AI 项目管理】新会议通知：${title}，请相关成员查看系统。`)
}

/** 任务分配通知 */
export async function notifyTaskAssigned(taskTitle: string, assigneeId: string, projectId: string) {
  await createNotification({
    userId: assigneeId,
    type: 'task_assigned',
    title: `📋 新任务分配：${taskTitle}`,
    body: '你有一个新任务被分配，请及时跟进。',
    link: `/projects/${projectId}`,
  })
}

/** 待办下发通知 */
export async function notifyTodosCreated(assigneeId: string, count: number, meetingTitle: string, projectId: string) {
  await createNotification({
    userId: assigneeId,
    type: 'todo_created',
    title: `✅ 会议待办已下发（${count} 条）`,
    body: `来自会议：${meetingTitle}`,
    link: `/projects/${projectId}`,
  })
}
