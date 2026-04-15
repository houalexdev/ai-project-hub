// 会议工作流：协调会议相关的 AI 解析与数据库操作
import { prisma } from '@/lib/prisma/client'
import { parseMinutesWithAI, ParseMinutesResult } from '@/agents/summary-agent'

// 处理上传的会议纪要：解析并返回结构化待办（不直接入库）
export async function processUploadedMinutes(
  meetingId: string,
  fileText: string
): Promise<ParseMinutesResult> {
  // 查询会议所属项目的成员列表
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      project: {
        include: {
          members: {
            include: { user: true },
          },
        },
      },
    },
  })

  if (!meeting) {
    return { items: [], error: '会议不存在' }
  }

  const memberNames = meeting.project.members.map(m => m.user.name)

  // 调用 AI Agent 解析
  return parseMinutesWithAI(fileText, memberNames)
}

// 查询项目成员（用于下拉选择）
export async function getProjectMembers(projectId: string) {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: true },
  })
  return members.map(m => m.user)
}
