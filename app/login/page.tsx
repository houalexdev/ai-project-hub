import { loginAction } from './actions'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const session = await getSession()
  if (session) redirect('/projects')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">AI 项目管理平台</h1>
          <p className="mt-1 text-sm text-slate-500">科研院所课题管理系统</p>
        </div>

        {/* 登录卡片 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-slate-700">登录账号</h2>

          <form action={loginAction} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">邮箱</label>
              <input
                type="email"
                name="email"
                required
                placeholder="your@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">密码</label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {searchParams.error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {searchParams.error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              登录
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-600">
            <p className="font-medium mb-1">演示账号</p>
            <p>admin@example.com / admin123</p>
            <p>zhangwei@example.com / pass123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
