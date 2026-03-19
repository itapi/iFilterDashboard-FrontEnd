import { forwardRef, useImperativeHandle, useState } from 'react'
import { Mail, User, MessageSquare } from 'lucide-react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import apiClient from '../../../utils/api'

const WebInquiryResponseLayout = forwardRef(({ data }, ref) => {
  const { inquiry, adminName, onSent } = data || {}
  const { closeModal } = useGlobalState()

  const [responseText, setResponseText]   = useState('')
  const [responderName, setResponderName] = useState(adminName || '')
  const [isSubmitting, setIsSubmitting]   = useState(false)

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      await handleSubmit()
    }
  }))

  const handleSubmit = async () => {
    if (!responseText.trim()) {
      toast.error('יש להזין תוכן לתשובה')
      return
    }

    setIsSubmitting(true)
    try {
      await toast.promise(
        apiClient.respondToWebInquiry(
          inquiry.id,
          responseText.trim(),
          responderName.trim() || 'צוות iFilter'
        ).then(res => {
          if (!res.success) throw new Error(res.error || 'שגיאה בשליחת המייל')
          return res
        }),
        {
          pending: 'שולח מייל...',
          success: `המייל נשלח בהצלחה אל ${inquiry.email}`,
          error: { render: ({ data }) => data?.message || 'שגיאה בשליחת המייל' },
        }
      )
      onSent?.(inquiry.id, 'responded')
      closeModal()
    } catch {
      // error already shown by toast.promise
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('he-IL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-5" dir="rtl">

      {/* Original inquiry reference */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            הפנייה המקורית — {formatDate(inquiry?.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-bold text-sm">
              {inquiry?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{inquiry?.full_name}</p>
            <p className="text-xs text-gray-400">{inquiry?.email}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 whitespace-pre-wrap">
          {inquiry?.content}
        </p>
      </div>

      {/* Responder name */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
          <User className="w-4 h-4 text-gray-400" />
          שם הנציג
        </label>
        <input
          type="text"
          value={responderName}
          onChange={e => setResponderName(e.target.value)}
          placeholder="צוות iFilter"
          disabled={isSubmitting}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400
                     transition disabled:opacity-60"
        />
      </div>

      {/* Response textarea */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
          <Mail className="w-4 h-4 text-gray-400" />
          תוכן התשובה
          <span className="text-red-500 mr-0.5">*</span>
        </label>
        <textarea
          value={responseText}
          onChange={e => setResponseText(e.target.value)}
          placeholder={`שלום ${inquiry?.full_name || ''},\n\nתודה שפנית אלינו...`}
          rows={7}
          disabled={isSubmitting}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm leading-relaxed
                     focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400
                     resize-none transition placeholder:text-gray-300 disabled:opacity-60"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          הטקסט יישלח בתוך תבנית מייל מעוצבת ומקצועית לכתובת{' '}
          <span className="font-medium text-gray-500">{inquiry?.email}</span>
        </p>
      </div>

    </div>
  )
})

WebInquiryResponseLayout.displayName = 'WebInquiryResponseLayout'
export default WebInquiryResponseLayout
