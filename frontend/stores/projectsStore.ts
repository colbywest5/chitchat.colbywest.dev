import { create } from 'zustand'
import { Project, projectsApi, Task, tasksApi, AgentRun, runsApi, UpdateProjectRequest } from '@/lib/api'
import { useAuthStore } from './authStore'

interface ProjectsState {
  projects: Project[]
  currentProject: Project | null
  tasks: Task[]
  runs: AgentRun[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchProjects: () => Promise<void>
  fetchProject: (id: string) => Promise<void>
  createProject: (name: string, description?: string) => Promise<Project>
  updateProject: (id: string, data: UpdateProjectRequest) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  fetchTasks: (projectId: string) => Promise<void>
  fetchRuns: (projectId: string) => Promise<void>
  setCurrentProject: (project: Project | null) => void
  clearError: () => void
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProject: null,
  tasks: [],
  runs: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    const token = useAuthStore.getState().token
    if (!token) return

    set({ isLoading: true, error: null })
    try {
      const projects = await projectsApi.list(token)
      set({ projects, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
        isLoading: false,
      })
    }
  },

  fetchProject: async (id: string) => {
    const token = useAuthStore.getState().token
    if (!token) return

    set({ isLoading: true, error: null })
    try {
      const project = await projectsApi.get(id, token)
      set({ currentProject: project, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch project',
        isLoading: false,
      })
    }
  },

  createProject: async (name: string, description?: string) => {
    const token = useAuthStore.getState().token
    if (!token) throw new Error('Not authenticated')

    set({ isLoading: true, error: null })
    try {
      const project = await projectsApi.create({ name, description }, token)
      set((state) => ({
        projects: [...state.projects, project],
        isLoading: false,
      }))
      return project
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create project',
        isLoading: false,
      })
      throw error
    }
  },

  updateProject: async (id: string, data: UpdateProjectRequest) => {
    const token = useAuthStore.getState().token
    if (!token) return

    set({ isLoading: true, error: null })
    try {
      const updated = await projectsApi.update(id, data, token)
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        currentProject:
          state.currentProject?.id === id ? updated : state.currentProject,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update project',
        isLoading: false,
      })
    }
  },

  deleteProject: async (id: string) => {
    const token = useAuthStore.getState().token
    if (!token) return

    set({ isLoading: true, error: null })
    try {
      await projectsApi.delete(id, token)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject:
          state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete project',
        isLoading: false,
      })
    }
  },

  fetchTasks: async (projectId: string) => {
    const token = useAuthStore.getState().token
    if (!token) return

    try {
      const tasks = await tasksApi.list(projectId, token)
      set({ tasks })
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  },

  fetchRuns: async (projectId: string) => {
    const token = useAuthStore.getState().token
    if (!token) return

    try {
      const runs = await runsApi.list(projectId, token)
      set({ runs })
    } catch (error) {
      console.error('Failed to fetch runs:', error)
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  clearError: () => set({ error: null }),
}))
