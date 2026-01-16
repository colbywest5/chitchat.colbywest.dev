'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  WebSocketManager,
  ConnectionStatus,
  getWebSocketManager,
  initWebSocket,
} from '@/lib/websocket'
import { useAuthStore } from '@/stores/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function useWebSocket() {
  const token = useAuthStore((s) => s.token)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const managerRef = useRef<WebSocketManager | null>(null)

  useEffect(() => {
    if (!token) return

    // Initialize WebSocket connection
    const manager = initWebSocket(API_URL, token)
    managerRef.current = manager

    // Subscribe to status changes
    const unsubscribe = manager.onStatusChange(setStatus)

    // Connect
    manager.connect()

    return () => {
      unsubscribe()
      manager.disconnect()
    }
  }, [token])

  const send = useCallback((type: string, payload: any) => {
    managerRef.current?.send(type, payload)
  }, [])

  const subscribe = useCallback((type: string, handler: (data: any) => void) => {
    return managerRef.current?.onMessage(type, handler) || (() => {})
  }, [])

  return {
    status,
    isConnected: status === 'connected',
    send,
    subscribe,
  }
}

// Hook for subscribing to specific message types
export function useWebSocketMessage<T = any>(
  type: string,
  handler: (data: T) => void
) {
  const { subscribe } = useWebSocket()

  useEffect(() => {
    return subscribe(type, handler)
  }, [type, handler, subscribe])
}

// Hook for real-time run logs
export function useRunLogs(projectId: string, runId: string | null) {
  const [logs, setLogs] = useState<any[]>([])
  const { subscribe, isConnected, send } = useWebSocket()

  useEffect(() => {
    if (!runId || !isConnected) return

    // Subscribe to log updates
    const unsubscribe = subscribe('run_log', (data) => {
      if (data.run_id === runId) {
        setLogs((prev) => [...prev, data.log])
      }
    })

    // Subscribe to this run's logs
    send('subscribe_run', { project_id: projectId, run_id: runId })

    return () => {
      unsubscribe()
      send('unsubscribe_run', { run_id: runId })
    }
  }, [runId, projectId, isConnected, subscribe, send])

  return logs
}

// Hook for real-time task updates
export function useTaskUpdates(projectId: string) {
  const { subscribe, send, isConnected } = useWebSocket()

  useEffect(() => {
    if (!isConnected) return

    // Subscribe to project task updates
    send('subscribe_project', { project_id: projectId })

    return () => {
      send('unsubscribe_project', { project_id: projectId })
    }
  }, [projectId, isConnected, send])

  const onTaskUpdate = useCallback(
    (handler: (data: any) => void) => {
      return subscribe('task_update', (data) => {
        if (data.project_id === projectId) {
          handler(data)
        }
      })
    },
    [subscribe, projectId]
  )

  return { onTaskUpdate }
}
