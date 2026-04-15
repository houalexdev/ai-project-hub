import type { Metadata } from 'next'
import './globals.css'
import { getSession } from '@/lib/auth/session'
import { logoutAction } from '@/app/login/actions'
import NotificationBell from '@/components/NotificationBell'

export const metadata: Metadata = {
  title: 'AI 项目管理平台',
  description: '智能会议管理与任务闭环系统',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 font-sans antialiased">
        {session && (
          <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
              {/* Logo */}
              <a href="/projects" className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-800 tracking-tight">AI 项目管理</span>
              </a>

              {/* 导航 */}
              <nav className="hidden md:flex items-center gap-1">
                <a href="/projects" className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition">项目列表</a>
                {session.role === 'admin' && (
                  <a href="/admin" className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition">系统管理</a>
                )}
              </nav>

              {/* 右侧：AI状态 + 通知 + 用户 */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                  <span>AI 已就绪</span>
                </div>

                {/* 通知铃铛 */}
                <NotificationBell userId={session.id} />

                {/* 用户菜单 */}
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {session.avatar ?? session.name[0]}
                  </div>
                  <span className="hidden sm:block text-sm text-slate-700">{session.name}</span>
                  <span className="hidden sm:block rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    {{ admin: '管理员', pm: 'PM', lead: '主管', member: '成员' }[session.role] ?? session.role}
                  </span>
                </div>

                {/* 退出 */}
                <form action={logoutAction}>
                  <button className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                    退出
                  </button>
                </form>
              </div>
            </div>
          </header>
        )}

        <main className={`mx-auto max-w-7xl px-6 py-8 ${!session ? '' : ''}`}>
          {children}
        </main>
      </body>
    </html>
  )
}
