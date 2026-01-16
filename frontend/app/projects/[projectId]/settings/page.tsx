'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { AuthGate } from '@/components/auth/AuthGate'
import { Button, Input, Textarea, Switch, Card, Spinner, Badge } from '@/components/ui'
import { useProjectsStore } from '@/stores/projectsStore'
import { useAuthStore } from '@/stores/authStore'
import { projectsApi, agentsApi } from '@/lib/api'

interface Agent {
  id: string
  name: string
  type: string
  enabled: boolean
  config: Record<string, any>
}

// Mock agents data
const mockAgents: Agent[] = [
  { id: '1', name: 'Code Writer', type: 'code_writer', enabled: true, config: { model: 'gpt-4', temperature: 0.7 } },
  { id: '2', name: 'Test Runner', type: 'test_runner', enabled: true, config: { parallel: true, coverage: true } },
  { id: '3', name: 'Code Reviewer', type: 'reviewer', enabled: true, config: { strict: false } },
  { id: '4', name: 'Documentation', type: 'doc_generator', enabled: false, config: { format: 'markdown' } },
]

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const token = useAuthStore((s) => s.token)
  const { currentProject, fetchProject } = useProjectsStore()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])

  // Project settings
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [repoUrl, setRepoUrl] = useState('')

  // Notification settings
  const [notifyOnComplete, setNotifyOnComplete] = useState(true)
  const [notifyOnError, setNotifyOnError] = useState(true)
  const [notifyOnReview, setNotifyOnReview] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
    }
  }, [projectId, fetchProject])

  useEffect(() => {
    if (currentProject) {
      setName(currentProject.name)
      setDescription(currentProject.description || '')
      setRepoUrl(currentProject.default_repo_path || '')
    }
  }, [currentProject])

  useEffect(() => {
    const fetchAgents = async () => {
      if (!token) return
      setIsLoading(true)
      try {
        // In production, this would fetch real data
        // const data = await agentsApi.list(projectId, token)
        // setAgents(data)

        await new Promise((resolve) => setTimeout(resolve, 300))
        setAgents(mockAgents)
      } catch (error) {
        console.error('Failed to fetch agents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [projectId, token])

  const handleSave = async () => {
    if (!token) return
    setIsSaving(true)
    try {
      await projectsApi.update(
        projectId,
        { name, description, default_repo_path: repoUrl },
        token
      )
      fetchProject(projectId)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAgentToggle = async (agentId: string, enabled: boolean) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, enabled } : agent
      )
    )
    // In production, this would call the API
    // await agentsApi.update(projectId, agentId, { enabled }, token)
  }

  const handleDeleteProject = async () => {
    if (!token) return
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }
    try {
      await projectsApi.delete(projectId, token)
      router.push('/projects')
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const breadcrumbs = [
    { label: 'Projects', href: '/projects' },
    { label: currentProject?.name || 'Loading...', href: `/projects/${projectId}` },
    { label: 'Settings' },
  ]

  if (isLoading) {
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
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="p-6 max-w-3xl mx-auto space-y-8">
          {/* General settings */}
          <section>
            <h2 className="text-lg font-medium text-gray-200 mb-4">General</h2>
            <Card>
              <div className="space-y-4">
                <Input
                  label="Project Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Project"
                />
                <Textarea
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your project..."
                  rows={3}
                />
                <Input
                  label="Repository URL"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                />
              </div>
            </Card>
          </section>

          {/* Agent configuration */}
          <section>
            <h2 className="text-lg font-medium text-gray-200 mb-4">Agents</h2>
            <Card>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0 last:pb-0 first:pt-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                        <AgentIcon type={agent.type} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-200">
                          {agent.name}
                        </div>
                        <div className="text-xs text-gray-500">{agent.type}</div>
                      </div>
                    </div>
                    <Switch
                      checked={agent.enabled}
                      onChange={(checked) => handleAgentToggle(agent.id, checked)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* Notifications */}
          <section>
            <h2 className="text-lg font-medium text-gray-200 mb-4">Notifications</h2>
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium text-gray-200">
                      Task Completed
                    </div>
                    <div className="text-xs text-gray-500">
                      Get notified when tasks are completed
                    </div>
                  </div>
                  <Switch
                    checked={notifyOnComplete}
                    onChange={setNotifyOnComplete}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-800">
                  <div>
                    <div className="text-sm font-medium text-gray-200">
                      Errors
                    </div>
                    <div className="text-xs text-gray-500">
                      Get notified when runs fail
                    </div>
                  </div>
                  <Switch
                    checked={notifyOnError}
                    onChange={setNotifyOnError}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-800">
                  <div>
                    <div className="text-sm font-medium text-gray-200">
                      Review Required
                    </div>
                    <div className="text-xs text-gray-500">
                      Get notified when tasks need review
                    </div>
                  </div>
                  <Switch
                    checked={notifyOnReview}
                    onChange={setNotifyOnReview}
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* Save button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Danger zone */}
          <section>
            <h2 className="text-lg font-medium text-error-400 mb-4">Danger Zone</h2>
            <Card className="border-error-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-200">
                    Delete Project
                  </div>
                  <div className="text-xs text-gray-500">
                    Permanently delete this project and all its data
                  </div>
                </div>
                <Button variant="ghost" onClick={handleDeleteProject} className="text-error-400 hover:text-error-300 hover:bg-error-500/10">
                  Delete Project
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </AppLayout>
    </AuthGate>
  )
}

function AgentIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    code_writer: (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    test_runner: (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    reviewer: (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    doc_generator: (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  }

  return icons[type] || icons.code_writer
}
