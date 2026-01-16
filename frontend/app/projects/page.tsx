'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout'
import { AuthGate } from '@/components/auth/AuthGate'
import { ProjectCard, CreateProjectModal } from '@/components/projects'
import { Button, EmptyState, SkeletonCard } from '@/components/ui'
import { useProjectsStore } from '@/stores/projectsStore'

export default function ProjectsPage() {
  const router = useRouter()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { projects, isLoading, error, fetchProjects, deleteProject } = useProjectsStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleProjectCreated = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject(projectId)
    }
  }

  return (
    <AuthGate>
      <AppLayout
        title="Projects"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)} icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }>
            New Project
          </Button>
        }
      >
        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 text-sm text-error-500 bg-error-500/10 border border-error-500/20 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && projects.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && projects.length === 0 && (
          <div className="mt-12">
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              }
              title="No projects yet"
              description="Create your first project to start orchestrating AI agents on your codebase."
              action={
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Create Project
                </Button>
              }
            />
          </div>
        )}

        {/* Projects grid */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={() => handleDeleteProject(project.id)}
              />
            ))}
          </div>
        )}

        {/* Create modal */}
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleProjectCreated}
        />
      </AppLayout>
    </AuthGate>
  )
}
