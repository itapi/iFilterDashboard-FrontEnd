import { forwardRef, useImperativeHandle, useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { Upload, FileText, CheckSquare, Square, AlertCircle, User } from 'lucide-react'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import apiClient from '../../../utils/api'

// ── VCF parser ────────────────────────────────────────────────────────────────

// Decode quoted-printable UTF-8: collects consecutive =XX bytes and runs them
// through TextDecoder so multi-byte Hebrew sequences come out correctly.
function decodeQP(str) {
  return str.replace(/((?:=[0-9A-Fa-f]{2})+)/g, (match) => {
    const bytes = match.match(/=[0-9A-Fa-f]{2}/g).map((h) => parseInt(h.slice(1), 16))
    try {
      return new TextDecoder('utf-8').decode(new Uint8Array(bytes))
    } catch {
      return match
    }
  })
}

function decodeEscapes(str) {
  return str
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

function parseVcf(text) {
  // Unfold soft line-breaks (CRLF or LF followed by a space/tab)
  const unfolded = text.replace(/\r?\n[ \t]/g, '')

  const contacts = []
  const blocks = unfolded.split(/BEGIN:VCARD/i).slice(1)

  for (const block of blocks) {
    const contact = { name: '', phone: '', email: '' }
    const lines = block.split(/\r?\n/)

    for (const raw of lines) {
      const colonIdx = raw.indexOf(':')
      if (colonIdx === -1) continue

      const keyFull  = raw.slice(0, colonIdx)
      const rawValue = raw.slice(colonIdx + 1)
      const keyParts = keyFull.toUpperCase().split(';')
      const key      = keyParts[0]
      const params   = keyParts.slice(1)

      const isQP = params.some((p) => p === 'ENCODING=QUOTED-PRINTABLE')
      const value = decodeEscapes(isQP ? decodeQP(rawValue) : rawValue.trim())

      if (key === 'FN' && !contact.name) {
        contact.name = value
      } else if (key === 'N' && !contact.name) {
        // "Last;First;Middle;Prefix;Suffix" — join first + last
        const parts = value.split(';').map((p) => p.trim()).filter(Boolean)
        contact.name = parts.length >= 2
          ? `${parts[1]} ${parts[0]}`.trim()
          : parts[0] || ''
      } else if (key === 'TEL' && !contact.phone) {
        contact.phone = rawValue.trim().replace(/\s/g, '')
      } else if (key === 'EMAIL' && !contact.email) {
        contact.email = rawValue.trim()
      }
    }

    if (contact.name.trim()) contacts.push(contact)
  }

  return contacts
}

// ── Component ─────────────────────────────────────────────────────────────────
export const VcfImportLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const fileRef = useRef(null)

  const [step, setStep]           = useState('upload')   // 'upload' | 'review' | 'importing'
  const [parsed, setParsed]       = useState([])
  const [selected, setSelected]   = useState(new Set())
  const [dragging, setDragging]   = useState(false)
  const [fileName, setFileName]   = useState('')

  useImperativeHandle(ref, () => ({
    submitForm: handleConfirm,
  }))

  const processFile = (file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.vcf') && file.type !== 'text/vcard') {
      toast.error('יש לבחור קובץ VCF בלבד')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const contacts = parseVcf(e.target.result)
      if (contacts.length === 0) {
        toast.error('לא נמצאו אנשי קשר בקובץ')
        return
      }
      setParsed(contacts)
      setSelected(new Set(contacts.map((_, i) => i)))
      setStep('review')
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  const toggleOne = (i) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === parsed.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(parsed.map((_, i) => i)))
    }
  }

  const handleConfirm = async () => {
    if (step === 'upload') {
      toast.error('יש לבחור קובץ VCF תחילה')
      return
    }
    if (selected.size === 0) {
      toast.error('לא נבחר אף איש קשר')
      return
    }

    const toImport = [...selected].map((i) => ({
      name:     parsed[i].name,
      phone:    parsed[i].phone,
      email:    parsed[i].email,
      notes:    '',
      category: '',
    }))

    setStep('importing')

    try {
      const res = await apiClient.batchInsertContacts(toImport)
      if (!res.success) throw new Error(res.message)

      toast.success(`יובאו ${res.data.count} אנשי קשר בהצלחה`)
      if (res.data.failed > 0) toast.error(`${res.data.failed} אנשי קשר נכשלו`)

      data?.onImport?.(res.data.inserted)
    } catch {
      toast.error('שגיאה בייבוא אנשי קשר')
    }

    closeModal()
  }

  // ── Upload step ──────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="p-6" dir="rtl">
        <div
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
          }`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">גרור קובץ VCF לכאן</p>
          <p className="text-gray-400 text-sm mt-1">או לחץ לבחירת קובץ</p>
          <input
            ref={fileRef}
            type="file"
            accept=".vcf,text/vcard"
            className="hidden"
            onChange={(e) => processFile(e.target.files[0])}
          />
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>ניתן לייצא קובץ VCF מאנשי הקשר של הטלפון: אנשי קשר ← תפריט ← ייצוא</span>
        </div>
      </div>
    )
  }

  // ── Importing step ───────────────────────────────────────────────────────
  if (step === 'importing') {
    return (
      <div className="p-8 text-center" dir="rtl">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">מייבא {selected.size} אנשי קשר...</p>
      </div>
    )
  }

  // ── Review step ──────────────────────────────────────────────────────────
  const allChecked = selected.size === parsed.length
  const someChecked = selected.size > 0 && !allChecked

  return (
    <div dir="rtl">
      {/* File info bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <FileText className="w-4 h-4" />
          <span className="font-medium">{fileName}</span>
          <span className="text-blue-400">— {parsed.length} אנשי קשר נמצאו</span>
        </div>
        <span className="text-sm font-semibold text-blue-700">
          {selected.size} נבחרו
        </span>
      </div>

      {/* Select all */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleAll}
      >
        {allChecked ? (
          <CheckSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
        ) : someChecked ? (
          <div className="w-4 h-4 border-2 border-blue-400 rounded flex-shrink-0 bg-blue-100" />
        ) : (
          <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
        )}
        <span className="text-sm font-medium text-gray-600">
          {allChecked ? 'בטל בחירת הכל' : 'בחר הכל'}
        </span>
      </div>

      {/* Contact list */}
      <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
        {parsed.map((contact, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${
              selected.has(i) ? 'bg-white hover:bg-blue-50/40' : 'bg-gray-50/60 hover:bg-gray-100'
            }`}
            onClick={() => toggleOne(i)}
          >
            {selected.has(i) ? (
              <CheckSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
            )}

            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-blue-500" />
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${selected.has(i) ? 'text-gray-800' : 'text-gray-400'}`}>
                {contact.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {[contact.phone, contact.email].filter(Boolean).join(' · ') || 'אין פרטים'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

VcfImportLayout.displayName = 'VcfImportLayout'
