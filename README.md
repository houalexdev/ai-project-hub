# AI 项目管理平台

智能会议管理与任务闭环系统 —— 专为科研院所课题管理打造。

![alt tag](https://raw.githubusercontent.com/houalexdev/ai-project-hub/main/docs/ai-project-hub.png)

## ✨ 功能特性

### 🔐 用户认证与权限
- 邮箱 + 密码登录，注册管理
- 四种角色：系统管理员 / 项目经理 / 技术主管 / 成员
- 基于 JWT + httpOnly Cookie 的会话管理
- 路由守卫与页面级鉴权

### 📋 项目全景管理
- 项目基本信息、里程碑、任务看板一览无余
- 任务状态可视化（待办/进行中/已完成）
- 项目健康度智能评估
- 软删除保护，数据不丢失

### 🤖 AI 会议智能提醒
- 自动扫描需要安排会议的任务
- DeepSeek 语义分析，判断是否需要开会
- AI 预填会议信息（标题、议程、时长、参会人员）
- 一键创建会议，轻松管理

### 📝 会议纪要自动解析
- 上传 `.txt` / `.md` 格式会议纪要
- DeepSeek AI 自动提取待办任务
- 可视化编辑确认，分配负责人
- 自动生成项目任务，形成闭环管理

### 🔔 通知与推送
- 站内实时通知（会议创建、任务分配、待办下发）
- 支持企业微信 / 钉钉 Webhook 推送
- 通知铃铛，红点未读计数

### 📅 日历导出
- 生成标准 ICS 文件
- 支持导入企业微信、Outlook、手机日历

### 📊 管理后台（仅管理员）
- 系统概览：用户数、项目数、会议数、操作记录数
- 用户管理：列表展示、搜索、启用/禁用
- 审计日志：全量操作记录追踪

### 📝 审计日志
- 所有写操作自动记录
- 操作人、动作类型、资源类型、资源 ID、详情

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + Radix UI
- **数据库**: SQLite + Prisma ORM
- **AI 能力**: DeepSeek API (OpenAI SDK 兼容)
- **拖拽**: @dnd-kit
- **认证**: JWT (jose) + bcryptjs
- **通知**: 站内通知 + Webhook

## 🚀 快速开始

### 环境要求
- Node.js 18+
- DeepSeek API Key（可选，未配置时使用规则降级）

### 安装

```bash
# 克隆项目
git clone https://github.com/houalexdev/ai-project-hub.git
cd ai-project-hub

# 安装依赖
npm install

# 配置环境变量
cp env.local.example .env.local
# 编辑 .env.local，填入 DEEPSEEK_API_KEY

# 初始化数据库
npm install
npx prisma migrate dev --name init
npm run db:seed

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3001](http://localhost:3001) 即可使用。

### 环境变量

```env
# .env.local
DEEPSEEK_API_KEY=your_api_key_here
```

### 环境变量

```env
# .env.local
DEEPSEEK_API_KEY=your_api_key_here
DATABASE_URL=file:./prisma/data/project.db
SESSION_SECRET=your_session_secret_here
WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx  # 可选
```

## 📁 项目结构

```
ai-project-hub/
├── app/                        # 页面层（App Router + Server Actions）
│   ├── (admin)/admin/          # 管理后台（用户管理、审计日志）
│   ├── projects/               # 项目列表 & 详情页
│   ├── meetings/              # 会议详情页
│   ├── login/                  # 登录页
│   ├── register/               # 注册页
│   └── api/                    # API 路由（通知、ICS 导出）
├── components/                 # UI 组件
│   ├── MeetingReminderBanner.tsx   # AI 会议提醒横幅
│   ├── MinutesUploader.tsx         # 纪要上传组件
│   ├── ProjectTabs.tsx            # 项目 Tab 组件
│   ├── TaskKanban.tsx             # 任务看板
│   └── NotificationBell.tsx        # 通知铃铛
├── workflows/                  # 流程编排层
│   ├── meeting-workflow.ts          # 会议工作流
│   └── task-workflow.ts             # 任务工作流
├── agents/                     # AI 处理层
│   ├── meeting-agent.ts             # 会议判断 Agent
│   └── summary-agent.ts             # 纪要解析 Agent
├── lib/
│   ├── prisma/                 # 数据库客户端单例
│   ├── deepseek.ts             # DeepSeek 客户端封装
│   ├── auth/                   # 认证（会话、密码）
│   ├── notify/                 # 通知服务
│   └── audit/                  # 审计日志
└── prisma/
    ├── schema.prisma            # 数据模型
    └── seed.ts                 # 种子数据
```

## 🎯 核心数据流

```
1. 任务创建 → AI 分析是否需要会议 → 提醒横幅 → 创建会议
2. 会议结束 → 上传纪要 → AI 解析待办 → 确认分配 → 生成任务
3. 看板拖拽 → 更新状态 → 自动同步
4. 写操作 → 审计日志（异步、非阻断）
```

## 📚 更多文档

- [架构设计](ARCHITECTURE.md) — 系统分层与数据流
- [功能需求](PRD.md) — 产品需求文档
- [升级日志](CHANGELOG.md) — Demo → 生产系统改造记录
- [开发规范](CONVENTIONS.md) — 代码风格与约定
- [部署指南](SETUP.md) — 详细安装配置说明

## 📄 License

MIT
