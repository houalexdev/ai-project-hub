# 开发规范

- UI 组件使用 Tailwind CSS + shadcn/ui 风格，禁止手写复杂 CSS。
- 所有数据库操作必须在 Server Action 或 API Route 中完成（`'use server'`）。
- AI 逻辑封装在 `agents/`，输出必须是严格 JSON。
- 流程编排封装在 `workflows/`，页面层只调用 workflows。
- 单文件不超过 200 行。代码注释中文，变量命名英文。
- 所有 AI 调用必须有 try/catch，失败时降级或返回友好提示。
