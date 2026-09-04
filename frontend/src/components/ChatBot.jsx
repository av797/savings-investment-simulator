import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api/client'

const PAGE_LABELS = {
  '/dashboard': 'Dashboard',
  '/markets':   'Markets',
  '/report':    'Report',
  '/settings':  'Settings',
}

const SUGGESTED_QUESTIONS = [
  "Am I on track with my goals?",
  "Which goal needs the most attention?",
  "How did stocks perform in 2008?",
  "What's the difference between ETFs and stocks?",
  "How does inflation affect my goals?",
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-gray-800 rounded-2xl rounded-bl-sm w-fit">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-emerald-400 text-gray-950 rounded-br-sm font-medium'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}

export default function ChatBot() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [unread, setUnread]     = useState(false)
  const messagesEndRef          = useRef(null)
  const inputRef                = useRef(null)
  const location                = useLocation()

  const pageContext = PAGE_LABELS[location.pathname] || null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setUnread(false)
    }
  }, [open])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role:    'assistant',
        content: "Hi! I'm your GoalIQ AI Agent. I can see your goals, simulations, and market data — ask me anything about your financial plan!",
      }])
    }
  }, [open])

  const sendMessage = async (text) => {
    const userMessage = text || input.trim()
    if (!userMessage || loading) return

    setInput('')
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await api.post('/chat', {
        messages:     newMessages,
        page_context: pageContext,
      })

      const reply = res.data.reply
      setMessages([...newMessages, { role: 'assistant', content: reply }])

      if (!open) setUnread(true)
    } catch {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Try again in a moment." },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setTimeout(() => {
      setMessages([{
        role:    'assistant',
        content: "Chat cleared! What would you like to know?",
      }])
    }, 100)
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          style={{ height: '540px' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 bg-emerald-400 rounded-full flex items-center justify-center">
                  <span className="text-gray-950 text-sm font-black">G</span>
                </div>
                <span className="absolute -bottom-1 -right-1 bg-emerald-400 text-gray-950 text-[9px] font-bold px-1 rounded-md leading-4">
                  AI
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-white text-sm font-semibold">GoalIQ Assistant</p>
                  <span className="text-[10px] font-semibold bg-emerald-400/15 text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 rounded-md">
                    AI Agent
                  </span>
                </div>
                <p className="text-emerald-400 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                  Online · knows your goals
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-gray-600 hover:text-gray-400 transition-colors text-xs px-2 py-1 rounded-lg hover:bg-gray-800"
              >
                Clear
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white transition-colors p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && !loading && (
            <div className="px-4 pb-3">
              <p className="text-gray-600 text-xs mb-2">Suggested questions</p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left text-xs text-gray-400 hover:text-emerald-400 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-2 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 pb-4 pt-2 border-t border-gray-800">
            <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your goals or markets..."
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-gray-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="text-gray-700 text-xs mt-2 text-center">
              Not financial advice · GoalIQ AI Agent
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 shadow-lg transition-all flex items-center gap-2 ${
          open
            ? 'w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 justify-center'
            : 'h-12 px-4 rounded-full bg-emerald-400 hover:bg-emerald-300'
        }`}
      >
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <>
            <svg className="w-5 h-5 text-gray-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-gray-950 font-semibold text-sm">AI Agent</span>
          </>
        )}

        {unread && !open && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-gray-950" />
        )}
      </button>
    </>
  )
}