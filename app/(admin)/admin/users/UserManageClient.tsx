'use client'
import { useState } from 'react'

interface User {
  id: string; name: string; email: string; role: string
  avatar?: string | null; isActive: boolean; lastLoginAt?: Date | null; createdAt: Date
}

const roleLabel: Record<string, string> = { admin: '管理员', pm: '项目经理', lead: '技术主管', member: '成员' }
const roleColor: Record<string, string> = {
  admin: 'bg-red-50 text-red-700', pm: 'bg-blue-50 text-blue-700',
  lead: 'bg-purple-50 text-purple-700', member: 'bg-slate-100 text-slate-600'
}

export default function UserManageClient({ users: init }: { users: User[] }) {
  const [users, setUsers] = useState(init)
  const [search, setSearch] = useState('')

  const filtered = users.filter(u =>
    u.name.includes(search) || u.email.includes(search)
  )

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/users/${id}/toggle`, { method: 'POST', body: JSON.stringify({ isActive: !isActive }), headers: { 'Content-Type': 'application/json' } })
    if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !isActive } : u))
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          placeholder="搜索姓名或邮箱…" />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">用户</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">角色</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">最后登录</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500">状态</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {filtered.map(u => (
            <tr key={u.id} className="hover:bg-slate-50/50">
              <td className="px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {u.avatar ?? u.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-3.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColor[u.role] ?? roleColor.member}`}>
                  {roleLabel[u.role] ?? u.role}
                </span>
              </td>
              <td className="px-6 py-3.5 text-xs text-slate-500">
                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '从未登录'}
              </td>
              <td className="px-6 py-3.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {u.isActive ? '正常' : '已禁用'}
                </span>
              </td>
              <td className="px-6 py-3.5 text-right">
                <button onClick={() => toggleActive(u.id, u.isActive)}
                  className={`rounded-lg border px-3 py-1 text-xs transition ${
                    u.isActive ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                  }`}>
                  {u.isActive ? '禁用' : '启用'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
