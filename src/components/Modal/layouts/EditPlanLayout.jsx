import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'

/**
 * Edit Plan Layout
 *
 * Used for editing filtering plan details
 *
 * Usage:
 * const { openModal } = useGlobalState()
 *
 * openModal({
 *   layout: 'editPlan',
 *   title: 'עריכת תכנית סינון',
 *   data: {
 *     plan: planObject,
 *     onSave: async (planData) => {
 *       // Handle save logic
 *     }
 *   },
 *   confirmText: 'שמור שינויים',
 *   cancelText: 'ביטול'
 * })
 */
export const EditPlanLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const { plan, onSave } = data

  const [formData, setFormData] = useState({
    plan_name: plan?.plan_name || '',
    plan_price: plan?.plan_price || '',
    plan_description: plan?.plan_description || plan?.description || '',
    plan_feature1: plan?.plan_feature1 || plan?.feature1 || '',
    plan_feature2: plan?.plan_feature2 || plan?.feature2 || '',
    plan_feature3: plan?.plan_feature3 || plan?.feature3 || ''
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
    if (!formData.plan_name.trim()) {
      toast.error('נא למלא שם תכנית')
      return
    }

    try {
      setIsSubmitting(true)

      if (onSave) {
        await onSave(formData)
      }

      toast.success('תכנית עודכנה בהצלחה')
      closeModal()
    } catch (error) {
      console.error('Error updating plan:', error)
      toast.error('שגיאה בעדכון התכנית')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="space-y-6">
        {/* Plan Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            שם התכנית <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.plan_name}
            onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="לדוגמה: תכנית בסיסית"
            disabled={isSubmitting}
          />
        </div>

        {/* Plan Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            מחיר (₪)
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.plan_price}
              onChange={(e) => setFormData({ ...formData, plan_price: e.target.value })}
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="0"
              min="0"
              step="0.01"
              disabled={isSubmitting}
            />
            <div className="absolute right-3 top-3 text-gray-400 font-medium">₪</div>
          </div>
        </div>

        {/* Plan Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            תיאור קצר
          </label>
          <textarea
            value={formData.plan_description}
            onChange={(e) => setFormData({ ...formData, plan_description: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="תיאור קצר על התכנית..."
            rows="3"
            disabled={isSubmitting}
          />
        </div>

        {/* Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            תכונות התכנית
          </h3>

          {[1, 2, 3].map((num) => (
            <div key={num}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תכונה {num}
              </label>
              <input
                type="text"
                value={formData[`plan_feature${num}`]}
                onChange={(e) => setFormData({ ...formData, [`plan_feature${num}`]: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={`תכונה מספר ${num}...`}
                disabled={isSubmitting}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

EditPlanLayout.displayName = 'EditPlanLayout'
