// 审计日志记录器
import { prisma } from '@/lib/prisma/client'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW'
export type AuditResource = 'project' | 'task' | 'meeting' | 'user' | 'todo' | 'milestone'

export async function auditLog(opts: {
  userId?: string
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  detail?: string
  ip?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId,
        action: opts.action,
        resource: opts.resource,
        resourceId: opts.resourceId,
        detail: opts.detail ?? '',
        ip: opts.ip ?? '',
      },
    })
  } catch {
    // 审计日志失败不影响主流程
    console.warn('[AuditLog] 写入失败', opts)
  }
}
