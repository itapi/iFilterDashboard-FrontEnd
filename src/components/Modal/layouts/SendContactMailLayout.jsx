import { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import apiClient from '../../../utils/api'

export const SendContactMailLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const contact  = data?.contact  || {}
  const template = data?.template || {}

  const resolvedBody = template.body
    ? template.body.replace(/\{full_name\}/gi, contact.name || '')
    : ''

  const [email, setEmail]     = useState(contact.email || '')
  const [subject, setSubject] = useState(template.title || 'הודעה מ-iFilter')
  const [body, setBody]       = useState(resolvedBody)
  const [sending, setSending] = useState(false)

  useImperativeHandle(ref, () => ({
    submitForm: handleSend,
  }))

  const handleSend = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('יש להזין כתובת מייל תקינה')
      return
    }
    if (!body.trim()) {
      toast.error('תוכן ההודעה לא יכול להיות ריק')
      return
    }

    try {
      setSending(true)
      const res = await apiClient.sendContactMail(contact.id, subject, body, email.trim())
      if (!res.success) throw new Error(res.message)

      toast.success('מייל נשלח בהצלחה')
      data?.onSent?.(contact.id)
      closeModal()
    } catch (e) {
      toast.error(e.message || 'שגיאה בשליחת המייל')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 space-y-4" dir="rtl">
      {/* Recipient */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          כתובת מייל <span className="text-red-500">*</span>
          {!contact.email && <span className="text-xs text-amber-500 mr-2">לא קיימת כתובת — הזן ידנית</span>}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 flex-shrink-0">{contact.name}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending}
            placeholder="example@email.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">נושא</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={sending}
          placeholder="נושא המייל..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          תוכן ההודעה <span className="text-red-500">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={sending}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-left" dir="ltr">{body.length} chars</p>
      </div>
    </div>
  )
})

SendContactMailLayout.displayName = 'SendContactMailLayout'
