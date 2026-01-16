const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FetchOptions extends RequestInit {
  token?: string | null
}

class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    let data
    try {
      data = await response.json()
    } catch {
      data = null
    }
    throw new ApiError(
      data?.detail || `Request failed with status ${response.status}`,
      response.status,
      data
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

// Auth API
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    email: string
    is_admin: boolean
  }
}

export const authApi = {
  login: (data: LoginRequest) =>
    fetchApi<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (token: string) =>
    fetchApi<void>('/auth/logout', {
      method: 'POST',
      token,
    }),

  me: (token: string) =>
    fetchApi<{ id: string; email: string; is_admin: boolean }>('/auth/me', {
      token,
    }),
}

// Projects API
export interface Project {
  id: string
  name: string
  description: string | null
  default_repo_path: string | null
  created_at: string
  updated_at: string
}

export interface CreateProjectRequest {
  name: string
  description?: string
  default_repo_path?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string | null
  default_repo_path?: string | null
}

export const projectsApi = {
  list: (token: string) =>
    fetchApi<Project[]>('/projects', { token }),

  get: (id: string, token: string) =>
    fetchApi<Project>(`/projects/${id}`, { token }),

  create: (data: CreateProjectRequest, token: string) =>
    fetchApi<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (id: string, data: UpdateProjectRequest, token: string) =>
    fetchApi<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: string, token: string) =>
    fetchApi<void>(`/projects/${id}`, {
      method: 'DELETE',
      token,
    }),
}

// Tasks API
export type TaskStatus =
  | 'queued'
  | 'in_progress'
  | 'blocked'
  | 'needs_review'
  | 'done'
  | 'failed'
  | 'canceled'

export type TaskType = 'code_change' | 'test' | 'review' | 'doc' | 'research'

export interface Task {
  id: string
  project_id: string
  title: string
  description: string
  type: TaskType
  priority: number
  status: TaskStatus
  requested_by: string
  created_at: string
  updated_at: string
}

export interface CreateTaskRequest {
  title: string
  description: string
  type: TaskType
  priority?: number
}

export const tasksApi = {
  list: (projectId: string, token: string) =>
    fetchApi<Task[]>(`/projects/${projectId}/tasks`, { token }),

  get: (projectId: string, taskId: string, token: string) =>
    fetchApi<Task>(`/projects/${projectId}/tasks/${taskId}`, { token }),

  create: (projectId: string, data: CreateTaskRequest, token: string) =>
    fetchApi<Task>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (
    projectId: string,
    taskId: string,
    data: Partial<Task>,
    token: string
  ) =>
    fetchApi<Task>(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),
}

// Agent Runs API
export type RunStatus =
  | 'started'
  | 'streaming'
  | 'completed'
  | 'failed'
  | 'timed_out'
  | 'canceled'

export interface AgentRun {
  id: string
  project_id: string
  agent_id: string
  task_id: string | null
  status: RunStatus
  started_at: string
  finished_at: string | null
  exit_code: number | null
  summary: string | null
}

export interface RunLog {
  id: string
  run_id: string
  seq: number
  stream: 'stdout' | 'stderr' | 'system'
  message: string
  created_at: string
}

export const runsApi = {
  list: (projectId: string, token: string) =>
    fetchApi<AgentRun[]>(`/projects/${projectId}/runs`, { token }),

  get: (projectId: string, runId: string, token: string) =>
    fetchApi<AgentRun>(`/projects/${projectId}/runs/${runId}`, { token }),

  logs: (projectId: string, runId: string, token: string) =>
    fetchApi<RunLog[]>(`/projects/${projectId}/runs/${runId}/logs`, { token }),
}

// Recordings API
export interface Recording {
  id: string
  conversation_id: string
  storage_path: string
  mime_type: string
  duration_ms: number | null
  transcript_text: string | null
  created_at: string
}

export const recordingsApi = {
  list: (projectId: string, token: string) =>
    fetchApi<Recording[]>(`/projects/${projectId}/recordings`, { token }),

  get: (projectId: string, recordingId: string, token: string) =>
    fetchApi<Recording>(`/projects/${projectId}/recordings/${recordingId}`, {
      token,
    }),

  upload: async (
    projectId: string,
    file: File,
    token: string
  ): Promise<Recording> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(
      `${API_BASE}/projects/${projectId}/recordings/upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new ApiError(
        data?.detail || 'Upload failed',
        response.status,
        data
      )
    }

    return response.json()
  },
}

// Analytics API
export interface AnalyticsData {
  task_throughput: { date: string; count: number }[]
  failure_rate: number
  average_run_time_ms: number
  tasks_by_type: { type: TaskType; count: number }[]
  tasks_by_status: { status: TaskStatus; count: number }[]
}

export const analyticsApi = {
  get: (projectId: string, token: string, days = 30) =>
    fetchApi<AnalyticsData>(
      `/projects/${projectId}/analytics?days=${days}`,
      { token }
    ),
}

// Agents API
export interface Agent {
  id: string
  project_id: string
  name: string
  type: 'cloud' | 'local'
  is_enabled: boolean
  config_json: Record<string, unknown>
  created_at: string
}

export const agentsApi = {
  list: (projectId: string, token: string) =>
    fetchApi<Agent[]>(`/projects/${projectId}/agents`, { token }),

  update: (
    projectId: string,
    agentId: string,
    data: Partial<Agent>,
    token: string
  ) =>
    fetchApi<Agent>(`/projects/${projectId}/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),
}

// Conversations API
export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'relayer' | 'orchestrator' | 'agent'
  content: string
  content_format: 'plain' | 'markdown' | 'json'
  related_task_id: string | null
  created_at: string
}

export interface Conversation {
  id: string
  project_id: string
  title: string | null
  mode: 'text' | 'voice'
  created_at: string
  messages?: Message[]
}

export const conversationsApi = {
  list: (projectId: string, token: string) =>
    fetchApi<Conversation[]>(`/projects/${projectId}/conversations`, { token }),

  get: (projectId: string, conversationId: string, token: string) =>
    fetchApi<Conversation>(
      `/projects/${projectId}/conversations/${conversationId}`,
      { token }
    ),

  create: (projectId: string, token: string) =>
    fetchApi<Conversation>(`/projects/${projectId}/conversations`, {
      method: 'POST',
      token,
    }),

  sendMessage: (
    projectId: string,
    conversationId: string,
    content: string,
    token: string
  ) =>
    fetchApi<Message>(
      `/projects/${projectId}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
        token,
      }
    ),
}

export { ApiError }
