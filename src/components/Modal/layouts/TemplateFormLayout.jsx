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

export const TemplateFormLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const isEdit = !!data?.template

  const [form, setForm] = useState({
    title:    data?.template?.title    || '',
    body:     data?.template?.body     || '',
    category: data?.template?.category || '',
  })
  const [saving, setSaving] = useState(false)

  useImperativeHandle(ref, () => ({
    submitForm: handleSubmit,
  }))

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('כותרת היא שדה חובה')
      return
    }
    if (!form.body.trim()) {
      toast.error('תוכן ההודעה הוא שדה חובה')
      return
    }

    try {
      setSaving(true)
      let result
      if (isEdit) {
        result = await apiClient.updateTemplate(data.template.id, form)
      } else {
        result = await apiClient.createTemplate(form)
      }

      if (!result.success) throw new Error(result.message)

      toast.success(isEdit ? 'תבנית עודכנה' : 'תבנית נוספה')
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
            כותרת <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={set('title')}
            disabled={saving}
            placeholder="שם התבנית..."
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
            <option value="">ברירת מחדל (לכל הקטגוריות)</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          תוכן ההודעה <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.body}
          onChange={set('body')}
          disabled={saving}
          rows={8}
          placeholder={`תוכן ההודעה שתשלח...\nניתן להשתמש ב-{full_name} להכנסת שם איש הקשר`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400">
            השתמש ב-<code className="bg-gray-100 px-1 rounded">{'{full_name}'}</code> לשם איש הקשר
          </p>
          <p className="text-xs text-gray-400">{form.body.length} תווים</p>
        </div>
      </div>
    </div>
  )
})

TemplateFormLayout.displayName = 'TemplateFormLayout'
