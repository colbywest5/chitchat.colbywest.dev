'use client'

import { useState, createContext, useContext, ReactNode } from 'react'
import { clsx } from 'clsx'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

// Simple inline tabs (for quick tab navigation without content panels)
export interface InlineTabsProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onChange: (id: string) => void
  size?: 'sm' | 'md'
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, size = 'md', className }: InlineTabsProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-1 p-1 bg-gray-900 border border-gray-800 rounded-lg',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'font-medium rounded-md transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
            activeTab === tab.id
              ? 'bg-gray-800 text-gray-100'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// Compound component Tabs (for complex tab layouts with content panels)
export interface CompoundTabsProps {
  defaultValue: string
  children: ReactNode
  className?: string
  onChange?: (value: string) => void
}

export function CompoundTabs({ defaultValue, children, className, onChange }: CompoundTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  const handleChange = (value: string) => {
    setActiveTab(value)
    onChange?.(value)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps {
  children: ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-1 p-1 bg-gray-900 border border-gray-800 rounded-lg',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  )
}

export interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function TabsTrigger({
  value,
  children,
  className,
  disabled = false,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={clsx(
        'px-3 py-1.5 text-sm font-medium rounded-md',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
        isActive
          ? 'bg-gray-800 text-gray-100'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useTabsContext()

  if (activeTab !== value) return null

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={clsx('animate-fade-in', className)}
    >
      {children}
    </div>
  )
}
