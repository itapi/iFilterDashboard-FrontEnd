import { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { XCircle } from 'lucide-react'
import { useGlobalState } from '../../../contexts/GlobalStateContext'

/**
 * ReviewRejectLayout
 *
 * openModal({
 *   layout: 'reviewReject',
 *   title: 'דחיית בקשה',
 *   size: 'sm',
 *   data: {
 *     domain: 'example.com',
 *     onConfirm: async (notes) => { ... }
 *   },
 *   confirmText: 'דחה בקשה',
 *   cancelText: 'ביטול'
 * })
 */
export const ReviewRejectLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      try {
        setIsSubmitting(true)
        if (data?.onConfirm) await data.onConfirm(notes)
        closeModal()
      } catch {
        toast.error('שגיאה בעדכון הבקשה')
      } finally {
        setIsSubmitting(false)
      }
    }
  }))

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-center mb-5">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <XCircle className="w-7 h-7 text-red-600" />
        </div>
      </div>

      <p className="text-center text-gray-800 font-medium mb-1">
        דחיית הבקשה עבור
      </p>
      <p className="text-center text-sm font-mono bg-gray-100 rounded px-2 py-1 text-gray-700 mb-5">
        {data?.domain}
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          הערות מנהל <span className="text-gray-400 font-normal">— אופציונלי</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
          placeholder="סיבת הדחייה..."
          disabled={isSubmitting}
        />
      </div>
    </div>
  )
})

ReviewRejectLayout.displayName = 'ReviewRejectLayout'
