'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { clsx } from 'clsx'
import { Badge, Button } from '@/components/ui'
import { Task, TaskStatus } from '@/lib/types'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'queued', label: 'Queued', color: 'text-gray-400' },
  { id: 'in_progress', label: 'In Progress', color: 'text-accent-400' },
  { id: 'needs_review', label: 'Needs Review', color: 'text-warning-500' },
  { id: 'done', label: 'Done', color: 'text-success-500' },
]

interface KanbanBoardProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void
  onCreateTask?: () => void
}

export function KanbanBoard({
  tasks,
  onTaskClick,
  onTaskStatusChange,
  onCreateTask,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      queued: [],
      in_progress: [],
      blocked: [],
      needs_review: [],
      done: [],
      failed: [],
      canceled: [],
    }
    tasks.forEach((task) => {
      grouped[task.status]?.push(task)
    })
    return grouped
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Check if dropped on a column
    const targetColumn = COLUMNS.find((col) => col.id === overId)
    if (targetColumn) {
      const task = tasks.find((t) => t.id === taskId)
      if (task && task.status !== targetColumn.id) {
        onTaskStatusChange?.(taskId, targetColumn.id)
      }
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-medium text-gray-200">Tasks</h2>
        <Button size="xs" variant="ghost" onClick={onCreateTask}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      </div>

      {/* Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto p-3">
          <div className="flex gap-3 h-full min-w-max">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                label={column.label}
                color={column.color}
                tasks={tasksByStatus[column.id] || []}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <TaskCard task={activeTask} isDragging />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

interface KanbanColumnProps {
  id: TaskStatus
  label: string
  color: string
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

function KanbanColumn({ id, label, color, tasks, onTaskClick }: KanbanColumnProps) {
  return (
    <div className="w-64 flex flex-col bg-gray-900/50 rounded-lg border border-gray-800">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
        <span className={clsx('text-sm font-medium', color)}>{label}</span>
        <Badge variant="default" size="sm">
          {tasks.length}
        </Badge>
      </div>

      {/* Task list */}
      <SortableContext
        id={id}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-600">
              No tasks
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

interface SortableTaskCardProps {
  task: Task
  onClick?: () => void
}

function SortableTaskCard({ task, onClick }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} isDragging={isDragging} onClick={onClick} />
    </div>
  )
}

interface TaskCardProps {
  task: Task
  isDragging?: boolean
  onClick?: () => void
}

function TaskCard({ task, isDragging, onClick }: TaskCardProps) {
  const priorityColors = {
    1: 'bg-gray-700',
    2: 'bg-gray-600',
    3: 'bg-accent-500',
    4: 'bg-warning-500',
    5: 'bg-error-500',
  }

  const typeLabels: Record<string, string> = {
    code_change: 'Code',
    test: 'Test',
    review: 'Review',
    doc: 'Docs',
    research: 'Research',
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-3 bg-gray-850 border border-gray-800 rounded-lg cursor-pointer',
        'transition-all duration-100',
        'hover:border-gray-700 hover:bg-gray-800',
        isDragging && 'opacity-50 shadow-xl ring-2 ring-accent-500'
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <div
          className={clsx(
            'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
            priorityColors[task.priority as keyof typeof priorityColors] || priorityColors[3]
          )}
        />
        <h4 className="text-sm font-medium text-gray-200 leading-tight line-clamp-2">
          {task.title}
        </h4>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" size="sm">
          {typeLabels[task.type] || task.type}
        </Badge>
      </div>
    </div>
  )
}
