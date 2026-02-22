import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { ArrowRight, Send, Radio, Wifi, WifiOff, Clock, AlertCircle } from 'lucide-react'
import apiClient from '../utils/api'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

// ---------------------------------------------------------------------------
// Status pill shown at the top of the overlay
// ---------------------------------------------------------------------------
const StatusPill = ({ status }) => {
  const config = {
    connecting: {
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      dot: 'bg-blue-400 animate-pulse',
      label: 'מתחבר...',
      Icon: Wifi,
    },
    waiting: {
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-400 animate-pulse',
      label: 'ממתין להתחברות הלקוח...',
      Icon: Clock,
    },
    active: {
      color: 'bg-green-50 text-green-700 border-green-200',
      dot: 'bg-green-500',
      label: 'שיחה פעילה',
      Icon: Radio,
    },
    client_disconnected: {
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-400 animate-pulse',
      label: 'הלקוח התנתק — ממתין...',
      Icon: Clock,
    },
    ended: {
      color: 'bg-gray-100 text-gray-500 border-gray-200',
      dot: 'bg-gray-400',
      label: 'השיחה הסתיימה',
      Icon: WifiOff,
    },
    error: {
      color: 'bg-red-50 text-red-600 border-red-200',
      dot: 'bg-red-500',
      label: 'שגיאת חיבור',
      Icon: AlertCircle,
    },
  }

  const c = config[status] || config.connecting
  const { Icon } = c

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border ${c.color}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <Icon size={14} />
      {c.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Single message bubble
// ---------------------------------------------------------------------------
const MessageBubble = ({ message, isAdmin }) => {
  const time = new Date(message.timestamp).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`max-w-[70%] ${isAdmin ? 'items-start' : 'items-end'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
            isAdmin
              ? 'bg-white border border-gray-200 text-gray-800 rounded-tr-sm shadow-sm'
              : 'bg-purple-600 text-white rounded-tl-sm shadow-sm'
          }`}
        >
          {message.text}
        </div>
        <span className="text-xs text-gray-400 px-1">{time}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main overlay component
// ---------------------------------------------------------------------------
const LiveSessionOverlay = ({ clientId, clientName, sessionId, onClose }) => {
  const [status, setStatus] = useState('connecting')
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [canSend, setCanSend] = useState(false)

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  // Track whether we need to mark the session ended in DB on unmount
  const sessionEndedRef = useRef(false)

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // ── Socket connection ────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('iFilter_authToken') || ''

    const socket = io(SOCKET_URL, {
      auth: {
        token,
        clientId,
        role: 'admin',
      },
      reconnectionAttempts: 3,
      timeout: 8000,
    })

    socketRef.current = socket

    socket.on('connect_error', () => {
      setStatus('error')
    })

    socket.on('session:status', ({ status: s }) => {
      setStatus(s)
      setCanSend(s === 'active')
    })

    socket.on('session:waiting', () => {
      setStatus('waiting')
      setCanSend(false)
    })

    socket.on('session:active', () => {
      setStatus('active')
      setCanSend(true)
      inputRef.current?.focus()
      // Update DB: client connected
      if (sessionId) {
        apiClient.markLiveSessionClientConnected(sessionId).catch(() => {})
      }
    })

    socket.on('session:client_disconnected', () => {
      setStatus('client_disconnected')
      setCanSend(false)
      addSystemMessage('הלקוח התנתק. ממתין להתחברות מחדש...')
    })

    socket.on('session:ended', ({ reason } = {}) => {
      setStatus('ended')
      setCanSend(false)
      sessionEndedRef.current = true
      const msg = reason === 'admin_disconnect'
        ? 'השיחה הסתיימה עקב ניתוק.'
        : 'השיחה הסתיימה.'
      addSystemMessage(msg)
      // Update DB: session ended
      if (sessionId) {
        apiClient.endLiveSession(sessionId).catch(() => {})
      }
      socket.disconnect()
    })

    socket.on('message', (data) => {
      setMessages((prev) => [...prev, data])
    })

    return () => {
      // If admin closes the overlay without formally ending the session, end it in DB
      if (!sessionEndedRef.current && sessionId) {
        apiClient.endLiveSession(sessionId).catch(() => {})
      }
      socket.disconnect()
    }
  }, [clientId, sessionId])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const addSystemMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      { from: 'system', text, timestamp: Date.now() },
    ])
  }

  const sendMessage = () => {
    const text = inputText.trim()
    if (!text || !canSend || !socketRef.current) return

    socketRef.current.emit('message', { text })
    setInputText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const endSession = () => {
    sessionEndedRef.current = true
    if (socketRef.current) {
      socketRef.current.emit('session:end')
    }
    // Update DB immediately — don't wait for socket:ended event
    if (sessionId) {
      apiClient.endLiveSession(sessionId).catch(() => {})
    }
    onClose()
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-gray-50"
      dir="rtl"
      aria-label="שיחה חיה עם לקוח"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        {/* Right: back + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="חזור לפרטי לקוח"
          >
            <ArrowRight size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">שיחה חיה</h2>
            <p className="text-sm text-gray-500">{clientName}</p>
          </div>
        </div>

        {/* Center: status */}
        <StatusPill status={status} />

        {/* Left: end session */}
        <button
          onClick={endSession}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
          aria-label="סיום שיחה"
        >
          <WifiOff size={15} />
          סיום שיחה
        </button>
      </div>

      {/* ── Messages area ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-1">
        {/* Empty waiting state */}
        {messages.length === 0 && (status === 'waiting' || status === 'connecting') && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center">
              <Radio size={28} className="text-purple-400 animate-pulse" />
            </div>
            <p className="text-sm">ממתין ללקוח #{clientId} להתחבר לשיחה...</p>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => {
          if (msg.from === 'system') {
            return (
              <div key={i} className="flex justify-center my-4">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            )
          }
          return (
            <MessageBubble
              key={i}
              message={msg}
              isAdmin={msg.from === 'admin'}
            />
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canSend}
            placeholder={
              canSend
                ? 'כתוב הודעה... (Enter לשליחה)'
                : 'ממתין ללקוח להתחבר לפני שניתן לשלוח הודעות'
            }
            rows={1}
            className={`flex-1 resize-none px-4 py-3 text-sm rounded-xl border transition-colors outline-none
              ${canSend
                ? 'border-gray-300 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-white text-gray-800 placeholder-gray-400'
                : 'border-gray-200 bg-gray-50 text-gray-400 placeholder-gray-300 cursor-not-allowed'
              }`}
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={sendMessage}
            disabled={!canSend || !inputText.trim()}
            className={`flex-shrink-0 p-3 rounded-xl transition-all ${
              canSend && inputText.trim()
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
            aria-label="שלח הודעה"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Enter לשליחה · Shift+Enter לשורה חדשה
        </p>
      </div>
    </div>
  )
}

export default LiveSessionOverlay
