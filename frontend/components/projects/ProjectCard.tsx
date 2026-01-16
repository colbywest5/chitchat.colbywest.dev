'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'
import { Card, Badge, Dropdown } from '@/components/ui'
import { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
  onEdit?: () => void
  onDelete?: () => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const updatedAt = new Date(project.updated_at)

  const menuItems = [
    {
      label: 'Edit',
      value: 'edit',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: 'Delete',
      value: 'delete',
      danger: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
  ]

  const handleMenuSelect = (value: string) => {
    if (value === 'edit' && onEdit) onEdit()
    if (value === 'delete' && onDelete) onDelete()
  }

  return (
    <Card
      variant="default"
      padding="none"
      className="group relative overflow-hidden"
    >
      <Link
        href={`/projects/${project.id}`}
        className="block p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset rounded-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-100 truncate group-hover:text-accent-400 transition-colors">
              {project.name}
            </h3>
            {project.description && (
              <p className="mt-1 text-sm text-gray-400 truncate-2">
                {project.description}
              </p>
            )}
          </div>

          {/* Status indicator - mock for now */}
          <div className="flex-shrink-0">
            <Badge variant="success" size="sm" dot>
              Active
            </Badge>
          </div>
        </div>

        {/* Stats row - mock data */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>0 tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>0 runs</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}
            </span>
            {project.default_repo_path && (
              <span className="text-gray-600 font-mono truncate max-w-[150px]">
                {project.default_repo_path}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Menu button - positioned absolute */}
      <div
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.preventDefault()}
      >
        <Dropdown
          trigger={
            <button
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
              aria-label="Project options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          }
          items={menuItems}
          onSelect={handleMenuSelect}
          align="right"
        />
      </div>
    </Card>
  )
}
