import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'

/**
 * Example Form Layout
 *
 * This is an example of a modal layout that uses forwardRef
 * to expose a submitForm method that can be called by the GlobalModal
 *
 * Usage:
 * const { openModal } = useGlobalState()
 *
 * openModal({
 *   layout: 'exampleForm',
 *   title: 'טופס לדוגמה',
 *   data: { initialValue: 'some value' },
 *   onDataReceived: (data) => {
 *     console.log('Received data:', data)
 *   }
 * })
 */
export const ExampleFormLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const [formData, setFormData] = useState({
    name: data?.initialName || '',
    description: data?.initialDescription || '',
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
    if (!formData.name.trim()) {
      toast.error('נא למלא את השם')
      return
    }

    try {
      setIsSubmitting(true)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Call the callback with the data
      if (data?.onDataReceived) {
        data.onDataReceived(formData)
      }

      toast.success('הטופס נשמר בהצלחה')
      closeModal()
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('שגיאה בשמירת הטופס')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            שם
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="הכנס שם..."
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תיאור
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="הכנס תיאור..."
            rows={4}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  )
})

ExampleFormLayout.displayName = 'ExampleFormLayout'
