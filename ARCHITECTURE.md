# 系统分层架构

```
app/            # 页面层（展示 + Server Actions）
components/     # 客户端 UI 组件
workflows/      # 流程编排层（协调 agents 和数据库）
agents/         # AI 语义处理层（DeepSeek 调用 + 规则降级）
lib/
  prisma/       # 数据库访问层（Prisma 单例）
  deepseek.ts   # DeepSeek 客户端封装
prisma/
  schema.prisma # 数据模型
  seed.ts       # 种子数据
```

## 数据流

1. 任务创建 → workflow.checkMeetingNeeded → meeting-agent（DeepSeek 语义判断）→ MeetingReminderBanner → Dialog → createMeetingAction → 数据库
2. 纪要上传 → parseMinutesAction → workflow.processUploadedMinutes → summary-agent（DeepSeek 解析）→ MinutesUploader 表格预览 → confirmTodosAction → 数据库
3. 看板拖拽 → updateTaskStatusAction（Server Action）→ 数据库 → revalidatePath

## DeepSeek API
- base_url: https://api.deepseek.com
- 模型: deepseek-chat
- 兼容 OpenAI SDK（openai npm 包）
- 降级策略：API 失败时自动切换关键词规则判断
