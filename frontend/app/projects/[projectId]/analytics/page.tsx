'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { AuthGate } from '@/components/auth/AuthGate'
import { Spinner, Tabs } from '@/components/ui'
import {
  MetricCard,
  TaskThroughputChart,
  AgentPerformanceChart,
  StatusDistribution,
} from '@/components/analytics'
import { useProjectsStore } from '@/stores/projectsStore'
import { useAuthStore } from '@/stores/authStore'
import { analyticsApi } from '@/lib/api'

interface AnalyticsData {
  summary: {
    totalTasks: number
    completedTasks: number
    activeAgents: number
    avgCycleTime: number
    successRate: number
    totalRuns: number
  }
  throughput: {
    date: string
    completed: number
    created: number
    avgCycleTime: number
  }[]
  agentPerformance: {
    name: string
    tasksCompleted: number
    avgDuration: number
    successRate: number
  }[]
  statusDistribution: {
    status: string
    count: number
    color: string
  }[]
  trends: {
    tasks: number[]
    runs: number[]
    successRate: number[]
  }
}

// Mock data for demonstration
const mockAnalytics: AnalyticsData = {
  summary: {
    totalTasks: 247,
    completedTasks: 198,
    activeAgents: 4,
    avgCycleTime: 12.5,
    successRate: 94.2,
    totalRuns: 1842,
  },
  throughput: [
    { date: 'Mon', completed: 12, created: 15, avgCycleTime: 11 },
    { date: 'Tue', completed: 18, created: 14, avgCycleTime: 13 },
    { date: 'Wed', completed: 22, created: 20, avgCycleTime: 10 },
    { date: 'Thu', completed: 16, created: 18, avgCycleTime: 14 },
    { date: 'Fri', completed: 28, created: 25, avgCycleTime: 9 },
    { date: 'Sat', completed: 8, created: 6, avgCycleTime: 12 },
    { date: 'Sun', completed: 5, created: 4, avgCycleTime: 15 },
  ],
  agentPerformance: [
    { name: 'Code Writer', tasksCompleted: 82, avgDuration: 8.2, successRate: 96 },
    { name: 'Test Runner', tasksCompleted: 64, avgDuration: 4.5, successRate: 92 },
    { name: 'Reviewer', tasksCompleted: 45, avgDuration: 12.1, successRate: 88 },
    { name: 'Doc Generator', tasksCompleted: 28, avgDuration: 6.8, successRate: 95 },
  ],
  statusDistribution: [
    { status: 'Completed', count: 198, color: '#22c55e' },
    { status: 'In Progress', count: 24, color: '#3b82f6' },
    { status: 'Queued', count: 18, color: '#6b7280' },
    { status: 'Failed', count: 7, color: '#ef4444' },
  ],
  trends: {
    tasks: [12, 15, 18, 14, 22, 19, 25, 28, 24, 30, 26, 32],
    runs: [45, 52, 48, 61, 58, 72, 68, 75, 82, 78, 85, 92],
    successRate: [91, 93, 92, 94, 93, 95, 94, 96, 95, 94, 95, 94],
  },
}

export default function AnalyticsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const token = useAuthStore((s) => s.token)
  const { currentProject, fetchProject } = useProjectsStore()

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
    }
  }, [projectId, fetchProject])

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!token) return
      setIsLoading(true)
      try {
        // In production, this would fetch real data
        // const data = await analyticsApi.get(projectId, token)
        // setAnalytics(data)

        // For now, use mock data
        await new Promise((resolve) => setTimeout(resolve, 500))
        setAnalytics(mockAnalytics)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [projectId, token, timeRange])

  const breadcrumbs = [
    { label: 'Projects', href: '/projects' },
    { label: currentProject?.name || 'Loading...', href: `/projects/${projectId}` },
    { label: 'Analytics' },
  ]

  const timeRangeTabs = [
    { id: '24h', label: '24h' },
    { id: '7d', label: '7 days' },
    { id: '30d', label: '30 days' },
    { id: '90d', label: '90 days' },
  ]

  if (isLoading || !analytics) {
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
          <Tabs
            tabs={timeRangeTabs}
            activeTab={timeRange}
            onChange={setTimeRange}
            size="sm"
          />
        }
      >
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              label="Total Tasks"
              value={analytics.summary.totalTasks}
              change={12}
              sparklineData={analytics.trends.tasks}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <MetricCard
              label="Completed"
              value={analytics.summary.completedTasks}
              change={18}
              variant="success"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <MetricCard
              label="Active Agents"
              value={analytics.summary.activeAgents}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <MetricCard
              label="Avg Cycle Time"
              value={`${analytics.summary.avgCycleTime}m`}
              change={-8}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <MetricCard
              label="Success Rate"
              value={`${analytics.summary.successRate}%`}
              change={2.1}
              sparklineData={analytics.trends.successRate}
              variant="success"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <MetricCard
              label="Total Runs"
              value={analytics.summary.totalRuns.toLocaleString()}
              change={24}
              sparklineData={analytics.trends.runs}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TaskThroughputChart data={analytics.throughput} />
            </div>
            <StatusDistribution data={analytics.statusDistribution} />
          </div>

          {/* Agent performance */}
          <AgentPerformanceChart data={analytics.agentPerformance} />
        </div>
      </AppLayout>
    </AuthGate>
  )
}
