import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import {
  ArrowRight, Send, Square, Radio, Wifi, WifiOff,
  Clock, AlertCircle, Terminal, Smartphone,
} from 'lucide-react'
import apiClient from '../utils/api'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
const PROTOCOL_VERSION = 1

// ---------------------------------------------------------------------------
// Protocol v1 — envelope builder
// ---------------------------------------------------------------------------
const buildEnvelope = (type, id, payload) => ({
  v: PROTOCOL_VERSION,
  id: id ?? crypto.randomUUID(),
  type,
  ts: Date.now(),
  payload: payload ?? {},
})

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------
const StatusPill = ({ status }) => {
  const config = {
    connecting:         { color: 'bg-blue-50 text-blue-600 border-blue-200',   dot: 'bg-blue-400 animate-pulse', label: 'מתחבר...',                    Icon: Wifi },
    waiting:            { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400 animate-pulse', label: 'ממתין ללקוח...',              Icon: Clock },
    active:             { color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500',              label: 'שיחה פעילה',                  Icon: Radio },
    client_disconnected:{ color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400 animate-pulse', label: 'הלקוח התנתק — ממתין...',      Icon: Clock },
    ended:              { color: 'bg-gray-100 text-gray-500 border-gray-200',   dot: 'bg-gray-400',               label: 'השיחה הסתיימה',               Icon: WifiOff },
    error:              { color: 'bg-red-50 text-red-600 border-red-200',       dot: 'bg-red-500',                label: 'שגיאת חיבור',                 Icon: AlertCircle },
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
// Message bubble — renders all message kinds
//
// kinds:
//   command  — shell command typed by admin (LTR, monospace, dark)
//   output   — shell result from device   (LTR, monospace, darker)
//   error    — protocol or shell error    (centered red pill)
//   info     — device info card           (centered blue card)
//   system   — session lifecycle notice   (centered gray pill)
// ---------------------------------------------------------------------------
const MessageBubble = ({ message }) => {
  const time = new Date(message.timestamp).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // ── command ───────────────────────────────────────────────────────────────
  if (message.kind === 'command') {
    return (
      <div className="flex justify-start mb-2">
        <div className="max-w-[80%] flex flex-col gap-1 items-start">
          <div
            dir="ltr"
            className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-gray-800 text-green-400 text-sm font-mono leading-relaxed break-all shadow-sm"
          >
            <span className="text-gray-500 select-none">$ </span>
            {message.text}
          </div>
          <span className="text-xs text-gray-400 px-1">{time}</span>
        </div>
      </div>
    )
  }

  // ── output ────────────────────────────────────────────────────────────────
  if (message.kind === 'output') {
    const streaming = message.streaming === true
    const displayText = message.lines != null ? message.lines.join('\n') : (message.text ?? '')
    const failed = !streaming && typeof message.exitCode === 'number'
                   && message.exitCode !== 0 && message.exitCode !== 130
    return (
      <div className="flex justify-end mb-2">
        <div className="max-w-[80%] flex flex-col gap-1 items-end">
          <div
            dir="ltr"
            className={`px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm font-mono leading-relaxed whitespace-pre-wrap break-all shadow-sm ${
              failed
                ? 'bg-red-950 text-red-300 border border-red-900'
                : 'bg-gray-900 text-gray-100'
            }`}
          >
            {displayText || streaming
              ? <>{displayText}{streaming && <span className="inline-block animate-pulse text-green-400 ml-0.5">▌</span>}</>
              : <span className="italic text-gray-500">(no output)</span>
            }
          </div>
          <span className="text-xs text-gray-400 px-1">
            {failed ? `exit ${message.exitCode} · ` : ''}
            {streaming
              ? <span className="text-green-500 animate-pulse">streaming...</span>
              : time
            }
          </span>
        </div>
      </div>
    )
  }

  // ── error ─────────────────────────────────────────────────────────────────
  if (message.kind === 'error') {
    return (
      <div className="flex justify-center my-3">
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-4 py-1.5 rounded-full max-w-[85%]">
          <AlertCircle size={12} className="flex-shrink-0" />
          {message.code && (
            <span className="font-mono font-semibold">[{message.code}]</span>
          )}
          <span>{message.text}</span>
        </div>
      </div>
    )
  }

  // ── device info ───────────────────────────────────────────────────────────
  if (message.kind === 'info') {
    const p = message.payload
    return (
      <div className="flex justify-center my-3">
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
          <Smartphone size={13} className="flex-shrink-0 text-blue-500" />
          <span dir="ltr">
            {p.manufacturer} {p.model} · Android {p.androidVersion} (SDK {p.sdkVersion})
          </span>
        </div>
      </div>
    )
  }

  // ── system (default) ──────────────────────────────────────────────────────
  return (
    <div className="flex justify-center my-4">
      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
        {message.text}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main overlay
// ---------------------------------------------------------------------------
const LiveSessionOverlay = ({ clientId, clientName, sessionId, onClose }) => {
  const [status, setStatus]           = useState('connecting')
  const [messages, setMessages]       = useState([])
  const [inputText, setInputText]     = useState('')
  const [canSend, setCanSend]         = useState(false)
  const [deviceInfo, setDeviceInfo]   = useState(null)
  const [lastHeartbeat, setLastHeartbeat] = useState(null)
  const [isStreaming, setIsStreaming]  = useState(false)

  const socketRef          = useRef(null)
  const messagesEndRef     = useRef(null)
  const inputRef           = useRef(null)
  const sessionEndedRef    = useRef(false)
  const pendingRef         = useRef(new Map()) // id → command text, for correlation
  const streamingMsgIdRef  = useRef(null)      // id of the message bubble being streamed into

  // Auto-scroll on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg])
  }, [])

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('iFilter_authToken') || ''

    const socket = io(SOCKET_URL, {
      auth: { token, clientId, role: 'admin' },
      reconnectionAttempts: 3,
      timeout: 8000,
    })
    socketRef.current = socket

    // ── Session lifecycle ─────────────────────────────────────────────────
    socket.on('connect_error', () => setStatus('error'))

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
      if (sessionId) apiClient.markLiveSessionClientConnected(sessionId).catch(() => {})
    })

    socket.on('session:client_disconnected', () => {
      setStatus('client_disconnected')
      setCanSend(false)
      addMessage({ kind: 'system', text: 'הלקוח התנתק. ממתין להתחברות מחדש...', timestamp: Date.now() })
    })

    socket.on('session:ended', ({ reason } = {}) => {
      setStatus('ended')
      setCanSend(false)
      sessionEndedRef.current = true
      addMessage({
        kind: 'system',
        text: reason === 'admin_disconnect' ? 'השיחה הסתיימה עקב ניתוק.' : 'השיחה הסתיימה.',
        timestamp: Date.now(),
      })
      if (sessionId) apiClient.endLiveSession(sessionId).catch(() => {})
      socket.disconnect()
    })

    // ── Protocol v1 message handler ───────────────────────────────────────
    socket.on('message', (envelope) => {
      const { v, type, id, payload, from } = envelope

      // Server-originated error (e.g. invalid envelope we sent)
      if (from === 'server') {
        addMessage({
          kind: 'error',
          code: payload?.code,
          text: payload?.message || 'שגיאת שרת',
          timestamp: Date.now(),
        })
        return
      }

      // Ignore future protocol versions we don't understand
      if (v !== PROTOCOL_VERSION) return

      switch (type) {
        case 'stream': {
          // A single line from a streaming command — append to its output bubble
          const line = payload?.line ?? ''
          if (streamingMsgIdRef.current === id) {
            setMessages(prev => prev.map(m =>
              m.id === id ? { ...m, lines: [...m.lines, line] } : m
            ))
          }
          break
        }

        case 'res': {
          pendingRef.current.delete(id)
          const cmd = payload?.cmd

          if (cmd === 'shell') {
            if (streamingMsgIdRef.current === id) {
              // Finalize the streaming bubble
              streamingMsgIdRef.current = null
              setIsStreaming(false)
              setMessages(prev => prev.map(m =>
                m.id === id ? { ...m, streaming: false, exitCode: payload.exitCode ?? 0 } : m
              ))
            } else {
              // Non-streaming (blocking) response
              addMessage({
                kind: 'output',
                text: payload.stdout ?? '',
                exitCode: payload.exitCode ?? 0,
                id,
                timestamp: envelope.relayedAt || Date.now(),
              })
            }
          } else if (cmd === 'pong') {
            addMessage({
              kind: 'system',
              text: `Ping: ${payload.latency ?? '?'}ms`,
              timestamp: Date.now(),
            })
          } else if (cmd === 'info') {
            setDeviceInfo(payload)
            addMessage({ kind: 'info', payload, timestamp: Date.now() })
          }
          break
        }

        case 'event': {
          const name = payload?.name
          if (name === 'heartbeat') {
            setLastHeartbeat(Date.now())
            // Heartbeat only updates the header indicator — no message bubble
          } else if (name === 'ready') {
            setDeviceInfo(payload)
            addMessage({
              kind: 'system',
              text: `מכשיר מחובר: ${payload.manufacturer ?? ''} ${payload.model ?? ''} · Android ${payload.androidVersion ?? ''}`,
              timestamp: Date.now(),
            })
          }
          break
        }

        case 'err': {
          pendingRef.current.delete(id)
          addMessage({
            kind: 'error',
            code: payload?.code,
            text: payload?.message || 'שגיאה לא ידועה',
            timestamp: envelope.relayedAt || Date.now(),
          })
          break
        }

        default:
          break
      }
    })

    return () => {
      if (!sessionEndedRef.current && sessionId) {
        apiClient.endLiveSession(sessionId).catch(() => {})
      }
      socket.disconnect()
    }
  }, [clientId, sessionId, addMessage])

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMessage = () => {
    const text = inputText.trim()
    if (!text || !canSend || !socketRef.current || isStreaming) return

    const id = crypto.randomUUID()
    let envelope
    let isShellCmd = false

    // Special slash commands
    if (text === '/ping') {
      envelope = buildEnvelope('cmd', id, { cmd: 'ping', ts: Date.now() })
    } else if (text === '/info') {
      envelope = buildEnvelope('cmd', id, { cmd: 'info' })
    } else {
      envelope = buildEnvelope('cmd', id, { cmd: 'shell', args: text, stream: true })
      isShellCmd = true
    }

    addMessage({ kind: 'command', text, id, timestamp: Date.now() })
    pendingRef.current.set(id, text)
    socketRef.current.emit('message', envelope)
    setInputText('')
    inputRef.current?.focus()

    if (isShellCmd) {
      // Pre-create the streaming output bubble that lines will fill in
      addMessage({ kind: 'output', lines: [], streaming: true, exitCode: null, id, timestamp: Date.now() })
      streamingMsgIdRef.current = id
      setIsStreaming(true)
    }
  }

  const sendStop = () => {
    socketRef.current?.emit('message',
      buildEnvelope('cmd', crypto.randomUUID(), { cmd: 'stop' })
    )
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const endSession = () => {
    sessionEndedRef.current = true
    socketRef.current?.emit('session:end')
    if (sessionId) apiClient.endLiveSession(sessionId).catch(() => {})
    onClose()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-gray-50"
      dir="rtl"
      aria-label="שיחה חיה עם לקוח"
    >

      {/* ── Header ────────────────────────────────────────────────────────── */}
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
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Terminal size={17} className="text-purple-500" />
              שיחה חיה
            </h2>
            <p className="text-sm text-gray-500">
              {clientName}
              {deviceInfo && (
                <span className="text-gray-400 font-normal" dir="ltr">
                  {' '}· {deviceInfo.manufacturer} {deviceInfo.model}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Center: status + heartbeat */}
        <div className="flex items-center gap-3">
          <StatusPill status={status} />
          {lastHeartbeat && (
            <span className="text-xs text-gray-400 tabular-nums" title="זמן heartbeat אחרון">
              ♥ {new Date(lastHeartbeat).toLocaleTimeString('he-IL', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            </span>
          )}
        </div>

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

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-1">
        {messages.length === 0 && (status === 'waiting' || status === 'connecting') && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center">
              <Radio size={28} className="text-purple-400 animate-pulse" />
            </div>
            <p className="text-sm">ממתין ללקוח #{clientId} להתחבר לשיחה...</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">

          {/* $ prefix + textarea */}
          <div className="flex-1 flex items-end gap-2 px-4 py-3 rounded-xl border transition-colors
            bg-white border-gray-300 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100">
            <span className="text-gray-400 font-mono text-sm select-none pb-0.5 flex-shrink-0">$</span>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!canSend || isStreaming}
              dir="ltr"
              placeholder={
                !canSend
                  ? 'ממתין ללקוח להתחבר...'
                  : isStreaming
                    ? 'פקודה רצה... לחץ ■ לעצירה'
                    : 'shell command, /ping, /info'
              }
              rows={1}
              className={`flex-1 resize-none text-sm font-mono outline-none bg-transparent
                ${canSend && !isStreaming
                  ? 'text-gray-800 placeholder-gray-400'
                  : 'text-gray-400 placeholder-gray-300 cursor-not-allowed'
                }`}
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
          </div>

          {isStreaming ? (
            <button
              onClick={sendStop}
              className="flex-shrink-0 p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
              aria-label="עצור פקודה"
              title="Ctrl+C — עצור פקודה"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!canSend || !inputText.trim()}
              className={`flex-shrink-0 p-3 rounded-xl transition-all ${
                canSend && inputText.trim()
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
              aria-label="שלח פקודה"
            >
              <Send size={18} />
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-2">
          Enter לשליחה · Shift+Enter לשורה חדשה · /ping לבדיקת חביון · /info לפרטי מכשיר
        </p>
      </div>
    </div>
  )
}

export default LiveSessionOverlay
