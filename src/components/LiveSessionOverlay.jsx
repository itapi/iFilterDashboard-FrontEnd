import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import {
  ArrowRight, Send, Square, Radio, Wifi, WifiOff,
  Clock, AlertCircle, Terminal, Smartphone, Monitor, MonitorOff, Loader,
  ChevronDown, Zap, ChevronLeft, Circle, LayoutGrid, Keyboard,
} from 'lucide-react'
import apiClient from '../utils/api'
import shellCommands from '../data/shellCommands.json'

const SOCKET_URL      = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
const PROTOCOL_VERSION = 1

// Binary frame types produced by ScreenStreamManager.java
const SCREEN_FRAME_CONFIG = 0x00  // SPS/PPS codec config — comes once at stream start
const SCREEN_FRAME_VIDEO  = 0x01  // H.264 encoded video frame

// ---------------------------------------------------------------------------
// Protocol v1 — envelope builder
// ---------------------------------------------------------------------------
const buildEnvelope = (type, id, payload) => ({
  v:       PROTOCOL_VERSION,
  id:      id ?? crypto.randomUUID(),
  type,
  ts:      Date.now(),
  payload: payload ?? {},
})

// ---------------------------------------------------------------------------
// Screen helpers
// ---------------------------------------------------------------------------

/** http(s)://host:port → ws(s)://host:port/screen?clientId=…&token=…&role=sink */
function buildScreenWsUrl(socketUrl, clientId, token) {
  const base = socketUrl
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://')
    .replace(/\/$/, '')
  return (
    `${base}/screen` +
    `?clientId=${encodeURIComponent(clientId)}` +
    `&token=${encodeURIComponent(token)}` +
    `&role=sink`
  )
}

/**
 * Scan an Annex-B H.264 buffer for NALU type 5 (IDR = keyframe).
 */
function isH264Keyframe(data) {
  let i = 0
  while (i < data.length - 4) {
    if (data[i] === 0 && data[i + 1] === 0) {
      let naluByte = -1
      if (data[i + 2] === 1 && i + 3 < data.length)                           naluByte = data[i + 3]
      else if (data[i + 2] === 0 && data[i + 3] === 1 && i + 4 < data.length) naluByte = data[i + 4]
      if (naluByte !== -1) {
        const naluType = naluByte & 0x1F
        if (naluType === 5) return true
        if (naluType === 1) return false
      }
    }
    i++
  }
  return false
}

/**
 * Split an Annex-B buffer into individual NAL unit Uint8Arrays (no start codes).
 */
function splitAnnexBNalus(annexB) {
  const nalus = []
  let i = 0
  let naluStart = -1
  let naluStartCodeLen = 0

  const tryStartCode = (j) => {
    if (annexB[j] === 0 && annexB[j+1] === 0 && annexB[j+2] === 0 && annexB[j+3] === 1) return 4
    if (annexB[j] === 0 && annexB[j+1] === 0 && annexB[j+2] === 1)                       return 3
    return 0
  }

  while (i < annexB.length) {
    const scLen = (i + 3 < annexB.length) ? tryStartCode(i) : 0
    if (scLen > 0) {
      if (naluStart !== -1) nalus.push(annexB.subarray(naluStart, i))
      naluStart = i + scLen
      naluStartCodeLen = scLen
      i += scLen
    } else {
      i++
    }
  }
  if (naluStart !== -1 && naluStart < annexB.length) nalus.push(annexB.subarray(naluStart))
  return nalus
}

/**
 * Convert Annex-B H.264 to AVCC (4-byte big-endian length prefix per NAL unit).
 * WebCodecs VideoDecoder with avc1 requires AVCC format.
 */
function annexBToAvcc(annexB) {
  const nalus = splitAnnexBNalus(annexB)
  if (nalus.length === 0) return annexB

  let totalSize = 0
  for (const n of nalus) totalSize += 4 + n.length

  const avcc = new Uint8Array(totalSize)
  let pos = 0
  for (const n of nalus) {
    avcc[pos]   = (n.length >>> 24) & 0xFF
    avcc[pos+1] = (n.length >>> 16) & 0xFF
    avcc[pos+2] = (n.length >>>  8) & 0xFF
    avcc[pos+3] =  n.length         & 0xFF
    avcc.set(n, pos + 4)
    pos += 4 + n.length
  }
  return avcc
}

/**
 * Build an AVCDecoderConfigurationRecord (used as VideoDecoderConfig.description)
 * from the Annex-B SPS/PPS config packet emitted by MediaCodec.
 */
