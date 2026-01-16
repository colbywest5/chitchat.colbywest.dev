import type { Metadata, Viewport } from 'next'
import { ToastProvider, SkipLink } from '@/components/ui'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'ChitChat',
    template: '%s | ChitChat',
  },
  description: 'AI agent orchestration platform with voice and chat interface',
  keywords: ['AI', 'agents', 'orchestration', 'voice', 'chat', 'automation'],
  authors: [{ name: 'ChitChat Team' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#151516',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased bg-gray-950 text-gray-100 min-h-screen">
        <SkipLink />
        <ToastProvider>
          <main id="main-content">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  )
}
