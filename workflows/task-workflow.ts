// 任务工作流：协调任务相关的 AI 分析与数据库操作
import { prisma } from '@/lib/prisma/client'
import { analyzeTaskForMeeting, MeetingAnalysisResult } from '@/agents/meeting-agent'

export interface TaskWithMeetingAnalysis {
  taskId: string
  taskTitle: string
  taskDescription: string
  assigneeName: string | null
  analysis: MeetingAnalysisResult
}

// 扫描项目中所有需要安排会议但尚未创建会议的任务，并进行 AI 分析
export async function checkMeetingNeeded(projectId: string): Promise<TaskWithMeetingAnalysis[]> {
  // 查询 isMeetingRelated=true 且未关联 Meeting 的任务
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      isMeetingRelated: true,
      meetingId: null,
      isDeleted: false,
    },
    include: {
      assignee: true,
    },
  })

  if (tasks.length === 0) return []

  // 并行调用 AI 分析（最多5个，避免超时）
  const results = await Promise.all(
    tasks.slice(0, 5).map(async (task) => {
      const analysis = await analyzeTaskForMeeting({
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        projectId: task.projectId,
      })
      return {
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
        assigneeName: task.assignee?.name ?? null,
        analysis,
      }
    })
  )

  // 只返回 AI 判断需要会议的任务
  return results.filter(r => r.analysis.needMeeting)
}
