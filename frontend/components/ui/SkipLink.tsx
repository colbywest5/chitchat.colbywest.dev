'use client'

interface SkipLinkProps {
  href?: string
  children?: React.ReactNode
}

export function SkipLink({
  href = '#main-content',
  children = 'Skip to main content'
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-500 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-gray-950"
    >
      {children}
    </a>
  )
}
