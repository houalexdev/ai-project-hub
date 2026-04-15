# 升级日志 — Demo → 生产系统

## 本次改造总览

在原始 Demo（项目展示 + AI 会议提醒 + 纪要解析）基础上，完整实现 P0/P1/P2 三个等级的生产化功能。

---

## P0：必做（安全与基础）

### ① 用户认证体系
- `app/login/` — 登录页面，支持邮箱 + 密码登录
- `app/register/` — 注册页，管理员添加新用户时使用
- `lib/auth/session.ts` — 基于 Jose JWT + httpOnly Cookie 的会话管理
  - `requireSession()` — 页面级鉴权，未登录自动跳 `/login`
  - `requirePM()` — PM 及以上权限才能访问
  - `canAccessProject()` — 检查用户是否属于某项目
- `middleware.ts` — 全局路由守卫，拦截所有未登录请求

### ② 权限管理
- 四种角色：`admin`（系统管理员）/ `pm`（项目经理）/ `lead`（技术主管）/ `member`（成员）
- 项目列表：admin 看全部，其他人只看自己参与的项目
- 项目详情：非成员访问跳转 403
- 新建项目 / 新建任务 / 新建里程碑：仅 admin 或 pm 可操作
- `app/403/` — 无权限提示页

### ③ 数据模型升级
- `prisma/schema.prisma` 新增字段：
  - `User`：`email`、`passwordHash`、`isActive`、`lastLoginAt`
  - `Task` / `Project`：`isDeleted`（软删除）
  - `Meeting`：`location`、`notified`
- 新增两张表：`AuditLog`（审计日志）、`Notification`（站内通知）
- 种子数据新增演示账号（见启动说明）

### ④ 错误监控入口
- 所有 Server Action 均用 try/catch 包裹，失败不崩页面
- 审计日志以非阻断方式写入，不影响主流程

---

## P1：重要（功能完整性）

### ⑤ 完整 CRUD
- 新建项目：`/projects/new`，支持选负责人和多选成员
- 新建任务：项目详情页"任务看板"Tab 内弹窗，支持分配成员、优先级、截止日期、关联里程碑
- 新建里程碑：里程碑 Tab 内弹窗
- 软删除任务：卡片 hover 显示删除按钮，数据不实际清除
- 里程碑状态流转：待开始 → 进行中 → 已完成
- 会议状态控制：已安排 → 标记完成 / 取消会议

### ⑥ 通知与推送
- `lib/notify/index.ts` — 通知服务
  - **站内通知**：写入 `Notification` 表，实时读取
  - **企业微信 / 钉钉 Webhook**：配置 `WEBHOOK_URL` 环境变量后自动启用
- 触发时机：
  - 会议创建 → 通知所有参会人
  - 任务分配 → 通知被分配人
  - 待办下发 → 按负责人分组通知
  - 加入项目 → 通知新成员
- `components/NotificationBell.tsx` — 顶部导航栏通知铃铛
  - 红点显示未读数量
  - 下拉面板展示最近 20 条
  - 点击单条标已读，支持全部已读

### ⑦ 日历导出（ICS）
- `app/api/ics/[meetingId]/` — 生成标准 ICS 文件
- 会议详情页"导出日历"按钮，可直接导入企业微信 / Outlook / 手机日历

### ⑧ 审计日志
- `lib/audit/logger.ts` — 所有写操作（创建/更新/删除/登录）均记录
- 记录内容：操作人、动作类型、资源类型、资源 ID、详情

---

## P2：增强（管理后台）

### ⑨ 系统管理后台 `/admin`（仅 admin 可见）
- **首页**：用户数、项目数、会议数、操作记录数四项统计 + 最近 10 条操作日志
- **用户管理** `/admin/users`：列表展示、搜索、启用/禁用账号
- **审计日志** `/admin/audit`：分页展示全量操作记录，按时间倒序

---

## 环境变量说明

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API Key |
| `DATABASE_URL` | 是 | SQLite 路径，如 `file:./prisma/data/project.db` |
| `SESSION_SECRET` | 是 | JWT 签名密钥，**生产环境必须替换**，32位以上随机字符串 |
| `WEBHOOK_URL` | 否 | 企业微信/钉钉 Webhook URL，不填则跳过推送 |

---

## 待继续优化（下一阶段建议）

- [ ] 换 PostgreSQL（当前仍为 SQLite，多并发写入有风险）
- [ ] 接入真实邮件发送（nodemailer + SMTP）
- [ ] 纪要支持 PDF / Word 格式上传
- [ ] 任务评论 / 附件功能
- [ ] 甘特图视图
- [ ] 移动端适配优化
- [ ] Docker 容器化部署
