'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'
import { clsx } from 'clsx'
import { AppLayout } from '@/components/layout'
import { AuthGate } from '@/components/auth/AuthGate'
import { Button, Spinner, Badge, EmptyState, Card } from '@/components/ui'
import { useProjectsStore } from '@/stores/projectsStore'
import { useAuthStore } from '@/stores/authStore'
import { recordingsApi } from '@/lib/api'

interface Recording {
  id: string
  name: string
  duration: number
  size: number
  created_at: string
  transcript?: string
  status: 'processing' | 'ready' | 'failed'
}

// Mock data for demonstration
const mockRecordings: Recording[] = [
  {
    id: '1',
    name: 'Planning session - Feature roadmap',
    duration: 1842,
    size: 4500000,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'ready',
    transcript: 'Discussed the upcoming features for Q2...',
  },
  {
    id: '2',
    name: 'Bug triage meeting',
    duration: 923,
    size: 2200000,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'ready',
    transcript: 'Reviewed critical bugs reported this week...',
  },
  {
    id: '3',
    name: 'Architecture review',
    duration: 2456,
    size: 6100000,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'processing',
  },
]

export default function RecordingsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const token = useAuthStore((s) => s.token)
  const { currentProject, fetchProject } = useProjectsStore()

  const [recordings, setRecordings] = useState<Recording[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
    }
  }, [projectId, fetchProject])

  useEffect(() => {
    const fetchRecordings = async () => {
      if (!token) return
      setIsLoading(true)
      try {
        // In production, this would fetch real data
        // const data = await recordingsApi.list(projectId, token)
        // setRecordings(data)

        // For now, use mock data
        await new Promise((resolve) => setTimeout(resolve, 300))
        setRecordings(mockRecordings)
      } catch (error) {
        console.error('Failed to fetch recordings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecordings()
  }, [projectId, token])

  const breadcrumbs = [
    { label: 'Projects', href: '/projects' },
    { label: currentProject?.name || 'Loading...', href: `/projects/${projectId}` },
    { label: 'Recordings' },
  ]

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

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
      <AppLayout
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            size="sm"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            }
          >
            Upload Recording
          </Button>
        }
      >
        <div className="p-6 max-w-5xl mx-auto">
          {recordings.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              }
              title="No recordings yet"
              description="Upload voice recordings to let agents analyze and act on your instructions."
              action={
                <Button>Upload Recording</Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {recordings.map((recording) => (
                <RecordingCard
                  key={recording.id}
                  recording={recording}
                  isSelected={selectedRecording?.id === recording.id}
                  onSelect={() => setSelectedRecording(
                    selectedRecording?.id === recording.id ? null : recording
                  )}
                  formatDuration={formatDuration}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    </AuthGate>
  )
}

interface RecordingCardProps {
  recording: Recording
  isSelected: boolean
  onSelect: () => void
  formatDuration: (seconds: number) => string
  formatFileSize: (bytes: number) => string
}

function RecordingCard({
  recording,
  isSelected,
  onSelect,
  formatDuration,
  formatFileSize,
}: RecordingCardProps) {
  const statusConfig = {
    processing: { variant: 'warning' as const, label: 'Processing' },
    ready: { variant: 'success' as const, label: 'Ready' },
    failed: { variant: 'error' as const, label: 'Failed' },
  }

  const { variant, label } = statusConfig[recording.status]

  return (
    <Card
      className={clsx(
        'cursor-pointer transition-all',
        isSelected && 'ring-1 ring-accent-500'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-200">{recording.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>{formatDuration(recording.duration)}</span>
              <span>•</span>
              <span>{formatFileSize(recording.size)}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <Badge variant={variant} size="sm">
          {label}
        </Badge>
      </div>

      {isSelected && recording.transcript && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Transcript Preview
          </div>
          <p className="text-sm text-gray-400 line-clamp-3">
            {recording.transcript}
          </p>
          <div className="flex items-center gap-2 mt-4">
            <Button variant="secondary" size="sm">
              View Full Transcript
            </Button>
            <Button variant="ghost" size="sm">
              Download
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
