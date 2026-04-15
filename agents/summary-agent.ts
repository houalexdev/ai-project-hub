// 纪要解析 Agent
// 调用 DeepSeek API 从会议纪要文本中提取结构化待办任务
import { deepseek, DEEPSEEK_MODEL, isApiKeyConfigured } from '@/lib/deepseek'

export interface ParsedTodoItem {
  title: string
  assigneeName: string // 负责人姓名（"待分配"表示未能识别）
  dueDate: string | null // YYYY-MM-DD 格式
  priority: 'high' | 'medium' | 'low'
  memberMatched: boolean // 是否在项目成员中找到对应人
}

export interface ParseMinutesResult {
  items: ParsedTodoItem[]
  error?: string
}

// 从纪要文本解析待办任务
export async function parseMinutesWithAI(
  minutesText: string,
  memberNames: string[]
): Promise<ParseMinutesResult> {
  if (!isApiKeyConfigured()) {
    // 未配置 Key 时返回示例数据，方便演示
    return {
      items: [
        { title: '（示例）完成技术方案文档修订', assigneeName: memberNames[0] ?? '待分配', dueDate: null, priority: 'high', memberMatched: true },
        { title: '（示例）整理测试报告', assigneeName: '待分配', dueDate: null, priority: 'medium', memberMatched: false },
      ],
      error: 'DeepSeek API Key 未配置，以下为示例数据',
    }
  }

  try {
    const membersStr = memberNames.join('、') || '（无成员信息）'
    const today = new Date().toISOString().split('T')[0]

    const prompt = `你是会议纪要解析器。请从以下会议纪要中提取所有待办任务。

项目成员列表（请从中匹配负责人）：${membersStr}

今天日期：${today}（相对日期如"下周五"请转换为具体日期）

会议纪要内容：
${minutesText}

请仅返回严格 JSON 数组，不要输出任何其他文字：
[
  {
    "title": "任务描述（简洁明确）",
    "assigneeName": "负责人姓名（必须是成员列表中的人，无法确定填'待分配'）",
    "dueDate": "YYYY-MM-DD（无法确定填null）",
    "priority": "high或medium或low",
    "memberMatched": true或false
  }
]`

    const response = await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content ?? '{"items":[]}'

    // DeepSeek 可能返回对象或数组，兼容处理
    let parsed = JSON.parse(content)
    const items: ParsedTodoItem[] = Array.isArray(parsed) ? parsed : (parsed.items ?? parsed.todos ?? [])

    return { items }
  } catch (error) {
    console.error('[summary-agent] DeepSeek 解析失败:', error)
    return {
      items: [],
      error: `AI 解析失败：${error instanceof Error ? error.message : '未知错误'}，请手动填写待办事项。`,
    }
  }
}
