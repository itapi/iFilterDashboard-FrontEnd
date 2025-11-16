import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'

/**
 * Admin Form Layout
 *
 * Used for creating or editing admin users
 *
 * Usage:
 * const { openModal } = useGlobalState()
 *
 * openModal({
 *   layout: 'adminForm',
 *   title: 'הוספת מנהל חדש',
 *   data: {
 *     admin: null, // or existing admin object for edit mode
 *     onSave: async (adminData) => {
 *       // Handle save logic
 *       console.log('Saving admin:', adminData)
 *     }
 *   },
 *   confirmText: 'שמור',
 *   cancelText: 'ביטול'
 * })
 */
export const AdminFormLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const isEditMode = !!data?.admin

  const [formData, setFormData] = useState({
    first_name: data?.admin?.first_name || '',
    last_name: data?.admin?.last_name || '',
    email: data?.admin?.email || '',
    phone: data?.admin?.phone || '',
    user_type: data?.admin?.user_type || 'viewer',
    password: '',
    password_confirm: ''
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
    if (!formData.first_name.trim()) {
      toast.error('נא למלא שם פרטי')
      return
    }
    if (!formData.last_name.trim()) {
      toast.error('נא למלא שם משפחה')
      return
    }
    if (!formData.email.trim()) {
      toast.error('נא למלא כתובת אימייל')
      return
    }
    if (!isEditMode && !formData.password) {
      toast.error('נא למלא סיסמה')
      return
    }
    if (!isEditMode && formData.password !== formData.password_confirm) {
      toast.error('הסיסמאות אינן תואמות')
      return
    }

    try {
      setIsSubmitting(true)

      // Call the callback with the data
      if (data?.onSave) {
        await data.onSave(formData)
      }

      toast.success(isEditMode ? 'המנהל עודכן בהצלחה' : 'המנהל נוסף בהצלחה')
      closeModal()
    } catch (error) {
      console.error('Error saving admin:', error)
      toast.error('שגיאה בשמירת המנהל')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="space-y-4">
        {/* Name fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם פרטי <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="הכנס שם פרטי..."
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם משפחה <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="הכנס שם משפחה..."
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Contact fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              אימייל <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="example@email.com"
              disabled={isSubmitting || isEditMode}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              טלפון
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="050-1234567"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Role selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תפקיד <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.user_type}
            onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            disabled={isSubmitting}
          >
            <option value="viewer">צופה</option>
            <option value="manager">מנהל</option>
            <option value="superadmin">מנהל על</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {formData.user_type === 'viewer' && 'צופה - גישה לצפייה בלבד'}
            {formData.user_type === 'manager' && 'מנהל - ניהול אפליקציות, תוכניות וקהילות'}
            {formData.user_type === 'superadmin' && 'מנהל על - גישה מלאה לכל המערכת'}
          </p>
        </div>

        {/* Password fields (only for new admin) */}
        {!isEditMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="הכנס סיסמה..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אימות סיסמה <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password_confirm}
                onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="הכנס סיסמה שנית..."
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

AdminFormLayout.displayName = 'AdminFormLayout'
