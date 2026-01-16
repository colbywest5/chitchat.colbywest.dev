// Re-export types from API for convenience
export type {
  Project,
  CreateProjectRequest,
  Task,
  TaskStatus,
  TaskType,
  CreateTaskRequest,
  AgentRun,
  RunStatus,
  RunLog,
  Recording,
  AnalyticsData,
  Agent,
  Message,
  Conversation,
} from './api'

// Additional UI types
export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface NavItem {
  name: string
  href: string
  icon?: React.ReactNode
}

// WebSocket event types
export type WebSocketEventType =
  | 'project.state.updated'
  | 'task.created'
  | 'task.updated'
  | 'task.event.appended'
  | 'agent.run.started'
  | 'agent.run.log.appended'
  | 'agent.run.completed'
  | 'conversation.message.created'
  | 'recording.created'
  | 'orchestrator.cycle.started'
  | 'orchestrator.cycle.completed'

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType
  project_id: string
  timestamp: string
  entity_id: string
  data: T
}
