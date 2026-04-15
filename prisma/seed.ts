import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

// 简单密码哈希（生产环境用 bcrypt）
function hashPwd(pwd: string) {
  return createHash('sha256').update(pwd + 'pmhub_salt').digest('hex')
}

async function main() {
  console.log('🌱 开始写入种子数据...')

  await prisma.notification.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.todoItem.deleteMany()
  await prisma.meetingAttendee.deleteMany()
  await prisma.meeting.deleteMany()
  await prisma.task.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  // 创建成员（含 email 和密码）
  const admin = await prisma.user.create({
    data: { name: '系统管理员', email: 'admin@example.com', passwordHash: hashPwd('admin123'), role: 'admin', avatar: 'SA' },
  })
  const zhangWei = await prisma.user.create({
    data: { name: '张伟', email: 'zhangwei@example.com', passwordHash: hashPwd('pass123'), role: 'pm', avatar: 'ZW' },
  })
  const liNa = await prisma.user.create({
    data: { name: '李娜', email: 'lina@example.com', passwordHash: hashPwd('pass123'), role: 'lead', avatar: 'LN' },
  })
  const wangLei = await prisma.user.create({
    data: { name: '王磊', email: 'wanglei@example.com', passwordHash: hashPwd('pass123'), role: 'member', avatar: 'WL' },
  })
  const zhaoMin = await prisma.user.create({
    data: { name: '赵敏', email: 'zhaomin@example.com', passwordHash: hashPwd('pass123'), role: 'member', avatar: 'ZM' },
  })

  const project = await prisma.project.create({
    data: {
      name: '某型号发动机研发论证项目',
      description: '针对新型号航空发动机开展可行性研究与技术论证，包括总体方案设计、关键技术攻关、性能指标验证等核心工作，计划历时18个月完成论证阶段目标。',
      status: 'active',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-07-15'),
      leaderId: zhangWei.id,
    },
  })

  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: zhangWei.id },
      { projectId: project.id, userId: liNa.id },
      { projectId: project.id, userId: wangLei.id },
      { projectId: project.id, userId: zhaoMin.id },
    ],
  })

  const m1 = await prisma.milestone.create({ data: { projectId: project.id, title: '需求分析与可行性研究', dueDate: new Date('2024-03-31'), status: 'completed' } })
  const m2 = await prisma.milestone.create({ data: { projectId: project.id, title: '总体技术方案评审', dueDate: new Date('2024-06-30'), status: 'in_progress' } })
  const m3 = await prisma.milestone.create({ data: { projectId: project.id, title: '关键技术攻关与原型验证', dueDate: new Date('2024-12-31'), status: 'pending' } })

  await prisma.task.createMany({
    data: [
      { projectId: project.id, milestoneId: m1.id, title: '竞品技术资料收集与分析', description: '收集国内外同类型发动机技术资料，进行横向对比分析，形成调研报告。', assigneeId: liNa.id, status: 'done', priority: 'medium', dueDate: new Date('2024-03-15') },
      { projectId: project.id, milestoneId: m2.id, title: '发动机技术方案评审会议', description: '组织各技术方向负责人对总体技术方案进行评审，重点讨论推力指标、结构设计和材料选型三大核心议题，形成评审意见。', assigneeId: zhangWei.id, status: 'in_progress', priority: 'high', isMeetingRelated: true, dueDate: new Date('2024-06-20') },
      { projectId: project.id, milestoneId: m2.id, title: '性能指标论证研讨会', description: '针对推力、油耗、可靠性等关键性能指标开展专项论证，邀请外部专家参与评估，形成论证报告。', assigneeId: liNa.id, status: 'todo', priority: 'high', isMeetingRelated: true, dueDate: new Date('2024-06-28') },
      { projectId: project.id, milestoneId: m3.id, title: '核心部件仿真模型搭建', description: '基于评审通过的技术方案，完成压气机、燃烧室、涡轮三大部件的CFD仿真模型。', assigneeId: wangLei.id, status: 'todo', priority: 'high', dueDate: new Date('2024-09-30') },
      { projectId: project.id, milestoneId: m3.id, title: '项目月度进度报告编制', description: '整理本月各任务进展情况，更新项目计划，编制月度进度报告提交院领导。', assigneeId: zhaoMin.id, status: 'in_progress', priority: 'low', dueDate: new Date('2024-06-05') },
    ],
  })

  console.log('✅ 种子数据写入完成！')
  console.log(`   默认账号：`)
  console.log(`     admin@example.com / admin123  (系统管理员)`)
  console.log(`     zhangwei@example.com / pass123 (项目经理)`)
  console.log(`     lina@example.com / pass123     (技术主管)`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
