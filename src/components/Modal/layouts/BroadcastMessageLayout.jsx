import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'

/**
 * Broadcast Message Layout
 *
 * Used for creating or editing broadcast messages
 *
 * Usage:
 * const { openModal } = useGlobalState()
 *
 * openModal({
 *   layout: 'broadcastMessage',
 *   title: 'שדר הודעה חדשה',
 *   data: {
 *     message: null, // or existing message object for edit mode
 *     onSave: async (messageData) => {
 *       // Handle save logic
 *       console.log('Saving message:', messageData)
 *     }
 *   },
 *   confirmText: 'שמור',
 *   cancelText: 'ביטול'
 * })
 */
export const BroadcastMessageLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const isEditMode = !!data?.message

  const [formData, setFormData] = useState({
    title: data?.message?.title || '',
    message: data?.message?.message || '',
    expiry_date: data?.message?.expiry_date
      ? new Date(data.message.expiry_date).toISOString().slice(0, 16)
      : '',
    is_active: data?.message?.is_active !== undefined ? data.message.is_active : true
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Expose submitForm method to parent
  useImperativeHandle(ref, () => ({
    submitForm: async () => {
      await handleSubmit()
    }
  }))

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error('נא למלא כותרת')
      return
    }
    if (!formData.message.trim()) {
      toast.error('נא למלא תוכן ההודעה')
      return
    }

    try {
      setIsSubmitting(true)

      // Call the callback with the data
      if (data?.onSave) {
        await data.onSave(formData)
      }

      toast.success(isEditMode ? 'ההודעה עודכנה בהצלחה' : 'ההודעה נשלחה בהצלחה')
      closeModal()
    } catch (error) {
      console.error('Error saving message:', error)
      toast.error('שגיאה בשמירת ההודעה')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="space-y-4">
        {/* Title field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            כותרת <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="הכנס כותרת להודעה..."
            disabled={isSubmitting}
          />
        </div>

        {/* Message field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תוכן ההודעה <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="הכנס את תוכן ההודעה..."
            rows={6}
            disabled={isSubmitting}
          />
        </div>

        {/* Expiry date field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תאריך תפוגה
          </label>
          <input
            type="datetime-local"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            אופציונלי - אם לא מוגדר, ההודעה תוצג עד שתושבת באופן ידני
          </p>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              הודעה פעילה
            </label>
            <p className="text-xs text-gray-500 mt-1">
              האם להציג את ההודעה למשתמשים
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.is_active ? 'bg-purple-600' : 'bg-gray-300'
            }`}
            disabled={isSubmitting}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.is_active ? 'translate-x-1' : 'translate-x-6'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
})

BroadcastMessageLayout.displayName = 'BroadcastMessageLayout'
