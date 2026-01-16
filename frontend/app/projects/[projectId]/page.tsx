'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { AuthGate } from '@/components/auth/AuthGate'
import {
  KanbanBoard,
  LiveRunsPanel,
  ChatPanel,
  OrchestratorControls,
} from '@/components/dashboard'
import { Spinner } from '@/components/ui'
import { useProjectsStore } from '@/stores/projectsStore'
import { useAuthStore } from '@/stores/authStore'
import { Task, TaskStatus, AgentRun, RunLog, Message } from '@/lib/types'
import { tasksApi, runsApi, conversationsApi } from '@/lib/api'

export default function ProjectDashboardPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const token = useAuthStore((s) => s.token)

  const { currentProject, fetchProject, tasks, runs, fetchTasks, fetchRuns } =
    useProjectsStore()

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [runLogs, setRunLogs] = useState<RunLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
      fetchTasks(projectId)
      fetchRuns(projectId)
    }
  }, [projectId, fetchProject, fetchTasks, fetchRuns])

  // Fetch logs when a run is selected
  useEffect(() => {
    if (!selectedRunId || !token) return

    const fetchLogs = async () => {
      setIsLoadingLogs(true)
      try {
        const logs = await runsApi.logs(projectId, selectedRunId, token)
        setRunLogs(logs)
      } catch (error) {
        console.error('Failed to fetch logs:', error)
      } finally {
        setIsLoadingLogs(false)
      }
    }

    fetchLogs()
  }, [selectedRunId, projectId, token])

  // Auto-select first run if none selected
  useEffect(() => {
    if (runs.length > 0 && !selectedRunId) {
      setSelectedRunId(runs[0].id)
    }
  }, [runs, selectedRunId])

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!token) return
    try {
      await tasksApi.update(projectId, taskId, { status: newStatus }, token)
      fetchTasks(projectId)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleCreateTask = async (data: {
    title: string
    description: string
    type: string
    priority: number
  }) => {
    if (!token) return
    try {
      await tasksApi.create(
        projectId,
        {
          title: data.title,
          description: data.description,
          type: data.type as any,
          priority: data.priority,
        },
        token
      )
      fetchTasks(projectId)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!token) return
    setIsSendingMessage(true)

    try {
      let convId = conversationId

      // Create conversation if needed
      if (!convId) {
        const conversation = await conversationsApi.create(projectId, token)
        convId = conversation.id
        setConversationId(convId)
      }

      // Send message
      const message = await conversationsApi.sendMessage(
        projectId,
        convId,
        content,
        token
      )
      setMessages((prev) => [...prev, message])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSendingMessage(false)
    }
  }

  const breadcrumbs = [
    { label: 'Projects', href: '/projects' },
    { label: currentProject?.name || 'Loading...' },
  ]

  if (!currentProject) {
    return (
      <AuthGate>
        <AppLayout breadcrumbs={breadcrumbs}>
          <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
            <Spinner size="lg" />
          </div>
        </AppLayout>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <AppLayout
        breadcrumbs={breadcrumbs}
        actions={
          <OrchestratorControls
            projectName={currentProject.name}
            onCreateTask={handleCreateTask}
          />
        }
        fullWidth
      >
        {/* Responsive command center layout */}
        {/* Desktop: Three-panel horizontal layout */}
        {/* Tablet: Two panels stacked */}
        {/* Mobile: Tab-based single panel */}
        <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row">
          {/* Left panel: Kanban - Full width on mobile, fixed width on desktop */}
          <div className="h-1/2 lg:h-full lg:w-[400px] lg:min-w-[320px] border-b lg:border-b-0 lg:border-r border-gray-800 bg-gray-900/30 overflow-hidden">
            <KanbanBoard
              tasks={tasks}
              onTaskStatusChange={handleTaskStatusChange}
              onCreateTask={() => {}}
            />
          </div>

          {/* Center and Right panels container */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 lg:min-w-0">
            {/* Center panel: Live runs / logs */}
            <div className="flex-1 min-h-0 md:min-w-0 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900/30">
              <LiveRunsPanel
                runs={runs}
                selectedRunId={selectedRunId || undefined}
                onRunSelect={(run) => setSelectedRunId(run.id)}
                logs={runLogs}
                isLoadingLogs={isLoadingLogs}
              />
            </div>

            {/* Right panel: Chat - Hidden on mobile, shown on tablet/desktop */}
            <div className="hidden md:flex md:w-[320px] lg:w-[380px] lg:min-w-[300px] bg-gray-900/30">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isSendingMessage}
              />
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGate>
  )
}
