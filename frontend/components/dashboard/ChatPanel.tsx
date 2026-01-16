'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'
import { Button, Avatar, Spinner } from '@/components/ui'
import { Message, Conversation } from '@/lib/types'

interface ChatPanelProps {
  conversation?: Conversation | null
  messages: Message[]
  onSendMessage?: (content: string) => void
  isLoading?: boolean
  onStartRecording?: () => void
  onStopRecording?: () => void
  isRecording?: boolean
}

export function ChatPanel({
  conversation,
  messages,
  onSendMessage,
  isLoading,
  onStartRecording,
  onStopRecording,
  isRecording,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    onSendMessage?.(input.trim())
    setInput('')
  }

  const handleVoiceToggle = () => {
    if (isRecording) {
      onStopRecording?.()
    } else {
      onStartRecording?.()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-medium text-gray-200">Chat</h2>
        {conversation?.mode === 'voice' && (
          <span className="text-xs text-gray-500">Voice mode</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Start a conversation</p>
            <p className="text-xs text-gray-600 mt-1">
              Send messages or voice commands to orchestrate your agents
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className={clsx(
                'w-full px-4 py-2.5 pr-12 rounded-xl text-sm resize-none',
                'bg-gray-800 border border-gray-700 text-gray-100',
                'placeholder:text-gray-500',
                'focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500',
                'max-h-32'
              )}
              style={{ minHeight: '44px' }}
            />
          </div>

          {/* Voice button */}
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={clsx(
              'p-2.5 rounded-xl transition-colors',
              isRecording
                ? 'bg-error-500 text-white animate-pulse'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            )}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Send button */}
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-xl"
          >
            {isLoading ? (
              <Spinner size="xs" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

interface ChatMessageProps {
  message: Message
}

function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  const roleConfig = {
    user: { name: 'You', color: 'bg-accent-500' },
    relayer: { name: 'Relayer', color: 'bg-purple-500' },
    orchestrator: { name: 'Orchestrator', color: 'bg-teal-500' },
    agent: { name: 'Agent', color: 'bg-success-500' },
  }

  const config = roleConfig[message.role] || roleConfig.agent

  return (
    <div className={clsx('flex gap-3', isUser && 'flex-row-reverse')}>
      <Avatar
        name={config.name}
        size="sm"
        className={clsx('flex-shrink-0', config.color)}
      />
      <div
        className={clsx(
          'max-w-[80%] px-4 py-2.5 rounded-2xl',
          isUser
            ? 'bg-accent-500 text-white'
            : 'bg-gray-800 text-gray-200'
        )}
      >
        {!isUser && (
          <div className="text-xs font-medium text-gray-400 mb-1">
            {config.name}
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div
          className={clsx(
            'text-2xs mt-1.5',
            isUser ? 'text-white/60' : 'text-gray-500'
          )}
        >
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}
