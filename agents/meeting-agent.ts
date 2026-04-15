// 会议判断 Agent
// 优先使用 DeepSeek 语义分析，失败时降级为关键词规则判断
import { deepseek, DEEPSEEK_MODEL, isApiKeyConfigured } from '@/lib/deepseek'

export interface MeetingAnalysisResult {
  needMeeting: boolean
  reason: string
  suggestedTitle: string
  suggestedAgenda: string[]
  estimatedDuration: number // 分钟
  source: 'ai' | 'rule' // 判断来源
}

interface TaskInput {
  title: string
  description: string
  assigneeId?: string | null
  projectId: string
}

// 关键词降级规则
const MEETING_KEYWORDS = ['会议', '评审', '讨论', '论证', '研讨', '汇报', '审查', '协调']

function ruleFallback(task: TaskInput): MeetingAnalysisResult {
  const text = task.title + task.description
  const matched = MEETING_KEYWORDS.find(kw => text.includes(kw))
  if (matched) {
    return {
      needMeeting: true,
      reason: `任务标题或描述中包含"${matched}"，建议安排专项会议。`,
      suggestedTitle: task.title,
      suggestedAgenda: ['确认任务目标与范围', '讨论关键问题与风险', '明确行动计划与责任人'],
      estimatedDuration: 60,
      source: 'rule',
    }
  }
  return {
    needMeeting: false,
    reason: '任务不需要专门安排会议。',
    suggestedTitle: '',
    suggestedAgenda: [],
    estimatedDuration: 0,
    source: 'rule',
  }
}

// 主函数：AI 语义分析任务是否需要会议
export async function analyzeTaskForMeeting(task: TaskInput): Promise<MeetingAnalysisResult> {
  // 未配置 API Key 时直接用规则降级
  if (!isApiKeyConfigured()) {
    console.warn('[meeting-agent] DeepSeek API Key 未配置，使用规则降级')
    return ruleFallback(task)
  }

  try {
    const prompt = `你是项目管理助手。请分析以下科研项目任务，判断是否需要安排专门的会议来推进。

任务标题：${task.title}
任务描述：${task.description || '（无描述）'}

请仅返回严格 JSON，不要输出任何其他文字：
{
  "needMeeting": true或false,
  "reason": "简短说明（20字以内）",
  "suggestedTitle": "建议的会议名称",
  "suggestedAgenda": ["议题1", "议题2", "议题3"],
  "estimatedDuration": 60
}`

    const response = await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(content) as MeetingAnalysisResult
    return { ...parsed, source: 'ai' }
  } catch (error) {
    console.error('[meeting-agent] DeepSeek 调用失败，降级为规则判断:', error)
    return ruleFallback(task)
  }
}
