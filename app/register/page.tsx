import { registerAction } from './actions'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">创建账号</h1>
          <p className="mt-1 text-sm text-slate-500">AI 项目管理平台</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form action={registerAction} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">姓名 *</label>
              <input name="name" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" placeholder="张三" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">邮箱 *</label>
              <input type="email" name="email" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" placeholder="zhang@example.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">密码 *</label>
              <input type="password" name="password" required minLength={6} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" placeholder="至少 6 位" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">角色</label>
              <select name="role" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100">
                <option value="member">成员</option>
                <option value="lead">技术主管</option>
                <option value="pm">项目经理</option>
              </select>
            </div>
            <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
              创建账号
            </button>
            <a href="/login" className="block text-center text-xs text-slate-400 hover:text-slate-600">已有账号？登录</a>
          </form>
        </div>
      </div>
    </div>
  )
}
