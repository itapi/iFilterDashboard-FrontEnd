import { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import apiClient from '../../../utils/api'

export const SendResellerMailLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const reseller = data?.reseller || {}

  const defaultSubject = 'ברוכים הבאים כמשווק iFilter'
  const defaultBody =
    `שלום ${reseller.full_name || ''},\n\nאנו שמחים לבשר לך כי בקשתך להצטרף לרשת המשווקים של iFilter אושרה.\n\nמעכשיו תוכל/י לשווק את מוצרי iFilter ולהציע אותם ללקוחותיך.\n\nלפרטים נוספים ניתן לפנות אלינו.\n\nבברכה,\nצוות iFilter`

  const [email, setEmail]     = useState(reseller.email || '')
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody]       = useState(defaultBody)
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

    setSending(true)
    const promise = (async () => {
      const acceptRes = await apiClient.acceptReseller(reseller.id, true)
      if (!acceptRes.success) throw new Error(acceptRes.error || 'שגיאה באישור המשווק')

      const mailRes = await apiClient.sendResellerMail(reseller.id, subject, body, email.trim())
      if (!mailRes.success) throw new Error(mailRes.error || 'שגיאה בשליחת המייל')
    })()

    toast.promise(promise, {
      pending: 'מאשר ושולח מייל...',
      success: { render: 'המשווק אושר והמייל נשלח בהצלחה', autoClose: 3000 },
      error:   { render: ({ data }) => data?.message || 'שגיאה' },
    })

    try {
      await promise
      data?.onAccepted?.(reseller.id)
      closeModal()
    } catch {
      // error already shown by toast.promise
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          כתובת מייל <span className="text-red-500">*</span>
          {!reseller.email && <span className="text-xs text-amber-500 mr-2">לא קיימת כתובת — הזן ידנית</span>}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 flex-shrink-0">{reseller.full_name}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending}
            placeholder="example@email.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">נושא</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={sending}
          placeholder="נושא המייל..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          תוכן ההודעה <span className="text-red-500">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={sending}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-left" dir="ltr">{body.length} chars</p>
      </div>
    </div>
  )
})

SendResellerMailLayout.displayName = 'SendResellerMailLayout'
