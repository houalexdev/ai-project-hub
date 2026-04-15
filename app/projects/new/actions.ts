'use server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'
import { requirePM } from '@/lib/auth/session'
import { auditLog } from '@/lib/audit/logger'
import { notifyMany } from '@/lib/notify'

export async function createProjectAction(formData: FormData) {
  const session = await requirePM()
  const name = formData.get('name') as string
  const description = formData.get('description') as string || ''
  const startDate = new Date(formData.get('startDate') as string)
  const endDate = new Date(formData.get('endDate') as string)
  const leaderId = formData.get('leaderId') as string
  const memberIds = formData.getAll('memberIds') as string[]

  const project = await prisma.project.create({
    data: {
      name, description, startDate, endDate, leaderId,
      members: {
        create: Array.from(new Set([leaderId, ...memberIds])).map(uid => ({ userId: uid })),
      },
    },
  })

  await auditLog({ userId: session.id, action: 'CREATE', resource: 'project', resourceId: project.id, detail: name })

  // 通知所有成员
  const notifyIds = Array.from(new Set([leaderId, ...memberIds])).filter(id => id !== session.id)
  await notifyMany(notifyIds, {
    type: 'system',
    title: `📁 你被加入项目：${name}`,
    body: '请登录查看项目详情。',
    link: `/projects/${project.id}`,
  })

  redirect(`/projects/${project.id}`)
}
