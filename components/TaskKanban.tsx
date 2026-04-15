'use client'
import { useState, useCallback } from 'react'
import {
  DndContext, DragEndEvent, DragOverEvent, PointerSensor,
  useSensor, useSensors, closestCorners, DragOverlay, DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { updateTaskStatusAction, deleteTaskAction } from '@/app/projects/[id]/actions'

interface User { id: string; name: string; avatar?: string | null }
interface Task {
  id: string; title: string; status: string; priority: string
  dueDate?: Date | null; assignee?: User | null
  isMeetingRelated: boolean; meetingId?: string | null
}

const COLUMNS = [
  { id: 'todo',        label: '待办',   color: 'text-slate-600',   bg: 'bg-slate-50',   count_bg: 'bg-slate-200' },
  { id: 'in_progress', label: '进行中', color: 'text-blue-600',    bg: 'bg-blue-50',    count_bg: 'bg-blue-200' },
  { id: 'done',        label: '已完成', color: 'text-emerald-600', bg: 'bg-emerald-50', count_bg: 'bg-emerald-200' },
]

const PRIORITY_STYLE: Record<string, { bar: string; badge: string; label: string }> = {
  high:   { bar: 'border-l-red-400',   badge: 'bg-red-50 text-red-600',    label: '高' },
  medium: { bar: 'border-l-amber-400', badge: 'bg-amber-50 text-amber-600', label: '中' },
  low:    { bar: 'border-l-blue-300',  badge: 'bg-blue-50 text-blue-500',   label: '低' },
}

function TaskCard({ task, isDragging = false, canEdit, onDelete }: {
  task: Task; isDragging?: boolean; canEdit: boolean; onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const p = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.medium
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`group cursor-grab rounded-xl border-l-4 bg-white px-4 py-3 shadow-sm transition select-none
        ${p.bar} ${isDragging ? 'opacity-40' : 'hover:shadow-md active:cursor-grabbing'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-slate-800 line-clamp-2">{task.title}</p>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${p.badge}`}>{p.label}</span>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
              className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-slate-300 hover:bg-red-50 hover:text-red-400 transition"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {task.assignee ? (
            <>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700">
                {task.assignee.avatar ?? task.assignee.name[0]}
              </div>
              <span className="text-[11px] text-slate-400">{task.assignee.name}</span>
            </>
          ) : (
            <span className="text-[11px] text-slate-300">未分配</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {task.isMeetingRelated && (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${task.meetingId ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {task.meetingId ? '已排会' : '待排会'}
            </span>
          )}
          {task.dueDate && (
            <span className={`text-[10px] ${isOverdue ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
              {isOverdue ? '⚠ ' : ''}{new Date(task.dueDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TaskKanban({ tasks: initialTasks, projectId, members, canEdit }: {
  tasks: Task[]; projectId: string; members: User[]; canEdit: boolean
}) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const activeTask = tasks.find(t => t.id === activeId)

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string)
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over) return
    const overId = over.id as string
    const overCol = COLUMNS.find(c => c.id === overId)
    if (!overCol) return
    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask || activeTask.status === overCol.id) return
    setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: overCol.id } : t))
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const overId = over.id as string
    const overCol = COLUMNS.find(c => c.id === overId)
    if (!overCol) return
    const task = tasks.find(t => t.id === active.id)
    if (task && task.status !== overCol.id) {
      await updateTaskStatusAction(task.id, overCol.id, projectId)
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm('确认删除此任务？')) return
    setTasks(prev => prev.filter(t => t.id !== taskId))
    await deleteTaskAction(taskId, projectId)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <div key={col.id} className={`rounded-xl ${col.bg} p-3`}>
              <div className="mb-3 flex items-center gap-2">
                <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${col.count_bg} text-slate-600`}>
                  {colTasks.length}
                </span>
              </div>
              <SortableContext id={col.id} items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="min-h-[120px] space-y-2.5">
                  {colTasks.map(task => (
                    <TaskCard key={task.id} task={task} canEdit={canEdit} onDelete={handleDelete} />
                  ))}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging canEdit={false} onDelete={() => {}} />}
      </DragOverlay>
    </DndContext>
  )
}
