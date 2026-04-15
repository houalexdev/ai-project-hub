'use client'
// 会议纪要上传与 AI 解析组件（重构版）
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { parseMinutesAction, confirmTodosAction } from '@/app/meetings/[id]/actions'
import type { ParsedTodoItem } from '@/agents/summary-agent'

interface User { id: string; name: string; avatar?: string | null }

interface Props {
  meetingId: string
  projectId: string
  members: User[]
}

type EditableItem = ParsedTodoItem & { assigneeId?: string }

const PRIORITY_OPTIONS = [
  { value: 'high',   label: '高优先级', badge: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'medium', label: '中优先级', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'low',    label: '低优先级', badge: 'bg-sky-100 text-sky-700 border-sky-200' },
]

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-400',
  low: 'bg-sky-400',
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'xs' }) {
  const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-rose-500','bg-amber-500','bg-cyan-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  const cls = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-5 w-5 text-[10px]'
  return (
    <span className={`${cls} ${color} inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0`}>
      {name[0]}
    </span>
  )
}

export default function MinutesUploader({ meetingId, projectId, members }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<{ name: string; size: string } | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [items, setItems] = useState<EditableItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function processFile(f: File) {
    if (!f.name.endsWith('.txt') && !f.name.endsWith('.md')) {
      setParseError('请上传 .txt 或 .md 格式的文件')
      return
    }
    const sizeKb = (f.size / 1024).toFixed(1)
    setFile({ name: f.name, size: `${sizeKb} KB` })
    setItems([])
    setParseError(null)
    setParsing(true)
    try {
      const text = await f.text()
      const result = await parseMinutesAction(meetingId, text)
      if (result.error && result.items.length === 0) {
        setParseError(result.error)
      } else {
        if (result.error) setParseError(result.error)
        setItems(result.items.map(item => ({
          ...item,
          assigneeId: members.find(m => m.name === item.assigneeName)?.id,
        })))
      }
    } catch {
      setParseError('解析失败，请重试')
    } finally {
      setParsing(false)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) processFile(f)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }, [meetingId])

  function updateItem(idx: number, field: keyof EditableItem, value: string) {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      if (field === 'assigneeId') {
        const member = members.find(m => m.id === value)
        return { ...item, assigneeId: value, assigneeName: member?.name ?? '待分配', memberMatched: !!member }
      }
      return { ...item, [field]: value }
    }))
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function addItem() {
    setItems(prev => [...prev, {
      title: '',
      assigneeName: '待分配',
      dueDate: null,
      priority: 'medium',
      memberMatched: false,
    }])
  }

  // ✅ 修复：使用对象参数调用，与 actions.ts 签名完全匹配
  async function handleConfirm() {
    const valid = items.filter(item => item.title.trim())
    if (valid.length === 0) return
    setSubmitting(true)
    try {
      await confirmTodosAction({
        meetingId,
        projectId,
        items: valid.map(item => ({
          title: item.title,
          assigneeName: item.assigneeName,
          assigneeId: item.assigneeId,
          dueDate: item.dueDate ?? undefined,
          priority: item.priority,
        })),
      })
      setSubmitted(true)
      setTimeout(() => router.push(`/projects/${projectId}`), 1800)
    } finally {
      setSubmitting(false)
    }
  }

  // ── 成功状态
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 py-14">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200">
          <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-emerald-800">任务已成功下发！</p>
          <p className="mt-1 text-sm text-emerald-500">正在跳转到项目看板...</p>
        </div>
      </div>
    )
  }

  const validCount = items.filter(i => i.title.trim()).length
  const unmatchedCount = items.filter(i => !i.memberMatched).length

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* 头部 */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/40 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-200">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">会议纪要 AI 解析</h2>
            <p className="text-xs text-slate-400">上传纪要文件，自动提取待办任务并分配给成员</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 上传区 */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !parsing && inputRef.current?.click()}
          className={[
            'relative mb-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-all duration-200',
            dragging
              ? 'border-blue-400 bg-blue-50 scale-[1.01]'
              : 'border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/50',
            parsing ? 'cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
        >
          <input ref={inputRef} type="file" accept=".txt,.md" onChange={handleFileInput} className="hidden" />

          {parsing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-2 border-blue-100" />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-blue-700">AI 正在解析纪要...</p>
                <p className="mt-0.5 text-xs text-slate-400">正在提取待办事项与负责人</p>
              </div>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700">{file.name}</p>
              <p className="text-xs text-slate-400">{file.size} · 点击重新上传</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600">拖拽文件到此处，或点击上传</p>
              <p className="text-xs text-slate-400">支持 .txt、.md 格式的会议纪要</p>
            </div>
          )}
        </div>

        {/* 错误 / 警告提示 */}
        {parseError && (
          <div className={`mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${
            items.length > 0
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span>{parseError}{items.length > 0 ? ' · 以下为部分解析结果，请检查后确认。' : ''}</span>
          </div>
        )}

        {/* 解析结果 */}
        {items.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">解析结果</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {items.length} 条待办
                </span>
                {unmatchedCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                    {unmatchedCount} 人未匹配
                  </span>
                )}
              </div>
              <button
                onClick={addItem}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                </svg>
                手动添加
              </button>
            </div>

            {/* 任务卡片列表 */}
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={`group relative flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ${
                    !item.memberMatched
                      ? 'border-red-200 bg-red-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[item.priority] ?? 'bg-slate-400'}`} />

                  <div className="flex-1 min-w-0">
                    <input
                      value={item.title}
                      onChange={e => updateItem(idx, 'title', e.target.value)}
                      placeholder="输入任务标题..."
                      className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-300 focus:text-slate-900"
                    />

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* 负责人 */}
                      <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 ${
                        !item.memberMatched ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                      }`}>
                        {item.assigneeId
                          ? <Avatar name={members.find(m => m.id === item.assigneeId)?.name ?? item.assigneeName} size="xs" />
                          : <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                        }
                        <select
                          value={item.assigneeId ?? ''}
                          onChange={e => updateItem(idx, 'assigneeId', e.target.value)}
                          className={`cursor-pointer bg-transparent text-xs outline-none ${
                            !item.memberMatched ? 'text-red-700 font-medium' : 'text-slate-600'
                          }`}
                        >
                          <option value="">待分配</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* 截止日期 */}
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <input
                          type="date"
                          value={item.dueDate ?? ''}
                          onChange={e => updateItem(idx, 'dueDate', e.target.value)}
                          className="cursor-pointer bg-transparent text-xs text-slate-600 outline-none"
                        />
                      </div>

                      {/* 优先级 */}
                      <select
                        value={item.priority}
                        onChange={e => updateItem(idx, 'priority', e.target.value)}
                        className={`cursor-pointer rounded-lg border px-2 py-1 text-xs outline-none ${
                          PRIORITY_OPTIONS.find(p => p.value === item.priority)?.badge ?? 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {PRIORITY_OPTIONS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    {!item.memberMatched && item.assigneeName !== '待分配' && (
                      <p className="mt-1.5 text-[11px] text-red-500">
                        「{item.assigneeName}」未在项目成员中找到，请手动指定
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => removeItem(idx)}
                    className="mt-0.5 shrink-0 rounded-lg p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-400"
                    title="删除此任务"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* 确认下发区 */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-400">
                {validCount > 0
                  ? `确认后将向项目看板下发 ${validCount} 条任务`
                  : '请填写至少一条任务标题'}
              </p>
              <button
                onClick={handleConfirm}
                disabled={submitting || validCount === 0}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting
                  ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> 下发中...</>
                  : <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                      确认下发
                    </>
                }
              </button>
            </div>
          </div>
        )}

        {!parsing && !file && !parseError && (
          <p className="text-center text-xs text-slate-400">
            支持解析如「张伟需在下周五前完成技术方案修订，李娜整理测试报告并于12月20日前提交」等格式
          </p>
        )}
      </div>
    </div>
  )
}
