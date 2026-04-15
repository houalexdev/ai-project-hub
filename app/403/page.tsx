export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">无权访问</h1>
      <p className="text-slate-500 mb-6">你没有权限查看此页面，请联系系统管理员。</p>
      <a href="/projects" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">
        返回项目列表
      </a>
    </div>
  )
}
