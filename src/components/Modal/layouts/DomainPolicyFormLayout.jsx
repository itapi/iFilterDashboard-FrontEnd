import { forwardRef, useImperativeHandle, useState } from 'react'
import { toast } from 'react-toastify'
import { useGlobalState } from '../../../contexts/GlobalStateContext'

const MODES = [
  { value: 'AI_FILTERED',  label: 'סינון AI',      color: 'text-blue-600',  desc: 'תוכן מסונן על ידי בינה מלאכותית' },
  { value: 'TEXT_ONLY',    label: 'טקסט בלבד',     color: 'text-green-600', desc: 'רק טקסט – ללא תמונות או מדיה' },
  { value: 'FULL_OPEN',    label: 'פתוח לחלוטין',  color: 'text-gray-600',  desc: 'ללא סינון – גישה מלאה' },
  { value: 'BLOCKED',      label: 'חסום',           color: 'text-red-600',   desc: 'גישה חסומה לחלוטין' },
]

/**
 * DomainPolicyFormLayout
 *
 * openModal({
 *   layout: 'domainPolicyForm',
 *   title: 'הוספת דומיין',
 *   size: 'md',
 *   data: {
 *     policy: null, // or existing policy object for edit mode
 *     onSave: async (formData) => { ... }
 *   },
 *   confirmText: 'שמור',
 *   cancelText: 'ביטול'
 * })
 */
export const DomainPolicyFormLayout = forwardRef(({ data }, ref) => {
  const { closeModal } = useGlobalState()
  const isEditMode = !!data?.policy && !data?.policy?._isNew

  const [formData, setFormData] = useState({
    domain:             data?.policy?.domain             ?? '',
    mode:               data?.policy?.mode               ?? 'AI_FILTERED',
    description:        data?.policy?.description        ?? '',
    is_active:          data?.policy?.is_active          ?? 1,
    include_subdomains: data?.policy?.include_subdomains ?? 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useImperativeHandle(ref, () => ({
    submitForm: async () => { await handleSubmit() }
  }))

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!formData.domain.trim()) {
      toast.error('נא להזין שם דומיין')
      return
    }

    try {
      setIsSubmitting(true)
      if (data?.onSave) await data.onSave(formData)
      toast.success(isEditMode ? 'הדומיין עודכן בהצלחה' : 'הדומיין נוסף בהצלחה')
      closeModal()
    } catch (err) {
      toast.error('שגיאה בשמירת הדומיין')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-5" dir="rtl">

      {/* Domain */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          דומיין <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.domain}
          onChange={e => set('domain', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          placeholder="לדוגמה: example.com"
          disabled={isSubmitting}
          dir="ltr"
        />
      </div>

      {/* Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          מצב סינון <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => set('mode', m.value)}
              disabled={isSubmitting}
              className={`text-right px-3 py-2.5 rounded-lg border-2 transition-all ${
                formData.mode === m.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`text-sm font-medium ${m.color}`}>{m.label}</span>
              <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          תיאור <span className="text-gray-400 font-normal">— אופציונלי</span>
        </label>
        <textarea
          value={formData.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
          placeholder="הערות או תיאור הכלל..."
          disabled={isSubmitting}
        />
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => !isSubmitting && set('is_active', formData.is_active ? 0 : 1)}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              formData.is_active ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
              formData.is_active ? 'right-0.5' : 'left-0.5'
            }`} />
          </div>
          <span className="text-sm text-gray-700">פעיל</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => !isSubmitting && set('include_subdomains', formData.include_subdomains ? 0 : 1)}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              formData.include_subdomains ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
              formData.include_subdomains ? 'right-0.5' : 'left-0.5'
            }`} />
          </div>
          <span className="text-sm text-gray-700">כולל תת-דומיינים</span>
        </label>
      </div>

    </div>
  )
})

DomainPolicyFormLayout.displayName = 'DomainPolicyFormLayout'
