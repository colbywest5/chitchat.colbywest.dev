'use client'

import { useState, useRef, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'
import { Badge, Button, Spinner } from '@/components/ui'
import { AgentRun, RunLog, RunStatus } from '@/lib/types'

interface LiveRunsPanelProps {
  runs: AgentRun[]
  onRunSelect?: (run: AgentRun) => void
  selectedRunId?: string
  logs?: RunLog[]
  isLoadingLogs?: boolean
}

export function LiveRunsPanel({
  runs,
  onRunSelect,
  selectedRunId,
  logs = [],
  isLoadingLogs,
}: LiveRunsPanelProps) {
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const handleScroll = () => {
    if (!logContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setAutoScroll(isAtBottom)
  }

  const selectedRun = runs.find((r) => r.id === selectedRunId)
  const activeRuns = runs.filter((r) => r.status === 'started' || r.status === 'streaming')

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-gray-200">Agent Runs</h2>
          {activeRuns.length > 0 && (
            <Badge variant="info" size="sm" dot>
              {activeRuns.length} active
            </Badge>
          )}
        </div>
      </div>

      {/* Run selector */}
      <div className="border-b border-gray-800 overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          {runs.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">No runs yet</div>
          ) : (
            runs.slice(0, 10).map((run) => (
              <RunTab
                key={run.id}
                run={run}
                isSelected={selectedRunId === run.id}
                onClick={() => onRunSelect?.(run)}
              />
            ))
          )}
        </div>
      </div>

      {/* Log console */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedRun ? (
          <>
            {/* Run info bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-gray-800">
              <div className="flex items-center gap-3 text-xs">
                <StatusBadge status={selectedRun.status} />
                <span className="text-gray-500">
                  Started {formatDistanceToNow(new Date(selectedRun.started_at), { addSuffix: true })}
                </span>
                {selectedRun.finished_at && (
                  <span className="text-gray-500">
                    Duration: {formatDuration(selectedRun.started_at, selectedRun.finished_at)}
                  </span>
                )}
              </div>
              <button
                onClick={() => setAutoScroll(true)}
                className={clsx(
                  'p-1.5 rounded-md text-gray-400 hover:text-gray-200 transition-colors',
                  autoScroll && 'text-accent-400'
                )}
                title="Auto-scroll"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>

            {/* Logs */}
            <div
              ref={logContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-gray-950"
            >
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="sm" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-gray-600">Waiting for output...</div>
              ) : (
                logs.map((log, index) => (
                  <LogLine key={log.id || index} log={log} />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
            Select a run to view logs
          </div>
        )}
      </div>
    </div>
  )
}

interface RunTabProps {
  run: AgentRun
  isSelected: boolean
  onClick: () => void
}

function RunTab({ run, isSelected, onClick }: RunTabProps) {
  const isActive = run.status === 'started' || run.status === 'streaming'

  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium',
        'transition-colors duration-100',
        isSelected
          ? 'bg-gray-800 text-gray-100'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
      )}
    >
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
      )}
      <span className="truncate max-w-[100px]">
        {run.task_id ? `Task ${run.task_id.slice(0, 6)}` : 'Maintenance'}
      </span>
    </button>
  )
}

interface LogLineProps {
  log: RunLog
}

function LogLine({ log }: LogLineProps) {
  const streamStyles = {
    stdout: 'text-gray-300',
    stderr: 'text-error-400',
    system: 'text-accent-400',
  }

  return (
    <div className={clsx('leading-relaxed whitespace-pre-wrap', streamStyles[log.stream])}>
      {log.message}
    </div>
  )
}

function StatusBadge({ status }: { status: RunStatus }) {
  const config = {
    started: { variant: 'info' as const, label: 'Running' },
    streaming: { variant: 'info' as const, label: 'Streaming' },
    completed: { variant: 'success' as const, label: 'Completed' },
    failed: { variant: 'error' as const, label: 'Failed' },
    timed_out: { variant: 'warning' as const, label: 'Timed Out' },
    canceled: { variant: 'default' as const, label: 'Canceled' },
  }

  const { variant, label } = config[status] || config.completed

  return (
    <Badge variant={variant} size="sm" dot>
      {label}
    </Badge>
  )
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}
