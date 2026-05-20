import { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'
import apiClient from '../../../utils/api'

const CATEGORIES = [
  'מוסדות (בתי ספר/ישיבות)',
  'קהילות',
  'ארגוני קירוב ונוער',
  'קבוצות הורים',
  'אנשים פרטיים',
  'שיתופי פעולה (יבואנים/חנויות)',
  'שיתופי פעולה ארגוני אינטרנט',
  'אחר',
]

export const ContactFormLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const isEdit = !!data?.contact

  const [form, setForm] = useState({
    name:     data?.contact?.name     || '',
    phone:    data?.contact?.phone    || '',
    email:    data?.contact?.email    || '',
    notes:    data?.contact?.notes    || '',
    category: data?.contact?.category || '',
  })
  const [saving, setSaving] = useState(false)

  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit,
  }))

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('שם הוא שדה חובה')
      return
    }

    try {
      setSaving(true)
      let result
      if (isEdit) {
        result = await apiClient.updateContact(data.contact.id, form)
      } else {
        result = await apiClient.createContact(form)
      }

      if (!result.success) throw new Error(result.message)

      toast.success(isEdit ? 'איש קשר עודכן' : 'איש קשר נוסף')
      data?.onSave?.(result.data)
      closeModal()
    } catch {
      toast.error('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-4" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שם <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            disabled={saving}
            placeholder="שם מלא..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            disabled={saving}
            placeholder="050-0000000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
        <input
          type="email"
          value={form.email}
          onChange={set('email')}
          disabled={saving}
          placeholder="email@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
        <select
          value={form.category}
          onChange={set('category')}
          disabled={saving}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="">ללא קטגוריה</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          disabled={saving}
          rows={3}
          placeholder="הערות נוספות..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        />
      </div>
    </div>
  )
})

ContactFormLayout.displayName = 'ContactFormLayout'