function buildAvccDescription(configData) {
  const nalus = splitAnnexBNalus(configData)
  const sps = nalus.find(n => (n[0] & 0x1F) === 7)
  const pps = nalus.find(n => (n[0] & 0x1F) === 8)
  if (!sps || !pps) return null

  const record = new Uint8Array(11 + sps.length + pps.length)
  let p = 0
  record[p++] = 0x01          // configurationVersion
  record[p++] = sps[1]        // AVCProfileIndication
  record[p++] = sps[2]        // profile_compatibility
  record[p++] = sps[3]        // AVCLevelIndication
  record[p++] = 0xFF          // lengthSizeMinusOne (4-byte lengths)
  record[p++] = 0xE1          // numSequenceParameterSets = 1
  record[p++] = (sps.length >> 8) & 0xFF
  record[p++] =  sps.length       & 0xFF
  record.set(sps, p); p += sps.length
  record[p++] = 0x01          // numPictureParameterSets = 1
  record[p++] = (pps.length >> 8) & 0xFF
  record[p++] =  pps.length       & 0xFF
  record.set(pps, p)
  return record
}

/**
 * Extract avc1 codec string from Annex-B SPS NALU.
 */
function getH264CodecString(configData) {
  const nalus = splitAnnexBNalus(configData)
  const sps = nalus.find(n => (n[0] & 0x1F) === 7)
  if (sps && sps.length >= 4) {
    const profile = sps[1].toString(16).padStart(2, '0')
    const compat  = sps[2].toString(16).padStart(2, '0')
    const level   = sps[3].toString(16).padStart(2, '0')
    return `avc1.${profile}${compat}${level}`
  }
  return 'avc1.640028' // fallback: High Profile Level 4.0
}

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------
const StatusPill = ({ status }) => {
  const config = {
    connecting:          { color: 'bg-blue-50 text-blue-600 border-blue-200',   dot: 'bg-blue-400 animate-pulse', label: 'מתחבר...',                   Icon: Wifi },
    waiting:             { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400 animate-pulse', label: 'ממתין ללקוח...',             Icon: Clock },
    active:              { color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500',               label: 'שיחה פעילה',                 Icon: Radio },
    client_disconnected: { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400 animate-pulse', label: 'הלקוח התנתק — ממתין...',     Icon: Clock },
    ended:               { color: 'bg-gray-100 text-gray-500 border-gray-200',   dot: 'bg-gray-400',                label: 'השיחה הסתיימה',              Icon: WifiOff },
    error:               { color: 'bg-red-50 text-red-600 border-red-200',       dot: 'bg-red-500',                 label: 'שגיאת חיבור',                Icon: AlertCircle },
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
// Message bubble
// ---------------------------------------------------------------------------
const MessageBubble = ({ message }) => {
  const time = new Date(message.timestamp).toLocaleTimeString('he-IL', {
    hour: '2-digit', minute: '2-digit',
  })

  if (message.kind === 'command') {
    return (
      <div className="flex justify-start mb-2">
        <div className="max-w-[80%] flex flex-col gap-1 items-start">
          <div dir="ltr" className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-gray-800 text-green-400 text-sm font-mono leading-relaxed break-all shadow-sm">
            <span className="text-gray-500 select-none">$ </span>
            {message.text}
          </div>
          <span className="text-xs text-gray-400 px-1">{time}</span>
        </div>
      </div>
    )
  }

  if (message.kind === 'output') {
    const streaming    = message.streaming === true
    const displayText  = message.lines != null ? message.lines.join('\n') : (message.text ?? '')
    const failed       = !streaming && typeof message.exitCode === 'number'
                         && message.exitCode !== 0 && message.exitCode !== 130
    return (
      <div className="flex justify-end mb-2">
        <div className="w-full flex flex-col gap-1 items-end">
          <div
            dir="ltr"
            className={`w-full px-4 py-3 rounded-2xl rounded-tr-sm text-sm font-mono leading-relaxed whitespace-pre overflow-x-auto shadow-sm text-left ${
              failed ? 'bg-red-950 text-red-300 border border-red-900' : 'bg-gray-900 text-gray-100'
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

  if (message.kind === 'error') {
    return (
      <div className="flex justify-center my-3">
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-4 py-1.5 rounded-full max-w-[85%]">
          <AlertCircle size={12} className="flex-shrink-0" />
          {message.code && <span className="font-mono font-semibold">[{message.code}]</span>}
          <span>{message.text}</span>
        </div>
      </div>
    )
  }

  if (message.kind === 'info') {
    const p = message.payload
    return (
      <div className="flex justify-center my-3">
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
          <Smartphone size={13} className="flex-shrink-0 text-blue-500" />
          <span dir="ltr">{p.manufacturer} {p.model} · Android {p.androidVersion} (SDK {p.sdkVersion})</span>
        </div>
      </div>
    )
  }

  // system (default)
  return (
    <div className="flex justify-center my-4">
      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{message.text}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick commands picker
// ---------------------------------------------------------------------------
const QuickCommands = ({ onSelect, disabled }) => {
  const [open,            setOpen]            = useState(false)
  const [activeCategory,  setActiveCategory]  = useState(shellCommands[0]?.category ?? '')
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handlePick = (template) => {
    onSelect(template)
    setOpen(false)
  }

  const category = shellCommands.find(c => c.category === activeCategory)

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        title="פקודות מהירות"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all flex-shrink-0 ${
          disabled
            ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
            : open
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
        }`}
      >
        <Zap size={15} />
        <span className="hidden sm:inline">פקודות מהירות</span>
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2 left-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden"
          style={{ width: 480 }}
          dir="rtl"
        >
          {/* Category tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50 px-2 pt-2 gap-1 flex-shrink-0">
            {shellCommands.map(c => (
              <button
                key={c.category}
                onClick={() => setActiveCategory(c.category)}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === c.category
                    ? 'bg-white text-purple-700 border border-b-white border-gray-200 -mb-px'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {c.category}
              </button>
            ))}
          </div>

          {/* Commands grid */}
          <div className="p-3 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {category?.commands.map(cmd => (
              <button
                key={cmd.label}
                onClick={() => handlePick(cmd.template)}
                className="flex flex-col items-start px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-200 transition-colors text-right group"
              >
                <span className="text-sm font-medium text-gray-800 group-hover:text-purple-700">{cmd.label}</span>
                <span className="text-xs text-gray-400 font-mono mt-0.5 truncate w-full dir-ltr" dir="ltr">{cmd.template}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main overlay
// ---------------------------------------------------------------------------
const LiveSessionOverlay = ({ clientId, clientName, sessionId, onClose }) => {

  // ── Session state ──────────────────────────────────────────────────────────
  const [status,        setStatus]        = useState('connecting')
  const [messages,      setMessages]      = useState([])
  const [inputText,     setInputText]     = useState('')
  const [canSend,       setCanSend]       = useState(false)
  const [deviceInfo,    setDeviceInfo]    = useState(null)
  const [lastHeartbeat, setLastHeartbeat] = useState(null)
  const [isStreaming,   setIsStreaming]   = useState(false)  // shell output streaming

  // ── Screen state ───────────────────────────────────────────────────────────
  const [screenActive,     setScreenActive]     = useState(false)
  const [screenConnecting, setScreenConnecting] = useState(false)
  const [tapIndicators,    setTapIndicators]    = useState([]) // [{id, x, y}]

  // ── Refs ───────────────────────────────────────────────────────────────────
  const socketRef         = useRef(null)
  const messagesEndRef    = useRef(null)
  const inputRef          = useRef(null)
  const sessionEndedRef   = useRef(false)
  const pendingRef        = useRef(new Map())  // id → command text
  const silentCmdsRef     = useRef(new Set())  // ids of tap/screen cmds — suppress output bubbles
  const streamingMsgIdRef = useRef(null)
  const historyRef        = useRef([])
  const historyIdxRef     = useRef(-1)
  const savedInputRef     = useRef('')

  // Screen-specific refs
  const screenWsRef    = useRef(null)
  const decoderRef     = useRef(null)
  const screenCanvasRef = useRef(null)
  const configDataRef  = useRef(null)  // stored SPS/PPS Annex-B bytes
  const initDecoderRef = useRef(null)   // kept in sync below — used for error recovery
  const deviceDimsRef  = useRef(null)  // { realW, realH } — actual device pixel dimensions
  const chunkTsRef     = useRef(0)     // monotonic microsecond timestamp for VideoDecoder
  const pointerDownRef  = useRef(null)  // { deviceX, deviceY, normX, normY, time } — drag detection
  const longPressTimerRef = useRef(null) // setTimeout id for long-press detection
  const longPressFiredRef = useRef(false) // true if long-press already sent (skip tap on pointerUp)
  const screenPanelRef    = useRef(null)  // screen panel div — for keyboard capture

  // ── Keyboard state ─────────────────────────────────────────────────────────
  const [keyboardMode, setKeyboardMode] = useState(false) // when true, keyboard events go to device

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])
  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, msg])
  }, [])

  // ── WebCodecs decoder ──────────────────────────────────────────────────────

  const destroyDecoder = useCallback(() => {
    if (decoderRef.current) {
      try { decoderRef.current.close() } catch (_) {}
      decoderRef.current = null
    }
    configDataRef.current = null
    chunkTsRef.current    = 0
  }, [])

  /**
   * Called once when the SPS/PPS config packet arrives.
   * Creates and configures the VideoDecoder.
   */
  const initDecoder = useCallback((configData) => {
    destroyDecoder()

    if (typeof VideoDecoder === 'undefined') {
      addMessage({ kind: 'error', code: 'NO_WEBCODEECS', text: 'הדפדפן אינו תומך ב-WebCodecs. נסה Chrome/Edge.', timestamp: Date.now() })
      return
    }

    const codec       = getH264CodecString(configData)
    const description = buildAvccDescription(configData)
    console.log('[screen] initDecoder — codec:', codec, 'description bytes:', description?.byteLength ?? 'null')

    const decoder = new VideoDecoder({
      output: (videoFrame) => {
        const canvas = screenCanvasRef.current
        if (!canvas) { videoFrame.close(); return }

        // Set canvas intrinsic size once from the first decoded frame
        if (canvas.width !== videoFrame.codedWidth || canvas.height !== videoFrame.codedHeight) {
          canvas.width  = videoFrame.codedWidth
          canvas.height = videoFrame.codedHeight
          // Real device dimensions are 2× the encoded dimensions (50% scale in ScreenStreamManager)
          deviceDimsRef.current = {
            realW: videoFrame.codedWidth  * 2,
            realH: videoFrame.codedHeight * 2,
          }
          console.log(`[screen] first frame: ${videoFrame.codedWidth}×${videoFrame.codedHeight}`)
        }

        const ctx = canvas.getContext('2d')
        ctx.drawImage(videoFrame, 0, 0)
        videoFrame.close()

        // Mark stream as live on the very first rendered frame
        setScreenConnecting(false)
        setScreenActive(true)
      },
      error: (err) => {
        console.error('[screen] VideoDecoder error:', err.message ?? err)
        if (configDataRef.current) {
          setTimeout(() => initDecoderRef.current?.(configDataRef.current), 100)
        }
      },
    })

    try {
      decoder.configure({ codec, description: description ?? undefined, optimizeForLatency: true })
      console.log('[screen] decoder configured, state:', decoder.state)
      decoderRef.current = decoder
    } catch (err) {
      console.error('[screen] configure failed:', err)
      addMessage({ kind: 'error', code: 'DECODE_INIT', text: `שגיאת אתחול מפענח: ${err.message}`, timestamp: Date.now() })
    }
  }, [destroyDecoder, addMessage])

  // Keep initDecoderRef in sync so the error-recovery callback always calls the latest version
  useEffect(() => { initDecoderRef.current = initDecoder }, [initDecoder])

  /**
   * Process one binary message from the /screen WebSocket.
   * Wire format: [1 byte type][4 bytes size big-endian][N bytes H.264 NAL]
   */
  const handleScreenFrame = useCallback((buffer) => {
    const data = new Uint8Array(buffer)
    if (data.length < 5) return

    const frameType  = data[0]
    const payloadSize = (data[1] << 24) | (data[2] << 16) | (data[3] << 8) | data[4]
    if (data.length < 5 + payloadSize) return

    const payload = data.slice(5, 5 + payloadSize)

    if (frameType === SCREEN_FRAME_CONFIG) {
      // SPS/PPS — store and initialise the decoder
      console.log('[screen] CONFIG received, size:', payloadSize)
      configDataRef.current = payload
      initDecoder(payload)
      return
    }

    if (frameType === SCREEN_FRAME_VIDEO) {
      const decoder = decoderRef.current
      if (!decoder || decoder.state === 'closed') {
        console.warn('[screen] VIDEO frame dropped — decoder not ready, state:', decoder?.state)
        return
      }

      const isKey = isH264Keyframe(payload)

      // Back-pressure: decoder queue too deep — skip delta frames so it can catch up
      if (!isKey && decoder.decodeQueueSize > 4) return

      const avccData = annexBToAvcc(payload)

      try {
        // Real wall-clock µs — correct when frame delivery is irregular (e.g. poor connection)
        // Math.max guards strict monotonicity if two frames arrive within the same µs
        const ts = Math.max(performance.now() * 1000, chunkTsRef.current + 1)
        chunkTsRef.current = ts
        decoder.decode(new EncodedVideoChunk({
          type:      isKey ? 'key' : 'delta',
          timestamp: ts,
          data:      avccData,
        }))
      } catch (err) {
        console.warn('[screen] decode error:', err.message ?? err)
      }
    }
  }, [initDecoder])

  // ── Screen WebSocket management ────────────────────────────────────────────

  const closeScreenWs = useCallback(() => {
    if (screenWsRef.current) {
      screenWsRef.current.onmessage = null
      screenWsRef.current.onclose   = null
      screenWsRef.current.onerror   = null
      try { screenWsRef.current.close(1000, 'session ended') } catch (_) {}
      screenWsRef.current = null
    }
  }, [])

  const stopScreenShare = useCallback(() => {
    closeScreenWs()
    destroyDecoder()
    setScreenActive(false)
    setScreenConnecting(false)
    // Clear canvas
    const canvas = screenCanvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [closeScreenWs, destroyDecoder])

  /**
   * 1. Open the sink WebSocket (so the server has us ready before the device connects)
   * 2. Once the WS is open, tell the device to start streaming via Socket.IO
   */
  const startScreenShare = useCallback(() => {
    if (screenActive || screenConnecting) return
    if (!canSend) return

    if (typeof VideoDecoder === 'undefined') {
      addMessage({ kind: 'error', code: 'NO_WEBCODECS', text: 'הדפדפן אינו תומך ב-WebCodecs API. נא להשתמש ב-Chrome או Edge.', timestamp: Date.now() })
      return
    }

    setScreenConnecting(true)

    const token  = localStorage.getItem('iFilter_authToken') || ''
    const wsUrl  = buildScreenWsUrl(SOCKET_URL, clientId, token)
    const ws     = new WebSocket(wsUrl)
    ws.binaryType = 'arraybuffer'
    screenWsRef.current = ws

    ws.onopen = () => {
      // WS is open — now ask the device to start the stream
      const cmdId = crypto.randomUUID()
      silentCmdsRef.current.add(cmdId)
      socketRef.current?.emit('message', buildEnvelope('cmd', cmdId, { cmd: 'screen_start' }))
    }

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        handleScreenFrame(event.data)
      }
    }

    ws.onerror = () => {
      addMessage({ kind: 'error', code: 'SCREEN_WS', text: 'שגיאה בחיבור שידור המסך', timestamp: Date.now() })
      stopScreenShare()
    }

    ws.onclose = (ev) => {
      if (ev.code !== 1000) {
        // Unexpected close
        setScreenActive(false)
        setScreenConnecting(false)
      }
    }
  }, [screenActive, screenConnecting, canSend, clientId, handleScreenFrame, stopScreenShare, addMessage])

  const handleStopScreen = useCallback(() => {
    const cmdId = crypto.randomUUID()
    silentCmdsRef.current.add(cmdId)
    socketRef.current?.emit('message', buildEnvelope('cmd', cmdId, { cmd: 'screen_stop' }))
    stopScreenShare()
  }, [stopScreenShare])

  // ── Touch / tap forwarding ─────────────────────────────────────────────────

  const addTapIndicator = useCallback((xPct, yPct) => {
    const id = Date.now() + Math.random()
    setTapIndicators(prev => [...prev, { id, x: xPct, y: yPct }])
    setTimeout(() => setTapIndicators(prev => prev.filter(t => t.id !== id)), 650)
  }, [])

  /**
   * Map a pointer event to device coordinates, correcting for object-fit:contain
   * letterboxing — the canvas CSS box may be larger than the rendered content area.
   */
  const getDeviceCoords = useCallback((e) => {
    const canvas = screenCanvasRef.current
    if (!canvas || !deviceDimsRef.current) return null

    const rect = canvas.getBoundingClientRect()

    // Compute the rendered content area inside the CSS box (object-fit: contain)
    const intrinsicAspect = canvas.width / canvas.height
    const cssAspect       = rect.width  / rect.height

    let contentW, contentH, offsetX, offsetY
    if (intrinsicAspect > cssAspect) {
      // Pillarbox: black bars top & bottom
      contentW = rect.width
      contentH = rect.width / intrinsicAspect
      offsetX  = 0
      offsetY  = (rect.height - contentH) / 2
    } else {
      // Letterbox: black bars left & right
      contentH = rect.height
      contentW = rect.height * intrinsicAspect
      offsetX  = (rect.width - contentW) / 2
      offsetY  = 0
    }

    const relX = e.clientX - rect.left - offsetX
    const relY = e.clientY - rect.top  - offsetY

    // Outside the actual video area — ignore
    if (relX < 0 || relX > contentW || relY < 0 || relY > contentH) return null

    const normX   = relX / contentW
    const normY   = relY / contentH
    const deviceX = Math.round(normX * deviceDimsRef.current.realW)
    const deviceY = Math.round(normY * deviceDimsRef.current.realH)

    return { normX, normY, deviceX, deviceY }
  }, [])

  const sendSilentShell = useCallback((args) => {
    const id = crypto.randomUUID()
    silentCmdsRef.current.add(id)
    socketRef.current?.emit('message', buildEnvelope('cmd', id, { cmd: 'shell', args, stream: false }))
  }, [])

  // ── Long-press threshold ───────────────────────────────────────────────────
  const LONG_PRESS_MS = 500

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handlePointerDown = useCallback((e) => {
    if (!canSend || !deviceDimsRef.current) return
    const coords = getDeviceCoords(e)
    if (!coords) return
    e.currentTarget.setPointerCapture(e.pointerId)
    longPressFiredRef.current = false
    pointerDownRef.current = { ...coords, time: Date.now() }

    // Start long-press timer
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      if (!pointerDownRef.current) return
      const start = pointerDownRef.current
      longPressFiredRef.current = true
      // Long press = swipe to same point with long duration
      sendSilentShell(`input swipe ${start.deviceX} ${start.deviceY} ${start.deviceX} ${start.deviceY} 800`)
      addTapIndicator(start.normX * 100, start.normY * 100)
    }, LONG_PRESS_MS)
  }, [canSend, getDeviceCoords, clearLongPressTimer, sendSilentShell, addTapIndicator])

  const handlePointerMove = useCallback((e) => {
    if (!pointerDownRef.current) return
    const coords = getDeviceCoords(e)
    if (!coords) return
    // If finger moved significantly, cancel long-press (it's a drag)
    const dx = coords.deviceX - pointerDownRef.current.deviceX
    const dy = coords.deviceY - pointerDownRef.current.deviceY
    if (Math.sqrt(dx * dx + dy * dy) > 20) {
      clearLongPressTimer()
    }
  }, [getDeviceCoords, clearLongPressTimer])

  const handlePointerUp = useCallback((e) => {
    clearLongPressTimer()
    if (!canSend || !pointerDownRef.current) return
    const start = pointerDownRef.current
    pointerDownRef.current = null

    // If long-press already fired, don't also send a tap
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false
      return
    }

    const end = getDeviceCoords(e)
    if (!end) return

    const dx       = end.deviceX - start.deviceX
    const dy       = end.deviceY - start.deviceY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const duration = Math.max(Date.now() - start.time, 80)

    if (distance > 20) {
      // Swipe / drag
      sendSilentShell(
        `input swipe ${start.deviceX} ${start.deviceY} ${end.deviceX} ${end.deviceY} ${duration}`
      )
      addTapIndicator(start.normX * 100, start.normY * 100)
      addTapIndicator(end.normX   * 100, end.normY   * 100)
    } else {
      // Tap
      sendSilentShell(`input tap ${end.deviceX} ${end.deviceY}`)
      addTapIndicator(end.normX * 100, end.normY * 100)
    }
  }, [canSend, getDeviceCoords, sendSilentShell, addTapIndicator, clearLongPressTimer])

  const handlePointerCancel = useCallback(() => {
    clearLongPressTimer()
    longPressFiredRef.current = false
    pointerDownRef.current = null
  }, [clearLongPressTimer])

  // ── Scroll / wheel forwarding ──────────────────────────────────────────────

  const handleWheel = useCallback((e) => {
    if (!canSend || !deviceDimsRef.current) return
    e.preventDefault()

    const coords = getDeviceCoords(e)
    if (!coords) return

    const { deviceX, deviceY } = coords
    const scrollAmount = Math.min(Math.abs(e.deltaY), 600)
    const distance     = Math.max(Math.round(scrollAmount * 1.5), 100)

    if (e.deltaY > 0) {
      // Scroll down — swipe up
      sendSilentShell(`input swipe ${deviceX} ${deviceY} ${deviceX} ${Math.max(deviceY - distance, 0)} 200`)
    } else {
      // Scroll up — swipe down
      const maxY = deviceDimsRef.current.realH
      sendSilentShell(`input swipe ${deviceX} ${deviceY} ${deviceX} ${Math.min(deviceY + distance, maxY)} 200`)
    }
  }, [canSend, getDeviceCoords, sendSilentShell])

  // ── Keyboard forwarding ────────────────────────────────────────────────────

  // Android keyevent codes for special keys
  const KEY_MAP = {
    Backspace:  67,
    Enter:      66,
    Tab:        61,
    Escape:     111,
    ArrowUp:    19,
    ArrowDown:  20,
    ArrowLeft:  21,
    ArrowRight: 22,
    Delete:     112,
    Home:       122,  // KEYCODE_MOVE_HOME
    End:        123,  // KEYCODE_MOVE_END
    ' ':        62,   // KEYCODE_SPACE
  }

  const handleScreenKeyDown = useCallback((e) => {
    if (!canSend || !keyboardMode || !screenActive) return

    // Don't capture if a text input is focused
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    e.preventDefault()

    const androidKeyCode = KEY_MAP[e.key]
    if (androidKeyCode !== undefined) {
      sendSilentShell(`input keyevent ${androidKeyCode}`)
    } else if (e.key.length === 1) {
      // Single printable character — use `input text`
      // Escape shell-sensitive characters
      const escaped = e.key.replace(/'/g, "'\\''")
      sendSilentShell(`input text '${escaped}'`)
    }
  }, [canSend, keyboardMode, screenActive, sendSilentShell])

  // Attach keyboard listener to window when keyboard mode is active
  useEffect(() => {
    if (!keyboardMode || !screenActive) return
    window.addEventListener('keydown', handleScreenKeyDown)
    return () => window.removeEventListener('keydown', handleScreenKeyDown)
  }, [keyboardMode, screenActive, handleScreenKeyDown])

  // ── Navigation buttons ─────────────────────────────────────────────────────

  const sendNavButton = useCallback((keycode) => {
    if (!canSend) return
    sendSilentShell(`input keyevent ${keycode}`)
  }, [canSend, sendSilentShell])

  // ── Socket.IO setup ────────────────────────────────────────────────────────
  useEffect(() => {
    const token  = localStorage.getItem('iFilter_authToken') || ''
    const socket = io(SOCKET_URL, {
      auth: { token, clientId, role: 'admin' },
      reconnectionAttempts: 3,
      timeout: 8000,
    })
    socketRef.current = socket

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

    // ── Protocol v1 message handler ──────────────────────────────────────────
    socket.on('message', (envelope) => {
      const { v, type, id, payload, from } = envelope

      if (from === 'server') {
        addMessage({ kind: 'error', code: payload?.code, text: payload?.message || 'שגיאת שרת', timestamp: Date.now() })
        return
      }

      if (v !== PROTOCOL_VERSION) return

      switch (type) {

        case 'stream': {
          const line = payload?.line ?? ''
          if (streamingMsgIdRef.current === id) {
            setMessages(prev => prev.map(m =>
              m.id === id && Array.isArray(m.lines) ? { ...m, lines: [...m.lines, line] } : m
            ))
          }
          break
        }

        case 'res': {
          const cmd = payload?.cmd

          // Tap / screen control commands — suppress output bubbles
          if (silentCmdsRef.current.has(id)) {
            silentCmdsRef.current.delete(id)
            pendingRef.current.delete(id)
            break
          }

          pendingRef.current.delete(id)

          if (cmd === 'shell') {
            if (streamingMsgIdRef.current === id) {
              streamingMsgIdRef.current = null
              setIsStreaming(false)
              setMessages(prev => prev.map(m =>
                m.id === id ? { ...m, streaming: false, exitCode: payload.exitCode ?? 0 } : m
              ))
            } else {
              addMessage({
                kind: 'output',
                text: payload.stdout ?? '',
                exitCode: payload.exitCode ?? 0,
                id,
                timestamp: envelope.relayedAt || Date.now(),
              })
            }
          } else if (cmd === 'pong') {
            addMessage({ kind: 'system', text: `Ping: ${payload.latency ?? '?'}ms`, timestamp: Date.now() })
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
          if (silentCmdsRef.current.has(id)) {
            silentCmdsRef.current.delete(id)
            break
          }
          pendingRef.current.delete(id)
          addMessage({
            kind: 'error',
            code: payload?.code,
            text: payload?.message || 'שגיאה לא ידועה',
            timestamp: envelope.relayedAt || Date.now(),
          })
          break
        }

        default: break
      }
    })

    return () => {
      if (!sessionEndedRef.current && sessionId) {
        apiClient.endLiveSession(sessionId).catch(() => {})
      }
      socket.disconnect()
    }
  }, [clientId, sessionId, addMessage])

  // Stop screen stream on unmount
  useEffect(() => {
    return () => {
      closeScreenWs()
      destroyDecoder()
    }
  }, [closeScreenWs, destroyDecoder])

  // ── Send helpers ───────────────────────────────────────────────────────────
  const sendMessage = () => {
    const text = inputText.trim()
    if (!text || !canSend || !socketRef.current || isStreaming) return

    const id = crypto.randomUUID()
    let envelope
    let isShellCmd = false

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

    const hist = historyRef.current
    if (hist[hist.length - 1] !== text) hist.push(text)
    historyIdxRef.current = -1
    savedInputRef.current = ''

    setInputText('')
    inputRef.current?.focus()

    if (isShellCmd) {
      addMessage({ kind: 'output', lines: [], streaming: true, exitCode: null, id, timestamp: Date.now() })
      streamingMsgIdRef.current = id
      setIsStreaming(true)
    }
  }

  const sendStop = () => {
    socketRef.current?.emit('message', buildEnvelope('cmd', crypto.randomUUID(), { cmd: 'stop' }))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); return }

    const hist = historyRef.current
    if (!hist.length) return

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIdxRef.current === -1) {
        savedInputRef.current = inputText
        historyIdxRef.current = hist.length - 1
      } else if (historyIdxRef.current > 0) {
        historyIdxRef.current -= 1
      }
      setInputText(hist[historyIdxRef.current])
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdxRef.current === -1) return
      if (historyIdxRef.current < hist.length - 1) {
        historyIdxRef.current += 1
        setInputText(hist[historyIdxRef.current])
      } else {
        historyIdxRef.current = -1
        setInputText(savedInputRef.current)
      }
    }
  }

  const endSession = () => {
    sessionEndedRef.current = true
    handleStopScreen()
    socketRef.current?.emit('session:end')
    if (sessionId) apiClient.endLiveSession(sessionId).catch(() => {})
    onClose()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const showScreen = screenActive || screenConnecting

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50" dir="rtl" aria-label="שיחה חיה עם לקוח">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">

        {/* Right: back + title */}
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="חזור">
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

        {/* Center: status + heartbeat + screen toggle */}
        <div className="flex items-center gap-3">
          <StatusPill status={status} />

          {lastHeartbeat && (
            <span className="text-xs text-gray-400 tabular-nums" title="heartbeat אחרון">
              ♥ {new Date(lastHeartbeat).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}

          {/* Screen share toggle */}
          {canSend && (
            screenActive ? (
              <button
                onClick={handleStopScreen}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-300 rounded-lg transition-colors"
                title="עצור שיתוף מסך"
              >
                <Monitor size={15} className="text-green-600" />
                מסך פעיל
              </button>
            ) : screenConnecting ? (
              <button disabled className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg cursor-wait">
                <Loader size={14} className="animate-spin" />
                מתחבר...
              </button>
            ) : (
              <button
                onClick={startScreenShare}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                title="שתף מסך"
              >
                <MonitorOff size={15} />
                הצג מסך
              </button>
            )
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

      {/* ── Content area — splits when screen is active ──────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden" dir="ltr">

        {/* ── Screen panel (left) — only rendered when screen is on ───────── */}
        {showScreen && (
          <div className="flex flex-col bg-black border-r border-gray-800" style={{ width: '42%', minWidth: 320 }}>

            {/* Canvas + tap overlay */}
            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
              {screenConnecting && !screenActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 z-10">
                  <Loader size={32} className="animate-spin text-purple-400" />
                  <span className="text-sm">ממתין לשידור מהמכשיר...</span>
                </div>
              )}

              {/* The canvas — CSS scales it to fit the panel, object-contain keeps ratio */}
              <canvas
                ref={screenCanvasRef}
                className="max-w-full max-h-full object-contain"
                style={{
                  cursor:     canSend ? 'crosshair' : 'default',
                  opacity:    screenConnecting && !screenActive ? 0 : 1,
                  userSelect: 'none',
                  touchAction: 'none',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onWheel={handleWheel}
              />

              {/* Tap ripple indicators */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {tapIndicators.map(t => (
                  <span
                    key={t.id}
                    className="absolute block w-7 h-7 rounded-full border-2 border-white animate-ping"
                    style={{
                      left:      `${t.x}%`,
                      top:       `${t.y}%`,
                      transform: 'translate(-50%, -50%)',
                      opacity:   0.75,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Navigation bar + controls */}
            <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800">
              {/* Nav buttons row */}
              <div className="flex items-center justify-center gap-6 py-2.5">
                {/* Back */}
                <button
                  onClick={() => sendNavButton(4)}
                  disabled={!canSend}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Back"
                >
                  <ChevronLeft size={22} />
                </button>

                {/* Home */}
                <button
                  onClick={() => sendNavButton(3)}
                  disabled={!canSend}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Home"
                >
                  <Circle size={20} />
                </button>

                {/* Recents */}
                <button
                  onClick={() => sendNavButton(187)}
                  disabled={!canSend}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Recents"
                >
                  <LayoutGrid size={20} />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-700" />

                {/* Keyboard toggle */}
                <button
                  onClick={() => setKeyboardMode(v => !v)}
                  disabled={!canSend || !screenActive}
                  className={`p-2.5 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    keyboardMode
                      ? 'text-purple-400 bg-purple-900/40 hover:bg-purple-900/60'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title={keyboardMode ? 'מקלדת פעילה — הקלדה נשלחת למכשיר' : 'הפעל מקלדת'}
                >
                  <Keyboard size={20} />
                </button>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between px-4 py-1.5 border-t border-gray-800" dir="rtl">
                <span className="text-xs text-gray-500">
                  {deviceDimsRef.current
                    ? `${deviceDimsRef.current.realW}×${deviceDimsRef.current.realH}`
                    : 'מחכה לנתוני מסך...'}
                </span>
                <span className="text-xs text-gray-600">
                  {keyboardMode
                    ? 'מקלדת פעילה — הקש מקשים לשליחה למכשיר'
                    : 'לחץ · החלק · גלגל · לחיצה ארוכה'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Terminal panel (right, or full-width when no screen) ─────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" dir="rtl">

          {/* Messages */}
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

          {/* Input */}
          <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <QuickCommands
                disabled={!canSend || isStreaming}
                onSelect={(template) => {
                  setInputText(template)
                  inputRef.current?.focus()
                }}
              />
              <div className="flex-1 flex items-end gap-2 px-4 py-3 rounded-xl border transition-colors bg-white border-gray-300 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100">
                <span className="text-gray-400 font-mono text-sm select-none pb-0.5 flex-shrink-0">$</span>
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!canSend}
                  dir="ltr"
                  placeholder={
                    !canSend
                      ? 'ממתין ללקוח להתחבר...'
                      : isStreaming
                        ? 'פקודה רצה... לחץ ■ לעצירה'
                        : 'shell command, /ping, /info'
                  }
                  rows={1}
                  className={`flex-1 resize-none text-sm font-mono outline-none bg-transparent ${
                    canSend ? 'text-gray-800 placeholder-gray-400' : 'text-gray-400 placeholder-gray-300 cursor-not-allowed'
                  }`}
                  style={{ maxHeight: '120px', overflowY: 'auto' }}
                />
              </div>

              {isStreaming ? (
                <button onClick={sendStop} className="flex-shrink-0 p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all" title="Ctrl+C">
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
                >
                  <Send size={18} />
                </button>
              )}
            </div>

            <p className="text-center text-xs text-gray-400 mt-2">
              Enter לשליחה · Shift+Enter לשורה חדשה · ↑↓ היסטוריית פקודות · /ping · /info
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveSessionOverlay
