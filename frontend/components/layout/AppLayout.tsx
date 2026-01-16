'use client'

import { ReactNode, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import { clsx } from 'clsx'
import { useAuthStore } from '@/stores/authStore'

interface Breadcrumb {
  label: string
  href?: string
}

interface AppLayoutProps {
  children: ReactNode
  breadcrumbs?: Breadcrumb[]
  title?: string
  actions?: ReactNode
  fullWidth?: boolean
}

export function AppLayout({
  children,
  breadcrumbs,
  title,
  actions,
  fullWidth = false,
}: AppLayoutProps) {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.projectId as string | undefined
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const { user, logout } = useAuthStore()

  // Fallback user for display
  const displayUser = user || {
    name: 'Demo User',
    email: 'demo@chitchat.ai',
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar projectId={projectId} />
      </div>

      {/* Mobile navigation overlay */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        projectId={projectId}
      />

      <div className="lg:pl-56 transition-all duration-200">
        <TopBar
          breadcrumbs={breadcrumbs}
          title={title}
          actions={actions}
          user={displayUser}
          onLogout={handleLogout}
          onMenuClick={() => setIsMobileNavOpen(true)}
          showMenuButton
        />

        <main
          className={clsx(
            'min-h-[calc(100vh-3.5rem)]',
            fullWidth ? 'p-0' : 'p-4 md:p-6'
          )}
          role="main"
          aria-label="Main content"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
