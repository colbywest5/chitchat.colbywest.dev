'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Avatar, Button, Dropdown } from '@/components/ui'

interface Breadcrumb {
  label: string
  href?: string
}

interface TopBarProps {
  breadcrumbs?: Breadcrumb[]
  title?: string
  actions?: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onLogout?: () => void
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function TopBar({
  breadcrumbs = [],
  title,
  actions,
  user,
  onLogout,
  onMenuClick,
  showMenuButton = false,
}: TopBarProps) {
  const userMenuItems = [
    {
      label: 'Profile',
      value: 'profile',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: 'Sign out',
      value: 'logout',
      danger: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    },
  ]

  const handleUserMenuSelect = (value: string) => {
    if (value === 'logout' && onLogout) {
      onLogout()
    }
  }

  return (
    <header className="sticky top-0 z-30 h-14 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left: Menu button + Breadcrumbs / Title */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile menu button */}
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded-lg transition-colors"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          {breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, index) => (
                <Fragment key={index}>
                  {index > 0 && (
                    <svg
                      className="w-4 h-4 text-gray-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-gray-400 hover:text-gray-200 transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-200 font-medium truncate">
                      {crumb.label}
                    </span>
                  )}
                </Fragment>
              ))}
            </nav>
          ) : title ? (
            <h1 className="text-base font-semibold text-gray-100 truncate">{title}</h1>
          ) : null}
        </div>

        {/* Right: Actions + User */}
        <div className="flex items-center gap-3">
          {actions}

          {user && (
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 p-1.5 -m-1.5 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <Avatar
                    name={user.name}
                    src={user.avatar}
                    size="sm"
                  />
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              }
              items={userMenuItems}
              onSelect={handleUserMenuSelect}
              align="right"
            />
          )}
        </div>
      </div>
    </header>
  )
}
