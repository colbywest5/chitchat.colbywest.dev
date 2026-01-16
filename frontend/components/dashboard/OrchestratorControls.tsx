'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { Button, Badge, Modal, ModalFooter, Input, Select, Textarea } from '@/components/ui'
import { TaskType } from '@/lib/types'

interface OrchestratorControlsProps {
  projectName?: string
  stateVersion?: number
  isOrchestratorRunning?: boolean
  onRunOrchestrator?: () => void
  onCreateTask?: (data: { title: string; description: string; type: TaskType; priority: number }) => void
}

export function OrchestratorControls({
  projectName,
  stateVersion = 1,
  isOrchestratorRunning,
  onRunOrchestrator,
  onCreateTask,
}: OrchestratorControlsProps) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)

  return (
    <div className="flex items-center gap-3">
      {/* State version badge */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg">
        <span className="text-xs text-gray-500">State</span>
        <Badge variant="default" size="sm">v{stateVersion}</Badge>
      </div>

      {/* Run orchestrator button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onRunOrchestrator}
        disabled={isOrchestratorRunning}
        icon={
          isOrchestratorRunning ? (
            <span className="w-3 h-3 rounded-full bg-success-500 animate-pulse" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      >
        {isOrchestratorRunning ? 'Running...' : 'Run Orchestrator'}
      </Button>

      {/* Create task button */}
      <Button
        size="sm"
        onClick={() => setIsCreateTaskOpen(true)}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
      >
        Create Task
      </Button>

      {/* Create task modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSubmit={(data) => {
          onCreateTask?.(data)
          setIsCreateTaskOpen(false)
        }}
      />
    </div>
  )
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { title: string; description: string; type: TaskType; priority: number }) => void
}

function CreateTaskModal({ isOpen, onClose, onSubmit }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TaskType>('code_change')
  const [priority, setPriority] = useState('3')

  const typeOptions = [
    { label: 'Code Change', value: 'code_change' },
    { label: 'Test', value: 'test' },
    { label: 'Review', value: 'review' },
    { label: 'Documentation', value: 'doc' },
    { label: 'Research', value: 'research' },
  ]

  const priorityOptions = [
    { label: '1 - Low', value: '1' },
    { label: '2 - Normal', value: '2' },
    { label: '3 - Medium', value: '3' },
    { label: '4 - High', value: '4' },
    { label: '5 - Critical', value: '5' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description,
      type,
      priority: parseInt(priority, 10),
    })
    // Reset form
    setTitle('')
    setDescription('')
    setType('code_change')
    setPriority('3')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Task"
      description="Create a new task for your agents to work on."
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
            autoFocus
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the task in detail..."
            rows={4}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              options={typeOptions}
              value={type}
              onChange={(value) => setType(value as TaskType)}
            />

            <Select
              label="Priority"
              options={priorityOptions}
              value={priority}
              onChange={setPriority}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || !description.trim()}>
            Create Task
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
