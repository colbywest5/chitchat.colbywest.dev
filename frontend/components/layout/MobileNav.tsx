'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string
}

export function MobileNav({ isOpen, onClose, projectId }: MobileNavProps) {
  const pathname = usePathname()

  // Close menu on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const mainNav = [
    { name: 'Projects', href: '/projects' },
  ]

  const projectNav = projectId
    ? [
        { name: 'Dashboard', href: `/projects/${projectId}` },
        { name: 'Analytics', href: `/projects/${projectId}/analytics` },
        { name: 'Recordings', href: `/projects/${projectId}/recordings` },
        { name: 'Settings', href: `/projects/${projectId}/settings` },
      ]
    : []

  if (!isOpen) return null

  return (
    <>
      {/* Mobile menu overlay */}
      <div
        className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile menu */}
      <nav
        className="lg:hidden fixed top-14 right-0 bottom-0 z-40 w-64 bg-gray-950 border-l border-gray-800 transform transition-transform duration-200 ease-out animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="p-4 space-y-6">
          {/* Close button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-1">
            {mainNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'block px-3 py-2 rounded-lg text-base font-medium',
                  'transition-colors duration-100',
                  pathname === item.href
                    ? 'bg-gray-800 text-gray-100'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {projectNav.length > 0 && (
            <>
              <div className="border-t border-gray-800" />
              <div className="space-y-1">
                <p className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </p>
                {projectNav.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'block px-3 py-2 rounded-lg text-base font-medium',
                      'transition-colors duration-100',
                      pathname === item.href || (item.href.endsWith(projectId!) && pathname === item.href)
                        ? 'bg-gray-800 text-gray-100'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  )
}
