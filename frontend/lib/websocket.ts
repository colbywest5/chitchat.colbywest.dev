// WebSocket connection manager with auto-reconnect and event handling

type MessageHandler = (data: any) => void
type StatusHandler = (status: ConnectionStatus) => void

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface WebSocketConfig {
  url: string
  token?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onMessage?: MessageHandler
  onStatusChange?: StatusHandler
}

export class WebSocketManager {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map()
  private statusHandlers: Set<StatusHandler> = new Set()
  private status: ConnectionStatus = 'disconnected'

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      ...config,
    }

    if (config.onMessage) {
      this.onMessage('*', config.onMessage)
    }
    if (config.onStatusChange) {
      this.onStatusChange(config.onStatusChange)
    }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    this.setStatus('connecting')

    const url = this.config.token
      ? `${this.config.url}?token=${this.config.token}`
      : this.config.url

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.setStatus('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.setStatus('error')
      }

      this.ws.onclose = () => {
        this.setStatus('disconnected')
        this.scheduleReconnect()
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      this.setStatus('error')
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.setStatus('disconnected')
  }

  send(type: string, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }

  onMessage(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }
    this.messageHandlers.get(type)!.add(handler)

    return () => {
      this.messageHandlers.get(type)?.delete(handler)
    }
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler)
    // Immediately call with current status
    handler(this.status)

    return () => {
      this.statusHandlers.delete(handler)
    }
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status
    this.statusHandlers.forEach((handler) => handler(status))
  }

  private handleMessage(data: { type?: string; [key: string]: any }): void {
    const { type = '*', ...rest } = data

    // Call type-specific handlers
    this.messageHandlers.get(type)?.forEach((handler) => handler(rest))

    // Call wildcard handlers
    this.messageHandlers.get('*')?.forEach((handler) => handler(data))
  }

  private scheduleReconnect(): void {
    if (
      this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10) ||
      this.reconnectTimer
    ) {
      return
    }

    this.reconnectAttempts++
    const delay = this.config.reconnectInterval! * Math.min(this.reconnectAttempts, 5)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }
}

// Singleton instance for global use
let globalWsManager: WebSocketManager | null = null

export function getWebSocketManager(config?: WebSocketConfig): WebSocketManager {
  if (!globalWsManager && config) {
    globalWsManager = new WebSocketManager(config)
  }
  if (!globalWsManager) {
    throw new Error('WebSocket manager not initialized. Call with config first.')
  }
  return globalWsManager
}

export function initWebSocket(baseUrl: string, token?: string): WebSocketManager {
  const wsUrl = baseUrl.replace(/^http/, 'ws')
  globalWsManager = new WebSocketManager({
    url: `${wsUrl}/ws`,
    token,
  })
  return globalWsManager
}
