# 快速启动指南

## 1. 安装依赖

```bash
npm install
```

## 2. 配置环境变量

复制并编辑 `.env.local`：

```bash
# 必填
DEEPSEEK_API_KEY=sk-你的key

# 数据库（默认 SQLite，路径已配好）
DATABASE_URL="file:./prisma/data/project.db"

# Session 密钥（生产环境务必改为随机长字符串）
SESSION_SECRET=change-me-in-production-use-random-32chars

# 可选：企业微信/钉钉 Webhook
# WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
```

## 3. 初始化数据库

```bash
npx prisma db push
npx tsx prisma/seed.ts
```

## 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 5. 演示账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin@example.com | admin123 | 系统管理员（可访问 /admin） |
| zhangwei@example.com | pass123 | 项目经理（可新建项目和任务） |
| lina@example.com | pass123 | 技术主管 |
| wanglei@example.com | pass123 | 成员 |
| zhaomin@example.com | pass123 | 成员 |

## 6. 核心功能路径

- `/projects` — 项目列表（权限过滤）
- `/projects/new` — 新建项目（PM 及以上）
- `/projects/[id]` — 项目详情（概览 / 里程碑 / 任务看板）
- `/meetings/[id]` — 会议详情 + 纪要上传 + 待办下发
- `/admin` — 系统管理后台（仅 admin）
- `/admin/users` — 用户管理
- `/admin/audit` — 操作审计日志

## 7. 生产部署前必做

1. 将 `SESSION_SECRET` 替换为 32 位以上随机字符串
2. 将 `DATABASE_URL` 换为 PostgreSQL 连接字符串（schema.prisma 中 provider 改为 `postgresql`）
3. 配置 `WEBHOOK_URL` 接入企业内通讯工具
4. 设置 HTTPS
