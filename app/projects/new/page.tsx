import { requirePM } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { createProjectAction } from './actions'

export default async function NewProjectPage() {
  const session = await requirePM()
  const users = await prisma.user.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })

  return (
    <div className="mx-auto max-w-2xl">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
        <a href="/projects" className="hover:text-slate-600">项目列表</a>
        <span>/</span>
        <span className="text-slate-700">新建项目</span>
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-bold text-slate-800">新建项目</h1>

        <form action={createProjectAction} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">项目名称 *</label>
            <input name="name" required maxLength={100}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder="例：某型号发动机研发论证项目" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">项目描述</label>
            <textarea name="description" rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none"
              placeholder="简要描述项目目标和范围..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">开始日期 *</label>
              <input type="date" name="startDate" required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">结束日期 *</label>
              <input type="date" name="endDate" required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">项目负责人 *</label>
            <select name="leaderId" required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100">
              <option value="">请选择负责人</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}（{u.email}）</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">项目成员（可多选）</label>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-2.5 cursor-pointer hover:text-slate-700">
                  <input type="checkbox" name="memberIds" value={u.id}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                    {u.avatar ?? u.name[0]}
                  </div>
                  <span className="text-sm text-slate-700">{u.name}</span>
                  <span className="text-xs text-slate-400">{u.email}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <a href="/projects"
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
              取消
            </a>
            <button type="submit"
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
              创建项目
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
